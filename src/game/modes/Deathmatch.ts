import { HERO_IDS, type HeroId } from '../../data/heroes'
import { MODE_BY_ID } from '../../data/modes'
import { TEAM_PLAYER, type Actor } from '../actors/Actor'
import type { ModeContext, ModeController, MatchOutcome, ModeHud } from './ModeController'

const SQUAD_SIZE = 3

function pickHeroes(exclude: HeroId | null, count: number): HeroId[] {
  const pool = HERO_IDS.filter((id) => id !== exclude)
  const out: HeroId[] = []
  for (let i = 0; i < count; i += 1) {
    out.push(pool[Math.floor(Math.random() * pool.length)] ?? 'grit')
  }
  return out
}

/** Your squad against the other squads in the building. No respawns, no radar. */
export class Deathmatch implements ModeController {
  readonly id = 'deathmatch' as const
  private readonly ctx: ModeContext
  private enemyTeams: number[] = []

  constructor(ctx: ModeContext) {
    this.ctx = ctx
  }

  start(): void {
    const { grid, registry, run } = this.ctx
    const playerSpawns = grid.squadSpawns[0]
    registry.spawnHero(run.heroId, TEAM_PLAYER, grid.playerStart.x, grid.playerStart.y, true)
    const mates = pickHeroes(run.heroId, SQUAD_SIZE - 1)
    mates.forEach((heroId, index) => {
      const spot = playerSpawns[(index + 1) % playerSpawns.length] ?? grid.playerStart
      registry.spawnHero(heroId, TEAM_PLAYER, spot.x, spot.y, false)
    })

    const squadCount = run.difficulty >= 7 ? 3 : run.difficulty >= 4 ? 2 : 1
    for (let team = 1; team <= squadCount; team += 1) {
      this.enemyTeams.push(team)
      const spawns = grid.squadSpawns[team] ?? playerSpawns
      pickHeroes(null, SQUAD_SIZE).forEach((heroId, index) => {
        const spot = spawns[index % spawns.length]
        registry.spawnHero(heroId, team, spot.x, spot.y, false)
      })
    }
    this.ctx.banner(`${squadCount + 1} SQUADS · LIGHTS OUT`, 2200)
  }

  update(): void {
    /* squads are driven by the director; nothing per-frame here */
  }

  safeZone(): null {
    return null
  }

  onActorDown(actor: Actor, killerTeam: number | null): void {
    if (actor.team === TEAM_PLAYER && !actor.isPlayer) {
      this.ctx.toast(`${actor.name} is down`)
      return
    }
    if (killerTeam === TEAM_PLAYER && this.ctx.registry.livingOnTeam(actor.team).length === 0) {
      this.ctx.banner('SQUAD WIPED', 1400)
    }
  }

  hud(): ModeHud {
    const registry = this.ctx.registry
    return {
      objective: MODE_BY_ID.deathmatch.objective,
      enemiesLeft: registry.livingEnemiesOf(TEAM_PLAYER).length,
      teamsAlive: registry.teamsAlive().length,
      wave: 0,
    }
  }

  outcome(): MatchOutcome | null {
    const registry = this.ctx.registry
    if (registry.livingEnemiesOf(TEAM_PLAYER).length === 0) {
      return { won: true, reason: 'Last squad standing' }
    }
    return null
  }

  scoreFor(kills: number, timeSec: number): number {
    return kills * 260 + Math.max(0, 600 - timeSec * 4)
  }
}
