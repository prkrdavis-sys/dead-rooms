import Phaser from 'phaser'
import { ENEMY_BY_ID } from '../../data/enemies'
import { HERO_BY_ID, UNIVERSAL_PING } from '../../data/heroes'
import { MAP_BY_ID, TILE } from '../../data/maps'
import { MODE_BY_ID, type ModeId } from '../../data/modes'
import { bus, type HudState, type SquadSlot } from '../../lib/bus'
import { TEAM_PLAYER, TEAM_SWARM, type Actor } from '../actors/Actor'
import { ActorRegistry } from '../actors/ActorRegistry'
import { stepCreature } from '../ai/CreatureBrain'
import { SquadDirector } from '../ai/SquadDirector'
import { CombatSystem } from '../combat/CombatSystem'
import { GadgetSystem } from '../combat/GadgetSystem'
import { applyCharBody } from '../createAnims'
import { heroSheet } from '../heroView'
import { Deathmatch } from '../modes/Deathmatch'
import { Extraction } from '../modes/Extraction'
import { Royale } from '../modes/Royale'
import { Swarm } from '../modes/Swarm'
import type { ModeContext, ModeController, PickupKind } from '../modes/ModeController'
import type { RunConfig } from '../types'
import { VisionSystem } from '../vision/VisionSystem'
import type { ConeSpec } from '../vision/visionPolygon'
import { BlackoutDirector } from '../world/BlackoutDirector'
import { EchoPing } from '../world/EchoPing'
import { LightGrid } from '../world/LightGrid'
import { buildGrid, type RoomGrid } from '../world/grid'
import { zoomForView } from '../viewZoom'

const BLOOD_KEYS = ['blood-1', 'blood-2', 'blood-3'] as const
const SELF_GLOW = 74
/** Fixtures further than this from the player do not bother lighting anything. */
const LIGHT_CULL_RANGE = 620
const PICKUP_TTL_MS = 30000

type Sprite = Phaser.Physics.Arcade.Sprite

/** Arcade collider callbacks hand back a union that includes bodies and tiles. */
function asObject(target: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile): Phaser.GameObjects.GameObject {
  return target as Phaser.GameObjects.GameObject
}

export class PlayScene extends Phaser.Scene {
  private run!: RunConfig
  private grid!: RoomGrid
  private vision!: VisionSystem
  private lightGrid!: LightGrid
  private combat!: CombatSystem
  private gadgets!: GadgetSystem
  private roster!: ActorRegistry
  private director!: SquadDirector
  private mode!: ModeController
  private blackouts!: BlackoutDirector

  private walls!: Phaser.Physics.Arcade.StaticGroup
  private pickups!: Phaser.Physics.Arcade.Group
  private bloodLayer!: Phaser.GameObjects.Group
  private telegraph!: Phaser.GameObjects.Graphics
  private coneGlow!: Phaser.GameObjects.Image
  /** Masked containers so transient art costs one stencil pass instead of one each. */
  private fxLayer!: Phaser.GameObjects.Container
  private groundFx!: Phaser.GameObjects.Container

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keys!: Record<'w' | 'a' | 's' | 'd' | 'space' | 'shift' | 'q' | 'r', Phaser.Input.Keyboard.Key>

  private touchMove = { x: 0, y: 0 }
  private fireHeld = false
  private gadgetHeld = false
  private gadgetWas = false
  private pingHeld = false
  private pingWas = false
  private reloadHeld = false
  private reloadWas = false

  private kills = 0
  private timeSec = 0
  private paused = false
  private dead = false
  private reported = false
  private banner: string | null = null
  private bannerUntil = 0
  private hudAcc = 0
  private nextHurtAt = 0
  private lowSpec = false
  private offs: Array<() => void> = []

  constructor() {
    super('play')
  }

