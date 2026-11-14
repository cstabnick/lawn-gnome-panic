// playMinigame: a game plays its own slice alone (games/<game>/#minigame) against 3 CPUs, no party, no server.
// STUB: issue 2G fills it in. Keep the exported signatures.
import type { AnyMinigame, SeatInfo } from './types';

export interface PlayOpts {
  canvas: HTMLCanvasElement;
  /** The game's #ui element: append your own div to it, never restyle it. */
  ui: HTMLElement;
  /** Default: defaultSeats() (me + 3 CPUs). */
  seats?: SeatInfo[];
  /** Default true: after the result card, play again with a new seed. */
  loop?: boolean;
  onDone?(places: number[]): void;
}

export function playMinigame(def: AnyMinigame, o: PlayOpts): { stop(): void } {
  console.warn(`playMinigame(${def.meta.id}) is a stub until @lawn/party's runner lands`, o);
  return { stop() {} };
}
