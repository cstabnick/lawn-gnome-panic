// Symmetrical 2v2 Bramble District arena geometry, terrain height, parkour walls, and structures.
import type { Team } from './config';

export const MAP_BOUNDS = {
  minX: -38,
  maxX: 38,
  minZ: -122,
  maxZ: 122,
} as const;

export interface WallBox {
  id: string;
  x: number; // center
  z: number; // center
  y: number; // bottom y
  w: number; // full width X
  h: number; // full height Y
  d: number; // full depth Z
  kind: 'wall' | 'arch' | 'terrace-block' | 'shed';
}

export interface StructureSpec {
  id: string;
  team: Team;
  tier: 1 | 2 | 3 | 4; // 4 = Ancient Ceramic Patron
  name: string;
  x: number;
  z: number;
  maxHp: number;
  range: number;
  damage: number;
  fireIntervalS: number;
  radius: number;
}

export interface ShopSpot {
  id: string;
  team: Team | 'neutral';
  x: number;
  z: number;
  radius: number;
}

/**
 * Parkour walls and elevated flank blocks placed to reward wall-jumping and dash-jumping.
 * Symmetrical across Z = 0 and X = 0.
 */
export const MAP_WALLS: readonly WallBox[] = [
  // Mid courtyard cover & wall-jump pillars
  { id: 'mid-pillar-w', x: -8.5, z: 0, y: 0, w: 2.4, h: 4.5, d: 5.5, kind: 'wall' },
  { id: 'mid-pillar-e', x: 8.5, z: 0, y: 0, w: 2.4, h: 4.5, d: 5.5, kind: 'wall' },

  // Parkour wall-jump corridors between main lane and side terraces
  { id: 'flank-wall-nw-1', x: -17.5, z: -22, y: 0, w: 1.8, h: 5.2, d: 11, kind: 'wall' },
  { id: 'flank-wall-ne-1', x: 17.5, z: -22, y: 0, w: 1.8, h: 5.2, d: 11, kind: 'wall' },
  { id: 'flank-wall-sw-1', x: -17.5, z: 22, y: 0, w: 1.8, h: 5.2, d: 11, kind: 'wall' },
  { id: 'flank-wall-se-1', x: 17.5, z: 22, y: 0, w: 1.8, h: 5.2, d: 11, kind: 'wall' },

  // Mid-lane Garden Sheds (neutral secret shops)
  { id: 'shed-w', x: -24, z: 0, y: 2.8, w: 3.6, h: 3.2, d: 4.2, kind: 'shed' },
  { id: 'shed-e', x: 24, z: 0, y: 2.8, w: 3.6, h: 3.2, d: 4.2, kind: 'shed' },

  // T1/T2 lane divider walls for cover & wall-jump escapes
  { id: 'lane-wall-n-w', x: -12, z: -52, y: 0, w: 2.0, h: 4.8, d: 8.0, kind: 'wall' },
  { id: 'lane-wall-n-e', x: 12, z: -52, y: 0, w: 2.0, h: 4.8, d: 8.0, kind: 'wall' },
  { id: 'lane-wall-s-w', x: -12, z: 52, y: 0, w: 2.0, h: 4.8, d: 8.0, kind: 'wall' },
  { id: 'lane-wall-s-e', x: 12, z: 52, y: 0, w: 2.0, h: 4.8, d: 8.0, kind: 'wall' },

  // Base gate walls
  { id: 'gate-n-w', x: -14, z: -96, y: 2.5, w: 10, h: 5.0, d: 2.2, kind: 'arch' },
  { id: 'gate-n-e', x: 14, z: -96, y: 2.5, w: 10, h: 5.0, d: 2.2, kind: 'arch' },
  { id: 'gate-s-w', x: -14, z: 96, y: 2.5, w: 10, h: 5.0, d: 2.2, kind: 'arch' },
  { id: 'gate-s-e', x: 14, z: 96, y: 2.5, w: 10, h: 5.0, d: 2.2, kind: 'arch' },
];

