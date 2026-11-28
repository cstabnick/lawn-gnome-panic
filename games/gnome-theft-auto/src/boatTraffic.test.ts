import { afterAll, describe, expect, it, vi } from 'vitest';
import { resetTerrainOptions, waterAt } from './terrain';
import { SALTCUT_END, SEA_LOOP, loopRoute, patrolSpawn, pingPong, smackPose, steerToward, waterwayRoute } from './boatTraffic';
import { courseProfile, onWaterCourse, waterDepthAt } from './water';

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

describe('boat traffic: the Saltwater routes (E11)', () => {
  it('keeps every sea-loop point at least 3 m deep', () => {
    for (const p of SEA_LOOP) expect(waterDepthAt(p.x, p.z), `${p.x},${p.z}`).toBeGreaterThanOrEqual(3);
  });

  it('runs the Saltcut as a non-empty route, every point on water', () => {
    waterAt(0, 0);
    const pts = waterwayRoute(['saltcut']);
    expect(pts.length).toBeGreaterThan(0);
    for (const p of pts) expect(waterDepthAt(p.x, p.z), `${p.x},${p.z}`).toBeGreaterThan(0.5);
  });

  it('ends the Saltcut off the Queen, out at (450, 1330), in water at least 1.5 m deep', () => {
    waterAt(0, 0);
    const pts = waterwayRoute(['saltcut'], { to: SALTCUT_END });
    const end = pts[pts.length - 1];
    expect(end).toEqual(SALTCUT_END);
    expect(waterDepthAt(end.x, end.z)).toBeGreaterThanOrEqual(1.5);
  });
});

describe('boat traffic: the fishing smack (A12)', () => {
  it('sails the far line at z 1560 between x -1300 and 1300, in water, for 4000 s', () => {
    waterAt(0, 0);
    for (let t = 0; t <= 4000; t += 50) {
      const p = smackPose(t);
      expect(p.z, `t=${t}`).toBe(1560);
      expect(p.x, `t=${t}`).toBeGreaterThanOrEqual(-1300);
      expect(p.x, `t=${t}`).toBeLessThanOrEqual(1300);
      expect(waterDepthAt(p.x, p.z), `t=${t} ${p.x}`).toBeGreaterThan(0);
    }
  });

  it('starts at the west end heading east, and is deterministic in t', () => {
    const p = smackPose(0);
    expect(p.x).toBe(-1300);
    expect(p.yaw).toBeCloseTo(Math.PI / 2, 6);
    expect(smackPose(123)).toEqual(smackPose(123));
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
