import { describe, expect, it } from 'vitest';
import { newComfort, stepComfort, starsFor, landingScore, cargoScore, cargoLanding, payFor } from './rating';
import { startGig } from './gig';
import type { ComfortState, Gig, GigState, JobPerks, Sample, Stop, Surge } from './types';

function sample(over: Partial<Sample> = {}): Sample {
  return {
    x: 0, y: 0, z: 0, speed: 0, yaw: 0, vy: 0, aboveGround: 0, hpLoss: 0, ranOver: false, waveSlope: 0,
    stalled: false, action: false, inVehicle: true, playerAboard: false, ...over,
  };
}

/** A comfort state that has already seen one frame at speed 10, with the given score. */
function primed(score: number): ComfortState {
  const c = newComfort();
  c.primed = true;
  c.score = score;
  c.lastSpeed = 10;
  return c;
}

const perks: JobPerks = { tipMult: 1, payMult: 1, spawnMult: 1, kinds: [], capacity: 1, lines: [] };
const surge: Surge = { rush: false, storm: false, celebrity: false, payMult: 1, spawnMult: 1, label: null };

function gigOf(stops: Stop[], over: Partial<Gig> = {}): Gig {
  return {
    job: 'taxi', kind: 'fare', title: 'Test', client: 'Tester', personality: 'plain', stops, basePay: 100,
    timeLimit: 0, passengers: 1, parcels: [], seed: 1, ...over,
  };
}

const stop: Stop = { id: 'a', name: 'A', x: 0, z: 0, action: 'drop', radius: 9, maxSpeed: 3, dwell: 0 };

/** A finished gig with one reached stop and the given comfort score. */
function doneState(gig: Partial<Gig> = {}, comfort = 100): GigState {
  const st = startGig(gigOf([stop], gig));
  st.phase = 'done';
  st.idx = 1;
  st.reachedAt = [0];
  st.comfort.score = comfort;
  return st;
}

describe('stepComfort', () => {
  it('primes on the first sample without penalty', () => {
    const c = newComfort();
    stepComfort(c, sample({ speed: 20 }), 0.1, 'plain', 'taxi', false);
    expect(c.primed).toBe(true);
    expect(c.score).toBe(100);
    expect(c.lastSpeed).toBe(20);
  });

  it('loses score to harsh braking and recovers slowly when smooth', () => {
    const c = primed(50);
    stepComfort(c, sample({ speed: 0 }), 0.1, 'plain', 'taxi', false);
    const afterBrake = c.score;
    expect(afterBrake).toBeLessThan(50);
    stepComfort(c, sample({ speed: 0 }), 0.1, 'plain', 'taxi', false);
    expect(c.score - afterBrake).toBeCloseTo(0.15, 5);
  });

  it('counts crashes and run-overs', () => {
    const c = primed(100);
    stepComfort(c, sample({ speed: 10, hpLoss: 1 }), 0.1, 'plain', 'taxi', false);
    expect(c.crashes).toBe(1);
    stepComfort(c, sample({ speed: 10, ranOver: true }), 0.1, 'plain', 'taxi', false);
    expect(c.runOvers).toBe(1);
    expect(c.score).toBeLessThan(100);
  });

  it('nervous riders lose twice as much as plain ones', () => {
    const plain = primed(50);
    const nervous = primed(50);
    stepComfort(plain, sample({ speed: 0 }), 0.1, 'plain', 'taxi', false);
    stepComfort(nervous, sample({ speed: 0 }), 0.1, 'nervous', 'taxi', false);
    // Both gain the same recovery, so the drop from 50 + recovery doubles.
    const plainLoss = 50 + 0.15 - plain.score;
    const nervousLoss = 50 + 0.15 - nervous.score;
    expect(nervousLoss).toBeCloseTo(2 * plainLoss, 5);
  });

  it('hurry riders lose half as much', () => {
    const plain = primed(50);
    const hurry = primed(50);
    stepComfort(plain, sample({ speed: 0 }), 0.1, 'plain', 'taxi', false);
    stepComfort(hurry, sample({ speed: 0 }), 0.1, 'hurry', 'taxi', false);
    expect(50 + 0.15 - hurry.score).toBeCloseTo((50 + 0.15 - plain.score) / 2, 5);
  });

  it('keeps score inside 0..100', () => {
    const c = primed(1);
    for (let i = 0; i < 5; i++) stepComfort(c, sample({ speed: 0, hpLoss: 1 }), 0.1, 'nervous', 'taxi', false);
    expect(c.score).toBeGreaterThanOrEqual(0);
    expect(c.score).toBeLessThanOrEqual(100);
  });

  it('boat rough water uses the storm threshold', () => {
    const calm = primed(100);
    const storm = primed(100);
    const s = sample({ speed: 5, waveSlope: 0.2 }); // rough = 1.0: above 0.9 in a storm, below 1.2 in calm
    stepComfort(calm, s, 0.1, 'plain', 'boat', false);
    stepComfort(storm, s, 0.1, 'plain', 'boat', true);
    expect(calm.rough).toBe(0);
    expect(storm.rough).toBeCloseTo(0.1, 5);
  });

  it('pilot stalls cost comfort and are timed', () => {
    const c = primed(100);
    stepComfort(c, sample({ speed: 10, stalled: true, aboveGround: 50 }), 0.5, 'plain', 'pilot', false);
    expect(c.stalls).toBeCloseTo(0.5, 5);
    expect(c.air).toBe(0);
  });
});

