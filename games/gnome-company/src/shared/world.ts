import type { ZoneId } from './types';

export type ObstacleKind =
  | 'hedge'
  | 'fence'
  | 'wall'
  | 'pillar'
  | 'furniture'
  | 'rock'
  | 'bush'
  | 'structure';

export interface ObstacleDef {
  id: string;
  zone: ZoneId;
  kind: ObstacleKind;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  blocksMove: boolean;
  blocksSight: boolean;
  /** Multiplier applied to enemy detection range when standing inside (e.g. 0.42) */
  stealthFactor?: number;
}

export interface PatrolPoint {
  x: number;
  z: number;
  pause?: number;
}

export const WORLD_OBSTACLES: ObstacleDef[] = [
  // ---------------- YARD STRUCTURES ----------------
  { id: 'y_shed', zone: 'yard', kind: 'structure', x: 0, z: 29, w: 7.4, d: 7.4, h: 4.5, blocksMove: true, blocksSight: true },
  { id: 'y_deku', zone: 'yard', kind: 'structure', x: -22, z: -18, w: 9.2, d: 9.2, h: 12, blocksMove: true, blocksSight: true },
  { id: 'y_house', zone: 'yard', kind: 'structure', x: 22, z: -20, w: 11.4, d: 10.4, h: 7.5, blocksMove: true, blocksSight: true },

  // ---------------- YARD HEDGES (Obscurity & Lanes) ----------------
  // Front courtyard hedges framing path out of the Shed
  { id: 'y_h1', zone: 'yard', kind: 'hedge', x: -9, z: 18, w: 8, d: 2.0, h: 2.4, blocksMove: true, blocksSight: true },
  { id: 'y_h2', zone: 'yard', kind: 'hedge', x: 9, z: 18, w: 8, d: 2.0, h: 2.4, blocksMove: true, blocksSight: true },

  // Central garden maze hedges breaking cross-yard sightlines
  { id: 'y_h3', zone: 'yard', kind: 'hedge', x: 0, z: 4, w: 10, d: 2.2, h: 2.5, blocksMove: true, blocksSight: true },
  { id: 'y_h4', zone: 'yard', kind: 'hedge', x: -14, z: 4, w: 2.2, d: 11, h: 2.5, blocksMove: true, blocksSight: true },
  { id: 'y_h5', zone: 'yard', kind: 'hedge', x: 14, z: 4, w: 2.2, d: 11, h: 2.5, blocksMove: true, blocksSight: true },
  { id: 'y_h6', zone: 'yard', kind: 'hedge', x: 0, z: -11, w: 12, d: 2.2, h: 2.5, blocksMove: true, blocksSight: true },

  // Outer flank hedges & wooden fences
  { id: 'y_h7', zone: 'yard', kind: 'hedge', x: -27, z: 6, w: 7, d: 2.2, h: 2.4, blocksMove: true, blocksSight: true },
  { id: 'y_h8', zone: 'yard', kind: 'hedge', x: 27, z: 6, w: 7, d: 2.2, h: 2.4, blocksMove: true, blocksSight: true },
  { id: 'y_f1', zone: 'yard', kind: 'fence', x: -24, z: -2, w: 8, d: 0.6, h: 2.1, blocksMove: true, blocksSight: true },
  { id: 'y_f2', zone: 'yard', kind: 'fence', x: 24, z: -4, w: 8, d: 0.6, h: 2.1, blocksMove: true, blocksSight: true },
  { id: 'y_f3', zone: 'yard', kind: 'fence', x: -9, z: -24, w: 0.6, d: 9, h: 2.1, blocksMove: true, blocksSight: true },
  { id: 'y_f4', zone: 'yard', kind: 'fence', x: 9, z: -24, w: 0.6, d: 9, h: 2.1, blocksMove: true, blocksSight: true },

  // Garden boulders / planters
  { id: 'y_r1', zone: 'yard', kind: 'rock', x: -7, z: 10, w: 2.2, d: 2.2, h: 1.8, blocksMove: true, blocksSight: true },
  { id: 'y_r2', zone: 'yard', kind: 'rock', x: 7, z: -3, w: 2.2, d: 2.2, h: 1.8, blocksMove: true, blocksSight: true },
  { id: 'y_r3', zone: 'yard', kind: 'rock', x: -18, z: 16, w: 2.6, d: 2.2, h: 1.9, blocksMove: true, blocksSight: true },
  { id: 'y_r4', zone: 'yard', kind: 'rock', x: 19, z: 15, w: 2.4, d: 2.4, h: 1.9, blocksMove: true, blocksSight: true },

  // ---------------- YARD STEALTH BUSHES (Walk-in Cover) ----------------
  { id: 'y_b1', zone: 'yard', kind: 'bush', x: -4.5, z: 15, w: 3.2, d: 3.2, h: 1.6, blocksMove: false, blocksSight: false, stealthFactor: 0.4 },
  { id: 'y_b2', zone: 'yard', kind: 'bush', x: 4.5, z: 15, w: 3.2, d: 3.2, h: 1.6, blocksMove: false, blocksSight: false, stealthFactor: 0.4 },
  { id: 'y_b3', zone: 'yard', kind: 'bush', x: -10, z: -1, w: 3.4, d: 3.4, h: 1.7, blocksMove: false, blocksSight: false, stealthFactor: 0.4 },
  { id: 'y_b4', zone: 'yard', kind: 'bush', x: 10, z: 10, w: 3.4, d: 3.4, h: 1.7, blocksMove: false, blocksSight: false, stealthFactor: 0.4 },
  { id: 'y_b5', zone: 'yard', kind: 'bush', x: -20, z: -5, w: 3.6, d: 3.6, h: 1.8, blocksMove: false, blocksSight: false, stealthFactor: 0.38 },
  { id: 'y_b6', zone: 'yard', kind: 'bush', x: 19, z: -7, w: 3.6, d: 3.6, h: 1.8, blocksMove: false, blocksSight: false, stealthFactor: 0.38 },
  { id: 'y_b7', zone: 'yard', kind: 'bush', x: 0, z: -19, w: 4.0, d: 3.6, h: 1.8, blocksMove: false, blocksSight: false, stealthFactor: 0.38 },
  { id: 'y_b8', zone: 'yard', kind: 'bush', x: -29, z: 14, w: 3.4, d: 3.4, h: 1.7, blocksMove: false, blocksSight: false, stealthFactor: 0.4 },
  { id: 'y_b9', zone: 'yard', kind: 'bush', x: 29, z: 13, w: 3.4, d: 3.4, h: 1.7, blocksMove: false, blocksSight: false, stealthFactor: 0.4 },

  // ---------------- DEKU OAK INTERIOR OBSTACLES ----------------
  { id: 'd_p1', zone: 'deku', kind: 'pillar', x: -6, z: 3, w: 2.2, d: 2.2, h: 6, blocksMove: true, blocksSight: true },
  { id: 'd_p2', zone: 'deku', kind: 'pillar', x: 6, z: 3, w: 2.2, d: 2.2, h: 6, blocksMove: true, blocksSight: true },
  { id: 'd_p3', zone: 'deku', kind: 'pillar', x: -6, z: -6, w: 2.2, d: 2.2, h: 6, blocksMove: true, blocksSight: true },
  { id: 'd_p4', zone: 'deku', kind: 'pillar', x: 6, z: -6, w: 2.2, d: 2.2, h: 6, blocksMove: true, blocksSight: true },
  { id: 'd_b1', zone: 'deku', kind: 'bush', x: 0, z: 6, w: 3.2, d: 3.2, h: 1.5, blocksMove: false, blocksSight: false, stealthFactor: 0.42 },
  { id: 'd_b2', zone: 'deku', kind: 'bush', x: -10, z: -1, w: 3.2, d: 3.2, h: 1.5, blocksMove: false, blocksSight: false, stealthFactor: 0.42 },
  { id: 'd_b3', zone: 'deku', kind: 'bush', x: 10, z: -1, w: 3.2, d: 3.2, h: 1.5, blocksMove: false, blocksSight: false, stealthFactor: 0.42 },

  // ---------------- CURSED HOUSE INTERIOR OBSTACLES ----------------
  // Partition walls creating hallways & rooms with doorways
  { id: 'h_w1', zone: 'house', kind: 'wall', x: -8.5, z: 4, w: 11, d: 0.6, h: 4.5, blocksMove: true, blocksSight: true },
  { id: 'h_w2', zone: 'house', kind: 'wall', x: 8.5, z: 4, w: 11, d: 0.6, h: 4.5, blocksMove: true, blocksSight: true },
  { id: 'h_w3', zone: 'house', kind: 'wall', x: -5, z: -7, w: 0.6, d: 9, h: 4.5, blocksMove: true, blocksSight: true },
  { id: 'h_w4', zone: 'house', kind: 'wall', x: 5, z: -7, w: 0.6, d: 9, h: 4.5, blocksMove: true, blocksSight: true },
  { id: 'h_couch', zone: 'house', kind: 'furniture', x: -9.5, z: -2, w: 4.2, d: 1.8, h: 1.4, blocksMove: true, blocksSight: true },
  { id: 'h_table', zone: 'house', kind: 'furniture', x: 9.5, z: -3, w: 3.2, d: 2.2, h: 1.2, blocksMove: true, blocksSight: false },
];

