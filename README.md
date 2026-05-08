# Vector Ring

A retro arcade browser game built with **Phaser 3 + TypeScript + Vite**.

Navigate a spaceship through a ring-shaped play area, dodging obstacles that expand outward from the center. All graphics are procedural vector art — no sprites, no images.

## Requirements

- Node.js 18+

## Install & Run

```bash
npm install
npm run dev
```

Opens at `http://localhost:3000`.

## Controls

| Action | Keys |
|--------|------|
| Move left / right | ← → or A / D |
| Move toward center | ↑ or W |
| Move toward edge | ↓ or S |
| Start game | Space |
| Restart (game over) | Space or R |

## Architecture

```
src/
  config.ts           — All tunable constants (speeds, colors, sizes)
  main.ts             — Phaser bootstrap
  scenes/GameScene.ts — State machine: title → playing → gameover
  player/Player.ts    — Ship state and rendering (polar coordinates)
  obstacles/ObstacleManager.ts — Spawn from center, expand as arcs
  collision/CollisionManager.ts — Polar-space collision detection
  hud/HUD.ts          — Score, level, title and game-over overlays
  difficulty/DifficultyManager.ts — Progressive speed & spawn rate
  rendering/RenderHelpers.ts — Ring, glow, speed lines, polar→cartesian
```

All game logic runs in polar coordinates `(angle, radius)`; conversion to `(x, y)` happens only at render time.

## Build

```bash
npm run build   # outputs to dist/
npm run preview # serves the dist/ build
```
