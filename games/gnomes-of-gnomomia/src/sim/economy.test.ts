/// <reference types="node" />
// Economy regression test: fails when a data edit re-front-loads the economy, flattens its curve, or eats the margin.
// - checkEconomy() raises no flags for any class with the default player, and no MARGIN_FLAGS for any PLAYER_VARIANT
//   (more potions, slower kills, one clear per phase, fewer hits): the targets must hold with room to spare.
// - The curve is pinned in economy.golden.json, per class (default player and every variant): per phase levelOut
//   exactly, coinsPerHour / xpPerNormalKill as ratios to Mossbottom, carryRatio, capTimeShare and kitShare; per run
//   total hours, the hours to reach levels 10, 20 and 30, and the coins left at the end, within TOL below. Absolute
//   hours and coins are pinned, so a uniform change (all gold x2) fails it too: the last test proves that.
//   Only numbers are pinned, so rewording gate `why` text or any other string never touches it.
// - The level-70 PROJECTION (runEconomy({ cap: 70 })) raises exactly EXPECTED_PROJECTION_FLAGS and nothing else.
// Regenerate the golden only for a deliberate retune (then review the diff of economy.golden.json):
//   UPDATE_GOLDEN=1 npm test -w games/gnomes-of-gnomomia -- src/sim/economy.test.ts   (from the repo root)
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ClassId, Gate } from '../config';
import { ENEMIES, ITEMS } from '../content';
import { TALENTS } from '../data/classes';
import { ECONOMY } from '../data/economy';
import { coinMult, killXpAt, xpToNextLevel } from '../economy';
import { gateOpen } from '../gates';
import { newGameState, state } from '../state';
import { TacticalPlayer } from './agents';
import {
  DEFAULT_PLAYER, ECONOMY_TARGETS, EXPECTED_PROJECTION_FLAGS, MARGIN_FLAGS, PLAYER_VARIANTS,
  buildFlagIndex, checkEconomy, isExpectedProjectionFlag, killsPerLevelAt, runEconomy, type EconomyReport,
} from './economy';
import { runMonteCarlo } from './runner';

const CLASSES: readonly ClassId[] = ['warden', 'slinger', 'mage'];
const VARIANTS = ['default', ...Object.keys(PLAYER_VARIANTS)];
const GOLDEN = join(dirname(fileURLToPath(import.meta.url)), 'economy.golden.json');

/** Allowed drift from the golden. Ratios are relative (0.15 = +-15%); bands are absolute. */
const TOL = {
  coinsPerHourRatio: 0.15,
  xpPerNormalKillRatio: 0.15,
  /** Coins carried out / next kit cost: +-0.2 absolute (null, no shop next, must stay null). */
  carryRatioBand: 0.2,
  /** Share of weapon-skill uses landing at the cap: +-0.1 absolute. */
  capTimeShareBand: 0.1,
  /** Share of the phase's own kit owned at its end: +-0.1 absolute (null must stay null). */
  kitShareBand: 0.1,
  /** Total hours and hours to level 10 / 20 / 30: +-10%. */
  hoursRel: 0.1,
  /** Coins left at the end: +-15%. */
  coinsLeftRel: 0.15,
};

interface GoldenPhase {
  id: string;
  levelOut: number;
  coinsPerHourRatio: number;
  xpPerNormalKillRatio: number;
  carryRatio: number | null;
  capTimeShare: number;
  kitShare: number | null;
}
interface GoldenRun { hours: number; levelHours: { 10: number | null; 20: number | null; 30: number | null }; coinsLeft: number; phases: GoldenPhase[] }
/** class -> variant -> run */
type Golden = Record<string, Record<string, GoldenRun>>;

const r3 = (x: number): number => Math.round(x * 1000) / 1000;

function shape(report: EconomyReport): GoldenRun {
  const first = report.phases[0];
  return {
    hours: report.totals.hours,
    levelHours: { 10: report.levelHours[10], 20: report.levelHours[20], 30: report.levelHours[30] },
    coinsLeft: report.totals.coinsLeft,
    phases: report.phases.map((p) => ({
      id: p.id,
      levelOut: p.levelOut,
      coinsPerHourRatio: r3(p.coinsPerHour / first.coinsPerHour),
      xpPerNormalKillRatio: r3(p.xpPerNormalKill / first.xpPerNormalKill),
      carryRatio: p.carryRatio,
      capTimeShare: p.capTimeShare,
      kitShare: p.kitShare,
    })),
  };
}

