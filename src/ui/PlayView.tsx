import { useEffect, useMemo, useState } from 'react'
import { bus, type GameOverPayload, type HudState } from '../lib/bus'
import type { RunConfig } from '../game/types'
import { DeathScreen } from './DeathScreen'
import { GameCanvas } from './GameCanvas'
import { HUD } from './HUD'
import { TouchControls } from './TouchControls'

type PlayViewProps = {
  run: RunConfig
  onExit: () => void
  onAgain: () => void
  onOpenSettings: () => void
}

export function PlayView({ run, onExit, onAgain, onOpenSettings }: PlayViewProps) {
  const [hud, setHud] = useState<HudState | null>(null)
  const [paused, setPaused] = useState(false)
  const [dying, setDying] = useState(false)
  const [over, setOver] = useState<GameOverPayload | null>(null)
  const [touch, setTouch] = useState(() => window.matchMedia('(pointer: coarse)').matches)

  useEffect(() => {
    const media = window.matchMedia('(pointer: coarse)')
    const onChange = () => setTouch(media.matches || window.innerWidth < 900)
    onChange()
    media.addEventListener('change', onChange)
    window.addEventListener('resize', onChange)
    const blockKeys = (event: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        event.preventDefault()
      }
    }
    window.addEventListener('keydown', blockKeys)
    const offHud = bus.on('hud', setHud)
    const offPause = bus.on('paused', setPaused)
    const offDying = bus.on('dying', setDying)
    const offOver = bus.on('gameover', setOver)
    return () => {
      media.removeEventListener('change', onChange)
      window.removeEventListener('resize', onChange)
      window.removeEventListener('keydown', blockKeys)
      offHud()
      offPause()
      offDying()
      offOver()
    }
  }, [])

  const showTouch = useMemo(() => touch, [touch])
  const locked = Boolean(over || dying || hud?.dead)

  return (
    <div data-play-locked className="relative h-full w-full overflow-hidden overscroll-none bg-black">
      <GameCanvas run={run} />
      <HUD hud={over ? null : hud} touch={showTouch} onPause={() => bus.emit('pauseToggle', true)} />
      <TouchControls visible={showTouch && !locked} />
      {dying && !over && <div className="death-vignette pointer-events-none absolute inset-0 z-20" />}
      {paused && !locked && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-black/70 p-4">
          <div className="panel w-full max-w-sm p-5 text-center">
            <h2 className="mt-0 mb-4 tracking-[0.16em] uppercase">Paused</h2>
            <div className="grid gap-2">
              <button className="btn btn-primary" onClick={() => bus.emit('pauseToggle', true)}>
                Resume
              </button>
              <button className="btn" onClick={onOpenSettings}>
                Settings
              </button>
              <button className="btn btn-ghost" onClick={onExit}>
                Quit to menu
              </button>
            </div>
          </div>
        </div>
      )}
      {over && <DeathScreen over={over} onAgain={onAgain} onExit={onExit} />}
    </div>
  )
}
