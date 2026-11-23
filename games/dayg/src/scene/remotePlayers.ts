// Other players' gnomes in the world (roadmap 8.8). Step 0 stub: none are shown.
import type * as THREE from 'three';
import type { NetSession, RemotePlayers, SimHost } from '../game/types';

export function createRemotePlayers(deps: { scene: THREE.Scene; host: SimHost; session: NetSession }): RemotePlayers {
  return { update: (dt: number): void => { /* roadmap 8.8 */ }, count: (): number => 0 };
}
