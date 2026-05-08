# VECTOR GAME — Piano di Lavoro

## Progetto
Gioco arcade retro-vettoriale browser-based, stile anni 80.
Stack: **Phaser 3 + TypeScript + Vite**.  
Avvio: `npm install && npm run dev`.

---

## STEP 1 — Scaffold del progetto Vite + TypeScript

**Obiettivo:** creare la struttura di cartelle e file base del progetto.

**Azioni:**
- Eseguire `npm create vite@latest . -- --template vanilla-ts` nella cartella `vector-game/`
- Installare dipendenza Phaser 3: `npm install phaser`
- Rimuovere i file demo generati da Vite (`counter.ts`, `style.css`, `typescript.svg`, ecc.)
- Verificare che `vite.config.ts` esista (crearlo se assente)

**File da creare/modificare:**
- `package.json` (aggiornare scripts e dipendenze)
- `vite.config.ts`
- `tsconfig.json` (verificare strict mode, target ES2020+)
- `index.html` (entry point pulito con `<div id="game">` e script src `main.ts`)
- `src/main.ts` (bootstrap Phaser)

**Parametri chiave:**
- Phaser version: `^3.70.0` (ultima stabile)
- TypeScript strict: `true`
- Output target: `ES2020`

---

## STEP 2 — Configurazione finestra di gioco e bootstrap Phaser

**Obiettivo:** far partire Phaser con la configurazione corretta, finestra centrata, sfondo nero.

**Azioni:**
- Creare `src/config.ts` con tutte le costanti centralizzate
- Creare `src/main.ts` che inizializza `Phaser.Game` con la config

**File da creare:**
- `src/config.ts`
- `src/main.ts`

**Contenuto `src/config.ts`:**
```ts
// Dimensioni canvas
GAME_WIDTH: 800
GAME_HEIGHT: 800

// Anello giocabile
RING_INNER_RADIUS: 100   // raggio interno (centro pericoloso)
RING_OUTER_RADIUS: 380   // raggio esterno (bordo schermo)

// Player
PLAYER_SPEED_ANGULAR: 2.5   // rad/s movimento angolare
PLAYER_SPEED_RADIAL: 80     // px/s movimento radiale
PLAYER_SIZE: 14              // dimensione triangolo

// Ostacoli
OBSTACLE_SPAWN_INTERVAL_START: 1200  // ms tra spawn iniziali
OBSTACLE_SPAWN_INTERVAL_MIN: 300     // ms minimo
OBSTACLE_SPEED_START: 60             // px/s velocità radiale iniziale
OBSTACLE_SPEED_MAX: 220              // px/s max
OBSTACLE_ANGULAR_WIDTH: 0.25        // larghezza angolare ostacolo (rad)
OBSTACLE_THICKNESS: 12              // spessore visivo

// Difficoltà
DIFFICULTY_RAMP_INTERVAL: 5000      // ms tra aumenti difficoltà

// Colori (palette retro)
COLOR_BG: 0x000000
COLOR_RING: 0x00ffcc        // ciano
COLOR_PLAYER: 0x00ffff      // ciano chiaro
COLOR_OBSTACLE: 0xff00ff    // magenta
COLOR_HIT: 0xff0000         // rosso collisione
COLOR_TEXT: 0xffffff        // bianco
COLOR_SCORE: 0x00ffcc

// Glow
GLOW_ALPHA: 0.15
GLOW_BLUR: 8
```

**Contenuto `src/main.ts`:**
```ts
import Phaser from 'phaser'
import { GameScene } from './scenes/GameScene'
import { GAME_WIDTH, GAME_HEIGHT } from './config'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#000000',
  scene: [GameScene],
  parent: 'game',
  antialias: true,
}

new Phaser.Game(config)
```

---

## STEP 3 — Scena principale di gioco (`GameScene`)

**Obiettivo:** creare la scena Phaser che orchestra tutto il gioco.

