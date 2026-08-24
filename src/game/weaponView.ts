import type { WeaponId } from '../data/weapons'
import type { CharacterPose } from './characterAssets'

export type ShotFlash = {
  pose: CharacterPose
  muzzle: { x: number; y: number }
  flashKey: string
  flashOrigin: { x: number; y: number }
  flashScale: number
  flashMs: number
  casings: boolean
  backblast: boolean
  sparks: number
}

export function poseForWeapon(id: WeaponId): CharacterPose {
  switch (id) {
    case 'pistol':
      return 'gun'
    case 'smg':
    case 'rocket':
      return 'machine'
    case 'shotgun':
    case 'railgun':
      return 'silencer'
    case 'grenade':
    case 'barrel':
    case 'barricade':
    case 'mine':
    case 'charge':
      return 'hold'
    default: {
      const _never: never = id
      return _never
    }
  }
}

export function shotFxFor(id: WeaponId): ShotFlash {
  switch (id) {
    case 'pistol':
      return {
        pose: 'gun',
        muzzle: { x: 33, y: 9 },
        flashKey: 'muzzle-pistol',
        flashOrigin: { x: 0.12, y: 0.5 },
        flashScale: 1,
        flashMs: 90,
        casings: true,
        backblast: false,
        sparks: 3,
      }
    case 'smg':
      return {
        pose: 'machine',
        muzzle: { x: 34, y: 8 },
        flashKey: 'muzzle-smg',
        flashOrigin: { x: 0.08, y: 0.5 },
        flashScale: 0.9,
        flashMs: 50,
        casings: true,
        backblast: false,
        sparks: 2,
      }
    case 'shotgun':
      return {
        pose: 'silencer',
        muzzle: { x: 38, y: 8 },
        flashKey: 'muzzle-shotgun',
        flashOrigin: { x: 0.06, y: 0.5 },
        flashScale: 1.15,
        flashMs: 140,
        casings: true,
        backblast: false,
        sparks: 7,
      }
    case 'barrel':
      return {
        pose: 'hold',
        muzzle: { x: 20, y: 2 },
        flashKey: 'muzzle-barrel',
        flashOrigin: { x: 0.5, y: 0.5 },
        flashScale: 1,
        flashMs: 180,
        casings: false,
        backblast: false,
        sparks: 4,
      }
    case 'grenade':
      return {
        pose: 'hold',
        muzzle: { x: 20, y: 2 },
        flashKey: 'muzzle-grenade',
        flashOrigin: { x: 0.5, y: 0.5 },
        flashScale: 1,
        flashMs: 160,
        casings: false,
        backblast: false,
        sparks: 2,
      }
    case 'barricade':
      return {
        pose: 'hold',
        muzzle: { x: 20, y: 2 },
        flashKey: 'muzzle-barricade',
        flashOrigin: { x: 0.5, y: 0.5 },
        flashScale: 1,
        flashMs: 170,
        casings: false,
        backblast: false,
        sparks: 3,
      }
    case 'mine':
      return {
        pose: 'hold',
        muzzle: { x: 20, y: 2 },
        flashKey: 'muzzle-mine',
        flashOrigin: { x: 0.5, y: 0.5 },
        flashScale: 1,
        flashMs: 150,
        casings: false,
        backblast: false,
        sparks: 2,
      }
    case 'rocket':
      return {
        pose: 'machine',
        muzzle: { x: 34, y: 8 },
        flashKey: 'muzzle-rocket',
        flashOrigin: { x: 0.04, y: 0.5 },
        flashScale: 1.25,
        flashMs: 200,
        casings: false,
        backblast: true,
        sparks: 6,
      }
    case 'charge':
      return {
        pose: 'hold',
        muzzle: { x: 20, y: 2 },
        flashKey: 'muzzle-charge',
        flashOrigin: { x: 0.5, y: 0.5 },
        flashScale: 1,
        flashMs: 180,
        casings: false,
        backblast: false,
        sparks: 5,
      }
    case 'railgun':
      return {
        pose: 'silencer',
        muzzle: { x: 38, y: 8 },
        flashKey: 'muzzle-railgun',
        flashOrigin: { x: 0.02, y: 0.5 },
        flashScale: 1.1,
        flashMs: 160,
        casings: false,
        backblast: false,
        sparks: 8,
      }
    default: {
      const _never: never = id
      return _never
    }
  }
}

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
