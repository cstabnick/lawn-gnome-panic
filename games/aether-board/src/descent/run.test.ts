import { describe, expect, it } from 'vitest';
import { ASSIST, TUNE } from '../config';
import type { HillCard, RunState } from './types';
import { DESCENT } from './types';
import { PERK_IDS, PERKS, applyPerks } from './perks';
import { choosePerk, createRun, crash, finishHill, offerHills, startHill } from './run';

/** A hand-made card with known numbers, for the rule tests. */
function handCard(over: Partial<HillCard> = {}): HillCard {
  return {
    seed: 1,
    params: { hazard: 1, steep: 1, tricky: 1, runs: 5 },
    name: 'Test Run',
    difficulty: 3,
    mult: 2,
    rewards: [],
    bonusTarget: 1000,
    bonusReward: { kind: 'shield', amount: 1 },
    boss: false,
    ...over,
  };
}

function rideRun(seed = 1, card: HillCard = handCard()): RunState {
  const run = createRun(seed);
  startHill(run, card);
  return run;
}

describe('offerHills', () => {
  it('is deterministic for the same run seed and hill', () => {
    const run = createRun(42);
    expect(offerHills(run)).toEqual(offerHills(run));
    const other = createRun(43);
    expect(offerHills(other)).not.toEqual(offerHills(run));
  });

  it('offers 3 cards on a normal hill and 1 boss card on hill 4', () => {
    const run = createRun(7);
    const normal = offerHills(run);
    expect(normal).toHaveLength(DESCENT.cardsOffered);
    expect(normal.every((c) => !c.boss)).toBe(true);

    run.hill = 3;
    const boss = offerHills(run);
    expect(boss).toHaveLength(1);
    expect(boss[0].boss).toBe(true);
    expect(boss[0].name).toBe('The Shard Throne');
    expect(boss[0].params.runs).toBe(DESCENT.bossRuns);
  });

  it('gives sliders as integers 0..5 on every hill of a run', () => {
    for (const seed of [1, 99, 123456]) {
      const run = createRun(seed);
      for (let hill = 0; hill < DESCENT.hills; hill++) {
        run.hill = hill;
        for (const card of offerHills(run)) {
          for (const v of [card.params.hazard, card.params.steep, card.params.tricky]) {
            expect(Number.isInteger(v)).toBe(true);
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(5);
          }
        }
      }
    }
  });

  it('gives the hard card a multiplier at least as big as the easy card', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      for (let hill = 0; hill < DESCENT.hills; hill++) {
        const run = createRun(seed);
        run.hill = hill;
        const cards = offerHills(run);
        if (cards.length === 3) expect(cards[2].mult).toBeGreaterThanOrEqual(cards[0].mult);
      }
    }
  });

  it('gives card seeds that are at least 1', () => {
    const run = createRun(5);
    for (const card of offerHills(run)) expect(card.seed).toBeGreaterThanOrEqual(1);
  });
});

describe('crash', () => {
  it('spends a shield first, then lives, and ends the run at 0 lives', () => {
    const run = rideRun();
    run.shields = 1;

    expect(crash(run)).toEqual({ shielded: true, livesLeft: DESCENT.startLives, over: false });
    expect(run.shields).toBe(0);
    expect(run.lives).toBe(DESCENT.startLives);

    expect(crash(run)).toEqual({ shielded: false, livesLeft: 2, over: false });
    expect(crash(run)).toEqual({ shielded: false, livesLeft: 1, over: false });
    expect(run.phase).toBe('ride');

    expect(crash(run)).toEqual({ shielded: false, livesLeft: 0, over: true });
    expect(run.phase).toBe('over');
    expect(run.current).toBeNull();
  });

  it('changes nothing when not riding', () => {
    const run = createRun(1);
    const before = structuredClone(run);
    expect(crash(run)).toEqual({ shielded: false, livesLeft: DESCENT.startLives, over: false });
    expect(run).toEqual(before);
  });
});

describe('startHill', () => {
  it('refills shields from luckyHat', () => {
    const run = createRun(1);
    run.perks.luckyHat = 2;
    startHill(run, handCard());
    expect(run.shields).toBe(2);
    expect(run.phase).toBe('ride');
    expect(run.current).not.toBeNull();
  });
});

