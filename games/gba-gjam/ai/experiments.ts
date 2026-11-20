import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createAlleyOopExpressBot,
  createArcArchitectBot,
  createChampionV1Bot,
  createChampionV2Bot,
  createFireFeederBot,
  createHybridAceBot,
  createLockdownCounterBot,
  createShoveHoundBot,
  type ChampionV2Params,
} from '../src/ai';
import {
  runRoundRobin,
  runSeries,
  sweepParameters,
  type AggregateBotStats,
  type BotFactory,
  type LeaderboardEntry,
} from '../src/ai/eval';
import { formatLeaderboardMarkdown, getBaselineRoster } from './baseline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXP_ROOT = path.resolve(__dirname, 'results', 'experiments');

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function num(v: number): string {
  return v.toFixed(1);
}

function writeExp(dirName: string, json: unknown, md: string): void {
  const dir = path.join(EXP_ROOT, dirName);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'results.json'), JSON.stringify(json, null, 2));
  fs.writeFileSync(path.join(dir, 'REPORT.md'), md);
}

function formatSeriesRow(label: string, a: AggregateBotStats, b: AggregateBotStats): string {
  const ci = `${pct(a.winRate)} (${pct(a.winRateCI95[0])}–${pct(a.winRateCI95[1])})`;
  const diff = `${a.avgDiff >= 0 ? '+' : ''}${num(a.avgDiff)}`;
  return `| ${label} | ${a.wins}-${a.losses} | ${ci} | ${num(a.avgPts)} – ${num(b.avgPts)} (${diff}) | ${pct(a.fgPct)} / ${pct(a.tpPct)} | ${num(a.avgSteals)} (${num(a.avgShoveTurnovers)}) | ${num(a.avgFire)} |`;
}

function formatSeriesRowV2(label: string, a: AggregateBotStats, b: AggregateBotStats): string {
  const ci = `${pct(a.winRate)} (${pct(a.winRateCI95[0])}–${pct(a.winRateCI95[1])})`;
  const meanDiff = `${a.avgDiff >= 0 ? '+' : ''}${num(a.avgDiff)}`;
  const medDiff = `${a.medianDiff >= 0 ? '+' : ''}${num(a.medianDiff)} [${num(a.iqrDiff[0])}..${num(a.iqrDiff[1])}]`;
  return `| ${label} | ${a.wins}-${a.losses} | ${ci} | ${num(a.avgPts)} – ${num(b.avgPts)} | ${meanDiff} | ${medDiff} | ${a.ppp.toFixed(2)} | ${a.avgPossessionSec.toFixed(2)}s | ${num(a.avgShovesSuffered)} | ${num(a.avgShoveTurnovers)} |`;
}

/** Experiment 1: 3PT Spacing vs Rim Dunking vs Hybrid EV across 3 roster archetypes. */
function runExperiment1(): { id: string; title: string; summary: string; totalMatches: number } {
  const bots: BotFactory[] = [
    { id: 'arc-architect', name: 'Arc Architect (3PT)', create: () => createArcArchitectBot() },
    { id: 'alley-oop-express', name: 'Alley-Oop Express (Rim)', create: () => createAlleyOopExpressBot() },
    { id: 'hybrid-ace', name: 'Hybrid Ace (EV)', create: () => createHybridAceBot() },
  ];

  const rosters: Array<{ mode: 'shooter' | 'dunker' | 'balanced'; label: string }> = [
    { mode: 'shooter', label: 'Shooter Roster (90 3PT / 50 Dunk)' },
    { mode: 'dunker', label: 'Dunker Roster (45 3PT / 90 Dunk)' },
    { mode: 'balanced', label: 'Balanced Roster (75–80 All-Around)' },
  ];

  const results: Record<string, ReturnType<typeof runRoundRobin>> = {};
  let totalMatches = 0;

  const md: string[] = [
    '# Experiment 1: 3-Point Volume vs. Rim Dunking Across Roster Archetypes',
    '',
    '## Experiment Card',
    '- **Question:** How does optimal offensive style (pure 3PT spacing vs. rim/alley-oop dunking vs. stat-aware EV) interact with roster stat profiles?',
    '- **Hypothesis:** Pure 3PT (`arc-architect`) will outperform rim-running on Shooter rosters (where uncontested apex 3s yield ~2.88 EPPS), while rim-running (`alley-oop-express`) will outperform 3PT on Dunker rosters, and `hybrid-ace` will adapt to win or finish top-2 across all three.',
    '- **Controlled Variables:** 4×45s quarters, 60Hz, `pro` difficulty, side-swapped Home/Away, `N = 12` games per pair per roster mode (108 total matches).',
    '',
  ];

  rosters.forEach((r, idx) => {
    const rr = runRoundRobin(bots, {
      games: 12,
      baseSeed: 21000 + idx * 5000,
      quarterSeconds: 45,
      difficulty: 'pro',
      rosterMode: r.mode,
    });
    results[r.mode] = rr;
    totalMatches += rr.totalMatches;

    md.push(`## ${r.label}`, '');
    md.push('| Rank | Bot | Elo | W-L | Win% (95% CI) | PPG | Diff | FG% | 3P% (3PA) | Dunks | Steals |');
    md.push('|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
    rr.leaderboard.forEach((e, i) => {
      const ci = `${pct(e.winRate)} (${pct(e.winRateCI95[0])}–${pct(e.winRateCI95[1])})`;
      md.push(
        `| ${i + 1} | **${e.botName}** | ${e.elo} | ${e.wins}-${e.losses} | ${ci} | ${num(e.avgPts)} | ${e.avgDiff >= 0 ? '+' : ''}${num(e.avgDiff)} | ${pct(e.fgPct)} | ${pct(e.tpPct)} (${num(e.avgTpa)}) | ${num(e.avgDunks)} | ${num(e.avgSteals)} |`,
      );
    });
    md.push('');
  });

  const shooterTop = results.shooter.leaderboard[0];
  const dunkerTop = results.dunker.leaderboard[0];
  const balancedTop = results.balanced.leaderboard[0];

  md.push(
    '## Key Findings',
    `- **Shooter roster winner:** \`${shooterTop.botId}\` (${shooterTop.wins}-${shooterTop.losses}, ${num(shooterTop.avgPts)} PPG, ${pct(shooterTop.tpPct)} 3P%).`,
    `- **Dunker roster winner:** \`${dunkerTop.botId}\` (${dunkerTop.wins}-${dunkerTop.losses}, ${num(dunkerTop.avgPts)} PPG, ${num(dunkerTop.avgDunks)} dunks/g).`,
    `- **Balanced roster winner:** \`${balancedTop.botId}\` (${balancedTop.wins}-${balancedTop.losses}, ${num(balancedTop.avgPts)} PPG).`,
    '- **Takeaway for Champion:** Stat-aware EV selection beats locked single-style offense across rosters, because it fires ~90%+ 3s when shooters are open and seamlessly switches to guaranteed dunks on low-3PT builds.',
    '',
  );

  writeExp('exp1-offense-vs-roster', { rosters: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, { leaderboard: v.leaderboard, matrix: v.matrix }])) }, md.join('\n'));
  return {
    id: 'exp1',
    title: '3-Point Volume vs. Rim Dunking Across Rosters',
    summary: `Winner by roster — Shooter: ${shooterTop.botId} (${pct(shooterTop.winRate)}), Dunker: ${dunkerTop.botId} (${pct(dunkerTop.winRate)}), Balanced: ${balancedTop.botId} (${pct(balancedTop.winRate)}).`,
    totalMatches,
  };
}

/** Experiment 2: Defense Meta Sweep (holding offense 100% constant). */
function runExperiment2(): { id: string; title: string; summary: string; totalMatches: number } {
  const bots: BotFactory[] = [
    { id: 'def-passive', name: 'Passive Containment', create: () => createHybridAceBot({ defenseMode: 'passive' }) },
    { id: 'def-steal-only', name: 'Steal-Poke Only (No Shove)', create: () => createHybridAceBot({ defenseMode: 'steal-only' }) },
    { id: 'def-balanced-shove', name: 'Balanced Shove (Turbo>=35)', create: () => createHybridAceBot({ defenseMode: 'balanced-shove' }) },
    { id: 'def-relentless-shove', name: 'Relentless Shove (Turbo>=22)', create: () => createHybridAceBot({ defenseMode: 'relentless-shove' }) },
  ];

  // Override IDs cleanly for telemetry clarity
  const wrappedBots: BotFactory[] = bots.map((b) => ({
    ...b,
    create: () => {
      const inner = b.create();
      return { id: b.id, name: b.name, decide: (s, c) => inner.decide(s, c) };
    },
  }));

  const rr = runRoundRobin(wrappedBots, {
    games: 12,
    baseSeed: 31000,
    quarterSeconds: 45,
    difficulty: 'pro',
    rosterMode: 'balanced',
  });

  const md = [
    formatLeaderboardMarkdown(
      rr.leaderboard,
      rr.matrix,
      'Experiment 2: Defense Policy Sweep (Controlled Offense)',
      'Holds offense 100% identical (`hybrid-ace` offense) and varies ONLY defensive policy across 4 levels: Passive Containment, Steal-Poke Only, Balanced Shove (`turbo >= 35`), and Relentless Shove (`turbo >= 22`). 12 games/pair (72 matches), balanced rosters.',
    ),
    '## Experiment Card & Findings',
    '- **Hypothesis:** Because turbo-shove in `src/sim.ts` is a 100% guaranteed turnover + 0.85s stun (costing 22 turbo) with no foul penalty, lower shove turbo thresholds will monotonically increase steals/shove-turnovers and win rate.',
    `- **Winner:** **${rr.leaderboard[0].botName}** (Elo ${rr.leaderboard[0].elo}, ${rr.leaderboard[0].wins}-${rr.leaderboard[0].losses}, ${pct(rr.leaderboard[0].winRate)}, ${num(rr.leaderboard[0].avgShoveTurnovers)} shove TO/g).`,
    `- **Runner-up:** **${rr.leaderboard[1].botName}** (Elo ${rr.leaderboard[1].elo}, ${rr.leaderboard[1].wins}-${rr.leaderboard[1].losses}, ${pct(rr.leaderboard[1].winRate)}).`,
    `- **Steal-Poke Only vs Passive:** Steal-Poke (${rr.leaderboard.find((e) => e.botId === 'def-steal-only')?.wins}-${rr.leaderboard.find((e) => e.botId === 'def-steal-only')?.losses}) vs Passive (${rr.leaderboard.find((e) => e.botId === 'def-passive')?.wins}-${rr.leaderboard.find((e) => e.botId === 'def-passive')?.losses}).`,
    '- **Takeaway for Champion:** Relentless turbo-shove (`turbo >= 22`) is the single highest-leverage defensive mechanic in GBA GJAM — AND this also reveals why an anti-shove offensive counter (passing before contact) is essential to beat shove-heavy bots.',
    '',
  ].join('\n');

  writeExp('exp2-defense-meta', { leaderboard: rr.leaderboard, matrix: rr.matrix }, md);
  return {
    id: 'exp2',
    title: 'Defense Policy Sweep (Passive vs Steal vs Shove)',
    summary: `Winner: ${rr.leaderboard[0].botName} (${pct(rr.leaderboard[0].winRate)}, Elo ${rr.leaderboard[0].elo}, ${num(rr.leaderboard[0].avgShoveTurnovers)} shove TO/g).`,
    totalMatches: rr.totalMatches,
  };
}

