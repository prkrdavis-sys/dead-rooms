export type ModeId = 'deathmatch' | 'royale' | 'extraction' | 'swarm'

export type ModeDef = {
  id: ModeId
  name: string
  tagline: string
  objective: string
  how: string
}

export const MODES: ModeDef[] = [
  {
    id: 'deathmatch',
    name: 'Squad Blackout',
    tagline: 'You and two operators against the other squads in the building. No respawns.',
    objective: 'Last squad lit standing',
    how: 'Share your squad light, shoot what steps into it, and remember that your own flashlight is a target.',
  },
  {
    id: 'royale',
    name: 'Lockdown',
    tagline: 'Everyone is solo, the safe floor keeps shrinking, and the lights are going out one room at a time.',
    objective: 'Be the last one breathing',
    how: 'Loot armour and mags off the floor, stay inside the ring, and let the others find each other first.',
  },
  {
    id: 'extraction',
    name: 'Blackbox',
    tagline: 'One case of intel somewhere in the dark. Two hunting squads. One way out.',
    objective: 'Grab the case, reach the exit pad',
    how: 'The case is not marked. Sweep rooms, take it, then survive the walk back with everyone knowing where you are going.',
  },
  {
    id: 'swarm',
    name: 'Swarm',
    tagline: 'The old game, in the new dark. Waves of infected, one hero, no squad.',
    objective: 'Survive the waves',
    how: 'Rounds escalate. Lights and reloads matter more than they used to.',
  },
]

export const MODE_BY_ID: Record<ModeId, ModeDef> = MODES.reduce(
  (acc, mode) => {
    acc[mode.id] = mode
    return acc
  },
  {} as Record<ModeId, ModeDef>,
)
