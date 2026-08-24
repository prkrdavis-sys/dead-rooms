import { useEffect, useState } from 'react'
import { activeProfile, type ProfileState } from '../lib/storage'

type BeforeInstall = Event & { prompt: () => Promise<void> }

type MainMenuProps = {
  profiles: ProfileState
  onPlay: () => void
  onLibrary: () => void
  onSettings: () => void
  onProfiles: () => void
  onStats: () => void
}

export function MainMenu({
  profiles,
  onPlay,
  onLibrary,
  onSettings,
  onProfiles,
  onStats,
}: MainMenuProps) {
  const me = activeProfile(profiles)
  const [install, setInstall] = useState<BeforeInstall | null>(null)

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setInstall(event as BeforeInstall)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  return (
    <div className="relative min-h-svh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#4a1510_0%,#0c0808_55%)]" />
      <div className="relative mx-auto flex min-h-svh w-full max-w-xl flex-col justify-between px-5 py-8">
        <header>
          <p className="m-0 text-xs uppercase tracking-[0.35em] text-[#d4a017]">Quarantine arcade</p>
          <h1 className="mt-2 mb-2 text-5xl leading-none tracking-[0.12em] uppercase sm:text-6xl">Dead Rooms</h1>
          <p className="max-w-md text-sm leading-relaxed text-[#d6c7b0] sm:text-base">
            Pick a sealed room. Walk with WASD. Shoot the way you are facing. The dead do not learn, but they do multiply.
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[#b8a38d]">Playing as {me.name}</p>
        </header>
        <div className="grid gap-2">
          <button className="btn btn-primary py-4 text-lg tracking-[0.2em]" onClick={onPlay}>
            Survive
          </button>
          <button className="btn" onClick={onLibrary}>
            Library
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn" onClick={onProfiles}>
              Profiles
            </button>
            <button className="btn" onClick={onStats}>
              Stats
            </button>
          </div>
          <button className="btn btn-ghost" onClick={onSettings}>
            Settings
          </button>
          {install && (
            <button
              className="btn"
              onClick={async () => {
                await install.prompt()
                setInstall(null)
              }}
            >
              Add to home screen
            </button>
          )}
        </div>
        <p className="m-0 text-center text-[11px] uppercase tracking-[0.18em] text-[#8a7464]">
          Installable · Works offline · Local scores only
        </p>
      </div>
    </div>
  )
}
