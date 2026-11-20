import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BOT_SCRIPT_PRESETS,
  createAlleyOopExpressBot,
  createArcArchitectBot,
  createClassicBot,
  createFireFeederBot,
  createHybridAceBot,
  createLockdownCounterBot,
  createShoveHoundBot,
} from '../src/ai';
import {
  createSyncScriptBot,
  runRoundRobin,
  type BotFactory,
  type LeaderboardEntry,
  type MatchTelemetry,
} from '../src/ai/eval';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getBaselineRoster(): BotFactory[] {
  return [
    { id: 'classic', name: 'Classic Jam (Built-in)', create: () => createClassicBot() },
    {
      id: 'downtown-sniper',
      name: 'Downtown Sniper (Script)',
      create: () =>
        createSyncScriptBot(
          BOT_SCRIPT_PRESETS['script-sniper'].code,
          'downtown-sniper',
          'Downtown Sniper',
        ),
    },
    {
      id: 'rim-rusher',
      name: 'Rim Rusher (Script)',
      create: () =>
        createSyncScriptBot(
          BOT_SCRIPT_PRESETS['script-rusher'].code,
          'rim-rusher',
          'Rim Rusher',
        ),
    },
    { id: 'shove-hound', name: 'Shove Hound', create: () => createShoveHoundBot() },
    { id: 'arc-architect', name: 'Arc Architect', create: () => createArcArchitectBot() },
    { id: 'fire-feeder', name: 'Fire Feeder', create: () => createFireFeederBot() },
    { id: 'alley-oop-express', name: 'Alley-Oop Express', create: () => createAlleyOopExpressBot() },
    { id: 'lockdown-counter', name: 'Lockdown Counter', create: () => createLockdownCounterBot() },
    { id: 'hybrid-ace', name: 'Hybrid Ace', create: () => createHybridAceBot() },
  ];
}

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function num(v: number): string {
  return v.toFixed(1);
}

export function formatLeaderboardMarkdown(
  entries: LeaderboardEntry[],
  matrix: Record<string, Record<string, { wins: number; games: number; avgDiff: number }>>,
  title: string,
  subtitle: string,
): string {
  const lines: string[] = [];
  lines.push(`# ${title}`, '', subtitle, '');
  lines.push('## Leaderboard', '');
  lines.push(
    '| Rank | Bot | Elo | W-L | Win% (95% CI) | PPG | Diff (Med) | PPP | Poss(s) | FG% | 3P% (3PA) | Dunks | Steals (Shove) | ShvSuf | Blocks | On Fire |',
  );
  lines.push(
    '|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
  );
  entries.forEach((e, idx) => {
    const ci = `${pct(e.winRate)} (${pct(e.winRateCI95[0])}–${pct(e.winRateCI95[1])})`;
    const diffStr = `${e.avgDiff >= 0 ? '+' : ''}${num(e.avgDiff)} (${e.medianDiff >= 0 ? '+' : ''}${num(e.medianDiff)})`;
    lines.push(
      `| ${idx + 1} | **${e.botName}** (\`${e.botId}\`) | ${e.elo} | ${e.wins}-${e.losses} | ${ci} | ${num(e.avgPts)} | ${diffStr} | ${e.ppp.toFixed(2)} | ${e.avgPossessionSec.toFixed(2)}s | ${pct(e.fgPct)} | ${pct(e.tpPct)} (${num(e.avgTpa)}) | ${num(e.avgDunks)} | ${num(e.avgSteals)} (${num(e.avgShoveTurnovers)}) | ${num(e.avgShovesSuffered)} | ${num(e.avgBlocks)} | ${num(e.avgFire)} |`,
    );
  });

  lines.push('', '## Head-to-Head Matrix (Row Wins / Games)', '');
  const ids = entries.map((e) => e.botId);
  lines.push(`| Bot | ${ids.map((id) => `\`${id}\``).join(' | ')} |`);
  lines.push(`|---|${ids.map(() => '---:').join('|')}|`);
  for (const row of entries) {
    const cells = ids.map((colId) => {
      if (colId === row.botId) return '—';
      const cell = matrix[row.botId]?.[colId];
      if (!cell) return '—';
      const sign = cell.avgDiff >= 0 ? '+' : '';
      return `${cell.wins}/${cell.games} (${sign}${cell.avgDiff.toFixed(1)})`;
    });
    lines.push(`| \`${row.botId}\` | ${cells.join(' | ')} |`);
  }
  lines.push('');
  return lines.join('\n');
}

