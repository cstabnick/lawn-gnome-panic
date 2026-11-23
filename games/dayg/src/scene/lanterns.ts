// Grave lanterns that can be lit (roadmap 9.4). Step 0 stub: none lit.
import type * as THREE from 'three';
import type { BlockoutMap } from '../world/types';
import type { Bus } from '../game/bus';
import type { Interact } from '../game/interact';
import type { InventorySystem, LanternSystem, PlayerState, SimHost } from '../game/types';

export function createLanterns(deps: {
  scene: THREE.Scene; map: BlockoutMap; interact: Interact; host: SimHost; inv: InventorySystem; bus: Bus; getPlayer: () => PlayerState;
}): LanternSystem {
  return { update: (dt: number): void => { /* roadmap 9.4 */ }, litCount: (): number => 0 };
}
