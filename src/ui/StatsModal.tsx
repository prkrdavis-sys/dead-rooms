import { type ProfileState } from '../lib/storage'
import { Modal } from './Modal'

function formatTime(total: number): string {
  const m = Math.floor(total / 60)
  const s = Math.floor(total % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function StatsModal({ state, onClose }: { state: ProfileState; onClose: () => void }) {
  return (
    <Modal title="Local Stats" onClose={onClose} wide>
      <p className="mt-0 mb-4 text-sm text-[#d6c7b0]">
        Every profile on this phone or computer. Nothing is uploaded.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {state.profiles.map((profile) => {
          const stats = profile.stats
          const cells = [
            ['Games', String(stats.gamesPlayed)],
            ['Kills', String(stats.totalKills)],
            ['Best kills', String(stats.bestKills)],
            ['Best score', String(stats.bestScore)],
            ['Best wave', String(stats.bestWave)],
            ['Longest run', formatTime(stats.bestTimeSec)],
            ['Time survived', formatTime(stats.totalTimeSec)],
            ['Deaths', String(stats.deaths)],
          ]
          return (
            <article
              key={profile.id}
              className={`rounded-lg border p-3 ${
                profile.id === state.activeId ? 'border-[#e11d48] bg-[#201010]' : 'border-[#3f2a22] bg-[#1a1010]'
              }`}
            >
              <h3 className="mt-0 mb-3 text-base uppercase tracking-wide">
                {profile.name}
                {profile.id === state.activeId ? ' · active' : ''}
              </h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {cells.map(([label, value]) => (
                  <div key={label} className="rounded bg-black/30 px-2 py-2">
                    <dt className="text-[10px] uppercase tracking-[0.14em] text-[#b8a38d]">{label}</dt>
                    <dd className="m-0 text-[#f3e6d0]">{value}</dd>
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
