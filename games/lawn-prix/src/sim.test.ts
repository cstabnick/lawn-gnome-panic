import { describe, it, expect } from 'vitest';
import { DRIVE, HAZARD, HOP, RACE, VEHICLES, type CourseId, type KartInput, type RaceState } from './config';
import { hazardHits, hazardsAt } from './hazards';
import { getTrack, headingOf, pointAt as pointAtT, projectOnTrack as projectT } from './track';

const T = getTrack('garden');
const pointAt = (s: number) => pointAtT(T, s);
const projectOnTrack = (x: number, z: number) => projectT(T, x, z);
import { createRace, cpuInput, racePlaces, resolveBumps, stepKart, stepRace } from './sim';

const FULL: KartInput = { steer: 0, throttle: 1, drift: false, item: false };

function fourEntries() {
  return [
    { vehicle: 'cart' as const, skill: RACE.cpuSkill[0] },
    { vehicle: 'bike' as const, skill: RACE.cpuSkill[1] },
    { vehicle: 'cart' as const, skill: RACE.cpuSkill[2] },
    { vehicle: 'bike' as const, skill: RACE.cpuSkill[3] },
  ];
}

/** Runs four CPUs until the race is over (or 90 s of race time), sampling the JSON size every step. */
function cpuRace(course: CourseId = 'garden'): { race: RaceState; maxBytes: number } {
  const race = createRace(fourEntries(), course);
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
    const race = createRace(fourEntries(), 'garden');
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
    const race = createRace([{ vehicle: 'cart', skill: 1 }], 'garden');
    const k = race.karts[0];
    let top = 0;
    for (let i = 0; i < 4 * 60; i++) {
      stepKart(k, FULL, 1 / 60, i / 60, race.laps, T);
      top = Math.max(top, Math.hypot(k.vx, k.vz));
    }
    expect(top).toBeGreaterThan(0.9 * VEHICLES.cart.maxSpeed);
  });

  it('off the mown track the speed never exceeds the off-track top speed', () => {
    const race = createRace([{ vehicle: 'cart', skill: 1 }], 'garden');
    const k = race.karts[0];
    const p = pointAt(20);
    // 15 m to the left of the centreline (left of tangent (tx, tz) is (tz, -tx)), heading along the tangent.
    k.x = p.x + p.tz * 15;
    k.z = p.z - p.tx * 15;
    k.h = headingOf(p.tx, p.tz);
    k.s = projectOnTrack(k.x, k.z).s;
    let top = 0;
    for (let i = 0; i < 3 * 60; i++) {
      stepKart(k, FULL, 1 / 60, i / 60, race.laps, T);
      top = Math.max(top, Math.hypot(k.vx, k.vz));
    }
    expect(k.off).toBe(true);
    expect(top).toBeLessThanOrEqual(VEHICLES.cart.maxSpeed * DRIVE.offTrackSpeedMul + 0.5);
  });

  it('steering right for 1 s at speed lowers the heading', () => {
    const race = createRace([{ vehicle: 'cart', skill: 1 }], 'garden');
    const k = race.karts[0];
    const h0 = k.h;
    k.vx = 10 * Math.sin(h0);
    k.vz = 10 * Math.cos(h0);
    for (let i = 0; i < 60; i++) stepKart(k, { steer: 1, throttle: 1, drift: false, item: false }, 1 / 60, i / 60, race.laps, T);
    expect(k.h).toBeLessThan(h0);
  });
});

