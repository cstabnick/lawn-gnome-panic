import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createAlleyOopExpressBot,
  createArcArchitectBot,
  createChampionV1Bot,
  createChampionV2Bot,
  createClassicBot,
  createFireFeederBot,
  createHybridAceBot,
  createLockdownCounterBot,
  createShoveHoundBot,
} from '../src/ai';
import { runRoundRobin, type BotFactory, type LeaderboardEntry } from '../src/ai/eval';
import { ORIGINAL_BALANCE_CONFIG, type SimBalanceConfig } from '../src/balance';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, 'results', 'balance');

function getBalanceField(): BotFactory[] {
  return [
    { id: 'champion-v2', name: 'Champion v2', create: () => createChampionV2Bot() },
    { id: 'champion-v1', name: 'Champion v1', create: () => createChampionV1Bot() },
    { id: 'shove-hound', name: 'Shove Hound', create: () => createShoveHoundBot() },
    { id: 'hybrid-ace', name: 'Hybrid Ace', create: () => createHybridAceBot() },
    { id: 'fire-feeder', name: 'Fire Feeder', create: () => createFireFeederBot() },
    { id: 'alley-oop-express', name: 'Alley-Oop Express', create: () => createAlleyOopExpressBot() },
    { id: 'arc-architect', name: 'Arc Architect', create: () => createArcArchitectBot() },
    { id: 'lockdown-counter', name: 'Lockdown Counter', create: () => createLockdownCounterBot() },
    { id: 'classic', name: 'Classic Jam', create: () => createClassicBot() },
  ];
}

interface HealthSummary {
  label: string;
  config: SimBalanceConfig;
  healthScore: number; // higher is healthier (max 100)
  avgPpg: number;
  topPpg: number;
  classicPpg: number;
  avgTpPct: number;
  avgShvTo: number;
  avgDunks: number;
  avgBlocks: number;
  avgPossSec: number;
  topWinRate: number;
  eloSpread: number;
  leaderId: string;
  leaderboard: LeaderboardEntry[];
}

function rangePenalty(val: number, lo: number, hi: number, weight: number): number {
  if (val < lo) return ((lo - val) / Math.max(1, lo)) * weight;
  if (val > hi) return ((val - hi) / Math.max(1, hi)) * weight;
  return 0;
}

function scoreBalanceHealth(label: string, config: SimBalanceConfig, lb: LeaderboardEntry[]): HealthSummary {
  const n = lb.length;
  const avgPpg = lb.reduce((s, e) => s + e.avgPts, 0) / n;
  const topPpg = lb[0].avgPts;
  const classicEntry = lb.find((e) => e.botId === 'classic')!;
  const shooters = lb.filter((e) => e.avgTpa >= 3);
  const avgTpPct = shooters.length > 0 ? shooters.reduce((s, e) => s + e.tpPct, 0) / shooters.length : 0;
  const avgShvTo = lb.reduce((s, e) => s + e.avgShoveTurnovers, 0) / n;
  const avgDunks = lb.reduce((s, e) => s + e.avgDunks, 0) / n;
  const avgBlocks = lb.reduce((s, e) => s + e.avgBlocks, 0) / n;
  const avgPossSec = lb.reduce((s, e) => s + e.avgPossessionSec, 0) / n;
  const topWinRate = lb[0].winRate;
  const eloSpread = lb[0].elo - lb[n - 1].elo;

  let penalty = 0;
  penalty += rangePenalty(avgPpg, 38, 72, 22);
  penalty += rangePenalty(topPpg, 45, 88, 12);
  penalty += rangePenalty(avgTpPct * 100, 36, 54, 24);
  penalty += rangePenalty(avgShvTo, 6, 20, 22);
  penalty += rangePenalty(avgDunks, 6, 22, 10);
  penalty += rangePenalty(avgBlocks, 0.8, 5.0, 10);
  penalty += rangePenalty(avgPossSec, 1.2, 4.0, 10);
  penalty += rangePenalty(topWinRate * 100, 50, 78, 15);
  penalty += rangePenalty(classicEntry.avgPts, 20, 65, 10);

  return {
    label,
    config,
    healthScore: Math.max(0, Number((100 - penalty).toFixed(1))),
    avgPpg,
    topPpg,
    classicPpg: classicEntry.avgPts,
    avgTpPct,
    avgShvTo,
    avgDunks,
    avgBlocks,
    avgPossSec,
    topWinRate,
    eloSpread,
    leaderId: lb[0].botId,
    leaderboard: lb,
  };
}

