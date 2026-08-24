import Phaser from 'phaser'
import { ENEMY_BY_ID, type EnemyId } from '../../data/enemies'
import { MAP_BY_ID, TILE, type RoomMap } from '../../data/maps'
import { SPECIAL_BY_ID } from '../../data/specials'
import {
  WEAPON_BY_ID,
  WEAPON_BY_SLOT,
  slotFromKeyboard,
  type WeaponDef,
  type WeaponId,
  type WeaponSlot,
} from '../../data/weapons'
import { bus, type HudState } from '../../lib/bus'
import { PLAYER_MAX_HP, type RunConfig } from '../types'

type EnemyBrain = {
  id: EnemyId
  hp: number
  nextSpecial: number
  phase: 'chase' | 'telegraph' | 'recover'
  telegraphUntil: number
  dirX: number
  dirY: number
}

type Sprite = Phaser.Physics.Arcade.Sprite

const BLOOD_KEYS = ['blood-1', 'blood-2', 'blood-3'] as const

export class PlayScene extends Phaser.Scene {
  private run!: RunConfig
  private room!: RoomMap
  private cols = 0
  private rows = 0
  private blocked: boolean[][] = []
  private spawns: { x: number; y: number }[] = []
  private playerStart = { x: 0, y: 0 }

  private player!: Sprite
  private walls!: Phaser.Physics.Arcade.StaticGroup
  private enemies!: Phaser.Physics.Arcade.Group
  private bullets!: Phaser.Physics.Arcade.Group
  private enemyShots!: Phaser.Physics.Arcade.Group
  private barrels!: Phaser.Physics.Arcade.StaticGroup
  private mines!: Phaser.Physics.Arcade.Group
  private charges!: Phaser.Physics.Arcade.StaticGroup
  private barricades!: Phaser.Physics.Arcade.StaticGroup
  private pickups!: Phaser.Physics.Arcade.Group
  private gibs!: Phaser.Physics.Arcade.Group
  private bloodLayer!: Phaser.GameObjects.Group

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keyW!: Phaser.Input.Keyboard.Key
  private keyA!: Phaser.Input.Keyboard.Key
  private keyS!: Phaser.Input.Keyboard.Key
  private keyD!: Phaser.Input.Keyboard.Key
  private keySpace!: Phaser.Input.Keyboard.Key
  private keyShift!: Phaser.Input.Keyboard.Key

  private facing = { x: 0, y: -1 }
  private touchMove = { x: 0, y: 0 }
  private fireHeld = false
  private specialHeld = false
  private specialWas = false
  private fireHoldMs = 0
  private chargeBlasted = false
  private slot: WeaponSlot = 1
  private ammo: Record<WeaponId, number> = {
    pistol: 999,
    smg: 180,
    shotgun: 36,
    barrel: 8,
    grenade: 12,
    barricade: 10,
    mine: 10,
    rocket: 8,
    charge: 6,
    railgun: 12,
  }
  private cooldownUntil = 0
  private specialUntil = 0
  private invulnUntil = 0
  private dashUntil = 0
  private nextHurt = 0
  private health = PLAYER_MAX_HP
  private kills = 0
  private score = 0
  private wave = 0
  private timeSec = 0
  private paused = false
  private dead = false
  private reported = false
  private waveLive = false
  private spawnQueue: EnemyId[] = []
  private spawnAcc = 0
  private betweenWavesUntil = 0
  private banner: string | null = 'GET READY'
  private hudAcc = 0
  private now = 0
  private offs: Array<() => void> = []
  private gfx!: Phaser.GameObjects.Graphics
  private railUntil = 0
  private railA = { x: 0, y: 0 }
  private railB = { x: 0, y: 0 }
  private mobileCap = false

  constructor() {
    super('play')
  }

