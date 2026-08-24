import { useEffect, useState } from 'react'

type BeforeInstall = Event & { prompt: () => Promise<void> }

type MainMenuProps = {
  onPlay: () => void
  onLibrary: () => void
  onSettings: () => void
  onProfiles: () => void
  onStats: () => void
}

export function MainMenu({
  onPlay,
  onLibrary,
  onSettings,
  onProfiles,
  onStats,
}: MainMenuProps) {
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
    <div className="relative h-full overflow-y-auto overscroll-contain touch-pan-y">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#4a1510_0%,#0c0808_55%)]" />
      <div className="relative mx-auto flex min-h-full w-full max-w-xl flex-col justify-between px-5 py-8">
        <header>
          <h1 className="mb-3 font-display text-6xl leading-[0.85] tracking-[0.06em] uppercase sm:text-8xl">
            Dead Rooms
          </h1>
          <p className="max-w-md font-body text-base leading-snug text-[#d6c7b0] sm:text-lg">
            Pick a sealed room. Walk with WASD. Shoot the way you are facing. The dead do not learn, but they do multiply.
          </p>
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
