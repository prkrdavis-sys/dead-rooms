import type { CharacterPackId, CharacterPose } from '../game/characterAssets'

export type HeroId = 'slip' | 'vane' | 'levee' | 'grit' | 'ward' | 'hush'

export type GadgetId = 'echo' | 'focus' | 'bulwark' | 'flashbang' | 'beacon' | 'lightsout'

export type WeaponKind = 'auto' | 'burst' | 'shot' | 'rail' | 'silenced'

export type HeroWeapon = {
  name: string
  kind: WeaponKind
  damage: number
  cooldownMs: number
  mag: number
  reloadMs: number
  /** Pixels per second. Rail weapons ignore this and hit instantly. */
  speed: number
  pellets: number
  spread: number
  bulletKey: string
  flashKey: string
  pose: CharacterPose
  sfx: string
  /** Silenced guns never paint a muzzle flash on an enemy screen. */
  silenced: boolean
  /** How far the shot carries to a listening bot, in pixels. */
  noise: number
}

export type GadgetDef = {
  id: GadgetId
  name: string
  /** Fits the HUD dial. */
  short: string
  cooldownMs: number
  blurb: string
}

export type HeroDef = {
  id: HeroId
  name: string
  role: string
  pack: CharacterPackId
  /** Team colours override this in match, but the Library and thumbs use it. */
  color: number
  hp: number
  armor: number
  armorRegenDelayMs: number
  armorRegenPerSec: number
  speed: number
  cone: { range: number; spreadDeg: number }
  weapon: HeroWeapon
  gadget: GadgetDef
  blurb: string
  tell: string
}

