#!/usr/bin/env node
// Screenshot pass for Gnome Theft Auto areas (environmental storytelling AC (e)): loads the running dev server in
// headless Edge at each spot and saves a PNG per shot.
//
// Usage: node tools/gta-shots.mjs <base-url> <out-dir> <name>=<x>,<z>,<yaw>[,<extra query>] ...
//   e.g. node tools/gta-shots.mjs "http://localhost:5311/" docs/roadmaps/gta-batch-3/E11/screens \
//          boardwalk=0,1080,0 pier=300,1150,0
// Spots use ?offline&at=x,z,yaw (on foot; yaw 0 faces south, +z). Options: --wait ms (default 9000), --size WxH.
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  if (i < 0) return def;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const wait = Number(opt('wait', '9000'));
const [w, h] = opt('size', '960x600').split('x').map(Number);
const [base, outDir, ...shots] = args;
if (!base || !outDir || shots.length === 0) {
  console.error('usage: node tools/gta-shots.mjs <base-url> <out-dir> name=x,z,yaw[,query] ...');
  process.exit(2);
}
const EDGE = process.env.EDGE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
fs.mkdirSync(outDir, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: EDGE, headless: 'new',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', `--window-size=${w},${h}`],
});
let failed = 0;
for (const s of shots) {
  const [name, spec] = s.split('=');
  const [x, z, yaw, ...rest] = spec.split(',');
  const extra = rest.length ? `&${rest.join(',')}` : '';
  const url = `${base}${base.includes('?') ? '&' : '?'}offline&no-intro&at=${x},${z},${yaw ?? 0}${extra}`;
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await new Promise((r) => setTimeout(r, wait));
    const file = path.join(outDir, `${name}.png`);
    await page.screenshot({ path: file });
    console.log(`${name}: ${file}${errors.length ? `  (page errors: ${errors.join(' | ')})` : ''}`);
    if (errors.length) failed++;
  } catch (e) {
    console.log(`${name}: FAILED ${e}`);
    failed++;
  }
  await page.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
