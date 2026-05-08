// ============================================================
// VirtualJoystick.ts — Joystick touch per mobile
// ============================================================

import Phaser from 'phaser'

const BASE_R = 52      // raggio del cerchio base
const THUMB_R = 26     // raggio del thumbstick
const DEAD_ZONE = 0.15 // zona morta (0–1)

export class VirtualJoystick {
  private scene: Phaser.Scene
  private baseX: number
  private baseY: number
  private thumbX: number
  private thumbY: number
  private pointerId: number | null = null
  private dx = 0
  private dy = 0
  visible = false

  // Pulsante tap (titolo / gameover)
  private tapJustDown = false
  private tapPointerId: number | null = null

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.baseX = 0
    this.baseY = 0
    this.thumbX = 0
    this.thumbY = 0

    scene.input.on('pointerdown', this.onDown, this)
    scene.input.on('pointermove', this.onMove, this)
    scene.input.on('pointerup', this.onUp, this)
    scene.input.on('pointerupoutside', this.onUp, this)
  }

  private onDown(pointer: Phaser.Input.Pointer): void {
    if (this.pointerId === null) {
      this.pointerId = pointer.id
      this.baseX = pointer.x
      this.baseY = pointer.y
      this.thumbX = pointer.x
      this.thumbY = pointer.y
      this.dx = 0
      this.dy = 0
      this.visible = true
    }
    // Registra anche come tap (per title/gameover)
    if (this.tapPointerId === null) {
      this.tapPointerId = pointer.id
      this.tapJustDown = true
    }
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.pointerId) return
    this.thumbX = pointer.x
    this.thumbY = pointer.y

    const rawDx = this.thumbX - this.baseX
    const rawDy = this.thumbY - this.baseY
    const dist = Math.sqrt(rawDx * rawDx + rawDy * rawDy)

    if (dist > BASE_R) {
      const scale = BASE_R / dist
      this.thumbX = this.baseX + rawDx * scale
      this.thumbY = this.baseY + rawDy * scale
    }

    const norm = dist > 0 ? Math.min(1, dist / BASE_R) : 0
    if (norm > DEAD_ZONE) {
      const angle = Math.atan2(rawDy, rawDx)
      this.dx = Math.cos(angle) * norm
      this.dy = Math.sin(angle) * norm
    } else {
      this.dx = 0
      this.dy = 0
    }
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.pointerId) {
      this.pointerId = null
      this.dx = 0
      this.dy = 0
      this.visible = false
    }
    if (pointer.id === this.tapPointerId) {
      this.tapPointerId = null
    }
  }

  /** Direzioni normalizzate per il player */
  getAxes(): { dx: number; dy: number } {
    return { dx: this.dx, dy: this.dy }
  }

  /** True esattamente per un frame al primo touch */
  consumeTap(): boolean {
    if (this.tapJustDown) {
      this.tapJustDown = false
      return true
    }
    return false
  }

  draw(graphics: Phaser.GameObjects.Graphics): void {
    if (!this.visible) return

    // Base: cerchio fisso
    graphics.lineStyle(2, 0x00ffcc, 0.35)
    graphics.fillStyle(0x00ffcc, 0.08)
    graphics.fillCircle(this.baseX, this.baseY, BASE_R)
    graphics.strokeCircle(this.baseX, this.baseY, BASE_R)

    // Indicatore direzionale: linea base → thumb
    if (this.dx !== 0 || this.dy !== 0) {
      graphics.lineStyle(1.5, 0x00ffcc, 0.40)
      graphics.beginPath()
      graphics.moveTo(this.baseX, this.baseY)
      graphics.lineTo(this.thumbX, this.thumbY)
      graphics.strokePath()
    }

    // Thumb
    graphics.fillStyle(0x00ffcc, 0.55)
    graphics.lineStyle(2, 0xffffff, 0.70)
    graphics.fillCircle(this.thumbX, this.thumbY, THUMB_R)
    graphics.strokeCircle(this.thumbX, this.thumbY, THUMB_R)
  }

  destroy(): void {
    this.scene.input.off('pointerdown', this.onDown, this)
    this.scene.input.off('pointermove', this.onMove, this)
    this.scene.input.off('pointerup', this.onUp, this)
    this.scene.input.off('pointerupoutside', this.onUp, this)
  }
}
