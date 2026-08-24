export type SpecialId = 'dash' | 'airstrike' | 'stomp'

export type SpecialDef = {
  id: SpecialId
  name: string
  cooldownMs: number
  blurb: string
  how: string
}

export const SPECIALS: SpecialDef[] = [
  {
    id: 'dash',
    name: 'Burst Dash',
    cooldownMs: 2400,
    blurb: 'A short, mean sprint. You clip through the first bite and come out the other side.',
    how: 'Hold a direction, tap special. Brief i-frames and a speed spike.',
  },
  {
    id: 'airstrike',
    name: 'Red Flare',
    cooldownMs: 9000,
    blurb: 'You pop a flare down the line you are facing. Three seconds later the ceiling answers.',
    how: 'Marks a circle ahead of you, then drops a heavy blast. Friendly fire is on.',
  },
  {
    id: 'stomp',
    name: 'Riot Stomp',
    cooldownMs: 4200,
    blurb: 'When they have your belt, you remind the floor who paid for it.',
    how: 'Point-blank shockwave. Knocks the pack off you and chips everything in the ring.',
  },
]

export const SPECIAL_BY_ID: Record<SpecialId, SpecialDef> = SPECIALS.reduce(
  (acc, special) => {
    acc[special.id] = special
    return acc
  },
  {} as Record<SpecialId, SpecialDef>,
)