export function matchesToCsv(matches: MatchTelemetry[]): string {
  const header = [
    'seed',
    'homeBot',
    'awayBot',
    'homeScore',
    'awayScore',
    'winner',
    'overtime',
    'homeFgm',
    'homeFga',
    'homeTpm',
    'homeTpa',
    'homeDunks',
    'homeSteals',
    'homeShoveTO',
    'homeBlocks',
    'homeReb',
    'homeFire',
    'homeOops',
    'awayFgm',
    'awayFga',
    'awayTpm',
    'awayTpa',
    'awayDunks',
    'awaySteals',
    'awayShoveTO',
    'awayBlocks',
    'awayReb',
    'awayFire',
    'awayOops',
  ].join(',');

  const rows = matches.map((m) =>
    [
      m.seed,
      m.homeBotId,
      m.awayBotId,
      m.homeScore,
      m.awayScore,
      m.winner === 0 ? m.homeBotId : m.awayBotId,
      m.overtime ? 1 : 0,
      m.home.fgm,
      m.home.fga,
      m.home.tpm,
      m.home.tpa,
      m.home.dunks,
      m.home.steals,
      m.home.shoveTurnovers,
      m.home.blocks,
      m.home.rebounds,
      m.home.fireActivations,
      m.home.alleyOops,
      m.away.fgm,
      m.away.fga,
      m.away.tpm,
      m.away.tpa,
      m.away.dunks,
      m.away.steals,
      m.away.shoveTurnovers,
      m.away.blocks,
      m.away.rebounds,
      m.away.fireActivations,
      m.away.alleyOops,
    ].join(','),
  );
  return [header, ...rows].join('\n') + '\n';
}

export async function main(): Promise<void> {
  const t0 = performance.now();
  const bots = getBaselineRoster();
  const gamesPerPair = 8; // 36 pairs * 8 games = 288 full 4-quarter matches
  console.log(`Running 9-bot baseline round-robin (${gamesPerPair} games/pair, ${(bots.length * (bots.length - 1)) / 2 * gamesPerPair} total matches)...`);

  const rr = runRoundRobin(bots, {
    games: gamesPerPair,
    baseSeed: 10000,
    quarterSeconds: 45,
    difficulty: 'pro',
    rosterMode: 'balanced',
  });

  const outDir = path.resolve(__dirname, 'results', 'baseline');
  fs.mkdirSync(outDir, { recursive: true });

  const elapsedSec = ((performance.now() - t0) / 1000).toFixed(2);
  const summaryJson = {
    generatedAt: new Date().toISOString(),
    config: {
      bots: bots.map((b) => ({ id: b.id, name: b.name })),
      gamesPerPair,
      totalMatches: rr.totalMatches,
      quarterSeconds: 45,
      difficulty: 'pro',
      rosterMode: 'balanced',
      dt: '1/60s',
      baseSeed: 10000,
    },
    leaderboard: rr.leaderboard,
    matrix: rr.matrix,
  };

  fs.writeFileSync(path.join(outDir, 'leaderboard.json'), JSON.stringify(summaryJson, null, 2));
  fs.writeFileSync(path.join(outDir, 'matches.csv'), matchesToCsv(rr.matches));
  fs.writeFileSync(
    path.join(outDir, 'REPORT.md'),
    formatLeaderboardMarkdown(
      rr.leaderboard,
      rr.matrix,
      'GBA GJAM — 9-Bot Baseline Evaluation',
      `Full side-swapped round-robin: **${rr.totalMatches} matches** (${gamesPerPair} games per pair, 4×45s quarters, 60Hz deterministic simulation, mirrored balanced rosters, seed base \`10000\`). Completed in ${elapsedSec}s.`,
    ),
  );

  console.log(`Done in ${elapsedSec}s! Results saved to games/gba-gjam/ai/results/baseline/`);
  console.log('\nTop 9 Leaderboard:');
  rr.leaderboard.forEach((e, i) => {
    console.log(
      `${i + 1}. ${e.botId.padEnd(18)} Elo=${e.elo}  W-L=${String(e.wins).padStart(2)}-${String(e.losses).padStart(2)} (${pct(e.winRate).padStart(5)})  PPG=${num(e.avgPts)}  Diff=${e.avgDiff >= 0 ? '+' : ''}${num(e.avgDiff)}  FG=${pct(e.fgPct)}  3P=${pct(e.tpPct)}  Dunks=${num(e.avgDunks)}  Steals=${num(e.avgSteals)}  Fire=${num(e.avgFire)}`,
    );
  });
}
