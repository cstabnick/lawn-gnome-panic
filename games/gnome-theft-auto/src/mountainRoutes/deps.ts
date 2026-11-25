// E33: what the mountain routes' area modules get from app.ts (the dirt-country AreaDeps plus the player's vehicle).
import type { AreaDeps } from '../dirtCountry/types';
import type { VehicleKind } from '../types';

export type { Area } from '../dirtCountry/types';
export { EMPTY_AREA } from '../dirtCountry/types';

export interface MountainDeps extends AreaDeps {
  /** The kind of vehicle the player is driving or riding, or null on foot. */
  vehicleKind(): VehicleKind | null;
}