  create(): void {
    this.run = this.game.registry.get('run') as RunConfig
    this.grid = buildGrid(MAP_BY_ID[this.run.mapId])
    this.lowSpec = this.game.scale.width < 800 || this.sys.game.device.input.touch

    const worldW = this.grid.cols * TILE
    const worldH = this.grid.rows * TILE
    this.physics.world.setBounds(0, 0, worldW, worldH)
    this.cameras.main.setBounds(0, 0, worldW, worldH)
    this.cameras.main.setBackgroundColor('#05070a')

    this.vision = new VisionSystem(this, this.grid, this.lowSpec)
    this.buildWalls()
    this.lightGrid = new LightGrid(this, this.grid)
    this.pickups = this.physics.add.group()
    this.bloodLayer = this.add.group()
    this.groundFx = this.add.container(0, 0).setDepth(3)
    this.vision.apply(this.groundFx)
    this.fxLayer = this.add.container(0, 0).setDepth(15)
    this.vision.apply(this.fxLayer)
    this.telegraph = this.add.graphics().setDepth(0)
    this.fxLayer.add(this.telegraph)
    this.coneGlow = this.add
      .image(0, 0, 'glow')
      .setDepth(9)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.3)
      .setScale(9)
    this.vision.applySquadOnly(this.coneGlow)
    for (const fixture of this.lightGrid.fixtures.getChildren()) this.vision.apply(fixture as Sprite)
    for (const panel of this.lightGrid.breakers.getChildren()) this.vision.apply(panel as Sprite)

    this.roster = new ActorRegistry(this, (sprite) => this.vision.apply(sprite))
    this.combat = new CombatSystem(this, this.grid, this.lightGrid, {
      onNoise: (x, y, radius, team) => this.director.reportNoise(x, y, radius, team, this.time.now),
      onDown: (actor, killerTeam) => this.handleDown(actor, killerTeam),
      onDamage: (actor) => {
        if (actor.isPlayer) this.flashHurt()
      },
      decorate: (obj) => this.vision.apply(obj as Sprite),
      addFx: (obj) => this.fxLayer.add(obj),
      sfx: (key, volume) => this.playSfx(key, volume),
    })
    this.combat.railTargets = () => this.roster.living()

    const ping = new EchoPing(this)
    this.gadgets = new GadgetSystem(this, this.grid, this.lightGrid, ping, {
      actors: () => this.roster.living(),
      onNoise: (x, y, radius, team) => this.director.reportNoise(x, y, radius, team, this.time.now),
      decorate: (obj) => this.vision.apply(obj as Sprite),
      addFx: (obj) => this.fxLayer.add(obj),
      sfx: (key, volume) => this.playSfx(key, volume),
      toast: (text) => bus.emit('toast', text),
    })
    this.director = new SquadDirector(this.grid, this.roster)
    this.blackouts = new BlackoutDirector(this.time.now)

    this.mode = this.makeMode(this.run.modeId)
    this.mode.start()

    const player = this.roster.player()
    if (player) {
      this.cameras.main.startFollow(player.sprite, true, 0.12, 0.12)
    }
    this.syncCameraToView()
    this.scale.on('resize', this.syncCameraToView, this)

    this.bindInput()
    this.bindPhysics()
    this.bindBus()
    this.updateVision()

