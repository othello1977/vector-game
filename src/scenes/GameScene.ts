// ============================================================
// GameScene.ts — Scena principale: orchestra tutti i moduli
// ============================================================

import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '../config'
import { Player, PlayerKeys } from '../player/Player'
import { ObstacleManager } from '../obstacles/ObstacleManager'
import { CollisionManager } from '../collision/CollisionManager'
import { DifficultyManager } from '../difficulty/DifficultyManager'
import { HUD } from '../hud/HUD'
import {
  drawRing,
  drawCenterPoint,
  drawSpeedLines,
  updateSpeedLines,
  createSpeedLines,
  SpeedLine,
  FlashWarpState,
  createFlashWarpState,
  updateFlashWarp,
  drawFlashWarp,
} from '../rendering/RenderHelpers'

type GameState = 'title' | 'playing' | 'gameover'

export class GameScene extends Phaser.Scene {
  private graphics!: Phaser.GameObjects.Graphics
  private player!: Player
  private obstacleManager!: ObstacleManager
  private collisionManager!: CollisionManager
  private difficultyManager!: DifficultyManager
  private hud!: HUD

  private state: GameState = 'title'
  private score = 0
  private survivalMs = 0

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keyW!: Phaser.Input.Keyboard.Key
  private keyA!: Phaser.Input.Keyboard.Key
  private keyS!: Phaser.Input.Keyboard.Key
  private keyD!: Phaser.Input.Keyboard.Key
  private keySpace!: Phaser.Input.Keyboard.Key
  private keyR!: Phaser.Input.Keyboard.Key

  // Flash collisione
  private flashAlpha = 0

  // Effetti visivi Step 10
  private speedLines: SpeedLine[] = []
  private flashWarp!: FlashWarpState

  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    this.graphics = this.add.graphics()
    this.graphics.setDepth(0)

    // Moduli
    this.player = new Player()
    this.obstacleManager = new ObstacleManager()
    this.collisionManager = new CollisionManager()
    this.difficultyManager = new DifficultyManager()
    this.hud = new HUD(this)

    // Speed lines (effetto warp)
    this.speedLines = createSpeedLines(60)
    this.flashWarp = createFlashWarpState()

    // Scanlines CRT — overlay statico creato una volta
    const scanlines = this.add.graphics()
    scanlines.setDepth(50)
    for (let y = 0; y < GAME_HEIGHT; y += 3) {
      scanlines.fillStyle(0x000000, 0.12)
      scanlines.fillRect(0, y, GAME_WIDTH, 1)
    }

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keyW = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W)
    this.keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A)
    this.keyS = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S)
    this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    this.keySpace = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.keyR = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R)

    // Stato iniziale
    this.setState('title')
  }

  update(_time: number, delta: number): void {
    this.graphics.clear()

    switch (this.state) {
      case 'title':
        this.updateTitle(delta)
        break
      case 'playing':
        this.updatePlaying(delta)
        break
      case 'gameover':
        this.updateGameOver(delta)
        break
    }

    this.hud.update(delta)
  }

  private updateTitle(_delta: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
      this.startGame()
    }
  }

  private updatePlaying(delta: number): void {
    // Keys player (frecce o WASD, entrambe supportate)
    const keys: PlayerKeys = {
      left: this.cursors.left.isDown || this.keyA.isDown,
      right: this.cursors.right.isDown || this.keyD.isDown,
      up: this.cursors.up.isDown || this.keyW.isDown,
      down: this.cursors.down.isDown || this.keyS.isDown,
    }

    // Aggiorna moduli
    this.difficultyManager.update(delta)
    this.obstacleManager.update(
      delta,
      this.difficultyManager.spawnInterval,
      this.difficultyManager.obstacleSpeed,
    )
    this.player.update(delta, keys)

    // Score
    this.survivalMs += delta
    this.score = Math.floor(this.survivalMs / 100)
    this.hud.updateScore(this.score)
    this.hud.updateLevel(this.difficultyManager.level)

    // Collisione
    const hit = this.collisionManager.check(this.player, this.obstacleManager.obstacles)
    if (hit) {
      this.flashAlpha = 0.6
      this.setState('gameover')
    }

    // Rendering
    updateSpeedLines(this.speedLines, delta, this.difficultyManager.obstacleSpeed)
    drawSpeedLines(this.graphics, this.speedLines)
    updateFlashWarp(this.flashWarp, delta)
    drawFlashWarp(this.graphics, this.flashWarp)
    drawRing(this.graphics)
    drawCenterPoint(this.graphics)
    this.obstacleManager.draw(this.graphics)
    this.player.draw(this.graphics)

    // Flash collisione (decade)
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - delta * 0.003)
      this.graphics.fillStyle(0xff0000, this.flashAlpha)
      this.graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    }
  }

  private updateGameOver(delta: number): void {
    // Ostacoli e speed lines continuano ad animarsi in background
    drawSpeedLines(this.graphics, this.speedLines)
    drawFlashWarp(this.graphics, this.flashWarp)
    drawRing(this.graphics)
    drawCenterPoint(this.graphics)
    this.obstacleManager.draw(this.graphics)

    // Flash residuo
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - delta * 0.002)
      this.graphics.fillStyle(0xff0000, this.flashAlpha)
      this.graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    }

    if (
      Phaser.Input.Keyboard.JustDown(this.keySpace) ||
      Phaser.Input.Keyboard.JustDown(this.keyR)
    ) {
      this.scene.restart()
    }
  }

  private startGame(): void {
    this.obstacleManager.reset()
    this.difficultyManager.reset()
    this.survivalMs = 0
    this.score = 0
    this.flashAlpha = 0
    this.setState('playing')
  }

  private setState(state: GameState): void {
    this.state = state
    this.hud.setState(state, this.score)
  }
}
