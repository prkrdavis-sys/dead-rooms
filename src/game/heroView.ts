import { HERO_BY_ID, type HeroId } from '../data/heroes'
import { poseSheetKey } from './characterAssets'

export function worldFromLocal(
  x: number,
  y: number,
  rotation: number,
  localX: number,
  localY: number,
): { x: number; y: number } {
  const cos = Math.cos(rotation)
  const sin = Math.sin(rotation)
  return {
    x: x + cos * localX - sin * localY,
    y: y + sin * localX + cos * localY,
  }
}

export function heroSheet(heroId: HeroId): string {
  const hero = HERO_BY_ID[heroId]
  return poseSheetKey(hero.pack, hero.weapon.pose)
}
