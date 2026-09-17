import Phaser from 'phaser'
import type { Actor } from '../actors/Actor'
import type { ActorRegistry } from '../actors/ActorRegistry'
import type { RoomGrid, Vec } from '../world/grid'
import { spotTarget } from './Perception'
import { stepBot, type BotContext } from './BotBrain'

type Contact = { point: Vec; at: number; targetId: number }

/**
 * Shares sightings and gunfire inside a squad, then runs each bot. A squad
 * knows only what one of its own members saw or heard.
 */
export class SquadDirector {
  private readonly grid: RoomGrid
  private readonly registry: ActorRegistry
  private readonly contacts = new Map<number, Contact>()
  private scanAcc = 0

  constructor(grid: RoomGrid, registry: ActorRegistry) {
    this.grid = grid
    this.registry = registry
  }

  /** Gunfire, pings and blasts everyone in range gets to react to. */
  reportNoise(x: number, y: number, radius: number, fromTeam: number, now: number): void {
    for (const team of this.registry.teamsAlive()) {
      if (team === fromTeam) continue
      const heard = this.registry
        .livingOnTeam(team)
        .some((actor) => Phaser.Math.Distance.Between(actor.sprite.x, actor.sprite.y, x, y) < radius)
      if (heard) this.contacts.set(team, { point: { x, y }, at: now, targetId: 0 })
    }
  }

  contactFor(team: number): Contact | null {
    return this.contacts.get(team) ?? null
  }

  update(ctx: Omit<BotContext, 'grid'>, litLamps: Vec[], delta: number): void {
    const now = ctx.now
    this.scanAcc += delta
    const scan = this.scanAcc > 90
    if (scan) this.scanAcc = 0

    const living = this.registry.living()
    for (const actor of living) {
      if (!actor.bot || actor.kind !== 'hero') continue
      let target: Actor | null = null
      if (scan) {
        target = spotTarget(this.grid, actor, living, now, litLamps)
        if (target) {
          this.contacts.set(actor.team, {
            point: { x: target.sprite.x, y: target.sprite.y },
            at: now,
            targetId: target.id,
          })
        } else {
          const shared = this.contacts.get(actor.team)
          if (shared && now - shared.at < 6500) {
            actor.bot.contact = { ...shared.point }
            actor.bot.contactAt = shared.at
          }
        }
        actor.sprite.setData('aiTarget', target ? target.id : 0)
      } else {
        const remembered = Number(actor.sprite.getData('aiTarget') ?? 0)
        target = remembered
          ? (living.find((other) => other.id === remembered && other.alive) ?? null)
          : null
      }
      stepBot(actor, target, { ...ctx, grid: this.grid })
    }
  }
}