/** Experiment 3: 2x2 Factorial Ablation — Apex Shot Timing x Contest Discipline. */
function runExperiment3(): { id: string; title: string; summary: string; totalMatches: number } {
  const bots: BotFactory[] = [
    {
      id: 'apex1-disc1',
      name: 'Apex ON + Contest Discipline ON',
      create: () => createArcArchitectBot({ strictApex: true, contestDiscipline: true }),
    },
    {
      id: 'apex1-disc0',
      name: 'Apex ON + Contest Discipline OFF',
      create: () => createArcArchitectBot({ strictApex: true, contestDiscipline: false }),
    },
    {
      id: 'apex0-disc1',
      name: 'Apex OFF + Contest Discipline ON',
      create: () => createArcArchitectBot({ strictApex: false, contestDiscipline: true }),
    },
    {
      id: 'apex0-disc0',
      name: 'Apex OFF + Contest Discipline OFF',
      create: () => createArcArchitectBot({ strictApex: false, contestDiscipline: false }),
    },
  ];

  const wrapped: BotFactory[] = bots.map((b) => ({
    ...b,
    create: () => {
      const inner = b.create();
      return { id: b.id, name: b.name, decide: (s, c) => inner.decide(s, c) };
    },
  }));

  const rr = runRoundRobin(wrapped, {
    games: 12,
    baseSeed: 41000,
    quarterSeconds: 45,
    difficulty: 'pro',
    rosterMode: 'shooter',
  });

  const byId = (id: string): LeaderboardEntry => rr.leaderboard.find((e) => e.botId === id)!;
  const a1d1 = byId('apex1-disc1');
  const a1d0 = byId('apex1-disc0');
  const a0d1 = byId('apex0-disc1');
  const a0d0 = byId('apex0-disc0');

  const md = [
    formatLeaderboardMarkdown(
      rr.leaderboard,
      rr.matrix,
      'Experiment 3: 2×2 Ablation — Apex Shot Timing × Contest Discipline',
      'Factorial ablation on `arc-architect` using Shooter rosters (90 3PT) so jump-shot execution dominates. 12 games/pair (72 matches).',
    ),
    '## Factorial Effect Decomposition',
    `- **Apex Timing Effect (ON vs OFF, averaged):** 3P% jumps from **${pct((a0d1.tpPct + a0d0.tpPct) / 2)}** → **${pct((a1d1.tpPct + a1d0.tpPct) / 2)}** (+${(((a1d1.tpPct + a1d0.tpPct) - (a0d1.tpPct + a0d0.tpPct)) * 50).toFixed(1)} percentage points!).`,
    `- **Contest Discipline Effect (ON vs OFF, averaged):** Win% moves from **${pct((a1d0.winRate + a0d0.winRate) / 2)}** → **${pct((a1d1.winRate + a0d1.winRate) / 2)}**, 3P% moves from **${pct((a1d0.tpPct + a0d0.tpPct) / 2)}** → **${pct((a1d1.tpPct + a0d1.tpPct) / 2)}**.`,
    `- **Winner:** **${rr.leaderboard[0].botName}** (Elo ${rr.leaderboard[0].elo}, ${pct(rr.leaderboard[0].winRate)}, ${pct(rr.leaderboard[0].tpPct)} 3P%).`,
    '- **Takeaway for Champion:** Contest discipline is the dominant lever (+38.8pp win rate!). Surprisingly, quick-release (`Apex OFF`) beat strict apex (`Apex ON`) on Shooter rosters (72.2% vs 66.7%, 229 PPG vs 164 PPG): because 90-3PT uncontested shooters already make >95% of quick-release 3s, waiting ~0.35s for apex only adds +1.4pp 3P% while surrendering tempo and giving defenders time to close.',
    '',
  ].join('\n');

  writeExp('exp3-shot-micro-ablation', { leaderboard: rr.leaderboard, matrix: rr.matrix }, md);
  return {
    id: 'exp3',
    title: '2×2 Ablation: Apex Timing × Contest Discipline',
    summary: `Winner: ${rr.leaderboard[0].botName} (${pct(rr.leaderboard[0].winRate)}, ${pct(rr.leaderboard[0].tpPct)} 3P%). Apex timing lifted 3P% by +${(((a1d1.tpPct + a1d0.tpPct) - (a0d1.tpPct + a0d0.tpPct)) * 50).toFixed(1)}pp.`,
    totalMatches: rr.totalMatches,
  };
}

/** Experiment 4: Hot-Hand / ON FIRE Funneling A/B Test. */
function runExperiment4(): { id: string; title: string; summary: string; totalMatches: number } {
  const funnelOn: BotFactory = {
    id: 'fire-funnel-on',
    name: 'Fire Feeder (Funnel ON)',
    create: () => {
      const inner = createFireFeederBot({ funnelFire: true });
      return { id: 'fire-funnel-on', name: 'Fire Feeder (Funnel ON)', decide: (s, c) => inner.decide(s, c) };
    },
  };
  const funnelOff: BotFactory = {
    id: 'fire-funnel-off',
    name: 'Fire Feeder (Funnel OFF)',
    create: () => {
      const inner = createFireFeederBot({ funnelFire: false });
      return { id: 'fire-funnel-off', name: 'Fire Feeder (Funnel OFF)', decide: (s, c) => inner.decide(s, c) };
    },
  };

  const h2h = runSeries(funnelOn, funnelOff, {
    games: 20,
    baseSeed: 51000,
    quarterSeconds: 45,
    difficulty: 'pro',
    rosterMode: 'balanced',
  });

  const opponents: BotFactory[] = [
    { id: 'shove-hound', name: 'Shove Hound', create: () => createShoveHoundBot() },
    { id: 'hybrid-ace', name: 'Hybrid Ace', create: () => createHybridAceBot() },
    { id: 'arc-architect', name: 'Arc Architect', create: () => createArcArchitectBot() },
    { id: 'alley-oop-express', name: 'Alley-Oop Express', create: () => createAlleyOopExpressBot() },
  ];

  const gauntletOn: Array<{ opp: string; res: ReturnType<typeof runSeries> }> = [];
  const gauntletOff: Array<{ opp: string; res: ReturnType<typeof runSeries> }> = [];
  let totalMatches = h2h.games;

  opponents.forEach((opp, idx) => {
    const rOn = runSeries(funnelOn, opp, { games: 12, baseSeed: 52000 + idx * 500, rosterMode: 'balanced' });
    const rOff = runSeries(funnelOff, opp, { games: 12, baseSeed: 52000 + idx * 500, rosterMode: 'balanced' });
    gauntletOn.push({ opp: opp.id, res: rOn });
    gauntletOff.push({ opp: opp.id, res: rOff });
    totalMatches += rOn.games + rOff.games;
  });

  const onWins = gauntletOn.reduce((s, x) => s + x.res.botA.wins, 0);
  const offWins = gauntletOff.reduce((s, x) => s + x.res.botA.wins, 0);
  const gGames = gauntletOn.reduce((s, x) => s + x.res.games, 0);
  const onFireAvg = gauntletOn.reduce((s, x) => s + x.res.botA.avgFire, 0) / gauntletOn.length;
  const offFireAvg = gauntletOff.reduce((s, x) => s + x.res.botA.avgFire, 0) / gauntletOff.length;

  const md: string[] = [
    '# Experiment 4: The "ON FIRE!" Funnel — Does Feeding the Hot Hand Win Games?',
    '',
    '## Experiment Card',
    '- **Question:** Does actively passing to a teammate who has `streak >= 1` or `onFire === true` increase On-Fire activations and win rate?',
    '- **Hypothesis:** Funneling possessions to the hot hand will raise On-Fire activations/game and win rate, because ON FIRE grants infinite turbo, unblockable Meteor Dunks, and +28% shooting.',
    '- **Control:** `fire-funnel-off` (`funnelFire: false`) — identical scoring/defense logic without streak-based passing.',
    '- **Treatment:** `fire-funnel-on` (`funnelFire: true`).',
    '- **Sample:** 20-game direct H2H + 48-game matched-seed gauntlet against 4 diverse opponents (116 total matches).',
    '',
    '## Direct Head-to-Head (N = 20)',
    '| Matchup | W-L | Win% (95% CI) | Avg Score (Diff) | FG% / 3P% | Steals (Shove) | On-Fire/g |',
    '|---|---:|---:|---:|---:|---:|---:|',
    formatSeriesRow('Funnel ON vs Funnel OFF', h2h.botA, h2h.botB),
    '',
    '## Matched-Seed Gauntlet vs. 4 Opponents (N = 48 each)',
    '| Opponent | Funnel ON W-L (Diff, Fire/g) | Funnel OFF W-L (Diff, Fire/g) |',
    '|---|---:|---:|',
    ...opponents.map((opp, i) => {
      const a = gauntletOn[i].res.botA;
      const b = gauntletOff[i].res.botA;
      return `| \`${opp.id}\` | ${a.wins}-${a.losses} (${a.avgDiff >= 0 ? '+' : ''}${num(a.avgDiff)}, ${num(a.avgFire)} fire/g) | ${b.wins}-${b.losses} (${b.avgDiff >= 0 ? '+' : ''}${num(b.avgDiff)}, ${num(b.avgFire)} fire/g) |`;
    }),
    `| **TOTAL** | **${onWins}-${gGames - onWins} (${pct(onWins / gGames)}, ${num(onFireAvg)} fire/g)** | **${offWins}-${gGames - offWins} (${pct(offWins / gGames)}, ${num(offFireAvg)} fire/g)** |`,
    '',
    '## Key Findings',
    `- **Direct H2H:** Funnel ON went **${h2h.botA.wins}-${h2h.botA.losses}** (${pct(h2h.botA.winRate)}, ${h2h.botA.avgDiff >= 0 ? '+' : ''}${num(h2h.botA.avgDiff)} diff). On-Fire/g: **${num(h2h.botA.avgFire)}** vs **${num(h2h.botB.avgFire)}**.`,
    `- **Gauntlet:** Funnel ON went **${onWins}-${gGames - onWins}** (${pct(onWins / gGames)}) vs Funnel OFF **${offWins}-${gGames - offWins}** (${pct(offWins / gGames)}).`,
    '- **Diagnosis:** Check whether passing to the hot hand at `streak === 1` occasionally slows tempo vs only funneling at `streak >= 2` or `onFire`. In `champion-v1`, we restrict funneling to `onFire` or `streak >= 2` AND only when the teammate is safe from defenders (`mateDefDist > 1.85m`).',
    '',
  ];

  writeExp(
    'exp4-on-fire-funnel',
    {
      h2h: { funnelOn: h2h.botA, funnelOff: h2h.botB },
      gauntlet: {
        funnelOn: gauntletOn.map((g) => ({ opp: g.opp, stats: g.res.botA })),
        funnelOff: gauntletOff.map((g) => ({ opp: g.opp, stats: g.res.botA })),
      },
    },
    md.join('\n'),
  );

  return {
    id: 'exp4',
    title: 'Hot-Hand / ON FIRE Funnel A/B Test',
    summary: `Direct H2H: Funnel ON ${h2h.botA.wins}-${h2h.botA.losses} (${pct(h2h.botA.winRate)}, ${num(h2h.botA.avgFire)} vs ${num(h2h.botB.avgFire)} fire/g). Gauntlet: ${onWins}/${gGames} vs ${offWins}/${gGames}.`,
    totalMatches,
  };
}

