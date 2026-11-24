// Gnome Theft Auto mowable-plants check: drives a zero-turn mower at full throttle straight through a plant that used to
// be a solid collider (a countryside flower bed) and reports whether the mower kept going and the plant was mowed.
// Writes a screenshot of the cut plant. The dev server must be running.
//
//   node tools/gta-mow-check.mjs [url] [--at x,z] [--shot out.png]
//
// Exit code 0 when the mower passed the plant at speed and the plant is cut, 1 otherwise.
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const url = args.find((a) => a.startsWith('http')) ?? 'http://localhost:5198/';
const atArg = args.indexOf('--at');
const [px, pz] = atArg >= 0 ? args[atArg + 1].split(',').map(Number) : [-483.2, 540];
const shotArg = args.indexOf('--shot');
const shot = shotArg >= 0 ? args[shotArg + 1] : 'gta-mow-check.png';
const RUN_UP = 14;

const exe = [
  process.env.DEMO_BROWSER,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean).find((p) => fs.existsSync(p));
if (!exe) {
  console.error('gta-mow-check: no Chrome or Edge found; set DEMO_BROWSER');
  process.exit(2);
}

const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', protocolTimeout: 300_000, args: ['--ignore-gpu-blocklist', '--use-angle=default'] });
let ok = false;
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${url}?offline&no-intro&debug&drive=arcade&mount=zero-turn&mountat=${px},${pz - RUN_UP},0`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__gta?.player?.vehicle && window.__gta?.flora, { timeout: 120_000 }).catch((e) => {
    throw new Error(`game did not start: ${e.message}\n  ${errors.slice(0, 5).join('\n  ')}`);
  });
  await new Promise((r) => setTimeout(r, 1500));
  const plant = await page.evaluate((x, z) => window.__gta.flora.nearest(x, z, 4), px, pz);
  if (!plant) throw new Error(`no mowable plant within 4 m of (${px}, ${pz})`);
  // Line the mower up 14 m short of the plant, facing it, at rest.
  await page.evaluate((p, runUp) => {
    const v = window.__gta.player.vehicle;
    v.x = p.x; v.z = p.z - runUp; v.yaw = 0; v.speed = 0;
  }, plant, RUN_UP);
  await new Promise((r) => setTimeout(r, 500));
  await page.keyboard.down('KeyW');
  const trace = [];
  let shotTaken = false;
  for (let k = 0; k < 30; k++) {
    await new Promise((r) => setTimeout(r, 100));
    trace.push(await page.evaluate(() => { const v = window.__gta.player.vehicle; return [v.z, v.speed]; }));
    // Just past the plant: the stubble and the clippings are in view behind the mower.
    if (!shotTaken && trace[trace.length - 1][0] > plant.z + 2) {
      shotTaken = true;
      await page.screenshot({ path: shot });
    }
  }
  await page.keyboard.up('KeyW');
  const after = await page.evaluate((p) => ({ plant: window.__gta.flora.nearest(p.x, p.z, 1), stats: window.__gta.flora.stats() }), plant);
  if (!shotTaken) await page.screenshot({ path: shot });
  const [endZ, endSpeed] = trace[trace.length - 1];
  const passed = endZ > plant.z + 2;
  const minSpeedAfterPlant = Math.min(...trace.filter(([z]) => z > plant.z - 1).map(([, s]) => s));
  ok = passed && after.plant?.state === 1 && minSpeedAfterPlant > 3;
  console.log(`plant ${plant.id} at (${plant.x.toFixed(1)}, ${plant.z.toFixed(1)}) r ${plant.r.toFixed(2)}`);
  console.log(`mower z ${trace.map(([z]) => z.toFixed(1)).join(' ')}`);
  console.log(`speed   ${trace.map(([, s]) => s.toFixed(1)).join(' ')}`);
  console.log(`passed the plant: ${passed}, lowest speed past it: ${minSpeedAfterPlant.toFixed(1)} m/s, end speed ${endSpeed.toFixed(1)}`);
  console.log(`plant state after: ${after.plant?.state} (1 = cut), mowed by you: ${after.stats.mowed}, cut now: ${after.stats.cut}`);
  console.log(`screenshot: ${shot}`);
  if (errors.length) console.log(`page errors:\n  ${errors.slice(0, 5).join('\n  ')}`);
  console.log(ok ? 'OK: the mower drove through and mowed the plant' : 'FAIL');
} finally {
  await browser.close();
}
process.exit(ok ? 0 : 1);
