import { describe, expect, it } from 'vitest';
import {
  GHOST_KEY,
  createGhostRecorder,
  ghostPose,
  loadGhost,
  saveGhost,
  type GhostTrace,
} from './ghost';

function fakeStorage() {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
  };
}

/** A straight run along +x at 10 m/s, 1/100 s frames, 10 s long. */
function straightRun(yaw = 0) {
  const rec = createGhostRecorder(5);
  for (let i = 0; i <= 1000; i++) {
    const t = i / 100;
    rec.sample(t, 10 * t, 0, 0, yaw);
  }
  return rec;
}

describe('ghost recorder', () => {
  it('keeps 51 samples for 10 s at 5 Hz', () => {
    const g = straightRun().finish('kerb-row-circuit', 'push-bike', 10);
    expect(g.pts.length / 4).toBe(51);
    expect(g.hz).toBe(5);
  });

  it('reset clears the samples', () => {
    const rec = straightRun();
    rec.reset();
    rec.sample(0, 1, 2, 3, 0);
    expect(rec.finish('kerb-row-circuit', 'push-bike', 0).pts).toEqual([10, 20, 30, 0]);
  });
});

describe('ghostPose', () => {
  const g = straightRun().finish('kerb-row-circuit', 'push-bike', 10);

  it('interpolates half-way between two samples', () => {
    const p = ghostPose(g, 1.1);
    expect(p).not.toBeNull();
    expect(p!.x).toBeCloseTo(11, 4);
    expect(p!.z).toBeCloseTo(0, 4);
  });

  it('wraps yaw the short way across +-PI', () => {
    // Yaw goes from just under +PI to just over -PI: the short way is a tiny step through PI.
    const rec = createGhostRecorder(5);
    rec.sample(0, 0, 0, 0, 3.0);
    rec.sample(0.2, 0, 0, 0, -3.0);
    const trace = rec.finish('kerb-row-circuit', 'push-bike', 0.2);
    const p = ghostPose(trace, 0.1);
    expect(p).not.toBeNull();
    expect(p!.yaw).toBeGreaterThanOrEqual(-Math.PI);
    expect(p!.yaw).toBeLessThan(Math.PI);
    expect(Math.abs(Math.abs(p!.yaw) - Math.PI)).toBeLessThan(0.05);
  });

  it('is null past the end, before the start and for an empty trace', () => {
    expect(ghostPose(g, 10.5)).toBeNull();
    expect(ghostPose(g, -0.1)).toBeNull();
    expect(ghostPose({ ...g, pts: [] }, 1)).toBeNull();
  });
});

describe('ghost storage', () => {
  const trace: GhostTrace = straightRun().finish('kerb-row-circuit', 'push-bike', 10);

  it('round-trips a ghost per track', () => {
    const storage = fakeStorage();
    saveGhost(trace, storage);
    saveGhost({ ...trace, trackId: 'skyway-sprint', time: 12 }, storage);
    expect(loadGhost('kerb-row-circuit', storage)).toEqual(trace);
    expect(loadGhost('skyway-sprint', storage)?.time).toBe(12);
    expect(loadGhost('ring-road-run', storage)).toBeNull();
    expect(storage.map.has(GHOST_KEY)).toBe(true);
  });

  it('returns null for corrupt storage', () => {
    const storage = fakeStorage();
    storage.setItem(GHOST_KEY, '{not json');
    expect(loadGhost('kerb-row-circuit', storage)).toBeNull();
    storage.setItem(GHOST_KEY, JSON.stringify({ 'kerb-row-circuit': { ...trace, pts: [1, 2, 3] } }));
    expect(loadGhost('kerb-row-circuit', storage)).toBeNull();
  });

  it('swallows storage errors on save', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
    };
    expect(() => saveGhost(trace, broken)).not.toThrow();
    expect(loadGhost('kerb-row-circuit', broken)).toBeNull();
  });
});
