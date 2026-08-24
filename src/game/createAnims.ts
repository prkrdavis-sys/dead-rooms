import Phaser from 'phaser'
import {
  CHARACTER_PACKS,
  CHAR_BODY,
  CHAR_FRAME_H,
  CHAR_FRAME_W,
  CHAR_STAMP,
  rawTextureKey,
  soldierSheetKey,
  type CharacterPackId,
  type CharacterPose,
} from './characterAssets'

const IDLE_FRAMES = 4
const WALK_FRAMES = 8
const FIRE_FRAMES = 4
const DEATH_FRAMES = 8
const SOLDIER_TOTAL = IDLE_FRAMES + WALK_FRAMES + FIRE_FRAMES
const ENEMY_TOTAL = IDLE_FRAMES + WALK_FRAMES

export const SOLDIER_DEATH_ANIM = 'soldier-death'

function sourceImage(scene: Phaser.Scene, key: string): CanvasImageSource | null {
  if (!scene.textures.exists(key)) return null
  return scene.textures.get(key).getSourceImage() as CanvasImageSource
}

function drawFeet(
  ctx: CanvasRenderingContext2D,
  t: number,
  stride: number,
  alpha: number,
): void {
  const reach = Math.sin(t) * stride
  ctx.fillStyle = `rgba(22, 16, 12, ${alpha})`
  ctx.beginPath()
  ctx.ellipse(CHAR_BODY.x - 1 + reach, CHAR_BODY.y - 11, 6.5, 3.4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(CHAR_BODY.x - 1 - reach, CHAR_BODY.y + 11, 6.5, 3.4, 0, 0, Math.PI * 2)
  ctx.fill()
}

function stampPose(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  t: number,
  recede: number,
  bob: number,
  sway: number,
  shear: number,
): void {
  ctx.save()
  ctx.translate(CHAR_BODY.x, CHAR_BODY.y)
  ctx.rotate(Math.sin(t) * sway)
  ctx.transform(1, 0, Math.sin(t * 2) * shear, 1, 0, 0)
  ctx.translate(-CHAR_BODY.x, -CHAR_BODY.y)
  ctx.drawImage(img, CHAR_STAMP.x - recede, CHAR_STAMP.y + bob)
  ctx.restore()
}

function paintIdle(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  index: number,
  ox: number,
): void {
  const t = (index / IDLE_FRAMES) * Math.PI * 2
  ctx.save()
  ctx.translate(ox, 0)
  drawFeet(ctx, t, 1.2, 0.32)
  stampPose(ctx, img, t, 0, Math.sin(t) * 0.8, 0.03, 0.012)
  ctx.restore()
}

function paintWalk(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  index: number,
  ox: number,
  alt: CanvasImageSource | null,
): void {
  const t = (index / WALK_FRAMES) * Math.PI * 2
  const useAlt = Boolean(alt) && index % 2 === 1
  const src = useAlt && alt ? alt : img
  ctx.save()
  ctx.translate(ox, 0)
  drawFeet(ctx, t, 6.5, 0.55)
  stampPose(ctx, src, t, 0, Math.abs(Math.sin(t)) * 2.2, 0.16, 0.09)
  ctx.restore()
}

function paintFire(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  index: number,
  ox: number,
  glow: string,
): void {
  const kick = [0, 6, 3, 1][index] ?? 0
  const t = index * 0.7
  ctx.save()
  ctx.translate(ox, 0)
  drawFeet(ctx, 0, 1, 0.4)
  stampPose(ctx, img, t, kick, 0, 0.02, 0)
  if (kick > 0) {
    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.ellipse(CHAR_BODY.x + 28 - kick, CHAR_BODY.y + 8, 10 + kick, 5, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
  }
  ctx.restore()
}

function addSheet(scene: Phaser.Scene, key: string, canvas: HTMLCanvasElement, frames: number): void {
  if (scene.textures.exists(key)) scene.textures.remove(key)
  const tex = scene.textures.addCanvas(key, canvas)
  if (!tex) return
  for (let i = 0; i < frames; i += 1) {
    tex.add(i, 0, i * CHAR_FRAME_W, 0, CHAR_FRAME_W, CHAR_FRAME_H)
  }
  tex.refresh()
}

function makeAnim(
  scene: Phaser.Scene,
  key: string,
  sheet: string,
  start: number,
  end: number,
  frameRate: number,
  repeat: number,
): void {
  if (scene.anims.exists(key)) scene.anims.remove(key)
  scene.anims.create({
    key,
    frames: scene.anims.generateFrameNumbers(sheet, { start, end }),
    frameRate,
    repeat,
  })
}

function soldierGlow(pose: CharacterPose): string {
  switch (pose) {
    case 'gun':
      return 'rgba(253, 224, 71, 0.55)'
    case 'machine':
      return 'rgba(251, 146, 60, 0.5)'
    case 'silencer':
      return 'rgba(125, 211, 252, 0.55)'
    case 'hold':
      return 'rgba(214, 211, 209, 0.35)'
    case 'stand':
      return 'rgba(255, 255, 255, 0.15)'
    case 'reload':
      return 'rgba(253, 186, 116, 0.4)'
    default: {
      const _never: never = pose
      return _never
    }
  }
}

function buildSoldierPose(scene: Phaser.Scene, pose: CharacterPose): void {
  const img = sourceImage(scene, rawTextureKey('soldier', pose))
  if (!img) return
  const fireImg =
    pose === 'hold' ? (sourceImage(scene, rawTextureKey('soldier', 'reload')) ?? img) : img
  const canvas = document.createElement('canvas')
  canvas.width = CHAR_FRAME_W * SOLDIER_TOTAL
  canvas.height = CHAR_FRAME_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  for (let i = 0; i < IDLE_FRAMES; i += 1) {
    paintIdle(ctx, img, i, i * CHAR_FRAME_W)
  }
  for (let i = 0; i < WALK_FRAMES; i += 1) {
    paintWalk(ctx, img, i, (IDLE_FRAMES + i) * CHAR_FRAME_W, null)
  }
  for (let i = 0; i < FIRE_FRAMES; i += 1) {
    paintFire(ctx, fireImg, i, (IDLE_FRAMES + WALK_FRAMES + i) * CHAR_FRAME_W, soldierGlow(pose))
  }

  const sheet = soldierSheetKey(pose)
  addSheet(scene, sheet, canvas, SOLDIER_TOTAL)
  makeAnim(scene, `${sheet}-idle`, sheet, 0, IDLE_FRAMES - 1, 7, -1)
  makeAnim(scene, `${sheet}-walk`, sheet, IDLE_FRAMES, IDLE_FRAMES + WALK_FRAMES - 1, 14, -1)
  makeAnim(
    scene,
    `${sheet}-fire`,
    sheet,
    IDLE_FRAMES + WALK_FRAMES,
    SOLDIER_TOTAL - 1,
    22,
    0,
  )
}

function paintDeath(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  index: number,
  ox: number,
): void {
  const t = index / Math.max(1, DEATH_FRAMES - 1)
  const collapse = t * t
  const stumble = Math.sin(t * Math.PI) * (1 - t)
  ctx.save()
  ctx.translate(ox, 0)
  ctx.beginPath()
  ctx.rect(0, 0, CHAR_FRAME_W, CHAR_FRAME_H)
  ctx.clip()
  drawFeet(ctx, t * 2, 2 + collapse * 4, 0.35 + t * 0.4)
  ctx.save()
  ctx.translate(CHAR_BODY.x + stumble * 4, CHAR_BODY.y + collapse * 5)
  ctx.rotate(-collapse * 1.05)
  ctx.scale(1 + collapse * 0.06, 1 - collapse * 0.38)
  ctx.translate(-CHAR_BODY.x, -CHAR_BODY.y)
  ctx.drawImage(img, CHAR_STAMP.x - collapse * 2, CHAR_STAMP.y + collapse * 3)
  ctx.restore()
  ctx.globalCompositeOperation = 'source-atop'
  ctx.fillStyle = `rgba(90, 8, 8, ${collapse * 0.4})`
  ctx.fillRect(0, 0, CHAR_FRAME_W, CHAR_FRAME_H)
  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()
}

function buildSoldierDeath(scene: Phaser.Scene): void {
  const img =
    sourceImage(scene, rawTextureKey('soldier', 'stand')) ??
    sourceImage(scene, rawTextureKey('soldier', 'hold'))
  if (!img) return
  const canvas = document.createElement('canvas')
  canvas.width = CHAR_FRAME_W * DEATH_FRAMES
  canvas.height = CHAR_FRAME_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  for (let i = 0; i < DEATH_FRAMES; i += 1) {
    paintDeath(ctx, img, i, i * CHAR_FRAME_W)
  }
  addSheet(scene, SOLDIER_DEATH_ANIM, canvas, DEATH_FRAMES)
  makeAnim(scene, SOLDIER_DEATH_ANIM, SOLDIER_DEATH_ANIM, 0, DEATH_FRAMES - 1, 8, 0)
}

function buildEnemyPack(scene: Phaser.Scene, packId: CharacterPackId): void {
  const hold = sourceImage(scene, rawTextureKey(packId, 'hold'))
  const stand = sourceImage(scene, rawTextureKey(packId, 'stand'))
  if (!hold) return
  const canvas = document.createElement('canvas')
  canvas.width = CHAR_FRAME_W * ENEMY_TOTAL
  canvas.height = CHAR_FRAME_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const idleSrc = stand ?? hold
  for (let i = 0; i < IDLE_FRAMES; i += 1) {
    paintIdle(ctx, idleSrc, i, i * CHAR_FRAME_W)
  }
  for (let i = 0; i < WALK_FRAMES; i += 1) {
    paintWalk(ctx, hold, i, (IDLE_FRAMES + i) * CHAR_FRAME_W, stand)
  }

  addSheet(scene, packId, canvas, ENEMY_TOTAL)
  const walkRate = packId === 'runner' ? 18 : packId === 'zombie' ? 8 : 11
  makeAnim(scene, `${packId}-idle`, packId, 0, IDLE_FRAMES - 1, 6, -1)
  makeAnim(scene, `${packId}-walk`, packId, IDLE_FRAMES, ENEMY_TOTAL - 1, walkRate, -1)
}

export function createCharacterAnims(scene: Phaser.Scene): void {
  const poses: CharacterPose[] = ['stand', 'hold', 'gun', 'machine', 'silencer', 'reload']
  for (const pose of poses) buildSoldierPose(scene, pose)
  buildSoldierDeath(scene)
  for (const pack of CHARACTER_PACKS) {
    if (pack.id === 'soldier') continue
    buildEnemyPack(scene, pack.id)
  }
}

export function applyCharBody(sprite: Phaser.Physics.Arcade.Sprite, radius: number): void {
  sprite.setOrigin(CHAR_BODY.x / CHAR_FRAME_W, CHAR_BODY.y / CHAR_FRAME_H)
  sprite.setCircle(radius, CHAR_BODY.x - radius, CHAR_BODY.y - radius)
}
