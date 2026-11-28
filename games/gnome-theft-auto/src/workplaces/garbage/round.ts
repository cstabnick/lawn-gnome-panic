// E25 garbage: plan a bin round along Turfton's streets from the road graph. Pure (no three.js, no DOM).
import type { RoadGraph, RoadNode } from '../../types';
import { BIN_TINTS, GARBAGE } from './types';
import type { BinRound, BinStop } from './types';

export interface RoundOpts {
  /** Career level 1..6. */
  level: number;
  seed: number;
  /** Start the walk at the city road node nearest this point (the depot gate, or the lorry). */
  from: { x: number; z: number };
  /** False when a bin of radius r cannot stand at (x, z) (a building, water, a wall). */
  clear(x: number, z: number, r: number): boolean;
}

const STREETS = [
  'Kerb Row', 'Fern Row', 'Trowel Lane', 'Moss Street', 'Saucer Court Road',
  'Pebble Walk', 'Lid Lane', 'Hosepipe Close', 'Bulb Street', 'Clay Street',
];
/** Max walked nodes before the round stops looking for more streets. */
const MAX_STEPS = 80;
/** Bins closer than this are the same bin. */
const MIN_BIN_GAP = 10;
/** Skip this far from each end of a segment (near crossings). */
const END_MARGIN = 6;
/** A turn sharper than this (radians) starts a new street name. */
const STRAIGHT = 0.2;

/** Seeded RNG (mulberry32). */
function rngFrom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A node the bin round may use: ground, not a roundabout, inside the city grid. */
function isCandidate(n: RoadNode): boolean {
  return !n.deck && !n.ring && Math.abs(n.x) <= GARBAGE.cityHalf && Math.abs(n.z) <= GARBAGE.cityHalf;
}

export function makeRound(roads: RoadGraph, opts: RoundOpts): BinRound {
  const rng = rngFrom(opts.seed);
  const byId = new Map<number, RoadNode>();
  for (const n of roads.nodes) byId.set(n.id, n);

  // Candidate nodes with at least one link to another candidate.
  const cand = new Set<number>();
  for (const n of roads.nodes) if (isCandidate(n)) cand.add(n.id);
  for (const id of [...cand]) {
    const n = byId.get(id)!;
    if (!n.links.some((l) => cand.has(l))) cand.delete(id);
  }
  if (cand.size === 0) return { stops: [], seed: opts.seed, title: 'Bin round' };

  // Start at the candidate nearest the requested point.
  let start = -1;
  let best = Infinity;
  for (const id of cand) {
    const n = byId.get(id)!;
    const d = (n.x - opts.from.x) ** 2 + (n.z - opts.from.z) ** 2;
    if (d < best || (d === best && id < start)) { best = d; start = id; }
  }

  const count = Math.max(GARBAGE.binsMin, Math.min(GARBAGE.binsMax,
    GARBAGE.binsMin + opts.level + Math.floor(rng() * 3)));
  const pHeavy = 0.15 + 0.05 * opts.level;

  const stops: BinStop[] = [];
  const streetOf: string[] = [];
  const usedSeg = new Set<string>();
  let street = STREETS[Math.floor(rng() * STREETS.length)];
  let cur = start;
  let prev = -1;
  let dir: { x: number; z: number } | null = null;

  const placeOnSegment = (a: RoadNode, b: RoadNode, d: { x: number; z: number }) => {
    const r = { x: -d.z, z: d.x };
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    for (let t = END_MARGIN; t <= len - END_MARGIN && stops.length < count; t += GARBAGE.binGap) {
      const x = a.x + d.x * t + r.x * GARBAGE.kerbOffset;
      const z = a.z + d.z * t + r.z * GARBAGE.kerbOffset;
      if (!opts.clear(x, z, 0.5)) continue;
      if (stops.some((s) => Math.hypot(s.x - x, s.z - z) < MIN_BIN_GAP)) continue;
      const heavy = rng() < pHeavy;
      const tint = BIN_TINTS[Math.floor(rng() * BIN_TINTS.length)];
      stops.push({
        id: stops.length, x, z,
        // Face the road centre: from the bin toward the road is -r.
        yaw: Math.atan2(-r.x, -r.z),
        street, tint, heavy, state: 'full',
      });
      streetOf.push(street);
    }
  };

  for (let step = 0; step < MAX_STEPS && stops.length < count; step++) {
    const c = byId.get(cur)!;
    const blocked = new Set(c.noDrive ?? []);
    const options: { id: number; d: { x: number; z: number }; turn: number }[] = [];
    for (const l of c.links) {
      if (l === prev || !cand.has(l) || blocked.has(l)) continue;
      const n = byId.get(l)!;
      const len = Math.hypot(n.x - c.x, n.z - c.z);
      if (len === 0 || usedSeg.has(segKey(cur, l))) continue;
      const d = { x: (n.x - c.x) / len, z: (n.z - c.z) / len };
      const turn = dir ? Math.acos(Math.max(-1, Math.min(1, dir.x * d.x + dir.z * d.z))) : 0;
      options.push({ id: l, d, turn });
    }
    if (options.length === 0) break;
    options.sort((p, q) => p.turn - q.turn || p.id - q.id);
    // Straight on most of the time; a seeded 30% chance of the next-straightest option (a turn).
    const pick = options.length > 1 && rng() < 0.3 ? options[1] : options[0];
    if (dir && pick.turn > STRAIGHT) street = STREETS[Math.floor(rng() * STREETS.length)];

    usedSeg.add(segKey(cur, pick.id));
    const a = c;
    const b = byId.get(pick.id)!;
    placeOnSegment(a, b, pick.d);
    dir = pick.d;
    prev = cur;
    cur = pick.id;
  }

  stops.forEach((s, i) => { s.id = i; });
  const first = streetOf[0];
  const last = streetOf[streetOf.length - 1];
  const title = stops.length === 0 ? 'Bin round'
    : first === last ? `Bin round: ${first}`
    : `Bin round: ${first} and ${last}`;
  return { stops, seed: opts.seed, title };
}

function segKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}