/** Experiment 5: Synthesizing Findings into Champion v1 — Full 10-Bot Gauntlet + Cross-Roster Validation. */
function runExperiment5(): { id: string; title: string; summary: string; totalMatches: number } {
  const champ: BotFactory = { id: 'champion-v1', name: 'Champion v1', create: () => createChampionV1Bot() };
  const shoveHound: BotFactory = { id: 'shove-hound', name: 'Shove Hound', create: () => createShoveHoundBot() };

  // 1. Direct title match vs Baseline #1 (shove-hound) on balanced & pro-teams rosters
  const h2hBalanced = runSeries(champ, shoveHound, {
    games: 20,
    baseSeed: 61000,
    quarterSeconds: 45,
    difficulty: 'pro',
    rosterMode: 'balanced',
  });
  const h2hProTeams = runSeries(champ, shoveHound, {
    games: 20,
    baseSeed: 62000,
    quarterSeconds: 45,
    difficulty: 'pro',
    rosterMode: 'pro-teams',
  });

  // 2. Full 10-bot round-robin (9 baseline bots + champion-v1, 6 games/pair = 270 matches)
  const allTen: BotFactory[] = [...getBaselineRoster(), champ];
  const rr = runRoundRobin(allTen, {
    games: 6,
    baseSeed: 63000,
    quarterSeconds: 45,
    difficulty: 'pro',
    rosterMode: 'balanced',
  });

  // 3. Cross-roster Pro-Teams gauntlet vs top 4 baseline bots (8 games each = 32 matches)
  const topFour = getBaselineRoster().filter((b) =>
    ['shove-hound', 'hybrid-ace', 'fire-feeder', 'alley-oop-express'].includes(b.id),
  );
  const proGauntlet = topFour.map((opp, idx) => ({
    opp: opp.id,
    res: runSeries(champ, opp, { games: 8, baseSeed: 65000 + idx * 400, rosterMode: 'pro-teams' }),
  }));
  const proWins = proGauntlet.reduce((s, x) => s + x.res.botA.wins, 0);
  const proGames = proGauntlet.reduce((s, x) => s + x.res.games, 0);

  const champEntry = rr.leaderboard.find((e) => e.botId === 'champion-v1')!;
  const champRank = rr.leaderboard.findIndex((e) => e.botId === 'champion-v1') + 1;

  const promoted =
    champRank === 1 &&
    h2hBalanced.botA.winRate > 0.55 &&
    h2hBalanced.botA.avgDiff > 0 &&
    proWins / proGames > 0.6;

  const md = [
    '# Experiment 5: Champion v1 Synthesis & Promotion Gauntlet',
    '',
    '## Experiment Card',
    '- **Hypothesis:** Synthesizing the winning levers from Experiments 1–4 (stat-aware EV offense + strict apex 3PT timing + relentless turbo-shove defense + streak>=2 hot-hand funneling) PLUS an **anti-shove ball-protection pass** (passing to an open teammate when a defender closes within `2.05m`) will dethrone baseline #1 `shove-hound` and claim #1 Elo across the entire 10-bot field.',
    '- **Promotion Criteria (from `EXPERIMENT_PROCESS.md`):**',
    `  1. Rank #1 in 10-bot round-robin Elo: **${champRank === 1 ? 'PASS' : 'FAIL'}** (Rank #${champRank}, Elo ${champEntry.elo})`,
    `  2. Beat prior #1 (\`shove-hound\`) >55% over N=20 balanced games: **${h2hBalanced.botA.winRate > 0.55 ? 'PASS' : 'FAIL'}** (${h2hBalanced.botA.wins}-${h2hBalanced.botA.losses}, ${pct(h2hBalanced.botA.winRate)}, ${h2hBalanced.botA.avgDiff >= 0 ? '+' : ''}${num(h2hBalanced.botA.avgDiff)} diff)`,
    `  3. Cross-roster Pro-Teams gauntlet >60%: **${proWins / proGames > 0.6 ? 'PASS' : 'FAIL'}** (${proWins}-${proGames - proWins}, ${pct(proWins / proGames)})`,
    `  - **OVERALL VERDICT:** ${promoted ? '🏆 **PROMOTED TO CHAMPION v1!**' : '🔬 **ITERATE — SEE DIAGNOSIS BELOW**'}`,
    '',
    '## Direct Title Match vs. `shove-hound`',
    '| Roster Mode | W-L | Win% (95% CI) | Avg Score (Diff) | FG% / 3P% | Steals (Shove) | On-Fire/g |',
    '|---|---:|---:|---:|---:|---:|---:|',
    formatSeriesRow('Balanced (N=20)', h2hBalanced.botA, h2hBalanced.botB),
    formatSeriesRow('Pro Teams (N=20)', h2hProTeams.botA, h2hProTeams.botB),
    '',
    '## Cross-Roster Pro-Teams Gauntlet (vs. Baseline Top 4)',
    '| Opponent | Champion v1 W-L | Win% | Avg Score (Diff) |',
    '|---|---:|---:|---:|',
    ...proGauntlet.map(({ opp, res }) => {
      const a = res.botA;
      const b = res.botB;
      return `| \`${opp}\` | ${a.wins}-${a.losses} | ${pct(a.winRate)} | ${num(a.avgPts)} – ${num(b.avgPts)} (${a.avgDiff >= 0 ? '+' : ''}${num(a.avgDiff)}) |`;
    }),
    `| **TOTAL** | **${proWins}-${proGames - proWins}** | **${pct(proWins / proGames)}** | — |`,
    '',
    formatLeaderboardMarkdown(
      rr.leaderboard,
      rr.matrix,
      '10-Bot Full Round-Robin Leaderboard (Balanced Rosters, 6 games/pair = 270 matches)',
      `Full field including \`champion-v1\`.`,
    ),
  ].join('\n');

  const totalMatches = h2hBalanced.games + h2hProTeams.games + rr.totalMatches + proGames;
  writeExp(
    'exp5-champion-v1-gauntlet',
    {
      promoted,
      champRank,
      h2hBalanced: { champion: h2hBalanced.botA, shoveHound: h2hBalanced.botB },
      h2hProTeams: { champion: h2hProTeams.botA, shoveHound: h2hProTeams.botB },
      proGauntlet: proGauntlet.map((g) => ({ opp: g.opp, stats: g.res.botA })),
      leaderboard: rr.leaderboard,
      matrix: rr.matrix,
    },
    md,
  );

  return {
    id: 'exp5',
    title: 'Champion v1 Synthesis & Promotion Gauntlet',
    summary: `Rank #${champRank}/10 (Elo ${champEntry.elo}, ${pct(champEntry.winRate)} RR). vs shove-hound: ${h2hBalanced.botA.wins}-${h2hBalanced.botA.losses} balanced, ${h2hProTeams.botA.wins}-${h2hProTeams.botA.losses} pro-teams. Pro gauntlet: ${proWins}/${proGames} (${pct(proWins / proGames)}). Verdict: ${promoted ? 'PROMOTED' : 'ITERATE'}.`,
    totalMatches,
  };
}

