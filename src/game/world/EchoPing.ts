import Phaser from 'phaser'
import { UNIVERSAL_PING } from '../../data/heroes'
import { TEAM_PLAYER, type Actor } from '../actors/Actor'

/**
 * Sonar slap. Outlines everything alive inside the radius straight through
 * walls, and hands your own position to anybody close enough to hear it.
 */
export class EchoPing {
  private readonly scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  /** Returns the actors the ping exposed. Blips are only drawn for the player's ping. */
  fire(origin: Actor, actors: Actor[], range: number, revealMs: number, drawBlips: boolean): Actor[] {
    const ring = this.scene.add
      .image(origin.sprite.x, origin.sprite.y, 'ping-ring')
      .setDepth(24)
      .setScale(0.2)
      .setAlpha(0.9)
    this.scene.tweens.add({
      targets: ring,
      scale: (range / 44) * 1.05,
      alpha: 0,
      duration: 620,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    })

    const found: Actor[] = []
    for (const actor of actors) {
      if (!actor.alive || actor.id === origin.id) continue
      const dist = Phaser.Math.Distance.Between(
        origin.sprite.x,
        origin.sprite.y,
        actor.sprite.x,
        actor.sprite.y,
      )
      if (dist > range) continue
      found.push(actor)
      if (!drawBlips) continue
      const friendly = actor.team === origin.team
      const blip = this.scene.add
        .image(actor.sprite.x, actor.sprite.y, friendly ? 'blip-ally' : 'blip')
        .setDepth(25)
      this.scene.tweens.add({
        targets: blip,
        alpha: 0,
        scale: 1.6,
        duration: revealMs,
        onComplete: () => blip.destroy(),
      })
    }
    return found
  }

  /** Convenience wrapper for the universal ping every hero carries. */
  fireUniversal(origin: Actor, actors: Actor[]): Actor[] {
    return this.fire(
      origin,
      actors,
      UNIVERSAL_PING.range,
      UNIVERSAL_PING.revealMs,
      origin.team === TEAM_PLAYER,
    )
  }
}
