import { afterAll, describe, expect, it, vi } from 'vitest';
import { resetTerrainOptions, waterAt } from './terrain';
import { loopRoute, patrolSpawn, pingPong, steerToward, waterwayRoute } from './boatTraffic';
import { courseProfile, onWaterCourse } from './water';

// Browser-only audio (it touches `window` on load); the pure helpers here do not play sound.
vi.mock('./audio', () => ({ play: () => undefined }));

afterAll(() => resetTerrainOptions());

describe('boat traffic: loop routes', () => {
  it('puts 8 points all in the loch', () => {
    const pts = loopRoute('water/loch-moss', 0.6, 8);
    expect(pts).toHaveLength(8);
    for (const p of pts) {
      expect(waterAt(p.x, p.z)?.depth ?? 0).toBeGreaterThan(1);
    }
  });
});

describe('boat traffic: ping-pong routes', () => {
  it('walks a list there and back without repeating the ends', () => {
    expect(pingPong(['a', 'b', 'c'])).toEqual(['a', 'b', 'c', 'b']);
    expect(pingPong(['a', 'b', 'c', 'd'])).toEqual(['a', 'b', 'c', 'd', 'c', 'b']);
  });

  it('leaves a list of one or two as it is', () => {
    expect(pingPong(['a'])).toEqual(['a']);
    expect(pingPong(['a', 'b'])).toEqual(['a', 'b']);
    expect(pingPong([])).toEqual([]);
  });
});

describe('boat traffic: waterway routes', () => {
  it('runs the ravine, canal and farm river as one non-empty route on the water', () => {
    waterAt(0, 0); // builds the water first (the profiles come from it)
    const pts = waterwayRoute(['river-ravine', 'canal', 'river-farm']);
    expect(pts.length).toBeGreaterThan(0);
    const first = courseProfile('river-ravine')!;
    const last = courseProfile('river-farm')!;
    const start = pts[0];
    const end = pts[pts.length - 1];
    expect(Math.hypot(start.x - first.x[0], start.z - first.z[0])).toBeLessThan(1);
    expect(Math.hypot(end.x - last.x[last.x.length - 1], end.z - last.z[last.z.length - 1])).toBeLessThan(1);
    for (const p of pts) expect(onWaterCourse(p.x, p.z)).toBe(true);
  });

  it('returns nothing for a course that does not exist', () => {
    expect(waterwayRoute(['no-such-river'])).toEqual([]);
  });
});

describe('boat traffic: steering', () => {
  it('steers right toward a target on the right (-x for yaw 0)', () => {
    expect(steerToward({ x: 0, z: 0, yaw: 0 }, -10, 10)).toBeGreaterThan(0);
  });

  it('steers left toward a target on the left (+x for yaw 0)', () => {
    expect(steerToward({ x: 0, z: 0, yaw: 0 }, 10, 10)).toBeLessThan(0);
  });
});

describe('boat traffic: patrol spawn', () => {
  it('spawns in the loch, at least 1.2 m deep', () => {
    const s = patrolSpawn(-700, -620);
    expect(s).not.toBeNull();
    expect(waterAt(s!.x, s!.z)?.depth ?? 0).toBeGreaterThanOrEqual(1.2);
  });

  it('finds no water at Turfton', () => {
    expect(patrolSpawn(0, 0)).toBeNull();
  });
});
