export class SynthMusic {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private playing: AudioNode[] = []
  private interval: number | null = null
  private mode: 'off' | 'menu' | 'combat' = 'off'
  volume = 0.4

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
    this.drone(70, 0.42)
    this.drone(140, 0.16)
    this.pulse()
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

  private pulse(): void {
    const ctx = this.ensure()
    if (!this.master) return
    this.interval = window.setInterval(() => {
      if (this.mode !== 'combat' || !this.master) return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.value = 48
      gain.gain.value = 0.12
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
      osc.connect(gain)
      gain.connect(this.master)
      osc.start()
      osc.stop(ctx.currentTime + 0.2)
    }, 640)
  }

  private stopVoices(): void {
    if (this.interval !== null) {
      window.clearInterval(this.interval)
      this.interval = null
    }
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
