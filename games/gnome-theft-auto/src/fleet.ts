// The fleet (fleet-damage workstream): the data-driven table of findable vehicle variants. A variant is a stock vehicle kind
// with its own name, paint, engine note (pitch) and a small tune; parked spots are dealt out from this table at load
// (planParked), and the trainer / debug can spawn any entry by id (spawnFleet). The golf cart is the 'golf-cart' entry.
import type * as THREE from 'three';
import { MOWER_TINTS, VEHICLES } from './config';
import { createVehicle } from './vehicles';
import type { ParkedSpot, Vehicle, VehicleKind } from './types';

export type Rng = () => number;

export interface FleetEntry {
  /** Unique id (kebab-case). The trainer spawns by it. */
  id: string;
  /** The stock vehicle it is built from (config.ts VEHICLES). */
  kind: VehicleKind;
  /** Shown name (becomes v.spec.name). */
  name: string;
  /** Parked spot kinds (world.parked) this entry may take over. */
  replaces: readonly VehicleKind[];
  /** Chance weight against the stock vehicle's weight of 1 for a spot it may take. */
  weight: number;
  /** Paint picked at random; absent = MOWER_TINTS. */
  tints?: readonly number[];
  /** Engine pitch multiplier range [lo, hi]: each spawn rolls its own (Vehicle.enginePitch). */
  pitch: readonly [number, number];
  /** Multipliers on the spec's maxSpeed and accel. Absent = 1. */
  speedMult?: number;
  accelMult?: number;
}

export const FLEET: readonly FleetEntry[] = [
  { id: 'golf-cart', kind: 'golf-cart', name: 'Putting-Green Cart', replaces: ['ride-on', 'push-bike'], weight: 0.15,
    tints: [0xf3efe6, 0x2f6b3a, 0xd8342c, 0x3f7fbf], pitch: [1.25, 1.45] },
  { id: 'ride-on-grumbler', kind: 'ride-on', name: 'Grumbler Ride-On', replaces: ['ride-on'], weight: 0.25,
    pitch: [0.62, 0.75], speedMult: 0.95, accelMult: 1.1 },
  { id: 'ride-on-whine-twin', kind: 'ride-on', name: 'Whine-Twin Ride-On', replaces: ['ride-on'], weight: 0.25,
    pitch: [1.3, 1.5], speedMult: 1.05, accelMult: 0.95 },
  { id: 'push-bike-bumblebuzz', kind: 'push-bike', name: 'Bumblebuzz Push-Bike', replaces: ['push-bike'], weight: 0.3,
    tints: [0xf2c230, 0x222222], pitch: [1.4, 1.7], speedMult: 1.05 },
  { id: 'zero-turn-howler', kind: 'zero-turn', name: 'Howler Zero-Turn', replaces: ['zero-turn'], weight: 0.3,
    pitch: [1.15, 1.35], speedMult: 1.06 },
  { id: 'zero-turn-thumper', kind: 'zero-turn', name: 'Thumper Zero-Turn', replaces: ['zero-turn'], weight: 0.3,
    pitch: [0.65, 0.8], accelMult: 1.1 },
];

/** The entry with this id, or undefined. */
export function fleetEntry(id: string): FleetEntry | undefined {
  return FLEET.find((e) => e.id === id);
}

export interface ParkedPlan {
  spot: ParkedSpot;
  /** The variant to spawn there, or null for the stock vehicle of spot.kind. */
  entry: FleetEntry | null;
  /** Paint for createVehicle. */
  tint: number;
}

/** Paint for an entry (its own tints, else the mower palette). */
function pickTint(e: FleetEntry | null, rng: Rng): number {
  const list: readonly number[] = e?.tints ?? MOWER_TINTS;
  const idx = Math.min(list.length - 1, Math.floor(rng() * list.length));
  return list[idx];
}

