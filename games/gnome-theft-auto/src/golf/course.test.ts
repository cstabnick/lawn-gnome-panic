// Hedgeworth as a @lawn/golf course: lies on the yard, and the package's calibrated ball flight on GTA ground.
import { describe, expect, it } from 'vitest';
import { CLUBS, simulateShot } from '@lawn/golf';
import { courseGroundY, golfEnv, golfStart, golfToWorld, lieAtWorld, holeYards, yardsBetween } from './course';
import { heightAt } from '../terrain';
import { HOLES, POTTING_SHED, YD, toGolf } from './types';

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

describe('the new holes: the shed roof and the hedge walls', () => {
  it('lifts hole 7 onto the potting shed roof', () => {
    const s = POTTING_SHED;
    expect(courseGroundY(s.x, s.z) - heightAt(s.x, s.z)).toBeCloseTo(2.6, 5);
    const roof = golfStart(HOLES[7].tee.x, HOLES[7].tee.z);
    const ground = golfStart(s.x + 10, s.z);
    expect(roof.y - ground.y).toBeCloseTo(2.6 / YD, 3);
  });

  const h5 = HOLES[5];
  const wallZ = 866; // the first maze wall, across the line straight south of hole 5's tee
  const fire = (club: 'SW' | '5I', power: number, env = golfEnv()) =>
    simulateShot(env, golfStart(h5.tee.x, h5.tee.z), { club, power, accuracy: 0, yaw: 0 }, 'tee', { yaw: 0, mph: 0 }, toGolf(h5.pin.x, h5.pin.z));

  it('stops a low punch at the first maze wall', () => {
    const r = fire('5I', 0.58);
    // Without the wall the same ball would carry on past it; with it, the ball is stopped on this side.
    expect(golfToWorld(fire('5I', 0.58, { ...golfEnv(), collide: undefined }).end).z).toBeGreaterThan(wallZ);
    expect(golfToWorld(r.end).z).toBeLessThan(wallZ);
    expect(r.events.some((e) => e.kind === 'bounce')).toBe(true);
  });

  it('lets a full sand wedge fly over it', () => {
    const r = fire('SW', 1);
    expect(golfToWorld(r.end).z).toBeGreaterThan(wallZ);
  });
});
