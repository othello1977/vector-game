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
  }

  getHitboxRadius(): number {
    return PLAYER_HITBOX_R
  }
}
