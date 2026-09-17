import { useEffect, useRef, type ReactNode } from 'react'
import type { EnemyDef } from '../data/enemies'
import type { GadgetId, HeroDef } from '../data/heroes'
import type { RoomMap } from '../data/maps'

const PACK_PORTRAITS: Record<string, string> = {
  soldier: '/assets/kenney/characters/soldier/soldier1_hold.png',
  survivor: '/assets/kenney/characters/survivor/survivor1_hold.png',
  runner: '/assets/kenney/characters/runner/womanGreen_hold.png',
  robot: '/assets/kenney/characters/robot/robot1_hold.png',
  blinker: '/assets/kenney/characters/blinker/manOld_hold.png',
  wraps: '/assets/kenney/characters/wraps/manBrown_hold.png',
  zombie: '/assets/kenney/characters/zombie/zoimbie1_hold.png',
}

function ThumbFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-[#1e3a4a] bg-[#070c12] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.5)] sm:h-[88px] sm:w-[88px]"
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
      ctx.globalCompositeOperation = 'source-atop'
      ctx.fillStyle = `#${tint.toString(16).padStart(6, '0')}`
      ctx.globalAlpha = 0.5
      ctx.fillRect(0, 0, size, size)
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }
  }, [src, tint, zoom])

  return <canvas ref={canvasRef} className="h-full w-full" />
}

export function EnemyThumb({ enemy }: { enemy: EnemyDef }) {
  return (
    <ThumbFrame label={enemy.name}>
      <TintedSprite
        src={PACK_PORTRAITS[enemy.pack] ?? PACK_PORTRAITS.zombie}
        tint={enemy.tint}
        zoom={enemy.id === 'bloater' ? 1.15 : 0.92}
      />
    </ThumbFrame>
  )
}

export function HeroThumb({ hero }: { hero: HeroDef }) {
  return (
    <ThumbFrame label={hero.name}>
      <TintedSprite src={PACK_PORTRAITS[hero.pack] ?? PACK_PORTRAITS.soldier} tint={hero.color} zoom={0.95} />
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

export function GadgetThumb({ id, name }: { id: GadgetId; name: string }) {
  return (
    <ThumbFrame label={name}>
      <SvgIcon>{gadgetGlyph(id)}</SvgIcon>
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
        <rect width={cols * cell} height={rows * cell} fill="#070c12" />
        {room.rows.flatMap((line, r) =>
          [...line].map((ch, c) => {
            const x = c * cell
            const y = r * cell
            const key = `${room.id}-${r}-${c}`
            if (ch === '#') {
              return (
                <g key={key}>
                  <rect x={x} y={y} width={cell} height={cell} fill="#05080c" />
                  <rect x={x} y={y} width={cell} height={1.4} fill="#22d3ee" opacity="0.5" />
                </g>
              )
            }
            const floor = <rect x={x} y={y} width={cell} height={cell} fill="#111a24" />
            if (ch === 'P') {
              return (
                <g key={key}>
                  {floor}
                  <circle cx={x + cell / 2} cy={y + cell / 2} r={1.9} fill="#e2f5ff" />
                </g>
              )
            }
            if (ch === 'L') {
              return (
                <g key={key}>
                  {floor}
                  <circle cx={x + cell / 2} cy={y + cell / 2} r={1.6} fill="#fde68a" />
                </g>
              )
            }
            if (ch === 'E') {
              return (
                <g key={key}>
                  {floor}
                  <rect x={x + 1} y={y + 1} width={cell - 2} height={cell - 2} fill="none" stroke="#4ade80" strokeWidth="0.8" />
                </g>
              )
            }
            if (ch === 'B') {
              return (
                <g key={key}>
                  {floor}
                  <rect x={x + 2} y={y + 1.5} width={cell - 4} height={cell - 3} fill="#22d3ee" opacity="0.7" />
                </g>
              )
            }
            if (ch >= '1' && ch <= '4') {
              return (
                <g key={key}>
                  {floor}
                  <circle cx={x + cell / 2} cy={y + cell / 2} r={1.4} fill="#fb7185" />
                </g>
              )
            }
            if (ch === 'S') {
              return <rect key={key} x={x} y={y} width={cell} height={cell} fill="#1b2a1c" />
            }
            return <g key={key}>{floor}</g>
          }),
        )}
      </svg>
    </ThumbFrame>
  )
}

function gadgetGlyph(id: GadgetId): ReactNode {
  switch (id) {
    case 'echo':
      return (
        <>
          <circle cx="32" cy="32" r="8" fill="none" stroke="#67e8f9" strokeWidth="3" />
          <circle cx="32" cy="32" r="17" fill="none" stroke="#67e8f9" strokeWidth="2" opacity="0.7" />
          <circle cx="32" cy="32" r="26" fill="none" stroke="#67e8f9" strokeWidth="1.5" opacity="0.4" />
        </>
      )
    case 'focus':
      return (
        <>
          <polygon points="10,32 54,20 54,44" fill="#38bdf8" opacity="0.45" />
          <line x1="10" y1="32" x2="58" y2="32" stroke="#e0f2fe" strokeWidth="2" />
          <circle cx="10" cy="32" r="4" fill="#e0f2fe" />
        </>
      )
    case 'bulwark':
      return (
        <>
          <rect x="12" y="20" width="40" height="24" rx="2" fill="#0ea5e9" opacity="0.35" />
          <rect x="12" y="20" width="40" height="24" rx="2" fill="none" stroke="#7dd3fc" strokeWidth="3" />
        </>
      )
    case 'flashbang':
      return (
        <>
          <circle cx="32" cy="32" r="10" fill="#fef9c3" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1={32 + Math.cos((deg * Math.PI) / 180) * 14}
              y1={32 + Math.sin((deg * Math.PI) / 180) * 14}
              x2={32 + Math.cos((deg * Math.PI) / 180) * 26}
              y2={32 + Math.sin((deg * Math.PI) / 180) * 26}
              stroke="#fde68a"
              strokeWidth="3"
            />
          ))}
        </>
      )
    case 'beacon':
      return (
        <>
          <rect x="26" y="30" width="12" height="22" fill="#4c1d95" />
          <circle cx="32" cy="24" r="10" fill="#a78bfa" />
          <circle cx="32" cy="24" r="4" fill="#ede9fe" />
        </>
      )
    case 'lightsout':
      return (
        <>
          <circle cx="32" cy="28" r="12" fill="none" stroke="#94a3b8" strokeWidth="3" />
          <line x1="16" y1="46" x2="48" y2="14" stroke="#f87171" strokeWidth="4" />
        </>
      )
    default: {
      const _never: never = id
      return _never
    }
  }
}
