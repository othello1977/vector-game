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
  private thrustPulse = 0
  private isThrusting = false

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

    // Traccia movimento per lampeggio motore
    this.isThrusting = keys.left || keys.right || keys.up || keys.down
    if (this.isThrusting) {
      this.thrustPulse = (this.thrustPulse + delta * 0.018) % (Math.PI * 2)
    }

    // Ricarica scudo
    this.shieldRechargeTimer += delta
    if (this.shieldRechargeTimer >= SHIELD_RECHARGE_INTERVAL && this.shieldLevel < SHIELD_MAX_LEVEL) {
      this.shieldLevel++
      this.shieldRechargeTimer = 0
    }
  }

  draw(graphics: Phaser.GameObjects.Graphics, hit = false): void {
    const color = hit ? 0xff4444 : COLOR_PLAYER

    // Apice (verso il centro, dove "guarda" la navicella)
    const front = polarToCart(this.angle, this.radius - PLAYER_SIZE * 1.4)
    // Spalle — due punti leggermente avanti, stretti
    const shoulderL = polarToCart(this.angle - 0.10, this.radius - PLAYER_SIZE * 0.15)
    const shoulderR = polarToCart(this.angle + 0.10, this.radius - PLAYER_SIZE * 0.15)
    // Base del corpo — due punti larghi
    const baseL = polarToCart(this.angle - 0.18, this.radius + PLAYER_SIZE * 0.15)
    const baseR = polarToCart(this.angle + 0.18, this.radius + PLAYER_SIZE * 0.15)
    // Punta posteriore (notch centrale)
    const tail  = polarToCart(this.angle, this.radius + PLAYER_SIZE * 0.50)
    // Tip alette swept-back: stessa apertura angolare delle spalle ma ben più indietro
    const finTipL = polarToCart(this.angle - 0.22, this.radius + PLAYER_SIZE * 0.42)
    const finTipR = polarToCart(this.angle + 0.22, this.radius + PLAYER_SIZE * 0.42)
    // Cockpit: vicino all'apice
    const cockpit = polarToCart(this.angle, this.radius - PLAYER_SIZE * 0.75)

    // ── Glow esterno corpo ────────────────────────────────
    graphics.lineStyle(9, color, 0.10)
    graphics.beginPath()
    graphics.moveTo(front.x, front.y)
    graphics.lineTo(finTipL.x, finTipL.y)
    graphics.lineTo(tail.x, tail.y)
    graphics.lineTo(finTipR.x, finTipR.y)
    graphics.closePath()
    graphics.strokePath()

    // ── Alette swept-back ─────────────────────────────────
    // Partono dalle spalle, spazzano indietro fino ai fin tip poi alla base
    graphics.fillStyle(color, 0.28)
    graphics.lineStyle(1, color, 0.55)
    graphics.beginPath()
    graphics.moveTo(shoulderL.x, shoulderL.y)
    graphics.lineTo(finTipL.x, finTipL.y)
    graphics.lineTo(baseL.x, baseL.y)
    graphics.closePath()
    graphics.fillPath()
    graphics.strokePath()

    graphics.beginPath()
    graphics.moveTo(shoulderR.x, shoulderR.y)
    graphics.lineTo(finTipR.x, finTipR.y)
    graphics.lineTo(baseR.x, baseR.y)
    graphics.closePath()
    graphics.fillPath()
    graphics.strokePath()

    // ── Corpo principale (freccia con notch posteriore) ───
    graphics.fillStyle(color, 0.84)
    graphics.beginPath()
    graphics.moveTo(front.x, front.y)
    graphics.lineTo(baseL.x, baseL.y)
    graphics.lineTo(tail.x, tail.y)
    graphics.lineTo(baseR.x, baseR.y)
    graphics.closePath()
    graphics.fillPath()

    // Highlight centrale (striscia chiara lungo la chiglia)
    const midFwd = polarToCart(this.angle, this.radius - PLAYER_SIZE * 0.5)
    graphics.fillStyle(0xffffff, 0.13)
    graphics.beginPath()
    graphics.moveTo(front.x, front.y)
    graphics.lineTo(shoulderL.x, shoulderL.y)
    graphics.lineTo(midFwd.x, midFwd.y)
    graphics.lineTo(shoulderR.x, shoulderR.y)
    graphics.closePath()
    graphics.fillPath()

    // ── Outline nitido ────────────────────────────────────
    graphics.lineStyle(1.5, 0xffffff, 0.85)
    graphics.beginPath()
    graphics.moveTo(front.x, front.y)
    graphics.lineTo(baseL.x, baseL.y)
    graphics.lineTo(tail.x, tail.y)
    graphics.lineTo(baseR.x, baseR.y)
    graphics.closePath()
    graphics.strokePath()

    // ── Motore al posteriore ──────────────────────────────
    const thrustSize = this.isThrusting
      ? PLAYER_SIZE * 0.42 + Math.sin(this.thrustPulse) * PLAYER_SIZE * 0.22
      : PLAYER_SIZE * 0.20
    const innerColor = this.isThrusting ? 0xfff0aa : 0xff9900
    graphics.fillStyle(0xff6600, 0.20)
    graphics.fillCircle(tail.x, tail.y, thrustSize + 7)
    graphics.fillStyle(0xff8800, 0.50)
    graphics.fillCircle(tail.x, tail.y, thrustSize)
    graphics.fillStyle(innerColor, 0.95)
    graphics.fillCircle(tail.x, tail.y, thrustSize * 0.40)

    // ── Cockpit: ellisse orientata verso il centro dello schermo ──
    const cockpitA = PLAYER_SIZE * 0.38
    const cockpitB = PLAYER_SIZE * 0.22
    const CSTEPS = 18
    // Glow esterno bianco
    graphics.lineStyle(8, 0xffffff, 0.25)
    graphics.beginPath()
    for (let i = 0; i <= CSTEPS; i++) {
      const t = (i / CSTEPS) * Math.PI * 2
      const lx = Math.cos(t) * (cockpitA + 4)
      const ly = Math.sin(t) * (cockpitB + 4)
      const x = cockpit.x - lx * Math.cos(this.angle) + ly * Math.sin(this.angle)
      const y = cockpit.y - lx * Math.sin(this.angle) - ly * Math.cos(this.angle)
      if (i === 0) graphics.moveTo(x, y)
      else graphics.lineTo(x, y)
    }
    graphics.closePath()
    graphics.strokePath()
    // Fill bianco brillante
    graphics.fillStyle(0xffffff, 0.55)
    graphics.beginPath()
    for (let i = 0; i <= CSTEPS; i++) {
      const t = (i / CSTEPS) * Math.PI * 2
      const lx = Math.cos(t) * cockpitA
      const ly = Math.sin(t) * cockpitB
      const x = cockpit.x - lx * Math.cos(this.angle) + ly * Math.sin(this.angle)
      const y = cockpit.y - lx * Math.sin(this.angle) - ly * Math.cos(this.angle)
      if (i === 0) graphics.moveTo(x, y)
      else graphics.lineTo(x, y)
    }
    graphics.closePath()
    graphics.fillPath()
    // Outline bianco netto
    graphics.lineStyle(2, 0xffffff, 1.0)
    graphics.beginPath()
    for (let i = 0; i <= CSTEPS; i++) {
      const t = (i / CSTEPS) * Math.PI * 2
      const lx = Math.cos(t) * cockpitA
      const ly = Math.sin(t) * cockpitB
      const x = cockpit.x - lx * Math.cos(this.angle) + ly * Math.sin(this.angle)
      const y = cockpit.y - lx * Math.sin(this.angle) - ly * Math.cos(this.angle)
      if (i === 0) graphics.moveTo(x, y)
      else graphics.lineTo(x, y)
    }
    graphics.closePath()
    graphics.strokePath()

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
