// E25 fire system: how fires look. Instanced flame cones that flicker, fx.fire puffs, black smoke, a pool of 2 point
// lights on the nearest fires, steam when doused, a scorch disc (on a draw layer) where a fire was. Reads a FireField
// (fire/types.ts) every frame; owns no simulation. STUB: issue 11 fills it in.
import type * as THREE from 'three';
import type { Fx } from '../types';
import type { FireField } from './types';

export interface FireView {
  /** Draw `field` this frame. Fires farther than 220 m from (camX, camZ) are skipped. */
  update(dt: number, field: FireField, camX: number, camZ: number): void;
  /** A puff of white steam (water hitting a fire). */
  steam(x: number, y: number, z: number): void;
  /** Remove every mesh and light it added. */
  dispose(): void;
}

export function createFireView(scene: THREE.Scene, fx: Fx): FireView {
  void scene;
  return {
    update(_dt, field) {
      for (const f of field.fires) if (f.state === 'burning') fx.fire(f.x, f.y, f.z, f.r);
    },
    steam() {},
    dispose() {},
  };
}