**Azioni:**
- Creare `src/scenes/GameScene.ts`
- Implementare lifecycle Phaser: `create()`, `update(time, delta)`
- Gestire gli stati: `TITLE`, `PLAYING`, `GAME_OVER`
- Instanziare e collegare tutti i moduli (Player, ObstacleManager, HUD, CollisionManager)

**File da creare:**
- `src/scenes/GameScene.ts`

**Struttura della scena:**
```
GameScene
  ├── state: 'title' | 'playing' | 'gameover'
  ├── graphics: Phaser.GameObjects.Graphics  (canvas principale)
  ├── player: Player
  ├── obstacleManager: ObstacleManager
  ├── hud: HUD
  ├── collisionManager: CollisionManager
  ├── score: number
  ├── startTime: number
  └── inputKeys: { left, right, up, down, restart, start }
```

**Logica stati:**
- `TITLE`: mostra overlay titolo, aspetta SPACE/ENTER per iniziare
- `PLAYING`: game loop attivo, score che sale, ostacoli in arrivo
- `GAME_OVER`: freeze animazione, mostra score finale, aspetta R/SPACE per restart

---

## STEP 4 — Rendering dell'anello e del ring helper

**Obiettivo:** disegnare la fascia anulare giocabile ogni frame con primitive geometriche.

**Azioni:**
- Creare `src/rendering/RenderHelpers.ts`
- Implementare funzione `drawRing(graphics, cx, cy, innerR, outerR)`
- Implementare funzione `drawGlow(graphics, x, y, r, color, alpha)` per effetto luce
- Implementare funzione `polarToCart(angle, radius, cx, cy): {x, y}`

**File da creare:**
- `src/rendering/RenderHelpers.ts`

**Dettagli implementazione:**
```ts
// Disegna i due cerchi dell'anello con strokeCircle
// Inner circle: linea ciano sottile (2px), alpha 0.6
// Outer circle: linea ciano (2px), alpha 0.8
// Opzionale: fill semitrasparente della fascia

polarToCart(angle, radius, cx, cy):
  x = cx + Math.cos(angle) * radius
  y = cy + Math.sin(angle) * radius
```

**Note:**
- `angle = 0` è a destra, aumenta in senso orario (sistema canvas)
- Il centro dello schermo è `(GAME_WIDTH/2, GAME_HEIGHT/2)`
- La fascia va da `RING_INNER_RADIUS` a `RING_OUTER_RADIUS`

---

## STEP 5 — Modulo Player

**Obiettivo:** implementare navicella con movimento in coordinate polari entro l'anello.

**Azioni:**
- Creare `src/player/Player.ts`
- Stato: `{ angle: number, radius: number }`
- Metodi: `update(delta, keys)`, `draw(graphics)`
- Clamp del raggio tra `RING_INNER_RADIUS + margin` e `RING_OUTER_RADIUS - margin`

**File da creare:**
- `src/player/Player.ts`

**Dettaglio movimento:**
```
LEFT/RIGHT: angle += PLAYER_SPEED_ANGULAR * delta/1000
UP/DOWN:    radius -= PLAYER_SPEED_RADIAL * delta/1000   (UP = verso centro)
            radius = clamp(radius, INNER+10, OUTER-10)
```

**Disegno navicella:**
```
Triangolo isoscele con vertice anteriore puntato verso l'esterno dell'anello.
Il vertice "anteriore" è nella direzione (angle) rispetto al centro.
3 punti calcolati da polarToCart con angoli offset (+/- 0.3 rad).
Fill: COLOR_PLAYER
Stroke: bianco sottile per outline
```

**Hit detection:**
- Usare un cerchio di collisione di raggio ~`PLAYER_SIZE * 0.7` centrato sulla navicella

---

## STEP 6 — Modulo ObstacleManager

**Obiettivo:** spawnare, muovere e disegnare ostacoli che nascono al centro e si espandono.

