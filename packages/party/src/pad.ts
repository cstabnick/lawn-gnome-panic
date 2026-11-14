// The shared input pad (keyboard, mouse, touch → PadState). STUB: issue 2G fills it in. Keep the exported signatures.
import type { PadState } from './types';

export interface Pad {
  read(): PadState;
  dispose(): void;
}

export function createPad(canvas: HTMLCanvasElement): Pad {
  void canvas;
  return {
    read: () => ({ x: 0, y: 0, a: false, aPressed: false, pointer: null }),
    dispose() {},
  };
}
