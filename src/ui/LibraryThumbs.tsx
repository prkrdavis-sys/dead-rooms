import { useEffect, useRef, type ReactNode } from 'react'
import type { EnemyDef } from '../data/enemies'
import type { RoomMap } from '../data/maps'
import type { SpecialId } from '../data/specials'
import type { WeaponId } from '../data/weapons'

const PORTRAITS: Record<EnemyDef['id'], string> = {
  shambler: '/assets/kenney/characters/zombie/zoimbie1_hold.png',
  runner: '/assets/kenney/characters/runner/womanGreen_hold.png',
  infernal: '/assets/kenney/characters/robot/robot1_hold.png',
  blinker: '/assets/kenney/characters/blinker/manOld_hold.png',
  wraps: '/assets/kenney/characters/wraps/manBrown_hold.png',
  bloater: '/assets/kenney/characters/zombie/zoimbie1_hold.png',
}

function ThumbFrame({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div
      className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-md border border-[#5b2e24] bg-[#241810] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.4)]"
      aria-hidden="true"
      title={label}
    >
      {children}
    </div>
  )
}

function TintedSprite({ src, tint, zoom }: { src: string; tint: number; zoom: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const img = new Image()
    img.src = src
    img.onload = () => {
      const size = 88
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, size, size)
      const draw = size * zoom
      const ox = (size - draw) / 2
      const oy = (size - draw) / 2 + 4
      ctx.drawImage(img, ox, oy, draw, draw)
      if (tint !== 0xffffff) {
        ctx.globalCompositeOperation = 'source-atop'
        ctx.fillStyle = `#${tint.toString(16).padStart(6, '0')}`
        ctx.globalAlpha = 0.55
        ctx.fillRect(0, 0, size, size)
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = 'source-over'
      }
    }
  }, [src, tint, zoom])

  return <canvas ref={canvasRef} className="h-full w-full" />
}

export function EnemyThumb({ enemy }: { enemy: EnemyDef }) {
  return (
    <ThumbFrame label={enemy.name}>
      <TintedSprite src={PORTRAITS[enemy.id]} tint={enemy.tint} zoom={enemy.id === 'bloater' ? 1.15 : 0.92} />
    </ThumbFrame>
  )
}

function SvgIcon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full p-1.5" aria-hidden="true">
      {children}
    </svg>
  )
}

export function WeaponThumb({ id, name }: { id: WeaponId; name: string }) {
  return (
    <ThumbFrame label={name}>
      <SvgIcon>{weaponGlyph(id)}</SvgIcon>
    </ThumbFrame>
  )
}

export function SpecialThumb({ id, name }: { id: SpecialId; name: string }) {
  return (
    <ThumbFrame label={name}>
      <SvgIcon>{specialGlyph(id)}</SvgIcon>
    </ThumbFrame>
  )
}

