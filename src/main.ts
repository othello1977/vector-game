import Phaser from 'phaser'
import { GameScene } from './scenes/GameScene'
import { GAME_WIDTH, GAME_HEIGHT } from './config'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#000000',
  scene: [GameScene],
  parent: 'game',
  antialias: true,
}

new Phaser.Game(config)
