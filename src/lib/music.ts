export type MusicMode = 'off' | 'menu' | 'combat'

const COMBAT_BPM = 132
const COMBAT_SIXTEENTH = 60 / COMBAT_BPM / 4
const COMBAT_BASS = [
  73.42, 0, 73.42, 0, 73.42, 87.31, 0, 73.42, 65.41, 0, 73.42, 0, 98.0, 0, 87.31, 0,
] as const

export class SynthMusic {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private playing: AudioNode[] = []
  private interval: number | null = null
  private mode: MusicMode = 'off'
  private combatStep = 0
  private nextNote = 0
  volume = 0.4

  get currentMode(): MusicMode {
    return this.mode
  }

  async unlock(): Promise<void> {
    const ctx = this.ensure()
    if (ctx.state === 'suspended') await ctx.resume()
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
    if (this.master) this.master.gain.value = this.volume * 0.22
  }

  async playMenu(): Promise<void> {
    await this.unlock()
    if (this.mode === 'menu') return
    this.stopVoices()
    this.mode = 'menu'
    this.drone(92, 0.35)
    this.drone(138, 0.18)
  }

  async playCombat(): Promise<void> {
    await this.unlock()
    if (this.mode === 'combat') return
    this.stopVoices()
    this.mode = 'combat'
    this.drone(48, 0.3)
    this.drone(96, 0.08)
    this.startCombatClock()
  }

  stop(): void {
    this.stopVoices()
    this.mode = 'off'
  }

  private ensure(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.volume * 0.22
      this.master.connect(this.ctx.destination)
    }
    return this.ctx
  }

  private drone(freq: number, mix: number): void {
    const ctx = this.ensure()
    if (!this.master) return
    const osc = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.value = freq
    filter.type = 'lowpass'
    filter.frequency.value = 280
    gain.gain.value = mix
    lfo.frequency.value = 0.12
    lfoGain.gain.value = 80
    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    osc.start()
    lfo.start()
    this.playing.push(osc, lfo, filter, gain)
  }

  private startCombatClock(): void {
    const ctx = this.ensure()
    this.combatStep = 0
    this.nextNote = ctx.currentTime + 0.04
    const tick = () => {
      if (this.mode !== 'combat') return
      this.scheduleAhead()
    }
    tick()
    this.interval = window.setInterval(tick, 25)
  }

  private scheduleAhead(): void {
    const ctx = this.ensure()
    while (this.nextNote < ctx.currentTime + 0.12) {
      this.scheduleCombatStep(this.combatStep % 16, this.combatStep, this.nextNote)
      this.nextNote += COMBAT_SIXTEENTH
      this.combatStep += 1
    }
  }

  private scheduleCombatStep(beat: number, absStep: number, time: number): void {
    if (beat % 4 === 0) this.kick(time)
    const bass = COMBAT_BASS[beat] ?? 0
    if (bass > 0) this.bass(time, bass)
    if (beat % 2 === 1) this.hat(time, beat % 4 === 3)
    if (absStep % 32 === 12) this.stab(time)
  }

  private kick(time: number): void {
    const ctx = this.ensure()
    if (!this.master) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(150, time)
    osc.frequency.exponentialRampToValueAtTime(36, time + 0.13)
    gain.gain.setValueAtTime(0.24, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16)
    osc.connect(gain)
    gain.connect(this.master)
    osc.start(time)
    osc.stop(time + 0.18)
  }

  private bass(time: number, freq: number): void {
    const ctx = this.ensure()
    if (!this.master) return
    const osc = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.value = freq
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(520, time)
    filter.frequency.exponentialRampToValueAtTime(130, time + 0.16)
    gain.gain.setValueAtTime(0.18, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    osc.start(time)
    osc.stop(time + 0.24)
  }

  private hat(time: number, accent: boolean): void {
    const ctx = this.ensure()
    if (!this.master) return
    const osc = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = accent ? 9200 : 7200
    filter.type = 'highpass'
    filter.frequency.value = 5200
    gain.gain.setValueAtTime(accent ? 0.04 : 0.02, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    osc.start(time)
    osc.stop(time + 0.05)
  }

  private stab(time: number): void {
    const ctx = this.ensure()
    if (!this.master) return
    for (const freq of [220, 311.13]) {
      const osc = ctx.createOscillator()
      const filter = ctx.createBiquadFilter()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.value = freq
      filter.type = 'bandpass'
      filter.frequency.value = 900
      filter.Q.value = 2.4
      gain.gain.setValueAtTime(0.09, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28)
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.master)
      osc.start(time)
      osc.stop(time + 0.3)
    }
  }

  private stopVoices(): void {
    if (this.interval !== null) {
      window.clearInterval(this.interval)
      this.interval = null
    }
    this.combatStep = 0
    this.nextNote = 0
    for (const node of this.playing) {
      if ('stop' in node && typeof node.stop === 'function') {
        try {
          node.stop()
        } catch {
          /* already stopped */
        }
      }
      node.disconnect()
    }
    this.playing = []
  }
}

export const music = new SynthMusic()

if (import.meta.env.DEV) {
  ;(window as Window & { __deadRoomsMusic?: SynthMusic }).__deadRoomsMusic = music
}
