// Piece actions: using doors, ladders, chests, beds and fire rings. STUB (roadmap 9 step 0): no-op; issue 3.2 replaces it.
import type { Bus } from '../game/bus';
import type { Interact } from '../game/interact';
import type { CampSystem, Clock, HatlessSystem, InventorySystem, PlayerState } from '../game/types';
import type { BaseSystem } from './system';
import type { BaseView } from './view';
import type { ChestUi } from './chestUi';

export interface PieceActionDeps { base: BaseSystem; view: BaseView; interact: Interact; inv: InventorySystem; bus: Bus; clock: Clock; camp: CampSystem; hatless: HatlessSystem; getPlayer: () => PlayerState; chest: ChestUi }
export interface PieceActions { update(dt: number): void; sleeping(): boolean }

export function createPieceActions(deps: PieceActionDeps): PieceActions {
  void deps;
  return { update: () => {}, sleeping: () => false };
}
