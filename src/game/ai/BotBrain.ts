import Phaser from 'phaser'
import { HERO_BY_ID } from '../../data/heroes'
import type { Actor, BotGoal } from '../actors/Actor'
import type { CombatSystem } from '../combat/CombatSystem'
import type { GadgetSystem } from '../combat/GadgetSystem'
import { hasLineOfSight } from '../vision/raycast'
import { randomOpenTile, type RoomGrid, type Vec } from '../world/grid'
import { nextStepToward } from '../world/pathfind'

export type BotContext = {
  grid: RoomGrid
  combat: CombatSystem
  gadgets: GadgetSystem
  now: number
  /** Royale ring, when the mode has one. */
  safeZone: { x: number; y: number; radius: number } | null
  skill: number
}

/** Preferred fighting distance per weapon, so a marksman does not walk into a shotgun. */
function preferredRange(actor: Actor): number {
  if (!actor.heroId) return 180
  const hero = HERO_BY_ID[actor.heroId]
  switch (hero.weapon.kind) {
    case 'rail':
      return 420
    case 'shot':
      return 110
    case 'silenced':
      return 170
    case 'auto':
    case 'burst':
      return 240
    default: {
      const _never: never = hero.weapon.kind
      return _never
    }
  }
}

function steer(actor: Actor, ctx: BotContext, to: Vec, speed: number): void {
  const step =
    nextStepToward(ctx.grid, { x: actor.sprite.x, y: actor.sprite.y }, to) ?? to
  const dx = step.x - actor.sprite.x
  const dy = step.y - actor.sprite.y
  const len = Math.hypot(dx, dy)
  if (len < 4) {
    actor.sprite.setVelocity(0, 0)
    actor.moving = false
    return
  }
  actor.sprite.setVelocity((dx / len) * speed, (dy / len) * speed)
  actor.moving = true
}

function face(actor: Actor, x: number, y: number): void {
  const dx = x - actor.sprite.x
  const dy = y - actor.sprite.y
  const len = Math.hypot(dx, dy) || 1
  actor.facing.x = dx / len
  actor.facing.y = dy / len
}

function outsideZone(actor: Actor, ctx: BotContext): boolean {
  if (!ctx.safeZone) return false
  return (
    Phaser.Math.Distance.Between(actor.sprite.x, actor.sprite.y, ctx.safeZone.x, ctx.safeZone.y) >
    ctx.safeZone.radius * 0.82
  )
}

function chooseGoal(actor: Actor, target: Actor | null, ctx: BotContext, now: number): BotGoal {
  if (outsideZone(actor, ctx)) return 'reposition'
  if (target) return actor.hp < actor.maxHp * 0.32 ? 'retreat' : 'engage'
  const memory = actor.bot
  if (memory?.contact && now - memory.contactAt < 6500) return 'investigate'
  return 'patrol'
}

/**
 * One bot decision per frame. Bots only act on what their own cone or their
 * squad's reported contacts give them, so a dark flank still works on them.
 */
