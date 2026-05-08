# CONTEXT — Vector Ring: Arcade Retro Game

> Documento di riferimento architetturale e di design.  
> Da usare come contesto base per tutti i prompt e le sessioni di lavoro successive.

---

## Identità del progetto

| Proprietà | Valore |
|---|---|
| **Nome** | Vector Ring |
| **Genere** | Arcade 2D retro, survival |
| **Estetica** | Vettoriale anni 80, stile monitor CRT |
| **Piattaforma** | Browser (web app locale) |
| **Stack** | Phaser 3 + TypeScript + Vite |
| **Rendering** | Procedurale con primitive geometriche (no sprite, no immagini) |
| **Backend** | Nessuno |

---

## Concetto di gioco

Il giocatore pilota una navicella che si muove all'interno di una **fascia anulare** (lo spazio tra due cerchi concentrici centrati sullo schermo).

Gli **ostacoli** nascono vicino al centro della fascia e si espandono verso l'esterno. Questo crea l'illusione ottica di muoversi ad alta velocità verso un centro luminoso — come un tunnel o un warp.

L'obiettivo è **sopravvivere il più a lungo possibile** evitando gli ostacoli.  
La difficoltà aumenta nel tempo: gli ostacoli diventano più veloci e più frequenti.

---

## Sistema di coordinate

Il gioco usa **coordinate polari** come sistema di riferimento principale per tutta la logica di gameplay.

```
Polo: centro dello schermo (cx = GAME_WIDTH/2, cy = GAME_HEIGHT/2)
Angolo: 0 = destra, aumenta in senso orario (convenzione canvas)
Raggio: distanza dal centro

Conversione a cartesiane (solo per rendering):
  x = cx + cos(angle) * radius
  y = cy + sin(angle) * radius
```

Tutti gli oggetti di gioco (player, ostacoli) vivono in `(angle, radius)`.  
La conversione a `(x, y)` avviene solo nel layer di rendering.

---

## Area di gioco

```
┌─────────────────────────────┐
│         SCHERMO 800x800     │
│                             │
│      ╭───────────────╮      │  ← RING_OUTER_RADIUS (380px)
│    ╭─┤               ├─╮    │
│    │ │  ╭─────────╮  │ │    │
│    │ │  │  CENTRO │  │ │    │  ← RING_INNER_RADIUS (100px)
│    │ │  │  (dead) │  │ │    │
│    │ │  ╰─────────╯  │ │    │
│    │ │               │ │    │
│    ╰─┤  FASCIA DI   ├─╯    │  ← zona giocabile
│      │  GIOCO        │      │
│      ╰───────────────╯      │
└─────────────────────────────┘
```

- **Zona giocabile:** fascia tra `RING_INNER_RADIUS` (100px) e `RING_OUTER_RADIUS` (380px)
- **Zona proibita interna:** dentro `RING_INNER_RADIUS` — il player non può entrare
- **Zona esterna:** fuori da `RING_OUTER_RADIUS` — gli ostacoli vengono distrutti qui

---

## Flusso di gioco (stati)

```
                ┌──────────────┐
                │   TITLE      │  ← schermata iniziale con titolo e istruzioni
                └──────┬───────┘
                       │ SPACE / ENTER
                ┌──────▼───────┐
                │   PLAYING    │  ← game loop attivo
                └──────┬───────┘
                       │ collisione
                ┌──────▼───────┐
                │  GAME OVER   │  ← mostra score, aspetta restart
                └──────┬───────┘
                       │ R / SPACE
                       │ scene.restart()
                ┌──────▼───────┐
                │   PLAYING    │  ← nuovo gioco
                └──────────────┘
```

---

## Architettura del codice

### Struttura file

```
src/
├── main.ts                    # Bootstrap Phaser.Game
├── config.ts                  # Tutte le costanti di gioco
├── scenes/
│   └── GameScene.ts           # Scena principale, orchestra tutti i moduli
├── player/
│   └── Player.ts              # Stato e rendering navicella
├── obstacles/
│   └── ObstacleManager.ts     # Pool, spawn, update, draw ostacoli
├── collision/
│   └── CollisionManager.ts    # Rilevamento collisioni polar-space
├── hud/
│   └── HUD.ts                 # Score, titolo, game over overlay
├── rendering/
│   └── RenderHelpers.ts       # Utility: polarToCart, drawRing, drawGlow
└── difficulty/
    └── DifficultyManager.ts   # Curva di difficoltà nel tempo
```

### Responsabilità dei moduli

| Modulo | Responsabilità |
|---|---|
| `GameScene` | Lifecycle Phaser, gestione stati, coordinamento moduli |
| `Player` | Stato polare (angle, radius), input, rendering navicella |
| `ObstacleManager` | Pool di ostacoli, spawn timer, update posizioni, rendering |
| `CollisionManager` | Check collisioni in spazio polare, trigger game over |
| `HUD` | Testi a schermo: score, titolo, istruzioni, game over |
| `RenderHelpers` | Funzioni pure di rendering: anello, glow, conversioni |
| `DifficultyManager` | Calcolo velocità e frequenza in base al tempo |
| `config.ts` | Tutte le costanti numeriche e colori |

