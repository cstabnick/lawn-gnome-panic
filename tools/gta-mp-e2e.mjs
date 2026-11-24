// Two headless browsers join one Gnome Theft Auto room and check the online world sync (docs/roadmaps/gta-online-sync.md):
// an emote shows on the other client, a street event and the banner plane are mirrored on both, an animal shot by the
// guest reacts on the host, and neither page logs a console error.
// Needs a local mp-server and the game's dev server:
//   PORT=8431 npm run dev -w packages/mp-server
//   npx vite --port 5430 --strictPort   (in games/gnome-theft-auto)
// Usage: node tools/gta-mp-e2e.mjs [gameUrl] [mpUrl]
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const GAME = process.argv[2] ?? 'http://localhost:5430/';
const MP = process.argv[3] ?? 'ws://localhost:8431/ws';
const ROOM = `E2E${Math.floor(Math.random() * 9000 + 1000)}`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const BROWSERS = [
  process.env.DEMO_BROWSER,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const exe = BROWSERS.find((p) => fs.existsSync(p));
if (!exe) { console.error('gta-mp-e2e: no Chrome or Edge found; set DEMO_BROWSER'); process.exit(2); }

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
  const url = `${GAME}?room=${ROOM}&no-intro&debug&quality=low&mp=${encodeURIComponent(MP)}`;
  await page.goto(url, { waitUntil: 'load', timeout: 120_000 });
  await page.waitForFunction(() => window.__gta?.net?.myId != null, { timeout: 120_000 });
  return { browser, page, errors, ev: (fn, ...a) => page.evaluate(fn, ...a) };
}

/** Poll fn on page until it returns truthy (or time out); returns the last value. */
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

const place = (x, z) => { const g = window.__gta; g.player.respawn(x, z, 0); return true; };

let A, B;
try {
  A = await open('host');
  B = await open('guest');
  const aId = await A.ev(() => window.__gta.net.myId);
  const bId = await B.ev(() => window.__gta.net.myId);
  const seen = await until(B, () => window.__gta.remotes.count() === 1 && window.__gta.online.hub.stats().peers === 1, null, 30000)
    && await until(A, () => window.__gta.remotes.count() === 1 && window.__gta.online.hub.stats().peers === 1, null, 30000);
  check(!!seen, `both clients see each other (host ${aId}, guest ${bId})`);
  check(await A.ev(() => window.__gta.net.hostId === window.__gta.net.myId), 'the first client is the host');

  // Stand together in Turfton.
  await A.ev(place, 0, -115);
  await B.ev(place, 4, -112);
  await wait(2500);
  check(await A.ev(() => window.__gta.online.hub.lead()), 'host leads');
  check(!(await B.ev(() => window.__gta.online.hub.lead())), 'guest near the host does not lead');

  // 1. Emote.
  await A.ev(() => window.__gta.anim.play('wave'));
  const emote = await until(B, (id) => window.__gta.remotes.activityOf(id)?.emote, aId);
  check(emote === 'wave', `guest sees the host's emote (${emote})`);

  // 2. A street event.
  const evId = await A.ev(() => { const g = window.__gta; const ids = g.streetEvents.list().map((e) => e.id); const id = ids.includes('street-busker') ? 'street-busker' : ids[0]; g.streetEvents.trigger(id); return id; });
  const hostEv = await A.ev(() => window.__gta.streetEvents.active().length);
  const guestEv = await until(B, () => window.__gta.online.hub.stats().mirrors[3] ?? 0);
  check(hostEv > 0 && guestEv > 0, `street event ${evId} on the host (${hostEv} running) and mirrored on the guest (${guestEv} pieces)`);

  // 3. The banner plane.
  // spawn() is false when the banner tow is already flying (ambient traffic); either way it must be up now.
  const spawned = await A.ev(() => { const s = window.__gta.sky; s.spawn('banner-tow'); return s.list().some((b) => b.id === 'banner-tow' && b.active); });
  const guestSky = await until(B, () => window.__gta.online.hub.stats().mirrors[2] ?? 0, null, 20000);
  check(spawned && guestSky > 0, `banner plane spawned on the host and mirrored on the guest (${guestSky})`);

  // 4. A quarry shot by the guest goes down on the host.
  const q = await A.ev(() => {
    const g = window.__gta;
    const ok = g.hunting.list.filter((x) => x.id < 100000 && (x.mode === 'graze' || x.mode === 'walk'));
    const pick = ok[0];
    return pick ? { id: pick.id, x: pick.x, z: pick.z } : null;
  });
  if (!q) check(false, 'a grazing quarry to shoot');
  else {
    await A.ev(place, q.x + 12, q.z);
    await B.ev(place, q.x + 14, q.z + 2);
    await wait(3000);
    const owned = await B.ev((id) => {
      const g = window.__gta;
      const qq = g.hunting.list.find((x) => x.id === id);
      return qq ? { mode: qq.mode } : null;
    }, q.id);
    // Freeze the quarry in place on the host so the shot cannot miss a moving target: shoot where the guest sees it.
    const hit = await B.ev((id) => {
      const g = window.__gta;
      const qq = g.hunting.list.find((x) => x.id === id);
      return qq ? g.hunting.hitTest(qq.x, qq.y + qq.species.height * 0.5, qq.z) : false;
    }, q.id);
    const hostMode = await until(A, (id) => { const qq = window.__gta.hunting.list.find((x) => x.id === id); return qq && (qq.mode === 'down' || qq.mode === 'rolled') ? qq.mode : null; }, q.id, 8000);
    check(hit && !!hostMode, `guest's shot (hit ${hit}, guest saw ${owned?.mode}) knocks quarry ${q.id} over on the host (${hostMode})`);
  }

  await wait(1000);
  const stats = await A.ev(() => window.__gta.online.hub.stats());
  const gstats = await B.ev(() => window.__gta.online.hub.stats());
  console.log('host stats', JSON.stringify(stats));
  console.log('guest stats', JSON.stringify(gstats));
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