export function stepBot(actor: Actor, target: Actor | null, ctx: BotContext): void {
  const memory = actor.bot
  if (!memory || !actor.heroId || !actor.alive) return
  const hero = HERO_BY_ID[actor.heroId]
  const speed = hero.speed * actor.speedMul
  const now = ctx.now

  if (now < actor.blindUntil) {
    if (now > memory.decideAt) {
      memory.decideAt = now + 500
      const angle = Math.random() * Math.PI * 2
      memory.target = {
        x: actor.sprite.x + Math.cos(angle) * 90,
        y: actor.sprite.y + Math.sin(angle) * 90,
      }
    }
    steer(actor, ctx, memory.target, speed * 0.5)
    return
  }

  memory.goal = chooseGoal(actor, target, ctx, now)
  if (target) {
    memory.contact = { x: target.sprite.x, y: target.sprite.y }
    memory.contactAt = now
    memory.contactId = target.id
  }

  const goal = memory.goal
  switch (goal) {
    case 'engage': {
      if (!target) break
      const dist = Phaser.Math.Distance.Between(
        actor.sprite.x,
        actor.sprite.y,
        target.sprite.x,
        target.sprite.y,
      )
      const want = preferredRange(actor)
      face(actor, target.sprite.x, target.sprite.y)
      if (now > memory.decideAt) {
        memory.decideAt = now + 700
        memory.strafe = Math.random() < 0.5 ? -1 : 1
      }
      if (dist > want * 1.15) {
        steer(actor, ctx, { x: target.sprite.x, y: target.sprite.y }, speed)
      } else if (dist < want * 0.6) {
        const away = Math.atan2(actor.sprite.y - target.sprite.y, actor.sprite.x - target.sprite.x)
        actor.sprite.setVelocity(Math.cos(away) * speed, Math.sin(away) * speed)
        actor.moving = true
      } else {
        const side = Math.atan2(target.sprite.y - actor.sprite.y, target.sprite.x - actor.sprite.x) +
          (Math.PI / 2) * memory.strafe
        actor.sprite.setVelocity(Math.cos(side) * speed * 0.7, Math.sin(side) * speed * 0.7)
        actor.moving = true
      }
      const aimOk = hasLineOfSight(
        ctx.grid,
        actor.sprite.x,
        actor.sprite.y,
        target.sprite.x,
        target.sprite.y,
      )
      if (aimOk && dist < want * 1.6 && Math.random() < ctx.skill) {
        ctx.combat.fire(actor, now)
      }
      if (now >= actor.gadgetReadyAt && Math.random() < 0.02) ctx.gadgets.use(actor, now)
      break
    }
    case 'investigate': {
      const spot = memory.contact
      if (!spot) break
      face(actor, spot.x, spot.y)
      steer(actor, ctx, spot, speed * 0.85)
      if (
        Phaser.Math.Distance.Between(actor.sprite.x, actor.sprite.y, spot.x, spot.y) < 40 ||
        now - memory.contactAt > 6000
      ) {
        memory.contact = null
      }
      if (actor.mag < HERO_BY_ID[actor.heroId].weapon.mag * 0.4) ctx.combat.startReload(actor, now)
      break
    }
    case 'retreat': {
      const spot = memory.contact
      if (spot) {
        const away = Math.atan2(actor.sprite.y - spot.y, actor.sprite.x - spot.x)
        const to = {
          x: actor.sprite.x + Math.cos(away) * 160,
          y: actor.sprite.y + Math.sin(away) * 160,
        }
        face(actor, to.x, to.y)
        steer(actor, ctx, to, speed)
        if (target && Math.random() < ctx.skill * 0.4) {
          face(actor, target.sprite.x, target.sprite.y)
          ctx.combat.fire(actor, now)
        }
      }
      if (now >= actor.gadgetReadyAt) ctx.gadgets.use(actor, now)
      break
    }
    case 'reposition': {
      const zone = ctx.safeZone
      if (!zone) break
      face(actor, zone.x, zone.y)
      steer(actor, ctx, { x: zone.x, y: zone.y }, speed)
      break
    }
    case 'patrol': {
      if (now > memory.repathAt ||
        Phaser.Math.Distance.Between(actor.sprite.x, actor.sprite.y, memory.target.x, memory.target.y) < 40) {
        memory.repathAt = now + 4200
        memory.target = randomOpenTile(ctx.grid, [{ x: actor.sprite.x, y: actor.sprite.y }], 180)
      }
      face(actor, memory.target.x, memory.target.y)
      steer(actor, ctx, memory.target, speed * 0.72)
      if (actor.mag < HERO_BY_ID[actor.heroId].weapon.mag) ctx.combat.startReload(actor, now)
      if (now >= actor.pingReadyAt && Math.random() < 0.004) ctx.gadgets.usePing(actor, now)
      break
    }
    default: {
      const _never: never = goal
      void _never
    }
  }
}
