// Hedgeworth as a @lawn/golf course: lies on the yard, and the package's calibrated ball flight on GTA ground.
import { describe, expect, it } from 'vitest';
import { CLUBS, simulateShot } from '@lawn/golf';
import { golfEnv, golfStart, golfToWorld, lieAtWorld, holeYards, yardsBetween } from './course';
import { HOLES, YD, toGolf } from './types';

describe('Hedgeworth lies', () => {
  it('reads tee, fairway, green, fringe, sand, water and rough where the holes put them', () => {
    const h1 = HOLES[0];
    expect(lieAtWorld(h1.tee.x, h1.tee.z)).toBe('tee');
    expect(lieAtWorld(-1180, 478)).toBe('fairway');
    expect(lieAtWorld(h1.pin.x, h1.pin.z)).toBe('green');
    expect(lieAtWorld(h1.green.x + h1.green.r + 0.6, h1.green.z)).toBe('fringe');
    expect(lieAtWorld(h1.bunkers[0].x, h1.bunkers[0].z)).toBe('sand');
    const pond = HOLES[2].ponds[0];
    expect(lieAtWorld(pond.x, pond.z)).toBe('water');
    expect(lieAtWorld(-1180, 560)).toBe('rough');
  });

  it('converts holes to yards', () => {
    const y = holeYards(HOLES[1]);
    expect(y.green.r).toBeCloseTo(HOLES[1].green.r / YD);
    expect(y.pin).toEqual(toGolf(HOLES[1].pin.x, HOLES[1].pin.z));
  });
});

describe('ball flight on GTA ground', () => {
  it('a perfect calm driver off the first tee carries the club carry, as in Gnome Golf', () => {
    const h1 = HOLES[0];
    const start = golfStart(h1.tee.x, h1.tee.z);
    const r = simulateShot(golfEnv(), start, { club: 'DR', power: 1, accuracy: 0, yaw: -Math.PI / 2 }, 'tee', { yaw: 0, mph: 0 }, toGolf(h1.pin.x, h1.pin.z));
    expect(Math.abs(r.carry - CLUBS.DR.carry)).toBeLessThan(2);
    const end = golfToWorld(r.end);
    expect(end.x).toBeLessThan(h1.tee.x - CLUBS.DR.carry * YD * 0.9);
    expect(Math.abs(yardsBetween(h1.tee, end) - r.total)).toBeLessThan(1);
  });

  it('is deterministic', () => {
    const start = golfStart(-1180, 478);
    const shot = { club: '7I' as const, power: 0.9, accuracy: 0.3, yaw: -1.5 };
    const a = simulateShot(golfEnv(), start, shot, 'fairway', { yaw: 1, mph: 6 }, { x: 0, z: 0 });
    const b = simulateShot(golfEnv(), start, shot, 'fairway', { yaw: 1, mph: 6 }, { x: 0, z: 0 });
    expect(a).toEqual(b);
  });
});