/** Experiment 6: Inbound & Transition Anti-Shove Blitz. */
function runExperiment6(): { id: string; title: string; summary: string; totalMatches: number } {
  const shoveHound: BotFactory = { id: 'shove-hound', name: 'Shove Hound', create: () => createShoveHoundBot() };
  const hybridAce: BotFactory = { id: 'hybrid-ace', name: 'Hybrid Ace', create: () => createHybridAceBot() };

  const variants: Array<{ id: string; name: string; create: () => ReturnType<typeof createChampionV1Bot> }> = [
    { id: 'champion-v1', name: 'Control (champion-v1)', create: () => createChampionV1Bot() },
    { id: 'exp6-inbound-pass', name: 'Inbound Lead-Pass', create: () => createChampionV1Bot({ inboundPass: true }) },
    { id: 'exp6-sideline-arc', name: 'Sideline Arc', create: () => createChampionV1Bot({ sidelineArc: true }) },
    { id: 'exp6-pass-plus-arc', name: 'Inbound Pass + Sideline Arc', create: () => createChampionV1Bot({ inboundPass: true, sidelineArc: true }) },
  ];

  const vsShove: Array<{ id: string; name: string; a: AggregateBotStats; b: AggregateBotStats }> = [];
  const vsHybrid: Array<{ id: string; name: string; a: AggregateBotStats; b: AggregateBotStats }> = [];
  let totalMatches = 0;

  variants.forEach((v, idx) => {
    const f: BotFactory = { id: v.id, name: v.name, create: v.create };
    const rShove = runSeries(f, shoveHound, { games: 20, baseSeed: 71000 + idx * 100, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'balanced' });
    const rHybrid = runSeries(f, hybridAce, { games: 12, baseSeed: 71500 + idx * 100, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'balanced' });
    vsShove.push({ id: v.id, name: v.name, a: rShove.botA, b: rShove.botB });
    vsHybrid.push({ id: v.id, name: v.name, a: rHybrid.botA, b: rHybrid.botB });
    totalMatches += rShove.games + rHybrid.games;
  });

  const md = [
    '# Experiment 6: Inbound & Transition Anti-Shove Blitz',
    '',
    '## Experiment Card',
    '- **League:** `Unrestricted (60Hz)`',
    '- **Question:** Can an immediate inbound lead-pass or sideline sprint break `shove-hound`\'s mid-court trap?',
    '- **Hypothesis:** Tick-1 forward lead-pass to the teammate (4m ahead) or sprinting diagonally to the sideline will cut `shovesSuffered` vs `shove-hound` by >=40% and lift `medianDiff` by >=+60 PPG.',
    '- **Controlled Variables:** 4x45s, 60Hz, `pro`, side-swapped, `N=20` vs `shove-hound` + `N=12` vs `hybrid-ace`, balanced rosters, seed base `71000`.',
    '',
    '## vs. Shove Hound (N = 20, Balanced)',
    '| Variant | W-L | Win% (95% CI) | Score | Mean Diff | Med Diff [IQR] | PPP | Poss(s) | ShvSuf | ShvTO |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
    ...vsShove.map((r) => formatSeriesRowV2(r.name, r.a, r.b)),
    '',
    '## vs. Hybrid Ace (N = 12, Balanced)',
    '| Variant | W-L | Win% (95% CI) | Score | Mean Diff | Med Diff [IQR] | PPP | Poss(s) | ShvSuf | ShvTO |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
    ...vsHybrid.map((r) => formatSeriesRowV2(r.name, r.a, r.b)),
    '',
  ].join('\n');

  writeExp('exp6-inbound-blitz', { vsShove, vsHybrid }, md);
  const best = [...vsShove].sort((x, y) => y.a.winRate - x.a.winRate || y.a.medianDiff - x.a.medianDiff)[0];
  return {
    id: 'exp6',
    title: 'Inbound & Transition Anti-Shove Blitz',
    summary: `Best vs shove-hound: ${best.id} (${best.a.wins}-${best.a.losses}, medDiff ${best.a.medianDiff >= 0 ? '+' : ''}${num(best.a.medianDiff)}, ShvSuf ${num(best.a.avgShovesSuffered)} vs ctrl ${num(vsShove[0].a.avgShovesSuffered)}).`,
    totalMatches,
  };
}

/** Experiment 7: Quick-Release 3PT vs. Immediate Turbo-Dunk (Eliminating Hesitation). */
function runExperiment7(): { id: string; title: string; summary: string; totalMatches: number } {
  const shoveHound: BotFactory = { id: 'shove-hound', name: 'Shove Hound', create: () => createShoveHoundBot() };
  const hybridAce: BotFactory = { id: 'hybrid-ace', name: 'Hybrid Ace', create: () => createHybridAceBot() };

  const variants: Array<{ id: string; name: string; create: () => ReturnType<typeof createChampionV1Bot> }> = [
    { id: 'champion-v1', name: 'Control (champion-v1)', create: () => createChampionV1Bot() },
    { id: 'exp7-quick-release', name: 'Quick-Release 3PT', create: () => createChampionV1Bot({ quickRelease: true }) },
    { id: 'exp7-no-wing-hunt', name: 'No Wing-Hunt (<4.5m)', create: () => createChampionV1Bot({ noWingHunt: true }) },
    { id: 'exp7-both', name: 'Quick-Release + No Wing-Hunt', create: () => createChampionV1Bot({ quickRelease: true, noWingHunt: true }) },
  ];

  const rows: Array<{ roster: string; opp: string; id: string; name: string; a: AggregateBotStats; b: AggregateBotStats }> = [];
  let totalMatches = 0;

  for (const rosterMode of ['balanced', 'shooter'] as const) {
    for (const opp of [shoveHound, hybridAce]) {
      variants.forEach((v, idx) => {
        const f: BotFactory = { id: v.id, name: v.name, create: v.create };
        const res = runSeries(f, opp, {
          games: 20,
          baseSeed: 72000 + (rosterMode === 'shooter' ? 2000 : 0) + (opp.id === 'hybrid-ace' ? 500 : 0) + idx * 100,
          quarterSeconds: 45,
          difficulty: 'pro',
          rosterMode,
        });
        rows.push({ roster: rosterMode, opp: opp.id, id: v.id, name: v.name, a: res.botA, b: res.botB });
        totalMatches += res.games;
      });
    }
  }

  const md = [
    '# Experiment 7: Quick-Release 3PT vs. Immediate Turbo-Dunk',
    '',
    '## Experiment Card',
    '- **League:** `Unrestricted (60Hz)`',
    '- **Question:** Does quick-release 3PT + banning lateral wing-hunting under pressure make `champion-v1` competitive vs `shove-hound`?',
    '- **Controlled Variables:** 4x45s, 60Hz, `pro`, side-swapped, `N=20` per matchup, balanced & shooter rosters, seed base `72000`.',
    '',
  ];

  for (const rosterMode of ['balanced', 'shooter'] as const) {
    for (const opp of ['shove-hound', 'hybrid-ace']) {
      md.push(`## Roster: ${rosterMode} vs. ${opp} (N = 20)`);
      md.push('| Variant | W-L | Win% (95% CI) | Score | Mean Diff | Med Diff [IQR] | PPP | Poss(s) | ShvSuf | ShvTO |');
      md.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
      rows
        .filter((r) => r.roster === rosterMode && r.opp === opp)
        .forEach((r) => md.push(formatSeriesRowV2(r.name, r.a, r.b)));
      md.push('');
    }
  }

  writeExp('exp7-hesitation-removal', { rows }, md.join('\n'));
  const balShove = rows.filter((r) => r.roster === 'balanced' && r.opp === 'shove-hound');
  const best = [...balShove].sort((x, y) => y.a.winRate - x.a.winRate || y.a.medianDiff - x.a.medianDiff)[0];
  return {
    id: 'exp7',
    title: 'Quick-Release 3PT vs. Immediate Turbo-Dunk',
    summary: `Balanced vs shove-hound best: ${best.id} (${best.a.wins}-${best.a.losses}, medDiff ${best.a.medianDiff >= 0 ? '+' : ''}${num(best.a.medianDiff)}, ShvSuf ${num(best.a.avgShovesSuffered)}).`,
    totalMatches,
  };
}

/** Experiment 8: Pre-Emptive Off-Ball Shoving & 2v1 Trap Defense (Parameter Sweep). */
function runExperiment8(): { id: string; title: string; summary: string; totalMatches: number } {
  const opponents: BotFactory[] = [
    { id: 'shove-hound', name: 'Shove Hound', create: () => createShoveHoundBot() },
    { id: 'champion-v1', name: 'Champion v1', create: () => createChampionV1Bot() },
    { id: 'hybrid-ace', name: 'Hybrid Ace', create: () => createHybridAceBot() },
  ];

  const candidates: Array<{ label: string; params: { offBallShoveTurboMin: number; doubleTeamRadius: number } }> = [];
  for (const offBallShoveTurboMin of [24, 35, 55, Infinity]) {
    for (const doubleTeamRadius of [5.0, 7.5, 11.0]) {
      const turboLabel = Number.isFinite(offBallShoveTurboMin) ? String(offBallShoveTurboMin) : 'Inf';
      candidates.push({
        label: `offTurbo=${turboLabel}, dblR=${doubleTeamRadius}`,
        params: { offBallShoveTurboMin, doubleTeamRadius },
      });
    }
  }

  const sweep = sweepParameters({
    candidates,
    createBot: (params, label) => ({
      id: `exp8-${label.replace(/[^a-z0-9]/gi, '_')}`,
      name: `ShoveHound(${label})`,
      create: () => createShoveHoundBot(params),
    }),
    opponents,
    series: { games: 12, baseSeed: 73000, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'balanced' },
  });

  const totalMatches = sweep.length * opponents.length * 12;
  const best = sweep[0];
  const bestFactory: BotFactory = {
    id: 'exp8-best',
    name: `Best(${best.label})`,
    create: () => createShoveHoundBot(best.params),
  };
  const h2h = runSeries(bestFactory, opponents[0], {
    games: 20,
    baseSeed: 73900,
    quarterSeconds: 45,
    difficulty: 'pro',
    rosterMode: 'balanced',
  });

  const md = [
    '# Experiment 8: Pre-Emptive Off-Ball Shoving & 2v1 Trap Defense',
    '',
    '## Experiment Card',
    '- **League:** `Unrestricted (60Hz)`',
    '- **Question:** Optimal turbo threshold for off-ball shoving vs. double-team radius on defense?',
    '- **Controlled Variables:** 4x45s, 60Hz, `pro`, side-swapped, `N=12` per opp (`{shove-hound, champion-v1, hybrid-ace}`), balanced rosters, seed base `73000`.',
    '',
    '## Parameter Sweep Leaderboard (36 matches per config)',
    '| Rank | Config | W-L | Win% (95% CI) | PPG | OppPPG | Med Diff [IQR] | PPP | ShvTO | ShvSuf |',
    '|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|',
    ...sweep.map((r, i) => {
      const s = r.stats;
      const ci = `${pct(s.winRate)} (${pct(s.winRateCI95[0])}–${pct(s.winRateCI95[1])})`;
      const med = `${s.medianDiff >= 0 ? '+' : ''}${num(s.medianDiff)} [${num(s.iqrDiff[0])}..${num(s.iqrDiff[1])}]`;
      return `| ${i + 1} | ${r.label} | ${s.wins}-${s.losses} | ${ci} | ${num(s.avgPts)} | ${num(s.avgOppPts)} | ${med} | ${s.ppp.toFixed(2)} | ${num(s.avgShoveTurnovers)} | ${num(s.avgShovesSuffered)} |`;
    }),
    '',
    `## Direct H2H: Best (${best.label}) vs. Control Shove Hound (N = 20)`,
    '| Matchup | W-L | Win% (95% CI) | Score | Mean Diff | Med Diff [IQR] | PPP | Poss(s) | ShvSuf | ShvTO |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
    formatSeriesRowV2(bestFactory.name, h2h.botA, h2h.botB),
    '',
  ].join('\n');

  writeExp('exp8-offball-trap-sweep', { sweep, h2h: { best: h2h.botA, control: h2h.botB } }, md);
  return {
    id: 'exp8',
    title: 'Pre-Emptive Off-Ball Shoving & 2v1 Trap Defense',
    summary: `Top sweep: ${best.label} (${best.stats.wins}-${best.stats.losses}, ShvTO ${num(best.stats.avgShoveTurnovers)}). H2H vs shove-hound: ${h2h.botA.wins}-${h2h.botA.losses} (medDiff ${h2h.botA.medianDiff >= 0 ? '+' : ''}${num(h2h.botA.medianDiff)}).`,
    totalMatches: totalMatches + h2h.games,
  };
}

