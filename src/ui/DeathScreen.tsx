import { MODE_BY_ID } from '../data/modes'
import type { GameOverPayload } from '../lib/bus'

type DeathScreenProps = {
  over: GameOverPayload
  onAgain: () => void
  onExit: () => void
}

function formatTime(total: number): string {
  const m = Math.floor(total / 60)
  const s = Math.floor(total % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function DeathScreen({ over, onAgain, onExit }: DeathScreenProps) {
  const mode = MODE_BY_ID[over.modeId]
  return (
    <div
      className="death-screen absolute inset-0 z-30 grid place-items-center p-[var(--app-pad-top)_var(--app-pad-right)_var(--app-pad-bottom)_var(--app-pad-left)]"
      role="dialog"
      aria-labelledby="death-title"
    >
      <div className="panel death-card w-full max-w-md p-5 text-center sm:p-6">
        <p className="m-0 text-[11px] uppercase tracking-[0.32em] text-[#22d3ee]">{mode.name}</p>
        <h2 id="death-title" className="death-title mt-2 mb-1">
          {over.won ? 'Lights out for them' : 'You went dark'}
        </h2>
        <p className="mt-0 mb-5 text-sm text-[#a9c4d2]">{over.reason}</p>
        <dl className="mb-5 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded bg-black/40 p-2">
            <dt className="text-[10px] uppercase tracking-widest text-[#7ea4b8]">Score</dt>
            <dd className="m-0 text-lg">{over.score}</dd>
          </div>
          <div className="rounded bg-black/40 p-2">
            <dt className="text-[10px] uppercase tracking-widest text-[#7ea4b8]">Kills</dt>
            <dd className="m-0 text-lg">{over.kills}</dd>
          </div>
          <div className="rounded bg-black/40 p-2">
            <dt className="text-[10px] uppercase tracking-widest text-[#7ea4b8]">Time</dt>
            <dd className="m-0 text-lg">{formatTime(over.timeSec)}</dd>
          </div>
          <div className="rounded bg-black/40 p-2">
            <dt className="text-[10px] uppercase tracking-widest text-[#7ea4b8]">
              {over.modeId === 'swarm' ? 'Wave' : 'Result'}
            </dt>
            <dd className="m-0 text-lg">{over.modeId === 'swarm' ? over.wave : over.won ? 'Win' : 'Loss'}</dd>
          </div>
        </dl>
        <div className="grid gap-2">
          <button className="btn btn-primary" onClick={onAgain}>
            Run it again
          </button>
          <button className="btn btn-ghost" onClick={onExit}>
            Main menu
          </button>
        </div>
      </div>
    </div>
  )
}
