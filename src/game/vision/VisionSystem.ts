import Phaser from 'phaser'
import { TILE } from '../../data/maps'
import { blockedAtPixel, type RoomGrid } from '../world/grid'
import { hasLineOfSight } from './raycast'
import { conePolygon, type ConeSpec } from './visionPolygon'

const MEMORY_ALPHA = 0.34

/**
 * Owns everything the player is allowed to see. Lit geometry and actors are
 * clipped to the union of the active cones; tiles that have ever been lit stay
 * painted into a dim memory layer so the floorplan is remembered but the
 * things standing on it are not.
 */
export class VisionSystem {
  readonly litLayer: Phaser.GameObjects.Container
  private readonly scene: Phaser.Scene
  private readonly grid: RoomGrid
  private readonly gfx: Phaser.GameObjects.Graphics
  private readonly mask: Phaser.Display.Masks.GeometryMask
  private readonly memory: Phaser.GameObjects.RenderTexture
  private readonly seen: boolean[][] = []
  private cones: ConeSpec[] = []
  private rayBudget: number
  private memoryTick = 0

  constructor(scene: Phaser.Scene, grid: RoomGrid, lowSpec: boolean) {
    this.scene = scene
    this.grid = grid
    this.rayBudget = lowSpec ? 44 : 84

    this.memory = scene.add
      .renderTexture(0, 0, grid.cols * TILE, grid.rows * TILE)
      .setOrigin(0, 0)
      .setDepth(0)
      .setAlpha(MEMORY_ALPHA)

    this.litLayer = scene.add.container(0, 0).setDepth(2)
    this.gfx = scene.make.graphics({ x: 0, y: 0 }, false)
    this.mask = this.gfx.createGeometryMask()
    this.litLayer.setMask(this.mask)

    for (let r = 0; r < grid.rows; r += 1) {
      this.seen[r] = []
      for (let c = 0; c < grid.cols; c += 1) {
        this.seen[r][c] = false
        const solid = grid.blocked[r]?.[c]
        const tile = scene.add
          .image(c * TILE + TILE / 2, r * TILE + TILE / 2, solid ? 'wall' : 'floor')
          .setDepth(solid ? 1 : 0)
        this.litLayer.add(tile)
      }
    }
  }

  /** Clip a world object to the lit region. */
  apply(obj: Phaser.GameObjects.GameObject & { setMask: (mask: Phaser.Display.Masks.GeometryMask) => unknown }): void {
    obj.setMask(this.mask)
  }

  update(cones: ConeSpec[]): void {
    this.cones = cones
    this.gfx.clear()
    this.gfx.fillStyle(0xffffff, 1)
    const perCone = Math.max(12, Math.round(this.rayBudget / Math.max(1, cones.length)))
    for (const cone of cones) {
      const flat = conePolygon(this.grid, cone, cone.spread > Math.PI ? perCone : Math.max(16, perCone))
      const points: Phaser.Types.Math.Vector2Like[] = []
      for (let i = 0; i < flat.length; i += 2) points.push({ x: flat[i], y: flat[i + 1] })
      if (points.length > 2) this.gfx.fillPoints(points, true)
    }

    this.memoryTick += 1
    if (this.memoryTick % 3 === 0) this.stampMemory()
  }

  /** True when the point falls inside any active cone with clear line of sight. */
  isLit(x: number, y: number): boolean {
    for (const cone of this.cones) {
      const dx = x - cone.x
      const dy = y - cone.y
      const dist = Math.hypot(dx, dy)
      if (dist > cone.range) continue
      if (cone.spread < Math.PI * 2 - 0.01) {
        const delta = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - cone.angle))
        if (delta > cone.spread / 2) continue
      }
      if (hasLineOfSight(this.grid, cone.x, cone.y, x, y)) return true
    }
    return false
  }

  private stampMemory(): void {
    for (const cone of this.cones) {
      const reach = cone.range + TILE
      const minC = Math.max(0, Math.floor((cone.x - reach) / TILE))
      const maxC = Math.min(this.grid.cols - 1, Math.floor((cone.x + reach) / TILE))
      const minR = Math.max(0, Math.floor((cone.y - reach) / TILE))
      const maxR = Math.min(this.grid.rows - 1, Math.floor((cone.y + reach) / TILE))
      for (let r = minR; r <= maxR; r += 1) {
        for (let c = minC; c <= maxC; c += 1) {
          if (this.seen[r]?.[c]) continue
          const cx = c * TILE + TILE / 2
          const cy = r * TILE + TILE / 2
          if (!this.isLit(cx, cy) && !this.wallTouchesLight(cx, cy)) continue
          this.seen[r][c] = true
          this.memory.draw(this.grid.blocked[r]?.[c] ? 'wall' : 'floor', c * TILE, r * TILE)
        }
      }
    }
  }

  /** Walls block their own centre, so remember them when a neighbouring floor is lit. */
  private wallTouchesLight(x: number, y: number): boolean {
    if (!blockedAtPixel(this.grid, x, y)) return false
    const probes = [
      [TILE, 0],
      [-TILE, 0],
      [0, TILE],
      [0, -TILE],
    ]
    for (const [ox, oy] of probes) {
      if (!blockedAtPixel(this.grid, x + ox, y + oy) && this.isLit(x + ox, y + oy)) return true
    }
    return false
  }

  destroy(): void {
    this.litLayer.clearMask()
    this.mask.destroy()
    this.gfx.destroy()
    this.memory.destroy()
    this.litLayer.destroy(true)
    void this.scene
  }
}