### Pattern architetturale

- **GameScene** è il controller centrale
- Ogni modulo espone `update(delta)` e `draw(graphics)`
- Un singolo `Phaser.GameObjects.Graphics` viene passato a tutti i moduli per il disegno
- Il `Graphics` viene resettato con `.clear()` ogni frame prima del disegno
- Nessun sistema di eventi interno: le comunicazioni avvengono tramite valori di ritorno o callback semplici

---

## Player

**Stato:**
```ts
{
  angle: number   // posizione angolare corrente (rad)
  radius: number  // distanza dal centro (px)
}
```

**Movimento:**
| Tasto | Effetto |
|---|---|
| `←` / `A` | Ruota in senso antiorario (`angle -= speed * dt`) |
| `→` / `D` | Ruota in senso orario (`angle += speed * dt`) |
| `↑` / `W` | Avanza verso il centro (`radius -= speed * dt`) |
| `↓` / `S` | Arretra verso l'esterno (`radius += speed * dt`) |

**Vincoli:**
- `radius` clampato tra `RING_INNER_RADIUS + 10` e `RING_OUTER_RADIUS - 10`

**Hitbox:**
- Cerchio di raggio `PLAYER_HITBOX_R` (≈ `PLAYER_SIZE * 0.7`) centrato sulla navicella

**Rendering:**
- Triangolo isoscele con vertice "puntato" nella direzione angolare del player
- Vertice anteriore: `polarToCart(angle, radius + PLAYER_SIZE, cx, cy)`
- Vertici laterali: `polarToCart(angle ± 0.35, radius - PLAYER_SIZE * 0.5, cx, cy)`
- Fill ciano + stroke bianco sottile

---

## Ostacoli

**Struttura dati:**
```ts
interface Obstacle {
  angle: number         // angolo centrale dell'arco
  radius: number        // raggio corrente (cresce nel tempo)
  speed: number         // px/s verso l'esterno
  angularWidth: number  // ampiezza in radianti (es. 0.2 - 0.5 rad)
  thickness: number     // spessore radiale (px)
  alive: boolean        // false = da rimuovere
}
```

**Ciclo di vita:**
1. **Spawn:** `radius = RING_INNER_RADIUS + 5`, angolo casuale `[0, 2π]`
2. **Update:** `radius += speed * dt`
3. **Despawn:** quando `radius > RING_OUTER_RADIUS + 20`

**Rendering:**
- Arco o trapezio curvato a `radius`, larghezza `angularWidth`, spessore `thickness`
- Colore: magenta (`COLOR_OBSTACLE`)
- Leggero glow attorno

**Spawn rate:** controllato da `DifficultyManager`

---

## Collisioni

**Rilevamento in spazio polare** (efficiente per questo layout):

```
Per ogni ostacolo alive:
  1. CHECK RADIALE:
     gap_r = |player.radius - obstacle.radius|
     se gap_r > obstacle.thickness/2 + PLAYER_HITBOX_R → skip

  2. CHECK ANGOLARE:
     diff_angle = angleDiff(player.angle, obstacle.angle)  // in [-π, π]
     player_angular_size = PLAYER_HITBOX_R / player.radius  // approx in rad
     se |diff_angle| > obstacle.angularWidth/2 + player_angular_size → skip

  3. COLLISIONE RILEVATA → trigger game over
```

**Utility `angleDiff(a, b)`:**
```ts
let d = ((b - a) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
return d > Math.PI ? d - 2 * Math.PI : d
```

---

## Sistema di difficoltà

```
level = floor(elapsedSeconds / 5)   // aumenta ogni 5 secondi

obstacleSpeed = min(
  OBSTACLE_SPEED_START + level * 15,
  OBSTACLE_SPEED_MAX
)

spawnInterval = max(
  OBSTACLE_SPAWN_INTERVAL_START - level * 80,
  OBSTACLE_SPAWN_INTERVAL_MIN
)
```

---

## HUD

### Schermata titolo (stato TITLE)
```
┌─────────────────────────────┐
│                             │
│         VECTOR RING         │  ← testo grande, ciano, centrato
│                             │
│    ← → ↑ ↓  /  WASD        │  ← istruzioni controlli
│    Evita gli ostacoli       │
│    Sopravvivi più a lungo   │
│                             │
│     [ SPACE TO START ]      │  ← lampeggiante
│                             │
└─────────────────────────────┘
```

### Durante il gioco (stato PLAYING)
```
SCORE: 0042   [top-left, monospace, ciano]
LVL: 3        [opzionale]
```

### Game over (stato GAME_OVER)
```
        GAME OVER         ← rosso/magenta, grande
        
     SCORE: 0042          ← bianco, medio
     
  [ R / SPACE TO RETRY ]  ← lampeggiante
```

