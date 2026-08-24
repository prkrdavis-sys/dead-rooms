import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { PlayScene } from './scenes/PlayScene'
import { GAME_HEIGHT, GAME_WIDTH, type RunConfig } from './types'

export function createDeadRoomsGame(parent: HTMLElement, run: RunConfig): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#1c1814',
    pixelArt: false,
    roundPixels: true,
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, PlayScene],
    audio: { disableWebAudio: false },
    input: { activePointers: 3 },
    disableContextMenu: true,
  })
  game.registry.set('run', run)
  return game
}
