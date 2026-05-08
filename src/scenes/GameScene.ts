import Phaser from 'phaser'

// Placeholder — verrà implementata negli step successivi
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    this.add.text(400, 400, 'Vector Ring — Loading...', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#00ffcc',
    }).setOrigin(0.5)
  }
}
