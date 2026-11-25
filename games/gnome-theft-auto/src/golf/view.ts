// Hedgeworth's ball, aim line and golf camera (STUB: issue A15 fills it in). three.js only; reads the round state.
import type * as THREE from 'three';
import type { RoundState } from './types';

export interface GolfView {
  /** Every frame: draw the ball (at rest or in flight), the aim line and landing preview while aiming. s = null hides all. */
  update(dt: number, s: RoundState | null): void;
  /** Drive the camera for the address view and the ball flight; false (camera untouched) otherwise. */
  applyCamera(s: RoundState | null, dt: number): boolean;
  dispose(): void;
}

export function createGolfView(_scene: THREE.Scene, _camera: THREE.PerspectiveCamera): GolfView {
  return { update() {}, applyCamera: () => false, dispose() {} };
}
