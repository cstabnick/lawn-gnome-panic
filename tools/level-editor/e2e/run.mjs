// End-to-end test of the level editor: starts its dev server on a THROWAWAY COPY of the level files, drives the page in
// headless Chrome with real mouse and keyboard events, and checks what lands on disk. It never touches the repo's data.
//   npm run e2e -w tools/level-editor        (needs Chrome, Edge or Chromium; set CHROME=/path/to/it if it is not found)
import { copyFileSync, cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { createServer } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));
const toolDir = resolve(here, '..');
const repoLevels = resolve(toolDir, '../../games/gnomes-of-gnomomia/src/data/levels');

function findChrome() {
  const c = [process.env.CHROME, process.env.EDGE,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/opt/pw-browsers/chromium'].filter(Boolean);
  const hit = c.find((p) => existsSync(p));
  if (!hit) throw new Error('No Chrome/Edge/Chromium found: set CHROME=/path/to/browser');
  return hit;
}

const failures = [];
let passed = 0;
function check(name, ok, detail = '') {
  if (ok) { passed++; console.log(`  ok   ${name}`); } else { failures.push(name); console.log(`  FAIL ${name}${detail ? ' :: ' + detail : ''}`); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

const tmp = mkdtempSync(join(tmpdir(), 'level-editor-e2e-'));
const levels = join(tmp, 'levels');
cpSync(repoLevels, levels, { recursive: true });
process.env.LEVEL_EDITOR_LEVELS_DIR = levels;

let server, browser;
try {
  server = await createServer({ root: toolDir, configFile: resolve(toolDir, 'vite.config.ts'), configLoader: 'runner', logLevel: 'error', server: { port: 5394, strictPort: false, open: false } });
  await server.listen();
  const url = server.resolvedUrls.local[0];
  browser = await puppeteer.launch({
    executablePath: findChrome(), headless: 'new',
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'],
    defaultViewport: { width: 1300, height: 850 },
  });

  const errors = [];
  async function openPage() {
    const page = await browser.newPage();
    page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => window.editor && document.querySelector('#le-view canvas'), { timeout: 60000 });
    await sleep(2500);
    const ctl = {
      page,
      ev: (fn, arg) => page.evaluate(fn, arg),
      click: (text) => page.evaluate((t) => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === t && x.offsetParent !== null); if (!b) return false; b.click(); return true; }, text),
      status: () => page.evaluate(() => document.getElementById('le-status').textContent),
      box: () => page.evaluate(() => { const r = document.querySelector('#le-view canvas').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }),
      key: async (k, mods = []) => { for (const m of mods) await page.keyboard.down(m); await page.keyboard.press(k); for (const m of mods) await page.keyboard.up(m); await sleep(250); },
    };
    return ctl;
  }

  console.log('boot');
  let t = await openPage();
  const boot = await t.ev(() => ({ zones: window.editor.outdoorZones.length, tools: [...document.querySelectorAll('#le-tools button')].map((b) => b.textContent) }));
  check('editor boots with 7 zones and 5 tools', boot.zones === 7 && boot.tools.join() === 'View,Brush,Select,Road,Analyze', JSON.stringify(boot));
  const box = await t.box();
  const cx = box.x + box.w / 2, cy = box.y + box.h * 0.62;
  const houses = () => t.ev(() => window.editor.zones.mossbottom.houses.length);

  console.log('zone edit and save');
  const original = readFileSync(join(levels, 'mossbottom.level.json'), 'utf8');
  await t.click('Select'); await t.click('Add House');
  await t.page.mouse.click(cx + 150, cy + 60); await sleep(500);
  check('a house was added', (await houses()) === 6);
  check('the zone is marked unsaved', await t.ev(() => window.editor.dirty.zones.has('mossbottom')));
  await t.click('Save'); await sleep(1500);
  check('Save reports success', /^Saved/.test(await t.status()), await t.status());
  const saved = readJson(join(levels, 'mossbottom.level.json'));
  const orig = JSON.parse(original);
  check('the saved zone has 6 houses', saved.data.houses.length === 6, String(saved.data.houses.length));
  const added = saved.data.houses[5];
  check('the new house has a stable id and a style', /^house-/.test(added?.id ?? '') && added?.style === 'mushroom', JSON.stringify(added));
  const strip = (d) => JSON.stringify({ ...d, data: { ...d.data, houses: undefined } });
  check('nothing but the houses changed in the document', strip(saved) === strip(orig));
  check('the five original houses are unchanged', JSON.stringify(saved.data.houses.slice(0, 5)) === JSON.stringify(orig.data.houses));
  const others = readdirSync(levels).filter((f) => f.endsWith('.level.json') && f !== 'mossbottom.level.json');
  check('no other zone file was rewritten', others.every((f) => readFileSync(join(levels, f), 'utf8') === readFileSync(join(repoLevels, f), 'utf8')));
  check('Save cleared the unsaved mark', await t.ev(() => window.editor.dirty.zones.size === 0));

  console.log('round trip');
  await t.key('z', ['Control']); await sleep(300);
  check('undo removes the house', (await houses()) === 5);
  await t.click('Save'); await sleep(1500);
  check('saving the undone state restores the original file byte for byte', readFileSync(join(levels, 'mossbottom.level.json'), 'utf8') === original);

  console.log('prefab guard');
  await t.click('Add Prop'); await t.page.mouse.click(cx - 120, cy + 60); await sleep(500);
  await t.ev(() => { const i = document.querySelector('.le-prefab-row input'); i.value = 'not-a-real-prefab'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); });
  await sleep(400);
  const before = statSync(join(levels, 'mossbottom.level.json')).mtimeMs;
  await t.click('Save'); await sleep(1200);
  check('Save refuses a prop with an unknown prefab', /does not exist/.test(await t.status()), await t.status());
  check('and writes nothing', statSync(join(levels, 'mossbottom.level.json')).mtimeMs === before);
  await t.key('z', ['Control']); await t.key('z', ['Control']); await sleep(300);

  console.log('terrain brush and save');
  const deltasBefore = readJson(join(levels, 'world.deltas.json'));
  await t.click('Brush');
  const p0 = await t.ev(([x, y]) => window.editor.viewport.pick({ clientX: x, clientY: y }), [cx, cy]);
  const h0 = await t.ev((p) => window.editor.terrain.heightAt(p.x, p.z), p0);
  await t.page.mouse.move(cx - 30, cy); await t.page.mouse.down();
  for (let i = 1; i <= 6; i++) await t.page.mouse.move(cx - 30 + i * 10, cy);
  await t.page.mouse.up(); await sleep(400);
  const h1 = await t.ev((p) => window.editor.terrain.heightAt(p.x, p.z), p0);
  check('the brush raised the ground', h1 > h0 + 0.05, `${h0} -> ${h1}`);
  await t.click('Save'); await sleep(1500);
  check('Save reports success for the terrain', /^Saved/.test(await t.status()), await t.status());
  const deltasAfter = readJson(join(levels, 'world.deltas.json'));
  check('the deltas file is valid and changed', deltasAfter.format === 'lawn-deltas' && JSON.stringify(deltasAfter) !== JSON.stringify(deltasBefore));
  check('the stroke is in the file', Object.keys(deltasAfter.chunks).length >= Object.keys(deltasBefore.chunks).length);

  console.log('re-bake');
  const bakeBefore = readFileSync(join(levels, 'walk.bake.json'), 'utf8');
  await t.click('Analyze');
  check('the editor knows a re-bake is due', await t.ev(() => window.editor.dirty.walkRects.length > 0));
  await t.click('Re-bake walkability and save'); await sleep(9000);
  const bake = readJson(join(levels, 'walk.bake.json'));
  check('the bake file is valid with 7 tiles', bake.format === 'lawn-walk' && bake.tiles.length === 7, `${bake.format} ${bake.tiles?.length}`);
  check('the bake changed (the terrain edit is in it)', readFileSync(join(levels, 'walk.bake.json'), 'utf8') !== bakeBefore);

  console.log('select shortcuts, snap, fixed items');
  await t.click('Select');
  const zoneState = () => t.ev(() => { const d = window.editor.zones.mossbottom; return { houses: d.houses.map((h) => ({ ...h })), spawn: { ...d.spawn }, exit0: { ...d.exits[0] } }; });
  const base = await zoneState();
  await t.ev(() => window.editor.select({ collection: 'houses', index: 0 }));
  await t.key('d', ['Control']);
  let st = await zoneState();
  check('Ctrl+D duplicates the selected house with a new id', st.houses.length === 6 && st.houses[5].style === base.houses[0].style && /^house-/.test(st.houses[5].id ?? ''), JSON.stringify(st.houses[5]));
  check('and selects the copy', (await t.ev(() => window.editor.selection)).index === 5);
  await t.key('ArrowRight');
  st = await zoneState();
  check('an arrow key nudges the selection by half a metre', Math.abs(st.houses[5].x - (base.houses[0].x + 2 + 0.5)) < 1e-6, `${st.houses[5].x} vs ${base.houses[0].x}`);
  await t.key('e');
  st = await zoneState();
  check('E rotates the house by 15 degrees', Math.abs(st.houses[5].yaw - (base.houses[0].yaw + Math.PI / 12)) < 0.02, String(st.houses[5].yaw));
  for (let i = 0; i < 3; i++) await t.key('z', ['Control']);
  st = await zoneState();
  check('three undos put everything back', st.houses.length === 5 && JSON.stringify(st.houses) === JSON.stringify(base.houses));

  await t.ev(() => { const s = document.getElementById('le-snap'); s.value = '2'; s.dispatchEvent(new Event('change', { bubbles: true })); });
  await t.click('Add House'); await t.page.mouse.click(cx + 60, cy + 90); await sleep(500);
  const snapped = (await zoneState()).houses[5];
  check('with snap on a placed house lands on the grid', snapped.x % 2 === 0 && snapped.z % 2 === 0, `${snapped.x}, ${snapped.z}`);
  await t.key('z', ['Control']);
  await t.ev(() => { const s = document.getElementById('le-snap'); s.value = '0'; s.dispatchEvent(new Event('change', { bubbles: true })); });

  await t.ev(() => window.editor.select({ collection: 'spawn', index: 0 }));
  await t.key('ArrowDown');
  st = await zoneState();
  check('the spawn point can be nudged', Math.abs(st.spawn.z - (base.spawn.z + 0.5)) < 1e-6);
  check('and has no Delete or Duplicate button', await t.ev(() => ![...document.querySelectorAll('#le-panel .le-panel:not([hidden]) button')].some((b) => /^Delete|^Duplicate/.test(b.textContent))));
  await t.ev(() => window.editor.select({ collection: 'exits', index: 0 }));
  await t.key('ArrowRight');
  st = await zoneState();
  check('an exit can be nudged', Math.abs(st.exit0.x - (base.exit0.x + 0.5)) < 1e-6);
  await t.click('Save'); await sleep(1500);
  check('Save reports success for spawn and exit edits', /^Saved/.test(await t.status()), await t.status());
  const origDoc = JSON.parse(original);
  const doc2 = readJson(join(levels, 'mossbottom.level.json'));
  check('the saved zone has the moved spawn and exit', Math.abs(doc2.data.spawn.z - (origDoc.data.spawn.z + 0.5)) < 1e-6 && Math.abs(doc2.data.exits[0].x - (origDoc.data.exits[0].x + 0.5)) < 1e-6);
  check('the other exits and every house are unchanged', JSON.stringify(doc2.data.exits.slice(1)) === JSON.stringify(origDoc.data.exits.slice(1)) && JSON.stringify(doc2.data.houses) === JSON.stringify(origDoc.data.houses));
  check('moving an exit left the other zone file alone', readFileSync(join(levels, 'thatchford.level.json'), 'utf8') === readFileSync(join(repoLevels, 'thatchford.level.json'), 'utf8'));
  await t.key('z', ['Control']); await t.key('z', ['Control']);
  await t.click('Save'); await sleep(1500);
  check('undo then Save restores the original zone file byte for byte', readFileSync(join(levels, 'mossbottom.level.json'), 'utf8') === original);

  console.log('noise brush, layers and readout');
  await t.click('Brush'); await t.click('Noise');
  const nBefore = await t.ev(() => { const g = window.editor.deltas; let pos = 0, neg = 0; for (let x = -60; x < 60; x++) for (let z = 10; z < 60; z++) { const u = g.getUnits(x, z); if (u > 0) pos++; if (u < 0) neg++; } return { pos, neg }; });
  await t.page.mouse.move(cx - 20, cy + 40); await t.page.mouse.down();
  for (let i = 1; i <= 5; i++) await t.page.mouse.move(cx - 20 + i * 12, cy + 40);
  await t.page.mouse.up(); await sleep(400);
  const nAfter = await t.ev(() => { const g = window.editor.deltas; let pos = 0, neg = 0; for (let x = -60; x < 60; x++) for (let z = 10; z < 60; z++) { const u = g.getUnits(x, z); if (u > 0) pos++; if (u < 0) neg++; } return { pos, neg }; });
  check('the noise brush bumps the ground both up and down', nAfter.pos > nBefore.pos && nAfter.neg > nBefore.neg, JSON.stringify({ nBefore, nAfter }));
  await t.key('z', ['Control']);

  await t.click('View');
  const vis = (name) => t.ev((n) => { const o = window.editor.viewport.scene.getObjectByName(n); return o ? o.visible : null; }, name);
  check('water, objects and rings start visible', (await vis('water')) === true && (await vis('object-view')) === true && (await vis('entity-view')) === true);
  await t.ev(() => { const b = [...document.querySelectorAll('#le-panel .le-panel:not([hidden]) input[type=checkbox]')].find((i) => /Water/.test(i.parentElement.textContent)); b.click(); });
  check('the Water checkbox hides the water', (await vis('water')) === false);
  await t.ev(() => { const b = [...document.querySelectorAll('#le-panel .le-panel:not([hidden]) input[type=checkbox]')].find((i) => /Water/.test(i.parentElement.textContent)); b.click(); });
  await t.page.mouse.move(cx, cy + 10); await t.page.mouse.move(cx + 4, cy + 12); await sleep(400);
  check('hovering shows x, z, height and the region', /^x -?[\d.]+\s+z -?[\d.]+\s+y -?[\d.]+/.test(await t.ev(() => document.getElementById('le-readout').textContent)), await t.ev(() => document.getElementById('le-readout').textContent));

  console.log('draft recovery');
  t.page.on('dialog', (d) => d.accept());
  await t.click('Select'); await t.click('Add House'); await t.page.mouse.click(cx + 100, cy + 70); await sleep(900);
  check('an unsaved edit exists', (await houses()) === 6 && await t.ev(() => window.editor.dirty.zones.size === 1));
  await t.page.reload({ waitUntil: 'load' });
  await t.page.waitForFunction(() => window.editor && document.querySelector('#le-view canvas'), { timeout: 60000 });
  await sleep(2500);
  check('after a reload the edit is back', (await houses()) === 6);
  check('with a banner that says so', await t.ev(() => !!document.getElementById('le-banner') && /Recovered unsaved edits/.test(document.getElementById('le-banner').textContent)));
  check('and the zone is marked unsaved again', await t.ev(() => window.editor.dirty.zones.has('mossbottom')));
  await t.click('Discard them'); await sleep(3500);
  await t.page.waitForFunction(() => window.editor && document.querySelector('#le-view canvas'), { timeout: 60000 });
  check('Discard throws the recovered edit away', (await houses()) === 5 && await t.ev(() => !document.getElementById('le-banner')));

  check('no console errors during the whole run', errors.length === 0, errors.slice(0, 3).join(' | '));
} catch (e) {
  failures.push('crashed');
  console.log('  CRASH ' + (e instanceof Error ? e.stack : String(e)));
} finally {
  try { await browser?.close(); } catch {}
  try { await server?.close(); } catch {}
  rmSync(tmp, { recursive: true, force: true });
}
console.log(`\n${passed} passed, ${failures.length} failed${failures.length ? ': ' + failures.join('; ') : ''}`);
process.exit(failures.length ? 1 : 0);
