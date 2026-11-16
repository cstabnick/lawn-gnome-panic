// One-command demo renderer for Gnomes of Gnomomia simulator scenarios.
// Starts Vite if needed, writes a demo config, and delegates to tools/record-demo.mjs.
//
// Usage:
//   npm run sim:demo -w games/gnomes-of-gnomomia -- [--scenario=boss-mole-king] [--policy=tactical] [--class=warden]
//                                                  [--seed=1] [--speed=2] [--duration=5] [--gif] [--out=...]
//                                                  [--pr=<n>] [--title="..."] [--repo=owner/name]
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const gameDir = resolve(here, '..');
const repoRoot = resolve(gameDir, '../..');
const recorder = join(repoRoot, 'tools', 'record-demo.mjs');

const args = process.argv.slice(2);
const flags = {};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (!a.startsWith('--')) continue;
  const eq = a.indexOf('=');
  if (eq === -1) {
    const key = a.slice(2);
    const next = args[i + 1];
    if (key === 'gif') flags.gif = true;
    else if (next && !next.startsWith('--')) { flags[key] = next; i++; }
    else flags[key] = true;
  } else {
    flags[a.slice(2, eq)] = a.slice(eq + 1);
  }
}

const scenario = String(flags.scenario ?? 'boss-mole-king');
const policy = String(flags.policy ?? 'tactical');
const classId = flags.class ? String(flags.class) : undefined;
const seed = Number(flags.seed ?? 1);
const speed = Number(flags.speed ?? 2);
const duration = Number(flags.duration ?? 5);
const port = Number(flags.port ?? 5291);
const baseUrl = String(flags.url ?? `http://127.0.0.1:${port}/`);

async function isReachable(url) {
  try {
    const res = await fetch(url);
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForServer(url, proc, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (proc && proc.exitCode !== null) {
      throw new Error(`Vite exited early with code ${proc.exitCode}`);
    }
    if (await isReachable(url)) return;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Timed out waiting for dev server at ${url}`);
}

let viteProc = null;
const startedLocally = !(await isReachable(baseUrl));
if (startedLocally) {
  const viteBin = join(repoRoot, 'node_modules', 'vite', 'bin', 'vite.js');
  viteProc = spawn(process.execPath, [viteBin, '--host', '127.0.0.1', '--port', String(port)], {
    cwd: gameDir,
    stdio: ['ignore', 'ignore', 'pipe'],
    windowsHide: true,
  });
  viteProc.stderr?.on('data', (d) => process.stderr.write(d));
  try {
    await waitForServer(baseUrl, viteProc);
  } catch (e) {
    viteProc.kill();
    throw e;
  }
}

const tmpDir = mkdtempSync(join(tmpdir(), 'gnomomia-sim-demo-'));
const demoJsonPath = join(tmpDir, `${scenario}.json`);

try {
  const setup = {
    sim: scenario,
    policy,
    seed,
    speed,
    controls: '0',
  };
  if (classId) setup.class = classId;

  const demoSpec = {
    title: typeof flags.title === 'string' ? flags.title : `Sim: ${scenario} (${policy}${classId ? `, ${classId}` : ''})`,
    url: baseUrl,
    setup,
    warmup: 0.8,
    duration,
    steps: [
      { t: 0.8, hold: 'ArrowRight', for: Math.min(1.5, duration * 0.3) },
      { t: Math.max(1.0, duration * 0.55), hold: 'ArrowLeft', for: Math.min(1.2, duration * 0.25) },
    ],
  };
  writeFileSync(demoJsonPath, JSON.stringify(demoSpec, null, 2));

  const recArgs = [recorder, demoJsonPath];
  if (flags.gif) recArgs.push('--gif');
  if (flags.out) recArgs.push('--out', resolve(process.cwd(), String(flags.out)));
  else if (!flags.pr) {
    const ext = flags.gif ? 'gif' : 'mp4';
    recArgs.push('--out', join(gameDir, 'demos', 'out', `${scenario}.${ext}`));
  }
  if (flags.pr) recArgs.push('--pr', String(flags.pr));
  if (flags.repo) recArgs.push('--repo', String(flags.repo));
  if (typeof flags.title === 'string') recArgs.push('--title', flags.title);

  execFileSync(process.execPath, recArgs, { cwd: repoRoot, stdio: 'inherit' });
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
  if (viteProc) viteProc.kill();
}
