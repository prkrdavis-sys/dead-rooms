export const TILE = 48

export type MapId = 'warehouse' | 'corridors' | 'courts' | 'strip' | 'castle'

export type RoomMap = {
  id: MapId
  name: string
  tagline: string
  rows: string[]
}

export const MAPS: RoomMap[] = [
  {
    id: 'warehouse',
    name: 'Warehouse',
    tagline: 'A big empty box. Kite, strafe, do not get pinned in the middle.',
    rows: [
      '####################',
      '#S................S#',
      '#..................#',
      '#......####........#',
      '#......####........#',
      '#..................#',
      '#........P.........#',
      '#..................#',
      '#..................#',
      '#S................S#',
      '####################',
    ],
  },
  {
    id: 'corridors',
    name: 'Corridors',
    tagline: 'Tight halls. Shotguns and mines live here. Runners will punish a reload.',
    rows: [
      '#####################',
      '#S....#.....#......S#',
      '#.###.#.###.#.#####.#',
      '#.#...#.#...#.....#.#',
      '#.#.###.#.#####.#.#.#',
      '#.#.....#...P...#...#',
      '#.#####.#####.###.#.#',
      '#.....#.....#.....#.#',
      '#####.#.###.#####.#.#',
      '#S....#.....#......S#',
      '#####################',
    ],
  },
  {
    id: 'courts',
    name: 'Four Courts',
    tagline: 'Four rooms, one hub. Clear a court, rotate, do not let them own two doors.',
    rows: [
      '#################',
      '#S.....#.......S#',
      '#......#........#',
      '#......#........#',
      '###..#####..#####',
      '#........#......#',
      '#...P....#......#',
      '#........#......#',
      '#####..#####..###',
      '#........#......#',
      '#S.......#.....S#',
      '#################',
    ],
  },
  {
    id: 'strip',
    name: 'The Strip',
    tagline: 'A long rectangle. Rails and rockets farm the lane. Getting surrounded is on you.',
    rows: [
      '##############################',
      '#S..........................S#',
      '#............................#',
      '#............P...............#',
      '#............................#',
      '#S..........................S#',
      '##############################',
    ],
  },
  {
    id: 'castle',
    name: 'Castle',
    tagline: 'Inner keep, outer ring. Hold the hole or get walked on from both sides.',
    rows: [
      '#####################',
      '#S.................S#',
      '#..###############..#',
      '#..#S.....#.....S#..#',
      '#..#......#......#..#',
      '#..###..#####..###..#',
      '#............P......#',
      '#..###..#####..###..#',
      '#..#......#......#..#',
      '#..#S.....#.....S#..#',
      '#..###############..#',
      '#S.................S#',
      '#####################',
    ],
  },
]

export const MAP_BY_ID: Record<MapId, RoomMap> = MAPS.reduce(
  (acc, room) => {
    acc[room.id] = room
    return acc
  },
  {} as Record<MapId, RoomMap>,
)

export function mapPixelSize(room: RoomMap): { width: number; height: number } {
  const width = room.rows[0]?.length ?? 0
  return { width: width * TILE, height: room.rows.length * TILE }
}
