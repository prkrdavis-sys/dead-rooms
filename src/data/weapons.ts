export const WEAPON_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const
export type WeaponSlot = (typeof WEAPON_SLOTS)[number]

export type WeaponKind = 'gun' | 'spread' | 'rail' | 'throw' | 'rocket' | 'place'

export type PlaceableId = 'barrel' | 'wall' | 'mine' | 'charge'

export type WeaponId =
  | 'pistol'
  | 'smg'
  | 'shotgun'
  | 'barrel'
  | 'grenade'
  | 'barricade'
  | 'mine'
  | 'rocket'
  | 'charge'
  | 'railgun'

export type WeaponDef = {
  id: WeaponId
  slot: WeaponSlot
  keyLabel: string
  name: string
  short: string
  kind: WeaponKind
  damage: number
  cooldownMs: number
  ammoMax: number
  infiniteAmmo: boolean
  speed: number
  pellets?: number
  spread?: number
  radius?: number
  pierce?: number
  place?: PlaceableId
  unlockedByDefault: boolean
  blurb: string
}

export const WEAPONS: WeaponDef[] = [
  {
    id: 'pistol',
    slot: 1,
    keyLabel: '1',
    name: 'Sidearm',
    short: 'Pistol',
    kind: 'gun',
    damage: 18,
    cooldownMs: 220,
    ammoMax: 999,
    infiniteAmmo: true,
    speed: 520,
    unlockedByDefault: true,
    blurb:
      'The last honest gun in the quarantine. Infinite rounds, modest punch. When everything else clicks empty, this is still in your hand.',
  },
  {
    id: 'smg',
    slot: 2,
    keyLabel: '2',
    name: 'Spray SMG',
    short: 'SMG',
    kind: 'gun',
    damage: 10,
    cooldownMs: 70,
    ammoMax: 180,
    infiniteAmmo: false,
    speed: 580,
    unlockedByDefault: true,
    blurb:
      'A stolen subgun that eats magazines. Terrible at distance, perfect when the hallway fills with teeth.',
  },
  {
    id: 'shotgun',
    slot: 3,
    keyLabel: '3',
    name: 'Scattergun',
    short: 'Shotgun',
    kind: 'spread',
    damage: 12,
    cooldownMs: 480,
    ammoMax: 36,
    infiniteAmmo: false,
    speed: 500,
    pellets: 6,
    spread: 0.42,
    unlockedByDefault: true,
    blurb:
      'Six pellets, one bad decision for anything standing in a doorway. Best friends with corners.',
  },
  {
    id: 'barrel',
    slot: 4,
    keyLabel: '4',
    name: 'Red Drum',
    short: 'Barrel',
    kind: 'place',
    damage: 70,
    cooldownMs: 350,
    ammoMax: 8,
    infiniteAmmo: false,
    speed: 0,
    radius: 92,
    place: 'barrel',
    unlockedByDefault: true,
    blurb:
      'Industrial drums left behind by the cleanup crews. Place one, shoot it, and the room learns a new color. The blast does not care who you are.',
  },
  {
    id: 'grenade',
    slot: 5,
    keyLabel: '5',
    name: 'Frag',
    short: 'Grenade',
    kind: 'throw',
    damage: 55,
    cooldownMs: 700,
    ammoMax: 12,
    infiniteAmmo: false,
    speed: 280,
    radius: 88,
    unlockedByDefault: true,
    blurb:
      'A cooked pineapple with a short fuse. Bounce it down a strip of floor and do not stand in the punchline.',
  },
  {
    id: 'barricade',
    slot: 6,
    keyLabel: '6',
    name: 'Fake Wall',
    short: 'Wall',
    kind: 'place',
    damage: 0,
    cooldownMs: 400,
    ammoMax: 10,
    infiniteAmmo: false,
    speed: 0,
    place: 'wall',
    unlockedByDefault: true,
    blurb:
      'Prefab quarantine panels. They will not last, but they will make a Shambler take the long way around.',
  },
  {
    id: 'mine',
    slot: 7,
    keyLabel: '7',
    name: 'Trip Mine',
    short: 'Mine',
    kind: 'place',
    damage: 60,
    cooldownMs: 450,
    ammoMax: 10,
    infiniteAmmo: false,
    speed: 0,
    radius: 80,
    place: 'mine',
    unlockedByDefault: true,
    blurb:
      'Arms after a heartbeat. Anything that walks into the click becomes a rumor. You are not immune.',
  },
  {
    id: 'rocket',
    slot: 8,
    keyLabel: '8',
    name: 'Tube',
    short: 'Rocket',
    kind: 'rocket',
    damage: 80,
    cooldownMs: 900,
    ammoMax: 8,
    infiniteAmmo: false,
    speed: 340,
    radius: 100,
    unlockedByDefault: true,
    blurb:
      'A shoulder tube that turns a packed room into a crater. Backblast is a myth. The splash is not.',
  },
  {
    id: 'charge',
    slot: 9,
    keyLabel: '9',
    name: 'Charge Pack',
    short: 'Charge',
    kind: 'place',
    damage: 90,
    cooldownMs: 400,
    ammoMax: 6,
    infiniteAmmo: false,
    speed: 0,
    radius: 110,
    place: 'charge',
    unlockedByDefault: true,
    blurb:
      'Stick it, walk away, hold fire to detonate every pack you planted. The old demolition teams called this “conversation.”',
  },
  {
    id: 'railgun',
    slot: 10,
    keyLabel: '0',
    name: 'Rail Lance',
    short: 'Rail',
    kind: 'rail',
    damage: 90,
    cooldownMs: 850,
    ammoMax: 12,
    infiniteAmmo: false,
    speed: 0,
    pierce: 8,
    unlockedByDefault: true,
    blurb:
      'A stolen survey laser rewired to cook meat. One line, many bodies. The wall at the far end still loses.',
  },
]

export const WEAPON_BY_SLOT: Record<WeaponSlot, WeaponDef> = WEAPONS.reduce(
  (acc, weapon) => {
    acc[weapon.slot] = weapon
    return acc
  },
  {} as Record<WeaponSlot, WeaponDef>,
)

export const WEAPON_BY_ID: Record<WeaponId, WeaponDef> = WEAPONS.reduce(
  (acc, weapon) => {
    acc[weapon.id] = weapon
    return acc
  },
  {} as Record<WeaponId, WeaponDef>,
)

export function slotFromKeyboard(code: string): WeaponSlot | null {
  switch (code) {
    case 'Digit1':
    case 'Numpad1':
      return 1
    case 'Digit2':
    case 'Numpad2':
      return 2
    case 'Digit3':
    case 'Numpad3':
      return 3
    case 'Digit4':
    case 'Numpad4':
      return 4
    case 'Digit5':
    case 'Numpad5':
      return 5
    case 'Digit6':
    case 'Numpad6':
      return 6
    case 'Digit7':
    case 'Numpad7':
      return 7
    case 'Digit8':
    case 'Numpad8':
      return 8
    case 'Digit9':
    case 'Numpad9':
      return 9
    case 'Digit0':
    case 'Numpad0':
      return 10
    default:
      return null
  }
}
