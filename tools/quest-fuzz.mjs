// Quest fuzzer (gnome-theft-auto): plays quests headless with the sim bot and injects one disruption per run (vehicle
// destroyed or sunk, player teleported away or cracked, quest NPC gone, heat, save/reload, traffic cleanup, ...), then
// reports whether the quest still finished. Docs: docs/design/gnome-theft-auto/quest-fuzz.md. Manual tool, not CI.
//
//   node tools/quest-fuzz.mjs [--seed 7] [--quest a,b] [--per-quest 3] [--all-disruptions] [--out dir]
//   npm run quest-fuzz -w games/gnome-theft-auto -- --quest first-contract --per-quest 3
//
//     --seed n            the random seed (default 1); the same seed replays the same runs
//     --quest a,b         comma list of quest ids (default every quest in the sim plans)
//     --per-quest n       random disruptions per quest and ending (default 2)
//     --all-disruptions   every disruption once per quest (ignores --per-quest)
//     --out dir           output folder (default <os tmp>/gta-quest-fuzz/<stamp>); fuzz.json and fuzz.md land there
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GAME_DIR = path.resolve(HERE, '..', 'games', 'gnome-theft-auto');

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const has = (name) => argv.includes(name);

function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

const outDir = path.resolve(flag('--out') ?? path.join(os.tmpdir(), 'gta-quest-fuzz', stamp()));
const env = { ...process.env, QUESTFUZZ_CLI: '1', QUESTFUZZ_OUT: outDir };
if (flag('--seed')) env.QUESTFUZZ_SEED = flag('--seed');
if (flag('--quest')) env.QUESTFUZZ_QUEST = flag('--quest');
if (flag('--per-quest')) env.QUESTFUZZ_PER_QUEST = flag('--per-quest');
if (has('--all-disruptions')) env.QUESTFUZZ_ALL = '1';

// shell: true so npx resolves on Windows. Only the opt-in sim config runs *.sim.test.ts files.
const child = spawn('npx vitest run --config vitest.sim.config.ts src/questSim/fuzz/fuzz.sim.test.ts', {
  cwd: GAME_DIR, shell: true, stdio: 'inherit', env,
});
const stop = () => { child.kill('SIGINT'); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
child.on('exit', (code, signal) => {
  const md = path.join(outDir, 'fuzz.md');
  if (fs.existsSync(md)) console.log(`\n${fs.readFileSync(md, 'utf8')}\nreport written to ${outDir}`);
  process.exit(code ?? (signal ? 1 : 0));
});
