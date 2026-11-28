import { describe, expect, it } from 'vitest';
import { inSite } from '../sites';
import { setTerrainOptions, surfaceAt } from '../terrain';
import {
  COCOA_HATCH,
  LODGE,
  PAIL_POND,
  RUNS,
  SHANTY,
  SKI_RACK,
  SLED_STACK,
  SNOWCAP_BEARS,
  NURSERY_RUN,
  TEA_TRAY_RUN,
  TOW,
  WOOL_RUN,
} from './types';

const dist = (ax: number, az: number, bx: number, bz: number) => Math.hypot(ax - bx, az - bz);

describe('winter places', () => {
  it('lie inside the ski hill site', () => {
    expect(inSite('ski-hill', LODGE.x, LODGE.z)).toBe(true);
    for (const p of [SLED_STACK, COCOA_HATCH, SKI_RACK, TOW.base, TOW.top]) {
      expect(inSite('ski-hill', p.x, p.z)).toBe(true);
    }
    for (const run of RUNS) {
      expect(inSite('ski-hill', run.start.x, run.start.z)).toBe(true);
      expect(inSite('ski-hill', run.finish.x, run.finish.z)).toBe(true);
      for (const g of run.gates) expect(inSite('ski-hill', g.x, g.z)).toBe(true);
    }
    const mug = SNOWCAP_BEARS.find((b) => b.id === 'lodge-mug');
    expect(mug).toBeDefined();
    expect(inSite('ski-hill', mug!.x, mug!.z)).toBe(true);
  });

  it('put the Wool Run at the summit, on snow, with 10-12 gates swinging across the slope', () => {
    setTerrainOptions({ amplitude: 1, testHill: false, landforms: true });
    expect(WOOL_RUN.gates.length).toBeGreaterThanOrEqual(10);
    expect(WOOL_RUN.gates.length).toBeLessThanOrEqual(12);
    expect(WOOL_RUN.start.z).toBeLessThan(-1295);
    expect(TOW.top.z).toBeLessThan(-1300);
    expect(WOOL_RUN.start.z).toBeGreaterThan(TOW.top.z);
    const swing = Math.max(...WOOL_RUN.gates.map((g) => g.x)) - Math.min(...WOOL_RUN.gates.map((g) => g.x));
    expect(swing).toBeGreaterThanOrEqual(40);
    for (const p of [TOW.top, WOOL_RUN.start, WOOL_RUN.finish, ...WOOL_RUN.gates, ...NURSERY_RUN.gates]) {
      expect(surfaceAt(p.x, p.z), `snow at ${p.x},${p.z}`).toBe('snow');
    }
    // The tow line stays well east of the gates it climbs beside.
    for (const g of WOOL_RUN.gates) expect(TOW.base.x).toBeGreaterThan(g.x + g.half + 20);
  });

  it('lie inside the ice lake site', () => {
    expect(inSite('ice-lake', PAIL_POND.x, PAIL_POND.z)).toBe(true);
    expect(inSite('ice-lake', SHANTY.x, SHANTY.z)).toBe(true);
    for (const b of SNOWCAP_BEARS.filter((b) => b.id.startsWith('pond-'))) {
      expect(inSite('ice-lake', b.x, b.z)).toBe(true);
      expect(dist(b.x, b.z, PAIL_POND.x, PAIL_POND.z)).toBeLessThanOrEqual(PAIL_POND.r);
    }
    expect(dist(SHANTY.x, SHANTY.z, PAIL_POND.x, PAIL_POND.z)).toBeLessThanOrEqual(PAIL_POND.r);
  });

  it('keeps the lodge clear of the runs', () => {
    for (const run of [WOOL_RUN, NURSERY_RUN, TEA_TRAY_RUN]) {
      for (const g of [...run.gates, run.finish]) {
        expect(dist(g.x, g.z, LODGE.x, LODGE.z)).toBeGreaterThan(LODGE.size);
      }
    }
  });
});
