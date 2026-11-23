// Garden beds and crops (crafting.md, world.md). Step 0 stub: roadmap 9.2 and 7.17 fill the behaviour.
import type { Bed, CropId, ItemStack, WorldState } from './types';
import type { Rng } from './rng';

export function plantBed(w: WorldState, bed: number, crop: CropId): boolean { return false; }
export function waterBed(w: WorldState, bed: number, litres: number): void { /* roadmap 7.17 */ }
export function tendBed(w: WorldState, bed: number): void { /* roadmap 7.17 */ }
export function harvestBed(w: WorldState, bed: number): ItemStack[] { return []; }
export function stepFarms(w: WorldState, rng: Rng): void { /* roadmap 7.17 */ }
export function bedOf(w: WorldState, piece: number): Bed | null { return null; }
