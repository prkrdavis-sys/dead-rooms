import Phaser from 'phaser'

const FIRST_AT_MS = 42000
const GAP_MIN_MS = 38000
const GAP_MAX_MS = 68000
const WARN_MS = 2600
const DURATION_MS = 5200

/**
 * Building-wide power cuts. For a few seconds nothing lights the floor except
 * muzzle flashes, which makes shooting the only way to see and the fastest way
 * to be seen.
 */
export class BlackoutDirector {
  private nextAt: number
  private warned = false
  private endsAt = 0

  constructor(startNow: number) {
    this.nextAt = startNow + FIRST_AT_MS
  }

  update(now: number, warn: (text: string) => void, onStart: () => void, onEnd: () => void): void {
    if (this.endsAt > 0) {
      if (now >= this.endsAt) {
        this.endsAt = 0
        this.nextAt = now + Phaser.Math.Between(GAP_MIN_MS, GAP_MAX_MS)
        this.warned = false
        onEnd()
      }
      return
    }
    if (!this.warned && now > this.nextAt - WARN_MS) {
      this.warned = true
      warn('Power is failing')
    }
    if (now >= this.nextAt) {
      this.endsAt = now + DURATION_MS
      onStart()
    }
  }

  get active(): boolean {
    return this.endsAt > 0
  }
}
