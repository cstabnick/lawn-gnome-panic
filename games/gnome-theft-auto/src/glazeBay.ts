// Pay 'n' Glaze bays: every station where a drive-through shop can be opened. Turfton's and the Speedway's share one module.
import * as THREE from 'three';
import { PAY_N_GLAZE } from './config';
import { SPEEDWAY_GLAZE } from './raceTrack/track';
import type { Box } from './types';

export interface GlazeBay { id: 'turfton' | 'speedway'; name: string; x: number; z: number; radius: number }

/** Every Pay 'n' Glaze bay: Turfton's (PAY_N_GLAZE.bay) and the Speedway's (SPEEDWAY_GLAZE.bay). */
export const GLAZE_BAYS: readonly GlazeBay[] = [
  { id: 'turfton', name: "Pay 'n' Glaze", x: PAY_N_GLAZE.bay.x, z: PAY_N_GLAZE.bay.z, radius: PAY_N_GLAZE.bay.radius },
  { id: 'speedway', name: 'Speedway Pit Glaze', x: SPEEDWAY_GLAZE.bay.x, z: SPEEDWAY_GLAZE.bay.z, radius: SPEEDWAY_GLAZE.bay.radius },
];

/** The bay within (its radius + extra) of (x, z), or null. */
export function glazeBayNear(x: number, z: number, extra = 0): GlazeBay | null {
  for (const bay of GLAZE_BAYS) {
    if (Math.hypot(x - bay.x, z - bay.z) <= bay.radius + extra) return bay;
  }
  return null;
}

/** The two side-wall colliders of a drive-through Pay 'n' Glaze building (prefab gta-pay-n-glaze, open along z). */
export function glazeShopColliders(building: THREE.Object3D): Box[] {
  building.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(building);
  const wallW = Math.min(3.2, (bb.max.x - bb.min.x) * 0.25);
  return [
    { minX: bb.min.x, maxX: bb.min.x + wallW, minZ: bb.min.z, maxZ: bb.max.z, h: bb.max.y },
    { minX: bb.max.x - wallW, maxX: bb.max.x, minZ: bb.min.z, maxZ: bb.max.z, h: bb.max.y },
  ];
}
