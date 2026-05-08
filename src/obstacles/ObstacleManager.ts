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
  seed: number
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
      seed: Math.floor(Math.random() * 100000),
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
    drawMeteor(graphics, obs)
  }

  reset(): void {
    this.obstacles = []
    this.spawnTimer = 0
  }
}

/** Forma irregolare tipo meteorite (poligono con noise deterministico) */
function drawMeteor(
  graphics: Phaser.GameObjects.Graphics,
  obs: Obstacle,
): void {
  const { angle, radius, angularWidth, thickness, seed } = obs
  const innerR = Math.max(1, radius - thickness / 2)
  const outerR = radius + thickness / 2
  const startA = angle - angularWidth / 2
  const endA = angle + angularWidth / 2

  // RNG deterministica dal seed dell'ostacolo (stessa forma ogni frame)
  let s = seed
  const rng = (): number => { s = ((s * 9301 + 49297) % 233280); return s / 233280 }

  const N = 7
  const verts: { x: number; y: number }[] = []

  // Vertici lato esterno (startA → endA) con noise
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const a = startA + t * (endA - startA) + (rng() - 0.5) * angularWidth * 0.22
    const r = outerR + (rng() - 0.5) * thickness * 1.4
    verts.push({ x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r })
  }
  // Vertici lato interno (endA → startA, inverso)
  for (let i = N; i >= 0; i--) {
    const t = i / N
    const a = startA + t * (endA - startA) + (rng() - 0.5) * angularWidth * 0.22
    const r = innerR + (rng() - 0.5) * thickness * 1.4
    verts.push({ x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r })
  }

  // Glow esterno (poligono allargato)
  graphics.fillStyle(COLOR_OBSTACLE, 0.12)
  graphics.lineStyle(thickness + 5, COLOR_OBSTACLE, 0.18)
  graphics.beginPath()
  graphics.moveTo(verts[0].x, verts[0].y)
  for (let i = 1; i < verts.length; i++) graphics.lineTo(verts[i].x, verts[i].y)
  graphics.closePath()
  graphics.strokePath()

  // Corpo principale
  graphics.fillStyle(COLOR_OBSTACLE, 0.88)
  graphics.lineStyle(1.5, 0xff88ff, 0.9)
  graphics.beginPath()
  graphics.moveTo(verts[0].x, verts[0].y)
  for (let i = 1; i < verts.length; i++) graphics.lineTo(verts[i].x, verts[i].y)
  graphics.closePath()
  graphics.fillPath()
  graphics.strokePath()
}