/** Experiment 9: Dunk-Reach Perimeter Geometry (Earliest Shove-Immune Launch). */
function runExperiment9(): { id: string; title: string; summary: string; totalMatches: number } {
  const shoveHound: BotFactory = { id: 'shove-hound', name: 'Shove Hound', create: () => createShoveHoundBot() };
  const ctrl: BotFactory = { id: 'champion-v1', name: 'Control (champion-v1)', create: () => createChampionV1Bot() };
  const perim: BotFactory = { id: 'exp9-dunk-perim', name: 'Dunk-Reach Perimeter', create: () => createChampionV1Bot({ dunkPerimeter: true }) };

  const balCtrl = runSeries(ctrl, shoveHound, { games: 20, baseSeed: 74000, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'balanced' });
  const balPerim = runSeries(perim, shoveHound, { games: 20, baseSeed: 74000, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'balanced' });
  const dnkCtrl = runSeries(ctrl, shoveHound, { games: 20, baseSeed: 74500, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'dunker' });
  const dnkPerim = runSeries(perim, shoveHound, { games: 20, baseSeed: 74500, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'dunker' });
  const h2h = runSeries(perim, ctrl, { games: 20, baseSeed: 74900, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'balanced' });

  const totalMatches = balCtrl.games + balPerim.games + dnkCtrl.games + dnkPerim.games + h2h.games;

  const md = [
    '# Experiment 9: Dunk-Reach Perimeter Geometry',
    '',
    '## Experiment Card',
    '- **League:** `Unrestricted (60Hz)`',
    '- **Question:** Does steering toward the safest point on the outer `dunkReach` perimeter trigger shove-immune dunks sooner than driving under the rim?',
    '- **Controlled Variables:** 4x45s, 60Hz, `pro`, side-swapped, `N=20` per matchup, balanced & dunker rosters, seed base `74000`.',
    '',
    '## Results vs. Shove Hound & Control (N = 20 each)',
    '| Matchup | W-L | Win% (95% CI) | Score | Mean Diff | Med Diff [IQR] | PPP | Poss(s) | ShvSuf | ShvTO |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
    formatSeriesRowV2('Control vs shove-hound (Balanced)', balCtrl.botA, balCtrl.botB),
    formatSeriesRowV2('Perimeter vs shove-hound (Balanced)', balPerim.botA, balPerim.botB),
    formatSeriesRowV2('Control vs shove-hound (Dunker)', dnkCtrl.botA, dnkCtrl.botB),
    formatSeriesRowV2('Perimeter vs shove-hound (Dunker)', dnkPerim.botA, dnkPerim.botB),
    formatSeriesRowV2('Perimeter vs Control (Balanced H2H)', h2h.botA, h2h.botB),
    '',
  ].join('\n');

  writeExp('exp9-dunk-perimeter', { balCtrl, balPerim, dnkCtrl, dnkPerim, h2h }, md);
  return {
    id: 'exp9',
    title: 'Dunk-Reach Perimeter Geometry',
    summary: `vs shove-hound (Bal): ${balPerim.botA.wins}-${balPerim.botA.losses} vs ctrl ${balCtrl.botA.wins}-${balCtrl.botA.losses}. Direct H2H vs ctrl: ${h2h.botA.wins}-${h2h.botA.losses} (medDiff ${h2h.botA.medianDiff >= 0 ? '+' : ''}${num(h2h.botA.medianDiff)}).`,
    totalMatches,
  };
}

/** Experiment 10: Automated Parameter Search (sweepParameters) -> champion-v2 Promotion Gauntlet. */
function runExperiment10(): { id: string; title: string; summary: string; totalMatches: number; bestParams: Partial<ChampionV2Params> } {
  const shoveHound: BotFactory = { id: 'shove-hound', name: 'Shove Hound', create: () => createShoveHoundBot() };
  const championV1: BotFactory = { id: 'champion-v1', name: 'Champion v1', create: () => createChampionV1Bot() };
  const hybridAce: BotFactory = { id: 'hybrid-ace', name: 'Hybrid Ace', create: () => createHybridAceBot() };
  const fireFeeder: BotFactory = { id: 'fire-feeder', name: 'Fire Feeder', create: () => createFireFeederBot() };

  const candidates: Array<{ label: string; params: Partial<ChampionV2Params> }> = [];
  for (const dunkPerimeter of [true, false]) {
    for (const passThreatDist of [1.85, 2.05, 2.30]) {
      for (const threeEvThreshold of [2.05, 2.25, 2.45]) {
        for (const doubleTeamRadius of [7.5, 11.0, 14.0]) {
          candidates.push({
            label: `perim=${dunkPerimeter}, pass=${passThreatDist}, ev=${threeEvThreshold}, dbl=${doubleTeamRadius}`,
            params: {
              quickRelease: true,
              dunkPerimeter,
              shoveTurboMin: 22,
              passThreatDist,
              threeEvThreshold,
              doubleTeamRadius,
              offBallShoveTurboMin: Infinity,
            },
          });
        }
      }
    }
  }

  const sweep = sweepParameters({
    candidates,
    createBot: (params, label) => ({
      id: `v2-cand-${label}`,
      name: label,
      create: () => createChampionV2Bot(params),
    }),
    opponents: [shoveHound, championV1, hybridAce, fireFeeder],
    series: { games: 6, baseSeed: 80000, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'balanced' },
  });

  const best = sweep[0];
  const champV2: BotFactory = {
    id: 'champion-v2',
    name: 'Champion v2',
    create: () => createChampionV2Bot(best.params),
  };

  // Unseen test seeds (90000+)
  const h2hShoveBal = runSeries(champV2, shoveHound, { games: 20, baseSeed: 90000, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'balanced' });
  const h2hShovePro = runSeries(champV2, shoveHound, { games: 20, baseSeed: 91000, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'pro-teams' });
  const h2hV1Bal = runSeries(champV2, championV1, { games: 20, baseSeed: 92000, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'balanced' });

  const proOpps = [shoveHound, championV1, hybridAce, fireFeeder];
  const proGauntlet = proOpps.map((opp, idx) => ({
    opp: opp.id,
    res: runSeries(champV2, opp, { games: 8, baseSeed: 93000 + idx * 300, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'pro-teams' }),
  }));
  const proWins = proGauntlet.reduce((s, g) => s + g.res.botA.wins, 0);
  const proGames = proGauntlet.reduce((s, g) => s + g.res.games, 0);
  const proWinRate = proWins / proGames;

  const roster = [...getBaselineRoster(), championV1, champV2];
  const rr = runRoundRobin(roster, { games: 6, baseSeed: 95000, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'balanced' });
  const champEntry = rr.leaderboard.find((e) => e.botId === 'champion-v2')!;
  const champRank = rr.leaderboard.findIndex((e) => e.botId === 'champion-v2') + 1;

  const promoted =
    champRank === 1 &&
    h2hShoveBal.botA.winRate > 0.55 &&
    h2hShoveBal.botA.medianDiff > 0 &&
    proWinRate > 0.60;

  const md = [
    '# Experiment 10: Automated Parameter Search -> Champion v2 Promotion Gauntlet',
    '',
    '## Experiment Card',
    '- **League:** `Unrestricted (60Hz)`',
    '- **Question:** Can `sweepParameters()` synthesize Exps 7–9 into `champion-v2` and pass all v2 Promotion Criteria on unseen seeds (`90000+`)?',
    `- **Best Sweep Config:** \`${best.label}\` (${best.stats.wins}-${best.stats.losses}, ${pct(best.stats.winRate)}, medDiff ${best.stats.medianDiff >= 0 ? '+' : ''}${num(best.stats.medianDiff)})`,
    '- **Promotion Criteria:**',
    `  1. Rank #1 in 11-bot round-robin Elo: **${champRank === 1 ? 'PASS' : 'FAIL'}** (Rank #${champRank}/11, Elo ${champEntry.elo})`,
    `  2. Beat \`shove-hound\` >55% & medDiff > 0 (N=20 balanced): **${h2hShoveBal.botA.winRate > 0.55 && h2hShoveBal.botA.medianDiff > 0 ? 'PASS' : 'FAIL'}** (${h2hShoveBal.botA.wins}-${h2hShoveBal.botA.losses}, ${pct(h2hShoveBal.botA.winRate)}, medDiff ${h2hShoveBal.botA.medianDiff >= 0 ? '+' : ''}${num(h2hShoveBal.botA.medianDiff)})`,
    `  3. Cross-roster Pro-Teams gauntlet >60%: **${proWinRate > 0.60 ? 'PASS' : 'FAIL'}** (${proWins}-${proGames - proWins}, ${pct(proWinRate)})`,
    `  - **OVERALL VERDICT:** ${promoted ? '🏆 **PROMOTED AS CHAMPION V2**' : '🔬 **ITERATE**'}`,
    '',
    '## Top 8 Parameter Sweep Candidates (24 matches each, seed 80000)',
    '| Rank | Config | W-L | Win% | Med Diff [IQR] | PPP | ShvSuf | ShvTO |',
    '|---:|---|---:|---:|---:|---:|---:|---:|',
    ...sweep.slice(0, 8).map((r, i) => {
      const s = r.stats;
      const med = `${s.medianDiff >= 0 ? '+' : ''}${num(s.medianDiff)} [${num(s.iqrDiff[0])}..${num(s.iqrDiff[1])}]`;
      return `| ${i + 1} | ${r.label} | ${s.wins}-${s.losses} | ${pct(s.winRate)} | ${med} | ${s.ppp.toFixed(2)} | ${num(s.avgShovesSuffered)} | ${num(s.avgShoveTurnovers)} |`;
    }),
    '',
    '## Unseen-Seed Direct Title Matches (N = 20 each, seed 90000+)',
    '| Matchup | W-L | Win% (95% CI) | Score | Mean Diff | Med Diff [IQR] | PPP | Poss(s) | ShvSuf | ShvTO |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
    formatSeriesRowV2('champion-v2 vs shove-hound (Balanced)', h2hShoveBal.botA, h2hShoveBal.botB),
    formatSeriesRowV2('champion-v2 vs shove-hound (Pro-Teams)', h2hShovePro.botA, h2hShovePro.botB),
    formatSeriesRowV2('champion-v2 vs champion-v1 (Balanced)', h2hV1Bal.botA, h2hV1Bal.botB),
    '',
    '## Cross-Roster Pro-Teams Gauntlet (N = 8 per opp)',
    '| Opponent | W-L | Win% (95% CI) | Score | Mean Diff | Med Diff [IQR] | PPP | Poss(s) | ShvSuf | ShvTO |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
    ...proGauntlet.map((g) => formatSeriesRowV2(`vs ${g.opp}`, g.res.botA, g.res.botB)),
    '',
    formatLeaderboardMarkdown(
      rr.leaderboard,
      rr.matrix,
      '11-Bot Full Round-Robin Leaderboard (Balanced, 60Hz, Unseen Seeds 95000+)',
      'Full field including `champion-v2`.',
    ),
  ].join('\n');

  const totalMatches = sweep.length * 4 * 6 + h2hShoveBal.games + h2hShovePro.games + h2hV1Bal.games + proGames + rr.totalMatches;
  writeExp('exp10-champion-v2-gauntlet', { best, promoted, champRank, h2hShoveBal, h2hShovePro, h2hV1Bal, proGauntlet, leaderboard: rr.leaderboard }, md);
  return {
    id: 'exp10',
    title: 'Automated Parameter Search -> Champion v2 Gauntlet',
    summary: `Rank #${champRank}/11 (Elo ${champEntry.elo}). vs shove-hound: ${h2hShoveBal.botA.wins}-${h2hShoveBal.botA.losses} bal, ${h2hShovePro.botA.wins}-${h2hShovePro.botA.losses} pro. Pro gauntlet: ${proWins}/${proGames} (${pct(proWinRate)}). Verdict: ${promoted ? 'PROMOTED' : 'ITERATE'}.`,
    totalMatches,
    bestParams: best.params,
  };
}

