// Notice boards in the world (quests.md). Step 0 stub: no board is found near a point.
import type * as THREE from 'three';
import type { Bus } from '../game/bus';
import type { Interact } from '../game/interact';
import type { BoardPanel, BoardsInWorld, SimHost } from '../game/types';
import type { BlockoutMap } from '../world/types';

export function createBoards(deps: { scene: THREE.Scene; map: BlockoutMap; interact: Interact; host: SimHost; panel: BoardPanel; bus: Bus }): BoardsInWorld {
  return { boardNear: () => null };
}
