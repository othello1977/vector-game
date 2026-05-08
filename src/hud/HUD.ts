// ============================================================
// HUD.ts — Score, titolo, game over overlay
// ============================================================

import Phaser from 'phaser'
import { GAME_WIDTH } from '../config'

type GameState = 'title' | 'playing' | 'gameover'

export class HUD {
  private scene: Phaser.Scene
  private scoreText!: Phaser.GameObjects.Text
  private titleGroup!: Phaser.GameObjects.Group
  private gameoverGroup!: Phaser.GameObjects.Group
  private blinkTimer = 0
  private blinkVisible = true

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.createScoreText()
    this.createTitleOverlay()
    this.createGameOverOverlay()
  }

  private createScoreText(): void {
    this.scoreText = this.scene.add.text(16, 16, 'SCORE: 0000', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#00ffcc',
    })
    this.scoreText.setDepth(10)
    this.scoreText.setVisible(false)
  }

  private createTitleOverlay(): void {
    const cx = GAME_WIDTH / 2
    this.titleGroup = this.scene.add.group()

    const title = this.scene.add.text(cx, 280, 'VECTOR RING', {
      fontFamily: 'monospace',
      fontSize: '52px',
      color: '#00ffff',
      stroke: '#004444',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10)

    const sub = this.scene.add.text(cx, 360, 'SURVIVAL ARCADE', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#00ffcc',
    }).setOrigin(0.5).setDepth(10)

    const controls = this.scene.add.text(cx, 420, '← → ↑ ↓  /  A W S D  —  move ship', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5).setDepth(10)

    const hint = this.scene.add.text(cx, 460, 'dodge the obstacles · survive as long as you can', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#666666',
    }).setOrigin(0.5).setDepth(10)

    // Testo lampeggiante "press space"
    const pressSpace = this.scene.add.text(cx, 520, '[ PRESS SPACE TO START ]', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#00ffcc',
    }).setOrigin(0.5).setDepth(10).setName('pressSpace')

    this.titleGroup.addMultiple([title, sub, controls, hint, pressSpace])
  }

  private createGameOverOverlay(): void {
    const cx = GAME_WIDTH / 2
    this.gameoverGroup = this.scene.add.group()

    const gameOver = this.scene.add.text(cx, 320, 'GAME OVER', {
      fontFamily: 'monospace',
      fontSize: '56px',
      color: '#ff0044',
      stroke: '#440000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10).setName('gameOverText')

    const finalScore = this.scene.add.text(cx, 400, 'SCORE: 0000', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(10).setName('finalScore')

    const retry = this.scene.add.text(cx, 460, '[ PRESS SPACE OR R TO RETRY ]', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ff00ff',
    }).setOrigin(0.5).setDepth(10).setName('retryText')

    this.gameoverGroup.addMultiple([gameOver, finalScore, retry])
    this.gameoverGroup.setVisible(false)
  }

  setState(state: GameState, score = 0): void {
    this.currentState = state
    this.blinkVisible = true  // reset blink a ogni cambio stato
    this.blinkTimer = 0
    this.scoreText.setVisible(state === 'playing')
    this.titleGroup.setVisible(state === 'title')
    this.gameoverGroup.setVisible(state === 'gameover')

    if (state === 'gameover') {
      const finalScore = this.gameoverGroup.getChildren().find(
        (c) => (c as Phaser.GameObjects.Text).name === 'finalScore',
      ) as Phaser.GameObjects.Text | undefined
      finalScore?.setText(`SCORE: ${String(score).padStart(4, '0')}`)
    }
  }

  updateScore(score: number): void {
    this.scoreText.setText(`SCORE: ${String(score).padStart(4, '0')}`)
  }

  private currentState: GameState = 'title'

  update(delta: number): void {
    // Blink effetto per i testi lampeggianti
    this.blinkTimer += delta
    if (this.blinkTimer > 500) {
      this.blinkTimer = 0
      this.blinkVisible = !this.blinkVisible

      // Aggiorna solo il testo dello stato corrente
      if (this.currentState === 'title') {
        const pressSpace = this.titleGroup.getChildren().find(
          (c) => (c as Phaser.GameObjects.Text).name === 'pressSpace',
        ) as Phaser.GameObjects.Text | undefined
        pressSpace?.setVisible(this.blinkVisible)
      }

      if (this.currentState === 'gameover') {
        const retry = this.gameoverGroup.getChildren().find(
          (c) => (c as Phaser.GameObjects.Text).name === 'retryText',
        ) as Phaser.GameObjects.Text | undefined
        retry?.setVisible(this.blinkVisible)
      }
    }
  }
}
