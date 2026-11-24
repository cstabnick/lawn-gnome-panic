// Two headless browsers, one in Club Gnome and one in Gnome Theft Auto, the same room code: the GTA player walks into
// the Gnomecino (a crossover portal, packages/portal) and both see each other inside; the visitor wins chips, walks
// out, and is back in GTA at the door with the portal stack popped and the ledger applied exactly once.
// Needs the mp relay and both dev servers:
//   npm run build -w packages/mp-server && PORT=8797 node packages/mp-server/dist/server.mjs
//   npx vite --port 5443 --strictPort   (in games/gnome-theft-auto)
//   npx vite --port 5444 --strictPort   (in games/club-gnome)
// Usage: node tools/portal-e2e.mjs [gtaUrl] [clubUrl] [mpUrl]
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const GTA = process.argv[2] ?? 'http://localhost:5443/';
const CLUB = process.argv[3] ?? 'http://localhost:5444/';
const MP = process.argv[4] ?? 'ws://localhost:8797/ws';
const ROOM = `PT${Math.floor(Math.random() * 9000 + 1000)}`;
const LEDGER = 'lawn.portal.ledger.v1:gnome-theft-auto';
const STACK = 'lawn.portal.stack.v1:gnome-theft-auto';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const enc = encodeURIComponent;

const BROWSERS = [
  process.env.DEMO_BROWSER,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const exe = BROWSERS.find((p) => fs.existsSync(p));
if (!exe) { console.error('portal-e2e: no Chrome or Edge found; set DEMO_BROWSER'); process.exit(2); }

const fails = [];
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) fails.push(msg); };
const NOISE = /GPU stall|WebGL|favicon|ERR_CONNECTION_REFUSED.*8787|Failed to load resource/i;

async function open(name, url, ready) {
  const browser = await puppeteer.launch({
    executablePath: exe, headless: 'new', protocolTimeout: 300_000,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--mute-audio'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 640, height: 400 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`${name}: ${e.stack ?? e}`));
  page.on('console', (m) => { if (m.type() === 'error' && !NOISE.test(m.text())) errors.push(`${name}: ${m.text()}`); });
  await page.goto(url, { waitUntil: 'load', timeout: 180_000 });
  await page.waitForFunction(ready, { timeout: 180_000 });
  return { browser, page, errors, ev: (fn, ...a) => page.evaluate(fn, ...a) };
}

/** Poll fn (on a page or frame wrapper with ev) until truthy or time out; returns the last value. */
async function until(p, fn, arg, ms = 15000) {
  const end = Date.now() + ms;
  let v;
  while (Date.now() < end) {
    try { v = await p.ev(fn, arg); } catch { v = undefined; }
    if (v) return v;
    await wait(300);
  }
  return v;
}

let A;
let B;
try {
  // 1. A Club Gnome native walks into the Gnomecino.
  A = await open('club', `${CLUB}?room=${ROOM}&debug&mp=${enc(MP)}`, () => window.__club?.myId?.() != null);
  await A.ev(() => window.__club.enterMap('gnomecino'));
  check(await A.ev(() => window.__club.mapId()) === 'gnomecino', 'club native is in the Gnomecino');

  // 2. A GTA player stands at the velvet rope.
  B = await open('gta', `${GTA}?room=${ROOM}&no-intro&debug&quality=low&mp=${enc(MP)}&portalBase=${enc(CLUB)}`,
    () => window.__gta?.net?.myId != null && !!window.__gta.portal);
  await B.ev(() => { const g = window.__gta; g.player.respawn(g.portal.door.x - 1, g.portal.door.z, -Math.PI / 2); });
  await wait(500);
  const prompt = await B.ev(() => window.__gta.portal.prompt(0));
  check(typeof prompt === 'string' && prompt.startsWith('Enter The Gnomecino'), `door prompt at the rope ("${prompt}")`);

  // 3. Walk in.
  check(await B.ev(() => window.__gta.portal.enterNow()) === true, 'enterNow walks in');
  check(await B.ev(() => window.__gta.portal.active) === true, 'GTA portal is active (world frozen)');
  const stackIn = await B.ev((k) => JSON.parse(sessionStorage.getItem(k) ?? '{"frames":[]}').frames.length, STACK);
  check(stackIn === 1, `one frame pushed (${stackIn})`);
  let frame = null;
  const end = Date.now() + 90_000;
  while (!frame && Date.now() < end) {
    frame = B.page.frames().find((f) => f.url().includes('portal=gnomecino')) ?? null;
    if (!frame) await wait(300);
  }
  check(!!frame, 'the Gnomecino frame opened');
  if (!frame) throw new Error('no portal frame');
  const F = { ev: (fn, ...a) => frame.evaluate(fn, ...a) };
  const inside = await until(F, () => window.__club?.mapId?.() === 'gnomecino' && window.__club.myId() != null, undefined, 120_000);
  check(!!inside, 'visitor is online inside the Gnomecino');

  // 4. Both see each other.
  const aSees = await until(A, () => window.__club.peersOn('gnomecino') >= 1, undefined, 20_000);
  const fSees = await until(F, () => window.__club.peersOn('gnomecino') >= 1, undefined, 20_000);
  check(!!aSees, 'club native sees the visitor in the Gnomecino');
  check(!!fSees, 'visitor sees the club native in the Gnomecino');

  // 5. Win chips inside: the entry reaches the GTA page.
  await F.ev(() => window.__club.winChips(25));
  const entry = await until(B, (k) => {
    const b = JSON.parse(localStorage.getItem(k) ?? '{"pending":[]}');
    return b.pending.find((e) => e.kind === 'chips' && e.amount === 25) ?? null;
  }, LEDGER, 10_000);
  check(!!entry, `chips entry recorded on the GTA page (${entry?.id})`);

  // 6. Walk out through the door.
  await F.ev(() => window.__club.exitPortal());
  const out = await until(B, () => window.__gta.portal.active === false, undefined, 10_000);
  check(!!out, 'back in GTA (portal inactive)');
  const pos = await B.ev(() => { const g = window.__gta; return Math.hypot(g.player.x - g.portal.door.x, g.player.z - g.portal.door.z); });
  check(pos < 3, `player back at the door (${pos.toFixed(2)} m)`);
  const after = await B.ev((keys) => ({
    frames: JSON.parse(sessionStorage.getItem(keys[1]) ?? '{"frames":[]}').frames.length,
    book: JSON.parse(localStorage.getItem(keys[0]) ?? '{"pending":[],"applied":[]}'),
  }), [LEDGER, STACK]);
  check(after.frames === 0, 'stack popped');
  check(after.book.pending.length === 0, 'no pending ledger entries');
  check(!!entry && after.book.applied.filter((id) => id === entry.id).length === 1, 'chips entry applied exactly once');

  // 7. The visitor left the Club Gnome room.
  const gone = await until(A, () => window.__club.peersOn('gnomecino') === 0, undefined, 20_000);
  check(!!gone, 'club native no longer sees the visitor');

  // 8. A reload applies nothing twice.
  await B.page.reload({ waitUntil: 'load', timeout: 180_000 });
  await B.page.waitForFunction(() => window.__gta?.net && !!window.__gta.portal, { timeout: 180_000 });
  const again = await B.ev((k) => JSON.parse(localStorage.getItem(k) ?? '{"pending":[],"applied":[]}'), LEDGER);
  check(again.pending.length === 0 && !!entry && again.applied.filter((id) => id === entry.id).length === 1, 'reload: still applied once, nothing pending');

  // 9. No console errors.
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
