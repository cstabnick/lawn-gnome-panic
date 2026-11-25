// Golden regression: seeded full matches must replay bit-for-bit (rounded to 1e-6).
// Captured with GOLDEN_CAPTURE=1 before @lawn/jam was extracted; never recapture.
import { describe, expect, it } from 'vitest';
import golden from './sim.golden.json';
import { ORIGINAL_BALANCE_CONFIG } from './balance';
import {
  createArcArchitectBot,
  createChampionV2Bot,
  createClassicBot,
  createHybridAceBot,
  createShoveHoundBot,
} from './ai';
import {
  makeBalancedRoster,
  makeDunkerRoster,
  makeShooterRoster,
  simulateMatch,
  type BotFactory,
  type MatchOptions,
} from './ai/eval';

const GOLDEN_PATH = new URL('./sim.golden.json', import.meta.url);

const classic: BotFactory = { id: 'classic', name: 'Classic', create: createClassicBot };
const shove: BotFactory = { id: 'shove-hound', name: 'Shove', create: createShoveHoundBot };
const arc: BotFactory = { id: 'arc-architect', name: 'Arc', create: createArcArchitectBot };
const hybrid: BotFactory = { id: 'hybrid-ace', name: 'Hybrid', create: createHybridAceBot };
const champ: BotFactory = { id: 'champion-v2', name: 'Champ', create: createChampionV2Bot };

interface Case {
  name: string;
  opts: () => MatchOptions;
}

const CASES: Case[] = [
  { name: 'classic-mirror-pro', opts: () => ({ homeBot: classic, awayBot: classic, seed: 11, quarterSeconds: 25, difficulty: 'pro' }) },
  { name: 'classic-rookie-shooter-v-dunker', opts: () => ({ homeBot: classic, awayBot: classic, seed: 22, quarterSeconds: 20, difficulty: 'rookie', homeRoster: makeShooterRoster('h'), awayRoster: makeDunkerRoster('a') }) },
  { name: 'classic-allstar-balanced', opts: () => ({ homeBot: classic, awayBot: classic, seed: 33, quarterSeconds: 30, difficulty: 'allstar', homeRoster: makeBalancedRoster('h'), awayRoster: makeBalancedRoster('a') }) },
  { name: 'shove-v-arc', opts: () => ({ homeBot: shove, awayBot: arc, seed: 44, quarterSeconds: 25, difficulty: 'pro', homeRoster: makeDunkerRoster('h'), awayRoster: makeShooterRoster('a') }) },
  { name: 'hybrid-v-classic-allstar', opts: () => ({ homeBot: hybrid, awayBot: classic, seed: 55, quarterSeconds: 25, difficulty: 'allstar' }) },
  { name: 'champion-v-shove-rookie', opts: () => ({ homeBot: champ, awayBot: shove, seed: 66, quarterSeconds: 20, difficulty: 'rookie', awayRoster: makeShooterRoster('a') }) },
  { name: 'arc-v-hybrid-original-balance', opts: () => ({ homeBot: arc, awayBot: hybrid, seed: 77, quarterSeconds: 25, difficulty: 'pro', balance: ORIGINAL_BALANCE_CONFIG }) },
  { name: 'classic-cadence-150', opts: () => ({ homeBot: classic, awayBot: shove, seed: 88, quarterSeconds: 25, difficulty: 'pro', decisionCadenceMs: 150, homeRoster: makeShooterRoster('h'), awayRoster: makeShooterRoster('a') }) },
  { name: 'champion-mirror-allstar-dunkers', opts: () => ({ homeBot: champ, awayBot: champ, seed: 99, quarterSeconds: 30, difficulty: 'allstar', homeRoster: makeDunkerRoster('h'), awayRoster: makeDunkerRoster('a') }) },
];

const r6 = (n: number) => Math.round(n * 1e6) / 1e6;

function fnv(h: number, s: string): number {
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function runCase(c: Case) {
  let hash = 2166136261;
  let samples = 0;
  let tick = 0;
  let boxes: unknown = null;
  const base = c.opts();
  const res = simulateMatch({
    ...base,
    onTick: (sim) => {
      tick++;
      if (tick % 30 === 0) {
        const v: number[] = [];
        for (const p of sim.players) v.push(r6(p.pos.x), r6(p.pos.y), r6(p.pos.z));
        v.push(r6(sim.ball.pos.x), r6(sim.ball.pos.y), r6(sim.ball.pos.z));
        hash = fnv(hash, v.join(','));
        samples++;
      }
      boxes = sim.players.map((p) => ({ ...p.box }));
    },
  });
  return {
    homeScore: res.homeScore,
    awayScore: res.awayScore,
    winner: res.winner,
    overtime: res.overtime,
    ticks: res.ticks,
    boxScore: boxes,
    samples,
    posHash: hash.toString(16),
  };
}

describe('GBA GJAM golden matches', () => {
  it('replays the captured seeded matches exactly', async () => {
    const actual: Record<string, unknown> = {};
    for (const c of CASES) actual[c.name] = runCase(c);
    const env = (globalThis as unknown as { process?: { env: Record<string, string | undefined> } }).process?.env;
    if (env?.GOLDEN_CAPTURE) {
      const fs = await import(/* @vite-ignore */ ['node', 'fs'].join(':'));
      fs.writeFileSync(GOLDEN_PATH, JSON.stringify(actual, null, 2) + '\n');
      return;
    }
    expect(actual).toEqual(golden);
  }, 120_000);
});
