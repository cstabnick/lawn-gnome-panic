// Item boxes, picking up, using items, acorns in flight. Pure functions of plain data: no three.js, no DOM, no
// Math.random (randomness comes from itemRoll below). Does not import from './sim' (sim imports this module).
import { ITEMS, VEHICLES, type Acorn, type KartInput, type KartState, type RaceState } from './config';
import { headingOf, pointAt, type Track } from './track';

/** Item box positions, in the order of RaceState.boxes: each row in course.boxRows, ITEMS.boxesPerRow across. */
export function boxSpots(track: Track): { x: number; z: number }[] {
  const out: { x: number; z: number }[] = [];
  const n = ITEMS.boxesPerRow;
  for (const f of track.course.boxRows) {
    const p = pointAt(track, f * track.length);
    for (let i = 0; i < n; i++) {
      // Spread across the track, inside the edges: offsets from +w/2 to -w/2 with a margin of 1.2 m.
      const off = (track.width / 2 - 1.2) * (1 - (2 * i) / (n - 1));
      out.push({ x: p.x + p.tz * off, z: p.z - p.tx * off });
    }
  }
  return out;
}

/** Deterministic 0..1 "random" number from a race time and a kart/box index (no rng is passed to the sim). */
export function itemRoll(t: number, a: number, b: number): number {
  let h = (Math.floor(t * 600) * 374761393 + a * 668265263 + b * 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296;
}

/** One step of items: box pickups and respawns, item use on a fresh press of input.item, acorns flying and hitting.
 *  Called by stepRace after the karts moved. Returns events for sound/HUD. */
export function stepItems(race: RaceState, track: Track, inputs: readonly (KartInput | null)[], dt: number): ItemEvents {
  const events: ItemEvents = { picked: [], used: [], hits: [] };
  const spots = boxSpots(track);

  race.karts.forEach((k, i) => {
    const input = inputs[i] ?? null;
    const press = !!input?.item && !k.ih;
    k.ih = !!input?.item;

    // Pickup.
    if (k.item === null && k.fin === null && k.spin <= 0) {
      for (let j = 0; j < spots.length; j++) {
        const spot = spots[j];
        if (race.boxes[j] > race.t) continue;
        if (Math.hypot(k.x - spot.x, k.z - spot.z) >= ITEMS.pickupRadius + VEHICLES[k.vehicle].radius) continue;
        race.boxes[j] = race.t + ITEMS.boxRespawnS;
        const place = race.karts.filter((other) => aheadOf(other, k)).length;
        const roll = itemRoll(race.t, i, j);
        k.item = roll < ITEMS.acornChanceByPlace[Math.min(place, 3)] ? 'acorn' : 'boost';
        events.picked.push(i);
        break;
      }
    }

    // Use.
    if (press && k.item !== null && k.spin <= 0 && k.fin === null) {
      if (k.item === 'boost') {
        k.boost = Math.max(k.boost, ITEMS.boostS);
        k.item = null;
        events.used.push(i);
      } else if (race.acorns.length < ITEMS.maxAcorns) {
        throwAcorn(race, k, i);
        k.item = null;
        events.used.push(i);
      }
    }
  });

  // Acorns: move, expire, hit.
  const bounds = track.course.bounds;
  race.acorns = race.acorns.filter((a) => {
    a.x = round3(a.x + a.vx * dt);
    a.z = round3(a.z + a.vz * dt);
    a.vx = round3(a.vx);
    a.vz = round3(a.vz);
    a.t = round3(a.t - dt);
    if (a.t <= 0) return false;
    if (a.x < bounds.minX || a.x > bounds.maxX || a.z < bounds.minZ || a.z > bounds.maxZ) return false;
    return !hitKart(race, a, events);
  });

  return events;
}

/** Spawns an acorn ahead of kart k (index i), with the kart's forward speed added to the launch speed. */
function throwAcorn(race: RaceState, k: KartState, i: number): void {
  const fwdX = Math.sin(k.h), fwdZ = Math.cos(k.h);
  const vF = Math.max(0, k.vx * fwdX + k.vz * fwdZ);
  const d = VEHICLES[k.vehicle].radius + 0.7;
  const speed = ITEMS.acornSpeed + vF;
  race.acorns.push({
    x: round3(k.x + fwdX * d),
    z: round3(k.z + fwdZ * d),
    vx: round3(fwdX * speed),
    vz: round3(fwdZ * speed),
    o: i,
    t: ITEMS.acornLifeS,
  });
}

/** Applies a hit if acorn a touches a kart other than its thrower. Returns true when the acorn was used up. */
function hitKart(race: RaceState, a: Acorn, events: ItemEvents): boolean {
  for (let j = 0; j < race.karts.length; j++) {
    if (j === a.o) continue;
    const kart = race.karts[j];
    if (kart.spin > 0) continue;
    if (Math.hypot(a.x - kart.x, a.z - kart.z) >= ITEMS.acornRadius + VEHICLES[kart.vehicle].radius) continue;
    kart.spin = ITEMS.acornSpinS;
    kart.vx *= 0.3;
    kart.vz *= 0.3;
    kart.drift = 0;
    kart.charge = 0;
    events.hits.push(j);
    return true;
  }
  return false;
}

export interface ItemEvents {
  /** Kart indices that picked up an item this step. */
  picked: number[];
  /** Kart indices that used their item this step. */
  used: number[];
  /** Kart indices hit by an acorn this step. */
  hits: number[];
}

/** Should CPU kart i press the item button this step? */
export function cpuItemUse(race: RaceState, track: Track, index: number): boolean {
  const k = race.karts[index];
  if (k.item === null || k.spin > 0 || k.fin !== null) return false;
  if (k.item === 'boost') {
    if (k.off) return false;
    const a0 = pointAt(track, k.s);
    const a1 = pointAt(track, k.s + 25);
    return Math.abs(wrapAngle(headingOf(a1.tx, a1.tz) - headingOf(a0.tx, a0.tz))) < 0.35;
  }
  // Acorn: another unfinished kart just ahead, close to the forward line.
  const fwdX = Math.sin(k.h), fwdZ = Math.cos(k.h);
  return race.karts.some((j, jIndex) => {
    if (jIndex === index || j.fin !== null) return false;
    const dx = j.x - k.x, dz = j.z - k.z;
    const along = dx * fwdX + dz * fwdZ;
    const across = dx * fwdZ - dz * fwdX;
    return along > 2 && along < 30 && Math.abs(across) < 2.5;
  });
}

/** True when kart b is strictly ahead of kart a (same rule as sim.ts racePlaces). */
function aheadOf(b: KartState, a: KartState): boolean {
  if (b.fin !== null && a.fin !== null) return b.fin < a.fin;
  if (b.fin !== null) return true;
  if (a.fin !== null) return false;
  return b.dist > a.dist;
}

/** Wraps an angle into -PI..PI. */
function wrapAngle(a: number): number {
  let r = (a + Math.PI) % (2 * Math.PI);
  if (r < 0) r += 2 * Math.PI;
  return r - Math.PI;
}

function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}
