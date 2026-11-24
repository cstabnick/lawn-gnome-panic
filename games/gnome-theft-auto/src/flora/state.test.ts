import { describe, expect, it } from 'vitest';
import { FLORA, plantKindIndex } from './kinds';
import { mowPlant, plantHeightScale, regrowCurve, regrowPlant, stepPlants } from './state';
import { CUT, REGROWING, STANDING, type PlantStore } from './types';

/** A hand-built store: n plants at the given (x, z) points, all 'flower-bed' (regrow 70 to 110 s). */
function makeStore(points: [number, number][]): PlantStore {
  const n = points.length;
  const kind = plantKindIndex('flower-bed');
  return {
    count: n,
    seeds: [] as never,
    cx: Float32Array.from(points.map((p) => p[0])),
    cz: Float32Array.from(points.map((p) => p[1])),
    r: new Float32Array(n).fill(1),
    kind: new Uint8Array(n).fill(kind),
    state: new Uint8Array(n),
    t: new Float32Array(n),
    wait: new Float32Array(n),
    active: new Int32Array(n),
    activeAt: new Int32Array(n).fill(-1),
    activeCount: 0,
    cell: 1,
    ox: 0,
    oz: 0,
    nx: 1,
    nz: 1,
    maxR: 1,
    cellStart: new Int32Array(2),
    cellItems: new Int32Array(n),
  };
}

function activeList(s: PlantStore): number[] {
  return Array.from(s.active.subarray(0, s.activeCount));
}

describe('mowPlant', () => {
  it('cuts a plant, puts it on the active list, and refuses a second cut', () => {
    const s = makeStore([[0, 0]]);
    expect(mowPlant(s, 0, 0)).toBe(true);
    expect(s.state[0]).toBe(CUT);
    expect(activeList(s)).toContain(0);
    expect(mowPlant(s, 0, 0.5)).toBe(false);
    expect(s.activeCount).toBe(1);
  });

  it('picks the regrow wait inside the kind range for rnd 0 and 0.999', () => {
    const s = makeStore([[0, 0], [1, 0]]);
    mowPlant(s, 0, 0);
    mowPlant(s, 1, 0.999);
    expect(s.wait[0]).toBeGreaterThanOrEqual(70);
    expect(s.wait[0]).toBeLessThanOrEqual(110);
    expect(s.wait[1]).toBeGreaterThanOrEqual(70);
    expect(s.wait[1]).toBeLessThanOrEqual(110);
    expect(s.wait[0]).toBeCloseTo(70, 3);
    expect(s.wait[1]).toBeCloseTo(109.96, 1);
  });
});

describe('stepPlants', () => {
  it('regrows a cut plant after its wait when the player is far away, then removes it from the active list', () => {
    const s = makeStore([[0, 0]]);
    const changed = new Int32Array(8);
    mowPlant(s, 0, 0); // wait 70
    const px = 100;
    const pz = 0;

    expect(stepPlants(s, 69, px, pz, changed)).toBe(0);
    expect(s.state[0]).toBe(CUT);

    expect(stepPlants(s, 1, px, pz, changed)).toBe(1);
    expect(changed[0]).toBe(0);
    expect(s.state[0]).toBe(REGROWING);
    expect(s.t[0]).toBe(0);

    expect(stepPlants(s, 3, px, pz, changed)).toBe(1);
    expect(s.state[0]).toBe(REGROWING);
    expect(s.activeCount).toBe(1);

    expect(stepPlants(s, 2, px, pz, changed)).toBe(1);
    expect(s.state[0]).toBe(STANDING);
    expect(s.activeCount).toBe(0);
    expect(s.activeAt[0]).toBe(-1);
  });

  it('keeps a cut plant CUT forever while the player is close', () => {
    const s = makeStore([[0, 0]]);
    const changed = new Int32Array(8);
    mowPlant(s, 0, 0);
    for (let i = 0; i < 10; i++) stepPlants(s, 100, 5, 0, changed);
    expect(s.state[0]).toBe(CUT);
    expect(s.activeCount).toBe(1);
    expect(s.t[0]).toBeCloseTo(1000, 1);
  });

  it('never writes past changed.length but keeps stepping every plant', () => {
    const s = makeStore([[0, 0], [1, 0], [2, 0]]);
    const changed = new Int32Array(1);
    for (let i = 0; i < 3; i++) mowPlant(s, i, 0);
    expect(stepPlants(s, 70, 100, 0, changed)).toBe(1);
    for (let i = 0; i < 3; i++) expect(s.state[i]).toBe(REGROWING);

    expect(stepPlants(s, 1, 100, 0, changed)).toBe(1);
    for (let i = 0; i < 3; i++) expect(s.t[i]).toBeCloseTo(1, 4);
  });
});

describe('regrowPlant', () => {
  it('removes a middle element and keeps the active list consistent', () => {
    const s = makeStore([[0, 0], [1, 0], [2, 0]]);
    mowPlant(s, 0, 0);
    mowPlant(s, 1, 0);
    mowPlant(s, 2, 0);
    expect(activeList(s)).toEqual([0, 1, 2]);

    regrowPlant(s, 1);
    expect(s.state[1]).toBe(STANDING);
    expect(s.activeCount).toBe(2);
    expect(activeList(s)).toEqual([0, 2]);
    expect(s.activeAt[2]).toBe(1);
    expect(s.activeAt[0]).toBe(0);
    expect(s.activeAt[1]).toBe(-1);
  });

  it('handles removing the last element', () => {
    const s = makeStore([[0, 0], [1, 0]]);
    mowPlant(s, 0, 0);
    mowPlant(s, 1, 0);
    regrowPlant(s, 1);
    expect(activeList(s)).toEqual([0]);
    expect(s.activeAt[1]).toBe(-1);
  });
});

describe('regrowCurve', () => {
  it('starts at stubbleY and ends at exactly 1', () => {
    expect(regrowCurve(0)).toBe(FLORA.stubbleY);
    expect(regrowCurve(1)).toBe(1);
  });

  it('is monotonic non-decreasing over 101 samples', () => {
    let prev = -Infinity;
    for (let i = 0; i <= 100; i++) {
      const v = regrowCurve(i / 100);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });

  it('clamps out-of-range progress', () => {
    expect(regrowCurve(-1)).toBe(FLORA.stubbleY);
    expect(regrowCurve(2)).toBe(1);
  });
});

describe('plantHeightScale', () => {
  it('gives 1 standing, stubbleY cut, and the curve while regrowing', () => {
    const s = makeStore([[0, 0], [1, 0], [2, 0]]);
    expect(plantHeightScale(s, 0)).toBe(1);

    mowPlant(s, 0, 0);
    expect(plantHeightScale(s, 0)).toBe(FLORA.stubbleY);

    s.state[0] = REGROWING;
    s.t[0] = 2;
    expect(plantHeightScale(s, 0)).toBeCloseTo(regrowCurve(2 / FLORA.regrowSeconds), 10);

    mowPlant(s, 1, 0);
    s.state[1] = REGROWING;
    s.t[1] = FLORA.regrowSeconds;
    expect(plantHeightScale(s, 1)).toBe(1);
  });
});
