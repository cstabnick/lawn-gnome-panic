// The mower's rumble and cut grass in the world (roadmap 9.4). Step 0 stub: no-op.
import type * as THREE from 'three';
import type { Bus } from '../game/bus';
import type { MowingFx, PlayerState, SimHost } from '../game/types';

export function createMowingFx(deps: { scene: THREE.Scene; host: SimHost; bus: Bus; getPlayer: () => PlayerState; camera: THREE.Camera }): MowingFx {
  return { update: (dt: number): void => { /* roadmap 9.4 */ } };
}
