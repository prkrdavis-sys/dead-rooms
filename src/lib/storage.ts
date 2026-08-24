const SETTINGS_KEY = 'deadrooms.settings'
const PROFILES_KEY = 'deadrooms.profiles'

export type ProfileStats = {
  gamesPlayed: number
  totalKills: number
  totalTimeSec: number
  bestKills: number
  bestTimeSec: number
  bestScore: number
  bestWave: number
  deaths: number
}

export type Profile = {
  id: string
  name: string
  createdAt: number
  stats: ProfileStats
}

export type Settings = {
  music: number
  sfx: number
  gore: number
}

export type ProfileState = {
  activeId: string
  profiles: Profile[]
}

const defaultStats = (): ProfileStats => ({
  gamesPlayed: 0,
  totalKills: 0,
  totalTimeSec: 0,
  bestKills: 0,
  bestTimeSec: 0,
  bestScore: 0,
  bestWave: 0,
  deaths: 0,
})

const defaultSettings = (): Settings => ({
  music: 0.45,
  sfx: 0.7,
  gore: 55,
})

function uid(): string {
  return `p_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function loadSettings(): Settings {
  const stored = readJson<Partial<Settings>>(SETTINGS_KEY)
  return { ...defaultSettings(), ...stored }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function loadProfiles(): ProfileState {
  const stored = readJson<ProfileState>(PROFILES_KEY)
  if (stored?.profiles?.length && stored.activeId) {
    return stored
  }
  const first: Profile = {
    id: uid(),
    name: 'Survivor',
    createdAt: Date.now(),
    stats: defaultStats(),
  }
  const state = { activeId: first.id, profiles: [first] }
  saveProfiles(state)
  return state
}

export function saveProfiles(state: ProfileState): void {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(state))
}

export function addProfile(state: ProfileState, name: string): ProfileState {
  const profile: Profile = {
    id: uid(),
    name: name.trim() || `Survivor ${state.profiles.length + 1}`,
    createdAt: Date.now(),
    stats: defaultStats(),
  }
  return {
    activeId: profile.id,
    profiles: [...state.profiles, profile],
  }
}

export function renameProfile(state: ProfileState, id: string, name: string): ProfileState {
  return {
    ...state,
    profiles: state.profiles.map((profile) =>
      profile.id === id ? { ...profile, name: name.trim() || profile.name } : profile,
    ),
  }
}

export function recordRun(
  state: ProfileState,
  payload: { kills: number; timeSec: number; wave: number; score: number },
): ProfileState {
  return {
    ...state,
    profiles: state.profiles.map((profile) => {
      if (profile.id !== state.activeId) return profile
      const stats = profile.stats
      return {
        ...profile,
        stats: {
          gamesPlayed: stats.gamesPlayed + 1,
          totalKills: stats.totalKills + payload.kills,
          totalTimeSec: stats.totalTimeSec + payload.timeSec,
          bestKills: Math.max(stats.bestKills, payload.kills),
          bestTimeSec: Math.max(stats.bestTimeSec, payload.timeSec),
          bestScore: Math.max(stats.bestScore, payload.score),
          bestWave: Math.max(stats.bestWave, payload.wave),
          deaths: stats.deaths + 1,
        },
      }
    }),
  }
}

export function activeProfile(state: ProfileState): Profile {
  return state.profiles.find((profile) => profile.id === state.activeId) ?? state.profiles[0]
}