/** Every way `got` misses `want` beyond TOL (empty = matches). */
function compareRun(at: string, got: GoldenRun, want: GoldenRun): string[] {
  const out: string[] = [];
  const rel = (a: number, b: number) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-9);
  const band = (name: string, a: number | null, b: number | null, tol: number) => {
    if (b === null || a === null) { if (a !== b) out.push(`${name} ${a} vs ${b}`); return; }
    if (Math.abs(a - b) > tol) out.push(`${name} ${a} vs ${b}`);
  };
  if (rel(got.hours, want.hours) > TOL.hoursRel) out.push(`${at} hours ${got.hours} vs ${want.hours}`);
  for (const L of [10, 20, 30] as const) {
    const g = got.levelHours[L], w = want.levelHours[L];
    if (g === null || w === null ? g !== w : rel(g, w) > TOL.hoursRel) out.push(`${at} hours to level ${L} ${g} vs ${w}`);
  }
  if (rel(got.coinsLeft, want.coinsLeft) > TOL.coinsLeftRel) out.push(`${at} coinsLeft ${got.coinsLeft} vs ${want.coinsLeft}`);
  if (got.phases.map((p) => p.id).join() !== want.phases.map((p) => p.id).join()) {
    out.push(`${at} phases ${got.phases.map((p) => p.id).join()} vs ${want.phases.map((p) => p.id).join()}`);
    return out;
  }
  got.phases.forEach((p, i) => {
    const w = want.phases[i];
    const ph = `${at}/${p.id}`;
    if (p.levelOut !== w.levelOut) out.push(`${ph} levelOut ${p.levelOut} vs ${w.levelOut}`);
    if (rel(p.coinsPerHourRatio, w.coinsPerHourRatio) > TOL.coinsPerHourRatio) out.push(`${ph} coinsPerHour ratio ${p.coinsPerHourRatio} vs ${w.coinsPerHourRatio}`);
    if (rel(p.xpPerNormalKillRatio, w.xpPerNormalKillRatio) > TOL.xpPerNormalKillRatio) out.push(`${ph} xpPerNormalKill ratio ${p.xpPerNormalKillRatio} vs ${w.xpPerNormalKillRatio}`);
    band(`${ph} carryRatio`, p.carryRatio, w.carryRatio, TOL.carryRatioBand);
    band(`${ph} capTimeShare`, p.capTimeShare, w.capTimeShare, TOL.capTimeShareBand);
    band(`${ph} kitShare`, p.kitShare, w.kitShare, TOL.kitShareBand);
  });
  return out;
}

function runAll(): Golden {
  const g: Golden = {};
  for (const c of CLASSES) {
    g[c] = {};
    for (const v of VARIANTS) g[c][v] = shape(runEconomy({ classId: c, ...(v === 'default' ? {} : PLAYER_VARIANTS[v]) }));
  }
  return g;
}

function compareAll(got: Golden, want: Golden, classes: readonly ClassId[] = CLASSES): string[] {
  const out: string[] = [];
  for (const c of classes) for (const v of VARIANTS) {
    if (!want[c]?.[v]) { out.push(`no golden for ${c}/${v}`); continue; }
    out.push(...compareRun(`${c}/${v}`, got[c][v], want[c][v]));
  }
  return out;
}

const reports = Object.fromEntries(CLASSES.map((c) => [c, runEconomy({ classId: c })])) as Record<ClassId, EconomyReport>;

describe('economy sim: no flags', () => {
  for (const c of CLASSES) {
    it(`${c}: checkEconomy finds nothing (default player)`, () => {
      expect(checkEconomy(reports[c]).map((f) => f.message)).toEqual([]);
    });
    for (const v of Object.keys(PLAYER_VARIANTS)) {
      it(`${c}: no margin flags for the ${v} player`, () => {
        const r = runEconomy({ classId: c, ...PLAYER_VARIANTS[v] });
        expect(checkEconomy(r, 'margin').map((f) => f.message)).toEqual([]);
      });
    }
  }

  it('the margin set includes TOO_POOR and SKILL_CAPPED_EARLY', () => {
    expect(MARGIN_FLAGS).toContain('TOO_POOR');
    expect(MARGIN_FLAGS).toContain('SKILL_CAPPED_EARLY');
  });

  it('the classes train different skills and print different numbers', () => {
    expect(reports.warden.phases.at(-1)!.activeSkills.every((s) => s === 'blade' || s === 'blunt')).toBe(true);
    expect(reports.slinger.phases.at(-1)!.activeSkills).toEqual(['marksmanship']);
    expect([...reports.mage.phases.at(-1)!.activeSkills].sort()).toEqual(['bloom', 'rain', 'sun']);
    const ends = CLASSES.map((c) => reports[c].phases.map((p) => p.weaponSkill).join('/'));
    expect(new Set(ends).size).toBe(3);
  });
});

