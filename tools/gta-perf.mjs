// Gnome Theft Auto perf check: drives a mower across every region at a phone viewport (390x844 @2x) in headless
// Edge/Chrome and prints frame times and WebGL draw calls per leg. The dev server must be running.
//
//   npm run dev -w games/gnome-theft-auto          # http://localhost:5198/
//   node tools/gta-perf.mjs [url] [--landscape] [--speed 40]
//
// The mower is moved along the route by script (about `speed` m/s, the game's physics still settles it on the ground),
// so streaming, critter LOD and chunk culling all run as in play. Numbers depend on the machine's GPU: compare runs
// on the same machine, before and after a change.
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const url = args.find((a) => a.startsWith('http')) ?? 'http://localhost:5198/';
const landscape = args.includes('--landscape');
const speedArg = args.indexOf('--speed');
const speed = speedArg >= 0 ? Number(args[speedArg + 1]) : 40;
// --cpu 4: slow the CPU down 4x (Chrome DevTools throttling), roughly a mid-range phone, so CPU-side costs show up
// in frame times even on a fast desktop where every frame otherwise waits for vsync.
const cpuArg = args.indexOf('--cpu');
const cpuRate = cpuArg >= 0 ? Number(args[cpuArg + 1]) : 1;
// --query '&quality=low&cull=0': extra URL parameters for the game (compare settings on the same route).
const queryArg = args.indexOf('--query');
const extraQuery = queryArg >= 0 ? args[queryArg + 1] : '';

// Legs over land (roads where possible), each ending in the region it is named after.
const ROUTE = [
  ['Turfton', [[0, -115], [0, -200]]],
  ['Frostbite Fells', [[0, -200], [0, -400], [-30, -700]]],
  ['Loch Moss', [[-30, -700], [-400, -520], [-720, -480]]],
  ['Mossy Wood', [[-720, -480], [-600, -200], [-520, 60]]],
  ['Tallgrass Commons', [[-520, 60], [-560, 400], [-700, 650]]],
  ['Cloverfield Farms', [[-700, 650], [-200, 560], [300, 600]]],
  ['Dust Flats', [[300, 600], [520, 300], [560, 30]]],
  ['Turfton (back)', [[560, 30], [200, 0], [60, -60]]],
];

