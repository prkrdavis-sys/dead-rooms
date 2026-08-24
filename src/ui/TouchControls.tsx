import { useRef, useState } from 'react'
import { bus } from '../lib/bus'

type TouchControlsProps = {
  visible: boolean
}

export function TouchControls({ visible }: TouchControlsProps) {
  const pad = useRef<HTMLDivElement>(null)
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const [firing, setFiring] = useState(false)

  if (!visible) return null

  function stick(clientX: number, clientY: number, start: { x: number; y: number }) {
    const dx = clientX - start.x
    const dy = clientY - start.y
    const len = Math.hypot(dx, dy)
    const max = 42
    const scale = len > max ? max / len : 1
    const x = (dx * scale) / max
    const y = (dy * scale) / max
    setKnob({ x: dx * scale, y: dy * scale })
    bus.emit('move', { x, y })
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div
        ref={pad}
        className="pointer-events-auto absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(0.75rem,env(safe-area-inset-left))] h-[132px] w-[132px] touch-none rounded-full border border-white/20 bg-black/25"
        onPointerDown={(event) => {
          event.preventDefault()
          event.currentTarget.setPointerCapture(event.pointerId)
          const start = { x: event.clientX, y: event.clientY }
          setOrigin(start)
          stick(event.clientX, event.clientY, start)
        }}
        onPointerMove={(event) => {
          event.preventDefault()
          if (!origin) return
          stick(event.clientX, event.clientY, origin)
        }}
        onPointerUp={() => {
          setOrigin(null)
          setKnob({ x: 0, y: 0 })
          bus.emit('move', { x: 0, y: 0 })
        }}
        onPointerCancel={() => {
          setOrigin(null)
          setKnob({ x: 0, y: 0 })
          bus.emit('move', { x: 0, y: 0 })
        }}
        onLostPointerCapture={() => {
          setOrigin(null)
          setKnob({ x: 0, y: 0 })
          bus.emit('move', { x: 0, y: 0 })
        }}
      >
        <div
          className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25"
          style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
        />
      </div>
      <div className="pointer-events-auto absolute right-[max(0.75rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-3">
        <button
          className="touch-btn h-16 w-16 touch-none"
          onPointerDown={(event) => {
            event.preventDefault()
            bus.emit('special', true)
          }}
          onPointerUp={() => bus.emit('special', false)}
          onPointerCancel={() => bus.emit('special', false)}
        >
          Special
        </button>
        <button
          className={`touch-btn touch-none ${firing ? 'active' : ''}`}
          onPointerDown={(event) => {
            event.preventDefault()
            setFiring(true)
            bus.emit('fire', true)
          }}
          onPointerUp={() => {
            setFiring(false)
            bus.emit('fire', false)
          }}
          onPointerCancel={() => {
            setFiring(false)
            bus.emit('fire', false)
          }}
        >
          Fire
        </button>
      </div>
    </div>
  )
}
