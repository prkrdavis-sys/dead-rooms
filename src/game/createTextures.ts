import Phaser from 'phaser'

function paint(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void,
): void {
  const texture = scene.textures.createCanvas(key, width, height)
  if (!texture) return
  const ctx = texture.getContext()
  draw(ctx, width, height)
  texture.refresh()
}

export function createGeneratedTextures(scene: Phaser.Scene): void {
  paint(scene, 'floor', 48, 48, (ctx, w, h) => {
    ctx.fillStyle = '#3a342c'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#322c25'
    for (let i = 0; i < 18; i += 1) {
      ctx.fillRect((i * 17) % w, (i * 11) % h, 3, 2)
    }
    ctx.strokeStyle = '#2a251f'
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1)
  })

  paint(scene, 'wall', 48, 48, (ctx, w, h) => {
    ctx.fillStyle = '#1a1612'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#c45c1c'
    ctx.fillRect(0, 0, w, 7)
    ctx.fillStyle = '#2a2420'
    ctx.fillRect(4, 12, w - 8, h - 16)
  })

  paint(scene, 'bullet', 8, 8, (ctx, w, h) => {
    ctx.fillStyle = '#f5e6a3'
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 3, 0, Math.PI * 2)
    ctx.fill()
  })

  paint(scene, 'pellet', 6, 6, (ctx, w, h) => {
    ctx.fillStyle = '#e7d27a'
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 2.2, 0, Math.PI * 2)
    ctx.fill()
  })

  paint(scene, 'rocket', 16, 8, (ctx, w, h) => {
    ctx.fillStyle = '#d97706'
    ctx.fillRect(0, 1, w - 3, h - 2)
    ctx.fillStyle = '#fde68a'
    ctx.fillRect(w - 5, 2, 5, h - 4)
  })

  paint(scene, 'grenade', 10, 10, (ctx, w, h) => {
    ctx.fillStyle = '#3f6212'
    ctx.beginPath()
    ctx.arc(w / 2, h / 2 + 0.5, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#a3a3a3'
    ctx.fillRect(3, 1, 4, 3)
  })

  paint(scene, 'barrel-obj', 28, 28, (ctx) => {
    ctx.fillStyle = '#7f1d1d'
    ctx.fillRect(6, 4, 16, 20)
    ctx.fillStyle = '#facc15'
    ctx.fillRect(6, 12, 16, 4)
    ctx.fillStyle = '#450a0a'
    ctx.fillRect(8, 6, 12, 3)
  })

  paint(scene, 'crate', 28, 28, (ctx) => {
    ctx.fillStyle = '#92400e'
    ctx.fillRect(4, 4, 20, 20)
    ctx.strokeStyle = '#1c1917'
    ctx.strokeRect(4.5, 4.5, 19, 19)
    ctx.beginPath()
    ctx.moveTo(8, 8)
    ctx.lineTo(20, 20)
    ctx.moveTo(20, 8)
    ctx.lineTo(8, 20)
    ctx.stroke()
  })

  paint(scene, 'mine-obj', 18, 18, (ctx, w, h) => {
    ctx.fillStyle = '#111827'
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 3, 0, Math.PI * 2)
    ctx.fill()
  })

  paint(scene, 'charge-obj', 18, 18, (ctx) => {
    ctx.fillStyle = '#1f2937'
    ctx.fillRect(3, 5, 12, 10)
    ctx.fillStyle = '#22d3ee'
    ctx.fillRect(5, 7, 8, 3)
  })

  paint(scene, 'barricade', 36, 16, (ctx, w, h) => {
    ctx.fillStyle = '#57534e'
    ctx.fillRect(0, 2, w, h - 4)
    ctx.fillStyle = '#d6d3d1'
    ctx.fillRect(0, 2, w, 3)
    ctx.fillStyle = '#44403c'
    ctx.fillRect(6, 6, 6, 6)
    ctx.fillRect(24, 6, 6, 6)
  })

  paint(scene, 'blood-1', 22, 16, (ctx) => {
    ctx.fillStyle = 'rgba(127,29,29,0.85)'
    ctx.beginPath()
    ctx.ellipse(11, 8, 10, 6, 0.3, 0, Math.PI * 2)
    ctx.fill()
  })

  paint(scene, 'blood-2', 18, 18, (ctx) => {
    ctx.fillStyle = 'rgba(153,27,27,0.8)'
    ctx.beginPath()
    ctx.ellipse(9, 9, 8, 7, -0.4, 0, Math.PI * 2)
    ctx.fill()
  })

  paint(scene, 'blood-3', 14, 10, (ctx) => {
    ctx.fillStyle = 'rgba(69,10,10,0.75)'
    ctx.beginPath()
    ctx.ellipse(7, 5, 6, 4, 0.2, 0, Math.PI * 2)
    ctx.fill()
  })

  paint(scene, 'blood-pool', 48, 32, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(127,29,29,0.9)'
    ctx.beginPath()
    ctx.ellipse(w / 2, h / 2, 21, 12, 0.18, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(69,10,10,0.75)'
    ctx.beginPath()
    ctx.ellipse(w / 2 + 5, h / 2 + 2, 11, 6, -0.35, 0, Math.PI * 2)
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

  paint(scene, 'fireball', 12, 12, (ctx, w, h) => {
    ctx.fillStyle = '#fb923c'
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fef08a'
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 2.5, 0, Math.PI * 2)
    ctx.fill()
  })

  paint(scene, 'blast', 48, 48, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, 22)
    g.addColorStop(0, 'rgba(254,243,199,0.9)')
    g.addColorStop(0.4, 'rgba(249,115,22,0.55)')
    g.addColorStop(1, 'rgba(127,29,29,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  })

  paint(scene, 'shadow', 28, 12, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.beginPath()
    ctx.ellipse(w / 2, h / 2, 12, 5, 0, 0, Math.PI * 2)
    ctx.fill()
  })

  paint(scene, 'ammo-box', 18, 14, (ctx) => {
    ctx.fillStyle = '#a3e635'
    ctx.fillRect(2, 2, 14, 10)
    ctx.fillStyle = '#14532d'
    ctx.fillRect(6, 5, 6, 4)
  })

  paint(scene, 'health-pack', 16, 16, (ctx) => {
    ctx.fillStyle = '#fecaca'
    ctx.fillRect(2, 2, 12, 12)
    ctx.fillStyle = '#b91c1c'
    ctx.fillRect(7, 4, 2, 8)
    ctx.fillRect(4, 7, 8, 2)
  })

  paint(scene, 'mark', 80, 80, (ctx, w, h) => {
    ctx.strokeStyle = 'rgba(248,113,113,0.85)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 30, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(w / 2 - 8, h / 2)
    ctx.lineTo(w / 2 + 8, h / 2)
    ctx.moveTo(w / 2, h / 2 - 8)
    ctx.lineTo(w / 2, h / 2 + 8)
    ctx.stroke()
  })

  paint(scene, 'casing', 5, 3, (ctx) => {
    ctx.fillStyle = '#d4a017'
    ctx.fillRect(0, 0, 5, 3)
    ctx.fillStyle = '#fde68a'
    ctx.fillRect(0, 0, 2, 3)
  })

  paint(scene, 'spark', 6, 6, (ctx, w, h) => {
    ctx.fillStyle = '#fff7ed'
    ctx.fillRect(2, 0, 2, h)
    ctx.fillRect(0, 2, w, 2)
  })

  paint(scene, 'muzzle-pistol', 28, 18, (ctx, w, h) => {
    const g = ctx.createRadialGradient(6, h / 2, 1, 10, h / 2, 12)
    g.addColorStop(0, 'rgba(255,255,255,0.95)')
    g.addColorStop(0.35, 'rgba(253,224,71,0.9)')
    g.addColorStop(1, 'rgba(245,158,11,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(2, h / 2)
    ctx.lineTo(w - 4, 2)
    ctx.lineTo(12, h / 2)
    ctx.lineTo(w - 4, h - 2)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.beginPath()
    ctx.arc(6, h / 2, 3.2, 0, Math.PI * 2)
    ctx.fill()
  })

  paint(scene, 'muzzle-smg', 26, 12, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0)
    g.addColorStop(0, 'rgba(255,255,255,0.95)')
    g.addColorStop(0.4, 'rgba(125,211,252,0.75)')
    g.addColorStop(1, 'rgba(14,165,233,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(1, h / 2)
    ctx.lineTo(w, 2)
    ctx.lineTo(w, h - 2)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.fillRect(1, h / 2 - 1.5, 8, 3)
  })

  paint(scene, 'muzzle-shotgun', 42, 32, (ctx, w, h) => {
    const g = ctx.createRadialGradient(4, h / 2, 2, 18, h / 2, 22)
    g.addColorStop(0, 'rgba(255,247,237,0.95)')
    g.addColorStop(0.3, 'rgba(251,146,60,0.8)')
    g.addColorStop(1, 'rgba(194,65,12,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(2, h / 2)
    ctx.lineTo(w - 2, 1)
    ctx.lineTo(w * 0.45, h / 2)
    ctx.lineTo(w - 2, h - 1)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = 'rgba(254,215,170,0.85)'
    ctx.lineWidth = 2
    for (let i = 0; i < 5; i += 1) {
      const t = i / 4 - 0.5
      ctx.beginPath()
      ctx.moveTo(4, h / 2)
      ctx.lineTo(w - 3, h / 2 + t * (h - 4))
      ctx.stroke()
    }
  })

  paint(scene, 'muzzle-barrel', 36, 36, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, 16)
    g.addColorStop(0, 'rgba(253,224,71,0.7)')
    g.addColorStop(0.45, 'rgba(120,113,108,0.55)')
    g.addColorStop(1, 'rgba(68,64,60,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(168,162,158,0.5)'
    ctx.beginPath()
    ctx.ellipse(w / 2 - 4, h / 2 + 3, 10, 6, -0.3, 0, Math.PI * 2)
    ctx.fill()
  })

  paint(scene, 'muzzle-grenade', 30, 30, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, 13)
    g.addColorStop(0, 'rgba(190,242,100,0.7)')
    g.addColorStop(0.5, 'rgba(63,98,18,0.45)')
    g.addColorStop(1, 'rgba(20,83,45,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(163,163,163,0.7)'
    ctx.fillRect(w / 2 - 2, 4, 4, 6)
  })

  paint(scene, 'muzzle-barricade', 34, 24, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(168,162,158,0.55)'
    ctx.fillRect(4, 8, w - 8, 8)
    ctx.fillStyle = 'rgba(214,211,209,0.7)'
    ctx.fillRect(4, 8, w - 8, 3)
    ctx.fillStyle = 'rgba(87,83,78,0.4)'
    ctx.beginPath()
    ctx.ellipse(10, h - 6, 7, 4, 0, 0, Math.PI * 2)
    ctx.ellipse(24, h - 5, 6, 3, 0, 0, Math.PI * 2)
    ctx.fill()
  })

  paint(scene, 'muzzle-mine', 24, 24, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(239,68,68,0.85)'
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(254,202,202,0.9)'
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 2.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(248,113,113,0.8)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(w / 2, 2)
    ctx.lineTo(w / 2, h - 2)
    ctx.moveTo(2, h / 2)
    ctx.lineTo(w - 2, h / 2)
    ctx.stroke()
  })

  paint(scene, 'muzzle-rocket', 48, 26, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0)
    g.addColorStop(0, 'rgba(255,255,255,0.95)')
    g.addColorStop(0.2, 'rgba(253,224,71,0.9)')
    g.addColorStop(0.55, 'rgba(249,115,22,0.75)')
    g.addColorStop(1, 'rgba(127,29,29,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(1, h / 2)
    ctx.lineTo(w, 1)
    ctx.lineTo(w * 0.4, h / 2)
    ctx.lineTo(w, h - 1)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = 'rgba(69,10,10,0.45)'
    ctx.beginPath()
    ctx.ellipse(w * 0.7, h / 2, 10, 6, 0, 0, Math.PI * 2)
    ctx.fill()
  })

  paint(scene, 'muzzle-charge', 32, 32, (ctx, w, h) => {
    ctx.strokeStyle = 'rgba(34,211,238,0.95)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(w / 2, 3)
    ctx.lineTo(w / 2 + 4, h / 2 - 4)
    ctx.lineTo(w / 2 - 6, h / 2 - 2)
    ctx.lineTo(w / 2 + 6, h / 2 + 4)
    ctx.lineTo(w / 2, h - 3)
    ctx.stroke()
    const g = ctx.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, 12)
    g.addColorStop(0, 'rgba(207,250,254,0.9)')
    g.addColorStop(1, 'rgba(8,145,178,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 12, 0, Math.PI * 2)
    ctx.fill()
  })

  paint(scene, 'muzzle-railgun', 56, 16, (ctx, w, h) => {
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
    ctx.fillStyle = '#ecfeff'
    ctx.beginPath()
    ctx.arc(5, h / 2, 4, 0, Math.PI * 2)
    ctx.fill()
  })

  paint(scene, 'muzzle-backblast', 36, 20, (ctx, w, h) => {
    const g = ctx.createLinearGradient(w, 0, 0, 0)
    g.addColorStop(0, 'rgba(255,237,213,0.85)')
    g.addColorStop(0.4, 'rgba(234,88,12,0.55)')
    g.addColorStop(1, 'rgba(69,10,10,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(w - 1, h / 2)
    ctx.lineTo(1, 1)
    ctx.lineTo(w * 0.45, h / 2)
    ctx.lineTo(1, h - 1)
    ctx.closePath()
    ctx.fill()
  })
}
