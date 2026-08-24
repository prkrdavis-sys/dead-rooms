export type EnemyId =
  | 'shambler'
  | 'runner'
  | 'infernal'
  | 'blinker'
  | 'wraps'
  | 'bloater'

export type EnemyAttack = 'melee' | 'fireline' | 'teleport' | 'explode'

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
  texture: string
  attack: EnemyAttack
  score: number
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
    tint: 0xffffff,
    texture: 'zombie-hold',
    attack: 'melee',
    score: 100,
    blurb:
      'The first thing the sirens were for. Grey-green, hungry, and too stupid to stop. Alone they are a limp. In a crowd they are a wall.',
    tell: 'Dragging walk, green rags, always coming straight at you.',
  },
  {
    id: 'runner',
    name: 'Runner',
    role: 'Fast melee',
    hp: 28,
    speed: 145,
    damage: 10,
    radius: 12,
    scale: 0.92,
    tint: 0xff6b6b,
    texture: 'runner-hold',
    attack: 'melee',
    score: 140,
    blurb:
      'Whatever is left of the sprinters from Block C. They outrun your panic and fold you if you reload in the open.',
    tell: 'Lean, blood-slick, sprints in a straight line. Kill them first.',
  },
  {
    id: 'infernal',
    name: 'Infernal',
    role: 'Ranged fire line',
    hp: 90,
    speed: 48,
    damage: 22,
    radius: 15,
    scale: 1.05,
    tint: 0xff4a1a,
    texture: 'robot-hold',
    attack: 'fireline',
    score: 220,
    telegraphMs: 700,
    cooldownMs: 2400,
    blurb:
      'Not a corpse. A leftover from the burn teams that never came home. It plants its feet, lights a line, and anything in that line cooks.',
    tell: 'Horns of heat, red glow, a bright line on the floor before the flame.',
  },
  {
    id: 'blinker',
    name: 'Blinker',
    role: 'Teleport bite',
    hp: 55,
    speed: 80,
    damage: 14,
    radius: 13,
    scale: 0.98,
    tint: 0xc4b5fd,
    texture: 'blinker-hold',
    attack: 'teleport',
    score: 180,
    cooldownMs: 3800,
    blurb:
      'Pale, wrong, and never where you left it. It folds space the way a hungry thing folds a napkin, then bites the nearest pulse.',
    tell: 'Violet shimmer, vanishes, reappears at your shoulder.',
  },
  {
    id: 'wraps',
    name: 'Wraps',
    role: 'Heavy melee',
    hp: 110,
    speed: 54,
    damage: 20,
    radius: 16,
    scale: 1.12,
    tint: 0xe8d5b5,
    texture: 'wraps-hold',
    attack: 'melee',
    score: 200,
    blurb:
      'Quarantine linen that learned to walk. Slow until it is close, then it hits like a sandbag full of bricks. Later waves drop them in your pocket.',
    tell: 'Bandaged bulk, beige wraps, a heavy shoulder-check.',
  },
  {
    id: 'bloater',
    name: 'Bloater',
    role: 'Walking bomb',
    hp: 70,
    speed: 44,
    damage: 12,
    radius: 18,
    scale: 1.32,
    tint: 0x86efac,
    texture: 'zombie-hold',
    attack: 'explode',
    explodeRadius: 86,
    score: 160,
    blurb:
      'A Shambler that drank the wrong drum. Kill it, but step off the punchline — the body is a grenade with opinions.',
    tell: 'Swollen, sickly green, wet footsteps. Death is the attack.',
  },
]

export const ENEMY_BY_ID: Record<EnemyId, EnemyDef> = ENEMIES.reduce(
  (acc, enemy) => {
    acc[enemy.id] = enemy
    return acc
  },
  {} as Record<EnemyId, EnemyDef>,
)
