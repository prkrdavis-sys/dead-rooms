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
  musicOn: boolean
  sfxOn: boolean
  music: number
  sfx: number
  gore: number
}

export const VOLUME_LEVELS = [
  { id: 'quiet', label: 'Quiet', value: 0.25 },
  { id: 'medium', label: 'Medium', value: 0.5 },
  { id: 'loud', label: 'Loud', value: 0.85 },
] as const

export const GORE_LEVELS = [
  { id: 'off', label: 'Off', value: 0 },
  { id: 'light', label: 'Light', value: 25 },
  { id: 'normal', label: 'Normal', value: 50 },
  { id: 'heavy', label: 'Heavy', value: 75 },
  { id: 'max', label: 'Max', value: 100 },
] as const

const VOLUME_STEPS = VOLUME_LEVELS.map((level) => level.value)
const GORE_STEPS = GORE_LEVELS.map((level) => level.value)

function nearestStep(value: number, steps: number[]): number {
  return steps.reduce((best, step) => (Math.abs(step - value) < Math.abs(best - value) ? step : best), steps[0])
}

export function effectiveMusic(settings: Settings): number {
  return settings.musicOn ? settings.music : 0
}

export function effectiveSfx(settings: Settings): number {
  return settings.sfxOn ? settings.sfx : 0
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
  musicOn: true,
  sfxOn: true,
  music: 0.5,
  sfx: 0.85,
  gore: 50,
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
  const defaults = defaultSettings()
  const musicValue = stored?.music ?? defaults.music
  const sfxValue = stored?.sfx ?? defaults.sfx
  return {
    musicOn: stored?.musicOn ?? musicValue > 0,
    sfxOn: stored?.sfxOn ?? sfxValue > 0,
    music: nearestStep(musicValue, VOLUME_STEPS),
    sfx: nearestStep(sfxValue, VOLUME_STEPS),
    gore: nearestStep(stored?.gore ?? defaults.gore, GORE_STEPS),
  }
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
