import type { HudState } from '../lib/bus'

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

function VitalsBlock({ hud, compact }: { hud: HudState; compact?: boolean }) {
  const armorPips = 5
  const filled = hud.maxArmor > 0 ? Math.round((hud.armor / hud.maxArmor) * armorPips) : 0
  return (
    <div className={`hud-panel ${compact ? 'hud-panel-compact' : ''} min-w-0`}>
      <div className="mb-1 flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.16em] text-[#7ea4b8]">
        <span className="truncate">{hud.heroName}</span>
        <span className="tabular-nums">
          {hud.health}/{hud.maxHealth}
        </span>
      </div>
      <div className="hud-armor mb-1 flex gap-1" aria-label={`Armour ${hud.armor}`}>
        {Array.from({ length: armorPips }, (_, index) => (
          <span key={index} className={`hud-pip ${index < filled ? 'is-on' : ''}`} />
        ))}
      </div>
      <div className="hud-bar">
        <span style={{ width: `${Math.max(0, (hud.health / hud.maxHealth) * 100)}%` }} />
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2 text-xs uppercase tracking-widest text-[#d8ecf5]">
        <span className="truncate">{hud.weaponName}</span>
        <span className="tabular-nums">
          {hud.reloading ? 'RELOAD' : `${hud.mag}/${hud.magSize}`}
        </span>
      </div>
    </div>
  )
}

function AbilityDial({ label, ready, hint }: { label: string; ready: number; hint: string }) {
  const pct = Math.round(ready * 100)
  return (
    <div className={`hud-dial ${pct >= 100 ? 'is-ready' : ''}`} title={hint}>
      <span className="hud-dial-fill" style={{ height: `${pct}%` }} />
      <span className="hud-dial-label">{label}</span>
    </div>
  )
}

function ObjectiveBlock({ hud, compact }: { hud: HudState; compact?: boolean }) {
  return (
    <div
      className={`hud-panel ${compact ? 'hud-panel-compact hud-score' : ''} shrink-0 text-right text-xs uppercase tracking-[0.12em] text-[#d8ecf5]`}
    >
      <div className="text-[10px] tracking-[0.18em] text-[#7ea4b8]">{hud.objective}</div>
      <div>
        {hud.modeId === 'swarm' ? 'Wave' : 'Hostiles'}{' '}
        <span className="tabular-nums">{hud.modeId === 'swarm' ? hud.wave : hud.enemiesLeft}</span>
      </div>
      <div>
        Kills <span className="tabular-nums">{hud.kills}</span> · {formatTime(hud.timeSec)}
      </div>
    </div>
  )
}

function SquadStrip({ squad }: { squad: HudState['squad'] }) {
  if (squad.length < 2) return null
  return (
    <div className="hud-squad pointer-events-none flex gap-2">
      {squad.map((mate, index) => (
        <div key={`${mate.name}-${index}`} className={`hud-squad-chip ${mate.alive ? '' : 'is-down'}`}>
          <span className="truncate">{mate.isPlayer ? 'You' : mate.name}</span>
          <span className="hud-squad-bar">
            <span style={{ width: `${mate.alive ? (mate.hp / mate.maxHp) * 100 : 0}%` }} />
          </span>
        </div>
      ))}
    </div>
  )
}

export function HUD({ hud, onPause, touch }: HUDProps) {
  if (!hud) return null
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30">
        <div className="hud-safe flex flex-col gap-2">
          <div className={touch ? 'hud-status flex items-stretch gap-2' : 'flex flex-wrap items-start justify-between gap-3'}>
            <div className={touch ? 'pointer-events-auto min-w-0 flex-1' : 'pointer-events-auto min-w-[190px] max-w-xs flex-1'}>
              <VitalsBlock hud={hud} compact={touch} />
            </div>
            {!touch && (
              <div className="pointer-events-none flex gap-2">
                <AbilityDial label={hud.gadgetName} ready={hud.gadgetReady} hint="Shift" />
                <AbilityDial label="Echo" ready={hud.pingReady} hint="Q" />
              </div>
            )}
            <ObjectiveBlock hud={hud} compact={touch} />
            {!hud.dead && (
              <button
                type="button"
                className={`pointer-events-auto btn ${touch ? 'hud-pause' : 'px-3 py-2 text-xs'}`}
                onClick={onPause}
              >
                Pause
              </button>
            )}
          </div>
          <SquadStrip squad={hud.squad} />
        </div>
      </div>
      {hud.blackout && !hud.dead && (
        <div className="pointer-events-none absolute inset-x-0 top-[26%] z-10 text-center text-[clamp(0.8rem,3vw,1.1rem)] uppercase tracking-[0.34em] text-[#e879f9]">
          Blackout
        </div>
      )}
      {hud.banner && !hud.dead && (
        <div className="pointer-events-none absolute inset-x-0 top-[38%] z-10 pl-[var(--app-pad-left)] pr-[var(--app-pad-right)] text-center text-[clamp(1.15rem,4.6vw,1.875rem)] font-bold tracking-[0.2em] text-[#d8ecf5] drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
          {hud.banner}
        </div>
      )}
    </>
  )
}
