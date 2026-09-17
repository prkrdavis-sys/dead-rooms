import type { ModeId } from '../data/modes'

export type GameEventMap = {
  hud: HudState
  toast: string
  dying: boolean
  gameover: GameOverPayload
  paused: boolean
  move: { x: number; y: number }
  fire: boolean
  gadget: boolean
  ping: boolean
  reload: boolean
  pauseToggle: boolean
  gore: number
  volumes: { music: number; sfx: number }
}

export type SquadSlot = {
  name: string
  hp: number
  maxHp: number
  alive: boolean
  isPlayer: boolean
}

export type HudState = {
  modeId: ModeId
  heroName: string
  weaponName: string
  health: number
  maxHealth: number
  armor: number
  maxArmor: number
  mag: number
  magSize: number
  reloading: boolean
  gadgetName: string
  gadgetReady: number
  pingReady: number
  kills: number
  score: number
  wave: number
  timeSec: number
  objective: string
  enemiesLeft: number
  teamsAlive: number
  squad: SquadSlot[]
  banner: string | null
  blackout: boolean
  dead: boolean
}

export type GameOverPayload = {
  modeId: ModeId
  won: boolean
  reason: string
  kills: number
  timeSec: number
  wave: number
  score: number
}

type Handler<T> = (payload: T) => void

class Bus {
  private listeners = new Map<string, Set<(payload: unknown) => void>>()

  on<K extends keyof GameEventMap>(event: K, handler: Handler<GameEventMap[K]>): () => void {
    const key = String(event)
    const set = this.listeners.get(key) ?? new Set()
    const wrapped = handler as (payload: unknown) => void
    set.add(wrapped)
    this.listeners.set(key, set)
    return () => {
      set.delete(wrapped)
    }
  }

  emit<K extends keyof GameEventMap>(event: K, payload: GameEventMap[K]): void {
    const set = this.listeners.get(String(event))
    if (!set) return
    for (const handler of set) handler(payload)
  }
}

export const bus = new Bus()
