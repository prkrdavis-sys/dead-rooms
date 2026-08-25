import { WEAPONS } from '../data/weapons'
import { bus, type HudState } from '../lib/bus'

type HUDProps = {
  hud: HudState | null
  onPause: () => void
  touch: boolean
}

function formatTime(total: number): string {
  const m = Math.floor(total / 60)
  const s = Math.floor(total % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function HealthBlock({ hud, compact }: { hud: HudState; compact?: boolean }) {
  return (
    <div className={`hud-panel ${compact ? 'hud-panel-compact' : ''} min-w-0`}>
      <div className="mb-1 flex justify-between gap-2 text-[10px] uppercase tracking-[0.16em] text-[#b8a38d]">
        <span>Health</span>
        <span className="tabular-nums">
          {hud.health}/{hud.maxHealth}
        </span>
      </div>
      <div className="hud-bar">
        <span style={{ width: `${Math.max(0, (hud.health / hud.maxHealth) * 100)}%` }} />
      </div>
      <div className="mt-1.5 truncate text-xs uppercase tracking-widest text-[#f3e6d0]">
        {hud.weaponName} · {hud.infiniteAmmo ? '∞' : hud.ammo}
      </div>
    </div>
  )
}

function ScoreBlock({ hud, compact }: { hud: HudState; compact?: boolean }) {
  return (
    <div
      className={`hud-panel ${compact ? 'hud-panel-compact hud-score' : ''} shrink-0 text-right text-xs uppercase tracking-[0.12em] text-[#f3e6d0]`}
    >
      <div>
        Score <span className="tabular-nums">{hud.score}</span>
      </div>
      <div>
        Kills <span className="tabular-nums">{hud.kills}</span>
      </div>
      <div>
        Wave <span className="tabular-nums">{hud.wave}</span> · {formatTime(hud.timeSec)}
      </div>
    </div>
  )
}

export function HUD({ hud, onPause, touch }: HUDProps) {
  if (!hud) return null
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30">
        <div className="hud-safe flex flex-col gap-2">
          {touch ? (
            <div className="hud-status flex items-stretch gap-2">
              <div className="pointer-events-auto min-w-0 flex-1">
                <HealthBlock hud={hud} compact />
              </div>
              <ScoreBlock hud={hud} compact />
              {!hud.dead && (
                <button type="button" className="pointer-events-auto btn hud-pause" onClick={onPause}>
                  Pause
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="pointer-events-auto min-w-[180px] max-w-xs flex-1">
                <HealthBlock hud={hud} />
              </div>
              <ScoreBlock hud={hud} />
              {!hud.dead && (
                <button type="button" className="pointer-events-auto btn px-3 py-2 text-xs" onClick={onPause}>
                  Pause
                </button>
              )}
            </div>
          )}
          {touch && !hud.dead && (
            <div className="weapon-rack pointer-events-auto">
              {WEAPONS.map((weapon) => (
                <button
                  key={weapon.id}
                  type="button"
                  className={`weapon-chip ${hud.weaponSlot === weapon.slot ? 'is-selected' : ''}`}
                  onClick={() => bus.emit('weapon', weapon.slot)}
                >
                  {weapon.short}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {hud.waveBanner && !hud.dead && (
        <div className="pointer-events-none absolute inset-x-0 top-[38%] z-10 pl-[var(--app-pad-left)] pr-[var(--app-pad-right)] text-center text-[clamp(1.15rem,4.6vw,1.875rem)] font-bold tracking-[0.2em] text-[#f3e6d0] drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
          {hud.waveBanner}
        </div>
      )}
    </>
  )
}