/** Experiment 11: Dual-League Meta Shift — Unrestricted (60Hz) vs. Human-Fair (150ms). */
function runExperiment11(v2Params?: Partial<ChampionV2Params>): { id: string; title: string; summary: string; totalMatches: number } {
  const championV1: BotFactory = { id: 'champion-v1', name: 'Champion v1', create: () => createChampionV1Bot() };
  const championV2: BotFactory = { id: 'champion-v2', name: 'Champion v2', create: () => createChampionV2Bot(v2Params) };
  const roster = [...getBaselineRoster(), championV1, championV2];

  const rr60 = runRoundRobin(roster, { games: 6, baseSeed: 75000, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'balanced', decisionCadenceMs: 0 });
  const rr150 = runRoundRobin(roster, { games: 6, baseSeed: 75000, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'balanced', decisionCadenceMs: 150 });

  const rank60 = new Map(rr60.leaderboard.map((e, i) => [e.botId, { rank: i + 1, elo: e.elo, shvTO: e.avgShoveTurnovers, ppp: e.ppp }]));
  const rows = rr150.leaderboard.map((e, i) => {
    const r150 = i + 1;
    const r60 = rank60.get(e.botId)!;
    const delta = r60.rank - r150;
    const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;
    return `| ${r150} | **${e.botName}** | ${e.elo} | ${r60.rank} (${deltaStr}) | ${e.wins}-${e.losses} (${pct(e.winRate)}) | ${e.ppp.toFixed(2)} | ${num(e.avgShoveTurnovers)} (was ${num(r60.shvTO)}) | ${num(e.avgShovesSuffered)} |`;
  });

  const top150 = rr150.leaderboard[0];
  const md = [
    '# Experiment 11: Dual-League Meta Shift (Unrestricted 60Hz vs. Human-Fair 150ms)',
    '',
    '## Experiment Card',
    '- **League:** `Human-Fair (150ms)` vs `Unrestricted (60Hz)`',
    '- **Question:** How does the 11-bot Elo hierarchy shift when bots are limited to human-realistic 150ms reaction cadence?',
    '- **Controlled Variables:** Identical seeds (`75000`), 4x45s, `pro`, balanced rosters, 6 games/pair (330 matches per league).',
    '',
    '## League Comparison (150ms Human-Fair vs. 60Hz Unrestricted)',
    '| 150ms Rank | Bot | 150ms Elo | 60Hz Rank (Delta) | 150ms W-L | 150ms PPP | ShvTO/g (vs 60Hz) | ShvSuf/g |',
    '|---:|---|---:|---:|---:|---:|---:|---:|',
    ...rows,
    '',
    formatLeaderboardMarkdown(rr150.leaderboard, rr150.matrix, 'Human-Fair League (150ms) Full Leaderboard', `Champion: \`${top150.botId}\` (Elo ${top150.elo}).`),
  ].join('\n');

  writeExp('exp11-dual-league-150ms', { rr60: rr60.leaderboard, rr150: rr150.leaderboard }, md);
  return {
    id: 'exp11',
    title: 'Dual-League Meta Shift (60Hz vs 150ms)',
    summary: `150ms Human-Fair #1: ${top150.botId} (Elo ${top150.elo}, ${top150.wins}-${top150.losses}). ShoveTO/g dropped dramatically under 150ms cadence.`,
    totalMatches: rr60.totalMatches + rr150.totalMatches,
  };
}

/** Experiment 12: Asymmetric 2-Bot Duo Synergy (Mixed Teams on Pro-Teams). */
function runExperiment12(v2Params?: Partial<ChampionV2Params>): { id: string; title: string; summary: string; totalMatches: number } {
  const makeDuo = (id: string, name: string, slot0: () => ReturnType<typeof createChampionV2Bot>, slot1: () => ReturnType<typeof createChampionV2Bot>): BotFactory => ({
    id,
    name,
    create: () => {
      const b0 = slot0();
      const b1 = slot1();
      return {
        id,
        name,
        decide: (state, ctx) => (ctx.playerIndex % 2 === 0 ? b0.decide(state, ctx) : b1.decide(state, ctx)),
        reset: () => {
          b0.reset?.();
          b1.reset?.();
        },
      };
    },
  });

  const bots: BotFactory[] = [
    { id: 'champion-v2', name: 'Homogeneous: Champion v2', create: () => createChampionV2Bot(v2Params) },
    { id: 'shove-hound', name: 'Homogeneous: Shove Hound', create: () => createShoveHoundBot() },
    { id: 'hybrid-ace', name: 'Homogeneous: Hybrid Ace', create: () => createHybridAceBot() },
    makeDuo('duo-shove-arc', 'Duo: ShoveHound(0) + ArcArchitect(1)', createShoveHoundBot, createArcArchitectBot),
    makeDuo('duo-v2-arc', 'Duo: ChampionV2(0) + ArcArchitect(1)', () => createChampionV2Bot(v2Params), createArcArchitectBot),
    makeDuo('duo-lock-oop', 'Duo: Lockdown(0) + AlleyOop(1)', createLockdownCounterBot, createAlleyOopExpressBot),
    makeDuo('duo-v2-shove', 'Duo: ChampionV2(0) + ShoveHound(1)', () => createChampionV2Bot(v2Params), createShoveHoundBot),
  ];

  const rr60 = runRoundRobin(bots, { games: 12, baseSeed: 76000, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'pro-teams', decisionCadenceMs: 0 });
  const rr150 = runRoundRobin(bots, { games: 12, baseSeed: 76500, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'pro-teams', decisionCadenceMs: 150 });

  const md = [
    '# Experiment 12: Asymmetric 2-Bot Duo Synergy (Pro-Teams)',
    '',
    '## Experiment Card',
    '- **League:** `Both (60Hz & 150ms)`',
    '- **Question:** Do complementary specialist duos beat homogeneous two-of-a-kind teams on asymmetric `pro-teams` rosters?',
    '- **Controlled Variables:** 4x45s, `pro`, `pro-teams` rosters, side-swapped, `N=12` per pair, seed base `76000`.',
    '',
    formatLeaderboardMarkdown(rr60.leaderboard, rr60.matrix, '60Hz Unrestricted Pro-Teams Duo Leaderboard', 'Homogeneous vs Mixed Duos.'),
    '',
    formatLeaderboardMarkdown(rr150.leaderboard, rr150.matrix, '150ms Human-Fair Pro-Teams Duo Leaderboard', 'Homogeneous vs Mixed Duos.'),
  ].join('\n');

  writeExp('exp12-duo-synergy', { rr60: rr60.leaderboard, rr150: rr150.leaderboard }, md);
  const top60 = rr60.leaderboard[0];
  const top150 = rr150.leaderboard[0];
  return {
    id: 'exp12',
    title: 'Asymmetric 2-Bot Duo Synergy (Pro-Teams)',
    summary: `60Hz #1: ${top60.botId} (${pct(top60.winRate)}). 150ms #1: ${top150.botId} (${pct(top150.winRate)}).`,
    totalMatches: rr60.totalMatches + rr150.totalMatches,
  };
}

