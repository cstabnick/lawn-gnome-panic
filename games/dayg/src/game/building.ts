// Placing pieces in the world (roadmap 9.1). Step 0 stub: nothing can be placed.
import type * as THREE from 'three';
import type { Collider } from '../world/collide';
import type { Bus } from './bus';
import type { Interact } from './interact';
import type { BuildSystem, InventorySystem, PlayerState, SimHost, SkillSystem } from './types';
import type { PieceKind } from '../sim/types';

export function createBuildSystem(deps: {
  scene: THREE.Scene; host: SimHost; inv: InventorySystem; collider: Collider; interact: Interact; bus: Bus; skills: SkillSystem;
  getPlayer: () => PlayerState; getYaw: () => number;
}): BuildSystem {
  return {
    update: (dt: number): void => { /* roadmap 9.1 */ },
    start: (kind: PieceKind): boolean => false,
    cancel: (): void => { /* roadmap 9.1 */ },
    placing: (): PieceKind | null => null,
    confirm: (): boolean => false,
    canAfford: (kind: PieceKind): boolean => false,
  };
}
