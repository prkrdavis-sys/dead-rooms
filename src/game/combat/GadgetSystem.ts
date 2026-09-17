import Phaser from 'phaser'
import { HERO_BY_ID, UNIVERSAL_PING, type GadgetId } from '../../data/heroes'
import type { Actor } from '../actors/Actor'
import { TILE } from '../../data/maps'
import type { RoomGrid } from '../world/grid'
import type { LightGrid } from '../world/LightGrid'
import type { EchoPing } from '../world/EchoPing'
import { hasLineOfSight } from '../vision/raycast'

export type GadgetHooks = {
  actors: () => Actor[]
  onNoise: (x: number, y: number, radius: number, team: number) => void
  decorate: (obj: Phaser.GameObjects.GameObject) => void
  addFx: (obj: Phaser.GameObjects.GameObject) => void
  sfx: (key: string, volume: number) => void
  toast: (text: string) => void
}

const FLASH_RADIUS = 240
const BULWARK_MS = 9000
const FOCUS_MS = 4200
const LIGHTSOUT_MS = 3600
const BEACON_MS = 9000

/** Hero gadgets plus the universal echo ping, usable by the player and by bots. */
export class GadgetSystem {
  private readonly scene: Phaser.Scene
  private readonly grid: RoomGrid
  private readonly lights: LightGrid
  private readonly ping: EchoPing
  private readonly hooks: GadgetHooks
  readonly walls: Phaser.Physics.Arcade.StaticGroup

  constructor(
    scene: Phaser.Scene,
    grid: RoomGrid,
    lights: LightGrid,
    ping: EchoPing,
    hooks: GadgetHooks,
  ) {
    this.scene = scene
    this.grid = grid
    this.lights = lights
    this.ping = ping
    this.hooks = hooks
    this.walls = scene.physics.add.staticGroup()
  }

  usePing(actor: Actor, now: number): boolean {
    if (!actor.alive || now < actor.pingReadyAt) return false
    actor.pingReadyAt = now + UNIVERSAL_PING.cooldownMs
    this.ping.fireUniversal(actor, this.hooks.actors())
    this.hooks.sfx('ping', 0.4)
    this.hooks.onNoise(actor.sprite.x, actor.sprite.y, UNIVERSAL_PING.selfRevealRange, actor.team)
    return true
  }

  use(actor: Actor, now: number): boolean {
    if (!actor.alive || !actor.heroId || now < actor.gadgetReadyAt) return false
    const hero = HERO_BY_ID[actor.heroId]
    actor.gadgetReadyAt = now + hero.gadget.cooldownMs
    const gadget: GadgetId = hero.gadget.id
    switch (gadget) {
      case 'echo':
        this.ping.fire(actor, this.hooks.actors(), 640, 1500, actor.isPlayer)
        this.hooks.sfx('ping', 0.5)
        this.hooks.onNoise(actor.sprite.x, actor.sprite.y, 760, actor.team)
        if (actor.isPlayer) this.hooks.toast('Deep echo — they heard that too')
        break
      case 'focus':
        actor.coneMul = 2
        actor.speedMul = 0.7
        actor.gadgetActiveUntil = now + FOCUS_MS
        this.hooks.sfx('zap2', 0.3)
        if (actor.isPlayer) this.hooks.toast('Focus — the lane is yours')
        break
      case 'bulwark':
        this.dropBulwark(actor, now)
        break
      case 'flashbang':
        this.flashbang(actor, now)
        break
      case 'beacon':
        this.lights.addBeacon(actor.sprite.x, actor.sprite.y, now, BEACON_MS)
        this.hooks.sfx('pickup', 0.35)
        this.hooks.onNoise(actor.sprite.x, actor.sprite.y, 300, actor.team)
        if (actor.isPlayer) this.hooks.toast('Beacon planted — patching the squad')
        break
      case 'lightsout': {
        const killed = this.lights.killLightsNear(actor.sprite.x, actor.sprite.y, 280)
        actor.coneMul = 0.12
        actor.speedMul = 1.15
        actor.gadgetActiveUntil = now + LIGHTSOUT_MS
        this.hooks.sfx('lowdown', 0.4)
        if (actor.isPlayer) this.hooks.toast(killed > 0 ? `Lights out — ${killed} down` : 'Lights out — nothing to break')
        break
      }
      default: {
        const _never: never = gadget
        void _never
      }
    }
    return true
  }

  /** Clears timed gadget buffs once they lapse. */
  tick(actors: Actor[], now: number): void {
    for (const actor of actors) {
      if (actor.gadgetActiveUntil === 0 || now < actor.gadgetActiveUntil) continue
      actor.gadgetActiveUntil = 0
      actor.coneMul = 1
      actor.speedMul = 1
    }
  }

  private dropBulwark(actor: Actor, now: number): void {
    const ahead = {
      x: actor.sprite.x + actor.facing.x * TILE,
      y: actor.sprite.y + actor.facing.y * TILE,
    }
    const c = Math.floor(ahead.x / TILE)
    const r = Math.floor(ahead.y / TILE)
    if (this.grid.blocked[r]?.[c] !== false) {
      this.hooks.sfx('empty', 0.3)
      actor.gadgetReadyAt = now + 900
      return
    }
    this.grid.blocked[r][c] = true
    const panel = this.walls.create(
      c * TILE + TILE / 2,
      r * TILE + TILE / 2,
      'shield-wall',
    ) as Phaser.Physics.Arcade.Sprite
    panel.setDepth(8)
    panel.setDisplaySize(TILE, TILE)
    panel.setAngle(Math.abs(actor.facing.x) > Math.abs(actor.facing.y) ? 90 : 0)
    panel.refreshBody()
    this.hooks.decorate(panel)
    this.hooks.sfx('drop', 0.4)
    if (actor.isPlayer) this.hooks.toast('Bulwark up — light stops here')
    this.scene.time.delayedCall(BULWARK_MS, () => {
      this.grid.blocked[r][c] = false
      if (panel.active) panel.destroy()
    })
  }

  private flashbang(actor: Actor, now: number): void {
    const x = actor.sprite.x + actor.facing.x * 150
    const y = actor.sprite.y + actor.facing.y * 150
    this.lights.addFlash(x, y, now, 360)
    const pop = this.scene.add.image(x, y, 'blast').setDepth(20).setScale(0.6)
    this.hooks.addFx(pop)
    this.scene.tweens.add({
      targets: pop,
      alpha: 0,
      scale: 3,
      duration: 320,
      onComplete: () => pop.destroy(),
    })
    this.hooks.sfx('zap1', 0.45)
    this.hooks.onNoise(x, y, 520, actor.team)
    for (const other of this.hooks.actors()) {
      if (!other.alive || other.team === actor.team) continue
      const dist = Phaser.Math.Distance.Between(x, y, other.sprite.x, other.sprite.y)
      if (dist > FLASH_RADIUS) continue
      if (!hasLineOfSight(this.grid, x, y, other.sprite.x, other.sprite.y)) continue
      other.blindUntil = now + 2300
      other.coneMul = 0.2
      other.gadgetActiveUntil = Math.max(other.gadgetActiveUntil, now + 2300)
    }
    if (actor.isPlayer) this.hooks.toast('Flashbang out')
  }
}