describe('resolveBumps', () => {
  it('pushes overlapping karts apart, returns both indices, and the lighter bike moves more', () => {
    const race = createRace([{ vehicle: 'cart', skill: 1 }, { vehicle: 'bike', skill: 1 }], 'garden');
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

  it('the race JSON stays under 1900 bytes at every sampled moment (the item budget; the fresh race alone is about 1100)', () => {
    expect(cpuRace().maxBytes).toBeLessThan(1900);
  });

  for (const course of ['panic', 'front', 'golf'] as const) {
    it(`four CPUs finish three laps on '${course}' within 90 s, places are a permutation of 0..3`, () => {
      const { race } = cpuRace(course);
      expect(race.over).toBe(true);
      for (const k of race.karts) {
        expect(k.fin).not.toBeNull();
        expect(k.fin as number).toBeLessThanOrEqual(90);
      }
      expect(racePlaces(race).slice().sort((x, y) => x - y)).toEqual([0, 1, 2, 3]);
    });
  }
});

/** A kart on the straight of 'garden' at speed along its heading, at the grid position of slot 0. */
function straightKart(speed: number) {
  const race = createRace([{ vehicle: 'cart', skill: 1 }], 'garden');
  const k = race.karts[0];
  k.vx = speed * Math.sin(k.h);
  k.vz = speed * Math.cos(k.h);
  return { race, k };
}

const STEP = 1 / 60;

describe('hop drift', () => {
  it('a press while driving straight sets hop > 0; after HOP.duration with no steer, drift stays 0', () => {
    const { race, k } = straightKart(12);
    stepKart(k, { steer: 0, throttle: 1, drift: true, item: false }, STEP, 0, race.laps, T);
    expect(k.hop).toBeGreaterThan(0);
    const steps = Math.ceil(HOP.duration / STEP) + 2;
    for (let i = 0; i < steps; i++) {
      stepKart(k, { steer: 0, throttle: 1, drift: true, item: false }, STEP, 0, race.laps, T);
      expect(k.drift).toBe(0);
    }
    expect(k.hop).toBe(0);
  });

  it('a drift starts only on landing: steer 1 held through the hop gives drift +1 only after it has landed', () => {
    const { race, k } = straightKart(12);
    const held: KartInput = { steer: 1, throttle: 1, drift: true, item: false };
    stepKart(k, held, STEP, 0, race.laps, T);
    expect(k.hop).toBeGreaterThan(0);
    let landed = false;
    for (let i = 0; i < Math.ceil(HOP.duration / STEP) + 2 && !landed; i++) {
      const wasHopping = k.hop > 0;
      stepKart(k, held, STEP, 0, race.laps, T);
      if (wasHopping && k.hop === 0) {
        expect(k.drift).toBe(1);
        landed = true;
      } else if (k.hop > 0) {
        expect(k.drift).toBe(0);
      }
    }
    expect(landed).toBe(true);
  });

  it('holding drift from the start of a straight never starts a second hop until released and pressed again', () => {
    const { race, k } = straightKart(12);
    const held: KartInput = { steer: 0, throttle: 1, drift: true, item: false };
    let hops = 0;
    let prevHop = 0;
    for (let i = 0; i < 90; i++) {
      stepKart(k, held, STEP, 0, race.laps, T);
      if (prevHop === 0 && k.hop > 0) hops++;
      prevHop = k.hop;
    }
    expect(hops).toBe(1);
  });
});

describe('spin-out', () => {
  it('a kart with spin = 1 at speed slows to < 25% of its speed within 1 s and its heading does not change with steer 1', () => {
    const { race, k } = straightKart(15);
    k.spin = 1;
    const h0 = k.h;
    const v0 = Math.hypot(k.vx, k.vz);
    for (let i = 0; i < 60; i++) {
      stepKart(k, { steer: 1, throttle: 1, drift: false, item: false }, STEP, 0, race.laps, T);
    }
    expect(Math.hypot(k.vx, k.vz)).toBeLessThan(0.25 * v0);
    expect(k.h).toBe(h0);
  });
});

describe('hazardHits', () => {
  it("a kart placed on the first hazard of 'panic' spins out and is pushed outside the hazard radius", () => {
    const panic = getTrack('panic');
    const race = createRace([{ vehicle: 'cart', skill: 1 }], 'panic');
    const k = race.karts[0];
    const hz = hazardsAt(panic, race.t)[0];
    k.x = hz.x;
    k.z = hz.z;
    const hits = hazardHits(race, panic);
    expect(hits).toEqual([0]);
    expect(k.spin).toBe(HAZARD.spinS);
    const d = Math.hypot(k.x - hz.x, k.z - hz.z);
    expect(d).toBeGreaterThanOrEqual(hz.radius + VEHICLES.cart.radius - 1e-9);
  });
});
