import Phaser from 'phaser'
import { HERO_IDS, type HeroId } from '../../data/heroes'
import { MODE_BY_ID } from '../../data/modes'
import { TEAM_PLAYER, type Actor } from '../actors/Actor'
import { randomOpenTile, type Vec } from '../world/grid'
import type { ModeContext, ModeController, MatchOutcome, ModeHud } from './ModeController'

const PICKUP_RADIUS = 30

/** One case of intel in the dark, two hunting squads, one pad to reach. */
export class Extraction implements ModeController {
  readonly id = 'extraction' as const
  private readonly ctx: ModeContext
  private caseSprite: Phaser.GameObjects.Image | null = null
  private padSprite: Phaser.GameObjects.Image | null = null
  private pad: Vec = { x: 0, y: 0 }
  private carrying = false
  private extracted = false

  constructor(ctx: ModeContext) {
    this.ctx = ctx
  }

  start(): void {
    const { grid, registry, run, scene } = this.ctx
    registry.spawnHero(run.heroId, TEAM_PLAYER, grid.playerStart.x, grid.playerStart.y, true)
    const mateId: HeroId = HERO_IDS.filter((id) => id !== run.heroId)[
      Math.floor(Math.random() * (HERO_IDS.length - 1))
    ] ?? 'ward'
    const mateSpot = grid.squadSpawns[0][1] ?? grid.playerStart
    registry.spawnHero(mateId, TEAM_PLAYER, mateSpot.x, mateSpot.y, false)

    for (let team = 1; team <= 2; team += 1) {
      const spawns = grid.squadSpawns[team] ?? grid.squadSpawns[0]
      for (let i = 0; i < 3; i += 1) {
        const heroId = HERO_IDS[Math.floor(Math.random() * HERO_IDS.length)] ?? 'grit'
        const spot = spawns[i % spawns.length]
        registry.spawnHero(heroId, team, spot.x, spot.y, false)
      }
    }

    const casePoint = randomOpenTile(grid, [grid.playerStart], 340)
    this.caseSprite = scene.add.image(casePoint.x, casePoint.y, 'intel').setDepth(6)
    this.ctx.decorate(this.caseSprite)

    const exits = grid.exits.length > 0 ? grid.exits : [grid.playerStart]
    this.pad = exits[Math.floor(Math.random() * exits.length)]
    this.ctx.banner('FIND THE CASE', 2400)
  }

  update(): void {
    const player = this.ctx.registry.player()
    if (!player || !player.alive) return

    if (!this.carrying && this.caseSprite) {
      const dist = Phaser.Math.Distance.Between(
        player.sprite.x,
        player.sprite.y,
        this.caseSprite.x,
        this.caseSprite.y,
      )
      if (dist < PICKUP_RADIUS) {
        this.carrying = true
        this.caseSprite.destroy()
        this.caseSprite = null
        this.ctx.sfx('pickup', 0.5)
        this.ctx.banner('CASE IN HAND · GET OUT', 2400)
        this.padSprite = this.ctx.scene.add.image(this.pad.x, this.pad.y, 'exit-pad').setDepth(5)
        this.ctx.scene.tweens.add({
          targets: this.padSprite,
          alpha: { from: 0.45, to: 1 },
          duration: 700,
          yoyo: true,
          repeat: -1,
        })
        for (const hunter of this.ctx.registry.livingEnemiesOf(TEAM_PLAYER)) {
          if (!hunter.bot) continue
          hunter.bot.contact = { x: player.sprite.x, y: player.sprite.y }
          hunter.bot.contactAt = this.ctx.scene.time.now
        }
      }
      return
    }

    if (this.carrying && !this.extracted) {
      const dist = Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, this.pad.x, this.pad.y)
      if (dist < 46) this.extracted = true
    }
  }

  safeZone(): null {
    return null
  }

  onActorDown(actor: Actor): void {
    if (actor.team === TEAM_PLAYER && !actor.isPlayer) this.ctx.toast(`${actor.name} is down`)
  }

  hud(): ModeHud {
    return {
      objective: this.carrying ? 'Reach the exit pad' : MODE_BY_ID.extraction.objective,
      enemiesLeft: this.ctx.registry.livingEnemiesOf(TEAM_PLAYER).length,
      teamsAlive: this.ctx.registry.teamsAlive().length,
      wave: 0,
    }
  }

  outcome(): MatchOutcome | null {
    if (this.extracted) return { won: true, reason: 'Extracted with the case' }
    return null
  }

  scoreFor(kills: number, timeSec: number): number {
    const bonus = this.extracted ? 1200 : this.carrying ? 400 : 0
    return kills * 180 + bonus + Math.max(0, 400 - timeSec * 2)
  }
}
