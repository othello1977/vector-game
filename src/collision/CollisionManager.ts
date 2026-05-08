// ============================================================
// CollisionManager.ts — Rilevamento collisioni in spazio polare
// ============================================================

import { Player } from '../player/Player'
import { Obstacle } from '../obstacles/ObstacleManager'
import { PLAYER_HITBOX_R, RING_INNER_RADIUS } from '../config'

/** Differenza angolare normalizzata in [-PI, PI] */
function angleDiff(a: number, b: number): number {
  let d = ((b - a) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  return d
}

export class CollisionManager {
  /** Restituisce true se il player collide con almeno un ostacolo */
  check(player: Player, obstacles: Obstacle[]): boolean {
    const hitR = PLAYER_HITBOX_R

    for (const obs of obstacles) {
      if (!obs.alive) continue

      // Ostacolo ancora fuori dall'anello → non può colpire il player
      if (obs.radius < RING_INNER_RADIUS) continue

      // Check radiale
      const gapR = Math.abs(player.radius - obs.radius)
      if (gapR > obs.thickness / 2 + hitR) continue

      // Check angolare (approssimazione lineare della hitbox)
      const playerAngularSize = hitR / player.radius
      const diff = Math.abs(angleDiff(player.angle, obs.angle))
      if (diff > obs.angularWidth / 2 + playerAngularSize) continue

      return true
    }

    return false
  }
}