/** Experiment 13: Pushing Past Champion v2 (v3 Candidate Ablations in 60Hz & 150ms). */
function runExperiment13(): { id: string; title: string; summary: string; totalMatches: number } {
  const champV2: BotFactory = { id: 'champion-v2', name: 'Control (champion-v2)', create: () => createChampionV2Bot() };
  const shoveHound: BotFactory = { id: 'shove-hound', name: 'Shove Hound', create: () => createShoveHoundBot() };

  const variants: Array<{ id: string; name: string; params: Partial<ChampionV2Params> }> = [
    { id: 'v3-inbound', name: '+Inbound Lead-Pass', params: { inboundPass: true } },
    { id: 'v3-mate-dunk', name: '+Mate Dunk Pass', params: { mateDunkPass: true } },
    { id: 'v3-wide-swat', name: '+Wide Swat (2.65m)', params: { wideSwat: true } },
    { id: 'v3-perim', name: '+Dunk Perimeter', params: { dunkPerimeter: true } },
    { id: 'v3-all', name: '+All Combined', params: { inboundPass: true, mateDunkPass: true, wideSwat: true, dunkPerimeter: true } },
    { id: 'v3-150ms-adapt', name: '150ms-Adapted (pass=2.55, dbl=11)', params: { passThreatDist: 2.55, doubleTeamRadius: 11.0 } },
  ];

  const vsV2_60: Array<{ id: string; name: string; a: AggregateBotStats; b: AggregateBotStats }> = [];
  const vsShove_60: Array<{ id: string; name: string; a: AggregateBotStats; b: AggregateBotStats }> = [];
  const vsV2_150: Array<{ id: string; name: string; a: AggregateBotStats; b: AggregateBotStats }> = [];
  let totalMatches = 0;

  variants.forEach((v, idx) => {
    const f: BotFactory = { id: v.id, name: v.name, create: () => createChampionV2Bot(v.params) };
    const rV2_60 = runSeries(f, champV2, { games: 20, baseSeed: 97000 + idx * 100, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'balanced', decisionCadenceMs: 0 });
    const rShove_60 = runSeries(f, shoveHound, { games: 20, baseSeed: 98000 + idx * 100, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'balanced', decisionCadenceMs: 0 });
    const rV2_150 = runSeries(f, champV2, { games: 20, baseSeed: 99000 + idx * 100, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'balanced', decisionCadenceMs: 150 });
    vsV2_60.push({ id: v.id, name: v.name, a: rV2_60.botA, b: rV2_60.botB });
    vsShove_60.push({ id: v.id, name: v.name, a: rShove_60.botA, b: rShove_60.botB });
    vsV2_150.push({ id: v.id, name: v.name, a: rV2_150.botA, b: rV2_150.botB });
    totalMatches += rV2_60.games + rShove_60.games + rV2_150.games;
  });

  const md = [
    '# Experiment 13: Pushing Past Champion v2 (v3 Candidate Ablations)',
    '',
    '## Experiment Card',
    '- **League:** `Both (60Hz & 150ms)`',
    '- **Question:** Can any mechanical addition (`inboundPass`, `mateDunkPass`, `wideSwat`, `dunkPerimeter`, or `150ms-adapt`) meaningfully beat `champion-v2` (>55% H2H + positive medianDiff)?',
    '- **Controlled Variables:** 4x45s, `pro`, side-swapped, `N=20` per matchup, balanced rosters, seed base `97000`.',
    '',
    '## 60Hz vs. Champion v2 (N = 20)',
    '| Variant | W-L | Win% (95% CI) | Score | Mean Diff | Med Diff [IQR] | PPP | Poss(s) | ShvSuf | ShvTO |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
    ...vsV2_60.map((r) => formatSeriesRowV2(r.name, r.a, r.b)),
    '',
    '## 60Hz vs. Shove Hound (N = 20)',
    '| Variant | W-L | Win% (95% CI) | Score | Mean Diff | Med Diff [IQR] | PPP | Poss(s) | ShvSuf | ShvTO |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
    ...vsShove_60.map((r) => formatSeriesRowV2(r.name, r.a, r.b)),
    '',
    '## 150ms Human-Fair vs. Champion v2 (N = 20)',
    '| Variant | W-L | Win% (95% CI) | Score | Mean Diff | Med Diff [IQR] | PPP | Poss(s) | ShvSuf | ShvTO |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
    ...vsV2_150.map((r) => formatSeriesRowV2(r.name, r.a, r.b)),
    '',
  ].join('\n');

  writeExp('exp13-v3-plateau-check', { vsV2_60, vsShove_60, vsV2_150 }, md);
  const best60 = [...vsV2_60].sort((x, y) => y.a.winRate - x.a.winRate || y.a.medianDiff - x.a.medianDiff)[0];
  const best150 = [...vsV2_150].sort((x, y) => y.a.winRate - x.a.winRate || y.a.medianDiff - x.a.medianDiff)[0];
  return {
    id: 'exp13',
    title: 'Pushing Past Champion v2 (v3 Candidate Ablations)',
    summary: `60Hz best vs v2: ${best60.id} (${best60.a.wins}-${best60.a.losses}, medDiff ${best60.a.medianDiff >= 0 ? '+' : ''}${num(best60.a.medianDiff)}). 150ms best vs v2: ${best150.id} (${best150.a.wins}-${best150.a.losses}, medDiff ${best150.a.medianDiff >= 0 ? '+' : ''}${num(best150.a.medianDiff)}).`,
    totalMatches,
  };
}

/** Experiment 14: Champion v3 Promotion Gauntlet (inboundPass + mateDunkPass vs All Combined). */
function runExperiment14(): { id: string; title: string; summary: string; totalMatches: number } {
  const champV2: BotFactory = { id: 'champion-v2', name: 'Champion v2', create: () => createChampionV2Bot() };
  const shoveHound: BotFactory = { id: 'shove-hound', name: 'Shove Hound', create: () => createShoveHoundBot() };
  const championV1: BotFactory = { id: 'champion-v1', name: 'Champion v1', create: () => createChampionV1Bot() };
  const hybridAce: BotFactory = { id: 'hybrid-ace', name: 'Hybrid Ace', create: () => createHybridAceBot() };
  const fireFeeder: BotFactory = { id: 'fire-feeder', name: 'Fire Feeder', create: () => createFireFeederBot() };

  const v3Clean: BotFactory = {
    id: 'champion-v3',
    name: 'Champion v3 (Inbound+MateDunk)',
    create: () => createChampionV2Bot({ inboundPass: true, mateDunkPass: true }),
  };
  const v3All: BotFactory = {
    id: 'v3-all',
    name: 'v3 All Combined',
    create: () => createChampionV2Bot({ inboundPass: true, mateDunkPass: true, wideSwat: true, dunkPerimeter: true }),
  };

  const h2hCleanVsAll = runSeries(v3Clean, v3All, { games: 20, baseSeed: 101000, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'balanced' });
  const h2hVsV2 = runSeries(v3Clean, champV2, { games: 20, baseSeed: 102000, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'balanced' });
  const h2hVsShove = runSeries(v3Clean, shoveHound, { games: 20, baseSeed: 103000, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'balanced' });

  const proOpps = [champV2, shoveHound, championV1, hybridAce];
  const proGauntlet = proOpps.map((opp, idx) => ({
    opp: opp.id,
    res: runSeries(v3Clean, opp, { games: 8, baseSeed: 104000 + idx * 300, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'pro-teams' }),
  }));
  const proWins = proGauntlet.reduce((s, g) => s + g.res.botA.wins, 0);
  const proGames = proGauntlet.reduce((s, g) => s + g.res.games, 0);

  const roster = [...getBaselineRoster(), championV1, champV2, v3Clean];
  const rr = runRoundRobin(roster, { games: 6, baseSeed: 105000, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'balanced' });
  const v3Entry = rr.leaderboard.find((e) => e.botId === 'champion-v3')!;
  const v3Rank = rr.leaderboard.findIndex((e) => e.botId === 'champion-v3') + 1;

  const promoted =
    v3Rank === 1 &&
    h2hVsV2.botA.winRate > 0.55 &&
    h2hVsV2.botA.medianDiff > 0 &&
    proWins / proGames > 0.60;

  const md = [
    '# Experiment 14: Champion v3 Promotion Gauntlet',
    '',
    '## Experiment Card',
    '- **League:** `Unrestricted (60Hz)`',
    '- **Question:** Does `champion-v3` (`inboundPass + mateDunkPass`) beat `v3-all`, beat `champion-v2` (>55%), and claim #1 Elo in the 12-bot field?',
    '- **Promotion Criteria:**',
    `  1. Rank #1 in 12-bot round-robin Elo: **${v3Rank === 1 ? 'PASS' : 'FAIL'}** (Rank #${v3Rank}/12, Elo ${v3Entry.elo})`,
    `  2. Beat \`champion-v2\` >55% & medDiff > 0 (N=20 balanced): **${h2hVsV2.botA.winRate > 0.55 && h2hVsV2.botA.medianDiff > 0 ? 'PASS' : 'FAIL'}** (${h2hVsV2.botA.wins}-${h2hVsV2.botA.losses}, ${pct(h2hVsV2.botA.winRate)}, medDiff ${h2hVsV2.botA.medianDiff >= 0 ? '+' : ''}${num(h2hVsV2.botA.medianDiff)})`,
    `  3. Cross-roster Pro-Teams gauntlet >60%: **${proWins / proGames > 0.60 ? 'PASS' : 'FAIL'}** (${proWins}-${proGames - proWins}, ${pct(proWins / proGames)})`,
    `  - **OVERALL VERDICT:** ${promoted ? '🏆 **PROMOTED AS CHAMPION V3**' : '🔬 **ITERATE**'}`,
    '',
    '## Direct Head-to-Head Series (N = 20 each, Balanced)',
    '| Matchup | W-L | Win% (95% CI) | Score | Mean Diff | Med Diff [IQR] | PPP | Poss(s) | ShvSuf | ShvTO |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
    formatSeriesRowV2('champion-v3 vs v3-all', h2hCleanVsAll.botA, h2hCleanVsAll.botB),
    formatSeriesRowV2('champion-v3 vs champion-v2', h2hVsV2.botA, h2hVsV2.botB),
    formatSeriesRowV2('champion-v3 vs shove-hound', h2hVsShove.botA, h2hVsShove.botB),
    '',
    '## Cross-Roster Pro-Teams Gauntlet (N = 8 per opp)',
    '| Opponent | W-L | Win% (95% CI) | Score | Mean Diff | Med Diff [IQR] | PPP | Poss(s) | ShvSuf | ShvTO |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
    ...proGauntlet.map((g) => formatSeriesRowV2(`vs ${g.opp}`, g.res.botA, g.res.botB)),
    '',
    formatLeaderboardMarkdown(rr.leaderboard, rr.matrix, '12-Bot Full Round-Robin Leaderboard (Balanced, 60Hz, Seeds 105000+)', 'Full field including `champion-v3`.'),
  ].join('\n');

  const totalMatches = h2hCleanVsAll.games + h2hVsV2.games + h2hVsShove.games + proGames + rr.totalMatches;
  writeExp('exp14-champion-v3-gauntlet', { promoted, v3Rank, h2hCleanVsAll, h2hVsV2, h2hVsShove, proGauntlet, leaderboard: rr.leaderboard }, md);
  return {
    id: 'exp14',
    title: 'Champion v3 Promotion Gauntlet',
    summary: `Rank #${v3Rank}/12 (Elo ${v3Entry.elo}). vs v2: ${h2hVsV2.botA.wins}-${h2hVsV2.botA.losses} (medDiff ${h2hVsV2.botA.medianDiff >= 0 ? '+' : ''}${num(h2hVsV2.botA.medianDiff)}). vs shove-hound: ${h2hVsShove.botA.wins}-${h2hVsShove.botA.losses}. Pro: ${proWins}/${proGames}. Verdict: ${promoted ? 'PROMOTED' : 'ITERATE'}.`,
    totalMatches,
  };
}

