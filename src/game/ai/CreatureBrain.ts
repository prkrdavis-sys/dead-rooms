import Phaser from 'phaser'
import { ENEMY_BY_ID } from '../../data/enemies'
import type { Actor } from '../actors/Actor'
import { blockedAtPixel, randomOpenTile, type RoomGrid } from '../world/grid'
import { nextStepToward } from '../world/pathfind'

export type CreatureContext = {
  grid: RoomGrid
  now: number
  telegraph: Phaser.GameObjects.Graphics
  shoot: (x: number, y: number, dirX: number, dirY: number, damage: number) => void
}

/** Swarm creatures: they hunt by smell, so darkness does not save you for long. */
export function stepCreature(actor: Actor, target: Actor | null, ctx: CreatureContext): void {
  const memory = actor.creature
  if (!memory || !actor.enemyId || !actor.alive) return
  const def = ENEMY_BY_ID[actor.enemyId]
  const sprite = actor.sprite
  const now = ctx.now

  if (!target || !target.alive) {
    sprite.setVelocity(0, 0)
    actor.moving = false
    return
  }

  const dx = target.sprite.x - sprite.x
  const dy = target.sprite.y - sprite.y
  const dist = Math.hypot(dx, dy) || 1
  const nx = dx / dist
  const ny = dy / dist
  const aware = dist < def.senseRange * (target.moving ? 1.6 : 1) || actor.lastHitAt > now - 4000

  if (!aware) {
    if (now > memory.nextSpecial) {
      memory.nextSpecial = now + 2600
      const wander = randomOpenTile(ctx.grid, [{ x: sprite.x, y: sprite.y }], 120)
      memory.dir = { x: wander.x, y: wander.y }
    }
    const step = nextStepToward(ctx.grid, { x: sprite.x, y: sprite.y }, memory.dir) ?? memory.dir
    const wdx = step.x - sprite.x
    const wdy = step.y - sprite.y
    const wlen = Math.hypot(wdx, wdy) || 1
    sprite.setVelocity((wdx / wlen) * def.speed * 0.4, (wdy / wlen) * def.speed * 0.4)
    sprite.setRotation(Math.atan2(wdy, wdx))
    actor.facing = { x: wdx / wlen, y: wdy / wlen }
    actor.moving = true
    return
  }

  actor.facing = { x: nx, y: ny }
  sprite.setRotation(Math.atan2(ny, nx))
  actor.moving = true

  if (def.attack === 'fireline') {
    if (memory.phase === 'telegraph') {
      sprite.setVelocity(0, 0)
      actor.moving = false
      ctx.telegraph.lineStyle(2, 0xfb7185, 0.7)
      ctx.telegraph.lineBetween(
        sprite.x,
        sprite.y,
        sprite.x + memory.dir.x * 340,
        sprite.y + memory.dir.y * 340,
      )
      if (now >= memory.telegraphUntil) {
        memory.phase = 'recover'
        memory.nextSpecial = now + (def.cooldownMs ?? 2200)
        ctx.shoot(sprite.x, sprite.y, memory.dir.x, memory.dir.y, def.damage)
      }
      return
    }
    if (memory.phase === 'recover' && now < memory.nextSpecial) {
      sprite.setVelocity(nx * def.speed * 0.35, ny * def.speed * 0.35)
      return
    }
    if (dist < 300 && now >= memory.nextSpecial) {
      memory.phase = 'telegraph'
      memory.telegraphUntil = now + (def.telegraphMs ?? 700)
      memory.dir = { x: nx, y: ny }
      sprite.setVelocity(0, 0)
      actor.moving = false
      return
    }
  }

  if (def.attack === 'teleport' && now >= memory.nextSpecial && dist > 90) {
    memory.nextSpecial = now + (def.cooldownMs ?? 3800)
    const angle = Math.random() * Math.PI * 2
    const hop = 70 + Math.random() * 50
    const tx = target.sprite.x + Math.cos(angle) * hop
    const ty = target.sprite.y + Math.sin(angle) * hop
    if (!blockedAtPixel(ctx.grid, tx, ty)) {
      sprite.setAlpha(0.25)
      sprite.setPosition(tx, ty)
      sprite.scene.tweens.add({ targets: sprite, alpha: 1, duration: 160 })
    }
  }

  const step =
    dist > 120
      ? (nextStepToward(ctx.grid, { x: sprite.x, y: sprite.y }, { x: target.sprite.x, y: target.sprite.y }) ?? {
          x: target.sprite.x,
          y: target.sprite.y,
        })
      : { x: target.sprite.x, y: target.sprite.y }
  const sdx = step.x - sprite.x
  const sdy = step.y - sprite.y
  const slen = Math.hypot(sdx, sdy) || 1
  sprite.setVelocity((sdx / slen) * def.speed, (sdy / slen) * def.speed)
}
