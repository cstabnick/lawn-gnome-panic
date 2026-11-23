// Live-world scenes: which scenes are live, and the clear zones round the scene and along its drive paths.
import { describe, expect, it } from 'vitest';
import { compile } from './timeline';
import { inKeepOut, isLiveScene, liveWorldFor } from './liveArea';
import type { LineTiming, SceneScript, StageEnv } from './script';

const timing: LineTiming = { charsPerSecond: Infinity, holdSeconds: () => 1.5 };
const flat: StageEnv = { ground: () => 0 };

const base: SceneScript = {
  id: 't',
  stage: { kind: 'world' },
  actors: [
    { id: 'a', at: [10, 10] },
    { id: 'b', at: [20, 10] },
  ],
  vehicles: [{ id: 'car', kind: 'ride-on', at: [15, 0] }],
  steps: [
    { do: 'walk', who: 'a', path: [[10, 16]] },
    { do: 'drive', vehicle: 'car', path: [[15, -40], [15, -100]], speed: 10 },
  ],
};

describe('live-world scenes', () => {
  it('world stages are live unless paused; rooms never are', () => {
    expect(isLiveScene(base)).toBe(true);
    expect(isLiveScene({ ...base, world: 'paused' })).toBe(false);
    expect(isLiveScene({ ...base, stage: { kind: 'room', room: 'street' } })).toBe(false);
    expect(liveWorldFor({ ...base, world: 'paused' }, compile(base, timing), flat)).toBeNull();
  });

  it('clears the area round the cast and a string of circles along the drive', () => {
    const live = liveWorldFor(base, compile(base, timing), flat)!;
    expect(live).not.toBeNull();
    const area = live.zones[0];
    for (const p of [[10, 10], [20, 10], [15, 0], [10, 16]] as const) expect(Math.hypot(p[0] - area.x, p[1] - area.z)).toBeLessThan(area.r);
    expect(area.r).toBeGreaterThanOrEqual(14);
    expect(area.r).toBeLessThanOrEqual(45);
    // Every point of the getaway is covered.
    for (let z = 0; z >= -100; z -= 2) expect(inKeepOut(live.zones, 15, z, 0.5)).toBe(true);
    // Far away is not.
    expect(inKeepOut(live.zones, 120, 120)).toBe(false);
  });

  it('clearArea overrides the area circle', () => {
    const live = liveWorldFor({ ...base, clearArea: { at: [0, 0], r: 30 } }, compile(base, timing), flat)!;
    expect(live.zones[0]).toEqual({ x: 0, z: 0, r: 30 });
    expect([live.x, live.z]).toEqual([0, 0]);
  });
});

describe('a scene in two places', () => {
  it('gets a clear circle at each', () => {
    const two: SceneScript = {
      id: 't2', stage: { kind: 'world' },
      actors: [{ id: 'a', at: [0, 0] }, { id: 'b', at: [200, 0] }, { id: 'c', at: [204, 3] }],
      steps: [{ do: 'wait', s: 1 }],
    };
    const live = liveWorldFor(two, compile(two, timing), flat)!;
    expect(inKeepOut(live.zones, 0, 0)).toBe(true);
    expect(inKeepOut(live.zones, 202, 1)).toBe(true);
    expect(inKeepOut(live.zones, 100, 0)).toBe(false);
    // The biggest group comes first.
    expect(live.x).toBeCloseTo(202);
  });
});
