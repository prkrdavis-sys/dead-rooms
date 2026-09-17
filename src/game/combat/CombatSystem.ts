import Phaser from 'phaser'
import { HERO_BY_ID, type HeroWeapon } from '../../data/heroes'
import { type Actor } from '../actors/Actor'
import { rimTint } from '../createAnims'
import type { LightGrid } from '../world/LightGrid'
import type { RoomGrid } from '../world/grid'
import { rayDistance } from '../vision/raycast'
import { worldFromLocal } from '../heroView'

export type CombatHooks = {
  /** A shot or blast the squads can hear. */
  onNoise: (x: number, y: number, radius: number, team: number) => void
  onDown: (actor: Actor, killerTeam: number | null) => void
  onDamage: (actor: Actor, amount: number) => void
  /** Clip a physics object to the lit region. */
  decorate: (obj: Phaser.GameObjects.GameObject) => void
  /** Park a short-lived visual effect in the shared, already-clipped FX layer. */
  addFx: (obj: Phaser.GameObjects.GameObject) => void
  sfx: (key: string, volume: number) => void
}

const MUZZLE_OFFSET = { x: 34, y: 8 }

export class CombatSystem {
  readonly bullets: Phaser.Physics.Arcade.Group
  /** Set by the scene so rail shots can sweep live actors without an import cycle. */
  railTargets: () => Actor[] = () => []
  private readonly scene: Phaser.Scene
  private readonly grid: RoomGrid
  private readonly lights: LightGrid
  private readonly hooks: CombatHooks
  private readonly beams: Phaser.GameObjects.Graphics
  private beamsUntil = 0

  constructor(
    scene: Phaser.Scene,
    grid: RoomGrid,
    lights: LightGrid,
    hooks: CombatHooks,
  ) {
    this.scene = scene
    this.grid = grid
    this.lights = lights
    this.hooks = hooks
    this.bullets = scene.physics.add.group({ maxSize: 180 })
    this.beams = scene.add.graphics().setDepth(16)
    hooks.addFx(this.beams)
  }

  weaponOf(actor: Actor): HeroWeapon | null {
    return actor.heroId ? HERO_BY_ID[actor.heroId].weapon : null
  }

  /** True when the trigger pull produced a shot. */
  fire(actor: Actor, now: number): boolean {
    const weapon = this.weaponOf(actor)
    if (!weapon || !actor.alive) return false
    if (actor.reloadUntil > now) return false
    if (now < actor.cooldownUntil) return false
    if (actor.mag <= 0) {
      this.startReload(actor, now)
      return false
    }

    actor.mag -= 1
    actor.cooldownUntil = now + weapon.cooldownMs
    actor.fireUntil = now + 170
    const angle = Math.atan2(actor.facing.y, actor.facing.x)
    const muzzle = worldFromLocal(
      actor.sprite.x,
      actor.sprite.y,
      angle,
      MUZZLE_OFFSET.x,
      MUZZLE_OFFSET.y,
    )

    switch (weapon.kind) {
      case 'auto':
      case 'burst':
      case 'silenced':
        this.spawnBullet(actor, weapon, muzzle.x, muzzle.y, angle + (Math.random() - 0.5) * weapon.spread)
        break
      case 'shot':
        for (let i = 0; i < weapon.pellets; i += 1) {
          const t = weapon.pellets === 1 ? 0 : i / (weapon.pellets - 1) - 0.5
          this.spawnBullet(actor, weapon, muzzle.x, muzzle.y, angle + t * weapon.spread)
        }
        break
      case 'rail':
        this.fireRail(actor, weapon, muzzle.x, muzzle.y, angle)
        break
      default: {
        const _never: never = weapon.kind
        void _never
      }
    }

    this.muzzleFx(actor, weapon, muzzle.x, muzzle.y, angle)
    this.hooks.sfx(weapon.sfx, weapon.silenced ? 0.18 : 0.34)
    if (weapon.noise > 0) this.hooks.onNoise(actor.sprite.x, actor.sprite.y, weapon.noise, actor.team)
    if (actor.mag <= 0) this.startReload(actor, now)
    return true
  }

