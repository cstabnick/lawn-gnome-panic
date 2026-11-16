#!/usr/bin/env node
// Records a scripted demo of a running game to an MP4 (or a GIF with --gif).
// With --pr <n> it records a GIF, uploads it with gh and embeds it in that PR's description.
// See docs/demos.md.
//
// Usage: npm run demo -- <demo.json> [--gif] [--out file.mp4|file.gif] [--url http://localhost:5174/]
//                                    [--pr <number> [--repo owner/name] [--title "Caption"]]
//   e.g. npm run demo -- games/sample-3d/demos/double-jump-flip.json
// Start the game's dev server first (npm run dev -w games/<name>).
//
// A demo file:
//   {
//     "url": "http://localhost:5174/",            // optional, default below
//     "setup": { "autostart": "solo", "sandbox": true, "cam": "side" },
//                                                 // -> query string; true = bare flag, false/null = left out
//     "warmup": 2.5,                              // seconds to wait after load before recording
//     "size": [960, 600], "fps": 30,              // optional (GIF default 640x400 at 25)
//     "duration": 4,                              // seconds recorded (default: last step + 1)
//     "steps": [
//       { "t": 0.5, "press": "jump" },            // tap
//       { "t": 1.0, "hold": "forward", "for": 0.8 } // hold, then release
//     ]
//   }
// Actions: jump, forward, back, left, right, sprint, turnLeft, turnRight, or any KeyboardEvent.code (e.g. "KeyF").
// Output: <demo folder>/out/<demo name>.mp4 (or .gif) unless --out is given; the extension picks the format.

import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { PNG } from 'pngjs';
import gifenc from 'gifenc';
import ffmpeg from '@ffmpeg-installer/ffmpeg';

const { GIFEncoder, quantize, applyPalette } = gifenc;

const ACTIONS = {
  jump: 'Space', forward: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD',
  sprint: 'ShiftLeft', turnLeft: 'KeyQ', turnRight: 'KeyE',
};

const BROWSERS = [
  process.env.DEMO_BROWSER,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/microsoft-edge',
].filter(Boolean);

function fail(msg) {
  console.error(`record-demo: ${msg}`);
  process.exit(1);
}

// ---------- arguments and demo file ----------
const flags = {};
let demoPath;
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === '--gif') flags.gif = true;
  else if (a.startsWith('--')) flags[a.slice(2)] = process.argv[++i];
  else demoPath ??= a;
}
if (!demoPath) fail('usage: npm run demo -- <demo.json> [--gif] [--out file.mp4|file.gif] [--url http://localhost:5174/] [--pr <n> [--repo owner/name] [--title text]]');
const flag = (name) => flags[name];

let demo;
try {
  demo = JSON.parse(fs.readFileSync(demoPath, 'utf8'));
} catch (e) {
  fail(`cannot read ${demoPath}: ${e.message}`);
}
const steps = demo.steps ?? [];
for (const s of steps) {
  const a = s.press ?? s.hold;
  if (typeof s.t !== 'number' || !a) fail(`bad step ${JSON.stringify(s)}: needs "t" and "press" or "hold"`);
  if (s.hold && typeof s.for !== 'number') fail(`bad step ${JSON.stringify(s)}: "hold" needs "for" (seconds)`);
}
const warmupS = demo.warmup ?? 2.5;
const lastT = Math.max(0, ...steps.map((s) => s.t + (s.for ?? 0)));
const durationS = demo.duration ?? lastT + 1;

const url = new URL(flag('url') ?? demo.url ?? 'http://localhost:5174/');
for (const [k, v] of Object.entries(demo.setup ?? {})) {
  if (v === false || v === null || v === undefined) continue;
  url.searchParams.set(k, v === true ? '' : String(v));
}
const demoName = path.basename(demoPath, '.json');
const prNumber = flag('pr');
if (prNumber !== undefined && !/^\d+$/.test(prNumber)) fail(`--pr needs a PR number, got "${prNumber}"`);
// PR embeds must be GIFs: GitHub only plays video it hosted itself, but shows any image inline.
const out = flag('out') ?? path.join(path.dirname(demoPath), 'out', `${demoName}.${flag('gif') || prNumber ? 'gif' : 'mp4'}`);
const asGif = out.toLowerCase().endsWith('.gif');
if (prNumber && !asGif) fail('--pr embeds a GIF; drop --out or give it a .gif path');
// Video is cheap per frame, so it gets a bigger, smoother default than a GIF.
const [W, H] = demo.size ?? (asGif ? [640, 400] : [960, 600]);
const FPS = demo.fps ?? (asGif ? 25 : 30);

