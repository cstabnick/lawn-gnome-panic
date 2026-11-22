// CLI economy reporter: bundles src/sim/economy.ts with esbuild and runs one player per class through the story phases.
// Usage: npm run sim:economy -w games/gnomes-of-gnomomia -- [--class=warden] [--json] [--check]
//   --class=<id>  only that class (warden, slinger, mage)
//   --json        print the full reports (and flags) as JSON instead of tables
//   --check       exit 1 if any class has a flag (see ECONOMY_TARGETS in src/sim/economy.ts)
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const rootDir = join(here, '..');
const dir = mkdtempSync(join(tmpdir(), 'gnomomia-econ-'));
const out = join(dir, 'econ-bundle.mjs');

await build({
  stdin: {
    contents: "export * from './src/sim/economy.ts';\nexport * from './src/sim/economyPhases.ts';",
    resolveDir: rootDir,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  logLevel: 'error',
});

let sim;
try {
  sim = await import(pathToFileURL(out).href);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

const flags = {};
for (const a of process.argv.slice(2)) {
  if (!a.startsWith('--')) continue;
  const eq = a.indexOf('=');
  if (eq === -1) flags[a.slice(2)] = true;
  else flags[a.slice(2, eq)] = a.slice(eq + 1);
}
const CLASSES = ['warden', 'slinger', 'mage'];
const classes = typeof flags.class === 'string' ? [flags.class] : CLASSES;
for (const c of classes) if (!CLASSES.includes(c)) throw new Error(`Unknown class '${c}'. Valid: ${CLASSES.join(', ')}`);

const t0 = Date.now();
const runs = classes.map((classId) => {
  const report = sim.runEconomy({ classId });
  return { report, flags: sim.checkEconomy(report) };
});
const ms = Date.now() - t0;

if (flags.json) {
  console.log(JSON.stringify({ targets: sim.ECONOMY_TARGETS, runs }, null, 2));
} else {
  const fmt = (v, d = 0) => (v === null || v === undefined ? '-' : typeof v === 'number' ? v.toFixed(d) : String(v));
  const cols = [
    ['phase', 12, (p) => p.id],
    ['lvl', 7, (p) => `${p.levelIn}-${p.levelOut}`],
    ['hours', 6, (p) => fmt(p.hours, 1)],
    ['q/k/g h', 14, (p) => `${fmt(p.questHours, 1)}/${fmt(p.killHours, 1)}/${fmt(p.grindHours, 1)}`],
    ['xp/h', 7, (p) => fmt(p.xpPerHour)],
    ['xp/kill', 7, (p) => fmt(p.xpPerNormalKill)],
    ['coins', 6, (p) => fmt(p.coinsEarned)],
    ['c/h', 5, (p) => fmt(p.coinsPerHour)],
    ['gear', 5, (p) => fmt(p.spentGear)],
    ['cons', 5, (p) => fmt(p.spentConsumables)],
    ['carry', 6, (p) => fmt(p.carriedOut)],
    ['nextKit', 7, (p) => fmt(p.nextKitCost)],
    ['carryR', 6, (p) => fmt(p.carryRatio, 2)],
    ['kit%', 5, (p) => (p.kitShare === null ? '-' : fmt(p.kitShare * 100))],
    ['skUp', 5, (p) => fmt(p.skillUps)],
    ['sk/cap', 7, (p) => `${p.weaponSkill}/${p.skillCap}`],
    ['cap%', 5, (p) => fmt(p.capTimeShare * 100)],
    ['tal', 6, (p) => `${p.talentPoints}/${p.talentSpendable}`],
    ['flags', 0, (p) => p.flags.join(',')],
  ];
  const line = (cells) => cells.map((c, i) => (cols[i][1] ? String(c).padStart(cols[i][1]) : ` ${c}`)).join(' ');
  console.log('=== GNOMOMIA ECONOMY REPORT ===');
  console.log('carry = coins carried out; carryR = carry / next phase kit; kit% = own kit owned at phase end;');
  console.log('cap% = combat time with the weapon skill at its cap; tal = talent points / spendable ranks.');
  for (const { report: r, flags: fl } of runs) {
    console.log(`\n--- ${r.classId} ---`);
    console.log(line(cols.map((c) => c[0])));
    for (const p of r.phases) console.log(line(cols.map((c) => c[2](p))));
    const t = r.totals;
    console.log(`totals: ${t.hours} h, level ${t.level}, ${t.quests} quests, ${t.kills} kills, coins earned ${t.coinsEarned}, gear ${t.spentGear}, consumables ${t.spentConsumables}, resold ${t.gearResold}, left ${t.coinsLeft}, skill-ups ${t.skillUps}`);
    const lh = [];
    for (let l = 2; l < r.levelHours.length; l++) lh.push(`${l}:${r.levelHours[l] === null ? '-' : r.levelHours[l].toFixed(1)}`);
    console.log(`level hours: ${lh.join(' ')}`);
    console.log(`cumulative coins earned / useful spend: ${r.phases.map((p) => `${p.id} ${p.cumCoinsEarned}/${p.cumUsefulSpend}`).join(', ')}`);
    if (r.skipped.quests.length) console.log(`skipped quests (${r.skipped.quests.length}): ${r.skipped.quests.join(' ')}`);
    if (r.skipped.spawns.length) console.log(`skipped spawns (${r.skipped.spawns.length}): ${r.skipped.spawns.join(' ')}`);
    console.log(`flags (${fl.length}):`);
    for (const f of fl) console.log(`  [${f.code}] ${f.message}`);
  }
  console.log(`\n(${runs.length} class${runs.length === 1 ? '' : 'es'} in ${ms} ms)`);
}

if (flags.check && runs.some((r) => r.flags.length > 0)) process.exit(1);
