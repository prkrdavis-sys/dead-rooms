export type GameEventMap = {
  hud: HudState
  toast: string
  dying: boolean
  gameover: GameOverPayload
  paused: boolean
  move: { x: number; y: number }
  fire: boolean
  special: boolean
  weapon: number
  pauseToggle: boolean
  gore: number
  volumes: { music: number; sfx: number }
}

export type HudState = {
  health: number
  maxHealth: number
  kills: number
  score: number
  wave: number
  timeSec: number
  weaponName: string
  weaponSlot: number
  ammo: number
  infiniteAmmo: boolean
  specialName: string
  specialReady: number
  waveBanner: string | null
  dead: boolean
}

export type GameOverPayload = {
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
