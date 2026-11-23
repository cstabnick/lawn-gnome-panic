// Static props (HOA signs, vibe set pieces) stand off the road: the same clearOfRoads rule the parked fleet uses.
import { clearOfRoads } from './fleet';
import { worldSpotChecks } from './fleetRuntime';
import type { World } from './types';

/**
 * The nearest centre to (x, z) that is off the road and clear of buildings and water (within 15 m), or (x, z) itself when
 * it already is clear. A test (propsOffRoad.test.ts) fails if a prop anchored this way still sits on asphalt.
 */
export function clearProp(world: World, x: number, z: number): { x: number; z: number } {
  // clearOfRoads takes parked-vehicle spots; a prop is a land spot, so it carries a land kind (never a boat).
  const [out] = clearOfRoads([{ x, z, yaw: 0, kind: 'ride-on' }], worldSpotChecks(world));
  return out ? { x: out.x, z: out.z } : { x, z };
}
