// CLI economy reporter: bundles src/sim/economy.ts with esbuild and runs one player per class through the story phases.
// Usage: npm run sim:economy -w games/gnomes-of-gnomomia -- [--class=warden] [--json] [--check] [--cap=70] [--levels]
//   --class=<id>     only that class (warden, slinger, mage)
//   --json           print the full reports (and flags) as JSON instead of tables
//   --check          also run every PLAYER_VARIANT; exit 1 if any class or variant has a flag (ECONOMY_TARGETS)
//   --variant=<id>   print one PLAYER_VARIANT (potions-x3, slow-kills, one-clear, few-hits) instead of the default
//   --cap=<level>    play past the shipped cap: above 30 the PROJECTION bands of src/data/economyProjection.ts follow
//                    the Verge (synthetic content, never shipped). With --check, projected phases may raise only the
//                    flags listed in EXPECTED_PROJECTION_FLAGS (src/sim/economy.ts); anything else fails.
//   --levels         print a per-level table: hours, kills per level, coin multiplier vs kit price, skill vs cap
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
    contents: [
      "export * from './src/sim/economy.ts';",
      "export * from './src/sim/economyPhases.ts';",
      "export { coinMult, skillCapAt, skillUsesToNext } from './src/economy.ts';",
      "export { PROJECTION_LABEL } from './src/data/economyProjection.ts';",
    ].join('\n'),
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
const cap = flags.cap === undefined ? undefined : Number(flags.cap);
if (cap !== undefined && !(cap >= 2)) throw new Error(`--cap needs a level, got '${flags.cap}'`);
const variant = typeof flags.variant === 'string' ? flags.variant : 'default';
if (variant !== 'default' && !sim.PLAYER_VARIANTS[variant]) throw new Error(`Unknown variant '${variant}'. Valid: ${Object.keys(sim.PLAYER_VARIANTS).join(', ')}`);

const t0 = Date.now();
const runs = classes.map((classId) => {
  const report = sim.runEconomy({ classId, cap, ...(variant === 'default' ? {} : sim.PLAYER_VARIANTS[variant]) });
  return { report, flags: sim.checkEconomy(report) };
});
const variantRuns = flags.check ? sim.checkAllVariants(classes, cap).filter((r) => r.variant !== 'default') : [];
const ms = Date.now() - t0;
/** A flag fails --check unless it is a projected phase's flag listed in EXPECTED_PROJECTION_FLAGS. */
const failing = (report, fl) => fl.filter((f) => !sim.isExpectedProjectionFlag(report, f));

