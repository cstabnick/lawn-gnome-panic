// The minigame runner: plays any MinigameDef (countdown, host stepping with CPU and remote inputs, snapshots,
// time cap, host takeover, cleanup). STUB: issue 2G fills it in. Keep the exported signatures.
import type * as THREE from 'three';
import type { AnyMinigame, PadState, SeatIndex, SeatInfo } from './types';

export const COUNTDOWN_S = 3;

export interface RunnerOpts {
  def: AnyMinigame;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  uiParent: HTMLElement;
  seats: readonly SeatInfo[];
  mySeat: SeatIndex | null;
  isHost: boolean;
  seed: number;
  pad: () => PadState;
  /** Host: broadcast a snapshot (t = seconds since GO, s = state). null when offline. */
  sendSnapshot: ((t: number, s: unknown) => void) | null;
  /** Client: send my latest input to the host. null when offline or host. */
  sendInput: ((i: unknown) => void) | null;
  /** Host only: the slice is over. Called once. */
  onDone(places: number[]): void;
}

export interface Runner {
  update(dt: number): void;
  receiveInput(seat: SeatIndex, i: unknown): void;
  receiveSnapshot(t: number, s: unknown): void;
  becomeHost(): void;
  setCpu(seat: SeatIndex): void;
  dispose(): void;
}

export function startMinigame(o: RunnerOpts): Runner {
  void o;
  return {
    update() {},
    receiveInput() {},
    receiveSnapshot() {},
    becomeHost() {},
    setCpu() {},
    dispose() {},
  };
}
