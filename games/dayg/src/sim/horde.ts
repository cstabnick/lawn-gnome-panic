// The Hatless as a density field over the regions plus herd tokens (issue 1.3).
// Pure TypeScript: all randomness from `rng`, all counts integers (rng.round for every fractional flow).
import type { Rng } from './rng';
import type { Herd, RegionDef, RegionId, WorldState } from './types';
import { endOfDay, npcsIn } from './world';
import { rectArea } from './regions';

const has = (def: RegionDef, trait: RegionDef['traits'][number]): boolean => def.traits.includes(trait);

export function seedHorde(w: WorldState, rng: Rng): void {
  for (const r of w.graph.regions) {
    w.horde.density[r.id] = rng.int(r.startHatless[0], r.startHatless[1]);
    w.horde.noise[r.id] = 0;
  }
  w.horde.herds = [];
}

/** Attraction of each region for the Hatless. */
function potentials(w: WorldState): Record<RegionId, number> {
  const t = w.tuning.horde;
  const p = {} as Record<RegionId, number>;
  for (const def of w.graph.regions) {
    p[def.id] = t.warmWeight * (has(def, 'WARM') ? 1 : 0)
      + t.scentWeight * npcsIn(w, def.id).length
      + t.noiseWeight * (w.horde.noise[def.id] ?? 0)
      + (has(def, 'NEST') ? t.nestWeight : 0)
      + (has(def, 'PIT') ? t.pitWeight : 0)
      - (has(def, 'HAVEN') ? t.havenRepel : 0)
      - (has(def, 'HIGH') ? t.havenRepel : 0);
  }
  return p;
}

/** Walkable (no climb) neighbour with the highest potential; null when there is none. */
function bestTarget(w: WorldState, r: RegionId, p: Record<RegionId, number>): RegionId | null {
  let best: RegionId | null = null;
  for (const n of w.graph.neighbours[r]) {
    if (n.climb) continue;
    if (best === null || p[n.to] > p[best]) best = n.to;
  }
  return best;
}

export function stepHorde(w: WorldState, rng: Rng): void {
  const t = w.tuning.horde;
  const h = w.horde;
  const promoted = w.promoted.region;
  const p = potentials(w);

  // 3. Flow from a snapshot, applied afterwards.
  const snap = { ...h.density };
  const delta = {} as Record<RegionId, number>;
  for (const def of w.graph.regions) delta[def.id] = 0;
  for (const def of w.graph.regions) {
    const r = def.id;
    if (r === promoted) continue;
    const walk = w.graph.neighbours[r].filter((n) => !n.climb);
    if (walk.length === 0) continue;
    const escape = has(def, 'PIT') ? t.pitEscape : 1;
    let left = snap[r] ?? 0;
    for (const n of walk) {
      if (left <= 0) break;
      const d = p[n.to] - p[r];
      const out = (snap[r] ?? 0) * (t.flowRate * Math.max(0, d) / (1 + Math.abs(d)) + t.diffusion / walk.length) * escape;
      const amount = Math.min(left, rng.round(out));
      if (amount <= 0) continue;
      left -= amount;
      delta[r] -= amount;
      delta[n.to] += amount;
    }
  }
  for (const def of w.graph.regions) h.density[def.id] = (h.density[def.id] ?? 0) + delta[def.id];

  // 4. Noise decays.
  for (const def of w.graph.regions) h.noise[def.id] = (h.noise[def.id] ?? 0) * (1 - t.noiseDecay);

  // 5. Herds: form.
  for (const def of w.graph.regions) {
    const r = def.id;
    if (r === promoted || has(def, 'PIT')) continue;
    const d = h.density[r];
    if (d <= t.herdThreshold) continue;
    const size = Math.min(d, Math.max(t.herdMin, rng.round(d * t.herdShare)));
    if (size <= 0) continue;
    h.density[r] -= size;
    const herd: Herd = { id: w.nextId.herd++, region: r, size, target: bestTarget(w, r, p), movedTick: w.tick };
    h.herds.push(herd);
    w.events.push({ kind: 'herd-formed', herd: herd.id, region: r, size });
  }

  // 5. Herds: move, dissolve, merge.
  const kept: Herd[] = [];
  for (const herd of h.herds) {
    if (herd.region !== promoted && herd.target !== null && w.tick - herd.movedTick >= t.herdMoveTicks) {
      const from = herd.region;
      herd.region = herd.target;
      herd.movedTick = w.tick;
      w.events.push({ kind: 'herd-moved', herd: herd.id, from, to: herd.region, size: herd.size });
      herd.target = bestTarget(w, herd.region, p);
    }
    const def = w.graph.byId[herd.region];
    if (herd.size < t.herdMin || has(def, 'PIT') || has(def, 'NEST')) {
      h.density[herd.region] += herd.size;
      continue;
    }
    kept.push(herd);
  }
  kept.sort((a, b) => a.id - b.id);
  const byRegion = new Map<RegionId, Herd>();
  const merged: Herd[] = [];
  for (const herd of kept) {
    const older = byRegion.get(herd.region);
    if (older) { older.size += herd.size; continue; }
    byRegion.set(herd.region, herd);
    merged.push(herd);
  }
  h.herds = merged;

  // 6. Crumbling, once per world-day.
  if (endOfDay(w)) {
    const crumbleOf = (n: number, capacity: number): number =>
      Math.min(n, Math.max(0, rng.round(n * t.crumblePerDay * (n > capacity ? t.overCapacityMul : 1))));
    for (const def of w.graph.regions) {
      const r = def.id;
      if (r === promoted) continue;
      const capacity = t.capacityPerKm2 * rectArea(def.rect) / 1e6;
      const c = crumbleOf(h.density[r], capacity);
      h.density[r] -= c;
      w.ledger.hatlessCrumbled += c;
    }
    const survivors: Herd[] = [];
    for (const herd of h.herds) {
      if (herd.region !== promoted) {
        const capacity = t.capacityPerKm2 * rectArea(w.graph.byId[herd.region].rect) / 1e6;
        const c = crumbleOf(herd.size, capacity);
        herd.size -= c;
        w.ledger.hatlessCrumbled += c;
      }
      if (herd.size < t.herdMin) h.density[herd.region] += herd.size;
      else survivors.push(herd);
    }
    h.herds = survivors;
  }
}

export function hatlessInRegion(w: WorldState, r: RegionId): number {
  let n = w.horde.density[r] ?? 0;
  for (const herd of w.horde.herds) if (herd.region === r) n += herd.size;
  if (w.promoted.region === r) n += w.promoted.hatless;
  return n;
}

export function hatlessThreat(w: WorldState, r: RegionId): number {
  const def = w.graph.byId[r];
  let threat = hatlessInRegion(w, r) / (rectArea(def.rect) / 10000) / w.tuning.horde.threatNorm;
  if (has(def, 'HAVEN')) threat *= 0.1;
  if (has(def, 'HIGH')) threat *= 0.3;
  return threat;
}

export function addNoise(w: WorldState, r: RegionId, amount: number): void {
  w.horde.noise[r] = (w.horde.noise[r] ?? 0) + amount;
}
