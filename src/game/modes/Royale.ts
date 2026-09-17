import Phaser from 'phaser'
import { HERO_IDS } from '../../data/heroes'
import { MODE_BY_ID } from '../../data/modes'
import { TILE } from '../../data/maps'
import { TEAM_PLAYER, type Actor } from '../actors/Actor'
import { randomOpenTile, type Vec } from '../world/grid'
import type { ModeContext, ModeController, MatchOutcome, ModeHud, SafeZone } from './ModeController'

const SHRINK_EVERY_MS = 24000
const WARN_MS = 4000
const ZONE_DPS = 7

/** Everyone solo, the floor keeps shrinking, and the lamps go with it. */
export class Royale implements ModeController {
  readonly id = 'royale' as const
  private readonly ctx: ModeContext
  private readonly ring: Phaser.GameObjects.Graphics
  private zone: SafeZone = { x: 0, y: 0, radius: 0 }
  private targetRadius = 0
  private nextShrinkAt = 0
  private warned = false
  private damageAcc = 0

  constructor(ctx: ModeContext) {
    this.ctx = ctx
    this.ring = ctx.scene.add.graphics().setDepth(23)
  }

  start(): void {
    const { grid, registry, run, scene } = this.ctx
    registry.spawnHero(run.heroId, TEAM_PLAYER, grid.playerStart.x, grid.playerStart.y, true)

    // Small buildings cannot hold a full lobby without everyone landing on
    // top of each other, so the count follows the floor space.
    const rivals = Math.min(7 + Math.round(this.ctx.run.difficulty / 2), Math.floor(grid.openTiles.length / 36))
    const taken = [grid.playerStart]
    for (let i = 0; i < rivals; i += 1) {
      const spot = this.spreadSpawn(taken)
      taken.push(spot)
      const heroId = HERO_IDS[Math.floor(Math.random() * HERO_IDS.length)] ?? 'grit'
      registry.spawnHero(heroId, i + 1, spot.x, spot.y, false)
    }

    for (let i = 0; i < 14; i += 1) {
      const spot = randomOpenTile(grid, [grid.playerStart], 120)
      const kind = i % 3 === 0 ? 'health' : i % 3 === 1 ? 'armor' : 'ammo'
      this.ctx.spawnPickup(kind, spot.x, spot.y)
    }

    const width = grid.cols * TILE
    const height = grid.rows * TILE
    this.zone = { x: width / 2, y: height / 2, radius: Math.hypot(width, height) / 2 }
    this.targetRadius = this.zone.radius
    this.nextShrinkAt = scene.time.now + SHRINK_EVERY_MS
    this.ctx.banner(`${rivals + 1} IN THE DARK`, 2200)
  }

  /**
   * Nobody should be able to walk into somebody else's opening burst. Rivals
   * keep well clear of the player and loosely clear of each other.
   */
  private spreadSpawn(taken: Vec[]): Vec {
    const player = taken[0]
    let best = taken[0]
    let bestScore = -1
    for (let attempt = 0; attempt < 90; attempt += 1) {
      const pick = randomOpenTile(this.ctx.grid, [], 0)
      const fromPlayer = Phaser.Math.Distance.Between(pick.x, pick.y, player.x, player.y)
      const fromOthers = taken
        .slice(1)
        .reduce(
          (min, point) => Math.min(min, Phaser.Math.Distance.Between(pick.x, pick.y, point.x, point.y)),
          Number.POSITIVE_INFINITY,
        )
      if (fromPlayer > 560 && fromOthers > 260) return pick
      const score = Math.min(fromPlayer, fromOthers === Number.POSITIVE_INFINITY ? fromPlayer : fromOthers)
      if (score > bestScore) {
        bestScore = score
        best = pick
      }
    }
    return best
  }

  update(delta: number, now: number): void {
    if (!this.warned && now > this.nextShrinkAt - WARN_MS) {
      this.warned = true
      this.ctx.toast('The ring is closing')
      this.ctx.sfx('empty', 0.3)
    }
    if (now >= this.nextShrinkAt) {
      this.nextShrinkAt = now + SHRINK_EVERY_MS
      this.warned = false
      this.targetRadius = Math.max(190, this.targetRadius * 0.7)
      const drift = TILE * 2
      this.zone.x += Phaser.Math.Between(-drift, drift)
      this.zone.y += Phaser.Math.Between(-drift, drift)
      this.ctx.lights.killLightsNear(this.zone.x, this.zone.y, this.targetRadius * 2.4)
    }
    this.zone.radius += (this.targetRadius - this.zone.radius) * Math.min(1, delta / 2200)

    this.ring.clear()
    this.ring.lineStyle(4, 0xe879f9, 0.55)
    this.ring.strokeCircle(this.zone.x, this.zone.y, this.zone.radius)

    this.damageAcc += delta
    if (this.damageAcc < 500) return
    const tickSeconds = this.damageAcc / 1000
    this.damageAcc = 0
    for (const actor of this.ctx.registry.living()) {
      const dist = Phaser.Math.Distance.Between(actor.sprite.x, actor.sprite.y, this.zone.x, this.zone.y)
      if (dist <= this.zone.radius) continue
      this.ctx.combat.damage(actor, ZONE_DPS * tickSeconds, this.ctx.scene.time.now, null)
    }
  }

  safeZone(): SafeZone {
    return this.zone
  }

  onActorDown(actor: Actor, killerTeam: number | null): void {
    if (killerTeam !== TEAM_PLAYER) return
    const left = this.ctx.registry.livingEnemiesOf(TEAM_PLAYER).length
    this.ctx.toast(`${actor.name} down · ${left} left`)
  }

  hud(): ModeHud {
    const registry = this.ctx.registry
    return {
      objective: MODE_BY_ID.royale.objective,
      enemiesLeft: registry.livingEnemiesOf(TEAM_PLAYER).length,
      teamsAlive: registry.teamsAlive().length,
      wave: 0,
    }
  }

  outcome(): MatchOutcome | null {
    if (this.ctx.registry.livingEnemiesOf(TEAM_PLAYER).length === 0) {
      return { won: true, reason: 'Last one breathing' }
    }
    return null
  }

  scoreFor(kills: number, timeSec: number): number {
    return kills * 220 + Math.round(timeSec * 6)
  }
}
