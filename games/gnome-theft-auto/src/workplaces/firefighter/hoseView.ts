// E25 firefighter: the hose stream in the world: instanced water droplets running along the arc and a splash ring
// where it lands. STUB: issue 13 fills it in.
import type * as THREE from 'three';

export interface HoseView {
  /** points: the arc (x, y, z triples, from hose.ts hoseArc), count = how many; null or 0 hides the stream. */
  set(points: Float32Array | null, count: number, dt: number): void;
  dispose(): void;
}

export function createHoseView(scene: THREE.Scene): HoseView {
  void scene;
  return { set() {}, dispose() {} };
}
