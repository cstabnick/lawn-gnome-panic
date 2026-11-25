// E25 Gnomazon: Fulfilment Centre FC-1 in the Dust Flats (site 'gnomazon-fc'): the big shed, loading docks and lot
// outside (buildWarehouseOutside), and the packing floor interior GNOMAZON_FLOOR_ID (defined at import; workplaces/
// index.ts imports this file once). STUB: issue 17 fills it in.
import type * as THREE from 'three';
import { anchorOf } from '../../sites';
import type { World } from '../../types';

/** The building's front door (world): the interior's door prompt is here. */
export function warehouseDoor(): { x: number; z: number; yaw: number } {
  const d = anchorOf('gnomazon-fc', 'door');
  return { x: d.x, z: d.z, yaw: d.yaw ?? 0 };
}

/** Build the outside once (idempotent). Pushes colliders into world.boxes. */
export function buildWarehouseOutside(scene: THREE.Scene, world: World): void {
  void scene; void world;
}