  startReload(actor: Actor, now: number): void {
    const weapon = this.weaponOf(actor)
    if (!weapon || actor.reloadUntil > now || actor.mag >= weapon.mag) return
    actor.reloadUntil = now + weapon.reloadMs
    if (actor.isPlayer) this.hooks.sfx('reload', 0.4)
  }

  /** Armour regen and reload completion for everyone still standing. */
  tick(actors: Actor[], now: number, delta: number): void {
    for (const actor of actors) {
      if (!actor.alive || actor.kind !== 'hero' || !actor.heroId) continue
      const hero = HERO_BY_ID[actor.heroId]
      if (actor.reloadUntil > 0 && now >= actor.reloadUntil) {
        actor.reloadUntil = 0
        actor.mag = hero.weapon.mag
      }
      if (
        actor.armor < actor.maxArmor &&
        now - actor.lastHitAt > hero.armorRegenDelayMs
      ) {
        actor.armor = Math.min(
          actor.maxArmor,
          actor.armor + (hero.armorRegenPerSec * delta) / 1000,
        )
      }
    }
    if (now > this.beamsUntil) this.beams.clear()
  }

  damage(actor: Actor, amount: number, now: number, fromTeam: number | null): void {
    if (!actor.alive || amount <= 0) return
    actor.lastHitAt = now
    let left = amount
    if (actor.armor > 0) {
      const soaked = Math.min(actor.armor, left)
      actor.armor -= soaked
      left -= soaked * 0.6
    }
    actor.hp -= left
    this.hooks.onDamage(actor, amount)
    actor.sprite.setTintFill(0xffffff)
    this.scene.time.delayedCall(40, () => {
      if (actor.alive && actor.sprite.active) {
        actor.sprite.clearTint()
        actor.sprite.setTint(rimTint())
      }
    })
    if (actor.hp <= 0) this.hooks.onDown(actor, fromTeam)
  }

  bulletHit(bulletObj: Phaser.GameObjects.GameObject, actor: Actor, now: number): void {
    const bullet = bulletObj as Phaser.Physics.Arcade.Sprite
    if (!bullet.active || !actor.alive) return
    const team = Number(bullet.getData('team') ?? -1)
    if (team === actor.team) return
    this.damage(actor, Number(bullet.getData('damage') ?? 10), now, team)
    this.disable(bullet)
  }

  bulletVsSolid(bulletObj: Phaser.GameObjects.GameObject): void {
    const bullet = bulletObj as Phaser.Physics.Arcade.Sprite
    if (!bullet.active) return
    this.sparks(bullet.x, bullet.y, bullet.rotation + Math.PI, 2)
    this.disable(bullet)
  }

  explode(x: number, y: number, radius: number, damage: number, fromTeam: number | null, actors: Actor[], now: number): void {
    const blast = this.scene.add.image(x, y, 'blast').setDepth(15)
    this.hooks.addFx(blast)
    this.scene.tweens.add({
      targets: blast,
      alpha: 0,
      scale: 1.8,
      duration: 240,
      onComplete: () => blast.destroy(),
    })
    this.lights.addFlash(x, y, now, radius * 1.4)
    this.hooks.sfx('boom1', 0.4)
    this.hooks.onNoise(x, y, radius * 4, fromTeam ?? -1)
    for (const actor of actors) {
      if (!actor.alive) continue
      const dist = Phaser.Math.Distance.Between(x, y, actor.sprite.x, actor.sprite.y)
      if (dist > radius) continue
      const falloff = 1 - dist / radius
      this.damage(actor, Math.round(damage * (0.5 + 0.5 * falloff)), now, fromTeam)
    }
  }

  /** Generic shot for anything that is not a hero weapon, such as creature spit. */
  spawnProjectile(
    team: number,
    x: number,
    y: number,
    angle: number,
    speed: number,
    damage: number,
    key: string,
  ): void {
    const shot = this.bullets.get(x, y, key) as Phaser.Physics.Arcade.Sprite | null
    if (!shot) return
    shot.setActive(true).setVisible(true)
    shot.enableBody(true, x, y, true, true)
    shot.setRotation(angle)
    shot.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
    shot.setDepth(14)
    shot.setSize(8, 8)
    shot.setData('damage', damage)
    shot.setData('team', team)
    shot.setData('born', this.scene.time.now)
    this.hooks.decorate(shot)
  }