/**
 * Pre-determined patrol routes that players can observe and learn to avoid.
 */
export const PATROL_ROUTES: Record<string, PatrolPoint[]> = {
  // Mowers sweep predictable lawn strips
  yard_mower_west: [
    { x: -20, z: 12, pause: 0.6 },
    { x: -20, z: -6, pause: 0.6 },
    { x: -8, z: -6, pause: 0.6 },
    { x: -8, z: 12, pause: 0.6 },
  ],
  yard_mower_east: [
    { x: 20, z: 12, pause: 0.6 },
    { x: 20, z: -6, pause: 0.6 },
    { x: 8, z: -6, pause: 0.6 },
    { x: 8, z: 12, pause: 0.6 },
  ],
  // Earthworms patrol outer/north loops
  yard_worm_north: [
    { x: -12, z: -15, pause: 0.4 },
    { x: 12, z: -15, pause: 0.4 },
    { x: 12, z: -26, pause: 0.4 },
    { x: -12, z: -26, pause: 0.4 },
  ],
  yard_worm_south: [
    { x: -28, z: 18, pause: 0.4 },
    { x: -10, z: 24, pause: 0.4 },
    { x: 10, z: 24, pause: 0.4 },
    { x: 28, z: 18, pause: 0.4 },
  ],
  // Squirrels patrol near trees/bushes
  yard_squirrel_deku: [
    { x: -16, z: -10, pause: 0.8 },
    { x: -28, z: -10, pause: 0.8 },
    { x: -28, z: -26, pause: 0.8 },
    { x: -14, z: -24, pause: 0.8 },
  ],
  yard_squirrel_house: [
    { x: 15, z: -10, pause: 0.8 },
    { x: 29, z: -10, pause: 0.8 },
    { x: 29, z: -26, pause: 0.8 },
    { x: 14, z: -24, pause: 0.8 },
  ],
  yard_squirrel_mid: [
    { x: -5, z: -2, pause: 0.9 },
    { x: 5, z: -2, pause: 0.9 },
    { x: 5, z: -15, pause: 0.9 },
    { x: -5, z: -15, pause: 0.9 },
  ],

  // Deku Oak interior patrols
  deku_spider_west: [
    { x: -11, z: 7, pause: 0.5 },
    { x: -11, z: -9, pause: 0.5 },
    { x: -2, z: -9, pause: 0.5 },
    { x: -2, z: 7, pause: 0.5 },
  ],
  deku_spider_east: [
    { x: 2, z: 7, pause: 0.5 },
    { x: 11, z: 7, pause: 0.5 },
    { x: 11, z: -9, pause: 0.5 },
    { x: 2, z: -9, pause: 0.5 },
  ],
  deku_cultist: [
    { x: -3, z: -11, pause: 1.0 },
    { x: 3, z: -11, pause: 1.0 },
    { x: 3, z: -1, pause: 1.0 },
    { x: -3, z: -1, pause: 1.0 },
  ],

  // House interior patrols
  house_spider_west: [
    { x: -11, z: 8, pause: 0.5 },
    { x: -11, z: -10, pause: 0.5 },
    { x: -7, z: -10, pause: 0.5 },
    { x: -7, z: 8, pause: 0.5 },
  ],
  house_spider_east: [
    { x: 7, z: 8, pause: 0.5 },
    { x: 11, z: 8, pause: 0.5 },
    { x: 11, z: -10, pause: 0.5 },
    { x: 7, z: -10, pause: 0.5 },
  ],
  house_cultist: [
    { x: -2, z: -11, pause: 1.0 },
    { x: 2, z: -11, pause: 1.0 },
    { x: 2, z: 1, pause: 1.0 },
    { x: -2, z: 1, pause: 1.0 },
  ],
};

