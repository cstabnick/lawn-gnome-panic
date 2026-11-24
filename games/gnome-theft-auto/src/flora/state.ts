// The mow / regrow state machine over a PlantStore (src/flora/). Plan: docs/roadmaps/gta-mowable-plants.md.
// Every function here runs per frame or per mow: no allocation inside them.
import { FLORA, PLANT_KINDS } from './kinds';
import { CUT, REGROWING, STANDING, type PlantStore } from './types';

/** Cut plant i (STANDING or REGROWING -> CUT). `rnd` in [0, 1) picks the regrow wait. True when it was not already CUT. */
export function mowPlant(s: PlantStore, i: number, rnd: number): boolean {
  if (s.state[i] === CUT) return false;
  const k = PLANT_KINDS[s.kind[i]];
  s.state[i] = CUT;
  s.t[i] = 0;
  s.wait[i] = k.regrow[0] + (k.regrow[1] - k.regrow[0]) * rnd;
  if (s.activeAt[i] < 0) {
    s.active[s.activeCount] = i;
    s.activeAt[i] = s.activeCount;
    s.activeCount++;
  }
  return true;
}

/** Put plant i back to STANDING at once (trainer). */
export function regrowPlant(s: PlantStore, i: number): void {
  s.state[i] = STANDING;
  s.t[i] = 0;
  const slot = s.activeAt[i];
  if (slot >= 0) {
    const last = s.activeCount - 1;
    const moved = s.active[last];
    s.active[slot] = moved;
    s.activeAt[moved] = slot;
    s.activeCount = last;
    s.activeAt[i] = -1;
  }
}

/**
 * Advance every active plant by dt; writes the indices whose drawn height changed into `changed`; returns how many.
 * Walks the active list backwards so regrowPlant's swap-removal never skips an entry. Once `changed` is full the
 * plants keep stepping, they just are not recorded.
 */
export function stepPlants(s: PlantStore, dt: number, px: number, pz: number, changed: Int32Array): number {
  const cap = changed.length;
  const away2 = FLORA.regrowAwayM * FLORA.regrowAwayM;
  let n = 0;
  for (let k = s.activeCount - 1; k >= 0; k--) {
    const i = s.active[k];
    s.t[i] += dt;
    if (s.state[i] === CUT) {
      if (s.t[i] >= s.wait[i]) {
        const dx = s.cx[i] - px;
        const dz = s.cz[i] - pz;
        if (dx * dx + dz * dz >= away2) {
          s.state[i] = REGROWING;
          s.t[i] = 0;
          if (n < cap) changed[n++] = i;
        }
      }
    } else {
      // REGROWING
      if (n < cap) changed[n++] = i;
      if (s.t[i] >= FLORA.regrowSeconds) regrowPlant(s, i);
    }
  }
  return n;
}

/** Drawn height scale for plant i now: 1 standing, FLORA.stubbleY cut, regrowCurve while regrowing. */
export function plantHeightScale(s: PlantStore, i: number): number {
  const st = s.state[i];
  if (st === STANDING) return 1;
  if (st === CUT) return FLORA.stubbleY;
  return regrowCurve(s.t[i] / FLORA.regrowSeconds);
}

/** Regrowth progress f in [0, 1] -> height scale, from FLORA.stubbleY at 0 to exactly 1 at 1. */
export function regrowCurve(f: number): number {
  if (f <= 0) return FLORA.stubbleY;
  if (f >= 1) return 1;
  // Three stages; each one eases from the previous stage's level up to the next.
  const x = 3 * f;
  const whole = Math.floor(x);
  const u = x - whole;
  const eased = u * u * (3 - 2 * u);
  const g = (whole + eased) / 3;
  return FLORA.stubbleY + (1 - FLORA.stubbleY) * g;
}
