import Phaser from 'phaser'

function paint(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void,
): void {
  if (scene.textures.exists(key)) scene.textures.remove(key)
  const texture = scene.textures.createCanvas(key, width, height)
  if (!texture) return
  const ctx = texture.getContext()
  draw(ctx, width, height)
  texture.refresh()
}

function radial(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  inner: string,
  outer: string,
  radius: number,
): void {
  const g = ctx.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, radius)
  g.addColorStop(0, inner)
  g.addColorStop(1, outer)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

function floorTile(scene: Phaser.Scene): void {
  paint(scene, 'floor', 48, 48, (ctx, w, h) => {
    ctx.fillStyle = '#16212d'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(103,232,249,0.22)'
    ctx.lineWidth = 1
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1)
    ctx.fillStyle = 'rgba(148,163,184,0.1)'
    for (let i = 0; i < 12; i += 1) {
      ctx.fillRect((i * 19) % w, (i * 13) % h, 2, 2)
    }
  })
}

function wallTile(scene: Phaser.Scene): void {
  paint(scene, 'wall', 48, 48, (ctx, w, h) => {
    ctx.fillStyle = '#060a0f'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#16242f'
    ctx.fillRect(3, 3, w - 6, h - 6)
    ctx.strokeStyle = 'rgba(34,211,238,0.75)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(1, 1)
    ctx.lineTo(w - 1, 1)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(34,211,238,0.16)'
    ctx.lineWidth = 1
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1)
  })
}

