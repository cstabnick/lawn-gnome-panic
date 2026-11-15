import { describe, it, expect } from 'vitest';
import { DRIVE, RACE, VEHICLES, type KartInput, type RaceState } from './config';
import { headingOf, pointAt, projectOnTrack } from './track';
import { createRace, cpuInput, racePlaces, resolveBumps, stepKart, stepRace } from './sim';

const FULL: KartInput = { steer: 0, throttle: 1, drift: false };

function fourEntries() {
  return [
    { vehicle: 'cart' as const, skill: RACE.cpuSkill[0] },
    { vehicle: 'bike' as const, skill: RACE.cpuSkill[1] },
    { vehicle: 'cart' as const, skill: RACE.cpuSkill[2] },
    { vehicle: 'bike' as const, skill: RACE.cpuSkill[3] },
  ];
}

/** Runs four CPUs until the race is over (or 90 s of race time), sampling the JSON size every step. */
function cpuRace(): { race: RaceState; maxBytes: number } {
  const race = createRace(fourEntries());
  let maxBytes = 0;
  for (let step = 0; step < 90 * 60 && !race.over; step++) {
    const inputs = race.karts.map((_, i) => cpuInput(race, i));
    stepRace(race, inputs, 1 / 60);
    maxBytes = Math.max(maxBytes, JSON.stringify(race).length);
  }
  return { race, maxBytes };
}

describe('createRace', () => {
  it('puts karts on distinct grid slots, at rest, on lap 0, behind the line', () => {
    const race = createRace(fourEntries());
    expect(race.karts).toHaveLength(4);
    const spots = new Set(race.karts.map((k) => `${k.x.toFixed(3)},${k.z.toFixed(3)}`));
    expect(spots.size).toBe(4);
    for (const k of race.karts) {
      expect(k.vx).toBe(0);
      expect(k.vz).toBe(0);
      expect(k.lap).toBe(0);
      expect(k.dist).toBeLessThan(0);
      expect(k.fin).toBeNull();
    }
  });
});

describe('stepKart', () => {
  it('a kart on full throttle on the straight reaches 90% of top speed within 4 s', () => {
    const race = createRace([{ vehicle: 'cart', skill: 1 }]);
    const k = race.karts[0];
    let top = 0;
    for (let i = 0; i < 4 * 60; i++) {
      stepKart(k, FULL, 1 / 60, i / 60, race.laps);
      top = Math.max(top, Math.hypot(k.vx, k.vz));
    }
    expect(top).toBeGreaterThan(0.9 * VEHICLES.cart.maxSpeed);
  });

  it('off the mown track the speed never exceeds the off-track top speed', () => {
    const race = createRace([{ vehicle: 'cart', skill: 1 }]);
    const k = race.karts[0];
    const p = pointAt(20);
    // 15 m to the left of the centreline (left of tangent (tx, tz) is (tz, -tx)), heading along the tangent.
    k.x = p.x + p.tz * 15;
    k.z = p.z - p.tx * 15;
    k.h = headingOf(p.tx, p.tz);
    k.s = projectOnTrack(k.x, k.z).s;
    let top = 0;
    for (let i = 0; i < 3 * 60; i++) {
      stepKart(k, FULL, 1 / 60, i / 60, race.laps);
      top = Math.max(top, Math.hypot(k.vx, k.vz));
    }
    expect(k.off).toBe(true);
    expect(top).toBeLessThanOrEqual(VEHICLES.cart.maxSpeed * DRIVE.offTrackSpeedMul + 0.5);
  });

  it('steering right for 1 s at speed lowers the heading', () => {
    const race = createRace([{ vehicle: 'cart', skill: 1 }]);
    const k = race.karts[0];
    const h0 = k.h;
    k.vx = 10 * Math.sin(h0);
    k.vz = 10 * Math.cos(h0);
    for (let i = 0; i < 60; i++) stepKart(k, { steer: 1, throttle: 1, drift: false }, 1 / 60, i / 60, race.laps);
    expect(k.h).toBeLessThan(h0);
  });
});

describe('resolveBumps', () => {
  it('pushes overlapping karts apart, returns both indices, and the lighter bike moves more', () => {
    const race = createRace([{ vehicle: 'cart', skill: 1 }, { vehicle: 'bike', skill: 1 }]);
    const [a, b] = race.karts;
    a.x = 0; a.z = 0;
    b.x = 0.5; b.z = 0;
    const hit = resolveBumps(race.karts).slice().sort();
    expect(hit).toEqual([0, 1]);
    const moveA = Math.abs(a.x - 0);
    const moveB = Math.abs(b.x - 0.5);
    expect(moveB).toBeGreaterThan(moveA);
    const d = Math.hypot(b.x - a.x, b.z - a.z);
    expect(d).toBeCloseTo(VEHICLES.cart.radius + VEHICLES.bike.radius, 6);
  });
});

describe('CPU race', () => {
  it('four CPUs finish three laps within 90 s, the race ends, places are a permutation of 0..3', () => {
    const { race } = cpuRace();
    expect(race.over).toBe(true);
    for (const k of race.karts) {
      expect(k.fin).not.toBeNull();
      expect(k.fin as number).toBeLessThanOrEqual(90);
    }
    expect(racePlaces(race).slice().sort((x, y) => x - y)).toEqual([0, 1, 2, 3]);
  });

  it('is deterministic: two runs give identical JSON', () => {
    const first = JSON.stringify(cpuRace().race);
    const second = JSON.stringify(cpuRace().race);
    expect(second).toBe(first);
  });

  it('the race JSON stays under 1600 bytes at every sampled moment', () => {
    expect(cpuRace().maxBytes).toBeLessThan(1600);
  });
});
