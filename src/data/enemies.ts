import type { CharacterPackId } from '../game/characterAssets'

export type EnemyId = 'shambler' | 'runner' | 'infernal' | 'blinker' | 'bloater'

export type EnemyAttack = 'melee' | 'fireline' | 'teleport' | 'explode'

/** Swarm-mode creatures. Squad modes use heroes on both sides instead. */
export type EnemyDef = {
  id: EnemyId
  name: string
  role: string
  hp: number
  speed: number
  damage: number
  radius: number
  scale: number
  tint: number
  pack: CharacterPackId
  attack: EnemyAttack
  score: number
  /** Distance at which the creature notices an unlit, still player. */
  senseRange: number
  telegraphMs?: number
  cooldownMs?: number
  explodeRadius?: number
  blurb: string
  tell: string
}

export const ENEMIES: EnemyDef[] = [
  {
    id: 'shambler',
    name: 'Shambler',
    role: 'Slow melee',
    hp: 40,
    speed: 62,
    damage: 8,
    radius: 14,
    scale: 1,
    tint: 0x7f9f7a,
    pack: 'zombie',
    attack: 'melee',
    score: 100,
    senseRange: 220,
    blurb:
      'The first thing the sirens were for. Too stupid to stop and too many to count. In the dark you hear the drag before you see the shape.',
    tell: 'Dragging walk, always coming straight at you.',
  },
  {
    id: 'runner',
    name: 'Runner',
    role: 'Fast melee',
    hp: 28,
    speed: 128,
    damage: 10,
    radius: 12,
    scale: 0.92,
    tint: 0xff6b6b,
    pack: 'runner',
    attack: 'melee',
    score: 150,
    senseRange: 320,
    blurb:
      'Whatever it was before, it was in a hurry. Runners find the edge of your light and are already inside it.',
    tell: 'Sprint, no hesitation, arrives before the sound does.',
  },
  {
    id: 'infernal',
    name: 'Infernal',
    role: 'Ranged line',
    hp: 60,
    speed: 74,
    damage: 16,
    radius: 14,
    scale: 1.05,
    tint: 0xfb923c,
    pack: 'blinker',
    attack: 'fireline',
    score: 240,
    senseRange: 360,
    telegraphMs: 700,
    cooldownMs: 2200,
    blurb:
      'It stands still, lines you up, and spits something that keeps burning after it lands. The wind-up is the only warning you get.',
    tell: 'Stops walking and a thin red line reaches for you.',
  },
  {
    id: 'blinker',
    name: 'Blinker',
    role: 'Teleport melee',
    hp: 46,
    speed: 96,
    damage: 14,
    radius: 13,
    scale: 0.98,
    tint: 0xc084fc,
    pack: 'wraps',
    attack: 'teleport',
    score: 260,
    senseRange: 400,
    cooldownMs: 3800,
    blurb:
      'Does not walk the distance, just decides it was never there. Blinkers make your back the most interesting part of the room.',
    tell: 'Vanishes at the edge of the cone, reappears behind you.',
  },
  {
    id: 'bloater',
    name: 'Bloater',
    role: 'Suicide blast',
    hp: 70,
    speed: 70,
    damage: 24,
    radius: 16,
    scale: 1.14,
    tint: 0xa3e635,
    pack: 'zombie',
    attack: 'explode',
    score: 280,
    senseRange: 260,
    explodeRadius: 96,
    blurb:
      'Swollen, wet, and eager. Kill it at arm length and you share the outcome. Kill it at range and the room thanks you.',
    tell: 'Fat silhouette, wobbles, keeps closing no matter the damage.',
  },
]

export const ENEMY_BY_ID: Record<EnemyId, EnemyDef> = ENEMIES.reduce(
  (acc, enemy) => {
    acc[enemy.id] = enemy
    return acc
  },
  {} as Record<EnemyId, EnemyDef>,
)
