import type Phaser from 'phaser'
import type { EnemyId } from '../../data/enemies'
import type { HeroId } from '../../data/heroes'
import type { Vec } from '../world/grid'

export const TEAM_PLAYER = 0
export const TEAM_SWARM = 9

export type ActorKind = 'hero' | 'creature'

export type BotGoal = 'patrol' | 'investigate' | 'engage' | 'reposition' | 'retreat'

export type BotMemory = {
  goal: BotGoal
  /** Where the bot is currently walking. */
  target: Vec
  /** Last place an enemy was seen or heard, shared across the squad. */
  contact: Vec | null
  contactAt: number
  contactId: number
  repathAt: number
  decideAt: number
  strafe: number
  holdUntil: number
}

export type CreatureMemory = {
  phase: 'chase' | 'telegraph' | 'recover'
  nextSpecial: number
  telegraphUntil: number
  dir: Vec
}

export type Actor = {
  id: number
  kind: ActorKind
  sprite: Phaser.Physics.Arcade.Sprite
  team: number
  name: string
  heroId: HeroId | null
  enemyId: EnemyId | null
  hp: number
  maxHp: number
  armor: number
  maxArmor: number
  mag: number
  reloadUntil: number
  lastHitAt: number
  cooldownUntil: number
  fireUntil: number
  facing: Vec
  moving: boolean
  /** Ready-at timestamps. */
  gadgetReadyAt: number
  gadgetActiveUntil: number
  pingReadyAt: number
  blindUntil: number
  speedMul: number
  coneMul: number
  isPlayer: boolean
  alive: boolean
  bot: BotMemory | null
  creature: CreatureMemory | null
}

export function actorSpeed(actor: Actor, base: number): number {
  return base * actor.speedMul
}

export function isReloading(actor: Actor, now: number): boolean {
  return actor.reloadUntil > now
}
