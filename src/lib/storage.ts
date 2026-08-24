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

export type VolumeLevelId = 'quiet' | 'medium' | 'loud'
export type GoreLevelId = 'off' | 'light' | 'normal' | 'heavy' | 'max'
export type DifficultyId = 'warmup' | 'standard' | 'tough' | 'grinder'

export type LevelOption<TId extends string> = {
  id: TId
  label: string
  value: number
}

export function volumeLevelValue(id: VolumeLevelId): number {
  switch (id) {
    case 'quiet':
      return 0.25
    case 'medium':
      return 0.5
    case 'loud':
      return 0.85
    default: {
      const _exhaustive: never = id
      return _exhaustive
    }
  }
}

export function goreLevelValue(id: GoreLevelId): number {
  switch (id) {
    case 'off':
      return 0
    case 'light':
      return 25
    case 'normal':
      return 50
    case 'heavy':
      return 75
    case 'max':
      return 100
    default: {
      const _exhaustive: never = id
      return _exhaustive
    }
  }
}

export function difficultyValue(id: DifficultyId): number {
  switch (id) {
    case 'warmup':
      return 1
    case 'standard':
      return 4
    case 'tough':
      return 7
    case 'grinder':
      return 10
    default: {
      const _exhaustive: never = id
      return _exhaustive
    }
  }
}

export const VOLUME_LEVELS: readonly LevelOption<VolumeLevelId>[] = [
  { id: 'quiet', label: 'Quiet', value: volumeLevelValue('quiet') },
  { id: 'medium', label: 'Medium', value: volumeLevelValue('medium') },
  { id: 'loud', label: 'Loud', value: volumeLevelValue('loud') },
]

export const GORE_LEVELS: readonly LevelOption<GoreLevelId>[] = [
  { id: 'off', label: 'Off', value: goreLevelValue('off') },
  { id: 'light', label: 'Light', value: goreLevelValue('light') },
  { id: 'normal', label: 'Normal', value: goreLevelValue('normal') },
  { id: 'heavy', label: 'Heavy', value: goreLevelValue('heavy') },
  { id: 'max', label: 'Max', value: goreLevelValue('max') },
]

export const DIFFICULTY_LEVELS: readonly LevelOption<DifficultyId>[] = [
  { id: 'warmup', label: 'Warm-up', value: difficultyValue('warmup') },
  { id: 'standard', label: 'Standard', value: difficultyValue('standard') },
  { id: 'tough', label: 'Tough', value: difficultyValue('tough') },
  { id: 'grinder', label: 'Meat grinder', value: difficultyValue('grinder') },
]

function nearestStep(value: number, steps: number[]): number {
  return steps.reduce((best, step) => (Math.abs(step - value) < Math.abs(best - value) ? step : best), steps[0])
}

function nearestLevelValue<TId extends string>(
  value: number,
  levels: readonly LevelOption<TId>[],
): number {
  return nearestStep(
    value,
    levels.map((level) => level.value),
  )
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
  music: volumeLevelValue('medium'),
  sfx: volumeLevelValue('loud'),
  gore: goreLevelValue('normal'),
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
    music: nearestLevelValue(musicValue, VOLUME_LEVELS),
    sfx: nearestLevelValue(sfxValue, VOLUME_LEVELS),
    gore: nearestLevelValue(stored?.gore ?? defaults.gore, GORE_LEVELS),
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
