// The mower and the districts it cuts (world.md). Step 0 stub: initMowing sets the first mow; roadmap 7.18 fills the rest.
import type { DistrictId, RegionId, Trait, WorldState } from './types';
import type { Rng } from './rng';

export function initMowing(w: WorldState, rng: Rng): void {
  w.mowing.next = w.tuning.mowing.everyDays[0] * w.tuning.clock.ticksPerDay;
}
export function stepMowing(w: WorldState, rng: Rng): void { /* roadmap 7.18 */ }
export function isMown(w: WorldState, d: DistrictId): boolean { return false; }
export function mowingSoon(w: WorldState): { district: DistrictId; inTicks: number } | null { return null; }
export function regionTraits(w: WorldState, r: RegionId): readonly Trait[] { return w.graph.byId[r].traits; }
