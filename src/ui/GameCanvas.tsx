import { useEffect, useRef } from 'react'
import { createDeadRoomsGame } from '../game/createGame'
import type { RunConfig } from '../game/types'

export function GameCanvas({ run }: { run: RunConfig }) {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = host.current
    if (!el) return
    const game = createDeadRoomsGame(el, run)
    return () => {
      game.destroy(true)
      el.innerHTML = ''
    }
  }, [run])

  return <div ref={host} className="h-full w-full touch-none bg-black" />
}
