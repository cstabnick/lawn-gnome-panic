// Two headless browsers join one Gnome Theft Auto room and run an online street race (E26): host a lobby, join it,
// go, both sessions start, each sees the other's progress, the guest quits and the host sees it DNF. No console errors.
// Needs a local mp-server and the game's dev server:
//   PORT=8432 npm run dev -w packages/mp-server
//   npx vite --port 5326 --strictPort   (in games/gnome-theft-auto)
// Usage: node tools/gta-race-e2e.mjs [gameUrl] [mpUrl]
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const GAME = process.argv[2] ?? 'http://localhost:5326/';
const MP = process.argv[3] ?? 'ws://localhost:8432/ws';
const ROOM = `RACE${Math.floor(Math.random() * 9000 + 1000)}`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const TRACK = 'kerb-row-circuit';

const BROWSERS = [
  process.env.DEMO_BROWSER,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const exe = BROWSERS.find((p) => fs.existsSync(p));
if (!exe) { console.error('gta-race-e2e: no Chrome or Edge found; set DEMO_BROWSER'); process.exit(2); }

const fails = [];
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) fails.push(msg); };

async function open(name) {
  const browser = await puppeteer.launch({
    executablePath: exe, headless: 'new', protocolTimeout: 300_000,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--mute-audio'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 640, height: 400 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`${name}: ${e.stack ?? e}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${name}: ${m.text()}`); });
  await page.goto(`${GAME}?room=${ROOM}&no-intro&debug&quality=low&mp=${encodeURIComponent(MP)}`, { waitUntil: 'load', timeout: 120_000 });
  await page.waitForFunction(() => window.__gta?.net?.myId != null && window.__gta.onlineSync?.race, { timeout: 120_000 });
  return { browser, page, errors, ev: (fn, ...a) => page.evaluate(fn, ...a) };
}

async function until(p, fn, arg, ms = 15000) {
  const end = Date.now() + ms;
  let v;
  while (Date.now() < end) {
    v = await p.ev(fn, arg);
    if (v) return v;
    await wait(300);
  }
  return v;
}

const startRace = () => window.__gta.streetRacing.session.start({ kind: 'online', trackId: 'kerb-row-circuit', vehicle: 'lowrider', laps: 1 });
const sessionInfo = () => { const g = window.__gta; return { active: g.streetRacing.session.active()?.kind ?? null, vehicle: g.player.vehicle?.kind ?? null }; };

let A, B;
try {
  A = await open('host');
  B = await open('guest');
  const aId = await A.ev(() => window.__gta.net.myId);
  const bId = await B.ev(() => window.__gta.net.myId);
  check(!!(await until(A, () => window.__gta.remotes.count() === 1, null, 30000)), `both clients see each other (host ${aId}, guest ${bId})`);

  await A.ev((t) => window.__gta.onlineSync.race.host(t, 1, 'lowrider'), TRACK);
  const lobby = await until(B, (id) => window.__gta.onlineSync.race.lobbies().some((l) => l.hostId === id), aId, 20000);
  check(!!lobby, 'guest lists the host lobby');
  await B.ev((id) => window.__gta.onlineSync.race.join(id), aId);
  const two = await until(A, () => window.__gta.onlineSync.race.mine()?.members.length === 2, null, 20000);
  check(!!two, 'host sees two members');
  const bMine = await until(B, () => window.__gta.onlineSync.race.mine()?.members.length === 2, null, 20000);
  check(!!bMine, 'guest sees two members');

  await A.ev(() => window.__gta.onlineSync.race.go());
  const rA = await A.ev(startRace);
  check(rA === null, `host session started (${rA})`);
  check(!!(await until(B, () => window.__gta.onlineSync.race.started(), null, 15000)), 'guest sees the race started');
  const rB = await B.ev(startRace);
  check(rB === null, `guest session started (${rB})`);

  await wait(1500);
  for (const [n, p] of [['host', A], ['guest', B]]) {
    const s = await p.ev(sessionInfo);
    check(s.active === 'online' && !!s.vehicle, `${n}: session ${s.active}, seated in ${s.vehicle}`);
  }

  await wait(8000);
  const ra = await A.ev(() => window.__gta.onlineSync.race.racers());
  const rb = await B.ev(() => window.__gta.onlineSync.race.racers());
  console.log('host sees', JSON.stringify(ra), 'guest sees', JSON.stringify(rb));
  check(ra.some((r) => r.id === bId && typeof r.dist === 'number'), 'host sees the guest with a dist');
  check(rb.some((r) => r.id === aId && typeof r.dist === 'number'), 'guest sees the host with a dist');

  await B.ev(() => window.__gta.streetRacing.session.stop());
  const dnf = await until(A, (id) => window.__gta.onlineSync.race.racers().some((r) => r.id === id && r.dnf), bId, 10000);
  check(!!dnf, 'host sees the guest DNF after it quits');

  const errs = [...A.errors, ...B.errors];
  for (const e of errs.slice(0, 10)) console.log('  ' + e.split('\n')[0]);
  check(errs.length === 0, `no console errors (${errs.length})`);
} catch (e) {
  check(false, `run: ${e.message}`);
} finally {
  await A?.browser.close();
  await B?.browser.close();
}
console.log(fails.length ? `${fails.length} failed` : 'all passed');
process.exit(fails.length ? 1 : 0);
