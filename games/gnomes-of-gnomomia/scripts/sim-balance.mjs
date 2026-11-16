// CLI balance reporter: bundles src/sim/* with esbuild and runs Monte Carlo sweeps in Node.
// Usage: npm run sim -w games/gnomes-of-gnomomia -- [--zone=...] [--scenario=...] [--class=...] [--policy=...] [--seeds=50] [--json]
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const rootDir = join(here, '..');
const dir = mkdtempSync(join(tmpdir(), 'gnomomia-sim-'));
const out = join(dir, 'sim-bundle.mjs');

await build({
  stdin: {
    contents: [
      "export * from './src/sim/runner.ts';",
      "export * from './src/sim/scenarios.ts';",
      "export * from './src/sim/agents.ts';",
      "export * from './src/sim/loadout.ts';",
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

const args = process.argv.slice(2);
const flags = {};
for (const a of args) {
  if (!a.startsWith('--')) continue;
  const eq = a.indexOf('=');
  if (eq === -1) flags[a.slice(2)] = true;
  else flags[a.slice(2, eq)] = a.slice(eq + 1);
}

const seeds = Math.max(1, Number(flags.seeds ?? 50));
const zoneFilter = typeof flags.zone === 'string' ? flags.zone : null;
const scenarioFilter = typeof flags.scenario === 'string' ? flags.scenario : null;
const classFilter = typeof flags.class === 'string' ? flags.class : null;
const policyFilter = typeof flags.policy === 'string' ? flags.policy : null;
const jsonOut = flags.json === true;

const ZONE_LEVEL = {
  mossbottom: 3,
  thatchford: 8,
  keep: 11,
  deeps: 11,
  cloverfield: 14,
  hedgewood: 18,
  rockery: 23,
  verge: 28,
};

function defaultLevelForScenario(sc) {
  const m = /\(L(\d+)/.exec(sc.name);
  if (m) return Math.min(30, Number(m[1]));
  return ZONE_LEVEL[sc.zone ?? 'mossbottom'] ?? 10;
}

function loadoutsForScenario(sc) {
  const lvl = defaultLevelForScenario(sc);
  if (lvl < 5) {
    if (classFilter && classFilter !== 'classless') return [];
    return [{ level: lvl, classId: null, gearTier: 'zone-plain' }];
  }
  const all = [
    { level: lvl, classId: 'warden', build: 'shieldwall', gearTier: 'zone-plain' },
    { level: lvl, classId: 'slinger', build: 'deadeye', gearTier: 'zone-plain' },
    { level: lvl, classId: 'mage', build: 'sunburst', gearTier: 'zone-plain' },
  ];
  if (classFilter === 'classless') return [{ level: lvl, classId: null, gearTier: 'zone-plain' }];
  if (classFilter) return all.filter((l) => l.classId === classFilter);
  if (sc.kind === 'boss') return all;
  return [all[0]];
}

function policiesForScenario(sc) {
  if (policyFilter) {
    const p = sim.POLICIES[policyFilter];
    if (!p) throw new Error(`Unknown policy '${policyFilter}'. Valid: ${Object.keys(sim.POLICIES).join(', ')}`);
    return [p];
  }
  if (sc.kind === 'boss') {
    return [sim.TacticalPlayer, sim.GreedyBerserker, sim.PassiveTurtler];
  }
  return [sim.TacticalPlayer];
}

const scenarios = sim.SCENARIO_LIST.filter((sc) => {
  if (zoneFilter && sc.zone !== zoneFilter) return false;
  if (scenarioFilter && !sc.id.includes(scenarioFilter)) return false;
  return true;
});

const summaries = [];
for (const sc of scenarios) {
  const loadouts = loadoutsForScenario(sc);
  const policies = policiesForScenario(sc);
  for (const lo of loadouts) {
    for (const pol of policies) {
      // For boss comparisons without explicit policy/class filter, run GreedyBerserker/PassiveTurtler on the primary loadout only
      if (!policyFilter && !classFilter && sc.kind === 'boss' && pol.id !== 'tactical' && lo.classId !== 'warden') {
        continue;
      }
      summaries.push(sim.runMonteCarlo(sc, lo, pol, { seeds }));
    }
  }
}

if (jsonOut) {
  console.log(JSON.stringify(summaries, null, 2));
} else {
  console.log(`=== GNOMOMIA BALANCE REPORT (seeds=${seeds}, dt=0.1s) ===\n`);
  console.log(sim.formatSummaryTable(summaries));
  const flagged = summaries.filter((s) => s.diagnostics.length > 0);
  console.log('\n=== DIAGNOSTICS ===');
  if (flagged.length === 0) {
    console.log('None (all checks within target thresholds).');
  } else {
    for (const s of flagged) {
      for (const d of s.diagnostics) {
        console.log(`[${d.tag}] ${d.message}`);
      }
    }
  }
}
