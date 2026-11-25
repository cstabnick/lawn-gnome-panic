// Pins the money grind curve (E08 A15, L32): equipment costs more, jobs pay a bit more, and the big buys take a few
// hours of job play, not endless grinding.
//
// Acorns per minute of job play (the formula): for each job, a typical gig's base pay from JOB_TUNING at the level's
// payMult (perksFor), divided by an assumed gig length in minutes (wait + drive + next offer), then the four jobs are
// averaged. Tips and condition bonuses are left out (they roughly cancel the gigs that fail). The gig sizes and lengths
// are the constants below; they are judgments, not measurements, so the bands in the tests are wide.
import { describe, expect, it } from 'vitest';
import { DEALERS, DEALER_IDS } from './dealers/config';
import { BAITS, RODS } from './fishing/tackle';
import { CRAFT_STATS } from './craft/tuning';
import { GUN_MODS } from './gunMods';
import { JOB_TUNING, perksFor } from './jobs/defs';
import { ESTATES } from './lockup/config';

/** Typical straight-line distance of a fare or water-taxi trip (m), and of a pilot charter. */
const FARE_DIST = 300;
const CHARTER_DIST = 1000;
/** A courier round: this many parcels of the three common kinds (food, fragile, heavy). */
const PARCELS = 3;
/** Minutes per gig, offer to payout (the 9 s next-offer gap included). */
const GIG_MIN = { taxi: 2.5, courier: 3.5, pilot: 3, boat: 2.5 };

function gigPay(level: number): { taxi: number; courier: number; pilot: number; boat: number } {
  const m = perksFor('taxi', level).payMult;
  const T = JOB_TUNING;
  const parcel = (T.courier.pay.food + T.courier.pay.fragile + T.courier.pay.heavy) / 3;
  return {
    taxi: (T.taxi.base + T.taxi.perM * FARE_DIST) * m,
    courier: parcel * PARCELS * m,
    pilot: (T.pilot.charterBase + T.pilot.perM * CHARTER_DIST) * m,
    boat: (T.boat.base + T.boat.perM * FARE_DIST) * m,
  };
}

/** Acorns per minute of job play at a job level (average over the four jobs). */
export function acornsPerMinute(level: number): number {
  const p = gigPay(level);
  const rates = [p.taxi / GIG_MIN.taxi, p.courier / GIG_MIN.courier, p.pilot / GIG_MIN.pilot, p.boat / GIG_MIN.boat];
  return rates.reduce((a, b) => a + b, 0) / rates.length;
}

const minutesToAfford = (price: number, level: number): number => price / acornsPerMinute(level);

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const n = s.length;
  return n % 2 ? s[(n - 1) >> 1] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

const allStock = DEALER_IDS.flatMap((id) => DEALERS[id].stock);
const modPrices = GUN_MODS.map((m) => m.price);

describe('economy curve', () => {
  it('pays a sensible rate that rises with level', () => {
    const l1 = acornsPerMinute(1);
    expect(l1).toBeGreaterThan(15);
    expect(l1).toBeLessThan(60);
    expect(acornsPerMinute(4)).toBeGreaterThan(l1);
  });

  it('the cheapest dealer vehicle is within 10 minutes at level 1', () => {
    const cheapest = Math.min(...allStock.map((s) => s.price));
    expect(minutesToAfford(cheapest, 1)).toBeLessThanOrEqual(10);
  });

  it('a mid gun mod takes 5 to 30 minutes', () => {
    const mins = minutesToAfford(median(modPrices), 1);
    expect(mins).toBeGreaterThanOrEqual(5);
    expect(mins).toBeLessThanOrEqual(30);
  });

  it('Hangar Two takes 20 to 90 minutes', () => {
    const mins = minutesToAfford(ESTATES.hangar.price, 1);
    expect(mins).toBeGreaterThanOrEqual(20);
    expect(mins).toBeLessThanOrEqual(90);
  });

  it('the dearest dealer vehicle takes 60 to 240 minutes at level 4', () => {
    const dearest = Math.max(...allStock.map((s) => s.price));
    const mins = minutesToAfford(dearest, 4);
    expect(mins).toBeGreaterThanOrEqual(60);
    expect(mins).toBeLessThanOrEqual(240);
  });

  it('the dearest aircraft stays the 1.5 to 3 hour goal', () => {
    const dearestAir = Math.max(...DEALERS.winglot.stock.map((s) => s.price));
    const mins = minutesToAfford(dearestAir, 4);
    expect(mins).toBeGreaterThanOrEqual(90);
    expect(mins).toBeLessThanOrEqual(180);
  });

  it('equipment tables cost at least 1.4x what they did', () => {
    // Old medians, before the money pass (L32).
    const OLD_GUN_MOD_MEDIAN = 150;
    const OLD_ROD_MEDIAN = 300; // 20, 150, 450, 1200
    const OLD_BAIT_MEDIAN = 20; // the priced baits: 8, 12, 20, 60, 90
    const OLD_TUNE_MEDIAN = 270; // the twelve craft tuning prices
    const OLD_HANGAR = 1200;
    const OLD_BOATHOUSE = 800;
    expect(median(modPrices)).toBeGreaterThanOrEqual(OLD_GUN_MOD_MEDIAN * 1.4);
    expect(median(RODS.map((r) => r.price))).toBeGreaterThanOrEqual(OLD_ROD_MEDIAN * 1.4);
    expect(median(BAITS.filter((b) => b.price > 0).map((b) => b.price))).toBeGreaterThanOrEqual(OLD_BAIT_MEDIAN * 1.4);
    expect(median(CRAFT_STATS.flatMap((s) => [...s.prices]))).toBeGreaterThanOrEqual(OLD_TUNE_MEDIAN * 1.4);
    expect(ESTATES.hangar.price).toBeGreaterThanOrEqual(OLD_HANGAR * 1.4);
    expect(ESTATES.boathouse.price).toBeGreaterThanOrEqual(OLD_BOATHOUSE * 1.4);
  });
});
