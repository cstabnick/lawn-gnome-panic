#!/usr/bin/env node
// Finds z-fighting in a running three.js game: surfaces that lie in the same plane, overlap, and will flicker
// through each other somewhere inside the camera's far plane. Works on any three.js page with no game changes:
// it hooks the renderer through three's devtools hook, takes the biggest scene it renders and that frame's
// camera, and runs auditCoplanar from @lawn/depth over it. See docs/rendering.md.
//
// Usage: node tools/zfight.mjs <url> [--wait 8000] [--size 960x600] [--min-px 4] [--json] [--all]
//   e.g. node tools/zfight.mjs "http://localhost:5198/?offline"
// Start the game's dev server first. Exit code 1 if anything will visibly flicker.
//   --wait     ms to let the game build its world before the scan (default 8000)
//   --min-px   ignore flicker smaller than this on screen where it starts (default 4)
//   --json     print the findings as JSON
//   --all      also report pairs whose two surfaces look the same (same colour and texture)
// Only what the game has built at that moment is checked: games that stream chunks or build zones on demand
// need one run per place (use the game's own URL params to start there).

import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import { auditCoplanar } from '../packages/depth/src/audit.ts';

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith('--') && !/^\d/.test(a));
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
if (!url) {
  console.error('usage: node tools/zfight.mjs <url> [--wait ms] [--size WxH] [--min-px n] [--json] [--all]');
  process.exit(2);
}
const waitMs = Number(opt('wait', 8000));
const [W, H] = opt('size', '960x600').split('x').map(Number);
const minPixels = Number(opt('min-px', 4));
const asJson = args.includes('--json');

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
const exe = BROWSERS.find((p) => fs.existsSync(p));
if (!exe) {
  console.error('zfight: no Chrome or Edge found; set DEMO_BROWSER to its executable path');
  process.exit(2);
}

const browser = await puppeteer.launch({
  executablePath: exe,
  headless: true,
  args: process.getuid?.() === 0 ? ['--no-sandbox'] : [],
});
let result;
try {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H });
  // Before any page script runs: catch every WebGLRenderer and remember the biggest scene it draws, with its camera.
  await page.evaluateOnNewDocument(() => {
    const sizes = new WeakMap();
    const hook = new EventTarget();
    hook.addEventListener('observe', (e) => {
      const r = e.detail;
      if (!r || typeof r.render !== 'function' || r.__zfightHooked) return;
      r.__zfightHooked = true;
      const render = r.render;
      r.render = function (scene, camera) {
        let n = sizes.get(scene);
        if (n === undefined) {
          n = 0;
          scene.traverse(() => n++);
          sizes.set(scene, n);
        }
        const best = window.__zfight;
        if (camera.isPerspectiveCamera && (!best || best.scene === scene || n >= best.size)) {
          window.__zfight = { scene, camera, size: n, renderer: this };
        }
        return render.call(this, scene, camera);
      };
    });
    window.__THREE_DEVTOOLS__ = hook;
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  // 'load', not 'networkidle0': games that keep fetching (GTA) never go idle and time out.
  await page.goto(url, { waitUntil: 'load', timeout: 90000 });
  if (/[?&]debug\b/.test(url)) {
    // Games that expose window.__gta (debug mode) are ready once it exists; give the world time to build.
    await page.waitForFunction(() => !!window.__gta, { timeout: 90000 });
  } else {
    await new Promise((r) => setTimeout(r, 5000));
  }
  await new Promise((r) => setTimeout(r, waitMs));
  result = await page.evaluate(
    (src, minPx, includeSameLook) => {
      const hit = window.__zfight;
      if (!hit) return { error: 'no three.js render seen (is it a three.js page, and did it start rendering?)' };
      const audit = new Function(`return (${src})`)();
      const { camera, scene, renderer } = hit;
      const out = audit(scene, {
        near: camera.near, far: camera.far, fovDeg: camera.fov, visibleTo: scene.fog?.far,
        viewportHeight: renderer.domElement.clientHeight || window.innerHeight,
        minPixels: minPx, includeSameLook,
      });
      const logDepth = !!renderer.capabilities?.logarithmicDepthBuffer;
      return { ...out, near: camera.near, far: camera.far, fogFar: scene.fog?.far, objects: hit.size, logDepth };
    },
    auditCoplanar.toString(),
    minPixels,
    args.includes('--all'),
  );
  if (errors.length) result.pageErrors = errors;
} finally {
  await browser.close();
}

if (result.error) {
  console.error(`zfight: ${result.error}`);
  process.exit(2);
}
if (asJson) {
  console.log(JSON.stringify(result, null, 1));
} else {
  console.log(`zfight: ${result.objects} objects, ${result.triangles} faces, camera near ${result.near} far ${result.far}${result.fogFar ? `, fog ends ${result.fogFar}` : ''}`);
  if (result.logDepth) console.log('note: the renderer uses a logarithmic depth buffer; distances below assume a normal one');
  // The same pair of parts repeated (one per copy of a sign, say) prints once, with a count.
  const groups = new Map();
  for (const f of result.findings) {
    const key = [f.a, f.b, f.kind, f.gap, f.offsetSteps].join('|');
    const g = groups.get(key);
    if (g) g.copies++;
    else groups.set(key, { ...f, copies: 1 });
  }
  for (const f of groups.values()) {
    const where = f.fightsBeyond === 0 ? 'at every distance' : `beyond ~${f.fightsBeyond} m`;
    const what = f.kind === 'buried' ? 'gets buried' : 'flickers';
    const copies = f.copies > 1 ? `, ${f.copies} copies` : '';
    console.log(`\n  ${what} ${where} (gap ${f.gap} m, offset ${f.offsetSteps} steps, ${f.size} m${copies})`);
    console.log(`    A ${f.a}  @ ${f.atA.join(', ')}`);
    console.log(`    B ${f.b}  @ ${f.atB.join(', ')}`);
  }
  console.log(result.findings.length ? `\n${result.findings.length} z-fighting pair(s). Fixes: docs/rendering.md` : 'ZFIGHT OK');
}
process.exit(result.findings.length ? 1 : 0);
