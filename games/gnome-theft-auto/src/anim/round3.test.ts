import { describe, expect, it } from 'vitest';
import { createGnomeModel, GNORMAN_LOOK } from '@lawn/gnome';
import { animById } from './index';
import { LONG_RIDE_S, createRideAnimator, driverAnim, passengerAnim, type RideInfo } from './rideAuto';
import { PAIR_PICKS, PERSONAS, idleFor, pairFor, personaFor, walkStyleFor, yawToward } from './persona';
import { IDLE_DELAY, createIdleFidget, pickFidget } from './playerIdle';

const ride = (over: Partial<RideInfo> = {}): RideInfo => ({
  kind: 'ride-on', flies: false, fixedWing: false, boat: false, closed: false, seat: 1, speedFrac: 0.3, rideT: 10, seed: 1, ...over,
});
/** A repeating sequence of numbers in [0, 1): deterministic "random". */
const seq = (...v: number[]) => { let i = 0; return () => v[i++ % v.length]; };

describe('ride poses', () => {
  it('passengers sit by vehicle: heli, plane (dozing on long rides), boat, golf cart, hanging on at speed', () => {
    expect(passengerAnim(ride({ flies: true, fixedWing: true, rideT: 5 }))).toBe('plane-passenger');
    const longPlane = [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => passengerAnim(ride({ flies: true, fixedWing: true, rideT: LONG_RIDE_S + 1, seed })));
    expect(longPlane).toContain('sleep-seated');
    expect(['heli-passenger', 'hang-out-door']).toContain(passengerAnim(ride({ flies: true, rideT: 10 })));
    expect(['boat-lookout', 'seasick']).toContain(passengerAnim(ride({ boat: true })));
    expect(passengerAnim(ride({ kind: 'golf-cart' }))).toBe('golf-cart-passenger');
    expect(passengerAnim(ride({ speedFrac: 0.95 }))).toBe('hold-on');
    expect(passengerAnim(ride({ rideT: 1 }))).toBe('wave-from-seat');
  });
  it('drivers row dinghies, have a personality by vehicle, white knuckles flat out', () => {
    expect(driverAnim(ride({ seat: 0, kind: 'walnut-dinghy', boat: true, speedFrac: 0.5 }))).toBe('boat-row');
    expect(driverAnim(ride({ seat: 0, kind: 'golf-cart' }))).toBe('drive-casual');
    expect(driverAnim(ride({ seat: 0, kind: 'lowrider' }))).toBe('drive-lean-cool');
    expect(driverAnim(ride({ seat: 0, speedFrac: 0.95 }))).toBe('drive-white-knuckle');
    expect(driverAnim(ride({ seat: 0, kind: 'zero-turn' }))).toBeNull();
    expect(driverAnim(ride({ seat: 0, kind: 'zero-turn' }), true)).not.toBeNull();
  });
  it('every picked id is in the table', () => {
    for (const r of [ride(), ride({ flies: true }), ride({ boat: true, rideT: 99 }), ride({ seat: 0, kind: 'taxi' })]) {
      const id = r.seat > 0 ? passengerAnim(r) : driverAnim(r, true);
      expect(id && animById(id), String(id)).toBeTruthy();
    }
  });
  it('the ride animator poses a passenger and puts it back on cancel', () => {
    const m = createGnomeModel(GNORMAN_LOOK);
    const ra = createRideAnimator();
    const { rideT: _t, ...info } = ride({ flies: true, fixedWing: true });
    for (let i = 0; i < 30; i++) ra.update(m, info, 1 / 60);
    expect(ra.animator.current?.id).toBe('plane-passenger');
    ra.update(m, { ...info, seat: 0, kind: 'ride-on', flies: false, fixedWing: false }, 1 / 60, true);
    expect(['drive-road-rage', 'drive-honk-pound']).toContain(ra.animator.current?.id);
    ra.cancel(m);
    expect(ra.animator.active).toBe(false);
    expect(m.rig.rotation.x).toBe(0);
  });
});

describe('personas', () => {
  it('every archetype walks, stands and pairs with ids from the table', () => {
    for (const p of PERSONAS) {
      const w = walkStyleFor(p, seq(0.9), { night: 0 });
      if (w) expect(animById(w), w).toBeTruthy();
      for (const biome of ['city', 'tundra', 'desert', 'parkland', 'loch']) {
        for (let k = 0; k < 10; k++) {
          const id = idleFor(p, biome, seq(k / 10, 0.37, 0.71), { night: k / 10 });
          expect(animById(id), `${p}/${biome}: ${id}`).toBeTruthy();
        }
      }
    }
    for (const [a, b] of PAIR_PICKS) {
      expect(animById(a)?.pair, a).toBe(b);
    }
    expect(pairFor('sulk', 'pompous')).toEqual(['pair-argue', 'pair-argue']);
    expect(PERSONAS).toContain(personaFor('grumpy', seq(0.5)));
  });
  it('the cold and the heat show', () => {
    expect(idleFor('plain', 'tundra', seq(0.1))).toBe('shiver-fells');
    expect(idleFor('plain', 'desert', seq(0.1))).toBe('sweat-heat');
    expect(walkStyleFor('jaunty', seq(0.1), { night: 0.9 })).toBe('walk-sleepy');
  });
  it('faces a partner', () => {
    expect(yawToward(0, 0, 0, 1)).toBeCloseTo(0);
    expect(yawToward(0, 0, 1, 0)).toBeCloseTo(Math.PI / 2);
  });
});

describe('player fidget', () => {
  it('waits IDLE_DELAY of standing still, resets on input, picks real ids', () => {
    const f = createIdleFidget(seq(0.3));
    let got = null;
    for (let t = 0; t < IDLE_DELAY - 0.5; t += 0.1) got = f.update(0.1, true, 'city', 0) ?? got;
    expect(got).toBeNull();
    expect(f.update(0.1, false, 'city', 0)).toBeNull();
    for (let t = 0; t <= IDLE_DELAY + 0.2 && !got; t += 0.1) got = f.update(0.1, true, 'city', 0);
    expect(got && animById(got)).toBeTruthy();
    expect(pickFidget('tundra', 0, seq(0.1))).toBe('shiver-fells');
  });
});