export function createGeneratedTextures(scene: Phaser.Scene): void {
  floorTile(scene)
  wallTile(scene)

  paint(scene, 'bullet', 10, 4, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0)
    g.addColorStop(0, 'rgba(255,255,255,0)')
    g.addColorStop(0.6, 'rgba(253,230,138,0.9)')
    g.addColorStop(1, '#fffbeb')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  })

  paint(scene, 'pellet', 7, 3, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(251,191,36,0.9)'
    ctx.fillRect(0, 0, w, h)
  })

  paint(scene, 'slug', 14, 4, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0)
    g.addColorStop(0, 'rgba(103,232,249,0)')
    g.addColorStop(1, '#ecfeff')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  })

  paint(scene, 'fireball', 12, 12, (ctx, w, h) => {
    radial(ctx, w, h, 'rgba(254,240,138,0.95)', 'rgba(239,68,68,0)', 6)
  })

  paint(scene, 'glow', 64, 64, (ctx, w, h) => {
    radial(ctx, w, h, 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0)', 30)
  })

  paint(scene, 'blast', 48, 48, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 3, w / 2, h / 2, 22)
    g.addColorStop(0, 'rgba(255,255,255,0.95)')
    g.addColorStop(0.35, 'rgba(56,189,248,0.5)')
    g.addColorStop(1, 'rgba(8,47,73,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  })

  paint(scene, 'lamp', 26, 26, (ctx, w, h) => {
    radial(ctx, w, h, 'rgba(253,230,138,0.85)', 'rgba(217,119,6,0)', 13)
    ctx.fillStyle = '#fde68a'
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 4.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#78350f'
    ctx.lineWidth = 2
    ctx.strokeRect(w / 2 - 8, h / 2 - 8, 16, 16)
  })

  paint(scene, 'lamp-dead', 26, 26, (ctx, w, h) => {
    ctx.strokeStyle = 'rgba(120,113,108,0.8)'
    ctx.lineWidth = 2
    ctx.strokeRect(w / 2 - 8, h / 2 - 8, 16, 16)
    ctx.fillStyle = 'rgba(68,64,60,0.9)'
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 4, 0, Math.PI * 2)
    ctx.fill()
  })

  paint(scene, 'breaker', 24, 28, (ctx, w, h) => {
    ctx.fillStyle = '#1f2937'
    ctx.fillRect(3, 2, w - 6, h - 4)
    ctx.strokeStyle = 'rgba(34,211,238,0.7)'
    ctx.lineWidth = 2
    ctx.strokeRect(3.5, 2.5, w - 7, h - 5)
    ctx.fillStyle = '#22d3ee'
    ctx.fillRect(w / 2 - 3, 8, 6, 10)
  })

  paint(scene, 'breaker-off', 24, 28, (ctx, w, h) => {
    ctx.fillStyle = '#1f2937'
    ctx.fillRect(3, 2, w - 6, h - 4)
    ctx.strokeStyle = 'rgba(148,163,184,0.45)'
    ctx.lineWidth = 2
    ctx.strokeRect(3.5, 2.5, w - 7, h - 5)
    ctx.fillStyle = '#64748b'
    ctx.fillRect(w / 2 - 3, h - 18, 6, 10)
  })

  paint(scene, 'ping-ring', 96, 96, (ctx, w, h) => {
    ctx.strokeStyle = 'rgba(103,232,249,0.9)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 44, 0, Math.PI * 2)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(103,232,249,0.35)'
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 38, 0, Math.PI * 2)
    ctx.stroke()
  })

  paint(scene, 'blip', 20, 20, (ctx, w, h) => {
    ctx.strokeStyle = 'rgba(248,113,113,0.95)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 7, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = 'rgba(248,113,113,0.5)'
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 3, 0, Math.PI * 2)
    ctx.fill()
  })

  paint(scene, 'blip-ally', 20, 20, (ctx, w, h) => {
    ctx.strokeStyle = 'rgba(74,222,128,0.9)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 6, 0, Math.PI * 2)
    ctx.stroke()
  })

  paint(scene, 'zone-ring', 64, 64, (ctx, w, h) => {
    ctx.strokeStyle = 'rgba(232,121,249,0.85)'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 26, 0, Math.PI * 2)
    ctx.stroke()
  })

  paint(scene, 'intel', 22, 18, (ctx, w, h) => {
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(1, 2, w - 2, h - 4)
    ctx.strokeStyle = '#facc15'
    ctx.lineWidth = 2
    ctx.strokeRect(1.5, 2.5, w - 3, h - 5)
    ctx.fillStyle = '#facc15'
    ctx.fillRect(w / 2 - 4, h / 2 - 2, 8, 4)
  })

  paint(scene, 'exit-pad', 64, 64, (ctx, w, h) => {
    ctx.strokeStyle = 'rgba(74,222,128,0.8)'
    ctx.lineWidth = 3
    ctx.strokeRect(6.5, 6.5, w - 13, h - 13)
    ctx.strokeStyle = 'rgba(74,222,128,0.35)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(w / 2, 14)
    ctx.lineTo(w / 2, h - 14)
    ctx.moveTo(14, h / 2)
    ctx.lineTo(w - 14, h / 2)
    ctx.stroke()
  })

  paint(scene, 'shield-wall', 40, 12, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(56,189,248,0.25)'
    ctx.fillRect(0, 1, w, h - 2)
    ctx.strokeStyle = 'rgba(125,211,252,0.9)'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 2, w - 2, h - 4)
  })

  paint(scene, 'ammo-box', 18, 14, (ctx) => {
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(2, 2, 14, 10)
    ctx.strokeStyle = '#a3e635'
    ctx.lineWidth = 2
    ctx.strokeRect(2.5, 2.5, 13, 9)
  })

  paint(scene, 'health-pack', 16, 16, (ctx) => {
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(2, 2, 12, 12)
    ctx.fillStyle = '#f87171'
    ctx.fillRect(7, 4, 2, 8)
    ctx.fillRect(4, 7, 8, 2)
  })

  paint(scene, 'armor-pack', 16, 16, (ctx, w, h) => {
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(2, 2, 12, 12)
    ctx.fillStyle = '#38bdf8'
    ctx.beginPath()
    ctx.moveTo(w / 2, 4)
    ctx.lineTo(w - 4, 7)
    ctx.lineTo(w / 2, h - 4)
    ctx.lineTo(4, 7)
    ctx.closePath()
    ctx.fill()
  })

  paint(scene, 'mark', 80, 80, (ctx, w, h) => {
    ctx.strokeStyle = 'rgba(248,113,113,0.8)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 30, 0, Math.PI * 2)
    ctx.stroke()
  })

  paint(scene, 'casing', 5, 3, (ctx) => {
    ctx.fillStyle = '#d4a017'
    ctx.fillRect(0, 0, 5, 3)
  })

  paint(scene, 'spark', 6, 6, (ctx, w, h) => {
    ctx.fillStyle = '#fff7ed'
    ctx.fillRect(2, 0, 2, h)
    ctx.fillRect(0, 2, w, 2)
  })

  paint(scene, 'blood-1', 22, 16, (ctx) => {
    ctx.fillStyle = 'rgba(88,20,28,0.8)'
    ctx.beginPath()
    ctx.ellipse(11, 8, 10, 6, 0.3, 0, Math.PI * 2)
    ctx.fill()
  })

  paint(scene, 'blood-2', 18, 18, (ctx) => {
    ctx.fillStyle = 'rgba(112,26,26,0.75)'
    ctx.beginPath()
    ctx.ellipse(9, 9, 8, 7, -0.4, 0, Math.PI * 2)
    ctx.fill()
  })

  paint(scene, 'blood-3', 14, 10, (ctx) => {
    ctx.fillStyle = 'rgba(69,10,10,0.7)'
    ctx.beginPath()
    ctx.ellipse(7, 5, 6, 4, 0.2, 0, Math.PI * 2)
    ctx.fill()
  })

  paint(scene, 'blood-pool', 48, 32, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(88,20,28,0.85)'
    ctx.beginPath()
    ctx.ellipse(w / 2, h / 2, 21, 12, 0.18, 0, Math.PI * 2)
    ctx.fill()
  })

  paint(scene, 'gib-flesh', 8, 6, (ctx) => {
    ctx.fillStyle = '#9f1239'
    ctx.fillRect(1, 1, 6, 4)
  })

  paint(scene, 'gib-bone', 7, 4, (ctx) => {
    ctx.fillStyle = '#e7e5e4'
    ctx.fillRect(0, 1, 7, 2)
  })

  paint(scene, 'muzzle-light', 28, 16, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0)
    g.addColorStop(0, 'rgba(255,255,255,0.95)')
    g.addColorStop(0.4, 'rgba(253,224,71,0.8)')
    g.addColorStop(1, 'rgba(245,158,11,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(1, h / 2)
    ctx.lineTo(w, 2)
    ctx.lineTo(w, h - 2)
    ctx.closePath()
    ctx.fill()
  })

  paint(scene, 'muzzle-heavy', 40, 26, (ctx, w, h) => {
    const g = ctx.createRadialGradient(4, h / 2, 2, 18, h / 2, 22)
    g.addColorStop(0, 'rgba(255,247,237,0.95)')
    g.addColorStop(0.35, 'rgba(251,146,60,0.75)')
    g.addColorStop(1, 'rgba(194,65,12,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(2, h / 2)
    ctx.lineTo(w - 2, 1)
    ctx.lineTo(w * 0.45, h / 2)
    ctx.lineTo(w - 2, h - 1)
    ctx.closePath()
    ctx.fill()
  })

  paint(scene, 'muzzle-rail', 56, 16, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0)
    g.addColorStop(0, 'rgba(236,254,255,1)')
    g.addColorStop(0.35, 'rgba(103,232,249,0.9)')
    g.addColorStop(1, 'rgba(14,116,144,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(0, h / 2)
    ctx.lineTo(w, 1)
    ctx.lineTo(w, h - 1)
    ctx.closePath()
    ctx.fill()
  })

  paint(scene, 'muzzle-hush', 22, 10, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0)
    g.addColorStop(0, 'rgba(226,232,240,0.6)')
    g.addColorStop(1, 'rgba(148,163,184,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(1, h / 2)
    ctx.lineTo(w, 2)
    ctx.lineTo(w, h - 2)
    ctx.closePath()
    ctx.fill()
  })
}