export function getZoneObstacles(zone: ZoneId): ObstacleDef[] {
  return WORLD_OBSTACLES.filter((o) => o.zone === zone);
}

/**
 * Push a circle (player or enemy) out of all solid obstacles in the zone.
 */
export function resolveCircleObstacles(
  zone: ZoneId,
  x: number,
  z: number,
  radius: number,
): { x: number; z: number; hit: boolean } {
  let rx = x;
  let rz = z;
  let hit = false;

  for (const obs of WORLD_OBSTACLES) {
    if (obs.zone !== zone || !obs.blocksMove) continue;
    const halfW = obs.w * 0.5;
    const halfD = obs.d * 0.5;
    const minX = obs.x - halfW;
    const maxX = obs.x + halfW;
    const minZ = obs.z - halfD;
    const maxZ = obs.z + halfD;

    const closestX = Math.max(minX, Math.min(maxX, rx));
    const closestZ = Math.max(minZ, Math.min(maxZ, rz));
    const dx = rx - closestX;
    const dz = rz - closestZ;
    const distSq = dx * dx + dz * dz;

    if (distSq < radius * radius) {
      hit = true;
      if (distSq > 1e-6) {
        const dist = Math.sqrt(distSq);
        const push = radius - dist;
        rx += (dx / dist) * push;
        rz += (dz / dist) * push;
      } else {
        // Center is inside AABB: push out along nearest edge
        const leftPen = rx - minX;
        const rightPen = maxX - rx;
        const topPen = rz - minZ;
        const botPen = maxZ - rz;
        const minPen = Math.min(leftPen, rightPen, topPen, botPen);
        if (minPen === leftPen) rx = minX - radius;
        else if (minPen === rightPen) rx = maxX + radius;
        else if (minPen === topPen) rz = minZ - radius;
        else rz = maxZ + radius;
      }
    }
  }

  return { x: rx, z: rz, hit };
}

