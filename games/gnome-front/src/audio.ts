// src/audio.ts: sound effects from game events, vehicle engine hum, music. STUB: filled in by epic 2.
import type { Game } from './config';

export interface GameAudio {
  /** Call from a user gesture (the Play click): unlocks audio and starts the music. */
  start(): void;
  update(dt: number): void;
}

export function initAudio(game: Game): GameAudio {
  void game;
  return { start() {}, update() {} };
}