**Azioni:**
- Creare `src/obstacles/ObstacleManager.ts`
- Ogni ostacolo è un oggetto `{ angle, radius, speed, angularWidth, alive }`
- Spawn: `radius = RING_INNER_RADIUS`, angolo casuale, velocità = difficoltà attuale
- Update: `radius += speed * delta/1000`
- Despawn: quando `radius > RING_OUTER_RADIUS + margin`

**File da creare:**
- `src/obstacles/ObstacleManager.ts`

**Struttura dati ostacolo:**
```ts
interface Obstacle {
  angle: number        // angolo centrale (rad)
  radius: number       // raggio corrente
  speed: number        // px/s verso esterno
  angularWidth: number // ampiezza angolare in rad (es. 0.2-0.4)
  thickness: number    // spessore radiale in px
  alive: boolean
}
```

**Disegno ostacolo:**
```
Arco o rettangolo curvato tra (angle - angularWidth/2) e (angle + angularWidth/2)
a raggio `radius`, con spessore `thickness`.
Colore: COLOR_OBSTACLE (magenta).
Possibile implementazione semplice: strokeArc sul Phaser.Graphics
oppure 4 punti con lineTo per un "trapezoide anulare".
```

**Spawn logic:**
```
Timer basato su spawnInterval (decresce con la difficoltà).
Ogni spawn: angolo casuale, velocità = currentSpeed (aumenta nel tempo).
```

---

## STEP 7 — Collision Manager

**Obiettivo:** rilevare collisioni tra player e ostacoli con logica semplice ma robusta.

**Azioni:**
- Creare `src/collision/CollisionManager.ts`
- Usare confronto in coordinate polari (più efficiente e accurato per questo layout)

**File da creare:**
- `src/collision/CollisionManager.ts`

**Logica collisione in coordinate polari:**
```
Per ogni ostacolo alive:
  1. deltaRadius = |player.radius - obstacle.radius|
     se deltaRadius > obstacle.thickness/2 + PLAYER_HITBOX_R → no collision

  2. deltaAngle = angleDiff(player.angle, obstacle.angle)  // shortest angle
     se |deltaAngle| > obstacle.angularWidth/2 + PLAYER_HITBOX_ANGULAR → no collision

  3. Altrimenti: COLLISIONE
```

**In caso di collisione:**
- Trigger visual feedback (flash rosso)
- Cambia stato a `GAME_OVER`

**Utility:**
```ts
angleDiff(a, b): number  // restituisce diff angolare in [-PI, PI]
```

---

## STEP 8 — HUD e sistema di score

**Obiettivo:** mostrare score in tempo reale, titolo, game over overlay.

**Azioni:**
- Creare `src/hud/HUD.ts`
- Score = secondi di sopravvivenza (o punti * moltiplicatore)
- Usare `scene.add.text()` di Phaser per testo, font monospace

**File da creare:**
- `src/hud/HUD.ts`

**Elementi HUD:**
```
PLAYING state:
  - Score top-left: "SCORE: 0042" — font monospace, colore ciano, size 18px
  - Eventuale indicatore livello/difficoltà

TITLE overlay:
  - Titolo centrato: "VECTOR RING" — font grande, colore ciano, glow
  - Sottotitolo: "WASD / ARROWS to move"
  - Prompt: "PRESS SPACE TO START"

GAME OVER overlay:
  - Testo: "GAME OVER" — colore rosso/magenta, font grande
  - Score finale: "SCORE: XXXX"
  - Prompt: "PRESS R TO RESTART"
```

**Font:** usare `fontFamily: 'monospace'` (nessun asset esterno).

---

## STEP 9 — Difficoltà progressiva

**Obiettivo:** far crescere la difficoltà nel tempo in modo fluido.

**Azioni:**
- Implementare in `GameScene.ts` o in un modulo `src/difficulty/DifficultyManager.ts`
- Tracciare il tempo di gioco
- Ogni `DIFFICULTY_RAMP_INTERVAL` ms: aumentare velocità ostacoli e/o ridurre spawn interval

