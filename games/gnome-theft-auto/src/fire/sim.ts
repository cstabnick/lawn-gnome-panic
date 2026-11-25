// E25 fire system: the pure simulation (no three.js, no DOM). Types and tuning in fire/types.ts.
// STUB: issue 09 fills it in. Signatures are the contract.
import type { Fire, FireEvent, FireField, FuelPoint, IgniteOpts } from './types';

export function createFireField(): FireField {
  return { fires: [], nextId: 1 };
}

/** Light a fire at (x, y, z). Returns it. */
export function ignite(field: FireField, x: number, y: number, z: number, opts: IgniteOpts = {}): Fire {
  const f: Fire = {
    id: field.nextId++, x, y, z, r: opts.r ?? 0.8, heat: opts.heat ?? 0.5, fuel: opts.fuel ?? 120, kind: opts.kind ?? 'generic',
    state: 'burning', since: 0, wet: 0, group: opts.group ?? null,
  };
  field.fires.push(f);
  return f;
}

/** Water lands in a circle (x, z, radius): `litres` spread over the burning fires it touches. Returns heat removed. */
export function douse(field: FireField, x: number, z: number, radius: number, litres: number): number {
  void field; void x; void z; void radius; void litres;
  return 0;
}

/** Advance every fire by dt seconds; fuel points near hot fires may catch. Returns what happened this step. */
export function stepFires(field: FireField, dt: number, fuel: FuelPoint[] = []): FireEvent[] {
  void field; void dt; void fuel;
  return [];
}

/** Fires still burning (in `group` when given). */
export function burningCount(field: FireField, group?: string | null): number {
  return field.fires.filter((f) => f.state === 'burning' && (group === undefined || f.group === group)).length;
}

/** The burning fire nearest (x, z), or null. */
export function nearestBurning(field: FireField, x: number, z: number): Fire | null {
  void x; void z;
  return field.fires.find((f) => f.state === 'burning') ?? null;
}

/** Remove fires (all, or one group's) at once, no events. */
export function clearFires(field: FireField, group?: string | null): void {
  field.fires = group === undefined ? [] : field.fires.filter((f) => f.group !== group);
}

/** A fuel point ready for stepFires. */
export function fuelPoint(x: number, y: number, z: number, r: number, kind: FuelPoint['kind'], fuel = 90, group: string | null = null): FuelPoint {
  return { x, y, z, r, kind, fuel, group, exposure: 0, lit: false };
}
