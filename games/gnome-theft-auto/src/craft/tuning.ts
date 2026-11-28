// Boat and aircraft tuning: modest stat multipliers bought in levels (0..3) for Acorns. Pure maths, no DOM, no game imports.
// Design: docs/roadmaps/gta-air-and-sea.md. The owned tune per model lives in craftTuneStore.ts.
import type { AirSpec, CraftStat, CraftTune, HullSpec } from './model';

export const MAX_TUNE_LEVEL = 3;

export interface CraftStatDef {
  id: CraftStat;
  name: string;
  blurb: string;
  /** Shown for aircraft / for boats. */
  air: boolean;
  sea: boolean;
  /** Fractional gain per level (0.08 = +8% a level). */
  step: number;
  /** Acorns for level 1, 2 and 3. */
  prices: readonly [number, number, number];
}

export const CRAFT_STATS: readonly CraftStatDef[] = [
  { id: 'engine', name: 'Engine', blurb: 'More pull: quicker off the line and up to speed.', air: true, sea: true, step: 0.08, prices: [210, 460, 840] },
  { id: 'topSpeed', name: 'Top Speed', blurb: 'A little more at the top end.', air: true, sea: true, step: 0.05, prices: [260, 560, 1050] },
  { id: 'handling', name: 'Handling', blurb: 'Turns tighter (and a boat slips less).', air: true, sea: true, step: 0.07, prices: [175, 390, 740] },
  { id: 'lift', name: 'Lift', blurb: 'Climbs faster; a plane flies slower before it stalls.', air: true, sea: false, step: 0.08, prices: [230, 490, 910] },
];

export const NO_TUNE: CraftTune = { engine: 0, topSpeed: 0, handling: 0, lift: 0 };

function statDef(stat: CraftStat): CraftStatDef {
  const def = CRAFT_STATS.find((s) => s.id === stat);
  if (!def) throw new Error(`unknown craft stat: ${stat}`);
  return def;
}

/** An integer level 0..MAX_TUNE_LEVEL; anything not a finite number is 0. */
function clampLevel(v: unknown): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(MAX_TUNE_LEVEL, Math.round(v)));
}

/** Any input becomes a valid CraftTune: non-objects give stock, each stat is rounded and clamped. Never mutates `t`. */
export function clampTune(t: unknown): CraftTune {
  if (!t || typeof t !== 'object') return { ...NO_TUNE };
  const r = t as Record<string, unknown>;
  return {
    engine: clampLevel(r.engine),
    topSpeed: clampLevel(r.topSpeed),
    handling: clampLevel(r.handling),
    lift: clampLevel(r.lift),
  };
}

/** The multiplier a stat gives at a level: 1 + step x level (level clamped). */
export function statMult(stat: CraftStat, level: number): number {
  return 1 + statDef(stat).step * clampLevel(level);
}

/** A new air spec with the tune applied (the input is not changed). Lift also lowers stall speed where the spec has one. */
export function applyAirTune(spec: AirSpec, t: CraftTune): AirSpec {
  const tune = clampTune(t);
  const out: AirSpec = {
    ...spec,
    thrust: spec.thrust * statMult('engine', tune.engine),
    maxSpeed: spec.maxSpeed * statMult('topSpeed', tune.topSpeed),
    turnRate: spec.turnRate * statMult('handling', tune.handling),
    climbRate: spec.climbRate * statMult('lift', tune.lift),
  };
  if (spec.stallSpeed !== undefined) out.stallSpeed = spec.stallSpeed * (1 - 0.04 * tune.lift);
  return out;
}

/** A new hull spec with the tune applied (the input is not changed). */
export function applyHullTune(spec: HullSpec, t: CraftTune): HullSpec {
  const tune = clampTune(t);
  return {
    ...spec,
    accel: spec.accel * statMult('engine', tune.engine),
    maxSpeed: spec.maxSpeed * statMult('topSpeed', tune.topSpeed),
    turnRate: spec.turnRate * statMult('handling', tune.handling),
    sideGrip: spec.sideGrip * statMult('handling', tune.handling),
  };
}

/** Acorns to go from one tune to another: the prices of each level bought. Lowering a stat costs nothing. */
export function tuneCost(from: CraftTune, to: CraftTune): number {
  const a = clampTune(from);
  const b = clampTune(to);
  let total = 0;
  for (const def of CRAFT_STATS) {
    const f = a[def.id];
    const t = b[def.id];
    for (let l = f + 1; l <= t; l++) total += def.prices[l - 1];
  }
  return total;
}

/** The stats shown for aircraft ('air') or boats ('sea'). */
export function statsFor(regime: 'air' | 'sea'): CraftStatDef[] {
  return CRAFT_STATS.filter((s) => (regime === 'air' ? s.air : s.sea));
}
