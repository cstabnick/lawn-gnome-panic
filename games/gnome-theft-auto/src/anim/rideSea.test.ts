import { describe, expect, it } from 'vitest';
import { LONG_RIDE_S, passengerAnim, type RideInfo } from './rideAuto';

const boatRider = (over: Partial<RideInfo> = {}): RideInfo => ({
  kind: 'walnut-dinghy', flies: false, fixedWing: false, boat: true, closed: false, seat: 1, speedFrac: 0.3, rideT: 10, seed: 1,
  ...over,
});

/** The pre-waves rule for a boat passenger, copied from the old passengerAnim, to pin sea 0 to it. */
const oldBoatRule = (seed: number, rideT: number): 'seasick' | 'boat-lookout' => {
  let h = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  const hv = (Math.imul(h, 0xc2b2ae35) >>> 0) / 4294967296;
  return rideT > LONG_RIDE_S && hv < 0.35 ? 'seasick' : 'boat-lookout';
};

describe('seasickness by sea state', () => {
  it('sea 0 (or absent) is exactly the old boat rule for every seed and ride length', () => {
    for (let seed = 0; seed < 200; seed++) {
      for (const rideT of [0, 10, LONG_RIDE_S - 1, LONG_RIDE_S + 1, 90]) {
        const want = oldBoatRule(seed, rideT);
        expect(passengerAnim(boatRider({ seed, rideT, sea: 0 }))).toBe(want);
        expect(passengerAnim(boatRider({ seed, rideT }))).toBe(want);
      }
    }
  });

  it('a rough sea (sea 1) can make a boat passenger seasick at rideT 15, for some seeds', () => {
    let seasick = 0;
    for (let seed = 0; seed < 200; seed++) {
      if (passengerAnim(boatRider({ seed, rideT: 15, sea: 1 })) === 'seasick') seasick++;
    }
    expect(seasick).toBeGreaterThan(0);
    // Calm water at the same ride length does not make anyone seasick (15 s is under LONG_RIDE_S).
    for (let seed = 0; seed < 200; seed++) {
      expect(passengerAnim(boatRider({ seed, rideT: 15, sea: 0 }))).toBe('boat-lookout');
    }
  });

  it('never seasick when the vehicle is not a boat', () => {
    for (let seed = 0; seed < 200; seed++) {
      const r = boatRider({ seed, rideT: 90, sea: 1, boat: false, kind: 'ride-on' });
      expect(passengerAnim(r)).not.toBe('seasick');
    }
  });
});
