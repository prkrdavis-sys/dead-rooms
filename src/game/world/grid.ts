import { TILE, type RoomMap } from '../../data/maps'

export type Vec = { x: number; y: number }

export type RoomGrid = {
  cols: number
  rows: number
  blocked: boolean[][]
  /** Legacy swarm spawn points, marked `S`. */
  swarmSpawns: Vec[]
  /** Squad rally points, marked `1`-`4`. Index 0 is the player squad. */
  squadSpawns: Vec[][]
  lamps: Vec[]
  breakers: Vec[]
  exits: Vec[]
  playerStart: Vec
  openTiles: Vec[]
}

export function buildGrid(room: RoomMap): RoomGrid {
  const rows = room.rows.length
  const cols = room.rows[0]?.length ?? 0
  const grid: RoomGrid = {
    cols,
    rows,
    blocked: [],
    swarmSpawns: [],
    squadSpawns: [[], [], [], []],
    lamps: [],
    breakers: [],
    exits: [],
    playerStart: { x: TILE * 1.5, y: TILE * 1.5 },
    openTiles: [],
  }

  for (let r = 0; r < rows; r += 1) {
    grid.blocked[r] = []
    const line = room.rows[r] ?? ''
    for (let c = 0; c < cols; c += 1) {
      const ch = line[c] ?? '#'
      const solid = ch === '#'
      grid.blocked[r][c] = solid
      const point = { x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 }
      if (!solid) grid.openTiles.push(point)
      switch (ch) {
        case 'P':
          grid.playerStart = point
          grid.squadSpawns[0].push(point)
          break
        case 'S':
          grid.swarmSpawns.push(point)
          break
        case 'L':
          grid.lamps.push(point)
          break
        case 'B':
          grid.breakers.push(point)
          break
        case 'E':
          grid.exits.push(point)
          break
        case '1':
        case '2':
        case '3':
        case '4':
          grid.squadSpawns[Number(ch) - 1].push(point)
          break
        default:
          break
      }
    }
  }

  grid.openTiles = reachableTiles(grid)
  if (grid.swarmSpawns.length === 0) grid.swarmSpawns.push(grid.playerStart)
  for (let team = 0; team < grid.squadSpawns.length; team += 1) {
    if (grid.squadSpawns[team].length === 0) {
      grid.squadSpawns[team].push(grid.openTiles[team] ?? grid.playerStart)
    }
  }
  return grid
}

/** Floor tiles actually walkable from the player start, so sealed pockets never host spawns. */
function reachableTiles(grid: RoomGrid): Vec[] {
  const startC = Math.floor(grid.playerStart.x / TILE)
  const startR = Math.floor(grid.playerStart.y / TILE)
  const seen = grid.blocked.map((row) => row.map(() => false))
  const stack: Array<[number, number]> = [[startC, startR]]
  const out: Vec[] = []
  if (!seen[startR]) return grid.openTiles
  seen[startR][startC] = true
  while (stack.length > 0) {
    const next = stack.pop()
    if (!next) break
    const [c, r] = next
    out.push(tileCenter(c, r))
    const steps: Array<[number, number]> = [
      [c + 1, r],
      [c - 1, r],
      [c, r + 1],
      [c, r - 1],
    ]
    for (const [nc, nr] of steps) {
      if (nr < 0 || nc < 0 || nr >= grid.rows || nc >= grid.cols) continue
      if (seen[nr][nc] || grid.blocked[nr][nc]) continue
      seen[nr][nc] = true
      stack.push([nc, nr])
    }
  }
  return out
}

export function blockedAtPixel(grid: RoomGrid, x: number, y: number): boolean {
  const c = Math.floor(x / TILE)
  const r = Math.floor(y / TILE)
  if (r < 0 || c < 0 || r >= grid.rows || c >= grid.cols) return true
  return Boolean(grid.blocked[r]?.[c])
}

export function tileOf(x: number, y: number): { c: number; r: number } {
  return { c: Math.floor(x / TILE), r: Math.floor(y / TILE) }
}

export function tileCenter(c: number, r: number): Vec {
  return { x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 }
}

export function gridPixelSize(grid: RoomGrid): { width: number; height: number } {
  return { width: grid.cols * TILE, height: grid.rows * TILE }
}

/** A random open tile at least `minDist` pixels away from every point in `away`. */
export function randomOpenTile(grid: RoomGrid, away: Vec[], minDist: number): Vec {
  const pool = grid.openTiles
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const pick = pool[Math.floor(Math.random() * pool.length)]
    if (!pick) break
    const tooClose = away.some((point) => Math.hypot(point.x - pick.x, point.y - pick.y) < minDist)
    if (!tooClose) return pick
  }
  return pool[Math.floor(Math.random() * pool.length)] ?? grid.playerStart
}
