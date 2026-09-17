import { useState } from 'react'
import { MODES, type ModeId } from '../data/modes'
import { type ProfileState } from '../lib/storage'
import { Modal } from './Modal'

function formatTime(total: number): string {
  const m = Math.floor(total / 60)
  const s = Math.floor(total % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

type Scope = 'all' | ModeId

export function StatsModal({ state, onClose }: { state: ProfileState; onClose: () => void }) {
  const [scope, setScope] = useState<Scope>('all')
  const scopes: { id: Scope; label: string }[] = [
    { id: 'all', label: 'All' },
    ...MODES.map((mode) => ({ id: mode.id as Scope, label: mode.name })),
  ]

  return (
    <Modal title="Local Stats" onClose={onClose} wide>
      <p className="mt-0 mb-3 text-sm text-[#a9c4d2]">
        Every profile on this phone or computer. Nothing is uploaded.
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {scopes.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`btn px-3 py-2 text-xs ${scope === item.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setScope(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {state.profiles.map((profile) => {
          const stats = profile.stats
          const mode = scope === 'all' ? null : stats.byMode[scope]
          const cells: [string, string][] = mode
            ? [
                ['Games', String(mode.games)],
                ['Wins', String(mode.wins)],
                ['Kills', String(mode.kills)],
                ['Best score', String(mode.bestScore)],
                ['Longest run', formatTime(mode.bestTimeSec)],
                ['Best wave', String(mode.bestWave)],
              ]
            : [
                ['Games', String(stats.gamesPlayed)],
                ['Wins', String(stats.wins)],
                ['Kills', String(stats.totalKills)],
                ['Best score', String(stats.bestScore)],
                ['Best kills', String(stats.bestKills)],
                ['Best wave', String(stats.bestWave)],
                ['Longest run', formatTime(stats.bestTimeSec)],
                ['Time in the dark', formatTime(stats.totalTimeSec)],
              ]
          return (
            <article
              key={profile.id}
              className={`rounded-lg border p-3 ${
                profile.id === state.activeId ? 'border-[#22d3ee] bg-[#0b1a22]' : 'border-[#1e3a4a] bg-[#0a1017]'
              }`}
            >
              <h3 className="mt-0 mb-3 text-base uppercase tracking-wide">
                {profile.name}
                {profile.id === state.activeId ? ' · active' : ''}
              </h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {cells.map(([label, value]) => (
                  <div key={label} className="rounded bg-black/30 px-2 py-2">
                    <dt className="text-[10px] uppercase tracking-[0.14em] text-[#7ea4b8]">{label}</dt>
                    <dd className="m-0 text-[#d8ecf5]">{value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          )
        })}
      </div>
    </Modal>
  )
}