const BROWSERS = [
  process.env.DEMO_BROWSER,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const exe = BROWSERS.find((p) => fs.existsSync(p));
if (!exe) {
  console.error('gta-perf: no Chrome or Edge found; set DEMO_BROWSER to its executable path');
  process.exit(2);
}

const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', protocolTimeout: 900_000, args: ['--ignore-gpu-blocklist', '--use-angle=default'] });
const page = await browser.newPage();
await page.setViewport({ width: landscape ? 844 : 390, height: landscape ? 390 : 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errors = [];
if (cpuRate > 1) await (await page.createCDPSession()).send('Emulation.setCPUThrottlingRate', { rate: cpuRate });
page.on('pageerror', (e) => errors.push(e.stack ?? String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
// Count draw calls per animation frame and record frame times.
await page.evaluateOnNewDocument(() => {
  const w = window;
  w.__perf = { calls: 0, frames: [] };
  for (const C of [window.WebGL2RenderingContext, window.WebGLRenderingContext]) {
    if (!C) continue;
    for (const fn of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
      const orig = C.prototype[fn];
      if (orig) C.prototype[fn] = function (...a) { w.__perf.calls++; return orig.apply(this, a); };
    }
  }
  let last = 0;
  const tick = (t) => {
    const info = w.__gta?.renderer?.info?.render;
    if (last) w.__perf.frames.push([t - last, w.__perf.calls, w.__perf.leg ?? '', info ? info.triangles : 0]);
    last = t;
    w.__perf.calls = 0;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

const t0 = Date.now();
const [sx, sz] = ROUTE[0][1][0];
await page.goto(`${url}?offline&no-intro&debug&drive=arcade&mount=zero-turn&mountat=${sx},${sz},3.14&profile=50${extraQuery}`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__gta?.player?.vehicle, { timeout: 90000 });
const loadS = (Date.now() - t0) / 1000;
await new Promise((r) => setTimeout(r, 2000));

// Drive: the page moves the player's vehicle along the route in its own rAF loop, then reports when done.
await page.evaluate((route, speed) => new Promise((done) => {
  const g = window.__gta;
  window.__perf.census = [];
  // What the scene holds where a leg ends: meshes, how many are drawn, culling switched off, shadow casters.
  const census = () => {
    const sc = g.scene;
    const f = { meshes: 0, visible: 0, noCull: 0, casters: 0, instanced: 0, instances: 0, shadowLights: 0, shadowMap: 0 };
    sc.traverseVisible((o) => {
      if (o.isLight && o.castShadow) { f.shadowLights++; f.shadowMap = Math.max(f.shadowMap, o.shadow.mapSize.x); }
      if (!o.isMesh && !o.isPoints && !o.isLine && !o.isSprite) return;
      f.visible++;
      if (!o.frustumCulled) f.noCull++;
      if (o.castShadow) f.casters++;
      if (o.isInstancedMesh) { f.instanced++; f.instances += o.count; }
    });
    sc.traverse((o) => { if (o.isMesh) f.meshes++; });
    return f;
  };
  const legs = route.map(([name, pts]) => ({ name, pts }));
  let li = 0, pi = 0, last = performance.now();
  // Our own position along the route; written into the mower each frame (or, if the mower is lost, e.g. it sank
  // where the route crosses water, the gnome is moved on foot instead), so the run always reaches the end.
  let [px, pz] = legs[0].pts[0];
  // Once a second: the profiler's live stats (CPU ms per system, from app.ts's frame sections) for this leg.
  window.__perf.live = [];
  let liveAt = 0;
  const step = (t) => {
    if (t - liveAt > 1000) {
      liveAt = t;
      const l = window.__lawnProfile?.live?.();
      if (l) window.__perf.live.push([legs[li]?.name ?? '', l]);
    }
    const dt = Math.min(0.1, (t - last) / 1000);
    last = t;
    const leg = legs[li];
    window.__perf.leg = leg.name;
    const [tx, tz] = leg.pts[pi + 1];
    const dx = tx - px, dz = tz - pz, d = Math.hypot(dx, dz);
    const move = speed * dt;
    const yaw = Math.atan2(dx, dz);
    if (d <= move) {
      px = tx; pz = tz; pi++;
      if (pi + 1 >= leg.pts.length) { try { window.__perf.census.push([leg.name, census()]); } catch { /* ignore */ } pi = 0; li++; }
    } else {
      px += (dx / d) * move; pz += (dz / d) * move;
    }
    try {
      const v = g.player.vehicle;
      if (v) { v.x = px; v.z = pz; v.yaw = yaw; v.speed = speed; v.sunk = false; }
      else g.player.respawn(px, pz, yaw);
    } catch { /* keep going: this is a measurement, not a test of the game */ }
    if (li >= legs.length) { window.__perf.leg = ''; done(); return; }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}), ROUTE, speed);

const frames = await page.evaluate(() => window.__perf.frames);
const census = await page.evaluate(() => window.__perf.census ?? []);
const live = await page.evaluate(() => window.__perf.live ?? []);
const hitches = await page.evaluate(() => (window.__lawnProfile?.reports ?? []).map((r) => [r.kind, r.ms, r.ctx.region ?? '', r.parts.slice(0, 3).map(([n, ms]) => `${n} ${ms}`).join(', ')]));
await browser.close();

const pct = (a, p) => a[Math.min(a.length - 1, Math.floor(a.length * p))];
console.log(`gta-perf: ${landscape ? '844x390' : '390x844'} @2x, ${speed} m/s${cpuRate > 1 ? `, cpu /${cpuRate}` : ''}, load ${loadS.toFixed(1)} s, ${exe}`);
console.log('leg                  frames  avg ms  p50 ms  p95 ms  max ms  >50ms  draw calls avg/max  tris avg (k)');
for (const [name] of ROUTE) {
  const f = frames.filter((x) => x[2] === name);
  if (f.length === 0) continue;
  const ms = f.map((x) => x[0]).sort((a, b) => a - b);
  const calls = f.map((x) => x[1]);
  const avg = ms.reduce((a, b) => a + b, 0) / ms.length;
  console.log(
    `${name.padEnd(20)} ${String(f.length).padStart(6)} ${avg.toFixed(1).padStart(7)} ${pct(ms, 0.5).toFixed(1).padStart(7)} ${pct(ms, 0.95).toFixed(1).padStart(7)} ${ms[ms.length - 1].toFixed(0).padStart(7)} ${String(ms.filter((m) => m > 50).length).padStart(6)}  ${`${Math.round(calls.reduce((a, b) => a + b, 0) / calls.length)}/${Math.max(...calls)}`.padStart(18)}  ${String(Math.round(f.reduce((a, x) => a + (x[3] || 0), 0) / f.length / 1000)).padStart(12)}`,
  );
}
if (census.length) {
  console.log('scene at leg end     meshes  visbl  noCull  casters  instanced(n)  shadow lights/map');
  for (const [name, c] of census) {
    console.log(`${name.padEnd(20)} ${String(c.meshes).padStart(6)} ${String(c.visible).padStart(6)} ${String(c.noCull).padStart(7)} ${String(c.casters).padStart(8)}  ${`${c.instanced}(${c.instances})`.padStart(12)}  ${c.shadowLights}/${c.shadowMap}`);
  }
}
if (live.length) {
  console.log('CPU per leg (profiler)  cpu ms  gpu ms  top systems, ms per frame');
  for (const [name] of ROUTE) {
    const ls = live.filter((x) => x[0] === name).map((x) => x[1]);
    if (!ls.length) continue;
    const sys = new Map();
    for (const l of ls) for (const [k, ms] of l.systems) sys.set(k, (sys.get(k) ?? 0) + ms / ls.length);
    const cpu = ls.reduce((a, l) => a + l.cpuMs, 0) / ls.length;
    const gpu = ls.reduce((a, l) => a + (l.render?.gpuMs ?? 0), 0) / ls.length;
    const top = [...sys].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, ms]) => `${k} ${ms.toFixed(2)}`).join(', ');
    console.log(`${name.padEnd(22)} ${cpu.toFixed(2).padStart(7)} ${gpu ? gpu.toFixed(2).padStart(7) : '      -'}  ${top}`);
  }
}
if (hitches.length) {
  console.log(`hitches over 50 ms reported by the profiler (${hitches.length}; up to 12 shown):`);
  for (const [kind, ms, region, parts] of hitches.slice(0, 12)) console.log(`  ${kind} ${ms} ms [${region}] ${parts}`);
}
const jsonArg = args.indexOf('--json');
if (jsonArg >= 0) fs.writeFileSync(args[jsonArg + 1], JSON.stringify({ frames, census, live }));
if (errors.length) {
  console.log(`page errors (${errors.length}):`);
  for (const e of errors.slice(0, 5)) console.log('  ' + e);
  process.exitCode = 1;
}