describe('finishHill', () => {
  it('banks score with the card multiplier and showboat', () => {
    const run = rideRun(1, handCard({ mult: 2 }));
    run.perks.showboat = 2;
    const result = finishHill(run, 500);
    expect(result.banked).toBe(Math.round(500 * 2 * 1.3));
    expect(run.score).toBe(result.banked);
    expect(run.hill).toBe(1);
    expect(run.phase).toBe('reward');
    expect(run.current).toBeNull();
  });

  it('turns a life past maxLives into a shield', () => {
    const run = rideRun(1, handCard({ rewards: [{ kind: 'life', amount: 1 }] }));
    run.lives = run.maxLives;
    finishHill(run, 0);
    expect(run.lives).toBe(run.maxLives);
    expect(run.shields).toBe(1);
  });

  it('adds a life below maxLives', () => {
    const run = rideRun(1, handCard({ rewards: [{ kind: 'life', amount: 1 }] }));
    run.lives = 1;
    finishHill(run, 0);
    expect(run.lives).toBe(2);
    expect(run.shields).toBe(0);
  });

  it('grants the bonus reward only at or above bonusTarget', () => {
    const card = handCard({ bonusTarget: 1000, bonusReward: { kind: 'shield', amount: 1 } });

    const miss = rideRun(1, card);
    const missResult = finishHill(miss, 999);
    expect(missResult.bonusHit).toBe(false);
    expect(missResult.granted).toEqual([]);
    expect(miss.shields).toBe(0);

    const hit = rideRun(1, card);
    const hitResult = finishHill(hit, 1000);
    expect(hitResult.bonusHit).toBe(true);
    expect(hitResult.granted).toEqual([{ kind: 'shield', amount: 1 }]);
    expect(hit.shields).toBe(1);
  });

  it('offers distinct perks, at most 4, that are below their max', () => {
    const run = rideRun(3, handCard({ rewards: [{ kind: 'perk', amount: 3 }] }));
    run.perks.showboat = PERKS.showboat.max;
    const result = finishHill(run, 0);
    expect(result.perkChoices).toHaveLength(3);
    expect(new Set(result.perkChoices).size).toBe(3);
    expect(result.perkChoices).not.toContain('showboat');
    for (const id of result.perkChoices) expect(PERK_IDS).toContain(id);
  });

  it('returns a zero result and changes nothing when no hill is being ridden', () => {
    const run = createRun(1);
    const result = finishHill(run, 500);
    expect(result).toEqual({ hillScore: 500, banked: 0, bonusHit: false, granted: [], perkChoices: [] });
    expect(run.hill).toBe(0);
    expect(run.score).toBe(0);
  });
});

describe('choosePerk', () => {
  it('caps a perk at its max', () => {
    const run = createRun(1);
    run.perks.bigPop = PERKS.bigPop.max;
    run.phase = 'reward';
    choosePerk(run, 'bigPop');
    expect(run.perks.bigPop).toBe(PERKS.bigPop.max);
    expect(run.phase).toBe('pick');
  });

  it('raises a perk by one level and skipping changes nothing', () => {
    const run = createRun(1);
    choosePerk(run, 'quickFeet');
    expect(run.perks.quickFeet).toBe(1);
    choosePerk(run, null);
    expect(run.perks).toEqual({ quickFeet: 1 });
  });

  it('thickSkull also adds a max life and a life', () => {
    const run = createRun(1);
    choosePerk(run, 'thickSkull');
    expect(run.maxLives).toBe(DESCENT.maxLives + 1);
    expect(run.lives).toBe(DESCENT.startLives + 1);
  });

  it('sets won after the last hill and pick before it', () => {
    const run = createRun(1);
    run.hill = DESCENT.hills - 1;
    choosePerk(run, null);
    expect(run.phase).toBe('pick');

    run.hill = DESCENT.hills;
    choosePerk(run, null);
    expect(run.phase).toBe('won');
  });
});

describe('applyPerks', () => {
  it('raises TUNE.ollieMax with bigPop and restores it exactly with no perks', () => {
    const base = TUNE.ollieMax;
    applyPerks({ bigPop: 2 });
    expect(TUNE.ollieMax).toBeCloseTo(base * (1 + 0.08 * 2), 10);
    applyPerks({});
    expect(TUNE.ollieMax).toBe(base);
  });

  it('gives every perk a description', () => {
    for (const id of PERK_IDS) expect(PERKS[id].desc.length).toBeGreaterThan(0);
  });

  it('sets ASSIST.bigAirTol from softKnees and ASSIST.closeCall from daredevil', () => {
    applyPerks({ softKnees: 2, daredevil: 1 });
    expect(ASSIST.bigAirTol).toBeCloseTo(1.3, 10);
    expect(ASSIST.closeCall).toBeCloseTo(1.5, 10);
    applyPerks({});
    expect(ASSIST.bigAirTol).toBe(1);
    expect(ASSIST.closeCall).toBe(1);
  });

  it('leaves ASSIST.landSaves to the app', () => {
    ASSIST.landSaves = 3;
    applyPerks({ guardianGnome: 2 });
    expect(ASSIST.landSaves).toBe(3);
    applyPerks({});
    expect(ASSIST.landSaves).toBe(3);
    ASSIST.landSaves = 0;
  });
});
