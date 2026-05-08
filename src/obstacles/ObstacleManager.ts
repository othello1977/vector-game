// ============================================================
// ObstacleManager.ts — Spawn, update e rendering degli ostacoli
// ============================================================

import Phaser from 'phaser'
import {
  RING_OUTER_RADIUS,
  OBSTACLE_THICKNESS,
  OBSTACLE_ANGULAR_WIDTH_MIN,
  OBSTACLE_ANGULAR_WIDTH_MAX,
  COLOR_OBSTACLE,
} from '../config'
import { CX, CY } from '../rendering/RenderHelpers'

export interface Obstacle {
  angle: number
  radius: number
  speed: number
  angularWidth: number
  thickness: number
  alive: boolean
}

export class ObstacleManager {
  obstacles: Obstacle[] = []
  private spawnTimer = 0

  update(delta: number, spawnInterval: number, obstacleSpeed: number): void {
    const dt = delta / 1000

    // Spawn timer
    this.spawnTimer += delta
    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0
      this.spawn(obstacleSpeed)
    }

    // Muovi ostacoli verso l'esterno
    for (const obs of this.obstacles) {
      if (!obs.alive) continue
      obs.radius += obs.speed * dt
      if (obs.radius > RING_OUTER_RADIUS + 30) {
        obs.alive = false
      }
    }

    // Rimuovi ostacoli morti (pulizia periodica)
    if (this.obstacles.length > 80) {
      this.obstacles = this.obstacles.filter((o) => o.alive)
    }
  }

  private spawn(speed: number): void {
    const angularWidth =
      OBSTACLE_ANGULAR_WIDTH_MIN +
      Math.random() * (OBSTACLE_ANGULAR_WIDTH_MAX - OBSTACLE_ANGULAR_WIDTH_MIN)

    this.obstacles.push({
      angle: Math.random() * Math.PI * 2,
      radius: 5,          // nasce al centro dello schermo
      speed,
      angularWidth,
      thickness: OBSTACLE_THICKNESS,
      alive: true,
    })
  }

  draw(graphics: Phaser.GameObjects.Graphics): void {
    for (const obs of this.obstacles) {
      if (!obs.alive) continue
      this.drawObstacle(graphics, obs)
    }
  }

  private drawObstacle(
    graphics: Phaser.GameObjects.Graphics,
    obs: Obstacle,
  ): void {
    const { angle, radius, angularWidth, thickness } = obs

    // Nell'anello: arco pieno
    const startAngle = angle - angularWidth / 2
    const endAngle = angle + angularWidth / 2
    const steps = Math.max(8, Math.round(angularWidth * 20))
    const innerR = Math.max(1, radius - thickness / 2)
    const outerR = radius + thickness / 2

    // Glow
    graphics.lineStyle(thickness + 6, COLOR_OBSTACLE, 0.15)
    drawArcPath(graphics, CX, CY, radius, startAngle, endAngle, steps, thickness + 4)

    // Corpo principale
    graphics.fillStyle(COLOR_OBSTACLE, 0.9)
    graphics.lineStyle(1.5, 0xff88ff, 0.8)
    drawFilledArcBand(graphics, CX, CY, innerR, outerR, startAngle, endAngle, steps)
  }

  reset(): void {
    this.obstacles = []
    this.spawnTimer = 0
  }
}

/** Disegna una banda anulare piena (trapezio curvato) */
function drawFilledArcBand(
  graphics: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
  steps: number,
): void {
  graphics.beginPath()

  // Bordo esterno (da startAngle a endAngle)
  for (let i = 0; i <= steps; i++) {
    const a = startAngle + (endAngle - startAngle) * (i / steps)
    const x = cx + Math.cos(a) * outerR
    const y = cy + Math.sin(a) * outerR
    if (i === 0) graphics.moveTo(x, y)
    else graphics.lineTo(x, y)
  }

  // Bordo interno (da endAngle a startAngle, inverso)
  for (let i = steps; i >= 0; i--) {
    const a = startAngle + (endAngle - startAngle) * (i / steps)
    const x = cx + Math.cos(a) * innerR
    const y = cy + Math.sin(a) * innerR
    graphics.lineTo(x, y)
  }

  graphics.closePath()
  graphics.fillPath()
  graphics.strokePath()
}

/** Disegna un arco spesso per il glow */
function drawArcPath(
  graphics: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  steps: number,
  _lineWidth: number,
): void {
  graphics.beginPath()
  for (let i = 0; i <= steps; i++) {
    const a = startAngle + (endAngle - startAngle) * (i / steps)
    const x = cx + Math.cos(a) * radius
    const y = cy + Math.sin(a) * radius
    if (i === 0) graphics.moveTo(x, y)
    else graphics.lineTo(x, y)
  }
  graphics.strokePath()
}