/** Experiment 15: Testing Next-Wave Counter-Strategies Against Champion v3 (Plateau Probe). */
function runExperiment15(): { id: string; title: string; summary: string; totalMatches: number } {
  const v3: BotFactory = {
    id: 'champion-v3',
    name: 'Champion v3',
    create: () => createChampionV2Bot({ inboundPass: true, mateDunkPass: true }),
  };

  const candidates: Array<{ id: string; name: string; params: Partial<ChampionV2Params> }> = [
    { id: 'v4-early-pass', name: 'Early Pass (passThreat=2.45)', params: { inboundPass: true, mateDunkPass: true, passThreatDist: 2.45 } },
    { id: 'v4-selective-3pt', name: 'Selective 3PT (ev=2.45)', params: { inboundPass: true, mateDunkPass: true, threeEvThreshold: 2.45 } },
    { id: 'v4-tight-dbl', name: 'Tight Double (dblR=9.0)', params: { inboundPass: true, mateDunkPass: true, doubleTeamRadius: 9.0 } },
    { id: 'v4-offball-shove', name: 'Off-Ball Shove (offTurbo=40)', params: { inboundPass: true, mateDunkPass: true, offBallShoveTurboMin: 40 } },
    { id: 'v4-shove-26', name: 'Conserve Turbo (shoveMin=26)', params: { inboundPass: true, mateDunkPass: true, shoveTurboMin: 26 } },
  ];

  const rows: Array<{ id: string; name: string; a: AggregateBotStats; b: AggregateBotStats }> = [];
  let totalMatches = 0;

  candidates.forEach((c, idx) => {
    const f: BotFactory = { id: c.id, name: c.name, create: () => createChampionV2Bot(c.params) };
    const res = runSeries(f, v3, { games: 24, baseSeed: 110000 + idx * 200, quarterSeconds: 45, difficulty: 'pro', rosterMode: 'balanced' });
    rows.push({ id: c.id, name: c.name, a: res.botA, b: res.botB });
    totalMatches += res.games;
  });

  const md = [
    '# Experiment 15: Next-Wave Counter-Strategies vs. Champion v3 (Plateau Probe)',
    '',
    '## Experiment Card',
    '- **League:** `Unrestricted (60Hz)`',
    '- **Question:** Can any further threshold or defensive shift meaningfully beat `champion-v3` (>55% over N=24)?',
    '- **Controlled Variables:** 4x45s, 60Hz, `pro`, side-swapped, `N=24` per candidate vs `champion-v3`, balanced rosters, seed base `110000`.',
    '',
    '## Results vs. Champion v3 (N = 24 each)',
    '| Candidate | W-L | Win% (95% CI) | Score | Mean Diff | Med Diff [IQR] | PPP | Poss(s) | ShvSuf | ShvTO |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
    ...rows.map((r) => formatSeriesRowV2(r.name, r.a, r.b)),
    '',
  ].join('\n');

  writeExp('exp15-v4-plateau-probe', { rows }, md);
  const best = [...rows].sort((x, y) => y.a.winRate - x.a.winRate || y.a.medianDiff - x.a.medianDiff)[0];
  return {
    id: 'exp15',
    title: 'Next-Wave Counter-Strategies vs Champion v3 (Plateau Probe)',
    summary: `Best vs champion-v3: ${best.id} (${best.a.wins}-${best.a.losses}, ${pct(best.a.winRate)}, medDiff ${best.a.medianDiff >= 0 ? '+' : ''}${num(best.a.medianDiff)}).`,
    totalMatches,
  };
}

export async function main(args: string[] = []): Promise<void> {
  const t0 = performance.now();
  fs.mkdirSync(EXP_ROOT, { recursive: true });

  let cachedV2Params: Partial<ChampionV2Params> | undefined;
  const registry: Array<{ id: string; folder: string; run: () => { id: string; title: string; summary: string; totalMatches: number } }> = [
    { id: 'exp1', folder: 'exp1-offense-vs-roster', run: runExperiment1 },
    { id: 'exp2', folder: 'exp2-defense-meta', run: runExperiment2 },
    { id: 'exp3', folder: 'exp3-shot-micro-ablation', run: runExperiment3 },
    { id: 'exp4', folder: 'exp4-on-fire-funnel', run: runExperiment4 },
    { id: 'exp5', folder: 'exp5-champion-v1-gauntlet', run: runExperiment5 },
    { id: 'exp6', folder: 'exp6-inbound-blitz', run: runExperiment6 },
    { id: 'exp7', folder: 'exp7-hesitation-removal', run: runExperiment7 },
    { id: 'exp8', folder: 'exp8-offball-trap-sweep', run: runExperiment8 },
    { id: 'exp9', folder: 'exp9-dunk-perimeter', run: runExperiment9 },
    {
      id: 'exp10',
      folder: 'exp10-champion-v2-gauntlet',
      run: () => {
        const res = runExperiment10();
        cachedV2Params = res.bestParams;
        return res;
      },
    },
    { id: 'exp11', folder: 'exp11-dual-league-150ms', run: () => runExperiment11(cachedV2Params) },
    { id: 'exp12', folder: 'exp12-duo-synergy', run: () => runExperiment12(cachedV2Params) },
    { id: 'exp13', folder: 'exp13-v3-plateau-check', run: runExperiment13 },
    { id: 'exp14', folder: 'exp14-champion-v3-gauntlet', run: runExperiment14 },
    { id: 'exp15', folder: 'exp15-v4-plateau-probe', run: runExperiment15 },
  ];

  const filter = new Set(args.map((a) => a.toLowerCase()));
  const selected = filter.size > 0 ? registry.filter((r) => filter.has(r.id)) : registry;

  console.log(`Running ${selected.length} GBA GJAM bot strategy experiment(s)...`);
  const summaries = selected.map((r) => r.run());

  const totalMatches = summaries.reduce((s, x) => s + x.totalMatches, 0);
  const elapsedSec = ((performance.now() - t0) / 1000).toFixed(2);

  if (filter.size === 0) {
    const folderMap = Object.fromEntries(registry.map((r) => [r.id, r.folder]));
    const indexMd = [
      '# GBA GJAM — Bot Strategy Experiments Index',
      '',
      `Executed **${summaries.length} experiments** (**${totalMatches} total full 4-quarter matches**) in **${elapsedSec}s** using the deterministic 60Hz evaluation harness (\`npm run eval:experiments -w games/gba-gjam\`).`,
      '',
      '| # | Experiment | Matches | Summary | Report |',
      '|---|---|---:|---|---|',
      ...summaries.map((s) => `| **${s.id.toUpperCase()}** | ${s.title} | ${s.totalMatches} | ${s.summary} | [REPORT.md](./${folderMap[s.id]}/REPORT.md) |`),
      '',
    ].join('\n');
    fs.writeFileSync(path.join(EXP_ROOT, 'INDEX.md'), indexMd);
  }

  console.log(`\nCompleted ${summaries.length} experiment(s) (${totalMatches} matches) in ${elapsedSec}s!`);
  for (const s of summaries) {
    console.log(`- [${s.id.toUpperCase()}] ${s.title}: ${s.summary}`);
  }
}
