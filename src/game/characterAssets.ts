export const CHAR_FRAME_W = 80
export const CHAR_FRAME_H = 64
export const CHAR_STAMP = { x: 14, y: 11 }
export const CHAR_BODY = { x: 32, y: 32 }

export const CHARACTER_POSES = ['stand', 'hold', 'gun', 'machine', 'silencer', 'reload'] as const
export type CharacterPose = (typeof CHARACTER_POSES)[number]

export const CHARACTER_PACKS = [
  { id: 'soldier', folder: 'soldier', prefix: 'soldier1' },
  { id: 'zombie', folder: 'zombie', prefix: 'zoimbie1' },
  { id: 'runner', folder: 'runner', prefix: 'womanGreen' },
  { id: 'robot', folder: 'robot', prefix: 'robot1' },
  { id: 'blinker', folder: 'blinker', prefix: 'manOld' },
  { id: 'wraps', folder: 'wraps', prefix: 'manBrown' },
] as const

export type CharacterPackId = (typeof CHARACTER_PACKS)[number]['id']

export function rawTextureKey(packId: CharacterPackId, pose: CharacterPose): string {
  return `raw-${packId}-${pose}`
}

export function characterUrl(
  pack: (typeof CHARACTER_PACKS)[number],
  pose: CharacterPose,
): string {
  return `/assets/kenney/characters/${pack.folder}/${pack.prefix}_${pose}.png`
}

export function soldierSheetKey(pose: CharacterPose): string {
  return `soldier-${pose}`
}