describe('economy curve golden', () => {
  const current = runAll();
  if (process.env.UPDATE_GOLDEN) writeFileSync(GOLDEN, JSON.stringify(current, null, 2) + '\n');

  it('golden file exists (UPDATE_GOLDEN=1 writes it)', () => {
    expect(existsSync(GOLDEN)).toBe(true);
  });
  const golden: Golden = existsSync(GOLDEN) ? JSON.parse(readFileSync(GOLDEN, 'utf8')) : {};

  for (const c of CLASSES) {
    it(`${c}: curve shape, hours and coins left match the golden (default and every variant)`, () => {
      expect(compareAll(current, golden, [c])).toEqual([]);
    });
  }

  it('a uniform x2 on all quest and enemy gold fails the golden', () => {
    const coins = ECONOMY.coins as { scale: number };
    const old = coins.scale;
    coins.scale = old * 2;
    try {
      const doubled = runAll();
      const misses = compareAll(doubled, golden);
      expect(misses.length).toBeGreaterThan(0);
      expect(misses.some((m) => m.includes('coinsLeft'))).toBe(true);
    } finally {
      coins.scale = old;
    }
  }, 120000);
});

describe('economy targets, asserted directly', () => {
  for (const c of CLASSES) {
    it(`${c}: verge normal-kill XP >= 8x mossbottom`, () => {
      const ps = reports[c].phases;
      const moss = ps.find((p) => p.id === 'mossbottom')!;
      const verge = ps.find((p) => p.id === 'verge')!;
      expect(moss.xpPerNormalKill).toBeGreaterThan(0);
      expect(verge.xpPerNormalKill).toBeGreaterThanOrEqual(8 * moss.xpPerNormalKill);
    });

    it(`${c}: mossbottom + thatchford earn <= 25% of all coins`, () => {
      const ps = reports[c].phases;
      const total = ps.reduce((s, p) => s + p.coinsEarned, 0);
      const front = ps.filter((p) => p.id === 'mossbottom' || p.id === 'thatchford').reduce((s, p) => s + p.coinsEarned, 0);
      expect(ECONOMY_TARGETS.maxFrontCoinShare).toBe(0.25);
      expect(total).toBeGreaterThan(0);
      expect(front / total).toBeLessThanOrEqual(0.25);
    });

    it(`${c}: every kit item that opens is owned within half its phase`, () => {
      for (const p of reports[c].phases) {
        if (p.gearLagMean === null) continue;
        expect(p.gearLagMean, p.id).toBeLessThanOrEqual(ECONOMY_TARGETS.maxGearLagShare * p.hours);
      }
    });
  }

  it('the short-phase floor is the roadmap 0.4 and no shipped phase is a one-level blip', () => {
    expect(ECONOMY_TARGETS.phaseHoursBand[0]).toBe(0.4);
    for (const p of reports.warden.phases) expect(p.levelOut - p.levelIn, p.id).toBeGreaterThanOrEqual(3);
  });

  it('xpToNextLevel and killXpAt grow with level, to the cap and on to 70', () => {
    for (let l = 1; l < 70; l++) {
      expect(xpToNextLevel(l + 1), `xpToNextLevel(${l + 1})`).toBeGreaterThan(xpToNextLevel(l));
      expect(killXpAt(l + 1, 'normal', l + 1), `killXpAt(${l + 1})`).toBeGreaterThan(killXpAt(l, 'normal', l));
    }
  });

  it('past the knee, kills per level never fall and coins follow item prices (quadratic)', () => {
    const knee = ECONOMY.curveKnee;
    for (let l = knee; l < 70; l++) expect(killsPerLevelAt(l + 1), `kills per level at ${l + 1}`).toBeGreaterThanOrEqual(killsPerLevelAt(l) - 0.5);
    const coinGrowth = coinMult(70) / coinMult(knee);
    const priceGrowth = (70 / knee) ** 2;
    expect(coinGrowth / priceGrowth).toBeGreaterThan(0.8);
    expect(coinGrowth / priceGrowth).toBeLessThan(1.25);
  });
});

