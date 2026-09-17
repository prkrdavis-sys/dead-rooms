import Phaser from 'phaser'
import { ENEMY_BY_ID, type EnemyId } from '../../data/enemies'
import { HERO_BY_ID, type HeroId } from '../../data/heroes'
import { applyCharBody, applyNeonRim } from '../createAnims'
import { poseSheetKey } from '../characterAssets'
import { TEAM_PLAYER, TEAM_SWARM, type Actor } from './Actor'

const TEAM_COLORS = [0x38bdf8, 0xfb7185, 0xfacc15, 0xa78bfa]
const SWARM_COLOR = 0x86efac

export function teamColor(team: number): number {
  if (team === TEAM_SWARM) return SWARM_COLOR
  return TEAM_COLORS[team % TEAM_COLORS.length]
}

/** Owns every hero and creature sprite in the match and their physics group. */
export class ActorRegistry {
  readonly group: Phaser.Physics.Arcade.Group
  private readonly scene: Phaser.Scene
  private readonly actors: Actor[] = []
  private readonly decorate: (sprite: Phaser.Physics.Arcade.Sprite) => void
  private nextId = 1

  constructor(scene: Phaser.Scene, decorate: (sprite: Phaser.Physics.Arcade.Sprite) => void) {
    this.scene = scene
    this.decorate = decorate
    this.group = scene.physics.add.group({ runChildUpdate: false })
  }

  all(): Actor[] {
    return this.actors
  }

  living(): Actor[] {
    return this.actors.filter((actor) => actor.alive)
  }

  livingOnTeam(team: number): Actor[] {
    return this.actors.filter((actor) => actor.alive && actor.team === team)
  }

  livingEnemiesOf(team: number): Actor[] {
    return this.actors.filter((actor) => actor.alive && actor.team !== team)
  }

  teamsAlive(): number[] {
    const teams = new Set<number>()
    for (const actor of this.actors) if (actor.alive) teams.add(actor.team)
    return [...teams]
  }

  fromSprite(sprite: Phaser.GameObjects.GameObject): Actor | null {
    return (sprite.getData('actor') as Actor | undefined) ?? null
  }

  spawnHero(heroId: HeroId, team: number, x: number, y: number, isPlayer: boolean): Actor {
    const hero = HERO_BY_ID[heroId]
    const sheet = poseSheetKey(hero.pack, hero.weapon.pose)
    const sprite = this.group.create(x, y, sheet, 0) as Phaser.Physics.Arcade.Sprite
    sprite.setDepth(isPlayer ? 13 : 12)
    sprite.setCollideWorldBounds(true)
    sprite.setDamping(true)
    sprite.setDrag(0.0008)
    sprite.setBounce(0)
    applyCharBody(sprite, 12)
    sprite.play(`${sheet}-idle`)
    applyNeonRim(sprite, teamColor(team), isPlayer ? 5 : 3.5)
    this.decorate(sprite)

    const actor: Actor = {
      id: this.nextId,
      kind: 'hero',
      sprite,
      team,
      name: hero.name,
      heroId,
      enemyId: null,
      hp: hero.hp,
      maxHp: hero.hp,
      armor: hero.armor,
      maxArmor: hero.armor,
      mag: hero.weapon.mag,
      reloadUntil: 0,
      lastHitAt: 0,
      cooldownUntil: 0,
      fireUntil: 0,
      facing: { x: 0, y: -1 },
      moving: false,
      gadgetReadyAt: 0,
      gadgetActiveUntil: 0,
      pingReadyAt: 0,
      blindUntil: 0,
      speedMul: 1,
      coneMul: 1,
      isPlayer,
      alive: true,
      bot: isPlayer
        ? null
        : {
            goal: 'patrol',
            target: { x, y },
            contact: null,
            contactAt: 0,
            contactId: 0,
            repathAt: 0,
            decideAt: 0,
            strafe: Math.random() < 0.5 ? -1 : 1,
            holdUntil: 0,
          },
      creature: null,
    }
    this.nextId += 1
    sprite.setData('actor', actor)
    this.actors.push(actor)
    return actor
  }

  spawnCreature(enemyId: EnemyId, x: number, y: number, hpBonus: number): Actor {
    const def = ENEMY_BY_ID[enemyId]
    const sheet = poseSheetKey(def.pack, 'hold')
    const sprite = this.group.create(x, y, sheet, 0) as Phaser.Physics.Arcade.Sprite
    sprite.setDepth(11)
    sprite.setScale(def.scale)
    sprite.setBounce(0)
    applyCharBody(sprite, def.radius)
    sprite.play(`${sheet}-walk`)
    sprite.anims.timeScale = Phaser.Math.Clamp(def.speed / 90, 0.55, 1.8)
    applyNeonRim(sprite, def.tint, 3)
    this.decorate(sprite)

    const actor: Actor = {
      id: this.nextId,
      kind: 'creature',
      sprite,
      team: TEAM_SWARM,
      name: def.name,
      heroId: null,
      enemyId,
      hp: def.hp + hpBonus,
      maxHp: def.hp + hpBonus,
      armor: 0,
      maxArmor: 0,
      mag: 0,
      reloadUntil: 0,
      lastHitAt: 0,
      cooldownUntil: 0,
      fireUntil: 0,
      facing: { x: 0, y: -1 },
      moving: true,
      gadgetReadyAt: 0,
      gadgetActiveUntil: 0,
      pingReadyAt: 0,
      blindUntil: 0,
      speedMul: 1,
      coneMul: 1,
      isPlayer: false,
      alive: true,
      bot: null,
      creature: {
        phase: 'chase',
        nextSpecial: 0,
        telegraphUntil: 0,
        dir: { x: 0, y: -1 },
      },
    }
    this.nextId += 1
    sprite.setData('actor', actor)
    this.actors.push(actor)
    return actor
  }

  player(): Actor | null {
    return this.actors.find((actor) => actor.isPlayer) ?? null
  }

  playerSquad(): Actor[] {
    return this.actors.filter((actor) => actor.team === TEAM_PLAYER && actor.kind === 'hero')
  }

  retire(actor: Actor): void {
    actor.alive = false
    const sprite = actor.sprite
    if (sprite.body) sprite.setVelocity(0, 0)
    sprite.anims.stop()
    sprite.disableBody(true, true)
    this.scene.time.delayedCall(0, () => {
      if (sprite.scene) sprite.destroy()
    })
  }
}
