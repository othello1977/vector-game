// ============================================================
// RenderHelpers.ts — Utility di rendering: conversioni e primitive
// ============================================================

import Phaser from 'phaser'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  RING_INNER_RADIUS,
  RING_OUTER_RADIUS,
  COLOR_RING,
} from '../config'

export const CX = GAME_WIDTH / 2
export const CY = GAME_HEIGHT / 2

/** Converte coordinate polari in cartesiane relative al centro schermo */
export function polarToCart(
  angle: number,
  radius: number,
): { x: number; y: number } {
  return {
    x: CX + Math.cos(angle) * radius,
    y: CY + Math.sin(angle) * radius,
  }
}

/** Disegna la fascia anulare giocabile con effetto glow */
export function drawRing(graphics: Phaser.GameObjects.Graphics): void {
  // Glow esterno (layer trasparente più spesso)
  graphics.lineStyle(8, COLOR_RING, 0.12)
  graphics.strokeCircle(CX, CY, RING_INNER_RADIUS)
  graphics.strokeCircle(CX, CY, RING_OUTER_RADIUS)

  // Cerchi principali
  graphics.lineStyle(2, COLOR_RING, 0.6)
  graphics.strokeCircle(CX, CY, RING_INNER_RADIUS)

  graphics.lineStyle(2, COLOR_RING, 0.85)
  graphics.strokeCircle(CX, CY, RING_OUTER_RADIUS)
}

/** Disegna un cerchio glow generico (doppio layer) */
export function drawCircleGlow(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  r: number,
  color: number,
  alpha = 0.18,
): void {
  graphics.lineStyle(8, color, alpha)
  graphics.strokeCircle(x, y, r + 4)
  graphics.lineStyle(2, color, 1.0)
  graphics.strokeCircle(x, y, r)
}
