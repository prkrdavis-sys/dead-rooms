import { useEffect, useRef, useState } from 'react'
import { bus } from '../lib/bus'
import { setJoystickCapture } from '../lib/lockViewport'

type TouchControlsProps = {
  visible: boolean
}

type Point = { x: number; y: number }

export function TouchControls({ visible }: TouchControlsProps) {
  const zone = useRef<HTMLDivElement>(null)
  const origin = useRef<Point | null>(null)
  const stickId = useRef<number | null>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const [firing, setFiring] = useState(false)

  function applyStick(clientX: number, clientY: number) {
    const start = origin.current
    if (!start) return
    const dx = clientX - start.x
    const dy = clientY - start.y
    const len = Math.hypot(dx, dy)
    const max = 42
    const scale = len > max ? max / len : 1
    setKnob({ x: dx * scale, y: dy * scale })
    bus.emit('move', { x: (dx * scale) / max, y: (dy * scale) / max })
  }

  function startStick(id: number, clientX: number, clientY: number) {
    if (stickId.current !== null) return
    stickId.current = id
    origin.current = { x: clientX, y: clientY }
    setJoystickCapture(true)
    applyStick(clientX, clientY)
  }

  function endStick(id?: number) {
    if (id !== undefined && stickId.current !== id) return
    if (stickId.current === null && !origin.current) return
    stickId.current = null
    origin.current = null
    setJoystickCapture(false)
    setKnob({ x: 0, y: 0 })
    bus.emit('move', { x: 0, y: 0 })
  }

  useEffect(() => {
    if (!visible) {
      endStick()
      return
    }
    const el = zone.current
    if (!el) return

    const onStart = (event: TouchEvent) => {
      if (stickId.current !== null) return
      const touch = event.changedTouches[0]
      if (!touch) return
      if (event.cancelable) event.preventDefault()
      startStick(touch.identifier, touch.clientX, touch.clientY)
    }

    const onMove = (event: TouchEvent) => {
      if (stickId.current === null) return
      const touch = Array.from(event.touches).find((item) => item.identifier === stickId.current)
      if (!touch) return
      if (event.cancelable) event.preventDefault()
      applyStick(touch.clientX, touch.clientY)
    }

    const onEnd = (event: TouchEvent) => {
      for (const touch of Array.from(event.changedTouches)) {
        if (touch.identifier === stickId.current) {
          if (event.cancelable) event.preventDefault()
          endStick(touch.identifier)
          break
        }
      }
    }

    const opts: AddEventListenerOptions = { passive: false }
    el.addEventListener('touchstart', onStart, opts)
    document.addEventListener('touchmove', onMove, opts)
    document.addEventListener('touchend', onEnd, opts)
    document.addEventListener('touchcancel', onEnd, opts)
    return () => {
      el.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('touchcancel', onEnd)
      endStick()
    }
  }, [visible])

  if (!visible) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div
        ref={zone}
        data-joystick
        className="pointer-events-auto absolute bottom-0 left-0 top-[9.25rem] w-[48%] touch-none overscroll-none"
        onPointerDown={(event) => {
          if (event.pointerType === 'touch') return
          event.preventDefault()
          event.currentTarget.setPointerCapture(event.pointerId)
          startStick(event.pointerId, event.clientX, event.clientY)
        }}
        onPointerMove={(event) => {
          if (event.pointerType === 'touch') return
          event.preventDefault()
          if (stickId.current !== event.pointerId) return
          applyStick(event.clientX, event.clientY)
        }}
        onPointerUp={(event) => {
          if (event.pointerType === 'touch') return
          endStick(event.pointerId)
        }}
        onPointerCancel={(event) => {
          if (event.pointerType === 'touch') return
          endStick(event.pointerId)
        }}
      >
        <div className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(0.75rem,env(safe-area-inset-left))] h-[132px] w-[132px] rounded-full border border-white/20 bg-black/25">
          <div
            className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25"
            style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
          />
        </div>
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
