import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { homeOf } from '../homes/data';
import { installFakeDom } from '../testing/fakeDom';
import type { Box } from '../types';
import { buildSnowdropSlope } from './hill';
import { COCOA_HATCH, RUNS, SKI_RACK, SLED_STACK, TEA_TRAY_RUN, TOW, WOOL_RUN } from './types';

const inside = (b: Box, x: number, z: number): boolean => x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ;

describe('Snowdrop Slope scenery', () => {
  beforeAll(() => { installFakeDom(); });

  it('keeps gates, lines, porch spots and the tow line clear of colliders', () => {
    const { boxes } = buildSnowdropSlope(new THREE.Scene());
    const clear: [number, number][] = [
      ...WOOL_RUN.gates.map((g): [number, number] => [g.x, g.z]),
      [WOOL_RUN.start.x, WOOL_RUN.start.z], [WOOL_RUN.finish.x, WOOL_RUN.finish.z],
      [TEA_TRAY_RUN.start.x, TEA_TRAY_RUN.start.z], [TEA_TRAY_RUN.finish.x, TEA_TRAY_RUN.finish.z],
      [SKI_RACK.x, SKI_RACK.z], [SLED_STACK.x, SLED_STACK.z], [COCOA_HATCH.x, COCOA_HATCH.z],
    ];
    for (const [x, z] of clear) for (const b of boxes) expect(inside(b, x, z), `box in the way at ${x},${z}`).toBe(false);
    const pylons = Array.from({ length: TOW.pylons }, (_, k) => ({
      x: TOW.base.x + ((TOW.top.x - TOW.base.x) * k) / (TOW.pylons - 1),
      z: TOW.base.z + ((TOW.top.z - TOW.base.z) * k) / (TOW.pylons - 1),
    }));
    for (let i = 0; i < 20; i++) {
      const f = i / 19;
      const x = TOW.base.x + (TOW.top.x - TOW.base.x) * f, z = TOW.base.z + (TOW.top.z - TOW.base.z) * f;
      for (const b of boxes) {
        if (inside(b, x, z)) expect(pylons.some((p) => Math.hypot(p.x - x, p.z - z) <= 0.5)).toBe(true);
      }
    }
  });

  it('keeps the gates of every skis run clear, the corral north of the road and a top hut by the tow', () => {
    const { boxes } = buildSnowdropSlope(new THREE.Scene());
    for (const run of RUNS) {
      for (const g of [...run.gates, run.start, run.finish]) {
        for (const b of boxes) expect(inside(b, g.x, g.z), `${run.id} box in the way at ${g.x},${g.z}`).toBe(false);
      }
    }
    const lines = RUNS.flatMap((r) => [r.start, ...r.gates, r.finish]);
    const finishZ = Math.max(...RUNS.map((r) => r.finish.z));
    const corral = boxes.filter((b) => b.minZ > -1001 && b.maxZ < -958 && b.minZ > finishZ);
    expect(corral.length).toBeGreaterThan(10);
    for (const b of boxes) {
      if (b.minZ > finishZ && b.minX > -430 && b.maxX < -335) expect(b.maxZ, 'corral stays short of the band road').toBeLessThan(-958);
    }
    for (const b of boxes) for (const l of lines) if (l.z < finishZ) expect(inside(b, l.x, l.z)).toBe(false);
    expect(boxes.some((b) => Math.hypot((b.minX + b.maxX) / 2 - TOW.top.x, (b.minZ + b.maxZ) / 2 - TOW.top.z) < 12
      && b.maxX - b.minX < 5 && b.maxZ - b.minZ < 5)).toBe(true);
  });

  it('updates without throwing and registers Gentian\'s door', () => {
    const s = buildSnowdropSlope(new THREE.Scene());
    expect(() => s.update(0.1, 1, -440, -1020)).not.toThrow();
    expect(() => s.update(0.1, 2, 900, 900)).not.toThrow();
    expect(homeOf('gentian')?.door).not.toBeNull();
  });
});