export const STRUCTURES: readonly StructureSpec[] = [
  // Team 0: Amber Hearth (-Z)
  { id: 'amber-t1', team: 0, tier: 1, name: 'Amber Garden Guardian', x: 0, z: -38, maxHp: 1350, range: 15.5, damage: 72, fireIntervalS: 1.05, radius: 1.6 },
  { id: 'amber-t2', team: 0, tier: 2, name: 'Amber Terracotta Walker', x: 0, z: -68, maxHp: 1950, range: 17, damage: 105, fireIntervalS: 0.95, radius: 2.0 },
  { id: 'amber-t3', team: 0, tier: 3, name: 'Amber Base Bastion', x: 0, z: -92, maxHp: 2400, range: 18, damage: 135, fireIntervalS: 0.85, radius: 2.2 },
  { id: 'amber-ancient', team: 0, tier: 4, name: 'Amber Ceramic Patron', x: 0, z: -108, maxHp: 3300, range: 19, damage: 165, fireIntervalS: 0.75, radius: 3.0 },

  // Team 1: Sapphire Well (+Z)
  { id: 'sapphire-t1', team: 1, tier: 1, name: 'Sapphire Garden Guardian', x: 0, z: 38, maxHp: 1350, range: 15.5, damage: 72, fireIntervalS: 1.05, radius: 1.6 },
  { id: 'sapphire-t2', team: 1, tier: 2, name: 'Sapphire Terracotta Walker', x: 0, z: 68, maxHp: 1950, range: 17, damage: 105, fireIntervalS: 0.95, radius: 2.0 },
  { id: 'sapphire-t3', team: 1, tier: 3, name: 'Sapphire Base Bastion', x: 0, z: 92, maxHp: 2400, range: 18, damage: 135, fireIntervalS: 0.85, radius: 2.2 },
  { id: 'sapphire-ancient', team: 1, tier: 4, name: 'Sapphire Ceramic Patron', x: 0, z: 108, maxHp: 3300, range: 19, damage: 165, fireIntervalS: 0.75, radius: 3.0 },
];

export const SHOPS: readonly ShopSpot[] = [
  { id: 'shop-amber', team: 0, x: 0, z: -116, radius: 9.0 },
  { id: 'shop-sapphire', team: 1, x: 0, z: 116, radius: 9.0 },
  { id: 'shop-west', team: 'neutral', x: -24, z: 0, radius: 6.0 },
  { id: 'shop-east', team: 'neutral', x: 24, z: 0, radius: 6.0 },
];

export const FOUNTAINS: Record<Team, { x: number; z: number; radius: number }> = {
  0: { x: 0, z: -118, radius: 7.5 },
  1: { x: 0, z: 118, radius: 7.5 },
};

export const RELIC_ALTAR = { x: 0, z: 0, maxHp: 2200, radius: 1.8 } as const;

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Pure ground height function.
 * - Bases (|z| >= 96) sit at y = 2.5m.
 * - Gentle downhill ramps from |z| = 86..54 (2.5 -> 1.1) and |z| = 30..12 (1.1 -> 0.0) into the center courtyard.
 * - Elevated side garden terraces (|x| >= 20, |z| <= 45) sit at y = 2.8m with smooth entry ramps at |z| = 36..48.
 */
export function groundHeightAt(x: number, z: number): number {
  const az = Math.abs(z);
  const ax = Math.abs(x);

  // Main lane profile
  let laneY = 0;
  if (az > 86) {
    laneY = 2.5;
  } else if (az > 54) {
    laneY = 1.1 + 1.4 * smoothstep(54, 86, az);
  } else if (az > 30) {
    laneY = 1.1;
  } else if (az > 12) {
    laneY = 1.1 * smoothstep(12, 30, az);
  }

  // Elevated flanking terraces (|x| >= 21, |z| <= 38)
  if (ax > 19 && az < 48) {
    const xBlend = smoothstep(19, 22, ax);
    const zBlend = 1 - smoothstep(34, 48, az);
    const terraceY = 2.8 * xBlend * zBlend;
    return Math.max(laneY, terraceY);
  }

  return laneY;
}

/** Surface normal from finite differences on groundHeightAt. */
export function groundNormalAt(x: number, z: number): { x: number; y: number; z: number } {
  const eps = 0.25;
  const hL = groundHeightAt(x - eps, z);
  const hR = groundHeightAt(x + eps, z);
  const hD = groundHeightAt(x, z - eps);
  const hU = groundHeightAt(x, z + eps);
  const nx = hL - hR;
  const ny = 2 * eps;
  const nz = hD - hU;
  const len = Math.hypot(nx, ny, nz) || 1;
  return { x: nx / len, y: ny / len, z: nz / len };
}

