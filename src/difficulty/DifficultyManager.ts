// ============================================================
// DifficultyManager.ts — Curva di difficoltà progressiva
// ============================================================

import {
  OBSTACLE_SPEED_START,
  OBSTACLE_SPEED_MAX,
  OBSTACLE_SPAWN_INTERVAL_START,
  OBSTACLE_SPAWN_INTERVAL_MIN,
  DIFFICULTY_RAMP_INTERVAL,
} from '../config'

export class DifficultyManager {
  private elapsedMs = 0

  get level(): number {
    return Math.floor(this.elapsedMs / DIFFICULTY_RAMP_INTERVAL)
  }

  get obstacleSpeed(): number {
    return Math.min(
      OBSTACLE_SPEED_START + this.level * 15,
      OBSTACLE_SPEED_MAX,
    )
  }

  get spawnInterval(): number {
    return Math.max(
      OBSTACLE_SPAWN_INTERVAL_START - this.level * 80,
      OBSTACLE_SPAWN_INTERVAL_MIN,
    )
  }

  update(delta: number): void {
    this.elapsedMs += delta
  }

  reset(): void {
    this.elapsedMs = 0
  }
}
