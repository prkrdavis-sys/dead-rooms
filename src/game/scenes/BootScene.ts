import Phaser from 'phaser'
import { CHARACTER_PACKS, CHARACTER_POSES, characterUrl, rawTextureKey } from '../characterAssets'
import { createCharacterAnims } from '../createAnims'
import { createGeneratedTextures } from '../createTextures'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot')
  }

  preload(): void {
    for (const pack of CHARACTER_PACKS) {
      for (const pose of CHARACTER_POSES) {
        this.load.image(rawTextureKey(pack.id, pose), characterUrl(pack, pose))
      }
    }

    this.load.audio('ui-click', '/assets/kenney/audio/click_001.ogg')
    this.load.audio('ui-ok', '/assets/kenney/audio/confirmation_001.ogg')
    this.load.audio('laser1', '/assets/kenney/audio/laser1.mp3')
    this.load.audio('laser2', '/assets/kenney/audio/laser2.mp3')
    this.load.audio('laser3', '/assets/kenney/audio/laser3.mp3')
    this.load.audio('laser9', '/assets/kenney/audio/laser9.mp3')
    this.load.audio('zap1', '/assets/kenney/audio/zap1.mp3')
    this.load.audio('zap2', '/assets/kenney/audio/zap2.mp3')
    this.load.audio('boom1', '/assets/kenney/audio/spaceTrash1.mp3')
    this.load.audio('boom2', '/assets/kenney/audio/spaceTrash2.mp3')
    this.load.audio('pickup', '/assets/kenney/audio/powerUp1.mp3')
    this.load.audio('empty', '/assets/kenney/audio/lowDown.mp3')
    this.load.audio('death-hit', '/assets/kenney/audio/error_001.ogg')
    this.load.audio('death-drop', '/assets/kenney/audio/drop_001.ogg')
  }

  create(): void {
    createGeneratedTextures(this)
    createCharacterAnims(this)
    this.scene.start('play')
  }
}
