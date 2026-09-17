import { TILE } from '../../data/maps'
import { tileCenter, type RoomGrid, type Vec } from './grid'

/**
 * Breadth-first search back from the goal so bots can follow walls and
 * doorways instead of grinding into them. Returns the next tile centre to
 * steer toward, or null when the goal is unreachable.
 */
export function nextStepToward(
  grid: RoomGrid,
  from: Vec,
  to: Vec,
): Vec | null {
  const startC = Math.floor(from.x / TILE)
  const startR = Math.floor(from.y / TILE)
  const goalC = Math.floor(to.x / TILE)
  const goalR = Math.floor(to.y / TILE)
  if (startC === goalC && startR === goalR) return { x: to.x, y: to.y }
  if (grid.blocked[goalR]?.[goalC] !== false) return null

  const width = grid.cols
  const prev = new Int32Array(width * grid.rows).fill(-1)
  const queue: number[] = [goalR * width + goalC]
  prev[goalR * width + goalC] = goalR * width + goalC
  let head = 0
  while (head < queue.length) {
    const index = queue[head]
    head += 1
    const c = index % width
    const r = Math.floor(index / width)
    if (c === startC && r === startR) {
      const step = prev[index]
      return tileCenter(step % width, Math.floor(step / width))
    }
    const steps: Array<[number, number]> = [
      [c + 1, r],
      [c - 1, r],
      [c, r + 1],
      [c, r - 1],
    ]
    for (const [nc, nr] of steps) {
      if (nr < 0 || nc < 0 || nr >= grid.rows || nc >= width) continue
      if (grid.blocked[nr][nc]) continue
      const nIndex = nr * width + nc
      if (prev[nIndex] !== -1) continue
      prev[nIndex] = index
      queue.push(nIndex)
    }
  }
  return null
}
