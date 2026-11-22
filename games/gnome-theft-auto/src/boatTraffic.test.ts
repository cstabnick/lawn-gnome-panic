import { afterAll, describe, expect, it, vi } from 'vitest';
import { resetTerrainOptions, waterAt } from './terrain';
import { loopRoute, patrolSpawn, steerToward } from './boatTraffic';

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
