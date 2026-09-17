import type { RoomGrid } from '../world/grid'
import { rayDistance } from './raycast'

export type ConeSpec = {
  x: number
  y: number
  /** Facing angle in radians. */
  angle: number
  /** Full cone width in radians. Use `Math.PI * 2` for a lamp. */
  spread: number
  range: number
}

/**
 * Fans rays across the cone and returns a flat polygon (x, y pairs) hugging
 * whatever geometry stops the light.
 */
export function conePolygon(grid: RoomGrid, cone: ConeSpec, rays: number): number[] {
  const full = cone.spread >= Math.PI * 2 - 0.01
  const count = Math.max(6, rays)
  const points: number[] = []
  if (!full) points.push(cone.x, cone.y)
  const start = cone.angle - cone.spread / 2
  const stepCount = full ? count : count - 1
  for (let i = 0; i < count; i += 1) {
    const a = start + (cone.spread * i) / stepCount
    const dx = Math.cos(a)
    const dy = Math.sin(a)
    const reach = rayDistance(grid, cone.x, cone.y, dx, dy, cone.range)
    points.push(cone.x + dx * reach, cone.y + dy * reach)
  }
  return points
}
