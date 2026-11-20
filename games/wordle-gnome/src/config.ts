export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const SCENES = {
  boot: 'Boot',
  title: 'Title',
  game: 'Game',
  gameOver: 'GameOver',
} as const;

/** Texture keys generated in BootScene. Sizes in pixels. */
export const TEX = {
  player: 'player', // 32x32 circle
  enemy: 'enemy',   // 28x28 triangle
  coin: 'coin',     // 16x16 circle
  spark: 'spark',   // 6x6 square, for particles
} as const;

export const COLORS = {
  background: '#10131a',
  player: 0x4dd0e1,
  enemy: 0xff5252,
  coin: 0xffd54f,
  spark: 0xffffff,
  text: '#e8eaf6',
  accent: '#ffd54f',
} as const;

/** Gameplay tuning. Change these to change the feel. */
export const TUNING = {
  playerSpeed: 260,          // px/s
  enemySpeedMin: 90,         // px/s
  enemySpeedMax: 220,        // px/s
  enemySpawnStartMs: 900,    // first spawn interval
  enemySpawnMinMs: 250,      // fastest spawn interval
  enemySpawnRampMs: 15,      // interval shrinks by this per second survived
  coinSpawnMs: 1800,
  coinLifetimeMs: 5000,
  coinScore: 10,
  survivalScorePerSec: 1,
  hitToGameOverMs: 700,
} as const;

export type SfxName = 'start' | 'coin' | 'hit';

/** Passed from GameScene to GameOverScene via this.scene.start(SCENES.gameOver, data). */
export interface GameOverData {
  score: number;
  secondsSurvived: number;
}

export const STORAGE_KEY_HIGH_SCORE = 'sample-dodge.highScore';
