import { describe, expect, it } from 'vitest';
import { HOSE, LADDER, drainTank, hoseArc, hoseLanding, stepLadder } from './hose';

const origin = { x: 0, y: 1, z: 0 };

describe('hoseLanding', () => {
  it('a level shot from 1 m lands where the ballistic formula says', () => {
    // yaw 0 = +z; pitch 0 is level, but the minimum pitch keeps it arcing. Use a fixed pitch and solve by hand.
    const pitch = 0.5;
    const land = hoseLanding(origin, { yaw: 0, pitch }, 0);
    const vy = HOSE.speed * Math.sin(pitch);
    const vz = HOSE.speed * Math.cos(pitch);
    const g = HOSE.gravity;
    const t = (vy + Math.sqrt(vy * vy + 2 * g * 1)) / g;
    expect(land.t).toBeCloseTo(t, 9);
    expect(land.y).toBe(0);
    expect(land.x).toBeCloseTo(0, 9);
    expect(land.z).toBeCloseTo(vz * t, 9);
    // The landing is really on the parabola: y(t) = y0 + vy t - g t^2 / 2 = groundY.
    expect(1 + vy * land.t - (g * land.t * land.t) / 2).toBeCloseTo(0, 9);
  });

  it('45 degrees lands farther than 10 and 80 degrees from the same height', () => {
    const d = (deg: number) => {
      const p = hoseLanding(origin, { yaw: 0, pitch: (deg * Math.PI) / 180 }, 0);
      return Math.hypot(p.x, p.z);
    };
    expect(d(45)).toBeGreaterThan(d(10));
    expect(d(45)).toBeGreaterThan(d(80));
  });

  it('a nozzle below ground returns a non-negative time and the ground height', () => {
    const land = hoseLanding({ x: 0, y: -1, z: 0 }, { yaw: 0, pitch: 0.3 }, 0);
    expect(land.t).toBeGreaterThanOrEqual(0);
    expect(land.y).toBe(0);
  });
});

describe('hoseArc', () => {
  it('first point is the nozzle and last point is the landing', () => {
    const aim = { yaw: 0.7, pitch: 0.6 };
    const n = 16;
    const out = new Float32Array(n * 3);
    const got = hoseArc(origin, aim, 0, n, out);
    expect(got).toBe(n);
    expect(out[0]).toBeCloseTo(origin.x, 5);
    expect(out[1]).toBeCloseTo(origin.y, 5);
    expect(out[2]).toBeCloseTo(origin.z, 5);
    const land = hoseLanding(origin, aim, 0);
    const last = (n - 1) * 3;
    expect(out[last]).toBeCloseTo(land.x, 4);
    expect(out[last + 1]).toBeCloseTo(0, 5);
    expect(out[last + 2]).toBeCloseTo(land.z, 4);
  });

  it('clamps n to the buffer size and refuses n below 2', () => {
    const out = new Float32Array(3 * 4);
    expect(hoseArc(origin, { yaw: 0, pitch: 0.5 }, 0, 10, out)).toBe(4);
    expect(hoseArc(origin, { yaw: 0, pitch: 0.5 }, 0, 1, out)).toBe(0);
  });
});

describe('drainTank', () => {
  it('never goes below 0 and returns less when nearly empty', () => {
    const t = { level: 0.5, cap: 10 };
    const got = drainTank(t, 1, 2);
    expect(got).toBeCloseTo(0.5, 9);
    expect(t.level).toBe(0);
    expect(drainTank(t, 1, 2)).toBe(0);
    expect(t.level).toBe(0);
  });

  it('sprays dt * rate when the tank has enough', () => {
    const t = { level: 5, cap: 10 };
    expect(drainTank(t, 0.5, 2)).toBeCloseTo(1, 9);
    expect(t.level).toBeCloseTo(4, 9);
  });
});

describe('stepLadder', () => {
  it('bonks when it runs past the top and resets to 0', () => {
    const r = stepLadder(0.99, true, true, 0.1, [0.4, 0.6]);
    expect(r.event).toBe('bonk');
    expect(r.ext).toBe(0);
  });

  it('rises while held without an event', () => {
    const r = stepLadder(0.2, true, false, 0.5, [0.4, 0.6]);
    expect(r.event).toBeNull();
    expect(r.ext).toBeCloseTo(0.2 + LADDER.rate * 0.5, 9);
  });

  it('rescues when let go inside the band, keeping ext', () => {
    const r = stepLadder(0.5, false, true, 0.1, [0.4, 0.6]);
    expect(r.event).toBe('rescue');
    expect(r.ext).toBe(0.5);
  });

  it('does nothing when let go outside the band, or when it was not held', () => {
    expect(stepLadder(0.9, false, true, 0.1, [0.4, 0.6])).toEqual({ ext: 0.9, event: null });
    expect(stepLadder(0.5, false, false, 0.1, [0.4, 0.6])).toEqual({ ext: 0.5, event: null });
  });
});
