import Phaser from 'phaser'
import { HERO_BY_ID } from '../../data/heroes'
import { ENEMY_BY_ID } from '../../data/enemies'
import type { Actor } from '../actors/Actor'
import { hasLineOfSight } from '../vision/raycast'
import type { RoomGrid, Vec } from '../world/grid'

/** Standing still and holding fire makes you much harder to pick out of the dark. */
const STILL_FACTOR = 0.45
const LAMP_EXPOSE_RADIUS = 150

export function coneOf(actor: Actor): { range: number; spread: number } {
  if (actor.heroId) {
    const hero = HERO_BY_ID[actor.heroId]
    return {
      range: hero.cone.range * actor.coneMul,
      spread: Phaser.Math.DegToRad(hero.cone.spreadDeg),
    }
  }
  if (actor.enemyId) {
    return { range: ENEMY_BY_ID[actor.enemyId].senseRange, spread: Math.PI * 2 }
  }
  return { range: 220, spread: Math.PI }
}

export function canSee(
  grid: RoomGrid,
  viewer: Actor,
  target: Actor,
  now: number,
  litLamps: Vec[],
): boolean {
  if (!viewer.alive || !target.alive) return false
  if (now < viewer.blindUntil) return false
  const cone = coneOf(viewer)
  const dx = target.sprite.x - viewer.sprite.x
  const dy = target.sprite.y - viewer.sprite.y
  const dist = Math.hypot(dx, dy)

  const exposed =
    target.moving ||
    now < target.fireUntil + 350 ||
    litLamps.some(
      (lamp) =>
        Phaser.Math.Distance.Between(lamp.x, lamp.y, target.sprite.x, target.sprite.y) <
        LAMP_EXPOSE_RADIUS,
    )
  const range = cone.range * (exposed ? 1 : STILL_FACTOR)
  if (dist > range) return false

  if (cone.spread < Math.PI * 2 - 0.01) {
    const delta = Math.abs(
      Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - Math.atan2(viewer.facing.y, viewer.facing.x)),
    )
    if (delta > cone.spread / 2) return false
  }
  return hasLineOfSight(grid, viewer.sprite.x, viewer.sprite.y, target.sprite.x, target.sprite.y)
}

/** Nearest enemy the viewer can actually see right now. */
export function spotTarget(
  grid: RoomGrid,
  viewer: Actor,
  candidates: Actor[],
  now: number,
  litLamps: Vec[],
): Actor | null {
  let best: Actor | null = null
  let bestDist = Number.POSITIVE_INFINITY
  for (const candidate of candidates) {
    if (candidate.team === viewer.team || !candidate.alive) continue
    if (!canSee(grid, viewer, candidate, now, litLamps)) continue
    const dist = Phaser.Math.Distance.Between(
      viewer.sprite.x,
      viewer.sprite.y,
      candidate.sprite.x,
      candidate.sprite.y,
    )
    if (dist < bestDist) {
      bestDist = dist
      best = candidate
    }
  }
  return best
}
