// ============================================================
// config.ts — Tutte le costanti centralizzate del gioco
// ============================================================

// Canvas
export const GAME_WIDTH = 800
export const GAME_HEIGHT = 800

// Anello giocabile
export const RING_INNER_RADIUS = 100
export const RING_OUTER_RADIUS = 380

// Player
export const PLAYER_SPEED_ANGULAR = 2.5   // rad/s
export const PLAYER_SPEED_RADIAL = 80     // px/s
export const PLAYER_SIZE = 14             // px, dimensione triangolo
export const PLAYER_HITBOX_R = 10         // px, raggio hitbox

// Ostacoli
export const OBSTACLE_SPEED_START = 60    // px/s
export const OBSTACLE_SPEED_MAX = 220     // px/s
export const OBSTACLE_SPAWN_INTERVAL_START = 1200  // ms
export const OBSTACLE_SPAWN_INTERVAL_MIN = 300     // ms
export const OBSTACLE_ANGULAR_WIDTH_MIN = 0.20     // rad
export const OBSTACLE_ANGULAR_WIDTH_MAX = 0.45     // rad
export const OBSTACLE_THICKNESS = 12               // px

// Difficoltà
export const DIFFICULTY_RAMP_INTERVAL = 5000  // ms

// Colori (palette retro vettoriale)
export const COLOR_BG = 0x000000
export const COLOR_RING = 0x00ffcc
export const COLOR_PLAYER = 0x00ffff
export const COLOR_OBSTACLE = 0xff00ff
export const COLOR_HIT = 0xff0000
export const COLOR_TEXT = 0xffffff
export const COLOR_SCORE = 0x00ffcc
