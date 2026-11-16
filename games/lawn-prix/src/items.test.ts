import { describe, it, expect } from 'vitest';
import { ITEMS, type KartInput, type RaceState } from './config';
import { boxSpots, cpuItemUse, itemRoll, stepItems } from './items';
import { createRace, cpuInput, stepRace } from './sim';
import { getTrack, headingOf, pointAt } from './track';

const NONE: KartInput = { steer: 0, throttle: 0, drift: false, item: false };
const PRESS: KartInput = { steer: 0, throttle: 0, drift: false, item: true };
const T = getTrack('garden');

function oneKart(): RaceState {
  return createRace([{ vehicle: 'cart', skill: 1 }], 'garden');
}

describe('item boxes', () => {
  it('a kart on a box picks up an item, the box is gone until it respawns', () => {
    const race = oneKart();
    race.t = 1;
    const spot = boxSpots(T)[0];
    const k = race.karts[0];
    k.x = spot.x;
    k.z = spot.z;
    const ev = stepItems(race, T, [NONE], 0.01);
    expect(k.item).not.toBeNull();
    expect(ev.picked).toEqual([0]);
    expect(race.boxes[0]).toBeCloseTo(1 + ITEMS.boxRespawnS, 9);

    // A second kart on the same spot right after gets nothing.
    const race2 = createRace([{ vehicle: 'cart', skill: 1 }, { vehicle: 'bike', skill: 1 }], 'garden');
    race2.t = 1;
    race2.boxes[0] = 1 + ITEMS.boxRespawnS;
    race2.karts[1].x = spot.x;
    race2.karts[1].z = spot.z;
    stepItems(race2, T, [null, null], 0.01);
    expect(race2.karts[1].item).toBeNull();
  });

  it('a kart in 1st place gets an acorn exactly when the roll is below 0.85', () => {
    for (const t of [1, 1.1, 1.3, 1.7, 2.2, 3.1]) {
      const race = createRace([{ vehicle: 'cart', skill: 1 }, { vehicle: 'bike', skill: 1 }], 'garden');
      race.t = t;
      race.karts[1].dist = -50;
      const spot = boxSpots(T)[0];
      race.karts[0].x = spot.x;
      race.karts[0].z = spot.z;
      stepItems(race, T, [null, null], 0.01);
      const expected = itemRoll(t, 0, 0) < 0.85 ? 'acorn' : 'boost';
      expect(race.karts[0].item).toBe(expected);
    }
  });
});

describe('using items', () => {
  it('a boost sets boost, clears the item; a held button does not use again', () => {
    const race = oneKart();
    race.karts[0].item = 'boost';
    const ev = stepItems(race, T, [PRESS], 0.01);
    expect(race.karts[0].boost).toBe(ITEMS.boostS);
    expect(race.karts[0].item).toBeNull();
    expect(ev.used).toEqual([0]);

    race.karts[0].item = 'boost';
    let used = 0;
    for (let i = 0; i < 10; i++) used += stepItems(race, T, [PRESS], 0.01).used.length;
    expect(used).toBe(0);
    expect(race.karts[0].item).toBe('boost');
  });

  it('an acorn thrown at a kart 10 m ahead hits it, the thrower is never hit', () => {
    const race = createRace([{ vehicle: 'cart', skill: 1 }, { vehicle: 'bike', skill: 1 }], 'garden');
    const k0 = race.karts[0];
    const p = pointAt(T, 200);
    k0.x = p.x;
    k0.z = p.z;
    k0.h = headingOf(p.tx, p.tz);
    k0.vx = 0;
    k0.vz = 0;
    k0.item = 'acorn';
    const fwdX = Math.sin(k0.h), fwdZ = Math.cos(k0.h);
    const k1 = race.karts[1];
    k1.x = k0.x + fwdX * 10;
    k1.z = k0.z + fwdZ * 10;

    let hits = 0;
    let used = 0;
    for (let step = 0; step < 60; step++) {
      const ev = stepItems(race, T, [step === 0 ? PRESS : NONE, NONE], 1 / 60);
      hits += ev.hits.filter((j) => j === 1).length;
      used += ev.used.length;
      if (ev.hits.length) break;
    }
    expect(used).toBe(1);
    expect(hits).toBe(1);
    expect(k1.spin).toBe(ITEMS.acornSpinS);
    expect(k0.spin).toBe(0);
    expect(race.acorns.length).toBe(0);
  });

  it('acorns expire after acornLifeS', () => {
    const race = oneKart();
    const b = T.course.bounds;
    race.acorns.push({ x: (b.minX + b.maxX) / 2, z: (b.minZ + b.maxZ) / 2, vx: 0, vz: 0, o: 0, t: ITEMS.acornLifeS });
    for (let i = 0; i < 10; i++) stepItems(race, T, [NONE], 0.1);
    expect(race.acorns.length).toBe(1);
    for (let i = 0; i < 8; i++) stepItems(race, T, [NONE], 0.1);
    expect(race.acorns.length).toBe(0);
  });
});

describe('cpuItemUse', () => {
  it('is false without an item', () => {
    const race = oneKart();
    expect(cpuItemUse(race, T, 0)).toBe(false);
  });
});

describe('full CPU race with items', () => {
  it('stays small in JSON and every CPU uses at least one item', () => {
    const race = createRace(
      [
        { vehicle: 'cart', skill: 0.97 },
        { vehicle: 'bike', skill: 0.95 },
        { vehicle: 'cart', skill: 0.93 },
        { vehicle: 'bike', skill: 0.91 },
      ],
      'garden',
    );
    const used = [0, 0, 0, 0];
    let maxBytes = 0;
    for (let step = 0; step < 90 * 60 && !race.over; step++) {
      const inputs = race.karts.map((_, i) => cpuInput(race, i));
      const ev = stepRace(race, inputs, 1 / 60);
      for (const i of ev.used) used[i]++;
      maxBytes = Math.max(maxBytes, JSON.stringify(race).length);
    }
    expect(maxBytes).toBeLessThan(1900);
    for (const n of used) expect(n).toBeGreaterThanOrEqual(1);
  });
});
