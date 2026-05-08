// ============================================================
// Player.ts — Navicella del giocatore in coordinate polari
// ============================================================

import Phaser from 'phaser'
import {
  RING_INNER_RADIUS,
  RING_OUTER_RADIUS,
  PLAYER_SPEED_ANGULAR,
  PLAYER_SPEED_RADIAL,
  PLAYER_SIZE,
  PLAYER_HITBOX_R,
  COLOR_PLAYER,
  SHIELD_MAX_LEVEL,
  SHIELD_RECHARGE_INTERVAL,
} from '../config'
import { polarToCart } from '../rendering/RenderHelpers'

export interface PlayerKeys {
  left: boolean
  right: boolean
  up: boolean
  down: boolean
}

export class Player {
  angle: number
  radius: number
  shieldLevel = SHIELD_MAX_LEVEL
  private shieldRechargeTimer = 0

  constructor() {
    // Posizione iniziale: destra dell'anello, a metà fascia
    this.angle = 0
    this.radius = (RING_INNER_RADIUS + RING_OUTER_RADIUS) / 2
  }

  update(delta: number, keys: PlayerKeys): void {
    const dt = delta / 1000

    if (keys.left) {
      this.angle += PLAYER_SPEED_ANGULAR * dt
    }
    if (keys.right) {
      this.angle -= PLAYER_SPEED_ANGULAR * dt
    }
    if (keys.up) {
      this.radius -= PLAYER_SPEED_RADIAL * dt
    }
    if (keys.down) {
      this.radius += PLAYER_SPEED_RADIAL * dt
    }

    // Clamp raggio entro la fascia giocabile
    this.radius = Math.max(
      RING_INNER_RADIUS + PLAYER_HITBOX_R + 2,
      Math.min(RING_OUTER_RADIUS - PLAYER_HITBOX_R - 2, this.radius),
    )

    // Ricarica scudo
    this.shieldRechargeTimer += delta
    if (this.shieldRechargeTimer >= SHIELD_RECHARGE_INTERVAL && this.shieldLevel < SHIELD_MAX_LEVEL) {
      this.shieldLevel++
      this.shieldRechargeTimer = 0
    }
  }

  draw(graphics: Phaser.GameObjects.Graphics, hit = false): void {
    const color = hit ? 0xff4444 : COLOR_PLAYER

    // Centro navicella
    const center = polarToCart(this.angle, this.radius)

    // Vertice anteriore puntato verso il CENTRO (raggio minore = interno)
    const front = polarToCart(this.angle, this.radius - PLAYER_SIZE * 1.4)
    // Vertici laterali (base dimezzata rispetto alla versione precedente)
    const left = polarToCart(this.angle - 0.18, this.radius + PLAYER_SIZE * 0.15)
    const right = polarToCart(this.angle + 0.18, this.radius + PLAYER_SIZE * 0.15)

    // Glow
    graphics.lineStyle(6, color, 0.18)
    graphics.beginPath()
    graphics.moveTo(front.x, front.y)
    graphics.lineTo(left.x, left.y)
    graphics.lineTo(right.x, right.y)
    graphics.closePath()
    graphics.strokePath()

    // Fill principale
    graphics.fillStyle(color, 0.85)
    graphics.beginPath()
    graphics.moveTo(front.x, front.y)
    graphics.lineTo(left.x, left.y)
    graphics.lineTo(right.x, right.y)
    graphics.closePath()
    graphics.fillPath()

    // Outline bianco
    graphics.lineStyle(1.5, 0xffffff, 0.9)
    graphics.beginPath()
    graphics.moveTo(front.x, front.y)
    graphics.lineTo(left.x, left.y)
    graphics.lineTo(right.x, right.y)
    graphics.closePath()
    graphics.strokePath()

    // Punto centrale (cockpit)
    graphics.fillStyle(0xffffff, 0.7)
    graphics.fillCircle(center.x, center.y, 2)

    this.drawShield(graphics)
  }

  /** Restituisce true se lo scudo ha assorbito il colpo, false se è esaurito */
  hitShield(): boolean {
    if (this.shieldLevel > 0) {
      this.shieldLevel--
      return true
    }
    return false
  }

  getHitboxRadius(): number {
    return PLAYER_HITBOX_R
  }

  private drawShield(graphics: Phaser.GameObjects.Graphics): void {
    if (this.shieldLevel === 0) return

    const front = polarToCart(this.angle, this.radius - PLAYER_SIZE * 0.9)
    // rx segue la larghezza reale della navicella in spazio schermo:
    // i vertici base sono a ±0.18 rad al raggio (radius + PLAYER_SIZE*0.15)
    const rx = Math.sin(0.18) * (this.radius + PLAYER_SIZE * 0.15) * 1
    const ry = PLAYER_SIZE * 1.1   // semi-asse radiale (schiacciato, fisso)

    const COLORS = [0x000000, 0x1155ff, 0x22aaff, 0xaaffff]
    const ALPHAS = [0, 0.60, 0.88, 1.0]
    const color = COLORS[this.shieldLevel]
    const alpha = ALPHAS[this.shieldLevel]

    // Arco leggermente più ampio di 180° (±0.2 rad extra per lato)
    const startT = -0.2
    const endT = Math.PI + 0.2

    // Glow esterno largo
    graphics.lineStyle(16, color, alpha * 0.18)
    this.strokeShieldEllipse(graphics, front, rx + 11, ry + 6, startT, endT)
    // Glow medio
    graphics.lineStyle(8, color, alpha * 0.50)
    this.strokeShieldEllipse(graphics, front, rx + 4, ry + 2, startT, endT)
    // Core brillante
    graphics.lineStyle(2.5, color, alpha)
    this.strokeShieldEllipse(graphics, front, rx, ry, startT, endT)

    // Fill interno semitrasparente
    graphics.fillStyle(color, alpha * 0.10)
    const STEPS = 20
    graphics.beginPath()
    for (let i = 0; i <= STEPS; i++) {
      const t = startT + (endT - startT) * (i / STEPS)
      const { x, y } = this.ellipsePoint(front, rx, ry, t)
      if (i === 0) graphics.moveTo(x, y)
      else graphics.lineTo(x, y)
    }
    graphics.closePath()
    graphics.fillPath()
  }

  /**
   * Punto sull'ellisse ruotata allineata alla navicella.
   * t=0 → lato destro tangenziale, t=PI/2 → apice verso centro, t=PI → lato sinistro
   */
  private ellipsePoint(
    center: { x: number; y: number },
    rx: number,
    ry: number,
    t: number,
  ): { x: number; y: number } {
    const lx = Math.cos(t) * rx  // componente tangenziale
    const ly = Math.sin(t) * ry  // componente verso il centro
    return {
      x: center.x - lx * Math.sin(this.angle) - ly * Math.cos(this.angle),
      y: center.y + lx * Math.cos(this.angle) - ly * Math.sin(this.angle),
    }
  }

  private strokeShieldEllipse(
    graphics: Phaser.GameObjects.Graphics,
    center: { x: number; y: number },
    rx: number,
    ry: number,
    startT: number,
    endT: number,
  ): void {
    const STEPS = 20
    graphics.beginPath()
    for (let i = 0; i <= STEPS; i++) {
      const t = startT + (endT - startT) * (i / STEPS)
      const { x, y } = this.ellipsePoint(center, rx, ry, t)
      if (i === 0) graphics.moveTo(x, y)
      else graphics.lineTo(x, y)
    }
    graphics.strokePath()
  }
}