if (flags.json) {
  console.log(JSON.stringify({
    targets: sim.ECONOMY_TARGETS, runs,
    variants: variantRuns.map((r) => ({ classId: r.classId, variant: r.variant, flags: r.flags })),
  }, null, 2));
} else {
  const fmt = (v, d = 0) => (v === null || v === undefined ? '-' : typeof v === 'number' ? v.toFixed(d) : String(v));
  const cols = [
    ['phase', 12, (p) => p.id],
    ['lvl', 7, (p) => `${p.levelIn}-${p.levelOut}`],
    ['hours', 6, (p) => fmt(p.hours, 1)],
    ['q/k/g h', 14, (p) => `${fmt(p.questHours, 1)}/${fmt(p.killHours, 1)}/${fmt(p.grindHours, 1)}`],
    ['xp/kill', 7, (p) => fmt(p.xpPerNormalKill)],
    ['k/lvl', 5, (p) => fmt(p.killsPerLevel)],
    ['coins', 7, (p) => fmt(p.coinsEarned)],
    ['c/h', 5, (p) => fmt(p.coinsPerHour)],
    ['loot%', 5, (p) => fmt(p.lootShare * 100)],
    ['gear', 6, (p) => fmt(p.spentGear)],
    ['cons', 5, (p) => fmt(p.spentConsumables)],
    ['carry', 6, (p) => fmt(p.carriedOut)],
    ['carryR', 6, (p) => fmt(p.carryRatio, 2)],
    ['kit%', 5, (p) => (p.kitShare === null ? '-' : fmt(p.kitShare * 100))],
    ['lag h', 9, (p) => (p.gearLagMean === null ? '-' : `${fmt(p.gearLagMean, 1)}/${fmt(p.gearLagMax, 1)}`)],
    ['skUp/h', 6, (p) => fmt(p.skillUpsPerHour, 1)],
    ['low skill', 18, (p) => `${p.lowSkill} ${p.weaponSkill}/${p.skillCap}`],
    ['cap%', 5, (p) => fmt(p.capTimeShare * 100)],
    ['tal', 6, (p) => `${p.talentPoints}/${p.talentSpendable}`],
    ['flags', 0, (p) => p.flags.join(',')],
  ];
  const line = (cells) => cells.map((c, i) => (cols[i][1] ? String(c).padStart(cols[i][1]) : ` ${c}`)).join(' ');
  console.log('=== GNOMOMIA ECONOMY REPORT ===' + (variant === 'default' ? '' : ` (variant ${variant})`));
  console.log('k/lvl = normal kills per level; carryR = coins carried out / next phase kit; kit% = own kit owned at phase end;');
  console.log('lag h = mean/max hours from a kit item opening to owning it; low skill = lowest weapon/school skill used / cap;');
  console.log('cap% = weapon-skill uses landing at the cap; tal = talent points / spendable ranks.');
  if (cap !== undefined && cap > 30) console.log(`proj-* rows: ${sim.PROJECTION_LABEL}`);
  for (const { report: r, flags: fl } of runs) {
    console.log(`\n--- ${r.classId} ---`);
    console.log(line(cols.map((c) => c[0])));
    for (const p of r.phases) console.log(line(cols.map((c) => c[2](p))));
    const t = r.totals;
    console.log(`totals: ${t.hours} h, level ${t.level}, ${t.quests} quests, ${t.kills} kills, coins earned ${t.coinsEarned}, gear ${t.spentGear}, consumables ${t.spentConsumables}, resold ${t.gearResold}, left ${t.coinsLeft}, skill-ups ${t.skillUps}`);
    const lh = [];
    for (let l = 2; l < r.levelHours.length; l++) lh.push(`${l}:${r.levelHours[l] === null ? '-' : r.levelHours[l].toFixed(1)}`);
    console.log(`level hours: ${lh.join(' ')}`);
    console.log(`skills at end: ${Object.entries(r.phases[r.phases.length - 1].skills).map(([k, v]) => `${k} ${v}`).join(', ')}`);
    if (r.skipped.quests.length) console.log(`skipped quests (${r.skipped.quests.length}): ${r.skipped.quests.join(' ')}`);
    if (r.skipped.spawns.length) console.log(`skipped spawns (${r.skipped.spawns.length}): ${r.skipped.spawns.join(' ')}`);
    const watch = sim.watchEconomy(r);
    if (watch.length) console.log(`watch (${watch.length}, not failing; WATCH_FLAGS): ${watch.map((f) => `${f.code}:${f.phase} ${f.value}`).join(', ')}`);
    console.log(`flags (${fl.length}):`);
    for (const f of fl) console.log(`  [${f.code}] ${f.message}${sim.isExpectedProjectionFlag(r, f) ? '  (expected: EXPECTED_PROJECTION_FLAGS)' : ''}`);
    if (flags.levels) {
      console.log(' level  hours  h/lvl k/lvl coinMult kit4L2 coin/kit cap   skill usesNext');
      const lowId = r.phases[r.phases.length - 1].lowSkill;
      for (let L = 1; L < r.levelHours.length; L++) {
        const h = r.levelHours[L], h2 = r.levelHours[L + 1];
        const sk = r.skillsAtLevel[L]?.[lowId];
        console.log([L, fmt(h, 1), h2 == null || h == null ? '-' : fmt(h2 - h, 2), fmt(sim.killsPerLevelAt(L), 0), fmt(sim.coinMult(L), 2), 4 * L * L,
          fmt((sim.coinMult(L) / (4 * L * L)) * 1000, 3), sim.skillCapAt(L), sk ?? '-', sk === undefined ? '-' : sim.skillUsesToNext(sk)]
          .map((x) => String(x).padStart(6)).join(' '));
      }
    }
  }
  if (variantRuns.length) {
    console.log('\n--- player variants (--check) ---');
    for (const v of variantRuns) {
      const t = v.report.totals;
      const kit = v.report.phases.map((p) => (p.kitShare === null ? '-' : Math.round(p.kitShare * 100))).join('/');
      const capS = v.report.phases.map((p) => Math.round(p.capTimeShare * 100)).join('/');
      const fl = v.flags.map((f) => `${f.code}:${f.phase ?? ''}${sim.isExpectedProjectionFlag(v.report, f) ? '(exp)' : ''}`).join(' ') || 'none';
      console.log(`${v.classId.padEnd(8)} ${v.variant.padEnd(11)} ${String(t.hours).padStart(6)} h  kit% ${kit}  cap% ${capS}  flags: ${fl}`);
    }
  }
  console.log(`\n(${runs.length + variantRuns.length} runs in ${ms} ms)`);
}

const bad = [...runs.map((r) => failing(r.report, r.flags)), ...variantRuns.map((r) => failing(r.report, r.flags))].flat();
if (flags.check && bad.length > 0) process.exit(1);
