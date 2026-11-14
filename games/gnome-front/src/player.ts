// src/player.ts: the local player's first-person controls, vehicle driving and camera. STUB: filled in by epic 2.
import type { Game, InputState } from './config';

export interface PlayerController {
  update(input: InputState, dt: number): void;
}

export function createPlayerController(game: Game): PlayerController {
  return {
    update(input, dt) {
      void input; void dt;
      const p = game.player;
      game.camera.position.set(p.pos.x, p.pos.y + 1.15, p.pos.z);
    },
  };
}
