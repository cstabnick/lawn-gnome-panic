// Where a stationary vehicle may stand (fleet-damage workstream): never on a sidewalk (the paved strip beside every city
// street, world.ts SIDE_OFF / SIDEWALK_WIDTH), never in a driving lane or on a road centre, never in a building or in
// water. Legal: the parking strip at the asphalt edge outside the lanes (only a vehicle narrow enough fits: the 10 m
// streets have lanes at +-LANE_OFFSET, so most mowers do not), driveways, lots and open ground.
//
// parkingLegal tests a vehicle's whole footprint (its prefab's bounding rectangle at its yaw), nearestLegalSpot finds the
// closest legal pose to a wanted one (a parking-strip slot alongside first, with the yaw on the road tangent, then rings
// of open ground), and circleClearOfStreets is the same street rule for a circle (the Sling-Lift's drop spots).
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { CITY_HALF, HIGHWAYS, LANE_OFFSET, ROAD_LINES, ROAD_WIDTH, SIDEWALK_WIDTH, VEHICLES } from './config';
import type { VehicleKind } from './types';

const HALF_ROAD = ROAD_WIDTH / 2;
/** Half the width a moving vehicle takes in its lane: the widest traffic mower (ride-on / lowrider) is 2.2 m across. */
export const TRAFFIC_HALF_WIDTH = 1.1;
/** Closer than this to a road centre line is a driving lane (lane centre + a traffic vehicle's half width). */
export const LANE_EDGE = LANE_OFFSET + TRAFFIC_HALF_WIDTH;
/** A parked vehicle in the parking strip keeps this gap to the road edge. */
const KERB_GAP = 0.05;

/** What the world says about a ground point beyond the street layout. */
export interface ParkingGround {
  /** Inside a building box or in water. */
  blocked(x: number, z: number): boolean;
  /** True on any asphalt (surfaces.ts): roads, the runway, the race track. Optional: absent = streets only. */
  onAsphalt?(x: number, z: number): boolean;
}

/** On a city sidewalk: the strip from the road edge out SIDEWALK_WIDTH on both sides of every grid street (corners too). */
export function onSidewalk(x: number, z: number): boolean {
  const lo = HALF_ROAD;
  const hi = HALF_ROAD + SIDEWALK_WIDTH;
  for (const v of ROAD_LINES) {
    if (Math.abs(z) <= CITY_HALF) {
      const d = Math.abs(x - v);
      if (d >= lo && d <= hi) return true;
    }
    if (Math.abs(x) <= CITY_HALF) {
      const d = Math.abs(z - v);
      if (d >= lo && d <= hi) return true;
    }
  }
  return false;
}

/** The nearest road centre line: distance, unit tangent (tx, tz) and the unit normal from the line towards (x, z). */
export interface NearRoad { d: number; tx: number; tz: number; nx: number; nz: number; px: number; pz: number }

export function nearestRoad(x: number, z: number): NearRoad {
  let best: NearRoad = { d: Infinity, tx: 1, tz: 0, nx: 0, nz: 1, px: x, pz: z };
  const consider = (ax: number, az: number, bx: number, bz: number): void => {
    const vx = bx - ax, vz = bz - az;
    const l2 = vx * vx + vz * vz;
    if (l2 < 1e-9) return;
    const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / l2));
    const px = ax + vx * t, pz = az + vz * t;
    const d = Math.hypot(x - px, z - pz);
    if (d >= best.d) return;
    const l = Math.sqrt(l2);
    const tx = vx / l, tz = vz / l;
    // Normal: towards the point, or the left of the tangent when on the line.
    let nx = -tz, nz = tx;
    if (d > 1e-6) { nx = (x - px) / d; nz = (z - pz) / d; }
    best = { d, tx, tz, nx, nz, px, pz };
  };
  for (const h of HIGHWAYS) {
    for (let i = 0; i + 1 < h.points.length; i++) consider(h.points[i][0], h.points[i][1], h.points[i + 1][0], h.points[i + 1][1]);
  }
  for (const v of ROAD_LINES) {
    consider(v, -CITY_HALF, v, CITY_HALF);
    consider(-CITY_HALF, v, CITY_HALF, v);
  }
  return best;
}

/** In a driving lane (or on the centre line) of a city street or highway. */
export function inDrivingLane(x: number, z: number): boolean {
  return nearestRoad(x, z).d < LANE_EDGE;
}

/** A vehicle's ground rectangle in its own frame: half width, and how far it reaches forward and back of its origin. */
export interface Footprint { hw: number; front: number; back: number }

const footprints = new Map<VehicleKind, Footprint>();

/** The footprint of `kind`, from its prefab's bounding box at the spec scale (cached). Falls back to the collision radius. */
export function footprintOf(kind: VehicleKind): Footprint {
  const hit = footprints.get(kind);
  if (hit) return hit;
  const spec = VEHICLES[kind];
  let fp: Footprint = { hw: spec.radius, front: spec.radius, back: spec.radius };
  try {
    const b = new THREE.Box3().setFromObject(buildPrefab(spec.prefab, { scale: spec.scale }));
    if (Number.isFinite(b.min.x) && Number.isFinite(b.max.z)) {
      fp = { hw: Math.max(-b.min.x, b.max.x), front: Math.max(0, b.max.z), back: Math.max(0, -b.min.z) };
    }
  } catch { /* unknown prefab: keep the radius */ }
  footprints.set(kind, fp);
  return fp;
}

