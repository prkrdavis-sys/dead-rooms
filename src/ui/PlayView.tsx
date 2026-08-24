import { useEffect, useMemo, useState } from 'react'
import { bus, type GameOverPayload, type HudState } from '../lib/bus'
import type { RunConfig } from '../game/types'
import { GameCanvas } from './GameCanvas'
import { HUD } from './HUD'
import { TouchControls } from './TouchControls'

type PlayViewProps = {
  run: RunConfig
  onExit: () => void
  onAgain: () => void
  onOpenSettings: () => void
}

function formatTime(total: number): string {
  const m = Math.floor(total / 60)
  const s = Math.floor(total % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function PlayView({ run, onExit, onAgain, onOpenSettings }: PlayViewProps) {
  const [hud, setHud] = useState<HudState | null>(null)
  const [paused, setPaused] = useState(false)
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
    const offOver = bus.on('gameover', setOver)
    return () => {
      media.removeEventListener('change', onChange)
      window.removeEventListener('resize', onChange)
      window.removeEventListener('keydown', blockKeys)
      offHud()
      offPause()
      offOver()
    }
  }, [])

  const showTouch = useMemo(() => touch, [touch])

  return (
    <div data-play-locked className="relative h-full w-full overflow-hidden overscroll-none bg-black">
      <GameCanvas run={run} />
      <HUD hud={hud} touch={showTouch} onPause={() => bus.emit('pauseToggle', true)} />
      <TouchControls visible={showTouch && !over} />
      {paused && !over && (
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
      {over && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-black/75 p-4">
          <div className="panel w-full max-w-md p-5 text-center">
            <h2 className="mt-0 mb-1 tracking-[0.2em] uppercase text-[#e11d48]">You died</h2>
            <p className="mt-0 mb-4 text-sm text-[#d6c7b0]">The room keeps the blood. You keep the score.</p>
            <dl className="mb-5 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded bg-black/40 p-2">
                <dt className="text-[10px] uppercase tracking-widest text-[#b8a38d]">Score</dt>
                <dd className="m-0 text-lg">{over.score}</dd>
              </div>
              <div className="rounded bg-black/40 p-2">
                <dt className="text-[10px] uppercase tracking-widest text-[#b8a38d]">Kills</dt>
                <dd className="m-0 text-lg">{over.kills}</dd>
              </div>
              <div className="rounded bg-black/40 p-2">
                <dt className="text-[10px] uppercase tracking-widest text-[#b8a38d]">Time</dt>
                <dd className="m-0 text-lg">{formatTime(over.timeSec)}</dd>
              </div>
              <div className="rounded bg-black/40 p-2">
                <dt className="text-[10px] uppercase tracking-widest text-[#b8a38d]">Wave</dt>
                <dd className="m-0 text-lg">{over.wave}</dd>
              </div>
            </dl>
            <div className="grid gap-2">
              <button className="btn btn-primary" onClick={onAgain}>
                Another run
              </button>
              <button className="btn btn-ghost" onClick={onExit}>
                Main menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
