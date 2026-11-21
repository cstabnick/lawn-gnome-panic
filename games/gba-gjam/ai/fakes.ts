import fs from 'node:fs';
import path from 'node:path';
import { runSeries, simulateMatch, type BotFactory } from '../src/ai/eval';
import { DEFAULT_BALANCE_CONFIG, type SimBalanceConfig } from '../src/balance';
import { fakerBot, skillLadder, stealSpamBot } from './bench';

function winRate(a: BotFactory, b: BotFactory, n: number, seed: number, balance: Partial<SimBalanceConfig>): number {
  const res = runSeries(a, b, { games: n, baseSeed: seed, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'balanced', balance });
  let w = 0;
  for (const m of res.matches) if (m.homeBotId === a.id ? m.winner === 0 : m.winner === 1) w++;
  return res.matches.length ? w / res.matches.length : 0;
}

/** Fake economics for faker vs base: fakes thrown, bite rate, reads, per game. */
function fakeEconomics(n: number, seed: number, balance: Partial<SimBalanceConfig>) {
  const base = skillLadder().medium;
  const f = fakerBot(base);
  let fakes = 0;
  let bites = 0;
  let reads = 0;
  for (let i = 0; i < n; i++) {
    simulateMatch({
      homeBot: f,
      awayBot: base,
      seed: seed + i,
      quarterSeconds: 45,
      balance,
      onTick: (sim) => {
        if (sim.phase === 'finished') {
          fakes = fakes + 0;
        }
        (onTickRef.last = sim);
      },
    });
    const s = onTickRef.last!.fakeStats;
    fakes += s.fakes[0];
    bites += s.bites[0];
    reads += s.reads[1];
  }
  return { fakesPerGame: fakes / n, biteRate: fakes ? bites / fakes : 0, readsPerGame: reads / n };
}
const onTickRef: { last: import('../src/sim').JamSimulation | null } = { last: null };

const resultsDir = path.resolve(process.cwd(), "ai", "results", "fakes");

export async function main(args: string[]): Promise<void> {
  const n = Number(args[args.indexOf('--n') + 1]) || 60;
  const base = skillLadder().medium;
  const rows: string[] = ['# Fakes and steal-spam probes', '', `n=${n} side-swapped games per row, medium (150 ms) bots, 45 s quarters.`, ''];
  rows.push('## Steal spam vs base (win rate of the spammer; should be below 50%)', '', '| whiff stun (s) | spammer win rate |', '|---:|---:|');
  for (const stun of [0, 0.25, 0.45, 0.7]) {
    const wr = winRate(stealSpamBot(base), base, n, 20000, { ...DEFAULT_BALANCE_CONFIG, stealWhiffStunSec: stun, inboundProtectSec: 0 });
    rows.push(`| ${stun} | ${(wr * 100).toFixed(1)}% |`);
  }
  rows.push('', '## Faker vs waiter (same shot delay, no fake: isolates the fake itself)', '', '| bite base chance | faker win rate vs waiter | faker vs base | waiter vs base | fakes/game | bite rate | reads/game |', '|---:|---:|---:|---:|---:|---:|---:|');
  for (const bite of [0, 0.3, 0.62, 0.9]) {
    const bal = { ...DEFAULT_BALANCE_CONFIG, fakeBiteBaseChance: bite };
    const wr = winRate(fakerBot(base, 2.6, 30), fakerBot(base, 2.6, 30, false), n, 21000, bal);
    const vsBase = winRate(fakerBot(base, 2.6, 30), base, n, 21000, bal);
    const waitBase = winRate(fakerBot(base, 2.6, 30, false), base, n, 21000, bal);
    const ec = fakeEconomics(Math.max(10, Math.floor(n / 2)), 21000, bal);
    rows.push(`| ${bite} | ${(wr * 100).toFixed(1)}% | ${(vsBase * 100).toFixed(1)}% | ${(waitBase * 100).toFixed(1)}% | ${ec.fakesPerGame.toFixed(1)} | ${(ec.biteRate * 100).toFixed(0)}% | ${ec.readsPerGame.toFixed(1)} |`);
  }
  rows.push('', '## Fake vs eager defender (design goal: a blind steal-spammer gets burned, a patient defender does not)', '', '| offence | vs steal-spam defender | vs normal defender |', '|---|---:|---:|');
  const dbal = { ...DEFAULT_BALANCE_CONFIG };
  const faker = fakerBot(base, 2.6, 30);
  const waiter = fakerBot(base, 2.6, 30, false);
  const spam = stealSpamBot(base);
  rows.push(`| faker (win rate) | ${(winRate(faker, spam, n, 22000, dbal) * 100).toFixed(1)}% | ${(winRate(faker, base, n, 22000, dbal) * 100).toFixed(1)}% |`);
  rows.push(`| waiter (win rate) | ${(winRate(waiter, spam, n, 22000, dbal) * 100).toFixed(1)}% | ${(winRate(waiter, base, n, 22000, dbal) * 100).toFixed(1)}% |`);
  const out = rows.join('\n');
  console.log(out);
  fs.mkdirSync(resultsDir, { recursive: true });
  fs.writeFileSync(path.join(resultsDir, 'REPORT.md'), out + '\n');
}
