#!/usr/bin/env node
// Takes a 480x270 JPEG thumbnail of each game for the landing page: games/<name>/thumbnail.jpg.
// Starts each game's dev server, loads it in headless Edge or Chrome (puppeteer-core), waits, and screenshots.
// Usage: node tools/thumbnails.cjs [game ...]
const puppeteer = require('puppeteer-core');
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
/**
 * Per game: URL suffix (hash or query that drops straight into play), seconds to wait, optional localStorage, and an
 * optional `prepare(page)` that runs after load (click through menus) before the wait. Aim for gameplay, not menus.
 */
const SHOTS = {
  // #hole=N skips the title and tees off on hole N.
  'gnome-golf': { suffix: '#hole=3', wait: 12 },
  'gnome-bowling': { suffix: '#play', wait: 10 },
  // #cpu skips the menu into a party against CPUs. Short wait: the board, before a random minigame takes over.
  'gnome-party': { suffix: '#cpu', wait: 2 },
  // #go starts the race with the default mower.
  'lawn-prix': { suffix: '#go', wait: 14 },
  // Title buttons are plain DOM: click through them.
  'gnomes-of-gnomomia': { suffix: '', wait: 10, prepare: (page) => clickText(page, 'New Game') },
  'mower-chain': { suffix: '', wait: 3, prepare: (page) => clickText(page, 'PLAY') },
  'sample-3d': { suffix: '?autostart=solo&cam=side', wait: 20 },
  // #snap=<scenario> skips the title and sets up a scene (see games/gnaft/src/selftest.ts runSnap).
  gnaft: {
    suffix: '#snap=props',
    wait: 20,
    // Hide the "Click to look around" pointer-lock prompt that sits mid-screen.
    prepare: (page) => page.evaluate(() => {
      for (const d of document.querySelectorAll('#ui div')) if (d.textContent === 'Click to look around') d.style.visibility = 'hidden';
    }),
  },
  // ?autoplay=1 starts the match without the Play click, so the bots are already fighting.
  'gnome-front': { suffix: '?autoplay=1', wait: 25 },
  'faster-than-lawn': {
    suffix: '',
    wait: 6,
    prepare: (page) => page.evaluate(() => window.__game.scene.getScene('Title').scene.start('Combat', { tier: 2, isBoss: false })),
  },
  // Short wait: the player stands still, so a long one ends on the game-over screen.
  'sample-dodge': { suffix: '', wait: 2.2, prepare: async (page) => { await page.mouse.click(480, 270); } },
  'gnome-company': { suffix: '', wait: 5, prepare: (page) => clickText(page, 'Play Solo (Offline Pilgrimage)') },
  'peak-climb': {
    suffix: '',
    wait: 5,
    prepare: async (page) => {
      await clickText(page, 'Play Solo');
      await new Promise((r) => setTimeout(r, 500));
      await page.evaluate(() => {
        for (const el of document.querySelectorAll('#peak-hud div')) {
          if (el.textContent.includes('Click') && el.textContent.includes('look')) el.style.display = 'none';
        }
      });
    },
  },
  'prefab-gallery': { suffix: '?sheet', wait: 4 },
};

const BROWSERS = [
  process.env.BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

/** Clicks the first button whose text is exactly `text`. */
function clickText(page, text) {
  return page.evaluate((t) => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === t)?.click(), text);
}

const net = require('node:net');

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
    s.on('error', reject);
  });
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
  // Party-only games ("lawn": { "partyOnly": true }) are not on the landing page, so they get no thumbnail.
  const partyOnly = (g) => {
    const pkgPath = path.join(root, 'games', g, 'package.json');
    if (!fs.existsSync(pkgPath)) return false;
    return JSON.parse(fs.readFileSync(pkgPath, 'utf8')).lawn?.partyOnly === true;
  };
  const games = fs.readdirSync(path.join(root, 'games')).filter((g) => fs.existsSync(path.join(root, 'games', g, 'vite.config.ts')) && !partyOnly(g) && (wanted.length === 0 || wanted.includes(g)));
  const exe = BROWSERS.find((b) => fs.existsSync(b));
  if (!exe) throw new Error('no Edge or Chrome found (set BROWSER=<path>)');
  const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--ignore-gpu-blocklist'] });
  for (const game of games) {
    const port = await freePort();
    const opts = SHOTS[game] ?? { suffix: '', wait: 10 };
    const server = spawn(`npx vite --port ${port} --strictPort`, { cwd: path.join(root, 'games', game), stdio: 'ignore', shell: true });
    try {
      const url = `http://localhost:${port}/`;
      await waitForServer(url, 30000);
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 960, height: 540, deviceScaleFactor: 0.5 });
      if (opts.storage) await page.evaluateOnNewDocument((s) => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, opts.storage);
      await page.goto(url + opts.suffix);
      if (opts.prepare) {
        await new Promise((r) => setTimeout(r, 3000));
        await opts.prepare(page);
      }
      await new Promise((r) => setTimeout(r, opts.wait * 1000));
      const out = path.join(root, 'games', game, 'thumbnail.jpg');
      await page.screenshot({ path: out, type: 'jpeg', quality: 78 });
      console.log(`${game}: ${out} (${Math.round(fs.statSync(out).size / 1024)} KB)`);
      await context.close();
    } catch (err) {
      console.error(`${game}: ${err.message}`);
    } finally {
      // npx runs through a shell: kill the whole tree or Vite keeps the port.
      if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
      else server.kill();
    }
  }
  await browser.close();
})();
