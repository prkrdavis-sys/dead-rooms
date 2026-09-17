import Phaser from 'phaser'
import { MODE_BY_ID } from '../../data/modes'
import type { EnemyId } from '../../data/enemies'
import { TEAM_PLAYER, TEAM_SWARM } from '../actors/Actor'
import type { ModeContext, ModeController, MatchOutcome, ModeHud } from './ModeController'

const MAX_LIVE = 46

function pickCreature(wave: number): EnemyId {
  const roll = Math.random()
  if (wave <= 1) return 'shambler'
  if (wave === 2) return roll < 0.7 ? 'shambler' : 'runner'
  if (wave === 3) {
    if (roll < 0.52) return 'shambler'
    if (roll < 0.82) return 'runner'
    return 'blinker'
  }
  if (wave < 6) {
    if (roll < 0.36) return 'shambler'
    if (roll < 0.6) return 'runner'
    if (roll < 0.76) return 'blinker'
    if (roll < 0.9) return 'infernal'
    return 'bloater'
  }
  if (roll < 0.26) return 'shambler'
  if (roll < 0.48) return 'runner'
  if (roll < 0.66) return 'blinker'
  if (roll < 0.84) return 'infernal'
  return 'bloater'
}

/** The original round-based grind, now played by flashlight. */
export class Swarm implements ModeController {
  readonly id = 'swarm' as const
  private readonly ctx: ModeContext
  private queue: EnemyId[] = []
  private spawnAcc = 0
  private waveLive = false
  private betweenUntil = 0
  private wave = 0

  constructor(ctx: ModeContext) {
    this.ctx = ctx
  }

  start(): void {
    const { grid, registry, run } = this.ctx
    registry.spawnHero(run.heroId, TEAM_PLAYER, grid.playerStart.x, grid.playerStart.y, true)
    this.betweenUntil = this.ctx.scene.time.now + 1800
    this.ctx.banner('GET READY', 1600)
  }

  update(delta: number, now: number): void {
    if (this.queue.length > 0) {
      this.spawnAcc += delta
      if (this.spawnAcc > 280) {
        this.spawnAcc = 0
        const id = this.queue.shift()
        if (id) this.spawn(id)
      }
      return
    }
    const live = this.ctx.registry.livingOnTeam(TEAM_SWARM).length
    if (live > 0) return
    if (this.waveLive) {
      this.waveLive = false
      this.betweenUntil = now + 1800
      this.ctx.banner('WAVE CLEAR', 1500)
      return
    }
    if (now >= this.betweenUntil) this.startWave(now)
  }

  safeZone(): null {
    return null
  }

  onActorDown(): void {
    /* creatures report nothing; wave state is derived from the live count */
  }

  hud(): ModeHud {
    return {
      objective: MODE_BY_ID.swarm.objective,
      enemiesLeft: this.ctx.registry.livingOnTeam(TEAM_SWARM).length,
      teamsAlive: 1,
      wave: this.wave,
    }
  }

  outcome(): MatchOutcome | null {
    return null
  }

  scoreFor(kills: number, timeSec: number): number {
    return kills * 120 + this.wave * 240 + Math.round(timeSec * 3)
  }

  private startWave(now: number): void {
    this.wave += 1
    this.ctx.banner(`WAVE ${this.wave}`, 1600)
    const diff = Phaser.Math.Clamp(this.ctx.run.difficulty, 1, 10)
    const count = Math.round((3 + this.wave * 2.1) * (0.55 + diff * 0.2))
    this.queue = []
    for (let i = 0; i < count; i += 1) this.queue.push(pickCreature(this.wave))
    this.waveLive = true
    this.betweenUntil = Number.POSITIVE_INFINITY
    if (this.wave % 4 === 0) {
      const start = this.ctx.grid.playerStart
      this.ctx.spawnPickup('ammo', start.x, start.y)
      this.ctx.spawnPickup('health', start.x + 30, start.y)
    }
    void now
  }

  private spawn(id: EnemyId): void {
    const { grid, registry } = this.ctx
    if (registry.livingOnTeam(TEAM_SWARM).length >= MAX_LIVE) {
      this.queue.unshift(id)
      return
    }
    const spawns = grid.swarmSpawns
    const spot = spawns[Math.floor(Math.random() * spawns.length)] ?? grid.playerStart
    const bonus = Math.round((this.wave - 1) * 3 * (0.4 + this.ctx.run.difficulty * 0.08))
    registry.spawnCreature(id, spot.x, spot.y, bonus)
  }
}
