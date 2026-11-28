// Gnome Theft Auto touch check (R1 FX03): loads the game per spec (URL query, viewport, touch emulation on or off), saves a
// PNG and lists the visible buttons and every pair whose rects overlap. Exit code 1 when any spec has an overlap.
//
//   node tools/gta-touch-check.mjs <out-dir> "<name>|<query>|<WxH>|<touch 0|1>|<wait s>[|<js to eval>]" ...
//   e.g. "courtP|court=game&at=-90,40,3.14|390x844|1|12"   (URL=http://localhost:5198/ by default; dev server running)
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
const base = process.env.URL ?? 'http://localhost:5198/';
const [outDir, ...specs] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const exe = [process.env.DEMO_BROWSER, 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find((p) => fs.existsSync(p));
if (!exe) { console.error('gta-touch-check: no Chrome or Edge found; set DEMO_BROWSER'); process.exit(2); }
let bad = 0;
const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', protocolTimeout: 300_000, args: ['--ignore-gpu-blocklist', '--use-angle=default'] });
try {
  for (const spec of specs) {
    const [name, query, size, touch, waitS, js] = spec.split('|');
    const [w, h] = (size || '960x600').split('x').map(Number);
    const page = await browser.newPage();
    const isTouch = touch === '1';
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, hasTouch: isTouch, isMobile: isTouch });
    if (isTouch) {
      const cdp = await page.target().createCDPSession();
      await cdp.send('Emulation.setEmitTouchEventsForMouse', { enabled: true, configuration: 'mobile' });
    }
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(`${base}?offline&no-intro&debug${query ? '&' + query : ''}`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__gta?.player, { timeout: 120_000 }).catch(() => errors.push('no start'));
    if (isTouch) await page.touchscreen.tap(5, h - 5).catch(() => {});
    await new Promise((r) => setTimeout(r, Number(waitS || 8) * 1000));
    if (js) { try { console.log(name, 'eval:', JSON.stringify(await page.evaluate(js))); } catch (e) { console.log(name, 'eval error', String(e)); } await new Promise((r) => setTimeout(r, 2500)); }
    const overlaps = await page.evaluate(() => {
      const vis = [...document.querySelectorAll('button')].filter((b) => {
        if (b.id === 'gta-trainer-fab') return false; // ?debug only
        const r = b.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return false;
        let e = b;
        while (e) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false; e = e.parentElement; }
        return r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight;
      });
      const out = [];
      for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) {
        const a = vis[i].getBoundingClientRect(); const b = vis[j].getBoundingClientRect();
        if (vis[i].contains(vis[j]) || vis[j].contains(vis[i])) continue;
        if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) out.push(`${vis[i].textContent.trim().slice(0, 14)} x ${vis[j].textContent.trim().slice(0, 14)}`);
      }
      return { buttons: vis.map((b) => b.textContent.trim().slice(0, 12)), overlaps: out };
    });
    if (overlaps.overlaps.length) bad++;
    const file = path.join(outDir, `${name}.png`);
    await page.screenshot({ path: file });
    console.log(`${name}: ${file}\n  buttons: ${overlaps.buttons.join(' / ')}\n  overlaps: ${overlaps.overlaps.join('; ') || 'none'}${errors.length ? `\n  errors: ${errors.slice(0, 3).join(' | ')}` : ''}`);
    await page.close();
  }
} finally { await browser.close(); }
process.exit(bad ? 1 : 0);
