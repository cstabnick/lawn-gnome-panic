import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { Ground } from '../world';
import { createWaterGround } from './surface';
import { FLOOD, type Flood, type FlowSample } from './types';

/** A fake Flood whose water surface is the plane y = base + slope * x over a flat bed at y = 0. */
function planeFlood(base: number, slope: number): Flood {
  return {
    time: 0,
    runs: [],
    step() {},
    restart() {},
    anchor() {},
    focus() {},
    volume: () => 0,
    sample(x: number, _z: number, _hint: number, out: FlowSample): boolean {
      const surface = base + slope * x;
      out.depth = surface;
      out.bedY = 0;
      out.surfaceY = surface;
      out.vx = out.vz = 0;
      return surface > 0.01;
    },
  };
}

const ground = (): Ground => ({ y: 0, normal: new THREE.Vector3(0, 1, 0), island: 0, pipe: -1 });

describe('water as ground', () => {
  it('leaves the ground alone in shallow water', () => {
    const g = ground();
    createWaterGround(planeFlood(0.1, 0))({} as never, 0, 0, g);
    expect(g.y).toBe(0);
    expect(g.normal.y).toBe(1);
  });

  it('lifts the board onto the surface in deep water, a little below the top', () => {
    const g = ground();
    createWaterGround(planeFlood(2, 0))({} as never, 0, 0, g);
    expect(g.y).toBeCloseTo(2 - FLOOD.sink, 3);
    expect(g.normal.y).toBeGreaterThan(0.999);
  });

  it('eases on between the shallow and deep limits', () => {
    const g = ground();
    createWaterGround(planeFlood(FLOOD.floatDepth, 0))({} as never, 0, 0, g);
    expect(g.y).toBeGreaterThan(0);
    expect(g.y).toBeLessThan(FLOOD.floatDepth - FLOOD.sink + 1e-6);
  });

  it('tilts the ground with the water surface (a wave face to carve)', () => {
    const g = ground();
    createWaterGround(planeFlood(3, 0.5))({} as never, 0, 0, g);
    // the surface rises toward +x, so the normal leans toward -x
    expect(g.normal.x).toBeLessThan(-0.3);
    expect(g.normal.length()).toBeCloseTo(1, 5);
  });

  it('caps the tilt on a near-vertical front', () => {
    const g = ground();
    createWaterGround(planeFlood(3, 5))({} as never, 0, 0, g);
    const slope = Math.hypot(g.normal.x, g.normal.z) / g.normal.y;
    expect(slope).toBeLessThanOrEqual(FLOOD.maxSurfaceSlope + 1e-6);
  });
});
