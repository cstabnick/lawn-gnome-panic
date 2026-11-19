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
const repoClubLevels = resolve(toolDir, '../../games/club-gnome/src/data/levels');
const repoFrontLevels = resolve(toolDir, '../../games/gnome-front/src/data/levels');
const repoGolfLevels = resolve(toolDir, '../../games/gnome-golf/src/data/levels');

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
const clubLevels = join(tmp, 'club-levels');
cpSync(repoClubLevels, clubLevels, { recursive: true });
const frontLevels = join(tmp, 'front-levels');
cpSync(repoFrontLevels, frontLevels, { recursive: true });
const golfLevels = join(tmp, 'golf-levels');
cpSync(repoGolfLevels, golfLevels, { recursive: true });
process.env.LEVEL_EDITOR_LEVELS_DIR = levels;
process.env.LEVEL_EDITOR_GOLF_LEVELS_DIR = golfLevels;
process.env.LEVEL_EDITOR_FRONT_LEVELS_DIR = frontLevels;
process.env.LEVEL_EDITOR_CLUB_LEVELS_DIR = clubLevels;

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
  async function openPage(search = '') {
    const page = await browser.newPage();
    page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
    // Leaving with unsaved edits asks first (by design): accept it on every page.
    page.on('dialog', (d) => d.accept());
    await page.goto(url + search, { waitUntil: 'load', timeout: 60000 });
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
  check('editor boots with 7 zones and 6 tools', boot.zones === 7 && boot.tools.join() === 'View,Brush,Paint,Select,Road,Analyze', JSON.stringify(boot));
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

  console.log('ground paint');
  await t.click('Paint');
  const surf = await t.ev(() => [...document.querySelectorAll('#le-panel .le-panel:not([hidden]) button[data-surface]')].map((b) => b.textContent));
  check('the Paint tab offers the five surfaces and Erase', surf.join() === 'Dirt,Sand,Mud,Stone,Moss,Erase', surf.join());
  await t.click('Mud');
  const ptBefore = await t.ev(([x, y]) => { const h = window.editor.viewport.pick({ clientX: x, clientY: y }); return { h, colour: window.editor.terrain.groundColourAt(h.x, h.z) }; }, [cx - 50, cy + 20]);
  await t.page.mouse.move(cx - 70, cy + 20); await t.page.mouse.down();
  for (let i = 1; i <= 5; i++) await t.page.mouse.move(cx - 70 + i * 12, cy + 20);
  await t.page.mouse.up(); await sleep(500);
  const ptAfter = await t.ev((h) => ({ colour: window.editor.terrain.groundColourAt(h.x, h.z), dirty: window.editor.dirty.paint, empty: window.editor.paint.isEmpty() }), ptBefore.h);
  check('painting colours the ground with the mud surface', ptAfter.colour === 0x6b5038 && ptBefore.colour !== 0x6b5038, `${ptBefore.colour} -> ${ptAfter.colour}`);
  check('and marks paint unsaved', ptAfter.dirty && !ptAfter.empty);
  await t.key('z', ['Control']);
  check('undo takes the paint away again', await t.ev((h) => window.editor.terrain.groundColourAt(h.x, h.z), ptBefore.h) === ptBefore.colour);
  await t.key('z', ['Control', 'Shift']);
  check('redo puts it back', await t.ev((h) => window.editor.terrain.groundColourAt(h.x, h.z), ptBefore.h) === 0x6b5038);
  await t.click('Save'); await sleep(1500);
  check('Save writes the paint file', /^Saved/.test(await t.status()) && readJson(join(levels, 'world.paint.json')).format === 'lawn-paint' && Object.keys(readJson(join(levels, 'world.paint.json')).chunks).length >= 1, await t.status());
  check('and clears the paint mark', await t.ev(() => !window.editor.dirty.paint));

  console.log('roads mode and prefab footprint');
  await t.click('Road');
  const roads0 = await t.ev(() => ({ n: window.editor.terrain.roadSegments().length, mode: window.editor.zones.mossbottom.roadMode ?? 'derived' }));
  await t.click('Turn the derived roads into paths'); await sleep(500);
  const roads1 = await t.ev(() => ({ n: window.editor.terrain.roadSegments().length, mode: window.editor.zones.mossbottom.roadMode, paths: window.editor.zones.mossbottom.paths.length }));
  check('converting derived roads keeps every road exactly', roads1.mode === 'authored' && roads1.n === roads0.n && roads1.paths > 5, JSON.stringify({ roads0, roads1 }));
  await t.click('Save'); await sleep(1500);
  const roadDoc = readJson(join(levels, 'mossbottom.level.json'));
  check('the saved zone records authored roads and their paths', roadDoc.data.roadMode === 'authored' && roadDoc.paths.length === roads1.paths && roadDoc.paths.every((p) => p.kind === 'road'));
  await t.key('z', ['Control']);
  await t.click('Save'); await sleep(1500);
  check('undo and Save restores the zone file byte for byte', readFileSync(join(levels, 'mossbottom.level.json'), 'utf8') === original);

  await t.click('Select'); await t.click('Add Prop'); await t.page.mouse.click(cx - 100, cy + 80); await sleep(500);
  check('a new prop gets its prefab\'s solid radius', await t.ev(() => window.editor.zones.mossbottom.props.at(-1).solidR) === 0.35);
  await t.ev(() => { const i = document.querySelector('.le-prefab-row input'); i.value = 'stone-fountain'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); });
  await sleep(400);
  check('changing the prefab follows the new footprint', await t.ev(() => window.editor.zones.mossbottom.props.at(-1).solidR) === 1.25);
  await t.key('z', ['Control']); await t.key('z', ['Control']); await sleep(300);

  console.log('club gnome');
  const clubOrig = readFileSync(join(clubLevels, 'town.level.json'), 'utf8');
  const origTown = JSON.parse(clubOrig);
  t = await openPage('?game=club-gnome&level=town');
  const cb = await t.ev(() => ({ game: window.editor.adapter.id, zone: window.editor.zone, zones: Object.keys(window.editor.zones), tools: [...document.querySelectorAll('#le-tools button')].map((b) => b.textContent), objects: window.editor.viewport.scene.getObjectByName('object-view')?.children[0].children.length }));
  check('Club Gnome opens one map with only View and Select', cb.game === 'club-gnome' && cb.zone === 'town' && cb.zones.join() === 'town' && cb.tools.join() === 'View,Select', JSON.stringify(cb));
  check('and draws its buildings, props and patches', cb.objects > 30, String(cb.objects));
  const box2 = await t.box();
  const ccx = box2.x + box2.w / 2, ccy = box2.y + box2.h * 0.62;
  await t.click('Select');
  await t.ev(() => window.editor.select({ collection: 'portals', index: 0 }));
  await t.key('ArrowRight');
  await t.click('Save'); await sleep(1500);
  check('Club Gnome saves into its own folder', /^Saved/.test(await t.status()) && /club-levels/.test(await t.status()), await t.status());
  const town2 = readJson(join(clubLevels, 'town.level.json'));
  const portalMarker = (d) => d.markers.find((m) => m.kind === 'portal');
  check('the nudged portal moved by half a metre', Math.abs(portalMarker(town2).x - (portalMarker(origTown).x + 0.5)) < 1e-6);
  const stripPortal = (d) => JSON.stringify({ ...d, markers: d.markers.filter((m) => m.kind !== 'portal' || m.id !== portalMarker(origTown).id) });
  check('nothing else on the map changed', stripPortal(town2) === stripPortal(origTown));
  await t.key('z', ['Control']);
  await t.click('Save'); await sleep(1500);
  check('undo then Save restores the map file byte for byte', readFileSync(join(clubLevels, 'town.level.json'), 'utf8') === clubOrig);
  check('the Gnomomia files were not touched by a Club Gnome save', readFileSync(join(levels, 'thatchford.level.json'), 'utf8') === readFileSync(join(repoLevels, 'thatchford.level.json'), 'utf8'));

  await t.click('Add Building'); await t.page.mouse.click(ccx + 40, ccy + 60); await sleep(500);
  await t.click('Save'); await sleep(1500);
  const town3 = readJson(join(clubLevels, 'town.level.json'));
  const nb = town3.data.buildings.at(-1);
  check('a new building is saved with an id and #rrggbb colours', town3.data.buildings.length === origTown.data.buildings.length + 1 && /^building-/.test(nb.id) && /^#[0-9a-f]{6}$/.test(nb.color) && /^#[0-9a-f]{6}$/.test(nb.roof), JSON.stringify(nb));
  await t.key('z', ['Control']);

  await t.ev(() => window.editor.editZone('Break a portal', 'town', (d) => { d.portals[0].to = 'nowhere'; }));
  const bt = statSync(join(clubLevels, 'town.level.json')).mtimeMs;
  await t.click('Save'); await sleep(1200);
  check('Save refuses a portal that goes to a map that does not exist', /is not a map/.test(await t.status()), await t.status());
  check('and writes nothing', statSync(join(clubLevels, 'town.level.json')).mtimeMs === bt);
  await t.key('z', ['Control']);

  await t.ev(() => { const s = document.getElementById('le-zone'); s.value = 'arcade'; s.dispatchEvent(new Event('change', { bubbles: true })); });
  await t.page.waitForFunction(() => window.editor && window.editor.zone === 'arcade', { timeout: 30000 });
  await sleep(1500);
  check('the map selector opens another map', await t.ev(() => window.editor.zone === 'arcade' && Object.keys(window.editor.zones).join() === 'arcade'));
  await t.ev(() => { const s = document.getElementById('le-game'); s.value = 'gnomomia'; s.dispatchEvent(new Event('change', { bubbles: true })); });
  await t.page.waitForFunction(() => window.editor && window.editor.adapter.id === 'gnomomia', { timeout: 30000 });
  check('the game selector goes back to Gnomomia', await t.ev(() => window.editor.outdoorZones.length === 7));

  console.log('gnome front');
  const frontOrig = readFileSync(join(frontLevels, 'arena.level.json'), 'utf8');
  const fo = JSON.parse(frontOrig);
  t = await openPage('?game=gnome-front');
  const fr = await t.ev(() => ({ game: window.editor.adapter.id, zone: window.editor.zone, tools: [...document.querySelectorAll('#le-tools button')].map((b) => b.textContent), objects: window.editor.viewport.scene.getObjectByName('object-view')?.children[0].children.length }));
  check('Gnome Front opens its arena with View, Select and Cover', fr.game === 'gnome-front' && fr.zone === 'arena' && fr.tools.join() === 'View,Select,Cover', JSON.stringify(fr));
  check('and builds the landmarks, cover and collision circles', fr.objects > 150, String(fr.objects));
  const fb = await t.box();
  const fx = fb.x + fb.w / 2, fy = fb.y + fb.h * 0.62;
  await t.click('Select');
  const flagA = () => t.ev(() => ({ f: { ...window.editor.zones.arena.flags[0] }, lm: window.editor.zones.arena.landmarks.filter((l) => l.at === 'A').map((l) => ({ x: l.x, z: l.z })) }));
  const a0 = await flagA();
  await t.ev(() => window.editor.select({ collection: 'flags', index: 0 }));
  await t.key('ArrowRight');
  const a1 = await flagA();
  check('nudging flag A moves it half a metre', Math.abs(a1.f.x - (a0.f.x + 0.5)) < 1e-6);
  check('and its landmark follows it', a1.lm.length >= 1 && Math.abs(a1.lm[0].x - (a0.lm[0].x + 0.5)) < 1e-6);
  await t.click('Save'); await sleep(1500);
  check('Save writes the arena into the Gnome Front folder', /^Saved/.test(await t.status()) && /front-levels/.test(await t.status()), await t.status());
  const fd = readJson(join(frontLevels, 'arena.level.json'));
  const flagM = (d, id) => d.markers.find((m) => m.kind === 'flag' && m.id === id);
  check('the saved flag moved, and its landmark kept its place relative to it', Math.abs(flagM(fd, 'A').x - (flagM(fo, 'A').x + 0.5)) < 1e-6 && JSON.stringify(fd.data.landmarks.filter((l) => l.at === 'A')) === JSON.stringify(fo.data.landmarks.filter((l) => l.at === 'A')));
  check('the other four flags and every mound are unchanged', ['B', 'C', 'D', 'E'].every((id) => JSON.stringify(flagM(fd, id)) === JSON.stringify(flagM(fo, id))) && JSON.stringify(fd.data.mounds) === JSON.stringify(fo.data.mounds));
  await t.key('z', ['Control']);
  await t.click('Save'); await sleep(1500);
  check('undo then Save restores the arena file byte for byte', readFileSync(join(frontLevels, 'arena.level.json'), 'utf8') === frontOrig);

  const mounds0 = fo.data.mounds.length;
  // A spot in the open (the ground is flattened near the fence, the bases and the flags, where a mound would do nothing).
  const spot = await t.ev(() => {
    const e = window.editor; const cam = e.viewport.camera;
    const w = { x: 40, z: -20 };
    const v = new cam.position.constructor(w.x, e.terrain.heightAt(w.x, w.z), w.z).project(cam);
    const r = document.querySelector('#le-view canvas').getBoundingClientRect();
    return { w, y0: e.terrain.heightAt(w.x, w.z), sx: r.x + (v.x + 1) / 2 * r.width, sy: r.y + (1 - v.y) / 2 * r.height };
  });
  await t.click('Add Mound'); await t.page.mouse.click(spot.sx, spot.sy); await sleep(600);
  const y1 = await t.ev((w) => window.editor.terrain.heightAt(w.x, w.z), spot.w);
  check('adding a mound raises the ground there', y1 > spot.y0 + 0.5, `${spot.y0} -> ${y1}`);
  await t.click('Save'); await sleep(1500);
  const fm = readJson(join(frontLevels, 'arena.level.json'));
  check('the saved arena has the new mound', fm.data.mounds.length === mounds0 + 1 && fm.data.mounds.at(-1).h === 5, JSON.stringify(fm.data.mounds.at(-1)));
  await t.key('z', ['Control']);

  const objs0 = await t.ev(() => window.editor.viewport.scene.getObjectByName('object-view').children[0].children.length);
  await t.click('Cover');
  const set = await t.ev(() => { const inputs = [...document.querySelectorAll('#le-panel .le-panel:not([hidden]) .le-card')][0].querySelectorAll('input[type=number]'); const count = inputs[0]; count.value = '10'; count.dispatchEvent(new Event('change', { bubbles: true })); return window.editor.zones.arena.cover.layers[0].count; });
  await sleep(700);
  const objs1 = await t.ev(() => window.editor.viewport.scene.getObjectByName('object-view').children[0].children.length);
  check('lowering a cover layer\'s count rebuilds the cover with fewer objects', set === 10 && objs1 < objs0 - 40, `${objs0} -> ${objs1}, count ${set}`);
  await t.click('Save'); await sleep(1500);
  check('the saved arena has the new cover count and nothing else changed in the layer', readJson(join(frontLevels, 'arena.level.json')).data.cover.layers[0].count === 10 && readJson(join(frontLevels, 'arena.level.json')).data.cover.layers[1].count === fo.data.cover.layers[1].count);
  await t.key('z', ['Control']);

  await t.ev(() => window.editor.editZone('Break a landmark', 'arena', (d) => { d.landmarks[0].prefab = 'no-such-prefab'; }));
  const ft = statSync(join(frontLevels, 'arena.level.json')).mtimeMs;
  await t.click('Save'); await sleep(1200);
  check('Save refuses a landmark whose prefab does not exist', /does not exist/.test(await t.status()), await t.status());
  check('and writes nothing', statSync(join(frontLevels, 'arena.level.json')).mtimeMs === ft);
  await t.key('z', ['Control']);
  await t.click('Save'); await sleep(1500);
  check('after undoing everything the saved arena is the original, byte for byte', readFileSync(join(frontLevels, 'arena.level.json'), 'utf8') === frontOrig);

  console.log('gnome golf');
  const golfOrig = readFileSync(join(golfLevels, 'island.level.json'), 'utf8');
  const go = JSON.parse(golfOrig);
  t = await openPage('?game=gnome-golf');
  const gf = await t.ev(() => ({ game: window.editor.adapter.id, zone: window.editor.zone, tools: [...document.querySelectorAll('#le-tools button')].map((b) => b.textContent), objects: window.editor.viewport.scene.getObjectByName('object-view')?.children[0].children.length }));
  check('Gnome Golf opens its island with View, Select and Island', gf.game === 'gnome-golf' && gf.zone === 'island' && gf.tools.join() === 'View,Select,Island', JSON.stringify(gf));
  check('and marks every hole (tee, number, fairway line, flag)', gf.objects >= 9 * 5, String(gf.objects));
  await t.click('Select');
  await t.ev(() => window.editor.select({ collection: 'pins', index: 0 }));
  await t.key('ArrowRight');
  await t.ev(() => window.editor.select({ collection: 'greens', index: 1 }));
  await t.key('ArrowDown');
  await t.click('Save'); await sleep(1500);
  check('Save writes the island into the Gnome Golf folder', /^Saved/.test(await t.status()) && /golf-levels/.test(await t.status()), await t.status());
  const g2 = readJson(join(golfLevels, 'island.level.json'));
  check('the moved pin is saved, in the hole and in its marker', Math.abs(g2.data.holes[0].pin.x - (go.data.holes[0].pin.x + 0.5)) < 1e-6 && Math.abs(g2.markers.find((m) => m.id === 'pin-1').x - (go.markers.find((m) => m.id === 'pin-1').x + 0.5)) < 1e-6);
  check('moving a green moves the end of its fairway with it', Math.abs(g2.data.holes[1].green.z - (go.data.holes[1].green.z + 0.5)) < 1e-6 && Math.abs(g2.data.holes[1].path.at(-1).z - (go.data.holes[1].path.at(-1).z + 0.5)) < 1e-6);
  check('every other hole is unchanged', [2, 3, 4, 5, 6, 7, 8].every((k) => JSON.stringify(g2.data.holes[k]) === JSON.stringify(go.data.holes[k])));
  await t.key('z', ['Control']); await t.key('z', ['Control']);
  await t.click('Save'); await sleep(1500);
  check('undo then Save restores the island file byte for byte', readFileSync(join(golfLevels, 'island.level.json'), 'utf8') === golfOrig);

  const bunkers0 = go.data.holes[1].bunkers.length;
  const gs = await t.ev(() => {
    const e = window.editor; const cam = e.viewport.camera;
    const w = { x: 130, z: -10 };
    const v = new cam.position.constructor(w.x, e.terrain.heightAt(w.x, w.z), w.z).project(cam);
    const r = document.querySelector('#le-view canvas').getBoundingClientRect();
    return { sx: r.x + (v.x + 1) / 2 * r.width, sy: r.y + (1 - v.y) / 2 * r.height };
  });
  await t.click('Add Bunker'); await t.page.mouse.click(gs.sx, gs.sy); await sleep(700);
  const nb2 = await t.ev(() => window.editor.zones.island.bunkers.at(-1));
  check('a bunker placed beside hole 2\'s fairway belongs to hole 2', nb2 && nb2.n === 2, JSON.stringify(nb2));
  await t.click('Save'); await sleep(1500);
  check('the saved hole 2 has the new bunker', readJson(join(golfLevels, 'island.level.json')).data.holes[1].bunkers.length === bunkers0 + 1);
  await t.key('z', ['Control']);

  await t.click('Island');
  const lieBefore = await t.ev(() => window.editor.terrain.groundColourAt(0, 0));
  await t.ev(() => { const i = [...document.querySelectorAll('#le-panel .le-panel:not([hidden]) input[type=number]')][2]; i.value = '30'; i.dispatchEvent(new Event('change', { bubbles: true })); });
  await sleep(500);
  await t.click('Save'); await sleep(1500);
  const gi = readJson(join(golfLevels, 'island.level.json'));
  check('editing the island saves the beach width in the base params', gi.base.params.beach === 30 && gi.base.params.rx === go.base.params.rx, JSON.stringify(gi.base.params));
  await t.key('z', ['Control']);

  await t.ev(() => window.editor.editZone('Break a par', 'island', (d) => { d.holes[0].par = 7; }));
  const gt = statSync(join(golfLevels, 'island.level.json')).mtimeMs;
  await t.click('Save'); await sleep(1200);
  check('Save refuses a par that is not 3, 4 or 5', /par must be/.test(await t.status()), await t.status());
  check('and writes nothing', statSync(join(golfLevels, 'island.level.json')).mtimeMs === gt);
  await t.key('z', ['Control']);
  await t.click('Save'); await sleep(1500);
  check('after undoing everything the saved island is the original, byte for byte', readFileSync(join(golfLevels, 'island.level.json'), 'utf8') === golfOrig);

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