export const HEROES: HeroDef[] = [
  {
    id: 'slip',
    name: 'Slip',
    role: 'Scout',
    pack: 'runner',
    color: 0x4ade80,
    hp: 80,
    armor: 30,
    armorRegenDelayMs: 3200,
    armorRegenPerSec: 14,
    speed: 252,
    cone: { range: 300, spreadDeg: 96 },
    weapon: {
      name: 'Stutter SMG',
      kind: 'auto',
      damage: 7,
      cooldownMs: 88,
      mag: 30,
      reloadMs: 1200,
      speed: 620,
      pellets: 1,
      spread: 0.07,
      bulletKey: 'bullet',
      flashKey: 'muzzle-light',
      pose: 'machine',
      sfx: 'laser2',
      silenced: false,
      noise: 520,
    },
    gadget: {
      id: 'echo',
      short: 'Echo',
      name: 'Deep Echo',
      cooldownMs: 7000,
      blurb: 'A hard sonar slap. Everything breathing gets outlined through the walls — including you.',
    },
    blurb:
      'Moves like a rumour and dies like one. Slip owns the first forty seconds of any room, then has to be somewhere else.',
    tell: 'Wide, shallow light and footsteps you hear before you see.',
  },
  {
    id: 'vane',
    name: 'Vane',
    role: 'Marksman',
    pack: 'blinker',
    color: 0x38bdf8,
    hp: 80,
    armor: 20,
    armorRegenDelayMs: 4000,
    armorRegenPerSec: 10,
    speed: 178,
    cone: { range: 580, spreadDeg: 32 },
    weapon: {
      name: 'Long Vane',
      kind: 'rail',
      damage: 58,
      cooldownMs: 980,
      mag: 5,
      reloadMs: 2100,
      speed: 0,
      pellets: 1,
      spread: 0,
      bulletKey: 'slug',
      flashKey: 'muzzle-rail',
      pose: 'silencer',
      sfx: 'zap1',
      silenced: false,
      noise: 720,
    },
    gadget: {
      id: 'focus',
      short: 'Focus',
      name: 'Focus',
      cooldownMs: 9000,
      blurb: 'Narrows the beam to a needle and doubles its reach. For a few seconds you own one hallway completely.',
    },
    blurb:
      'A survey tech who learned that a long lane is a promise. Vane needs the corridor and nothing in it.',
    tell: 'A thin blade of light reaching much further than it should.',
  },
  {
    id: 'levee',
    name: 'Levee',
    role: 'Brawler',
    pack: 'survivor',
    color: 0xf59e0b,
    hp: 150,
    armor: 90,
    armorRegenDelayMs: 3600,
    armorRegenPerSec: 18,
    speed: 168,
    cone: { range: 232, spreadDeg: 124 },
    weapon: {
      name: 'Doorbreaker',
      kind: 'shot',
      damage: 10,
      cooldownMs: 700,
      mag: 6,
      reloadMs: 2200,
      speed: 520,
      pellets: 7,
      spread: 0.44,
      bulletKey: 'pellet',
      flashKey: 'muzzle-heavy',
      pose: 'silencer',
      sfx: 'laser3',
      silenced: false,
      noise: 640,
    },
    gadget: {
      id: 'bulwark',
      short: 'Wall',
      name: 'Bulwark',
      cooldownMs: 8000,
      blurb: 'Drops a plated panel that stops bullets and light. Cut a room in half and take the half you want.',
    },
    blurb:
      'Hit the door first, apologise never. Levee eats the opening burst so somebody else can shoot back.',
    tell: 'Broad, stubby light and a walk you can hear through a wall.',
  },
  {
    id: 'grit',
    name: 'Grit',
    role: 'Assault',
    pack: 'soldier',
    color: 0xfb7185,
    hp: 110,
    armor: 55,
    armorRegenDelayMs: 3400,
    armorRegenPerSec: 14,
    speed: 202,
    cone: { range: 336, spreadDeg: 76 },
    weapon: {
      name: 'Service Rifle',
      kind: 'burst',
      damage: 12,
      cooldownMs: 140,
      mag: 25,
      reloadMs: 1500,
      speed: 660,
      pellets: 1,
      spread: 0.04,
      bulletKey: 'bullet',
      flashKey: 'muzzle-light',
      pose: 'machine',
      sfx: 'laser1',
      silenced: false,
      noise: 600,
    },
    gadget: {
      id: 'flashbang',
      short: 'Flash',
      name: 'Flashbang',
      cooldownMs: 7500,
      blurb: 'Bleaches every cone in the blast. Blind operators keep shooting, just not at anything.',
    },
    blurb:
      'The one who actually read the manual. No trick, no gimmick, just an honest rifle pointed at the loudest noise.',
    tell: 'Even light, steady three-round rhythm.',
  },
  {
    id: 'ward',
    name: 'Ward',
    role: 'Support',
    pack: 'robot',
    color: 0xa78bfa,
    hp: 100,
    armor: 45,
    armorRegenDelayMs: 2600,
    armorRegenPerSec: 16,
    speed: 194,
    cone: { range: 296, spreadDeg: 88 },
    weapon: {
      name: 'Lantern Carbine',
      kind: 'burst',
      damage: 14,
      cooldownMs: 230,
      mag: 18,
      reloadMs: 1400,
      speed: 600,
      pellets: 1,
      spread: 0.05,
      bulletKey: 'bullet',
      flashKey: 'muzzle-light',
      pose: 'gun',
      sfx: 'laser1',
      silenced: false,
      noise: 560,
    },
    gadget: {
      id: 'beacon',
      short: 'Beacon',
      name: 'Beacon',
      cooldownMs: 8500,
      blurb: 'Plants a burning lamp that patches the squad while it stands. It also tells the map exactly where you are.',
    },
    blurb:
      'Half medic, half lighting rig. Ward keeps the squad standing and the room readable, which is not the same as safe.',
    tell: 'A soft halo that follows the squad around.',
  },
  {
    id: 'hush',
    name: 'Hush',
    role: 'Assassin',
    pack: 'wraps',
    color: 0x94a3b8,
    hp: 90,
    armor: 25,
    armorRegenDelayMs: 2800,
    armorRegenPerSec: 12,
    speed: 216,
    cone: { range: 262, spreadDeg: 62 },
    weapon: {
      name: 'Quiet Nine',
      kind: 'silenced',
      damage: 21,
      cooldownMs: 300,
      mag: 12,
      reloadMs: 1300,
      speed: 640,
      pellets: 1,
      spread: 0.02,
      bulletKey: 'bullet',
      flashKey: 'muzzle-hush',
      pose: 'gun',
      sfx: 'laser4',
      silenced: true,
      noise: 140,
    },
    gadget: {
      id: 'lightsout',
      short: 'Dark',
      name: 'Lights Out',
      cooldownMs: 9500,
      blurb: 'Kills every fixture nearby and drops your own light with them. Whatever was watching now guesses.',
    },
    blurb:
      'Learned in the dark wards that the safest place to stand is inside somebody else assumption. Hush never announces.',
    tell: 'No muzzle flash, no noise, then your armour is gone.',
  },
]

export const HERO_BY_ID: Record<HeroId, HeroDef> = HEROES.reduce(
  (acc, hero) => {
    acc[hero.id] = hero
    return acc
  },
  {} as Record<HeroId, HeroDef>,
)

export const HERO_IDS: HeroId[] = HEROES.map((hero) => hero.id)

/** Long-cooldown action every hero carries, independent of their gadget. */
export const UNIVERSAL_PING = {
  name: 'Echo Ping',
  cooldownMs: 13000,
  range: 460,
  revealMs: 1100,
  /** Distance at which the ping gives your own position away. */
  selfRevealRange: 620,
}
