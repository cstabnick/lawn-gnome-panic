// Gnome Theft Auto screenshot pass: loads the game once per spot with the player on foot at (x, z) facing yaw and saves
// a PNG. For the environmental-storytelling AC (e) screenshot passes. The dev server must be running.
//
//   node tools/gta-shots.mjs <url> <out-dir> <name>:<x>,<z>,<yaw> [<name>:<x>,<z>,<yaw> ...] [--size 960x600] [--wait 6]
//
// yaw: three.js rotation.y the player and camera face (0 = +z / south, Math.PI = north, Math.PI / 2 = east).
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const url = args[0];
const outDir = args[1];
if (!url || !outDir) {
  console.error('usage: node tools/gta-shots.mjs <url> <out-dir> <name>:<x>,<z>,<yaw> ...');
  process.exit(2);
}
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const [w, h] = opt('--size', '960x600').split('x').map(Number);
const wait = Number(opt('--wait', '6')) * 1000;
const spots = args.slice(2).filter((a) => /^[\w-]+:/.test(a)).map((a) => {
  const [name, rest] = a.split(':');
  const [x, z, yaw] = rest.split(',').map(Number);
  return { name, x, z, yaw: yaw ?? 0 };
});

const exe = [
  process.env.DEMO_BROWSER,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean).find((p) => fs.existsSync(p));
if (!exe) {
  console.error('gta-shots: no Chrome or Edge found; set DEMO_BROWSER');
  process.exit(2);
}
fs.mkdirSync(outDir, { recursive: true });
const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', protocolTimeout: 300_000, args: ['--ignore-gpu-blocklist', '--use-angle=default'] });
let failed = 0;
try {
  for (const s of spots) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    const sep = url.includes('?') ? '&' : '?';
    await page.goto(`${url}${sep}offline&no-intro&debug&at=${s.x},${s.z},${s.yaw}`, { waitUntil: 'load' });
    const ok = await page.waitForFunction(() => window.__gta?.player, { timeout: 120_000 }).then(() => true).catch(() => false);
    if (!ok) { console.error(`${s.name}: game did not start ${errors.slice(0, 3).join(' | ')}`); failed++; await page.close(); continue; }
    await new Promise((r) => setTimeout(r, wait));
    const file = path.join(outDir, `${s.name}.png`);
    await page.screenshot({ path: file });
    console.log(`${s.name}: ${file}${errors.length ? `  (page errors: ${errors.slice(0, 2).join(' | ')})` : ''}`);
    await page.close();
  }
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
