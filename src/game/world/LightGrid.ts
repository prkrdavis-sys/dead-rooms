import Phaser from 'phaser'
import type { ConeSpec } from '../vision/visionPolygon'
import type { RoomGrid, Vec } from './grid'

export type LightKind = 'lamp' | 'corpse' | 'beacon' | 'flash'

type LightSource = {
  kind: LightKind
  x: number
  y: number
  range: number
  spread: number
  angle: number
  live: boolean
  expiresAt: number
  breaker: number
  sprite: Phaser.Physics.Arcade.Sprite | null
}

const LAMP_RANGE = 196
const CORPSE_RANGE = 238
const BEACON_RANGE = 176

/**
 * Every fixture that throws light: ceiling lamps wired to breaker panels,
 * dropped flashlights burning on corpses, Ward beacons, and the brief flare a
 * gunshot paints on the room.
 */
export class LightGrid {
  readonly fixtures: Phaser.Physics.Arcade.StaticGroup
  readonly breakers: Phaser.Physics.Arcade.StaticGroup
  private readonly scene: Phaser.Scene
  private readonly sources: LightSource[] = []
  private readonly breakerOn: boolean[] = []
  private readonly breakerPoints: Vec[] = []

  constructor(scene: Phaser.Scene, grid: RoomGrid) {
    this.scene = scene
    this.fixtures = scene.physics.add.staticGroup()
    this.breakers = scene.physics.add.staticGroup()

    grid.breakers.forEach((point, index) => {
      this.breakerOn.push(true)
      this.breakerPoints.push(point)
      const sprite = this.breakers.create(point.x, point.y, 'breaker') as Phaser.Physics.Arcade.Sprite
      sprite.setDepth(4)
      sprite.setData('breaker', index)
      sprite.refreshBody()
    })

    for (const point of grid.lamps) {
      const sprite = this.fixtures.create(point.x, point.y, 'lamp') as Phaser.Physics.Arcade.Sprite
      sprite.setDepth(4)
      sprite.refreshBody()
      const source: LightSource = {
        kind: 'lamp',
        x: point.x,
        y: point.y,
        range: LAMP_RANGE,
        spread: Math.PI * 2,
        angle: 0,
        live: true,
        expiresAt: Number.POSITIVE_INFINITY,
        breaker: this.nearestBreaker(point),
        sprite,
      }
      sprite.setData('light', source)
      this.sources.push(source)
    }
  }

  /** Cones the vision system should light this frame. */
  activeCones(now: number, blackout: boolean): ConeSpec[] {
    const out: ConeSpec[] = []
    for (const source of this.sources) {
      if (!source.live || now > source.expiresAt) continue
      if (blackout && source.kind !== 'flash') continue
      if (source.kind === 'lamp' && source.breaker >= 0 && !this.breakerOn[source.breaker]) continue
      out.push({ x: source.x, y: source.y, angle: source.angle, spread: source.spread, range: source.range })
    }
    return out
  }

  /** Lamp positions still burning, used by bots to judge where they are exposed. */
  litLampPoints(now: number, blackout: boolean): Vec[] {
    return this.activeCones(now, blackout)
      .filter((cone) => cone.spread > Math.PI)
      .map((cone) => ({ x: cone.x, y: cone.y }))
  }

  breakFixture(sprite: Phaser.GameObjects.GameObject): boolean {
    const source = sprite.getData('light') as LightSource | undefined
    if (!source || !source.live) return false
    source.live = false
    source.sprite?.setTexture('lamp-dead')
    return true
  }

  killLightsNear(x: number, y: number, radius: number): number {
    let killed = 0
    for (const source of this.sources) {
      if (!source.live || source.kind === 'flash') continue
      if (Phaser.Math.Distance.Between(x, y, source.x, source.y) > radius) continue
      source.live = false
      source.sprite?.setTexture('lamp-dead')
      killed += 1
    }
    return killed
  }

  toggleBreaker(sprite: Phaser.GameObjects.GameObject): boolean {
    const index = Number(sprite.getData('breaker') ?? -1)
    if (index < 0) return false
    this.breakerOn[index] = !this.breakerOn[index]
    const target = sprite as Phaser.Physics.Arcade.Sprite
    target.setTexture(this.breakerOn[index] ? 'breaker' : 'breaker-off')
    return this.breakerOn[index]
  }

  addFlash(x: number, y: number, now: number, range: number): void {
    this.push({
      kind: 'flash',
      x,
      y,
      range,
      spread: Math.PI * 2,
      angle: 0,
      live: true,
      expiresAt: now + 110,
      breaker: -1,
      sprite: null,
    })
  }

  addCorpseLight(x: number, y: number, angle: number, now: number, ttlMs: number): void {
    const sprite = this.fixtures.create(x, y, 'lamp-dead') as Phaser.Physics.Arcade.Sprite
    sprite.setDepth(3).setAlpha(0.7).setScale(0.7)
    sprite.refreshBody()
    const source: LightSource = {
      kind: 'corpse',
      x,
      y,
      range: CORPSE_RANGE,
      spread: Phaser.Math.DegToRad(74),
      angle,
      live: true,
      expiresAt: now + ttlMs,
      breaker: -1,
      sprite,
    }
    sprite.setData('light', source)
    this.push(source)
    this.scene.time.delayedCall(ttlMs, () => {
      if (sprite.active) sprite.destroy()
    })
  }

  addBeacon(x: number, y: number, now: number, ttlMs: number): void {
    const sprite = this.fixtures.create(x, y, 'lamp') as Phaser.Physics.Arcade.Sprite
    sprite.setDepth(4).setScale(0.8)
    sprite.refreshBody()
    const source: LightSource = {
      kind: 'beacon',
      x,
      y,
      range: BEACON_RANGE,
      spread: Math.PI * 2,
      angle: 0,
      live: true,
      expiresAt: now + ttlMs,
      breaker: -1,
      sprite,
    }
    sprite.setData('light', source)
    this.push(source)
    this.scene.time.delayedCall(ttlMs, () => {
      if (sprite.active) sprite.destroy()
    })
  }

  /** Beacon positions so the support hero can actually heal the squad. */
  beacons(now: number): Vec[] {
    return this.sources
      .filter((source) => source.kind === 'beacon' && source.live && now <= source.expiresAt)
      .map((source) => ({ x: source.x, y: source.y }))
  }

  prune(now: number): void {
    for (let i = this.sources.length - 1; i >= 0; i -= 1) {
      const source = this.sources[i]
      if (source.kind === 'lamp') continue
      if (source.live && now <= source.expiresAt) continue
      this.sources.splice(i, 1)
    }
  }

  private push(source: LightSource): void {
    this.sources.push(source)
  }

  private nearestBreaker(point: Vec): number {
    let best = -1
    let bestDist = Number.POSITIVE_INFINITY
    this.breakerPoints.forEach((breaker, index) => {
      const dist = Phaser.Math.Distance.Between(point.x, point.y, breaker.x, breaker.y)
      if (dist < bestDist) {
        bestDist = dist
        best = index
      }
    })
    return best
  }
}