describe('sims agree: arena hits per kill vs the economy model', () => {
  // The economy sim credits model.hitsPerNormalKill skill uses per normal kill. Measure it in the combat arena
  // (TacticalPlayer, zone-plain gear, a normal enemy a level below) and require the model within +-50% of the median.
  it('landed hits per normal kill match hitsPerNormalKill', () => {
    const normals = Object.values(ENEMIES).filter((e) => e.rank === 'normal');
    for (const c of CLASSES) {
      const hits: number[] = [];
      for (const L of [8, 16, 24]) {
        const e = normals.find((x) => Math.abs(x.level - (L - 1)) <= 1);
        if (!e) continue;
        const s = runMonteCarlo({ id: 'hits', name: 'hits', kind: 'duel', waves: [{ enemyId: e.id, count: 1, distance: 3 }], maxSeconds: 90 },
          { level: L, classId: c, gearTier: 'zone-plain' }, TacticalPlayer, { seeds: 6 });
        hits.push(s.playerHitsLanded.p50);
      }
      hits.sort((a, b) => a - b);
      const med = hits[hits.length >> 1];
      const model = DEFAULT_PLAYER.hitsPerNormalKill[c];
      expect(med / model, `${c}: arena median ${med} hits vs model ${model}`).toBeGreaterThan(0.5);
      expect(med / model, `${c}: arena median ${med} hits vs model ${model}`).toBeLessThan(1.5);
    }
  }, 120000);
});

describe('level-70 runway (PROJECTION)', () => {
  it('cap 70 raises exactly the expected projection flags, and nothing on shipped phases', () => {
    const seen = new Set<string>();
    for (const c of CLASSES) {
      const r = runEconomy({ classId: c, cap: 70 });
      expect(r.totals.level, `${c} reaches 70`).toBe(70);
      const flags = checkEconomy(r);
      const unexpected = flags.filter((f) => !isExpectedProjectionFlag(r, f));
      expect(unexpected.map((f) => f.message), c).toEqual([]);
      for (const f of flags) seen.add(f.code);
      for (const v of Object.keys(PLAYER_VARIANTS)) {
        const rv = runEconomy({ classId: c, cap: 70, ...PLAYER_VARIANTS[v] });
        expect(checkEconomy(rv, 'margin').filter((f) => !isExpectedProjectionFlag(rv, f)).map((f) => f.message), `${c}/${v}`).toEqual([]);
      }
    }
    // No silent pass: every expected flag still fires somewhere. When one stops firing, delete it from the list.
    expect([...seen].sort()).toEqual(Object.keys(EXPECTED_PROJECTION_FLAGS).sort());
  }, 120000);
});

describe('quest gates', () => {
  beforeEach(() => {
    Object.assign(state, newGameState());
  });

  const gateQuest = (g: Gate | undefined): string | undefined =>
    g?.when.quest?.status === 'done' ? g.when.quest.id : undefined;

  it('every tier-5 talent is gated on c3-ledger and every tier-6 on c5-heartwood', () => {
    const t5 = Object.values(TALENTS).filter((t) => t.tier === 5);
    const t6 = Object.values(TALENTS).filter((t) => t.tier === 6);
    expect(t5.length).toBeGreaterThan(0);
    expect(t6.length).toBeGreaterThan(0);
    for (const t of t5) expect(gateQuest(t.gate), t.id).toBe('c3-ledger');
    for (const t of t6) expect(gateQuest(t.gate), t.id).toBe('c5-heartwood');
  });

  const gated = Object.values(ITEMS).filter((i) => i.gate);

  it('at least 6 gated shop items, each on a quest being done', () => {
    expect(gated.length).toBeGreaterThanOrEqual(6);
    for (const i of gated) expect(gateQuest(i.gate), i.id).toBeDefined();
  });

  it('each item gate is closed on a fresh state and opens when its quest is done', () => {
    for (const i of gated) {
      Object.assign(state, newGameState());
      expect(gateOpen(i.gate), `${i.id} fresh`).toBe(false);
      state.quests[gateQuest(i.gate)!] = { stage: 0, count: 0, done: true };
      expect(gateOpen(i.gate), `${i.id} after quest`).toBe(true);
    }
  });

  it('every gate quest is done under every value of every story choice', () => {
    const gateQuests = new Set<string>(['c3-ledger', 'c5-heartwood']);
    for (const i of gated) gateQuests.add(gateQuest(i.gate)!);
    for (const t of Object.values(TALENTS)) if (gateQuest(t.gate)) gateQuests.add(gateQuest(t.gate)!);
    let runs = 0;
    for (const [flag, info] of buildFlagIndex()) {
      if (info.values.length < 2 && flag !== 'c2-trial') continue;
      const values = flag === 'c2-trial' ? CLASSES : info.values;
      for (const value of values) {
        const classId = flag === 'c2-trial' ? (value as ClassId) : 'warden';
        const done = new Set(runEconomy({ classId, choices: { [flag]: value } }).done);
        for (const q of gateQuests) expect(done.has(q), `${q} with ${flag}=${value}`).toBe(true);
        runs++;
      }
    }
    expect(runs).toBeGreaterThan(3);
  }, 120000);
});
