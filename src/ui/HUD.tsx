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

export function HUD({ hud, onPause, touch }: HUDProps) {
  if (!hud) return null
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-start justify-between gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto min-w-[180px] rounded-lg border border-[#3f2a22] bg-black/55 p-2 backdrop-blur-sm">
          <div className="mb-1 flex justify-between text-[10px] uppercase tracking-[0.16em] text-[#b8a38d]">
            <span>Health</span>
            <span>
              {hud.health}/{hud.maxHealth}
            </span>
          </div>
          <div className="hud-bar">
            <span style={{ width: `${Math.max(0, (hud.health / hud.maxHealth) * 100)}%` }} />
          </div>
          <div className="mt-2 text-xs uppercase tracking-widest text-[#f3e6d0]">
            {hud.weaponName} · {hud.infiniteAmmo ? '∞' : hud.ammo}
          </div>
        </div>
        <div className="rounded-lg border border-[#3f2a22] bg-black/55 px-3 py-2 text-right text-xs uppercase tracking-[0.12em] text-[#f3e6d0] backdrop-blur-sm">
          <div>Score {hud.score}</div>
          <div>Kills {hud.kills}</div>
          <div>
            Wave {hud.wave} · {formatTime(hud.timeSec)}
          </div>
        </div>
        {!hud.dead && (
          <button className="pointer-events-auto btn px-3 py-2 text-xs" onClick={onPause}>
            Pause
          </button>
        )}
      </div>
      {hud.waveBanner && !hud.dead && (
        <div className="pointer-events-none absolute inset-x-0 top-1/3 z-10 text-center text-3xl font-bold tracking-[0.2em] text-[#f3e6d0] drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
          {hud.waveBanner}
        </div>
      )}
      {touch && !hud.dead && (
        <div
          data-allow-touch-scroll
          className="pointer-events-auto absolute inset-x-0 top-[5.6rem] z-10 flex gap-1 overflow-x-auto overscroll-contain px-2 pb-1 [touch-action:pan-x]"
        >
          {WEAPONS.map((weapon) => (
            <button
              key={weapon.id}
              className={`shrink-0 rounded border px-2 py-1 text-[10px] uppercase tracking-wider ${
                hud.weaponSlot === weapon.slot
                  ? 'border-[#e11d48] bg-[#b42318]'
                  : 'border-white/20 bg-black/50'
              }`}
              onClick={() => bus.emit('weapon', weapon.slot)}
            >
              {weapon.keyLabel} {weapon.short}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