  create(): void {
    this.run = this.game.registry.get('run') as RunConfig
    this.room = MAP_BY_ID[this.run.mapId]
    this.mobileCap = this.game.scale.width < 800 || this.sys.game.device.input.touch
    this.buildMap()

    this.physics.world.setBounds(0, 0, this.cols * TILE, this.rows * TILE)
    this.cameras.main.setBounds(0, 0, this.cols * TILE, this.rows * TILE)
    this.cameras.main.setBackgroundColor('#1c1814')

    this.walls = this.physics.add.staticGroup()
    this.enemies = this.physics.add.group({ runChildUpdate: false })
    this.bullets = this.physics.add.group({ maxSize: 90 })
    this.enemyShots = this.physics.add.group({ maxSize: 40 })
    this.barrels = this.physics.add.staticGroup()
    this.mines = this.physics.add.group()
    this.charges = this.physics.add.staticGroup()
    this.barricades = this.physics.add.staticGroup()
    this.pickups = this.physics.add.group()
    this.gibs = this.physics.add.group({ maxSize: 48 })
    this.bloodLayer = this.add.group()
    this.gfx = this.add.graphics().setDepth(20)

    this.stampFloorsAndWalls()

    this.player = this.physics.add.sprite(this.playerStart.x, this.playerStart.y, 'player-gun')
    this.player.setDepth(12)
    this.player.setCollideWorldBounds(true)
    this.player.setCircle(12, this.player.width / 2 - 12, this.player.height / 2 - 12)
    this.player.setDamping(true)
    this.player.setDrag(0.0008)

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
    this.cameras.main.setZoom(this.mobileCap ? 0.82 : 1)

    this.bindInput()
    this.bindPhysics()

    this.betweenWavesUntil = this.time.now + 1600
    this.banner = 'WAVE 1'
    this.emitHud()

    this.offs.push(
      bus.on('move', (v) => {
        this.touchMove = v
      }),
      bus.on('fire', (down) => {
        this.fireHeld = down
      }),
      bus.on('special', (down) => {
        this.specialHeld = down
      }),
      bus.on('weapon', (slot) => {
        if (slot >= 1 && slot <= 10) this.equip(slot as WeaponSlot)
      }),
      bus.on('pauseToggle', () => this.togglePause()),
      bus.on('gore', (gore) => {
        this.run.gore = gore
      }),
      bus.on('volumes', (vol) => {
        this.run.music = vol.music
        this.run.sfx = vol.sfx
      }),
    )

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const off of this.offs) off()
      this.offs = []
    })
  }

  update(_time: number, delta: number): void {
    this.now = this.time.now
    if (this.paused) return

    this.gfx.clear()
    if (this.now < this.railUntil) {
      this.gfx.lineStyle(3, 0x67e8f9, 0.85)
      this.gfx.lineBetween(this.railA.x, this.railA.y, this.railB.x, this.railB.y)
    }

    if (this.dead) {
      this.player.setVelocity(0, 0)
      return
    }

    this.timeSec += delta / 1000
    this.handleMove()
    this.handleFire(delta)
    this.handleSpecial()
    this.updateEnemies()
    this.updateMines()
    this.updateProjectiles()
    this.updateWaves(delta)
    this.hudAcc += delta
    if (this.hudAcc > 80) {
      this.hudAcc = 0
      this.emitHud()
    }
  }

  private bindInput(): void {
    const kb = this.input.keyboard
    if (!kb) return
    this.cursors = kb.createCursorKeys()
    this.keyW = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W)
    this.keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A)
    this.keyS = kb.addKey(Phaser.Input.Keyboard.KeyCodes.S)
    this.keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    this.keySpace = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.keyShift = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
    kb.on('keydown', (ev: KeyboardEvent) => {
      const slot = slotFromKeyboard(ev.code)
      if (slot) this.equip(slot)
      if (ev.code === 'KeyP' || ev.code === 'Escape') this.togglePause()
    })
  }

  private bindPhysics(): void {
    this.physics.add.collider(this.player, this.walls)
    this.physics.add.collider(this.player, this.barricades)
    this.physics.add.collider(this.enemies, this.walls)
    this.physics.add.collider(this.enemies, this.barricades)
    this.physics.add.collider(this.enemies, this.enemies)
    this.physics.add.overlap(this.bullets, this.enemies, (b, e) => {
      this.bulletHit(b as Sprite, e as Sprite)
    })
    this.physics.add.overlap(this.bullets, this.walls, (b) => {
      this.bulletVsSolid(b as Sprite)
    })
    this.physics.add.overlap(this.bullets, this.barrels, (b, barrel) => {
      this.disableBullet(b as Sprite)
      this.explodeAt((barrel as Sprite).x, (barrel as Sprite).y, 92, 70)
      barrel.destroy()
    })
    this.physics.add.overlap(this.enemyShots, this.player, (shot) => {
      this.disableBullet(shot as Sprite)
      this.hurt(ENEMY_BY_ID.infernal.damage)
    })
    this.physics.add.overlap(this.enemyShots, this.barrels, (shot, barrel) => {
      this.disableBullet(shot as Sprite)
      this.explodeAt((barrel as Sprite).x, (barrel as Sprite).y, 92, 70)
      barrel.destroy()
    })
    this.physics.add.overlap(this.enemies, this.player, (e) => {
      this.melee(e as Sprite)
    })
    this.physics.add.overlap(this.player, this.pickups, (_p, item) => {
      this.takePickup(item as Sprite)
    })
    this.physics.add.overlap(this.mines, this.enemies, (mine, enemy) => {
      const m = mine as Sprite
      if (m.getData('armed')) {
        this.explodeAt(m.x, m.y, 80, 60)
        m.destroy()
        void enemy
      }
    })
    this.physics.add.overlap(this.mines, this.player, (mine) => {
      const m = mine as Sprite
      if (m.getData('armed')) {
        this.explodeAt(m.x, m.y, 80, 60)
        m.destroy()
      }
    })
  }

  private buildMap(): void {
    this.rows = this.room.rows.length
    this.cols = this.room.rows[0]?.length ?? 0
    this.blocked = []
    this.spawns = []
    for (let r = 0; r < this.rows; r += 1) {
      this.blocked[r] = []
      const line = this.room.rows[r] ?? ''
      for (let c = 0; c < this.cols; c += 1) {
        const ch = line[c] ?? '#'
        this.blocked[r][c] = ch === '#'
        const x = c * TILE + TILE / 2
        const y = r * TILE + TILE / 2
        if (ch === 'P') this.playerStart = { x, y }
        if (ch === 'S') this.spawns.push({ x, y })
      }
    }
    if (this.spawns.length === 0) this.spawns.push({ x: TILE * 1.5, y: TILE * 1.5 })
  }

  private stampFloorsAndWalls(): void {
    for (let r = 0; r < this.rows; r += 1) {
      for (let c = 0; c < this.cols; c += 1) {
        const x = c * TILE + TILE / 2
        const y = r * TILE + TILE / 2
        this.add.image(x, y, 'floor').setDepth(0)
        if (this.blocked[r]?.[c]) {
          const wall = this.walls.create(x, y, 'wall') as Sprite
          wall.setDepth(6)
          wall.refreshBody()
        }
      }
    }
  }

  private equip(slot: WeaponSlot): void {
    this.slot = slot
    const def = WEAPON_BY_SLOT[slot]
    const heavy = def.id === 'smg' || def.id === 'rocket' || def.id === 'railgun' || def.id === 'shotgun'
    this.player.setTexture(heavy ? 'player-machine' : 'player-gun')
    this.playSfx('ui-click', 0.25)
  }

  private handleMove(): void {
    let dx = this.touchMove.x
    let dy = this.touchMove.y
    if (this.cursors.left.isDown || this.keyA.isDown) dx -= 1
    if (this.cursors.right.isDown || this.keyD.isDown) dx += 1
    if (this.cursors.up.isDown || this.keyW.isDown) dy -= 1
    if (this.cursors.down.isDown || this.keyS.isDown) dy += 1
    const len = Math.hypot(dx, dy)
    if (len > 0.08) {
      dx /= len
      dy /= len
      this.facing.x = dx
      this.facing.y = dy
    } else {
      dx = 0
      dy = 0
    }
    const dashing = this.now < this.dashUntil
    const speed = dashing ? 420 : 178
    this.player.setVelocity(dx * speed, dy * speed)
    this.player.setRotation(Math.atan2(this.facing.y, this.facing.x) + Math.PI / 2)
    if (this.now < this.invulnUntil) {
      this.player.setAlpha(0.55 + 0.45 * Math.sin(this.now / 40))
    } else {
      this.player.setAlpha(1)
    }
  }

  private handleFire(delta: number): void {
    const down = this.fireHeld || this.keySpace.isDown
    if (down) this.fireHoldMs += delta
    else {
      if (this.fireHoldMs > 0 && this.fireHoldMs < 280 && !this.chargeBlasted) {
        const def = WEAPON_BY_SLOT[this.slot]
        if (def.kind === 'place') this.tryPlace(def)
      }
      this.fireHoldMs = 0
      this.chargeBlasted = false
    }

    const def = WEAPON_BY_SLOT[this.slot]
    if (def.id === 'charge' && down && this.fireHoldMs > 360 && !this.chargeBlasted) {
      this.chargeBlasted = true
      this.detonateCharges()
      return
    }

    if (!down) return
    if (def.kind === 'place') return
    this.tryShoot(def)
  }

  private handleSpecial(): void {
    const down = this.specialHeld || this.keyShift.isDown
    const pressed = down && !this.specialWas
    this.specialWas = down
    if (!pressed) return
    if (this.now < this.specialUntil) {
      this.playSfx('empty', 0.2)
      return
    }
    const special = SPECIAL_BY_ID[this.run.specialId]
    this.specialUntil = this.now + special.cooldownMs
    switch (this.run.specialId) {
      case 'dash':
        this.dashUntil = this.now + 190
        this.invulnUntil = this.now + 220
        this.playSfx('zap2', 0.35)
        break
      case 'airstrike': {
        const x = this.player.x + this.facing.x * 130
        const y = this.player.y + this.facing.y * 130
        const mark = this.add.image(x, y, 'mark').setDepth(8).setAlpha(0.85)
        this.playSfx('zap1', 0.4)
        this.time.delayedCall(850, () => {
          mark.destroy()
          this.explodeAt(x, y, 118, 88)
        })
        break
      }
      case 'stomp':
        this.explodeAt(this.player.x, this.player.y, 78, 32, true)
        this.playSfx('boom2', 0.35)
        break
      default: {
        const _never: never = this.run.specialId
        void _never
      }
    }
  }

  private tryShoot(def: WeaponDef): void {
    if (this.now < this.cooldownUntil) return
    if (!def.infiniteAmmo && this.ammo[def.id] <= 0) {
      this.playSfx('empty', 0.25)
      this.cooldownUntil = this.now + 180
      return
    }
    this.cooldownUntil = this.now + def.cooldownMs
    if (!def.infiniteAmmo) this.ammo[def.id] -= 1

    const originX = this.player.x + this.facing.x * 22
    const originY = this.player.y + this.facing.y * 22

    switch (def.kind) {
      case 'gun':
        this.spawnBullet(originX, originY, this.facing.x, this.facing.y, 'bullet', def.speed, def.damage, false)
        this.playSfx(def.id === 'smg' ? 'laser2' : 'laser1', 0.32)
        break
      case 'spread': {
        const pellets = def.pellets ?? 5
        const spread = def.spread ?? 0.4
        for (let i = 0; i < pellets; i += 1) {
          const t = pellets === 1 ? 0 : i / (pellets - 1) - 0.5
          const ang = Math.atan2(this.facing.y, this.facing.x) + t * spread
          this.spawnBullet(
            originX,
            originY,
            Math.cos(ang),
            Math.sin(ang),
            'pellet',
            def.speed,
            def.damage,
            false,
          )
        }
        this.playSfx('laser3', 0.4)
        break
      }
      case 'rocket':
        this.spawnBullet(originX, originY, this.facing.x, this.facing.y, 'rocket', def.speed, def.damage, true, def.radius)
        this.playSfx('laser9', 0.45)
        break
      case 'throw':
        this.spawnBullet(originX, originY, this.facing.x, this.facing.y, 'grenade', def.speed, def.damage, true, def.radius, 820)
        this.playSfx('laser9', 0.3)
        break
      case 'rail':
        this.fireRail(def)
        this.playSfx('zap1', 0.5)
        break
      case 'place':
        break
      default: {
        const _never: never = def.kind
        void _never
      }
    }
  }

  private tryPlace(def: WeaponDef): void {
    if (this.now < this.cooldownUntil) return
    if (this.ammo[def.id] <= 0) {
      this.playSfx('empty', 0.25)
      return
    }
    const x = this.player.x + this.facing.x * 40
    const y = this.player.y + this.facing.y * 40
    if (this.blockedAt(x, y)) {
      this.playSfx('empty', 0.2)
      return
    }
    this.cooldownUntil = this.now + def.cooldownMs
    this.ammo[def.id] -= 1
    const place = def.place
    switch (place) {
      case 'barrel': {
        const obj = this.barrels.create(x, y, 'barrel-obj') as Sprite
        obj.setDepth(7)
        obj.refreshBody()
        break
      }
      case 'wall': {
        const obj = this.barricades.create(x, y, 'barricade') as Sprite
        obj.setDepth(7)
        obj.setAngle((Math.atan2(this.facing.y, this.facing.x) * 180) / Math.PI)
        obj.refreshBody()
        obj.setData('hp', 90)
        break
      }
      case 'mine': {
        const obj = this.mines.create(x, y, 'mine-obj') as Sprite
        obj.setDepth(7)
        obj.setVelocity(0, 0)
        obj.setImmovable(true)
        obj.setData('armed', false)
        this.time.delayedCall(700, () => {
          if (obj.active) obj.setData('armed', true)
        })
        break
      }
      case 'charge': {
        const obj = this.charges.create(x, y, 'charge-obj') as Sprite
        obj.setDepth(7)
        obj.refreshBody()
        break
      }
      case undefined:
        break
      default: {
        const _never: never = place
        void _never
      }
    }
    this.playSfx('ui-click', 0.35)
  }

  private detonateCharges(): void {
    const list = this.charges.getChildren().slice() as Sprite[]
    if (list.length === 0) {
      this.playSfx('empty', 0.2)
      return
    }
    for (const charge of list) {
      this.explodeAt(charge.x, charge.y, 110, 90)
      charge.destroy()
    }
  }

  private spawnBullet(
    x: number,
    y: number,
    dx: number,
    dy: number,
    key: string,
    speed: number,
    damage: number,
    explosive: boolean,
    radius = 80,
    fuse = 0,
  ): void {
    const bullet = this.bullets.get(x, y, key) as Sprite | null
    if (!bullet) return
    bullet.setActive(true).setVisible(true)
    bullet.enableBody(true, x, y, true, true)
    bullet.setRotation(Math.atan2(dy, dx))
    bullet.setVelocity(dx * speed, dy * speed)
    bullet.setDepth(11)
    bullet.setData('damage', damage)
    bullet.setData('explosive', explosive)
    bullet.setData('radius', radius)
    bullet.setData('born', this.now)
    bullet.setData('fuse', fuse)
    if (key === 'rocket') bullet.setSize(12, 8)
    else bullet.setCircle(Math.max(3, bullet.width / 2 - 1))
  }

  private fireRail(def: WeaponDef): void {
    let x = this.player.x + this.facing.x * 16
    let y = this.player.y + this.facing.y * 16
    this.railA = { x, y }
    let endX = x
    let endY = y
    const hit = new Set<Sprite>()
    for (let i = 0; i < 52; i += 1) {
      x += this.facing.x * 16
      y += this.facing.y * 16
      if (this.blockedAt(x, y)) break
      endX = x
      endY = y
      this.enemies.children.iterate((child) => {
        const enemy = child as Sprite
        if (!enemy.active) return true
        if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) < 20 && !hit.has(enemy)) {
          hit.add(enemy)
          this.damageEnemy(enemy, def.damage)
        }
        return true
      })
    }
    this.railB = { x: endX, y: endY }
    this.railUntil = this.now + 90
  }

  private bulletHit(bullet: Sprite, enemy: Sprite): void {
    if (!bullet.active || !enemy.active) return
    const explosive = Boolean(bullet.getData('explosive'))
    const damage = Number(bullet.getData('damage') ?? 10)
    if (explosive) {
      const radius = Number(bullet.getData('radius') ?? 80)
      this.explodeAt(bullet.x, bullet.y, radius, damage)
    } else {
      this.damageEnemy(enemy, damage)
    }
    this.disableBullet(bullet)
  }

  private bulletVsSolid(bullet: Sprite): void {
    if (!bullet.active) return
    if (bullet.getData('explosive')) {
      this.explodeAt(bullet.x, bullet.y, Number(bullet.getData('radius') ?? 80), Number(bullet.getData('damage') ?? 40))
    }
    this.disableBullet(bullet)
  }

  private disableBullet(bullet: Sprite): void {
    bullet.setVelocity(0, 0)
    bullet.disableBody(true, true)
  }

  private updateProjectiles(): void {
    const killIfGone = (sprite: Sprite) => {
      if (!sprite.active) return
      const fuse = Number(sprite.getData('fuse') ?? 0)
      const born = Number(sprite.getData('born') ?? this.now)
      if (fuse > 0 && this.now - born > fuse) {
        if (sprite.getData('explosive')) {
          this.explodeAt(sprite.x, sprite.y, Number(sprite.getData('radius') ?? 80), Number(sprite.getData('damage') ?? 40))
        }
        this.disableBullet(sprite)
        return
      }
        if (
        sprite.x < -40 ||
        sprite.y < -40 ||
        sprite.x > this.cols * TILE + 40 ||
        sprite.y > this.rows * TILE + 40
      ) {
        this.disableBullet(sprite)
      }
    }
    this.bullets.children.iterate((child) => {
      killIfGone(child as Sprite)
      return true
    })
    this.enemyShots.children.iterate((child) => {
      killIfGone(child as Sprite)
      return true
    })
  }

  private explodeAt(x: number, y: number, radius: number, damage: number, skipPlayer = false): void {
    const blast = this.add.image(x, y, 'blast').setDepth(14)
    this.tweens.add({
      targets: blast,
      alpha: 0,
      scale: 1.6,
      duration: 220,
      onComplete: () => blast.destroy(),
    })
    this.cameras.main.shake(120, 0.006)
    this.playSfx(Math.random() > 0.5 ? 'boom1' : 'boom2', 0.45)
    this.enemies.children.iterate((child) => {
      const enemy = child as Sprite
      if (!enemy.active) return true
      const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y)
      if (dist <= radius) {
        const falloff = 1 - dist / radius
        this.damageEnemy(enemy, Math.round(damage * (0.55 + 0.45 * falloff)))
        const a = Math.atan2(enemy.y - y, enemy.x - x)
        enemy.setVelocity(Math.cos(a) * 220, Math.sin(a) * 220)
      }
      return true
    })
    if (!skipPlayer) {
      const dist = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y)
      if (dist <= radius) {
        const falloff = 1 - dist / radius
        this.hurt(Math.round(damage * 0.35 * (0.4 + 0.6 * falloff)))
      }
    }
  }

  private melee(enemy: Sprite): void {
    const brain = enemy.getData('brain') as EnemyBrain | undefined
    if (!brain) return
    this.hurt(ENEMY_BY_ID[brain.id].damage)
  }

  private hurt(amount: number): void {
    if (this.dead || this.now < this.invulnUntil || this.now < this.nextHurt) return
    this.health = Math.max(0, this.health - amount)
    this.nextHurt = this.now + 380
    this.invulnUntil = this.now + 280
    this.cameras.main.flash(80, 120, 20, 20, false)
    this.playSfx('empty', 0.35)
    if (this.health <= 0) this.die()
  }

  private die(): void {
    this.dead = true
    this.player.setTint(0x7f1d1d)
    this.player.setVelocity(0, 0)
    this.banner = 'YOU DIED'
    this.emitHud()
    if (this.reported) return
    this.reported = true
    bus.emit('gameover', {
      kills: this.kills,
      timeSec: Math.floor(this.timeSec),
      wave: this.wave,
      score: this.score,
    })
  }

  private damageEnemy(enemy: Sprite, amount: number): void {
    const brain = enemy.getData('brain') as EnemyBrain | undefined
    if (!brain || !enemy.active) return
    brain.hp -= amount
    enemy.setTintFill(0xffffff)
    this.time.delayedCall(40, () => {
      if (enemy.active) enemy.clearTint().setTint(ENEMY_BY_ID[brain.id].tint)
    })
    if (brain.hp <= 0) this.killEnemy(enemy, brain)
  }

  private killEnemy(enemy: Sprite, brain: EnemyBrain): void {
    const def = ENEMY_BY_ID[brain.id]
    this.kills += 1
    this.score += def.score + this.wave * 8
    this.splatter(enemy.x, enemy.y)
    if (def.attack === 'explode') {
      const x = enemy.x
      const y = enemy.y
      enemy.destroy()
      this.explodeAt(x, y, def.explodeRadius ?? 80, 36)
    } else {
      enemy.destroy()
    }
    this.maybeDrop(enemy.x, enemy.y)
  }

  private maybeDrop(x: number, y: number): void {
    const roll = Math.random()
    if (roll < 0.07) this.spawnPickup(x, y, 'ammo')
    else if (roll < 0.1) this.spawnPickup(x, y, 'health')
  }

  private spawnPickup(x: number, y: number, kind: 'ammo' | 'health'): void {
    const item = this.pickups.create(x, y, kind === 'ammo' ? 'ammo-box' : 'health-pack') as Sprite
    item.setDepth(8)
    item.setData('kind', kind)
    this.time.delayedCall(9000, () => {
      if (item.active) item.destroy()
    })
  }

  private takePickup(item: Sprite): void {
    const kind = item.getData('kind') as 'ammo' | 'health'
    if (kind === 'health') {
      this.health = Math.min(PLAYER_MAX_HP, this.health + 28)
    } else {
      for (const weapon of Object.values(WEAPON_BY_ID)) {
        if (weapon.infiniteAmmo) continue
        this.ammo[weapon.id] = Math.min(weapon.ammoMax, this.ammo[weapon.id] + Math.ceil(weapon.ammoMax * 0.45))
      }
    }
    this.playSfx('pickup', 0.45)
    item.destroy()
  }

  private splatter(x: number, y: number): void {
    const gore = this.run.gore / 100
    if (gore <= 0.02) return
    const mobile = this.mobileCap ? 0.65 : 1
    const stamps = Math.round((1 + gore * 5) * mobile)
    const maxBlood = Math.round(40 + gore * 70 * mobile)
    for (let i = 0; i < stamps; i += 1) {
      if (this.bloodLayer.getLength() >= maxBlood) {
        const oldest = this.bloodLayer.getFirst(true) as Phaser.GameObjects.Image | null
        oldest?.destroy()
      }
      const img = this.add
        .image(x + Phaser.Math.Between(-18, 18), y + Phaser.Math.Between(-18, 18), Phaser.Utils.Array.GetRandom([...BLOOD_KEYS]))
        .setDepth(1)
        .setAlpha(0.35 + gore * 0.5)
        .setScale(0.7 + gore * 0.9)
        .setRotation(Math.random() * Math.PI)
      this.bloodLayer.add(img)
    }
    const gibCount = Math.round(gore * 7 * mobile)
    for (let i = 0; i < gibCount; i += 1) {
      const gib = this.gibs.get(x, y, i % 2 === 0 ? 'gib-flesh' : 'gib-bone') as Sprite | null
      if (!gib) break
      gib.setActive(true).setVisible(true)
      gib.enableBody(true, x, y, true, true)
      gib.setDepth(13)
      const a = Math.random() * Math.PI * 2
      gib.setVelocity(Math.cos(a) * (80 + gore * 180), Math.sin(a) * (80 + gore * 180))
      gib.setBounce(0.4)
      this.time.delayedCall(1400 + gore * 900, () => {
        if (gib.active) this.disableBullet(gib)
      })
    }
  }

  private updateEnemies(): void {
    this.enemies.children.iterate((child) => {
      const enemy = child as Sprite
      if (!enemy.active) return true
      const brain = enemy.getData('brain') as EnemyBrain | undefined
      if (!brain) return true
      const def = ENEMY_BY_ID[brain.id]
      const dx = this.player.x - enemy.x
      const dy = this.player.y - enemy.y
      const dist = Math.hypot(dx, dy) || 1
      const nx = dx / dist
      const ny = dy / dist
      enemy.setRotation(Math.atan2(ny, nx) + Math.PI / 2)

      if (def.attack === 'fireline') {
        if (brain.phase === 'telegraph') {
          enemy.setVelocity(0, 0)
          this.gfx.lineStyle(2, 0xfb7185, 0.7)
          this.gfx.lineBetween(enemy.x, enemy.y, enemy.x + brain.dirX * 340, enemy.y + brain.dirY * 340)
          if (this.now >= brain.telegraphUntil) {
            brain.phase = 'recover'
            brain.nextSpecial = this.now + (def.cooldownMs ?? 2200)
            this.spawnEnemyShot(enemy.x, enemy.y, brain.dirX, brain.dirY)
          }
          return true
        }
        if (brain.phase === 'recover' && this.now < brain.nextSpecial) {
          enemy.setVelocity(nx * def.speed * 0.35, ny * def.speed * 0.35)
          return true
        }
        if (dist < 260 && this.now >= brain.nextSpecial) {
          brain.phase = 'telegraph'
          brain.telegraphUntil = this.now + (def.telegraphMs ?? 700)
          brain.dirX = nx
          brain.dirY = ny
          enemy.setVelocity(0, 0)
          return true
        }
      }

      if (def.attack === 'teleport' && this.now >= brain.nextSpecial) {
        brain.nextSpecial = this.now + (def.cooldownMs ?? 3800)
        const ang = Math.random() * Math.PI * 2
        const distTo = 70 + Math.random() * 50
        const tx = this.player.x + Math.cos(ang) * distTo
        const ty = this.player.y + Math.sin(ang) * distTo
        if (!this.blockedAt(tx, ty)) {
          enemy.setAlpha(0.2)
          enemy.setPosition(tx, ty)
          this.tweens.add({ targets: enemy, alpha: 1, duration: 160 })
        }
      }

      enemy.setVelocity(nx * def.speed, ny * def.speed)
      return true
    })
  }

  private spawnEnemyShot(x: number, y: number, dx: number, dy: number): void {
    const shot = this.enemyShots.get(x + dx * 18, y + dy * 18, 'fireball') as Sprite | null
    if (!shot) return
    shot.setActive(true).setVisible(true)
    shot.enableBody(true, x + dx * 18, y + dy * 18, true, true)
    shot.setVelocity(dx * 260, dy * 260)
    shot.setDepth(11)
    shot.setData('born', this.now)
    shot.setData('fuse', 1400)
    this.playSfx('laser9', 0.28)
  }

  private updateMines(): void {
    /* armed flag is enough; overlap handles detonation */
  }

  private updateWaves(delta: number): void {
    if (this.spawnQueue.length > 0) {
      this.spawnAcc += delta
      if (this.spawnAcc > 280) {
        this.spawnAcc = 0
        const id = this.spawnQueue.shift()
        if (id) this.spawnEnemy(id)
      }
      return
    }
    if (this.enemies.countActive(true) > 0) return
    if (this.waveLive) {
      this.waveLive = false
      this.betweenWavesUntil = this.now + 1700
      this.banner = 'WAVE CLEAR'
      return
    }
    if (this.now >= this.betweenWavesUntil) this.startNextWave()
  }

  private startNextWave(): void {
    this.wave += 1
    this.banner = `WAVE ${this.wave}`
    this.time.delayedCall(1600, () => {
      if (this.banner === `WAVE ${this.wave}`) this.banner = null
    })
    const diff = Phaser.Math.Clamp(this.run.difficulty, 1, 10)
    const count = Math.round((3 + this.wave * 2.15) * (0.55 + diff * 0.22))
    this.spawnQueue = []
    for (let i = 0; i < count; i += 1) this.spawnQueue.push(this.pickEnemy(this.wave))
    this.waveLive = true
    if (this.wave % 5 === 0) {
      this.spawnPickup(this.playerStart.x, this.playerStart.y, 'ammo')
      this.spawnPickup(this.playerStart.x + 28, this.playerStart.y, 'health')
    }
    this.betweenWavesUntil = Number.POSITIVE_INFINITY
  }

  private pickEnemy(wave: number): EnemyId {
    const roll = Math.random()
    if (wave <= 1) return 'shambler'
    if (wave === 2) return roll < 0.7 ? 'shambler' : 'runner'
    if (wave === 3) {
      if (roll < 0.5) return 'shambler'
      if (roll < 0.8) return 'runner'
      return 'wraps'
    }
    if (wave < 6) {
      if (roll < 0.38) return 'shambler'
      if (roll < 0.62) return 'runner'
      if (roll < 0.78) return 'wraps'
      if (roll < 0.9) return 'infernal'
      return 'bloater'
    }
    if (roll < 0.28) return 'shambler'
    if (roll < 0.48) return 'runner'
    if (roll < 0.62) return 'wraps'
    if (roll < 0.76) return 'infernal'
    if (roll < 0.9) return 'blinker'
    return 'bloater'
  }

  private spawnEnemy(id: EnemyId): void {
    if (this.enemies.countActive(true) >= 64) {
      this.spawnQueue.unshift(id)
      return
    }
    const def = ENEMY_BY_ID[id]
    const spawn = this.spawns[Math.floor(Math.random() * this.spawns.length)] ?? this.spawns[0]
    let x = spawn.x
    let y = spawn.y
    if (id === 'wraps' && this.wave >= 5 && Math.random() < 0.45) {
      const ang = Math.random() * Math.PI * 2
      const nx = this.player.x + Math.cos(ang) * 90
      const ny = this.player.y + Math.sin(ang) * 90
      if (!this.blockedAt(nx, ny)) {
        x = nx
        y = ny
      }
    }
    const enemy = this.enemies.get(x, y, def.texture) as Sprite | null
    if (!enemy) return
    enemy.setActive(true).setVisible(true)
    enemy.enableBody(true, x, y, true, true)
    enemy.setDepth(10)
    enemy.setScale(def.scale)
    enemy.setTint(def.tint)
    enemy.setCircle(def.radius, enemy.width / 2 - def.radius, enemy.height / 2 - def.radius)
    enemy.setBounce(0)
    const extraHp = Math.round((this.wave - 1) * 3 * (0.4 + this.run.difficulty * 0.08))
    const brain: EnemyBrain = {
      id,
      hp: def.hp + extraHp,
      nextSpecial: this.now + 800,
      phase: 'chase',
      telegraphUntil: 0,
      dirX: 0,
      dirY: -1,
    }
    enemy.setData('brain', brain)
  }

  private blockedAt(x: number, y: number): boolean {
    const c = Math.floor(x / TILE)
    const r = Math.floor(y / TILE)
    if (r < 0 || c < 0 || r >= this.rows || c >= this.cols) return true
    return Boolean(this.blocked[r]?.[c])
  }

  private togglePause(): void {
    if (this.dead) return
    this.paused = !this.paused
    if (this.paused) this.physics.world.pause()
    else this.physics.world.resume()
    bus.emit('paused', this.paused)
  }

  private playSfx(key: string, vol: number): void {
    this.sound.play(key, { volume: vol * this.run.sfx })
  }

  private emitHud(): void {
    const def = WEAPON_BY_SLOT[this.slot]
    const special = SPECIAL_BY_ID[this.run.specialId]
    const ready = this.specialUntil <= this.now ? 1 : Math.max(0, 1 - (this.specialUntil - this.now) / special.cooldownMs)
    const payload: HudState = {
      health: this.health,
      maxHealth: PLAYER_MAX_HP,
      kills: this.kills,
      score: this.score,
      wave: this.wave,
      timeSec: Math.floor(this.timeSec),
      weaponName: def.name,
      weaponSlot: def.slot,
      ammo: def.infiniteAmmo ? 999 : this.ammo[def.id],
      infiniteAmmo: def.infiniteAmmo,
      specialName: special.name,
      specialReady: ready,
      waveBanner: this.banner,
      dead: this.dead,
    }
    bus.emit('hud', payload)
  }
}
