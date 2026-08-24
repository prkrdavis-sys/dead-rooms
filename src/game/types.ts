import type { MapId } from '../data/maps'
import type { SpecialId } from '../data/specials'

export type RunConfig = {
  mapId: MapId
  specialId: SpecialId
  difficulty: number
  gore: number
  music: number
  sfx: number
  profileName: string
}

export const GAME_WIDTH = 960
export const GAME_HEIGHT = 540
export const PLAYER_MAX_HP = 100
