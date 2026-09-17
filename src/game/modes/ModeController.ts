import type Phaser from 'phaser'
import type { ModeId } from '../../data/modes'
import type { Actor } from '../actors/Actor'
import type { ActorRegistry } from '../actors/ActorRegistry'
import type { CombatSystem } from '../combat/CombatSystem'
import type { LightGrid } from '../world/LightGrid'
import type { RoomGrid } from '../world/grid'
import type { RunConfig } from '../types'

export type PickupKind = 'ammo' | 'health' | 'armor'

export type SafeZone = { x: number; y: number; radius: number }

export type ModeHud = {
  objective: string
  enemiesLeft: number
  teamsAlive: number
  wave: number
}

export type MatchOutcome = { won: boolean; reason: string }

export type ModeContext = {
  scene: Phaser.Scene
  grid: RoomGrid
  registry: ActorRegistry
  combat: CombatSystem
  lights: LightGrid
  run: RunConfig
  /** Difficulty-derived bot accuracy, 0..1. */
  skill: number
  toast: (text: string) => void
  banner: (text: string, ms: number) => void
  sfx: (key: string, volume: number) => void
  decorate: (obj: Phaser.GameObjects.GameObject) => void
  spawnPickup: (kind: PickupKind, x: number, y: number) => void
}

export interface ModeController {
  readonly id: ModeId
  start(): void
  update(delta: number, now: number): void
  safeZone(): SafeZone | null
  onActorDown(actor: Actor, killerTeam: number | null): void
  hud(): ModeHud
  /** Non-null once the match is decided. */
  outcome(): MatchOutcome | null
  scoreFor(kills: number, timeSec: number): number
}
