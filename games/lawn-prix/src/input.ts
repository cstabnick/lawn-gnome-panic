// STUB (Epic 2 fills this in): keyboard and touch controls of the full game, as a KartInput.
import type { KartInput } from './config';

export interface Controls {
  read(): KartInput;
  dispose(): void;
}

/** Listens on window (keys) and on the canvas (touch). */
export function createControls(canvas: HTMLCanvasElement): Controls {
  void canvas;
  return { read: () => ({ steer: 0, throttle: 0, drift: false }), dispose() {} };
}