function segmentIntersectsAABB(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
): boolean {
  let t0 = 0;
  let t1 = 1;
  const dx = bx - ax;
  const dz = bz - az;

  const checks: [number, number][] = [
    [-dx, ax - minX],
    [dx, maxX - ax],
    [-dz, az - minZ],
    [dz, maxZ - az],
  ];

  for (const [p, q] of checks) {
    if (Math.abs(p) < 1e-8) {
      if (q < 0) return false;
    } else {
      const r = q / p;
      if (p < 0) {
        if (r > t1) return false;
        if (r > t0) t0 = r;
      } else {
        if (r < t0) return false;
        if (r < t1) t1 = r;
      }
    }
  }
  return t0 <= t1;
}

/**
 * Returns true if there is an unobstructed line of sight between (ax, az) and (bx, bz).
 */
export function hasLineOfSight(
  zone: ZoneId,
  ax: number,
  az: number,
  bx: number,
  bz: number,
): boolean {
  for (const obs of WORLD_OBSTACLES) {
    if (obs.zone !== zone || !obs.blocksSight) continue;
    const hw = obs.w * 0.5;
    const hd = obs.d * 0.5;
    if (
      segmentIntersectsAABB(
        ax,
        az,
        bx,
        bz,
        obs.x - hw,
        obs.x + hw,
        obs.z - hd,
        obs.z + hd,
      )
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Returns the stealth bush factor at (x, z) (1.0 if in the open, < 1.0 if inside a bush).
 */
export function getBushStealthFactor(zone: ZoneId, x: number, z: number): number {
  let best = 1.0;
  for (const obs of WORLD_OBSTACLES) {
    if (obs.zone !== zone || !obs.stealthFactor) continue;
    if (
      Math.abs(x - obs.x) <= obs.w * 0.5 &&
      Math.abs(z - obs.z) <= obs.d * 0.5
    ) {
      best = Math.min(best, obs.stealthFactor);
    }
  }
  return best;
}

export function getStealthMultiplier(
  zone: ZoneId,
  x: number,
  z: number,
  crouching: boolean,
  flashlightOn: boolean,
): number {
  let mult = getBushStealthFactor(zone, x, z);
  if (crouching) mult *= 0.55;
  if (flashlightOn) mult *= 1.35;
  return mult;
}