/** Deal variants out over the parked spots. */
export function planParked(spots: readonly ParkedSpot[], near: { x: number; z: number }, rng: Rng = Math.random): ParkedPlan[] {
  const plans: ParkedPlan[] = spots.map((spot) => {
    const candidates = FLEET.filter((e) => e.replaces.includes(spot.kind));
    const total = 1 + candidates.reduce((sum, e) => sum + e.weight, 0);
    const r = rng() * total;
    let entry: FleetEntry | null = null;
    if (r >= 1) {
      let acc = 1;
      for (const e of candidates) {
        acc += e.weight;
        if (r < acc) { entry = e; break; }
      }
    }
    return { spot, entry, tint: pickTint(entry, rng) };
  });

  // Guarantee: the ride-on / push-bike spot nearest `near` is the golf cart.
  const golf = fleetEntry('golf-cart');
  let best = -1;
  let bestDist = Infinity;
  spots.forEach((spot, i) => {
    if (spot.kind !== 'ride-on' && spot.kind !== 'push-bike') return;
    const d = Math.hypot(spot.x - near.x, spot.z - near.z);
    if (d < bestDist) { bestDist = d; best = i; }
  });
  if (golf && best >= 0) {
    plans[best] = { spot: spots[best], entry: golf, tint: pickTint(golf, rng) };
  }
  return plans;
}

/** What clearOfRoads needs to know about the world. */
export interface SpotChecks {
  /** True on a driven road surface (surfaces.ts surfaceAt(...).kind === 'asphalt'). */
  onRoad(x: number, z: number): boolean;
  /** True where a land vehicle cannot stand: inside a building box, or in water. */
  blocked(x: number, z: number): boolean;
}

/** How far around a vehicle's centre must be off the road (a parked body must not hang into a lane). */
export const PARK_CLEAR = 1.8;
/** Search rings for a nearby off-road spot (metres) and directions per ring. */
const NUDGE_RINGS = [2, 3, 4, 5, 6, 8, 10, 12, 15];
const NUDGE_DIRS = 16;

/** True when a parked vehicle centred at (x, z) would touch the road or a blocked spot. */
function spotBad(x: number, z: number, c: SpotChecks): boolean {
  if (c.onRoad(x, z) || c.blocked(x, z)) return true;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const px = x + Math.sin(a) * PARK_CLEAR;
    const pz = z + Math.cos(a) * PARK_CLEAR;
    if (c.onRoad(px, pz) || c.blocked(px, pz)) return true;
  }
  return false;
}

/**
 * Parked land vehicles never stand on a road: a spot on (or hanging into) the road moves to the nearest clear spot off it
 * (rings out to 15 m, kept 6 m from the other spots), or is dropped when there is none. Boats keep their moorings.
 */
export function clearOfRoads(spots: readonly ParkedSpot[], c: SpotChecks): ParkedSpot[] {
  const out: ParkedSpot[] = [];
  for (const s of spots) {
    const apart = (x: number, z: number): boolean =>
      out.every((q) => Math.hypot(q.x - x, q.z - z) >= 6) && spots.every((q) => q === s || Math.hypot(q.x - x, q.z - z) >= 6);
    if (VEHICLES[s.kind]?.boat || !spotBad(s.x, s.z, c)) { out.push(s); continue; }
    let moved: ParkedSpot | null = null;
    for (const r of NUDGE_RINGS) {
      for (let i = 0; i < NUDGE_DIRS && !moved; i++) {
        const a = (i / NUDGE_DIRS) * Math.PI * 2;
        const x = s.x + Math.sin(a) * r;
        const z = s.z + Math.cos(a) * r;
        if (!spotBad(x, z, c) && apart(x, z)) moved = { ...s, x, z };
      }
      if (moved) break;
    }
    if (moved) out.push(moved);
  }
  return out;
}

/** Make v (built from e.kind) into variant e. */
export function applyVariant(v: Vehicle, e: FleetEntry, rng: Rng = Math.random): void {
  v.variant = e.id;
  v.spec = {
    ...v.spec,
    name: e.name,
    maxSpeed: v.spec.maxSpeed * (e.speedMult ?? 1),
    accel: v.spec.accel * (e.accelMult ?? 1),
  };
  v.enginePitch = e.pitch[0] + (e.pitch[1] - e.pitch[0]) * rng();
}

/** Spawn entry `id` (a FleetEntry id, or a plain VehicleKind) at (x, z, yaw), added to the scene. Null for an unknown id. */
export function spawnFleet(scene: THREE.Scene, id: string, x: number, z: number, yaw: number, rng: Rng = Math.random): Vehicle | null {
  const e = fleetEntry(id);
  if (e) {
    const v = createVehicle(scene, e.kind, x, z, yaw, pickTint(e, rng));
    applyVariant(v, e, rng);
    return v;
  }
  if (id in VEHICLES) {
    return createVehicle(scene, id as VehicleKind, x, z, yaw, MOWER_TINTS[Math.floor(rng() * MOWER_TINTS.length)]);
  }
  return null;
}
