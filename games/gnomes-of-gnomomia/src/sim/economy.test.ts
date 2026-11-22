/// <reference types="node" />
// Economy regression test: fails when a data edit re-front-loads the economy or flattens its curve.
// - checkEconomy() must raise no flags for any class (the targets live in ECONOMY_TARGETS, src/sim/economy.ts).
// - The curve shape is pinned in economy.golden.json: per class and phase, levelOut exactly, and coinsPerHour /
//   xpPerNormalKill as ratios to Mossbottom, carryRatio and capTimeShare, within the tolerances in TOL below.
//   Only numbers are pinned, so rewording gate `why` text or any other string never touches it.
// Regenerate the golden only for a deliberate retune (then review the diff of economy.golden.json):
//   UPDATE_GOLDEN=1 npm test -w games/gnomes-of-gnomomia -- src/sim/economy.test.ts   (from the repo root)
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ClassId, Gate } from '../config';
import { ITEMS } from '../content';
import { TALENTS } from '../data/classes';
import { killXpAt, xpToNextLevel } from '../economy';
import { gateOpen } from '../gates';
import { newGameState, state } from '../state';
import { ECONOMY_TARGETS, checkEconomy, runEconomy, type EconomyReport } from './economy';

const CLASSES: readonly ClassId[] = ['warden', 'slinger', 'mage'];
const GOLDEN = join(dirname(fileURLToPath(import.meta.url)), 'economy.golden.json');

/** Allowed drift from the golden. Ratios are relative (0.15 = +-15%); bands are absolute. */
const TOL = {
  coinsPerHourRatio: 0.15,
  xpPerNormalKillRatio: 0.15,
  /** Coins carried out / next kit cost: +-0.2 absolute (null, no shop next, must stay null). */
  carryRatioBand: 0.2,
  /** Share of combat time the weapon skill sits at its cap: +-0.1 absolute. */
  capTimeShareBand: 0.1,
};

interface GoldenPhase {
  id: string;
  levelOut: number;
  coinsPerHourRatio: number;
  xpPerNormalKillRatio: number;
  carryRatio: number | null;
  capTimeShare: number;
}
type Golden = Record<string, GoldenPhase[]>;

const r3 = (x: number): number => Math.round(x * 1000) / 1000;

function shape(report: EconomyReport): GoldenPhase[] {
  const first = report.phases[0];
  return report.phases.map((p) => ({
    id: p.id,
    levelOut: p.levelOut,
    coinsPerHourRatio: r3(p.coinsPerHour / first.coinsPerHour),
    xpPerNormalKillRatio: r3(p.xpPerNormalKill / first.xpPerNormalKill),
    carryRatio: p.carryRatio,
    capTimeShare: p.capTimeShare,
  }));
}

const reports = Object.fromEntries(CLASSES.map((c) => [c, runEconomy({ classId: c })])) as Record<ClassId, EconomyReport>;

describe('economy sim: no flags', () => {
  for (const c of CLASSES) {
    it(`${c}: checkEconomy finds nothing`, () => {
      expect(checkEconomy(reports[c]).map((f) => f.message)).toEqual([]);
    });
  }
});

describe('economy curve golden', () => {
  const current: Golden = Object.fromEntries(CLASSES.map((c) => [c, shape(reports[c])]));
  if (process.env.UPDATE_GOLDEN) writeFileSync(GOLDEN, JSON.stringify(current, null, 2) + '\n');

  it('golden file exists (UPDATE_GOLDEN=1 writes it)', () => {
    expect(existsSync(GOLDEN)).toBe(true);
  });
  const golden: Golden = existsSync(GOLDEN) ? JSON.parse(readFileSync(GOLDEN, 'utf8')) : {};

  for (const c of CLASSES) {
    it(`${c}: curve shape matches the golden`, () => {
      const want = golden[c];
      const got = current[c];
      expect(want, `no golden for ${c}`).toBeDefined();
      expect(got.map((p) => p.id)).toEqual(want.map((p) => p.id));
      got.forEach((p, i) => {
        const w = want[i];
        const at = `${c}/${p.id}`;
        expect(p.levelOut, `${at} levelOut`).toBe(w.levelOut);
        const rel = (a: number, b: number) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-9);
        expect(rel(p.coinsPerHourRatio, w.coinsPerHourRatio), `${at} coinsPerHour ratio ${p.coinsPerHourRatio} vs ${w.coinsPerHourRatio}`)
          .toBeLessThanOrEqual(TOL.coinsPerHourRatio);
        expect(rel(p.xpPerNormalKillRatio, w.xpPerNormalKillRatio), `${at} xpPerNormalKill ratio ${p.xpPerNormalKillRatio} vs ${w.xpPerNormalKillRatio}`)
          .toBeLessThanOrEqual(TOL.xpPerNormalKillRatio);
        if (w.carryRatio === null) expect(p.carryRatio, `${at} carryRatio`).toBeNull();
        else {
          expect(p.carryRatio, `${at} carryRatio`).not.toBeNull();
          expect(Math.abs(p.carryRatio! - w.carryRatio), `${at} carryRatio ${p.carryRatio} vs ${w.carryRatio}`)
            .toBeLessThanOrEqual(TOL.carryRatioBand);
        }
        expect(Math.abs(p.capTimeShare - w.capTimeShare), `${at} capTimeShare ${p.capTimeShare} vs ${w.capTimeShare}`)
          .toBeLessThanOrEqual(TOL.capTimeShareBand);
      });
    });
  }
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
  }

  it('xpToNextLevel and killXpAt grow with level', () => {
    for (let l = 1; l < 30; l++) {
      expect(xpToNextLevel(l + 1), `xpToNextLevel(${l + 1})`).toBeGreaterThan(xpToNextLevel(l));
      expect(killXpAt(l + 1, 'normal', l + 1), `killXpAt(${l + 1})`).toBeGreaterThan(killXpAt(l, 'normal', l));
    }
  });
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
});
