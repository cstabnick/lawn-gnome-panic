import type { EntityId } from '../lore/types';

export interface BoxCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface EntityAnchor {
  id: EntityId;
  label: string;
  x: number;
  y: number;
  z: number;
  interactRadius: number;
}

export const ROOM_MIN_X = -6.2;
export const ROOM_MAX_X = 6.2;
export const ROOM_MIN_Z = -5.2;
export const ROOM_MAX_Z = 5.2;
export const PLAYER_RADIUS = 0.38;

export const COLLIDERS: BoxCollider[] = [
  // Cone pedestal
  { minX: -0.75, maxX: 0.75, minZ: 1.05, maxZ: 2.55 },
  // Living room couch
  { minX: -4.2, maxX: -1.4, minZ: 3.9, maxZ: 5.1 },
  // TV stand
  { minX: -6.2, maxX: -5.0, minZ: 1.3, maxZ: 3.1 },
  // Fridge
  { minX: -6.2, maxX: -4.9, minZ: -4.2, maxZ: -2.6 },
  // Kitchen counter (Microwave + Burrito + Toaster)
  { minX: -3.8, maxX: 1.1, minZ: -5.2, maxZ: -3.95 },
  // Hallway partition wall
  { minX: 1.3, maxX: 1.7, minZ: -5.2, maxZ: -1.2 },
  // Printer / Scam Ledger desk
  { minX: 3.7, maxX: 5.9, minZ: -5.2, maxZ: -3.7 },
];

export const ENTITY_ANCHORS: Record<EntityId, EntityAnchor> = {
  cone: { id: 'cone', label: 'Rotating Doner Cone', x: 0, y: 1.2, z: 1.8, interactRadius: 2.3 },
  fridge: { id: 'fridge', label: 'The Fridge', x: -5.3, y: 1.2, z: -3.4, interactRadius: 2.6 },
  microwave: { id: 'microwave', label: 'Microwave & Burrito', x: -2.3, y: 1.1, z: -4.4, interactRadius: 2.3 },
  toaster: { id: 'toaster', label: 'The Toaster', x: 0.25, y: 1.05, z: -4.4, interactRadius: 2.3 },
  printer: { id: 'printer', label: 'Printer & Scam Ledger', x: 4.8, y: 1.0, z: -4.3, interactRadius: 2.4 },
  smoke_detector: { id: 'smoke_detector', label: 'Smoke Detector', x: 0.5, y: 2.9, z: -0.5, interactRadius: 99 },
  tv: { id: 'tv', label: 'Horse Hockey TV', x: -5.5, y: 1.1, z: 2.2, interactRadius: 2.3 },
  apartment: { id: 'apartment', label: 'Apartment', x: 0, y: 1.0, z: 0, interactRadius: 99 },
};

export interface SpawnSpot {
  x: number;
  y: number;
  z: number;
}

export const PICKUP_SPOTS: SpawnSpot[] = [
  { x: -3.2, y: 0.96, z: -4.3 }, // kitchen counter left
  { x: -1.1, y: 0.96, z: -4.3 }, // kitchen counter middle
  { x: 0.75, y: 0.96, z: -4.3 }, // kitchen counter right
  { x: -2.6, y: 0.45, z: 4.35 }, // couch cushion
  { x: 4.1, y: 0.85, z: -4.1 },  // desk corner
  { x: 3.4, y: 0.2, z: 2.8 },    // living room floor
  { x: -4.5, y: 0.2, z: -1.2 },  // near fridge
];

export function resolvePlayerMove(x: number, z: number, dx: number, dz: number): { x: number; z: number } {
  let nx = Math.max(ROOM_MIN_X + PLAYER_RADIUS, Math.min(ROOM_MAX_X - PLAYER_RADIUS, x + dx));
  let nz = Math.max(ROOM_MIN_Z + PLAYER_RADIUS, Math.min(ROOM_MAX_Z - PLAYER_RADIUS, z + dz));

  for (const b of COLLIDERS) {
    const cx = Math.max(b.minX, Math.min(b.maxX, nx));
    const cz = Math.max(b.minZ, Math.min(b.maxZ, nz));
    const distX = nx - cx;
    const distZ = nz - cz;
    const distSq = distX * distX + distZ * distZ;
    if (distSq < PLAYER_RADIUS * PLAYER_RADIUS) {
      const dist = Math.sqrt(distSq);
      if (dist > 0.0001) {
        const push = PLAYER_RADIUS - dist;
        nx += (distX / dist) * push;
        nz += (distZ / dist) * push;
      } else {
        nx = x;
        nz = z;
      }
    }
  }
  return { x: nx, z: nz };
}