---

## Palette colori

| Elemento | Colore | Hex |
|---|---|---|
| Sfondo | Nero | `#000000` |
| Anello giocabile | Ciano | `#00FFCC` |
| Navicella | Ciano chiaro | `#00FFFF` |
| Ostacoli | Magenta | `#FF00FF` |
| Testo score | Bianco | `#FFFFFF` |
| Collisione/danger | Rosso | `#FF0000` |
| Accenti HUD | Ciano | `#00FFCC` |

---

## Parametri di tuning (da `config.ts`)

| Costante | Valore default | Descrizione |
|---|---|---|
| `GAME_WIDTH` | 800 | Larghezza canvas |
| `GAME_HEIGHT` | 800 | Altezza canvas |
| `RING_INNER_RADIUS` | 100 | Raggio cerchio interno |
| `RING_OUTER_RADIUS` | 380 | Raggio cerchio esterno |
| `PLAYER_SPEED_ANGULAR` | 2.5 | Velocità rotazione (rad/s) |
| `PLAYER_SPEED_RADIAL` | 80 | Velocità radiale (px/s) |
| `PLAYER_SIZE` | 14 | Dimensione navicella (px) |
| `PLAYER_HITBOX_R` | 10 | Raggio hitbox player |
| `OBSTACLE_SPEED_START` | 60 | Velocità ostacoli iniziale (px/s) |
| `OBSTACLE_SPEED_MAX` | 220 | Velocità ostacoli massima |
| `OBSTACLE_SPAWN_INTERVAL_START` | 1200 | Intervallo spawn iniziale (ms) |
| `OBSTACLE_SPAWN_INTERVAL_MIN` | 300 | Intervallo spawn minimo |
| `OBSTACLE_ANGULAR_WIDTH_MIN` | 0.20 | Larghezza angolare minima ostacolo |
| `OBSTACLE_ANGULAR_WIDTH_MAX` | 0.45 | Larghezza angolare massima |
| `OBSTACLE_THICKNESS` | 12 | Spessore radiale ostacolo (px) |
| `DIFFICULTY_RAMP_INTERVAL` | 5000 | Frequenza aumento difficoltà (ms) |

---

## Rendering procedurale — note tecniche

### Pattern Phaser Graphics

```ts
// In GameScene.create():
this.graphics = this.add.graphics()

// In GameScene.update():
this.graphics.clear()
drawRing(this.graphics, ...)
this.player.draw(this.graphics)
this.obstacleManager.draw(this.graphics)
// Il HUD usa scene.add.text(), non graphics
```

### Glow senza plugin

```ts
// Disegna prima una versione "gonfiata" semi-trasparente
graphics.lineStyle(lineWidth + 6, color, 0.15)
graphics.strokeCircle(x, y, r + 3)

// Poi la versione normale
graphics.lineStyle(lineWidth, color, 1.0)
graphics.strokeCircle(x, y, r)
```

### Flash collisione

```ts
// Rettangolo rosso coprente che decade in alpha
let flashAlpha = 0.5
// In update:
flashAlpha = Math.max(0, flashAlpha - delta * 0.002)
graphics.fillStyle(0xff0000, flashAlpha)
graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
```

---

## Regole di sviluppo

1. **Coordinate polari first:** tutta la logica usa `(angle, radius)`. Cartesiane solo per draw.
2. **Frame-rate independent:** usare sempre `delta` (ms) per tutti i movimenti.
3. **Nessun asset esterno:** zero immagini, zero font esterni, zero atlas.
4. **Config centralizzato:** tutti i numeri tunable in `config.ts`.
5. **Un solo Graphics object:** resettato ogni frame, condiviso tra tutti i moduli.
6. **Restart pulito:** `scene.restart()` — nessun cleanup manuale necessario.
7. **Nessuna fisica Phaser:** solo matematica manuale (no arcade physics, no matter.js).
8. **TypeScript strict:** zero `any`, zero errori a compile time.

---

## Comandi di sviluppo

```bash
npm install        # installa dipendenze
npm run dev        # avvia dev server (Vite, hot reload)
npm run build      # build produzione
npm run preview    # preview build produzione
```

---

## Controlli di gioco

| Tasto | Azione |
|---|---|
| `←` / `A` | Ruota navicella a sinistra |
| `→` / `D` | Ruota navicella a destra |
| `↑` / `W` | Muovi verso il centro |
| `↓` / `S` | Muovi verso l'esterno |
| `SPACE` | Inizia gioco / Riavvia |
| `R` | Riavvia (da game over) |

---

## Limiti noti del prototipo (MVP)

- Nessun audio (rimandato alla v2)
- Nessun sistema di high score persistente
- Nessun effetto di esplosione al game over (solo flash)
- Nessun effetto di parallax/stelle nel background
- Ostacoli semplici (archi), nessuna varietà di forma
- Nessuna schermata di pausa
