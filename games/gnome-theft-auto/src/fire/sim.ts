// E25 fire system: the pure simulation (no three.js, no DOM). Types and tuning in fire/types.ts.
//
// Usage (see the header of fire/types.ts):
//   const field = createFireField();
//   ignite(field, x, y, z, { r: 0.8, kind: 'bin', fuel: 120 });
//   each frame: const events = stepFires(field, dt, fuel);
//   a hose: douse(field, landX, landZ, 1.6, litres) -> heat taken off.
//
// Pure: the host or each client may run it. Fires grow while burning, burn fuel, catch nearby fuel points
// (FuelPoint.lit once), and go out when water takes their heat down to FIRE.outHeat. Every state change is an event
// returned by stepFires; douse never emits events itself.
import { FIRE } from './types';
import type { Fire, FireEvent, FireField, FuelPoint, IgniteOpts } from './types';

export function createFireField(): FireField {
  return { fires: [], nextId: 1 };
}

/** Light a fire at (x, y, z). Returns it. At FIRE.maxFires the oldest non-burning fire is dropped first, else the oldest. */
export function ignite(field: FireField, x: number, y: number, z: number, opts: IgniteOpts = {}): Fire {
  if (field.fires.length >= FIRE.maxFires) {
    const idx = field.fires.findIndex((f) => f.state !== 'burning');
    field.fires.splice(idx >= 0 ? idx : 0, 1);
  }
  const f: Fire = {
    id: field.nextId++, x, y, z, r: opts.r ?? 0.8, heat: opts.heat ?? FIRE.startHeat, fuel: opts.fuel ?? 120, kind: opts.kind ?? 'generic',
    state: 'burning', since: 0, wet: 0, group: opts.group ?? null,
  };
  field.fires.push(f);
  return f;
}

/**
 * Water lands in a circle (x, z, radius): `litres` split evenly over the burning fires the circle touches. Each gets
 * share * FIRE.douseHeatPerLitre less heat and share * FIRE.wetPerLitre more wet. Non-burning fires in the circle
 * only get the wet. Returns the total heat removed. Going out is decided in stepFires, not here.
 */
export function douse(field: FireField, x: number, z: number, radius: number, litres: number): number {
  const hit = field.fires.filter((f) => Math.hypot(f.x - x, f.z - z) <= f.r + radius);
  const burning = hit.filter((f) => f.state === 'burning');
  const share = burning.length > 0 ? litres / burning.length : 0;
  let removed = 0;
  for (const f of hit) {
    if (f.state === 'burning') {
      const take = Math.min(f.heat, share * FIRE.douseHeatPerLitre);
      f.heat -= take;
      removed += take;
      f.wet = Math.min(1, f.wet + share * FIRE.wetPerLitre);
    } else {
      f.wet = Math.min(1, f.wet + share * FIRE.wetPerLitre);
    }
  }
  return removed;
}

/** Advance every fire by dt seconds; fuel points near hot fires may catch. Returns what happened this step. */
export function stepFires(field: FireField, dt: number, fuel: FuelPoint[] = []): FireEvent[] {
  const events: FireEvent[] = [];

  // 1. Burn, go out, or burn through.
  for (const f of field.fires) {
    if (f.state === 'burning') {
      f.heat = Math.min(1, f.heat + FIRE.growPerS * (1 - f.wet) * dt);
      f.fuel -= f.heat * dt;
      f.wet = Math.max(0, f.wet - FIRE.dryPerS * dt);
      if (f.heat <= FIRE.outHeat) {
        f.state = 'out';
        f.since = 0;
        events.push({ t: 'out', id: f.id });
      } else if (f.fuel <= 0) {
        f.state = 'burnt';
        f.since = 0;
        events.push({ t: 'burnt', id: f.id });
      }
    } else {
      f.since += dt;
    }
  }

  // 2. Smoke clears, then fade out fires that have finished smoking.
  field.fires = field.fires.filter((f) => {
    if (f.state === 'burning' || f.since < FIRE.smokeS) return true;
    events.push({ t: 'gone', id: f.id });
    return false;
  });

  // 3. Spread: fuel points near a hot burning fire build up exposure and catch.
  for (const p of fuel) {
    if (p.lit) continue;
    const near = field.fires.some((f) =>
      f.state === 'burning' && f.heat >= FIRE.spreadHeat &&
      Math.hypot(f.x - p.x, f.z - p.z) <= FIRE.spreadRange + f.r + p.r);
    p.exposure = near ? p.exposure + dt : Math.max(0, p.exposure - dt);
    if (p.exposure >= FIRE.spreadAfterS) {
      p.lit = true;
      const nf = ignite(field, p.x, p.y, p.z, { r: p.r, kind: p.kind, fuel: p.fuel, group: p.group, heat: FIRE.startHeat });
      events.push({ t: 'spread', id: nf.id });
    }
  }
  return events;
}

/** Fires still burning (in `group` when given). */
export function burningCount(field: FireField, group?: string | null): number {
  return field.fires.filter((f) => f.state === 'burning' && (group === undefined || f.group === group)).length;
}

/** The burning fire nearest (x, z), or null. */
export function nearestBurning(field: FireField, x: number, z: number): Fire | null {
  let best: Fire | null = null;
  let bestD = Infinity;
  for (const f of field.fires) {
    if (f.state !== 'burning') continue;
    const d = Math.hypot(f.x - x, f.z - z);
    if (d < bestD) {
      bestD = d;
      best = f;
    }
  }
  return best;
}

/** Remove fires (all, or one group's) at once, no events. */
export function clearFires(field: FireField, group?: string | null): void {
  field.fires = group === undefined ? [] : field.fires.filter((f) => f.group !== group);
}

/** A fuel point ready for stepFires. */
export function fuelPoint(x: number, y: number, z: number, r: number, kind: FuelPoint['kind'], fuel = 90, group: string | null = null): FuelPoint {
  return { x, y, z, r, kind, fuel, group, exposure: 0, lit: false };
}
