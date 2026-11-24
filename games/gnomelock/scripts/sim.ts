// Runs 30 simulated 2v2 Gnomelock matches (20 skilled-edge + 10 mirror) and checks balance guardrails.
import type { HeroId } from '../src/sim/config.ts';
import { runHeadlessMatch, type SimMatchSummary } from '../src/sim/headlessSim.ts';
import type { SlotSetup } from '../src/sim/world.ts';

const HERO_POOL: readonly HeroId[] = ['bramble', 'tansy', 'fernwick', 'potsworth'];

const PAIRINGS: readonly [number, number, number, number][] = [
  [0, 1, 2, 3],
  [0, 2, 1, 3],
  [0, 3, 1, 2],
];

function makeSlots(offset: number): SlotSetup[] {
  const p = PAIRINGS[offset % PAIRINGS.length];
  const h0 = HERO_POOL[p[0]];
  const h1 = HERO_POOL[p[1]];
  const h2 = HERO_POOL[p[2]];
  const h3 = HERO_POOL[p[3]];
  return [
    { heroId: h0, name: `Amber-${h0}`, isBot: true },
    { heroId: h1, name: `Amber-${h1}`, isBot: true },
    { heroId: h2, name: `Sapphire-${h2}`, isBot: true },
    { heroId: h3, name: `Sapphire-${h3}`, isBot: true },
  ];
}

const skilledMatches: SimMatchSummary[] = [];
for (let i = 0; i < 20; i++) {
  const team0Edge = i % 2 === 0;
  const skills: [number, number, number, number] = team0Edge
    ? [1.10, 1.06, 0.92, 0.94]
    : [0.92, 0.94, 1.10, 1.06];
  skilledMatches.push(runHeadlessMatch(makeSlots(i), skills, 1000 + i));
}

const mirrorMatches: SimMatchSummary[] = [];
for (let i = 0; i < 10; i++) {
  mirrorMatches.push(runHeadlessMatch(makeSlots(i), [1.0, 1.0, 1.0, 1.0], 2000 + i));
}

const all = [...skilledMatches, ...mirrorMatches];
const durations = all.map((m) => m.durationS).sort((a, b) => a - b);
const medianDurS = durations[Math.floor(durations.length / 2)];
const meanDurS = durations.reduce((s, v) => s + v, 0) / durations.length;

const clearAt5 = skilledMatches.filter((m) => m.leaderAt5Min !== null && m.leadPctAt5Min >= 0.05);
const clearAt5Rate = clearAt5.length / skilledMatches.length;
const leaderHeld = clearAt5.filter((m) => m.winner === m.leaderAt5Min).length;
const leaderWinRate = clearAt5.length > 0 ? leaderHeld / clearAt5.length : 0;
const comebacks = clearAt5.filter((m) => m.winner !== null && m.winner !== m.leaderAt5Min).length;

const avgLastHitShare = all.reduce((s, m) => s + m.lastHitOrbShare, 0) / all.length;

const heroStats: Record<HeroId, { games: number; wins: number }> = {
  bramble: { games: 0, wins: 0 },
  tansy: { games: 0, wins: 0 },
  fernwick: { games: 0, wins: 0 },
  potsworth: { games: 0, wins: 0 },
};
for (const m of mirrorMatches) {
  for (const h of m.heroes) {
    heroStats[h.heroId].games++;
    if (m.winner === h.team) heroStats[h.heroId].wins++;
  }
}

console.log('=== GNOMELOCK 30-MATCH BALANCE SIM ===');
console.log(`Median duration: ${(medianDurS / 60).toFixed(2)} min (mean ${(meanDurS / 60).toFixed(2)} min)`);
console.log(`5-min clear leader (skilled): ${clearAt5.length}/${skilledMatches.length} (${(clearAt5Rate * 100).toFixed(0)}%)`);
console.log(`5-min leader held to win: ${leaderHeld}/${clearAt5.length} (${(leaderWinRate * 100).toFixed(1)}%), Comebacks: ${comebacks}`);
console.log(`Last-hit + Orb share of economy: ${(avgLastHitShare * 100).toFixed(1)}%`);
console.log('Mirror hero win rates:');
for (const id of HERO_POOL) {
  const st = heroStats[id];
  const wr = st.games > 0 ? (st.wins / st.games) * 100 : 0;
  console.log(`  ${id.padEnd(10)}: ${st.wins}/${st.games} (${wr.toFixed(0)}%)`);
}

let failed = false;
if (medianDurS < 480 || medianDurS > 690) {
  console.error(`FAIL: median duration ${(medianDurS / 60).toFixed(2)} min outside 8.0-11.5 min`);
  failed = true;
}
if (clearAt5Rate < 0.65) {
  console.error(`FAIL: 5-min clear leader rate ${(clearAt5Rate * 100).toFixed(0)}% < 65%`);
  failed = true;
}
if (leaderWinRate < 0.65 || leaderWinRate > 0.90) {
  console.error(`FAIL: 5-min leader win rate ${(leaderWinRate * 100).toFixed(1)}% outside 65%-90%`);
  failed = true;
}
if (avgLastHitShare < 0.42) {
  console.error(`FAIL: Last-hit + orb share ${(avgLastHitShare * 100).toFixed(1)}% < 42%`);
  failed = true;
}
for (const id of HERO_POOL) {
  const st = heroStats[id];
  const wr = st.games > 0 ? st.wins / st.games : 0.5;
  if (wr < 0.30 || wr > 0.70) {
    console.error(`FAIL: ${id} mirror win rate ${(wr * 100).toFixed(0)}% outside 30%-70%`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
console.log('BALANCE SIM OK');
