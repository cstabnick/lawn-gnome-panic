// E25 fire system dev demo: ?firedemo lights a few fires of each kind ahead of the player (and a fuel point to spread
// to); ?firedemo=douse puts them out over a few seconds. For screenshots and checking fire/view.ts. Does nothing
// without the URL parameter. STUB: issue 10 fills it in.
import type * as THREE from 'three';
import type { Fx, Player } from '../types';

export interface FireDemo {
  update(dt: number): void;
}

export function installFireDemo(scene: THREE.Scene, fx: Fx, player: Player): FireDemo {
  void scene; void fx; void player;
  return { update() {} };
}
