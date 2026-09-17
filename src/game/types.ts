import type { HeroId } from '../data/heroes'
import type { MapId } from '../data/maps'
import type { ModeId } from '../data/modes'

export type RunConfig = {
  modeId: ModeId
  mapId: MapId
  heroId: HeroId
  difficulty: number
  gore: number
  music: number
  sfx: number
  profileName: string
}

export const GAME_WIDTH = 960
export const GAME_HEIGHT = 540
