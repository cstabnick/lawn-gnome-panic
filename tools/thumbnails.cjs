#!/usr/bin/env node
// Takes a 480x270 JPEG thumbnail of each game for the landing page: games/<name>/thumbnail.jpg.
// Starts each game's dev server, loads it in headless Chromium, waits, and screenshots.
// Usage: node tools/thumbnails.cjs [game ...]   (needs Playwright with Chromium installed)
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
/** Per game: URL suffix (hash or query that shows something nice), seconds to wait, optional localStorage. */
const SHOTS = {
  'gnome-golf': { suffix: '', wait: 12 },
  'sample-3d': { suffix: '?autostart=solo', wait: 20 },
  gnaft: { suffix: '', wait: 20 },
  'gnome-front': { suffix: '', wait: 20 },
  'faster-than-lawn': { suffix: '', wait: 8 },
  'sample-dodge': { suffix: '', wait: 6 },
};

function portOf(game) {
  const cfg = fs.readFileSync(path.join(root, 'games', game, 'vite.config.ts'), 'utf8');
  const m = /port:\s*(\d+)/.exec(cfg);
  return m ? Number(m[1]) : 5173;
}

async function waitForServer(url, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try { if ((await fetch(url)).ok) return; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`no server at ${url}`);
}

(async () => {
  const wanted = process.argv.slice(2);
  const games = fs.readdirSync(path.join(root, 'games')).filter((g) => fs.existsSync(path.join(root, 'games', g, 'vite.config.ts')) && (wanted.length === 0 || wanted.includes(g)));
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const game of games) {
    const port = portOf(game);
    const opts = SHOTS[game] ?? { suffix: '', wait: 10 };
    const server = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { cwd: path.join(root, 'games', game), stdio: 'ignore' });
    try {
      const url = `http://localhost:${port}/`;
      await waitForServer(url, 30000);
      const context = await browser.newContext({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 0.5 });
      if (opts.storage) await context.addInitScript((s) => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, opts.storage);
      const page = await context.newPage();
      await page.goto(url + opts.suffix);
      await page.waitForTimeout(opts.wait * 1000);
      const out = path.join(root, 'games', game, 'thumbnail.jpg');
      await page.screenshot({ path: out, type: 'jpeg', quality: 78, timeout: 120000 });
      console.log(`${game}: ${out} (${Math.round(fs.statSync(out).size / 1024)} KB)`);
      await context.close();
    } catch (err) {
      console.error(`${game}: ${err.message}`);
    } finally {
      server.kill();
    }
  }
  await browser.close();
})();