// Key events in time order: a press is a 60 ms tap, a hold is down then up.
const events = [];
for (const s of steps) {
  const action = s.press ?? s.hold;
  const code = ACTIONS[action] ?? action;
  const upAt = s.press ? s.t + 0.06 : s.t + s.for;
  events.push({ at: s.t, type: 'down', code }, { at: upAt, type: 'up', code });
}
events.sort((a, b) => a.at - b.at);

// ---------- browser ----------
const exe = BROWSERS.find((p) => fs.existsSync(p));
if (!exe) fail('no Chrome or Edge found; set DEMO_BROWSER to its executable path');

try {
  await fetch(url.origin);
} catch {
  fail(`nothing is serving ${url.origin}. Start the dev server first, e.g. npm run dev -w games/sample-3d`);
}

const browser = await puppeteer.launch({
  executablePath: exe,
  headless: true,
  args: process.platform === 'darwin' ? ['--use-angle=metal'] : [],
});
const errors = [];
try {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('404')) errors.push(m.text());
  });
  console.log(`recording ${url.href}`);
  await page.goto(url.href, { waitUntil: 'networkidle0' });
  await sleep(warmupS * 1000);

  const cdp = await page.createCDPSession();
  const frames = [];
  cdp.on('Page.screencastFrame', (f) => {
    frames.push({ t: f.metadata.timestamp, data: f.data });
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1, maxWidth: W, maxHeight: H });

  // Play the steps against the wall clock so a slow event never pushes the rest late.
  const start = performance.now();
  for (const e of events) {
    await sleep(start + e.at * 1000 - performance.now());
    if (e.type === 'down') await page.keyboard.down(e.code);
    else await page.keyboard.up(e.code);
  }
  await sleep(start + durationS * 1000 - performance.now());
  await cdp.send('Page.stopScreencast');

  if (frames.length < 2) throw new Error('no frames captured (is the page rendering?)');
  const t0 = frames[0].t;
  const spanS = frames.at(-1).t - t0;
  if (frames.length / spanS < FPS * 0.6) {
    console.warn(`warning: the browser only rendered ${(frames.length / spanS).toFixed(0)} fps; the GIF may stutter`);
  }

  // Resample to a steady FPS by capture time.
  const picked = [];
  let j = 0;
  for (let t = t0; t <= t0 + spanS; t += 1 / FPS) {
    while (j + 1 < frames.length && frames[j + 1].t <= t) j++;
    picked.push(Buffer.from(frames[j].data, 'base64'));
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  if (asGif) writeGif(picked, out);
  else await writeMp4(picked, out);
  const mb = (fs.statSync(out).size / 1e6).toFixed(1);
  console.log(`wrote ${out} (${spanS.toFixed(1)} s, ${mb} MB)`);
} finally {
  await browser.close();
}
if (errors.length > 0) {
  console.error('page errors during the demo:');
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
if (prNumber) {
  try {
    embedInPr(prNumber, out);
  } catch (e) {
    fail(`recorded ${out}, but embedding it in the PR failed: ${e.message}`);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, Math.max(0, ms)));
}

function writeGif(pngs, file) {
  const gif = GIFEncoder();
  for (const buf of pngs) {
    const png = PNG.sync.read(buf);
    const palette = quantize(png.data, 256);
    gif.writeFrame(applyPalette(png.data, palette), png.width, png.height, { palette, delay: 1000 / FPS });
  }
  gif.finish();
  fs.writeFileSync(file, gif.bytes());
}

