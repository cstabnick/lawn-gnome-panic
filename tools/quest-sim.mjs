// Quest sim runner: plays the game's quests with the bot and writes report.json and report.md (gnome-theft-auto).
// A MANUAL VALIDATION TOOL, NOT CI: `npm test` never runs it. A full headless run is a deliberate choice: start with
// --quick or a slice (--quest / --chapter). Typical times on a desktop: --quick ~15-30 s, one quest 5-10 s, --chapter n
// ~20-40 s, --all (58 runs) ~1-2 min headless; E2E ~1-3 min per quest (the dev server's first load is slow).
//
//   Headless (no browser: vitest runs src/questSim/cli.sim.test.ts with vitest.sim.config.ts):
//     node tools/quest-sim.mjs --headless [selection] [--quick] [--force] [--cheats ...] [--out dir]
//     --quick          one quest per objective kind (smoke run)
//     --force          rerun quests already in the results cache (<os tmp>/gta-quest-sim/cache.json, keyed by git HEAD
//                      plus the game's uncommitted src changes; unchanged code = those quests are skipped by default)
//
//   E2E (headless Edge/Chrome against a running dev server; the page plays each quest):
//     npm run dev -w games/gnome-theft-auto          # http://localhost:5445/
//     node tools/quest-sim.mjs [--url ...] [selection] [--cheats ...] [--out dir] [--timeout s] [--stuck s] [--headful]
//
//   Selection (none = every quest):
//     --all            every quest (the default)
//     --quest a,b      comma list of quest ids
//     --chapter n      the quests of story chapter n
//     --suite s        one CI suite: story | side | city | newcomers | races
//   Other flags:
//     --cheats c       all (default) | none | a comma list of cheat ids (src/questSim/types.ts CHEAT_IDS)
//     --out dir        output folder (default <os tmp>/gta-quest-sim/<stamp>, or .../e2e-<stamp> for E2E)
//     --url u          E2E: the dev server (default http://localhost:5445/)
//     --timeout s      E2E: seconds per run before it counts as a failure (default 600)
//     --stuck s        E2E: seconds with no status or position change before a run is stuck (default 60)
//     --headful        E2E: show the browser window
//     --parallel n     E2E: quests played at once, one page each (default 6, the cap; 1..6, may only lower it)
//
//   Sim-player cap: never more than MAX_SIM_PLAYERS (6) quest runs or browser pages alive at once, in either mode.
//   Headless runs one quest at a time in one vitest process, so the cap holds there; QUESTSIM_PARALLEL is passed
//   through to the test and is ignored by it.
//
//   Examples:
//     npm run quest-sim -w games/gnome-theft-auto -- --quest sq-grid-truthers
//     npm run quest-sim:e2e -w games/gnome-theft-auto -- --chapter 2 --cheats none
//     node tools/quest-sim.mjs --headless --suite races --out C:\scratch\races
//
// Headless writes the results array as report.json. E2E writes the same rows plus each run's page errors and any
// findings. Both write report.md with the same table: Quest | Ending | Result | Steps | Cheats | Sim s | Wall ms | Reason.
import { execSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GAME_DIR = path.resolve(HERE, '..', 'games', 'gnome-theft-auto');
// Choice quests that run once per ending.
const CHOICE_QUESTS = new Set(['ch5-even-cut', 'sq-fescue-fugitive', 'sq-tessie']);
// Hard cap on sim players alive at once (user requirement). Mirrors MAX_SIM_PLAYERS in games/gnome-theft-auto/src/questSim/config.ts
// (this script is plain Node and cannot import it). --parallel may only lower the cap.
const MAX_SIM_PLAYERS = 6;
const simParallel = (requested) => {
  const n = Math.floor(Number(requested));
  return Number.isFinite(n) && n >= 1 ? Math.min(n, MAX_SIM_PLAYERS) : MAX_SIM_PLAYERS;
};
const BROWSERS = [
  process.env.DEMO_BROWSER,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

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

/** The markdown report: the same table and findings list as src/questSim/report.ts. */
function toMarkdown(rows, title) {
  const pass = rows.filter((r) => r.status === 'pass').length;
  const blocked = rows.filter((r) => r.status === 'blocked').length;
  const fail = rows.length - pass - blocked;
  const cell = (t) => String(t ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
  const lines = [`# ${title}`, '', `${pass} pass, ${fail} fail, ${blocked} blocked of ${rows.length} runs`, ''];
  lines.push('| Quest | Ending | Result | Steps | Cheats | Sim s | Wall ms | Reason |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const r of rows) {
    const steps = r.steps ?? [];
    const passed = steps.filter((s) => s.status === 'pass').length;
    const cheats = (r.cheats ?? []).map((c) => c.id).join(', ');
    lines.push(
      `| ${cell(r.questId)} | ${r.variant ?? ''} | ${r.status} | ${passed}/${steps.length} | ${cell(cheats)} ` +
        `| ${Number(r.simSeconds ?? 0).toFixed(1)} | ${Math.round(r.wallMs ?? 0)} | ${cell(r.reason)} |`,
    );
  }
  lines.push('', '## Findings', '');
  const findings = rows.flatMap((r) => (r.findings ?? []).map((f) => ({ r, f })));
  if (findings.length === 0) lines.push('None.');
  for (const { r, f } of findings) {
    const step = f.step !== undefined ? ` ${f.step}` : '';
    lines.push(`- ${r.questId}${step}: ${f.class} ${f.check}: ${f.detail}`);
  }
  lines.push('');
  return lines.join('\n');
}

function writeReports(outDir, rows, title) {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(rows, null, 2));
  const md = toMarkdown(rows, title);
  fs.writeFileSync(path.join(outDir, 'report.md'), md);
  console.log(md);
  console.log(`report written to ${outDir}`);
}

// ---- Headless -------------------------------------------------------------------------------------------------------

/** A key for "this exact code": HEAD plus a hash of the game's uncommitted src changes and untracked src files. */
function codeKey() {
  const sh = (cmd) => { try { return execSync(cmd, { cwd: GAME_DIR, encoding: 'utf8', maxBuffer: 1 << 28 }); } catch { return ''; } };
  const h = createHash('sha1');
  h.update(sh('git rev-parse HEAD'));
  h.update(sh('git diff HEAD -- src'));
  for (const f of sh('git ls-files --others --exclude-standard -- src').split('\n').filter(Boolean)) {
    try { h.update(f); h.update(fs.readFileSync(path.join(GAME_DIR, f))); } catch { /* vanished */ }
  }
  return h.digest('hex');
}

if (has('--headless')) {
  const env = { ...process.env, QUESTSIM_CLI: '1' };
  if (flag('--quest')) env.QUESTSIM_QUEST = flag('--quest');
  if (flag('--chapter')) env.QUESTSIM_CHAPTER = flag('--chapter');
  if (flag('--suite')) env.QUESTSIM_SUITE = flag('--suite');
  if (flag('--cheats')) env.QUESTSIM_CHEATS = flag('--cheats');
  // The tool picks the folder so it can print report.md once vitest is done (vitest hides the test's own console output).
  const outDir = path.resolve(flag('--out') ?? path.join(os.tmpdir(), 'gta-quest-sim', stamp()));
  env.QUESTSIM_OUT = outDir;
  env.QUESTSIM_PARALLEL = String(simParallel(flag('--parallel')));
  if (has('--quick')) env.QUESTSIM_QUICK = '1';
  // Results cache: a quest already run on this exact code (git HEAD + the game's uncommitted src changes and untracked
  // files) is skipped unless --force. The cache lives next to the reports.
  const cacheFile = path.join(os.tmpdir(), 'gta-quest-sim', 'cache.json');
  const key = codeKey();
  let cache = { key, runs: {} };
  try {
    const c = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    if (c.key === key) cache = c;
  } catch { /* no cache yet */ }
  if (!has('--force')) {
    const done = [...new Set(Object.keys(cache.runs).map((k) => k.split('/')[0]))];
    if (done.length) {
      env.QUESTSIM_SKIP = done.join(',');
      console.log(`quest sim: ${done.length} quests already run on this code are skipped (cache ${cacheFile}; --force reruns them)`);
    }
  }
  // shell: true so npx resolves on Windows. Only the opt-in sim config runs *.sim.test.ts files.
  const child = spawn('npx vitest run --config vitest.sim.config.ts src/questSim/cli.sim.test.ts', { cwd: GAME_DIR, shell: true, stdio: 'inherit', env });
  const stop = () => { child.kill('SIGINT'); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  child.on('exit', (code, signal) => {
    const md = path.join(outDir, 'report.md');
    if (fs.existsSync(md)) console.log(`\n${fs.readFileSync(md, 'utf8')}\nreport written to ${outDir}`);
    try {
      const rows = JSON.parse(fs.readFileSync(path.join(outDir, 'report.json'), 'utf8'));
      for (const r of rows) cache.runs[`${r.questId}/${r.variant ?? ''}`] = { status: r.status, reason: r.reason };
      fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
      fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
    } catch { /* no report: nothing to cache */ }
    process.exit(code ?? (signal ? 1 : 0));
  });
} else {
  await runE2E();
}

// ---- E2E ------------------------------------------------------------------------------------------------------------

async function runE2E() {
  const { default: puppeteer } = await import('puppeteer-core');
  const url = flag('--url') ?? 'http://localhost:5445/';
  const timeoutMs = Number(flag('--timeout') ?? 600) * 1000;
  const stuckMs = Number(flag('--stuck') ?? 60) * 1000;
  const cheats = flag('--cheats') ?? 'all';
  const outDir = path.resolve(flag('--out') ?? path.join(os.tmpdir(), 'gta-quest-sim', `e2e-${stamp()}`));
  const exe = BROWSERS.find((p) => fs.existsSync(p));
  if (!exe) {
    console.error('quest-sim: no Chrome or Edge found; set DEMO_BROWSER to its executable path');
    process.exit(2);
  }

  const parallel = simParallel(flag('--parallel'));
  const browser = await puppeteer.launch({
    executablePath: exe,
    headless: has('--headful') ? false : 'new',
    protocolTimeout: 900_000,
    args: ['--ignore-gpu-blocklist', '--use-angle=default'],
  });
  // Close the browser once, whether the run ends, fails or is interrupted.
  let closing = null;
  const closeBrowser = () => {
    closing ??= browser.close().catch(() => {});
    return closing;
  };
  const onSignal = (sig) => {
    closeBrowser().finally(() => process.exit(sig === 'SIGINT' ? 130 : 143));
  };
  process.on('SIGINT', onSignal);
  process.on('SIGTERM', onSignal);

  const rows = [];
  try {
    const listPage = await browser.newPage();
    let runs;
    try {
      runs = await selectE2ERuns(listPage, url);
    } finally {
      await listPage.close().catch(() => {});
    }
    fs.mkdirSync(outDir, { recursive: true });
    console.log(`quest sim e2e: ${runs.length} runs, ${Math.min(parallel, runs.length)} at once (cap ${MAX_SIM_PLAYERS}), ` +
      `against ${url}, cheats ${cheats}, out ${outDir}`);

    // A worker pool: each run gets its own page, at most `parallel` pages open at once.
    const results = new Array(runs.length);
    let nextRun = 0;
    const worker = async () => {
      while (nextRun < runs.length) {
        const i = nextRun++;
        const { id, variant } = runs[i];
        const page = await browser.newPage();
        const pageErrors = [];
        try {
          await page.setViewport({ width: 1280, height: 720 });
          page.on('pageerror', (e) => pageErrors.push(e.stack ?? String(e)));
          page.on('console', (m) => {
            if (m.type() === 'error') pageErrors.push(m.text());
          });
          const row = await playOne(page, { id, variant, url, cheats, timeoutMs, stuckMs, outDir });
          row.errors = pageErrors;
          results[i] = row;
        } finally {
          await page.close().catch(() => {});
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(parallel, runs.length) }, worker));
    rows.push(...results);
  } finally {
    process.off('SIGINT', onSignal);
    process.off('SIGTERM', onSignal);
    await closeBrowser();
  }
  writeReports(outDir, rows, 'Quest sim (e2e)');
}

/** The (quest, variant) runs to make: the flags' selection of the page's quest list, choice quests once per ending. */
async function selectE2ERuns(page, url) {
  const explicit = flag('--quest')?.split(',').map((s) => s.trim()).filter(Boolean);
  let ids;
  if (explicit) {
    ids = explicit.map((id) => ({ id }));
  } else {
    await page.goto(`${url}?debug&questsim`, { waitUntil: 'load' });
    const list = await page.evaluate(() => window.__questSim?.list?.() ?? []);
    ids = list.map((e) => (typeof e === 'string' ? { id: e } : e)).filter((e) => e && e.id);
    if (ids.length === 0) throw new Error('quest-sim: the page listed no quests (is ?debug&questsim served?)');
  }
  const chapter = flag('--chapter') !== undefined ? Number(flag('--chapter')) : undefined;
  const suite = flag('--suite');
  const runs = [];
  for (const e of ids) {
    if (chapter !== undefined && e.chapter !== chapter) continue;
    if (suite && e.suite !== suite) continue;
    if (CHOICE_QUESTS.has(e.id)) for (const variant of ['A', 'B']) runs.push({ id: e.id, variant });
    else runs.push({ id: e.id, variant: undefined });
  }
  if (runs.length === 0) console.warn('quest-sim: the selection matched no quests');
  return runs;
}

/** Play one run. Never throws: a timeout, a stuck run or a failed result becomes a row. */
async function playOne(page, { id, variant, url, cheats, timeoutMs, stuckMs, outDir }) {
  const label = `${id}${variant ? `-${variant}` : ''}`;
  const tag = variant ? ` (${variant})` : '';
  const started = Date.now();
  const query =
    `?debug&questsim=${encodeURIComponent(id)}` +
    (variant ? `&questsimVariant=${variant}` : '') +
    `&questsimCheats=${encodeURIComponent(cheats)}&questsimRun=${Date.now()}`;
  const row = (fields) => ({
    questId: id,
    variant,
    title: id,
    status: 'fail',
    reason: '',
    steps: [],
    cheats: [],
    findings: [],
    simSeconds: 0,
    wallMs: Date.now() - started,
    ...fields,
  });
  const shot = async () => {
    try {
      await page.screenshot({ path: path.join(outDir, `${label}.png`) });
    } catch {
      // The page may be gone; the report still has the row.
    }
  };
  const finish = (r) => {
    const line = r.status === 'pass' ? `PASS ${id}${tag} ${r.simSeconds.toFixed(1)}s` : `FAIL ${id}${tag}: ${r.reason}`;
    console.log(line);
    return r;
  };

  try {
    await page.goto(url + query, { waitUntil: 'load' });
  } catch (e) {
    await shot();
    return finish(row({ reason: `bot: page did not load: ${e.message}` }));
  }

  let lastKey = null;
  let lastChange = Date.now();
  for (;;) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    let snap = null;
    try {
      snap = await page.evaluate(
        (qid, vr) => {
          const api = window.__questSim;
          const hit = (api?.results?.() ?? []).find((r) => r.questId === qid && (r.variant ?? null) === vr);
          const p = window.__gta?.player;
          return {
            hit: hit ?? null,
            status: api?.status?.() ?? null,
            pos: p ? { x: p.x, y: p.y, z: p.z } : null,
          };
        },
        id,
        variant ?? null,
      );
    } catch {
      // Mid-navigation (the page may reload itself once): try again on the next tick.
      continue;
    }
    if (snap.hit) {
      const h = snap.hit;
      if (h.status !== 'pass') await shot();
      return finish(row({
        status: h.status,
        reason: h.reason ?? '',
        steps: h.steps ?? [],
        cheats: h.cheats ?? [],
        findings: h.findings ?? [],
        simSeconds: h.simSeconds ?? 0,
        title: h.title ?? id,
      }));
    }

    const key = JSON.stringify([snap.status, snap.pos && { x: Math.round(snap.pos.x), z: Math.round(snap.pos.z) }]);
    // The stuck clock runs only once the bot is playing: loading the game (and the one reload a run makes to prepare
    // its save) can take a minute on a dev server; until then only --timeout applies.
    if (!snap.status || snap.status.running !== true) {
      lastKey = key;
      lastChange = Date.now();
    }
    if (key !== lastKey) {
      lastKey = key;
      lastChange = Date.now();
    }
    const statusLine = typeof snap.status === 'string' ? snap.status : JSON.stringify(snap.status);
    if (Date.now() - lastChange > stuckMs) {
      const dump = await dumpState(page, snap);
      fs.writeFileSync(path.join(outDir, `${label}.stuck.json`), JSON.stringify(dump, null, 2));
      await shot();
      return finish(row({ reason: `bot: stuck: ${statusLine}` }));
    }
    if (Date.now() - started > timeoutMs) {
      await shot();
      return finish(row({ reason: `bot: timeout after ${Math.round(timeoutMs / 1000)} s: ${statusLine}` }));
    }
  }
}

/** The state to see why a run stopped: status line, player position and vehicle, journal's active lines. */
async function dumpState(page, snap) {
  try {
    const extra = await page.evaluate(() => {
      const g = window.__gta;
      const p = g?.player;
      let journal = null;
      try {
        journal = g?.quests?.getJournal?.()?.activeLines ?? null;
      } catch {
        journal = null;
      }
      return { vehicle: p?.vehicle?.kind ?? null, journal };
    });
    return { status: snap.status, player: snap.pos, vehicle: extra.vehicle, journal: extra.journal };
  } catch (e) {
    return { status: snap.status, player: snap.pos, error: String(e) };
  }
}