**Logica:**
```
level = Math.floor(elapsedTime / DIFFICULTY_RAMP_INTERVAL)
currentSpeed = OBSTACLE_SPEED_START + level * 15  (cap: OBSTACLE_SPEED_MAX)
spawnInterval = OBSTACLE_SPAWN_INTERVAL_START - level * 80  (floor: OBSTACLE_SPAWN_INTERVAL_MIN)
```

**Opzionale:** aumentare angularWidth degli ostacoli a difficoltà alta.

---

## STEP 10 — Rifinitura visiva e effetti

**Obiettivo:** aggiungere gli effetti visuali minimi per il look retro-vettoriale.

**Azioni:**
- Aggiungere leggero glow agli elementi principali (doppio disegno con alpha bassa e raggio maggiore)
- Aggiungere flash rosso a schermo in caso di collisione (breve, 200-300ms)
- (Opzionale) Effetto scanline con rettangoli semitrasparenti orizzontali fissi

**Implementazione glow (senza dipendenze):**
```
Disegnare lo stesso oggetto due volte:
  1. Versione allargata (es. +4px) con alpha 0.2, stesso colore
  2. Versione normale alpha 1.0
Questo simula un glow convincente senza plugin.
```

**Flash collisione:**
```
Usare un rettangolo pieno rosso che copre il canvas
alpha che va da 0.5 a 0 in 250ms (tweenAlpha o manuale in update)
```

---

## STEP 11 — Verifica finale e README

**Obiettivo:** assicurarsi che tutto funzioni, poi documentare.

**Checklist da verificare:**
- [ ] `npm install` completa senza errori
- [ ] `npm run dev` parte senza errori di build TypeScript
- [ ] Il browser mostra il gioco senza errori in console
- [ ] La schermata titolo è visibile
- [ ] Premendo SPACE il gioco parte
- [ ] La navicella si muove con frecce/WASD
- [ ] Gli ostacoli compaiono e si espandono verso l'esterno
- [ ] La collisione termina il gioco
- [ ] Appare il game over con score
- [ ] Premendo R o SPACE si riavvia
- [ ] La difficoltà cresce nel tempo
- [ ] Nessun errore TypeScript
- [ ] Nessun errore runtime in console

**File da creare:**
- `README.md`

**Contenuto README:**
- Requisiti (Node 18+)
- Installazione (`npm install`)
- Avvio (`npm run dev`)
- Controlli (frecce / WASD)
- Breve architettura

---

## Struttura finale dei file

```
vector-game/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
├── TODO.md
├── CONTEXT.md
└── src/
    ├── main.ts
    ├── config.ts
    ├── scenes/
    │   └── GameScene.ts
    ├── player/
    │   └── Player.ts
    ├── obstacles/
    │   └── ObstacleManager.ts
    ├── collision/
    │   └── CollisionManager.ts
    ├── hud/
    │   └── HUD.ts
    ├── rendering/
    │   └── RenderHelpers.ts
    └── difficulty/
        └── DifficultyManager.ts
```

---

## Dipendenze

```json
{
  "dependencies": {
    "phaser": "^3.70.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.2.0"
  }
}
```

---

## Note di implementazione

- **Coordinate polari:** tutto il gameplay vive in `(angle, radius)`. La conversione a `(x, y)` avviene solo al momento del rendering.
- **Game loop:** usare `delta` di Phaser (ms dall'ultimo frame) per movimento frame-rate independent.
- **Graphics:** un singolo `Phaser.GameObjects.Graphics` resettato ogni frame con `.clear()` è il pattern corretto per il rendering procedurale in Phaser.
- **Input:** usare `scene.input.keyboard.createCursorKeys()` + `scene.input.keyboard.addKey('W', 'A', 'S', 'D')`.
- **Restart:** chiamare `scene.scene.restart()` per resettare tutto in modo pulito.