describe('starsFor', () => {
  it('maps the comfort score to stars', () => {
    expect(starsFor(95, 0)).toBe(5);
    expect(starsFor(80, 0)).toBe(4);
    expect(starsFor(60, 0)).toBe(3);
    expect(starsFor(40, 0)).toBe(2);
    expect(starsFor(10, 0)).toBe(1);
  });

  it('takes a star off when slightly late and two when very late', () => {
    expect(starsFor(95, 1.2)).toBe(4);
    expect(starsFor(95, 1.6)).toBe(3);
    expect(starsFor(95, 1.15)).toBe(5);
  });

  it('never goes below 1 star', () => {
    expect(starsFor(10, 3)).toBe(1);
  });
});

describe('scores', () => {
  it('landingScore: centre and soft touchdown give 100', () => {
    expect(landingScore(0, 10, 0)).toBe(100);
  });

  it('landingScore: outside the zone and a hard touchdown give 0', () => {
    expect(landingScore(10, 10, -6)).toBe(0);
  });

  it('landingScore: a firm touchdown scores between', () => {
    expect(landingScore(0, 10, -3)).toBe(84);
  });

  it('cargoScore: scales over 60 m', () => {
    expect(cargoScore(0)).toBe(100);
    expect(cargoScore(30)).toBe(50);
    expect(cargoScore(60)).toBe(0);
    expect(cargoScore(200)).toBe(0);
  });

  it('cargoLanding: drifts by velocity times fall time', () => {
    // h = 9 m: t = sqrt(18 / 18) = 1 s.
    expect(cargoLanding(10, 20, 9, 3, -4)).toEqual({ x: 13, z: 16 });
    expect(cargoLanding(10, 20, 0, 3, -4)).toEqual({ x: 10, z: 20 });
  });
});

describe('payFor', () => {
  it('pays more for 5 stars than for 1', () => {
    const five = payFor(doneState({}, 95), perks, surge);
    const one = payFor(doneState({}, 10), perks, surge);
    expect(five.stars).toBe(5);
    expect(one.stars).toBe(1);
    expect(five.total).toBeGreaterThan(one.total);
    expect(five.tip).toBeGreaterThan(0);
    expect(one.tip).toBe(0);
  });

  it('applies the celebrity multiplier to base pay and doubles the tip rate', () => {
    const plain = payFor(doneState({}, 95), perks, surge);
    const celeb = payFor(doneState({}, 95), perks, { ...surge, celebrity: true });
    expect(plain.base).toBe(100);
    expect(celeb.base).toBe(200);
    // Tip is a share of base (x2) and the tip rate doubles again (x2): four times the plain tip.
    expect(celeb.tip).toBe(plain.tip * 4);
  });

  it('adds the real-player fare bonus', () => {
    const r = payFor(doneState({ kind: 'player-fare' }, 95), perks, surge);
    expect(r.bonus).toBe(30);
    expect(r.notes).toContain('Real gnome +30');
  });

  it('pays less for a fragile parcel in poor condition', () => {
    const st = doneState({ parcels: ['fragile'] }, 95);
    st.condition = 0.5;
    const r = payFor(st, perks, surge);
    expect(r.base).toBe(70);
  });

  it('takes money off for late soft dues', () => {
    const st = doneState({}, 95);
    st.gig = gigOf([{ ...stop, due: 10 }]);
    st.reachedAt = [20];
    const r = payFor(st, perks, surge);
    expect(r.time).toBe(-5);
    expect(r.notes).toContain('Late -5');
  });

  it('is never negative', () => {
    const stops: Stop[] = Array.from({ length: 12 }, (_, i) => ({ ...stop, id: `s${i}`, due: 1 }));
    const st = doneState({ timeLimit: 10 }, 10);
    st.gig = gigOf(stops, { timeLimit: 10 });
    st.reachedAt = Array.from({ length: 12 }, () => 100);
    st.t = 1000;
    const r = payFor(st, perks, surge);
    expect(r.total).toBe(0);
  });
});
