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

/** Disegna la fascia anulare giocabile con fill + bordi + glow */
export function drawRing(graphics: Phaser.GameObjects.Graphics): void {
  // Fill semitrasparente della fascia (dà profondità)
  graphics.fillStyle(0x001a1a, 0.35)
  graphics.beginPath()
  graphics.arc(CX, CY, RING_OUTER_RADIUS, 0, Math.PI * 2, false)
  graphics.arc(CX, CY, RING_INNER_RADIUS, 0, Math.PI * 2, true)
  graphics.closePath()
  graphics.fillPath()

  // Glow esterno bordo esterno
  graphics.lineStyle(10, COLOR_RING, 0.08)
  graphics.strokeCircle(CX, CY, RING_OUTER_RADIUS)

  // Bordo esterno principale
  graphics.lineStyle(1.5, COLOR_RING, 0.8)
  graphics.strokeCircle(CX, CY, RING_OUTER_RADIUS)
}

/** Punto luminoso al centro dello schermo (origine degli ostacoli) */
export function drawCenterPoint(graphics: Phaser.GameObjects.Graphics): void {
  // Alone esteso
  graphics.fillStyle(0x00ffcc, 0.04)
  graphics.fillCircle(CX, CY, 18)
  // Glow medio
  graphics.fillStyle(0x00ffcc, 0.12)
  graphics.fillCircle(CX, CY, 8)
  // Nucleo
  graphics.fillStyle(0x00ffff, 0.7)
  graphics.fillCircle(CX, CY, 2.5)
}

/** Speed lines — linee radiali che danno senso di movimento verso il centro */
export interface SpeedLine {
  angle: number
  radius: number
  length: number
  speed: number
  alpha: number
}

export function updateSpeedLines(
  lines: SpeedLine[],
  delta: number,
  obstacleSpeed: number,
): void {
  const dt = delta / 1000
  const lineSpeed = obstacleSpeed * 3.5

  for (const l of lines) {
    l.radius += lineSpeed * dt
    // Fade in vicino al centro, fade out avvicinandosi al bordo esterno
    if (l.radius < RING_INNER_RADIUS * 0.5) {
      l.alpha = l.radius / (RING_INNER_RADIUS * 0.5) * 0.9
    } else {
      l.alpha = Math.max(0, 0.9 * (1 - (l.radius - RING_INNER_RADIUS * 0.5) / (RING_OUTER_RADIUS * 0.8)))
    }
    if (l.radius > RING_OUTER_RADIUS + 20) {
      // Ricicla la linea dal centro
      l.radius = Math.random() * 20
      l.angle = Math.random() * Math.PI * 2
      l.length = 8 + Math.random() * 14
      l.alpha = 0
    }
  }
}

export function drawSpeedLines(
  graphics: Phaser.GameObjects.Graphics,
  lines: SpeedLine[],
): void {
  for (const l of lines) {
    if (l.alpha <= 0.01) continue
    const p1 = polarToCart(l.angle, l.radius)
    const p2 = polarToCart(l.angle, l.radius + l.length)
    graphics.lineStyle(2, 0x00ffcc, l.alpha)
    graphics.beginPath()
    graphics.moveTo(p1.x, p1.y)
    graphics.lineTo(p2.x, p2.y)
    graphics.strokePath()
  }
}

export function createSpeedLines(count = 60): SpeedLine[] {
  const lines: SpeedLine[] = []
  for (let i = 0; i < count; i++) {
    lines.push({
      angle: Math.random() * Math.PI * 2,
      radius: Math.random() * RING_OUTER_RADIUS,
      length: 14 + Math.random() * 22,
      speed: 0, // sarà impostato da updateSpeedLines
      alpha: 0,
    })
  }
  return lines
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