    if (import.meta.env.DEV) {
      const dev = window as Window & { __killPlayer?: () => void; __hurtPlayer?: (amount?: number) => void }
      dev.__killPlayer = () => {
        const target = this.roster.player()
        if (target) this.combat.damage(target, 9999, this.time.now, null)
      }
      dev.__hurtPlayer = (amount = 20) => {
        const target = this.roster.player()
        if (target) this.combat.damage(target, amount, this.time.now, null)
      }
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.syncCameraToView, this)
      this.vision.destroy()
      for (const off of this.offs) off()
      this.offs = []
      if (import.meta.env.DEV) {
        const dev = window as Window & { __killPlayer?: () => void; __hurtPlayer?: (amount?: number) => void }
        dev.__killPlayer = undefined
        dev.__hurtPlayer = undefined
      }
    })
  }

  update(_time: number, delta: number): void {
    const now = this.time.now
    if (this.paused) return
    this.telegraph.clear()
    if (this.banner && now > this.bannerUntil) this.banner = null

    const player = this.roster.player()
    if (!this.dead && player?.alive) {
      this.timeSec += delta / 1000
      this.handlePlayer(player, now, delta)
    }

    this.blackouts.update(
      now,
      (text) => bus.emit('toast', text),
      () => {
        bus.emit('toast', 'Blackout')
        this.playSfx('lowdown', 0.45)
        this.cameras.main.flash(180, 0, 0, 0)
      },
      () => bus.emit('toast', 'Power back'),
    )

    const litLamps = this.lightGrid.litLampPoints(now, this.blackouts.active)
    this.director.update(
      {
        combat: this.combat,
        gadgets: this.gadgets,
        now,
        safeZone: this.mode.safeZone(),
        skill: this.skill(),
      },
      litLamps,
      delta,
    )
    this.stepCreatures(now)

    this.combat.tick(this.roster.all(), now, delta)
    this.combat.prune(now)
    this.gadgets.tick(this.roster.all(), now)
    this.lightGrid.prune(now)
    this.healNearBeacons(now, delta)
    this.mode.update(delta, now)
    this.syncHeroAnims(now)
    this.updateVision()

    this.hudAcc += delta
    if (this.hudAcc > 80) {
      this.hudAcc = 0
      this.emitHud()
    }

    const outcome = this.mode.outcome()
    if (outcome && !this.dead && !this.reported) this.finish(outcome.won, outcome.reason)
  }

  private makeMode(modeId: ModeId): ModeController {
    const ctx: ModeContext = {
      scene: this,
      grid: this.grid,
      registry: this.roster,
      combat: this.combat,
      lights: this.lightGrid,
      run: this.run,
      skill: this.skill(),
      toast: (text) => bus.emit('toast', text),
      banner: (text, ms) => this.showBanner(text, ms),
      sfx: (key, volume) => this.playSfx(key, volume),
      decorate: (obj) => this.vision.apply(obj as Sprite),
      spawnPickup: (kind, x, y) => this.spawnPickup(kind, x, y),
    }
    switch (modeId) {
      case 'deathmatch':
        return new Deathmatch(ctx)
      case 'royale':
        return new Royale(ctx)
      case 'extraction':
        return new Extraction(ctx)
      case 'swarm':
        return new Swarm(ctx)
      default: {
        const _never: never = modeId
        return _never
      }
    }
  }

  private skill(): number {
    return Phaser.Math.Clamp(0.1 + this.run.difficulty * 0.055, 0.12, 0.72)
  }

  private buildWalls(): void {
    this.walls = this.physics.add.staticGroup()
    for (let r = 0; r < this.grid.rows; r += 1) {
      for (let c = 0; c < this.grid.cols; c += 1) {
        if (!this.grid.blocked[r]?.[c]) continue
        const body = this.walls.create(c * TILE + TILE / 2, r * TILE + TILE / 2, 'wall') as Sprite
        body.setVisible(false)
        body.refreshBody()
      }
    }
  }

  private bindInput(): void {
    const kb = this.input.keyboard
    if (!kb) return
    this.cursors = kb.createCursorKeys()
    this.keys = {
      w: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      space: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      shift: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      q: kb.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      r: kb.addKey(Phaser.Input.Keyboard.KeyCodes.R),
    }
    kb.on('keydown', (event: KeyboardEvent) => {
      if (event.code === 'KeyP' || event.code === 'Escape') this.togglePause()
    })
  }

  private bindBus(): void {
    this.offs.push(
      bus.on('move', (vector) => {
        this.touchMove = vector
      }),
      bus.on('fire', (down) => {
        this.fireHeld = down
      }),
      bus.on('gadget', (down) => {
        this.gadgetHeld = down
      }),
      bus.on('ping', (down) => {
        this.pingHeld = down
      }),
      bus.on('reload', (down) => {
        this.reloadHeld = down
      }),
      bus.on('pauseToggle', () => this.togglePause()),
      bus.on('gore', (gore) => {
        this.run.gore = gore
      }),
      bus.on('volumes', (volumes) => {
        this.run.music = volumes.music
        this.run.sfx = volumes.sfx
      }),
    )
  }

  private bindPhysics(): void {
    this.physics.add.collider(this.roster.group, this.walls)
    this.physics.add.collider(this.roster.group, this.gadgets.walls)
    this.physics.add.collider(this.roster.group, this.roster.group)
    this.physics.add.overlap(this.combat.bullets, this.roster.group, (bullet, target) => {
      const actor = this.roster.fromSprite(asObject(target))
      if (actor) this.combat.bulletHit(asObject(bullet), actor, this.time.now)
    })
    this.physics.add.overlap(this.combat.bullets, this.walls, (bullet) => {
      this.combat.bulletVsSolid(asObject(bullet))
    })
    this.physics.add.overlap(this.combat.bullets, this.gadgets.walls, (bullet) => {
      this.combat.bulletVsSolid(asObject(bullet))
    })
    this.physics.add.overlap(this.combat.bullets, this.lightGrid.fixtures, (bullet, fixture) => {
      if (this.lightGrid.breakFixture(asObject(fixture))) this.playSfx('glass', 0.4)
      this.combat.bulletVsSolid(asObject(bullet))
    })
    this.physics.add.overlap(this.combat.bullets, this.lightGrid.breakers, (bullet, panel) => {
      this.toggleBreaker(asObject(panel))
      this.combat.bulletVsSolid(asObject(bullet))
    })
    this.physics.add.overlap(this.roster.group, this.pickups, (actorSprite, item) => {
      const actor = this.roster.fromSprite(asObject(actorSprite))
      if (actor?.isPlayer) this.takePickup(actor, asObject(item) as Sprite)
    })
    this.physics.add.overlap(this.roster.group, this.lightGrid.breakers, (actorSprite, panel) => {
      const actor = this.roster.fromSprite(asObject(actorSprite))
      if (actor?.isPlayer) this.toggleBreaker(asObject(panel))
    })
  }

  private handlePlayer(player: Actor, now: number, delta: number): void {
    const hero = HERO_BY_ID[player.heroId ?? 'grit']
    let dx = this.touchMove.x
    let dy = this.touchMove.y
    if (this.cursors) {
      if (this.cursors.left.isDown || this.keys.a.isDown) dx -= 1
      if (this.cursors.right.isDown || this.keys.d.isDown) dx += 1
      if (this.cursors.up.isDown || this.keys.w.isDown) dy -= 1
      if (this.cursors.down.isDown || this.keys.s.isDown) dy += 1
    }
    const len = Math.hypot(dx, dy)
    player.moving = len > 0.08
    if (player.moving) {
      dx /= len
      dy /= len
      player.facing.x = dx
      player.facing.y = dy
    } else {
      dx = 0
      dy = 0
    }
    const speed = hero.speed * player.speedMul
    player.sprite.setVelocity(dx * speed, dy * speed)
    player.sprite.setRotation(Math.atan2(player.facing.y, player.facing.x))

    if (this.fireHeld || this.keys.space.isDown) this.combat.fire(player, now)

    const reloadDown = this.reloadHeld || this.keys.r.isDown
    if (reloadDown && !this.reloadWas) this.combat.startReload(player, now)
    this.reloadWas = reloadDown

    const gadgetDown = this.gadgetHeld || this.keys.shift.isDown
    if (gadgetDown && !this.gadgetWas && !this.gadgets.use(player, now)) {
      this.playSfx('empty', 0.2)
    }
    this.gadgetWas = gadgetDown

    const pingDown = this.pingHeld || this.keys.q.isDown
    if (pingDown && !this.pingWas && !this.gadgets.usePing(player, now)) {
      this.playSfx('empty', 0.2)
    }
    this.pingWas = pingDown

    void delta
  }

  private stepCreatures(now: number): void {
    const player = this.roster.player()
    for (const actor of this.roster.living()) {
      if (actor.kind !== 'creature') continue
      stepCreature(actor, player, {
        grid: this.grid,
        now,
        telegraph: this.telegraph,
        shoot: (x, y, dirX, dirY, damage) => {
          this.combat.spawnProjectile(TEAM_SWARM, x + dirX * 20, y + dirY * 20, Math.atan2(dirY, dirX), 280, damage, 'fireball')
        },
      })
      if (!player?.alive) continue
      const dist = Phaser.Math.Distance.Between(
        actor.sprite.x,
        actor.sprite.y,
        player.sprite.x,
        player.sprite.y,
      )
      if (dist > 26 || now < this.nextHurtAt) continue
      const def = ENEMY_BY_ID[actor.enemyId ?? 'shambler']
      this.nextHurtAt = now + 380
      if (def.attack === 'explode') {
        this.combat.explode(
          actor.sprite.x,
          actor.sprite.y,
          def.explodeRadius ?? 90,
          def.damage,
          TEAM_SWARM,
          this.roster.living(),
          now,
        )
        this.handleDown(actor, null)
      } else {
        this.combat.damage(player, def.damage, now, TEAM_SWARM)
      }
    }
  }

  private healNearBeacons(now: number, delta: number): void {
    const beacons = this.lightGrid.beacons(now)
    if (beacons.length === 0) return
    for (const actor of this.roster.livingOnTeam(TEAM_PLAYER)) {
      const close = beacons.some(
        (beacon) => Phaser.Math.Distance.Between(beacon.x, beacon.y, actor.sprite.x, actor.sprite.y) < 150,
      )
      if (!close) continue
      actor.hp = Math.min(actor.maxHp, actor.hp + (10 * delta) / 1000)
    }
  }

  private syncHeroAnims(now: number): void {
    for (const actor of this.roster.living()) {
      if (actor.kind !== 'hero' || !actor.heroId) continue
      const sheet = heroSheet(actor.heroId)
      if (actor.sprite.texture.key !== sheet) {
        actor.sprite.setTexture(sheet, 0)
        applyCharBody(actor.sprite, 12)
      }
      if (!actor.isPlayer) {
        actor.sprite.setRotation(Math.atan2(actor.facing.y, actor.facing.x))
      }
      const firing = now < actor.fireUntil
      const key = firing ? `${sheet}-fire` : actor.moving ? `${sheet}-walk` : `${sheet}-idle`
      if (actor.sprite.anims.currentAnim?.key !== key) actor.sprite.play(key, firing)
      actor.sprite.setAlpha(actor.reloadUntil > now ? 0.72 : 1)
    }
  }

  private updateVision(): void {
    const now = this.time.now
    const cones: ConeSpec[] = []
    const blackout = this.blackouts.active
    const player = this.roster.player()

    if (player?.alive) {
      const hero = HERO_BY_ID[player.heroId ?? 'grit']
      const reach = blackout ? SELF_GLOW : hero.cone.range * player.coneMul * 0.45
      this.coneGlow.setVisible(true)
      this.coneGlow.setPosition(
        player.sprite.x + player.facing.x * reach * 0.5,
        player.sprite.y + player.facing.y * reach * 0.5,
      )
      this.coneGlow.setScale(Math.max(2, reach / 22))
    } else {
      this.coneGlow.setVisible(false)
    }

    if (player?.alive) {
      cones.push({
        x: player.sprite.x,
        y: player.sprite.y,
        angle: Math.atan2(player.facing.y, player.facing.x),
        spread: Math.PI * 2,
        range: SELF_GLOW,
        remember: true,
      })
      if (!blackout) {
        const hero = HERO_BY_ID[player.heroId ?? 'grit']
        cones.push({
          x: player.sprite.x,
          y: player.sprite.y,
          angle: Math.atan2(player.facing.y, player.facing.x),
          spread: Phaser.Math.DegToRad(hero.cone.spreadDeg),
          range: hero.cone.range * player.coneMul,
          remember: true,
        })
      }
    }

    if (!blackout) {
      for (const mate of this.roster.livingOnTeam(TEAM_PLAYER)) {
        if (mate.isPlayer || !mate.heroId) continue
        const hero = HERO_BY_ID[mate.heroId]
        cones.push({
          x: mate.sprite.x,
          y: mate.sprite.y,
          angle: Math.atan2(mate.facing.y, mate.facing.x),
          spread: Phaser.Math.DegToRad(hero.cone.spreadDeg),
          range: hero.cone.range * mate.coneMul * 0.9,
          remember: true,
        })
      }
    }

    const view = this.cameras.main.worldView
    for (const cone of this.lightGrid.activeCones(now, blackout)) {
      const margin = cone.range + TILE
      const offscreen =
        cone.x < view.x - margin ||
        cone.x > view.right + margin ||
        cone.y < view.y - margin ||
        cone.y > view.bottom + margin
      if (offscreen) continue
      if (
        player?.alive &&
        Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, cone.x, cone.y) >
          LIGHT_CULL_RANGE + cone.range
      ) {
        continue
      }
      cones.push(cone)
    }

    this.vision.update(cones)
  }

  private toggleBreaker(panel: Phaser.GameObjects.GameObject): void {
    const now = this.time.now
    if (now < Number(panel.getData('nextToggleAt') ?? 0)) return
    panel.setData('nextToggleAt', now + 2600)
    const on = this.lightGrid.toggleBreaker(panel)
    this.playSfx('switch', 0.4)
    bus.emit('toast', on ? 'Breaker on — lights up' : 'Breaker off — that wing is dark')
  }

  private spawnPickup(kind: PickupKind, x: number, y: number): void {
    const texture = kind === 'ammo' ? 'ammo-box' : kind === 'armor' ? 'armor-pack' : 'health-pack'
    const item = this.pickups.create(x, y, texture) as Sprite
    item.setDepth(7)
    item.setData('kind', kind)
    this.vision.apply(item)
    if (this.run.modeId === 'swarm') {
      this.time.delayedCall(PICKUP_TTL_MS, () => {
        if (item.active) item.destroy()
      })
    }
  }

  private takePickup(player: Actor, item: Sprite): void {
    const kind = item.getData('kind') as PickupKind
    const hero = HERO_BY_ID[player.heroId ?? 'grit']
    switch (kind) {
      case 'ammo':
        player.mag = hero.weapon.mag
        player.reloadUntil = 0
        break
      case 'health':
        player.hp = Math.min(player.maxHp, player.hp + 34)
        break
      case 'armor':
        player.armor = Math.min(player.maxArmor, player.armor + player.maxArmor * 0.5)
        break
      default: {
        const _never: never = kind
        void _never
      }
    }
    this.playSfx('pickup', 0.4)
    item.destroy()
  }

  private handleDown(actor: Actor, killerTeam: number | null): void {
    if (!actor.alive) return
    const now = this.time.now
    if (killerTeam === TEAM_PLAYER && !actor.isPlayer) this.kills += 1
    this.splatter(actor.sprite.x, actor.sprite.y)
    if (actor.kind === 'hero') {
      this.lightGrid.addCorpseLight(
        actor.sprite.x,
        actor.sprite.y,
        Math.atan2(actor.facing.y, actor.facing.x),
        now,
        22000,
      )
    }
    const wasPlayer = actor.isPlayer
    this.mode.onActorDown(actor, killerTeam)
    this.roster.retire(actor)
    if (wasPlayer) this.die()
  }

  private die(): void {
    if (this.dead) return
    this.dead = true
    this.banner = null
    this.cameras.main.stopFollow()
    bus.emit('dying', true)
    this.cameras.main.shake(200, 0.005)
    this.playSfx('death-hit', 0.5)
    this.emitHud()
    this.time.delayedCall(900, () => this.finish(false, 'You went dark'))
  }

  private finish(won: boolean, reason: string): void {
    if (this.reported) return
    this.reported = true
    const timeSec = Math.floor(this.timeSec)
    const hud = this.mode.hud()
    bus.emit('gameover', {
      modeId: this.mode.id,
      won,
      reason,
      kills: this.kills,
      timeSec,
      wave: hud.wave,
      score: this.mode.scoreFor(this.kills, timeSec) + (won ? 800 : 0),
    })
  }

  private splatter(x: number, y: number): void {
    const gore = this.run.gore / 100
    if (gore <= 0.02) return
    const scale = this.lowSpec ? 0.6 : 1
    const stamps = Math.max(1, Math.round((1 + gore * 4) * scale))
    const maxBlood = Math.round(30 + gore * 50 * scale)
    for (let i = 0; i < stamps; i += 1) {
      if (this.bloodLayer.getLength() >= maxBlood) {
        const oldest = this.bloodLayer.getFirst(true) as Phaser.GameObjects.Image | null
        oldest?.destroy()
      }
      const stamp = this.add
        .image(
          x + Phaser.Math.Between(-16, 16),
          y + Phaser.Math.Between(-16, 16),
          Phaser.Utils.Array.GetRandom([...BLOOD_KEYS]),
        )
        .setDepth(3)
        .setAlpha(0.4 + gore * 0.4)
        .setScale(0.7 + gore * 0.8)
        .setRotation(Math.random() * Math.PI)
      this.groundFx.add(stamp)
      this.bloodLayer.add(stamp)
    }
  }

  private flashHurt(): void {
    try {
      this.cameras.main.flash(70, 120, 20, 20, true)
    } catch {
      /* camera FX can already be running after a burst of hits */
    }
  }

  private showBanner(text: string, ms: number): void {
    this.banner = text
    this.bannerUntil = this.time.now + ms
  }

  private syncCameraToView(): void {
    const width = this.scale.width
    const height = this.scale.height
    const zoom = zoomForView(width, height, this.grid.cols * TILE, this.grid.rows * TILE)
    this.cameras.main.setZoom(zoom)
    const touch = this.sys.game.device.input.touch || width < 900
    const hudBias = height < 520 ? height * 0.15 : Math.min(190, height * 0.2)
    this.cameras.main.setFollowOffset(0, touch ? hudBias / zoom : 0)
  }

  private togglePause(): void {
    if (this.dead) return
    this.paused = !this.paused
    if (this.paused) this.physics.world.pause()
    else this.physics.world.resume()
    bus.emit('paused', this.paused)
  }

  private playSfx(key: string, volume: number): void {
    const level = volume * this.run.sfx
    if (level <= 0 || !this.cache.audio.exists(key)) return
    try {
      const sounds = this.sound.getAll(key)
      const idle = sounds.find((sound) => !sound.isPlaying)
      const sound = idle ?? (sounds.length < 6 ? this.sound.add(key) : sounds[0])
      sound?.play({ volume: level })
    } catch {
      /* WebAudio can throw after a long burst of overlapping cues */
    }
  }

  private emitHud(): void {
    const player = this.roster.player()
    const modeHud = this.mode.hud()
    const now = this.time.now
    const hero = player?.heroId ? HERO_BY_ID[player.heroId] : HERO_BY_ID[this.run.heroId]
    const gadgetReady = player
      ? Phaser.Math.Clamp(1 - Math.max(0, player.gadgetReadyAt - now) / hero.gadget.cooldownMs, 0, 1)
      : 0
    const pingReady = player
      ? Phaser.Math.Clamp(1 - Math.max(0, player.pingReadyAt - now) / UNIVERSAL_PING.cooldownMs, 0, 1)
      : 0
    const squad: SquadSlot[] = this.roster.playerSquad().map((mate) => ({
      name: mate.name,
      hp: Math.max(0, Math.round(mate.hp)),
      maxHp: mate.maxHp,
      alive: mate.alive,
      isPlayer: mate.isPlayer,
    }))

    const payload: HudState = {
      modeId: this.mode.id,
      heroName: hero.name,
      weaponName: hero.weapon.name,
      health: Math.max(0, Math.round(player?.hp ?? 0)),
      maxHealth: player?.maxHp ?? hero.hp,
      armor: Math.max(0, Math.round(player?.armor ?? 0)),
      maxArmor: player?.maxArmor ?? hero.armor,
      mag: player?.mag ?? 0,
      magSize: hero.weapon.mag,
      reloading: Boolean(player && player.reloadUntil > now),
      gadgetName: hero.gadget.name,
      gadgetShort: hero.gadget.short,
      gadgetReady,
      pingReady,
      kills: this.kills,
      score: this.mode.scoreFor(this.kills, Math.floor(this.timeSec)),
      wave: modeHud.wave,
      timeSec: Math.floor(this.timeSec),
      objective: modeHud.objective || MODE_BY_ID[this.mode.id].objective,
      enemiesLeft: modeHud.enemiesLeft,
      teamsAlive: modeHud.teamsAlive,
      squad,
      banner: this.banner,
      blackout: this.blackouts.active,
      dead: this.dead,
    }
    bus.emit('hud', payload)
  }
}