function evalConfig(
  label: string,
  config: SimBalanceConfig,
  seed: number,
  gamesPerPair = 2,
  decisionCadenceMs = 150,
): HealthSummary {
  const rr = runRoundRobin(getBalanceField(), {
    games: gamesPerPair,
    baseSeed: seed,
    quarterSeconds: 45,
    difficulty: 'pro',
    rosterMode: 'balanced',
    decisionCadenceMs,
    balance: config,
  });
  return scoreBalanceHealth(label, config, rr.leaderboard);
}

function formatHealthRow(h: HealthSummary): string {
  return `| ${h.label} | **${h.healthScore.toFixed(1)}** | ${h.avgPpg.toFixed(1)} | ${h.topPpg.toFixed(1)} | ${h.classicPpg.toFixed(1)} | ${(h.avgTpPct * 100).toFixed(1)}% | ${h.avgShvTo.toFixed(1)} | ${h.avgDunks.toFixed(1)} | ${h.avgBlocks.toFixed(1)} | ${h.avgPossSec.toFixed(2)}s | ${(h.topWinRate * 100).toFixed(1)}% (\`${h.leaderId}\`) |`;
}

export async function main(): Promise<void> {
  const t0 = performance.now();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const field = getBalanceField();
  let totalMatches = 0;

  console.log('Evaluating Original Baseline (150ms Human-Fair & 60Hz)...');
  const orig150 = evalConfig('Original Baseline (150ms)', ORIGINAL_BALANCE_CONFIG, 200000, 2, 150);
  const orig60 = evalConfig('Original Baseline (60Hz)', ORIGINAL_BALANCE_CONFIG, 200000, 2, 0);
  totalMatches += 72 * 2;

  // ROUND 1: Nerf Shove Guarantee/Cooldown + Quick-Release 3PT Base/Early Penalty
  console.log('Running Balance Round 1: Shove & 3PT Exploit Nerfs...');
  const r1Candidates: Array<{ label: string; patch: Partial<SimBalanceConfig> }> = [
    {
      label: 'R1-A: Moderate Shove (55% loose) + 3PT Nerf',
      patch: {
        shoveCooldownSec: 1.0,
        shoveWhiffCooldownSec: 1.25,
        shoveTurboCost: 28,
        shoveStunSec: 0.65,
        shoveTurnoverChance: 0.55,
        shoveKnocksLoose: true,
        threeBaseChance: 0.14,
        threeStatScale: 0.04,
        earlyReleasePenalty: 0.24,
      },
    },
    {
      label: 'R1-B: Strict Shove (40% loose, 1.2s CD) + Crisp 3PT',
      patch: {
        shoveCooldownSec: 1.2,
        shoveWhiffCooldownSec: 1.5,
        shoveTurboCost: 34,
        shoveStunSec: 0.6,
        shoveTurnoverChance: 0.4,
        shoveKnocksLoose: true,
        threeBaseChance: 0.11,
        threeStatScale: 0.038,
        earlyReleasePenalty: 0.28,
      },
    },
    {
      label: 'R1-C: Knock-Loose Shove (30% TO, 1.35s CD) + Skill 3PT',
      patch: {
        shoveCooldownSec: 1.35,
        shoveWhiffCooldownSec: 1.65,
        shoveTurboCost: 36,
        shoveStunSec: 0.55,
        shoveTurnoverChance: 0.3,
        shoveKnocksLoose: true,
        threeBaseChance: 0.1,
        threeStatScale: 0.036,
        earlyReleasePenalty: 0.32,
      },
    },
    {
      label: 'R1-D: Direct-Rip 35% + High Cooldown (1.4s)',
      patch: {
        shoveCooldownSec: 1.4,
        shoveWhiffCooldownSec: 1.7,
        shoveTurboCost: 36,
        shoveStunSec: 0.55,
        shoveTurnoverChance: 0.35,
        shoveKnocksLoose: false,
        threeBaseChance: 0.12,
        threeStatScale: 0.038,
        earlyReleasePenalty: 0.28,
      },
    },
  ];
  const r1Results = r1Candidates.map((c, idx) =>
    evalConfig(c.label, { ...ORIGINAL_BALANCE_CONFIG, ...c.patch }, 210000 + idx * 500, 2, 150),
  );
  totalMatches += r1Candidates.length * 72;
  const r1Best = [...r1Results].sort((a, b) => b.healthScore - a.healthScore)[0];

  // ROUND 2: Tune Contests, Dunk Reach, & Shot/Dunk Blocking
  console.log('Running Balance Round 2: Contests, Dunk Reach & Rim Blocking...');
  const r2Candidates: Array<{ label: string; patch: Partial<SimBalanceConfig> }> = [
    {
      label: 'R2-A: Stronger Contests (1.4x) + Rim Blocks',
      patch: {
        contestScale: 1.4,
        dunkBaseReach: 2.8,
        dunkTurboReachBonus: 1.0,
        dunkBlockBaseChance: 0.12,
        shotBlockReach: 2.55,
        stealBaseChance: 0.3,
      },
    },
    {
      label: 'R2-B: Tight Dunk Reach (2.5m) + High Rim Blocks (0.18)',
      patch: {
        contestScale: 1.55,
        dunkBaseReach: 2.5,
        dunkTurboReachBonus: 0.9,
        dunkBlockBaseChance: 0.18,
        shotBlockReach: 2.75,
        stealBaseChance: 0.28,
      },
    },
    {
      label: 'R2-C: Balanced Rim (2.7m) + Active Steals (0.36) & Blocks (0.15)',
      patch: {
        contestScale: 1.45,
        dunkBaseReach: 2.7,
        dunkTurboReachBonus: 0.95,
        dunkBlockBaseChance: 0.15,
        shotBlockReach: 2.65,
        stealBaseChance: 0.36,
      },
    },
    {
      label: 'R2-D: Heavy Defense (1.7x Contest, 0.22 Dunk Block)',
      patch: {
        contestScale: 1.7,
        dunkBaseReach: 2.5,
        dunkTurboReachBonus: 0.85,
        dunkBlockBaseChance: 0.22,
        shotBlockReach: 2.8,
        stealBaseChance: 0.26,
      },
    },
  ];
  const r2Results = r2Candidates.map((c, idx) =>
    evalConfig(c.label, { ...r1Best.config, ...c.patch }, 220000 + idx * 500, 2, 150),
  );
  totalMatches += r2Candidates.length * 72;
  const r2Best = [...r2Results].sort((a, b) => b.healthScore - a.healthScore)[0];

  // ROUND 3: Anti-Snowball (On-Fire Tuning) + Final 60Hz/150ms Validation
  console.log('Running Balance Round 3: On-Fire Snowball Control & Validation...');
  const r3Candidates: Array<{ label: string; patch: Partial<SimBalanceConfig> }> = [
    {
      label: 'R3-A: Balanced Fire (streak=3, +16% shot, 0.4x drain)',
      patch: { fireStreakThreshold: 3, fireShotBonus: 0.16, fireTurboDrainScale: 0.4 },
    },
    {
      label: 'R3-B: Earned Fire (streak=4, +14% shot, 0.5x drain)',
      patch: { fireStreakThreshold: 4, fireShotBonus: 0.14, fireTurboDrainScale: 0.5 },
    },
    {
      label: 'R3-C: Arcade Pop (streak=3, +18% shot, 0.25x drain)',
      patch: { fireStreakThreshold: 3, fireShotBonus: 0.18, fireTurboDrainScale: 0.25 },
    },
    {
      label: 'R3-D: Strict Fire (streak=4, +12% shot, 0.7x drain)',
      patch: { fireStreakThreshold: 4, fireShotBonus: 0.12, fireTurboDrainScale: 0.7 },
    },
  ];
  const r3Results = r3Candidates.map((c, idx) =>
    evalConfig(c.label, { ...r2Best.config, ...c.patch }, 230000 + idx * 500, 2, 150),
  );
  totalMatches += r3Candidates.length * 72;
  const r3Best = [...r3Results].sort((a, b) => b.healthScore - a.healthScore)[0];

  // Full 4-game/pair validation of winner in both 150ms and 60Hz
  console.log(`Validating Final Winner (${r3Best.label}) at N=4/pair in 150ms and 60Hz...`);
  const final150 = evalConfig('Balanced Final (150ms)', r3Best.config, 240000, 4, 150);
  const final60 = evalConfig('Balanced Final (60Hz)', r3Best.config, 240000, 4, 0);
  totalMatches += 144 * 2;

  const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
  const md = [
    '# GBA GJAM — 3-Round Balance Tuning Report',
    '',
    `Evaluated **${totalMatches} full 4-quarter matches** across 9 bot archetypes in **${elapsed}s**.`,
    '',
    '## Summary Comparison (Before vs. After)',
    '| Config | Health | Avg PPG | Top PPG | Classic PPG | 3P% | ShvTO/g | Dunks/g | Blk/g | Poss(s) | Top Win% |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|',
    formatHealthRow(orig150),
    formatHealthRow(orig60),
    formatHealthRow(final150),
    formatHealthRow(final60),
    '',
    '## Round 1: Shove & Quick-Release 3PT Nerfs (150ms)',
    '| Candidate | Health | Avg PPG | Top PPG | Classic PPG | 3P% | ShvTO/g | Dunks/g | Blk/g | Poss(s) | Top Win% |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|',
    ...r1Results.map(formatHealthRow),
    '',
    '## Round 2: Contests, Dunk Reach & Rim Blocking (150ms)',
    '| Candidate | Health | Avg PPG | Top PPG | Classic PPG | 3P% | ShvTO/g | Dunks/g | Blk/g | Poss(s) | Top Win% |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|',
    ...r2Results.map(formatHealthRow),
    '',
    '## Round 3: On-Fire Snowball Control (150ms)',
    '| Candidate | Health | Avg PPG | Top PPG | Classic PPG | 3P% | ShvTO/g | Dunks/g | Blk/g | Poss(s) | Top Win% |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|',
    ...r3Results.map(formatHealthRow),
    '',
    '## Balanced Final Leaderboard (150ms Human-Fair, 4 games/pair)',
    '| Rank | Bot | Elo | W-L | Win% | PPG | Diff (Med) | FG% | 3P% (3PA) | Dunks | ShvTO | Blk | On Fire | Oops |',
    '|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
    ...final150.leaderboard.map((e, i) =>
      `| ${i + 1} | **${e.botName}** | ${e.elo} | ${e.wins}-${e.losses} | ${(e.winRate * 100).toFixed(1)}% | ${e.avgPts.toFixed(1)} | ${e.avgDiff >= 0 ? '+' : ''}${e.avgDiff.toFixed(1)} (${e.medianDiff >= 0 ? '+' : ''}${e.medianDiff.toFixed(1)}) | ${(e.fgPct * 100).toFixed(1)}% | ${(e.tpPct * 100).toFixed(1)}% (${e.avgTpa.toFixed(1)}) | ${e.avgDunks.toFixed(1)} | ${e.avgShoveTurnovers.toFixed(1)} | ${e.avgBlocks.toFixed(1)} | ${e.avgFire.toFixed(1)} | ${e.avgAlleyOops.toFixed(1)} |`,
    ),
    '',
    '## Promoted `DEFAULT_BALANCE_CONFIG`',
    '```json',
    JSON.stringify(r3Best.config, null, 2),
    '```',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(OUT_DIR, 'REPORT.md'), md);
  fs.writeFileSync(path.join(OUT_DIR, 'results.json'), JSON.stringify({ orig150, orig60, r1Results, r2Results, r3Results, final150, final60, promotedConfig: r3Best.config }, null, 2));

  console.log(`\n3-Round Balance Tuning completed (${totalMatches} matches) in ${elapsed}s!`);
  console.log(`Winner: ${r3Best.label}`);
  console.log(`150ms Health: ${orig150.healthScore} -> ${final150.healthScore} | PPG: ${orig150.avgPpg.toFixed(1)} -> ${final150.avgPpg.toFixed(1)} | 3P%: ${(orig150.avgTpPct * 100).toFixed(1)}% -> ${(final150.avgTpPct * 100).toFixed(1)}% | ShvTO: ${orig150.avgShvTo.toFixed(1)} -> ${final150.avgShvTo.toFixed(1)} | Blk: ${orig150.avgBlocks.toFixed(1)} -> ${final150.avgBlocks.toFixed(1)}`);
}
