// Garden beds in the world: planting, watering, harvesting (roadmap 9.2). Step 0 stub: no-op.
import type { Bus } from './bus';
import type { Interact } from './interact';
import type { FarmSystem, InventorySystem, SimHost, SkillSystem } from './types';

export function createFarmSystem(deps: { host: SimHost; inv: InventorySystem; interact: Interact; bus: Bus; skills: SkillSystem }): FarmSystem {
  return { update: (dt: number): void => { /* roadmap 9.2 */ } };
}
