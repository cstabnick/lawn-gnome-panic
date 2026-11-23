// The built pieces in the world (roadmap 9.1). Step 0 stub: no-op.
import type * as THREE from 'three';
import type { Collider } from '../world/collide';
import type { Bus } from '../game/bus';
import type { PiecesView, SimHost } from '../game/types';

export function createPiecesView(deps: { scene: THREE.Scene; host: SimHost; collider: Collider; bus: Bus }): PiecesView {
  return { update: (dt: number): void => { /* roadmap 9.1 */ } };
}