export function MapThumb({ room }: { room: RoomMap }) {
  const cols = room.rows[0]?.length ?? 1
  const rows = room.rows.length
  const cell = 6
  return (
    <ThumbFrame label={room.name}>
      <svg
        viewBox={`0 0 ${cols * cell} ${rows * cell}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <rect width={cols * cell} height={rows * cell} fill="#2a2218" />
        {room.rows.flatMap((line, r) =>
          [...line].map((ch, c) => {
            const x = c * cell
            const y = r * cell
            const key = `${room.id}-${r}-${c}`
            if (ch === '#') {
              return (
                <g key={key}>
                  <rect x={x} y={y} width={cell} height={cell} fill="#16120f" />
                  <rect x={x} y={y} width={cell} height={1.6} fill="#c45c1c" />
                </g>
              )
            }
            if (ch === 'P') {
              return (
                <g key={key}>
                  <rect x={x} y={y} width={cell} height={cell} fill="#3a342c" />
                  <circle cx={x + cell / 2} cy={y + cell / 2} r={1.8} fill="#f3e6d0" />
                </g>
              )
            }
            if (ch === 'S') {
              return (
                <g key={key}>
                  <rect x={x} y={y} width={cell} height={cell} fill="#4a221c" />
                </g>
              )
            }
            return <rect key={key} x={x} y={y} width={cell} height={cell} fill="#3a342c" />
          }),
        )}
      </svg>
    </ThumbFrame>
  )
}

function weaponGlyph(id: WeaponId): ReactNode {
  switch (id) {
    case 'pistol':
      return (
        <>
          <rect x="10" y="30" width="28" height="10" rx="2" fill="#d6c7b0" />
          <rect x="34" y="28" width="16" height="6" fill="#9ca3af" />
          <rect x="16" y="40" width="8" height="12" fill="#a8a29e" />
          <rect x="44" y="26" width="8" height="4" fill="#57534e" />
        </>
      )
    case 'smg':
      return (
        <>
          <rect x="8" y="28" width="36" height="9" rx="1" fill="#a8a29e" />
          <rect x="40" y="26" width="16" height="5" fill="#78716c" />
          <rect x="18" y="37" width="7" height="14" fill="#57534e" />
          <rect x="28" y="37" width="10" height="4" fill="#44403c" />
        </>
      )
    case 'shotgun':
      return (
        <>
          <rect x="6" y="30" width="44" height="8" rx="1" fill="#92400e" />
          <rect x="46" y="28" width="12" height="6" fill="#d6d3d1" />
          <rect x="14" y="38" width="10" height="12" fill="#78350f" />
        </>
      )
    case 'barrel':
      return (
        <>
          <rect x="18" y="12" width="28" height="40" rx="3" fill="#7f1d1d" />
          <rect x="18" y="28" width="28" height="6" fill="#facc15" />
          <rect x="22" y="16" width="20" height="4" fill="#450a0a" />
        </>
      )
    case 'grenade':
      return (
        <>
          <circle cx="32" cy="36" r="14" fill="#3f6212" />
          <rect x="26" y="14" width="12" height="8" rx="1" fill="#a3a3a3" />
          <path d="M32 14 C40 8 48 16 44 22" stroke="#d4a017" fill="none" strokeWidth="2" />
        </>
      )
    case 'barricade':
      return (
        <>
          <rect x="8" y="22" width="48" height="20" fill="#57534e" />
          <rect x="8" y="22" width="48" height="5" fill="#d6d3d1" />
          <rect x="16" y="30" width="8" height="8" fill="#44403c" />
          <rect x="40" y="30" width="8" height="8" fill="#44403c" />
        </>
      )
    case 'mine':
      return (
        <>
          <circle cx="32" cy="34" r="16" fill="#111827" />
          <circle cx="32" cy="34" r="7" fill="#ef4444" />
          <circle cx="32" cy="34" r="3" fill="#fecaca" />
        </>
      )
    case 'rocket':
      return (
        <>
          <rect x="8" y="28" width="36" height="10" fill="#d97706" />
          <polygon points="44,24 60,33 44,42" fill="#fde68a" />
          <rect x="12" y="38" width="10" height="10" fill="#78350f" />
        </>
      )
    case 'charge':
      return (
        <>
          <rect x="14" y="18" width="36" height="28" rx="2" fill="#1f2937" />
          <rect x="18" y="24" width="28" height="8" fill="#22d3ee" />
          <rect x="20" y="36" width="8" height="6" fill="#6b7280" />
        </>
      )
    case 'railgun':
      return (
        <>
          <rect x="6" y="30" width="48" height="6" fill="#67e8f9" />
          <rect x="8" y="26" width="22" height="14" rx="2" fill="#334155" />
          <rect x="16" y="40" width="8" height="10" fill="#1e293b" />
          <circle cx="54" cy="33" r="4" fill="#ecfeff" />
        </>
      )
    default: {
      const _never: never = id
      return _never
    }
  }
}

function specialGlyph(id: SpecialId): ReactNode {
  switch (id) {
    case 'dash':
      return (
        <>
          <polygon points="12,32 28,18 28,26 52,26 52,38 28,38 28,46" fill="#f3e6d0" />
          <rect x="8" y="28" width="8" height="3" fill="#d4a017" />
          <rect x="8" y="34" width="12" height="3" fill="#d4a017" />
        </>
      )
    case 'airstrike':
      return (
        <>
          <circle cx="32" cy="36" r="16" fill="none" stroke="#f87171" strokeWidth="3" />
          <path d="M32 12 L28 28 L32 24 L36 28 Z" fill="#e11d48" />
          <line x1="24" y1="36" x2="40" y2="36" stroke="#f87171" strokeWidth="2" />
          <line x1="32" y1="28" x2="32" y2="44" stroke="#f87171" strokeWidth="2" />
        </>
      )
    case 'stomp':
      return (
        <>
          <circle cx="32" cy="38" r="14" fill="none" stroke="#d4a017" strokeWidth="3" />
          <circle cx="32" cy="38" r="7" fill="none" stroke="#f3e6d0" strokeWidth="2" />
          <rect x="26" y="12" width="12" height="20" fill="#a8a29e" />
        </>
      )
    default: {
      const _never: never = id
      return _never
    }
  }
}
