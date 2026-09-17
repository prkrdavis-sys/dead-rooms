import Phaser from 'phaser'
import { TILE } from '../../data/maps'
import { blockedAtPixel, type RoomGrid } from '../world/grid'
import { hasLineOfSight } from './raycast'
import { conePolygon, type ConeSpec } from './visionPolygon'

const MEMORY_ALPHA = 0.16
/** Fixtures do not move, so their polygons only need refreshing occasionally. */
const STATIC_POLY_TTL_MS = 420

type CachedPolygon = { at: number; points: Phaser.Types.Math.Vector2Like[] }

/**
 * Owns everything the player is allowed to see.
 *
 * The map is stamped once into a render texture and clipped to the union of
 * every active cone; a second, squad-only mask is handed out for the additive
 * glow that makes your own flashlight brighter than the building's fixtures.
 * Anything already lit once is also painted into a faint memory layer, so the
 * floorplan is remembered but the people standing on it are not.
 *
 * One masked map layer is deliberate: two masked render textures fight over
 * the stencil buffer and the brighter one drops out entirely, and a second
 * full tile layer costs more than the whole raycast budget.
 */
export class VisionSystem {
  private readonly scene: Phaser.Scene
  private readonly grid: RoomGrid
  private readonly squadGfx: Phaser.GameObjects.Graphics
  private readonly allGfx: Phaser.GameObjects.Graphics
  private readonly allMask: Phaser.Display.Masks.GeometryMask
  private readonly squadMask: Phaser.Display.Masks.GeometryMask
  private readonly mapTex: Phaser.GameObjects.RenderTexture
  private readonly memory: Phaser.GameObjects.RenderTexture
  private readonly seen: boolean[][] = []
  private readonly staticPolys = new Map<string, CachedPolygon>()
  private cones: ConeSpec[] = []
  private readonly rayBudget: number
  private readonly memoryEvery: number
  private memoryTick = 0

  constructor(scene: Phaser.Scene, grid: RoomGrid, lowSpec: boolean) {
    this.scene = scene
    this.grid = grid
    this.rayBudget = lowSpec ? 34 : 60
    this.memoryEvery = lowSpec ? 8 : 5

    const width = grid.cols * TILE
    const height = grid.rows * TILE
    this.memory = scene.add.renderTexture(0, 0, width, height).setOrigin(0, 0).setDepth(0).setAlpha(MEMORY_ALPHA)
    this.mapTex = scene.add.renderTexture(0, 0, width, height).setOrigin(0, 0).setDepth(1)

    for (let r = 0; r < grid.rows; r += 1) {
      this.seen[r] = []
      for (let c = 0; c < grid.cols; c += 1) {
        this.seen[r][c] = false
        this.mapTex.draw(grid.blocked[r]?.[c] ? 'wall' : 'floor', c * TILE, r * TILE)
      }
    }

    this.squadGfx = scene.make.graphics({ x: 0, y: 0 }, false)
    this.allGfx = scene.make.graphics({ x: 0, y: 0 }, false)
    this.squadMask = this.squadGfx.createGeometryMask()
    this.allMask = this.allGfx.createGeometryMask()
    this.mapTex.setMask(this.allMask)
  }

  /** Clip a world object to everything currently lit. */
  apply(obj: Phaser.GameObjects.GameObject & { setMask: (mask: Phaser.Display.Masks.GeometryMask) => unknown }): void {
    obj.setMask(this.allMask)
  }

  /** Clip an object to just the squad's own light, for the cone glow overlay. */
  applySquadOnly(
    obj: Phaser.GameObjects.GameObject & { setMask: (mask: Phaser.Display.Masks.GeometryMask) => unknown },
  ): void {
    obj.setMask(this.squadMask)
  }

  update(cones: ConeSpec[]): void {
    this.cones = cones
    const now = this.scene.time.now
    this.squadGfx.clear().fillStyle(0xffffff, 1)
    this.allGfx.clear().fillStyle(0xffffff, 1)
    for (const cone of cones) {
      const points = cone.remember ? this.freshPolygon(cone) : this.cachedPolygon(cone, now)
      if (points.length < 3) continue
      this.allGfx.fillPoints(points, true)
      if (cone.remember) this.squadGfx.fillPoints(points, true)
    }

    this.memoryTick += 1
    if (this.memoryTick % this.memoryEvery === 0) this.stampMemory()
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

  private freshPolygon(cone: ConeSpec): Phaser.Types.Math.Vector2Like[] {
    return toPoints(conePolygon(this.grid, cone, this.rayBudget))
  }

  private cachedPolygon(cone: ConeSpec, now: number): Phaser.Types.Math.Vector2Like[] {
    const key = `${Math.round(cone.x)}:${Math.round(cone.y)}:${Math.round(cone.range)}`
    const hit = this.staticPolys.get(key)
    if (hit && now - hit.at < STATIC_POLY_TTL_MS) return hit.points
    const points = toPoints(conePolygon(this.grid, cone, Math.round(this.rayBudget * 0.6)))
    this.staticPolys.set(key, { at: now, points })
    return points
  }

  private stampMemory(): void {
    for (const cone of this.cones) {
      if (!cone.remember) continue
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
    this.mapTex.clearMask(true)
    this.squadMask.destroy()
    this.squadGfx.destroy()
    this.allGfx.destroy()
    this.mapTex.destroy()
    this.memory.destroy()
  }
}

function toPoints(flat: number[]): Phaser.Types.Math.Vector2Like[] {
  const points: Phaser.Types.Math.Vector2Like[] = []
  for (let i = 0; i < flat.length; i += 2) points.push({ x: flat[i], y: flat[i + 1] })
  return points
}