export interface MapCollisionResult {
  grounded: boolean;
  groundY: number;
  groundNormal: { x: number; y: number; z: number };
  wallNormal: { x: number; z: number } | null;
}

/**
 * Resolves entity position & velocity against arena bounds, terrain height, and parkour wall AABBs.
 */
export function resolveMapCollision(
  pos: { x: number; y: number; z: number },
  vel: { x: number; y: number; z: number },
  radius: number,
  height: number,
): MapCollisionResult {
  // Arena perimeter
  if (pos.x < MAP_BOUNDS.minX + radius) {
    pos.x = MAP_BOUNDS.minX + radius;
    if (vel.x < 0) vel.x = 0;
  } else if (pos.x > MAP_BOUNDS.maxX - radius) {
    pos.x = MAP_BOUNDS.maxX - radius;
    if (vel.x > 0) vel.x = 0;
  }
  if (pos.z < MAP_BOUNDS.minZ + radius) {
    pos.z = MAP_BOUNDS.minZ + radius;
    if (vel.z < 0) vel.z = 0;
  } else if (pos.z > MAP_BOUNDS.maxZ - radius) {
    pos.z = MAP_BOUNDS.maxZ - radius;
    if (vel.z > 0) vel.z = 0;
  }

  let wallNormal: { x: number; z: number } | null = null;
  let floorY = groundHeightAt(pos.x, pos.z);

  // Resolve against wall boxes (also allow standing on top of walls!)
  for (const w of MAP_WALLS) {
    const hw = w.w * 0.5 + radius;
    const hd = w.d * 0.5 + radius;
    const dx = pos.x - w.x;
    const dz = pos.z - w.z;
    if (Math.abs(dx) >= hw || Math.abs(dz) >= hd) continue;

    const topY = w.y + w.h;
    // Standing on top or landing on top
    if (pos.y >= topY - 0.35 && vel.y <= 0.5) {
      if (topY > floorY) floorY = topY;
      continue;
    }
    // Side collision if vertically overlapping
    if (pos.y + height > w.y && pos.y < topY - 0.15) {
      const penX = hw - Math.abs(dx);
      const penZ = hd - Math.abs(dz);
      if (penX < penZ) {
        const sx = dx >= 0 ? 1 : -1;
        pos.x += sx * penX;
        if (vel.x * sx < 0) vel.x = 0;
        wallNormal = { x: sx, z: 0 };
      } else {
        const sz = dz >= 0 ? 1 : -1;
        pos.z += sz * penZ;
        if (vel.z * sz < 0) vel.z = 0;
        wallNormal = { x: 0, z: sz };
      }
    }
  }

  let grounded = false;
  if (pos.y <= floorY + 0.03 && vel.y <= 0.1) {
    pos.y = floorY;
    if (vel.y < 0) vel.y = 0;
    grounded = true;
  }

  return {
    grounded,
    groundY: floorY,
    groundNormal: groundNormalAt(pos.x, pos.z),
    wallNormal,
  };
}

/**
 * Probes for a nearby wall within `dist` horizontally while airborne, for wall-jumping.
 */
export function findNearbyWallNormal(
  pos: { x: number; y: number; z: number },
  dist: number,
  height: number,
): { x: number; z: number } | null {
  for (const w of MAP_WALLS) {
    const topY = w.y + w.h;
    if (pos.y + height < w.y || pos.y > topY) continue;
    const hw = w.w * 0.5 + dist;
    const hd = w.d * 0.5 + dist;
    const dx = pos.x - w.x;
    const dz = pos.z - w.z;
    if (Math.abs(dx) < hw && Math.abs(dz) < hd) {
      const penX = hw - Math.abs(dx);
      const penZ = hd - Math.abs(dz);
      if (penX < penZ) return { x: dx >= 0 ? 1 : -1, z: 0 };
      return { x: 0, z: dz >= 0 ? 1 : -1 };
    }
  }
  if (pos.x <= MAP_BOUNDS.minX + dist) return { x: 1, z: 0 };
  if (pos.x >= MAP_BOUNDS.maxX - dist) return { x: -1, z: 0 };
  return null;
}

export function isNearShop(x: number, z: number, team: Team): boolean {
  for (const s of SHOPS) {
    if (s.team !== 'neutral' && s.team !== team) continue;
    if (Math.hypot(x - s.x, z - s.z) <= s.radius) return true;
  }
  return false;
}