/** H.264 MP4 that plays everywhere (GitHub, Slack, phones): yuv420p, even size, moov atom up front. */
function writeMp4(pngs, file) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpeg.path, [
      '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
      '-preset', 'slow', '-crf', '20', '-movflags', '+faststart', file,
    ], { stdio: ['pipe', 'inherit', 'inherit'] });
    proc.on('error', reject);
    proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${code}`))));
    for (const buf of pngs) proc.stdin.write(buf);
    proc.stdin.end();
  });
}

// ---------- --pr: upload the GIF and embed it in the PR description ----------

function gh(args, input) {
  try {
    return execFileSync('gh', args, { encoding: 'utf8', input, stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    throw new Error(`gh ${args.slice(0, 3).join(' ')} failed: ${(e.stderr || e.message).trim()}`);
  }
}

/** owner/name of the repo PRs target: --repo, else the "origin" remote. */
function targetRepo() {
  if (flag('repo')) return flag('repo');
  const url = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim();
  const m = url.match(/github\.com[:/]([^/]+\/[^/]+?)(\.git)?$/);
  if (!m) fail(`cannot tell the GitHub repo from origin (${url}); pass --repo owner/name`);
  return m[1];
}

function embedInPr(pr, file) {
  const repo = targetRepo();
  const info = JSON.parse(gh(['pr', 'view', pr, '--repo', repo, '--json', 'body,headRepository,headRepositoryOwner']));
  // Upload to the repo the PR comes from (a fork, or the target itself), which the author can write to.
  const assetsRepo = `${info.headRepositoryOwner.login}/${info.headRepository.name}`;
  const branch = 'demo-assets';

  // The demo-assets branch holds only uploaded clips. Create it from the default branch's head if it is missing.
  try {
    gh(['api', `repos/${assetsRepo}/git/ref/heads/${branch}`]);
  } catch {
    const base = JSON.parse(gh(['api', `repos/${assetsRepo}`])).default_branch;
    const sha = JSON.parse(gh(['api', `repos/${assetsRepo}/git/ref/heads/${base}`])).object.sha;
    gh(['api', '-X', 'POST', `repos/${assetsRepo}/git/refs`, '-f', `ref=refs/heads/${branch}`, '-f', `sha=${sha}`]);
  }

  // A new file name per upload, so GitHub's image cache never shows an old take.
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..*/, '');
  const assetPath = `demos/pr-${pr}/${demoName}-${stamp}.gif`;
  const sizeMb = fs.statSync(file).size / 1e6;
  if (sizeMb > 8) console.warn(`warning: ${sizeMb.toFixed(1)} MB GIF; GitHub may not display images this large. Try a shorter duration or smaller size.`);
  const payload = JSON.stringify({
    message: `Demo clip for ${repo}#${pr}: ${demoName}`,
    branch,
    content: fs.readFileSync(file).toString('base64'),
  });
  gh(['api', '-X', 'PUT', `repos/${assetsRepo}/contents/${assetPath}`, '--input', '-'], payload);
  const imgUrl = `https://raw.githubusercontent.com/${assetsRepo}/${branch}/${assetPath}`;

  // One marked block per demo inside a "## Demo" section: re-running replaces it in place.
  const title = flag('title') ?? demo.title ?? demoName;
  const block = `<!-- demo:${demoName} -->\n**${title}**\n\n![${title}](${imgUrl})\n<!-- /demo:${demoName} -->`;
  let body = info.body ?? '';
  const re = new RegExp(`<!-- demo:${demoName} -->[\\s\\S]*?<!-- /demo:${demoName} -->`);
  if (re.test(body)) {
    body = body.replace(re, block);
  } else if (/<!-- \/demo:[^>]*-->/.test(body)) {
    // After the last existing demo, so clips stay in the order they were added.
    const ends = [...body.matchAll(/<!-- \/demo:[^>]*-->/g)];
    const at = ends.at(-1).index + ends.at(-1)[0].length;
    body = `${body.slice(0, at)}\n\n${block}${body.slice(at)}`;
  } else if (/^## Demo\s*$/m.test(body)) {
    body = body.replace(/^## Demo\s*$/m, `## Demo\n\n${block}`);
  } else {
    // Put the section above the trailing "Generated with" footer if there is one, else at the end.
    const section = `## Demo\n\n${block}\n\n`;
    const footer = body.search(/^.*Generated with \[Claude Code\].*$/m);
    body = footer >= 0 ? body.slice(0, footer) + section + body.slice(footer) : `${body.trimEnd()}\n\n${section.trimEnd()}\n`;
  }
  gh(['pr', 'edit', pr, '--repo', repo, '--body-file', '-'], body);
  console.log(`embedded in https://github.com/${repo}/pull/${pr}\n  ${imgUrl}`);
}
