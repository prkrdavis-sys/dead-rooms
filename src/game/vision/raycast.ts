import { TILE } from '../../data/maps'
import type { RoomGrid } from '../world/grid'

/**
 * Walks the tile grid with a DDA march and returns the distance in pixels
 * until the ray hits a wall, capped at `maxDist`.
 */
export function rayDistance(
  grid: RoomGrid,
  originX: number,
  originY: number,
  dirX: number,
  dirY: number,
  maxDist: number,
): number {
  let c = Math.floor(originX / TILE)
  let r = Math.floor(originY / TILE)
  if (c < 0 || r < 0 || c >= grid.cols || r >= grid.rows) return 0
  if (grid.blocked[r]?.[c]) return 0

  const stepX = dirX > 0 ? 1 : -1
  const stepY = dirY > 0 ? 1 : -1
  const invX = dirX === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / dirX)
  const invY = dirY === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / dirY)

  const nextBoundaryX = (dirX > 0 ? (c + 1) * TILE : c * TILE) - originX
  const nextBoundaryY = (dirY > 0 ? (r + 1) * TILE : r * TILE) - originY
  let tx = dirX === 0 ? Number.POSITIVE_INFINITY : Math.abs(nextBoundaryX) * invX
  let ty = dirY === 0 ? Number.POSITIVE_INFINITY : Math.abs(nextBoundaryY) * invY
  const deltaX = invX * TILE
  const deltaY = invY * TILE

  for (let guard = 0; guard < 256; guard += 1) {
    if (tx < ty) {
      if (tx > maxDist) return maxDist
      c += stepX
      if (c < 0 || c >= grid.cols || grid.blocked[r]?.[c]) return Math.min(tx, maxDist)
      tx += deltaX
    } else {
      if (ty > maxDist) return maxDist
      r += stepY
      if (r < 0 || r >= grid.rows || grid.blocked[r]?.[c]) return Math.min(ty, maxDist)
      ty += deltaY
    }
  }
  return maxDist
}

/** True when nothing solid sits between the two points. */
export function hasLineOfSight(
  grid: RoomGrid,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): boolean {
  const dx = toX - fromX
  const dy = toY - fromY
  const dist = Math.hypot(dx, dy)
  if (dist < 1) return true
  const reach = rayDistance(grid, fromX, fromY, dx / dist, dy / dist, dist)
  return reach >= dist - 1
}