/** Sample points of a footprint at (x, z, yaw): the four corners, the edge midpoints and the centre. */
export function footprintPoints(fp: Footprint, x: number, z: number, yaw: number): [number, number][] {
  const fx = Math.sin(yaw), fz = Math.cos(yaw);
  // Right of forward: (cos yaw, -sin yaw) is +x in the vehicle frame (types.ts: forward = (sin yaw, cos yaw)).
  const rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const pts: [number, number][] = [];
  for (const a of [fp.front, (fp.front - fp.back) / 2, -fp.back]) {
    for (const s of [-fp.hw, 0, fp.hw]) pts.push([x + fx * a + rx * s, z + fz * a + rz * s]);
  }
  return pts;
}

/** One ground point a parked vehicle may cover. */
function pointLegal(x: number, z: number, g: ParkingGround, asphaltOk: boolean): boolean {
  if (onSidewalk(x, z) || g.blocked(x, z)) return false;
  const near = nearestRoad(x, z);
  if (near.d < LANE_EDGE) return false;
  // Asphalt is only for parking in the strip between the lanes and the road edge (the runway and the track are not).
  if (!asphaltOk && near.d > HALF_ROAD && g.onAsphalt?.(x, z)) return false;
  return true;
}

/** True when a `kind` standing at (x, z, yaw) covers no sidewalk, driving lane, building or water. Boats are always legal (they moor). */
export function parkingLegal(kind: VehicleKind, x: number, z: number, yaw: number, g: ParkingGround): boolean {
  const spec = VEHICLES[kind];
  if (spec.boat) return true;
  // Aircraft stand on the apron and the runway edge: any asphalt off the roads is fine for them.
  const asphaltOk = !!spec.flies;
  return footprintPoints(footprintOf(kind), x, z, yaw).every(([px, pz]) => pointLegal(px, pz, g, asphaltOk));
}

/** The street rule for a circle (no yaw yet): no point of it on a sidewalk or in a driving lane. */
export function circleClearOfStreets(x: number, z: number, r: number): boolean {
  if (onSidewalk(x, z) || inDrivingLane(x, z)) return false;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const px = x + Math.sin(a) * r, pz = z + Math.cos(a) * r;
    if (onSidewalk(px, pz) || inDrivingLane(px, pz)) return false;
  }
  return true;
}

export interface Pose { x: number; z: number; yaw: number }

/** The road-tangent yaw nearest `yaw` (a yaw along (tx, tz), facing whichever way is closer). */
function alignedYaw(tx: number, tz: number, yaw: number): number {
  const a = Math.atan2(tx, tz);
  const b = a + Math.PI;
  const diff = (u: number) => Math.abs(Math.atan2(Math.sin(u - yaw), Math.cos(u - yaw)));
  return diff(a) <= diff(b) ? a : b;
}

const RING_STEP = 1.5;
const RING_DIRS = 24;

/**
 * The legal pose nearest the wanted one, or null within maxDist. Order: the pose itself; the parking strip on the same
 * side of the nearest road, sliding along it up to maxDist, yaw on the road tangent; then rings of open ground (tried at
 * the road-aligned yaw, the wanted yaw and square to it). `taken` (optional) rejects poses too close to others.
 */
export function nearestLegalSpot(
  kind: VehicleKind, x: number, z: number, yaw: number, g: ParkingGround,
  maxDist = 40, taken: (x: number, z: number) => boolean = () => false,
): Pose | null {
  const ok = (p: Pose): boolean => !taken(p.x, p.z) && parkingLegal(kind, p.x, p.z, p.yaw, g);
  const here = { x, z, yaw };
  if (ok(here)) return here;

  const near = nearestRoad(x, z);
  const fp = footprintOf(kind);
  const ay = alignedYaw(near.tx, near.tz, yaw);
  // The parking strip: centred HALF_ROAD - hw - KERB_GAP from the centre line. Only worth trying when it clears the lanes.
  const stripD = HALF_ROAD - fp.hw - KERB_GAP;
  if (near.d < HALF_ROAD + SIDEWALK_WIDTH + 4 && stripD - fp.hw >= LANE_EDGE) {
    for (let s = 0; s <= maxDist; s += RING_STEP) {
      for (const sign of s === 0 ? [1] : [1, -1]) {
        const p = {
          x: near.px + near.nx * stripD + near.tx * s * sign,
          z: near.pz + near.nz * stripD + near.tz * s * sign,
          yaw: ay,
        };
        if (ok(p)) return p;
      }
    }
  }

  for (let r = RING_STEP; r <= maxDist + 1e-9; r += RING_STEP) {
    const dirs = Math.max(RING_DIRS, Math.round((2 * Math.PI * r) / 2));
    for (let i = 0; i < dirs; i++) {
      const a = (i / dirs) * Math.PI * 2;
      const px = x + Math.sin(a) * r, pz = z + Math.cos(a) * r;
      const here2 = nearestRoad(px, pz);
      const yaws = [alignedYaw(here2.tx, here2.tz, yaw), yaw, yaw + Math.PI / 2];
      for (const yy of yaws) {
        const p = { x: px, z: pz, yaw: yy };
        if (ok(p)) return p;
      }
    }
  }
  return null;
}
