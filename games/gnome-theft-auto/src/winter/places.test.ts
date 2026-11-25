import { describe, expect, it } from 'vitest';
import { inSite } from '../sites';
import {
  COCOA_HATCH,
  LODGE,
  PAIL_POND,
  RUNS,
  SHANTY,
  SKI_RACK,
  SLED_STACK,
  SNOWCAP_BEARS,
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
    for (const run of [WOOL_RUN, TEA_TRAY_RUN]) {
      for (const g of [...run.gates, run.finish]) {
        expect(dist(g.x, g.z, LODGE.x, LODGE.z)).toBeGreaterThan(LODGE.size);
      }
    }
  });
});
