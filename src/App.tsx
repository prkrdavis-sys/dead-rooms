import { useEffect, useState } from 'react'
import type { RunConfig } from './game/types'
import { music } from './lib/music'
import {
  activeProfile,
  difficultyValue,
  effectiveMusic,
  effectiveSfx,
  loadProfiles,
  loadSettings,
  recordRun,
  saveProfiles,
  type ProfileState,
  type Settings,
} from './lib/storage'
import { bus } from './lib/bus'
import { LibraryModal } from './ui/LibraryModal'
import { MainMenu } from './ui/MainMenu'
import { PlayView } from './ui/PlayView'
import { ProfileModal } from './ui/ProfileModal'
import { SettingsModal } from './ui/SettingsModal'
import { SetupScreen, type SetupValue } from './ui/SetupScreen'
import { StatsModal } from './ui/StatsModal'

type Screen = 'menu' | 'setup' | 'play'
type ModalId = 'settings' | 'library' | 'profiles' | 'stats' | null

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [modal, setModal] = useState<ModalId>(null)
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [profiles, setProfiles] = useState<ProfileState>(() => loadProfiles())
  const [setup, setSetup] = useState<SetupValue>({
    mapId: 'warehouse',
    specialId: 'dash',
    difficulty: difficultyValue('standard'),
  })
  const [run, setRun] = useState<RunConfig | null>(null)
  const [runKey, setRunKey] = useState(0)

  useEffect(() => {
    music.setVolume(effectiveMusic(settings))
    if (screen === 'play') void music.playCombat()
    else void music.playMenu()
  }, [screen, settings])

  useEffect(() => {
    const arm = () => {
      void music.unlock()
    }
    window.addEventListener('pointerdown', arm, { once: true })
    return () => window.removeEventListener('pointerdown', arm)
  }, [])

  useEffect(() => {
    bus.emit('gore', settings.gore)
    bus.emit('volumes', { music: effectiveMusic(settings), sfx: effectiveSfx(settings) })
  }, [settings])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && modal) {
        setModal(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modal])

  useEffect(() => {
    const off = bus.on('gameover', (payload) => {
      const next = recordRun(profiles, payload)
      saveProfiles(next)
      setProfiles(next)
    })
    return off
  }, [profiles])

  function beginRun() {
    const next: RunConfig = {
      mapId: setup.mapId,
      specialId: setup.specialId,
      difficulty: setup.difficulty,
      gore: settings.gore,
      music: effectiveMusic(settings),
      sfx: effectiveSfx(settings),
      profileName: activeProfile(profiles).name,
    }
    setRun(next)
    setRunKey((key) => key + 1)
    setScreen('play')
    setModal(null)
    void music.unlock()
  }

  return (
    <div className="h-full min-w-0">
      {screen === 'menu' && (
        <MainMenu
          onPlay={() => {
            void music.unlock()
            setScreen('setup')
          }}
          onLibrary={() => setModal('library')}
          onSettings={() => setModal('settings')}
          onProfiles={() => setModal('profiles')}
          onStats={() => setModal('stats')}
        />
      )}
      {screen === 'setup' && (
        <SetupScreen
          value={setup}
          onChange={setSetup}
          onBack={() => setScreen('menu')}
          onStart={beginRun}
        />
      )}
      {screen === 'play' && run && (
        <PlayView
          key={runKey}
          run={run}
          onExit={() => {
            setScreen('menu')
            setRun(null)
          }}
          onAgain={beginRun}
          onOpenSettings={() => setModal('settings')}
        />
      )}
      {modal === 'settings' && (
        <SettingsModal
          settings={settings}
          onChange={(next) => {
            setSettings(next)
            music.setVolume(effectiveMusic(next))
          }}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'library' && <LibraryModal onClose={() => setModal(null)} />}
      {modal === 'profiles' && (
        <ProfileModal state={profiles} onChange={setProfiles} onClose={() => setModal(null)} />
      )}
      {modal === 'stats' && <StatsModal state={profiles} onClose={() => setModal(null)} />}
    </div>
  )
}