  prune(now: number): void {
    this.bullets.children.iterate((child) => {
      if (!child) return true
      const bullet = child as Phaser.Physics.Arcade.Sprite
      if (!bullet.active) return true
      const born = Number(bullet.getData('born') ?? now)
      if (now - born > 1600) this.disable(bullet)
      return true
    })
  }

  private spawnBullet(
    actor: Actor,
    weapon: HeroWeapon,
    x: number,
    y: number,
    angle: number,
  ): void {
    const bullet = this.bullets.get(x, y, weapon.bulletKey) as Phaser.Physics.Arcade.Sprite | null
    if (!bullet) return
    bullet.setActive(true).setVisible(true)
    bullet.enableBody(true, x, y, true, true)
    bullet.setRotation(angle)
    bullet.setVelocity(Math.cos(angle) * weapon.speed, Math.sin(angle) * weapon.speed)
    bullet.setDepth(14)
    bullet.setSize(6, 6)
    bullet.setData('damage', weapon.damage)
    bullet.setData('team', actor.team)
    bullet.setData('born', this.scene.time.now)
    this.hooks.decorate(bullet)
  }

  private fireRail(actor: Actor, weapon: HeroWeapon, x: number, y: number, angle: number): void {
    const dirX = Math.cos(angle)
    const dirY = Math.sin(angle)
    const range = 900
    const reach = rayDistance(this.grid, x, y, dirX, dirY, range)
    const endX = x + dirX * reach
    const endY = y + dirY * reach
    this.beams.lineStyle(2, 0x67e8f9, 0.9)
    this.beams.lineBetween(x, y, endX, endY)
    this.beamsUntil = this.scene.time.now + 90
    const line = new Phaser.Geom.Line(x, y, endX, endY)
    const now = this.scene.time.now
    for (const other of this.railTargets()) {
      if (other.team === actor.team || !other.alive) continue
      const circle = new Phaser.Geom.Circle(other.sprite.x, other.sprite.y, 18)
      if (Phaser.Geom.Intersects.LineToCircle(line, circle)) {
        this.damage(other, weapon.damage, now, actor.team)
      }
    }
  }

  private muzzleFx(
    actor: Actor,
    weapon: HeroWeapon,
    x: number,
    y: number,
    angle: number,
  ): void {
    const flash = this.scene.add
      .image(x, y, weapon.flashKey)
      .setDepth(17)
      .setRotation(angle)
      .setOrigin(0.08, 0.5)
      .setScale(weapon.kind === 'shot' ? 1.4 : 1.15)
    this.hooks.addFx(flash)
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: weapon.silenced ? 70 : 150,
      onComplete: () => flash.destroy(),
    })
    this.sparks(x, y, angle, weapon.kind === 'shot' ? 6 : 2)
    if (!weapon.silenced) {
      this.lights.addFlash(x, y, this.scene.time.now, weapon.kind === 'rail' ? 220 : 170)
    }
    void actor
  }

  private sparks(x: number, y: number, angle: number, count: number): void {
    for (let i = 0; i < count; i += 1) {
      const jitter = (Math.random() - 0.5) * 0.7
      const dist = 8 + Math.random() * 18
      const spark = this.scene.add.image(x, y, 'spark').setDepth(16).setScale(0.5 + Math.random() * 0.5)
      this.hooks.addFx(spark)
      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle + jitter) * dist,
        y: y + Math.sin(angle + jitter) * dist,
        alpha: 0,
        duration: 130 + Math.random() * 110,
        onComplete: () => spark.destroy(),
      })
    }
  }

  private disable(bullet: Phaser.Physics.Arcade.Sprite): void {
    bullet.setVelocity(0, 0)
    bullet.disableBody(true, true)
  }
}
