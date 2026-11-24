// Two headless browsers join one Gnome Theft Auto room and check the online jobs and tubing sync:
// (1) a player rides as a fare in another player's taxi (call, take, board, pick up, drop, paid), and
// (2) a tubing rider is towed behind another player's boat and both clients draw the rope.
// Neither page may log a console error.
// Needs a local mp-server and the game's dev server:
//   PORT=8442 npm run dev -w packages/mp-server
//   npx vite --port 5442 --strictPort   (in games/gnome-theft-auto)
// Usage: node tools/gta-jobs-mp-e2e.mjs [gameUrl] [mpUrl]
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const GAME = process.argv[2] ?? 'http://localhost:5442/';
const MP = process.argv[3] ?? 'ws://localhost:8442/ws';
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
if (!exe) { console.error('gta-jobs-mp-e2e: no Chrome or Edge found; set DEMO_BROWSER'); process.exit(2); }

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
  return { name, browser, page, errors, ev: (fn, ...a) => page.evaluate(fn, ...a) };
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

/** Press a key on the page up to `tries` times, `gap` ms apart, until fn on the page is truthy. */
async function pressUntil(p, key, fn, arg, tries = 6, gap = 1500) {
  for (let i = 0; i < tries; i++) {
    if (await p.ev(fn, arg)) return true;
    await p.page.keyboard.press(key);
    await wait(gap);
  }
  return !!(await p.ev(fn, arg));
}

const place = (x, z) => { window.__gta.player.respawn(x, z, 0); return true; };
const pos = () => { const p = window.__gta.player; return { x: p.x, z: p.z }; };

let A, B;
try {
  A = await open('host');
  B = await open('guest');
  const aId = await A.ev(() => window.__gta.net.myId);
  const bId = await B.ev(() => window.__gta.net.myId);

  // 1. Both clients see each other; the first one is the host.
  const seen = await until(B, () => window.__gta.remotes.count() === 1 && window.__gta.online.hub.stats().peers === 1, null, 30000)
    && await until(A, () => window.__gta.remotes.count() === 1 && window.__gta.online.hub.stats().peers === 1, null, 30000);
  check(!!seen, `both clients see each other (host ${aId}, guest ${bId})`);
  check(await A.ev(() => window.__gta.net.hostId === window.__gta.net.myId), 'the first client is the host');

  // Stand together in Turfton.
  await A.ev(place, 0, -115);
  await wait(500);
  const ax = await A.ev(pos).then((p) => p.x);
  const az = await A.ev(pos).then((p) => p.z);

  // 2. Taxi: A drives a cart on duty, B calls it and rides as a fare.
  const onDuty = await A.ev((x, z) => {
    const g = window.__gta;
    const v = g.spawn('golf-cart', x + 4, z, 0);
    g.jobDeps.seatPlayer(v);
    return g.jobs.goOnDuty('taxi');
  }, ax, az);
  check(onDuty == null, `host goes on duty in a taxi (${onDuty ?? 'ok'})`);

  await B.ev((x, z) => window.__gta.player.respawn(x, z, 0), ax + 4 + 2.2, az + 0.5);
  const called = await B.ev(() => window.__gta.jobs.callCab('clay-mart'));
  check(called == null, `guest calls a cab to Clay-Mart (${called ?? 'ok'})`);

  const hasCall = await until(A, () => window.__gta.jobs.debug().openCalls >= 1, null, 20000);
  check(!!hasCall, 'the host sees the open call');

  const taken = await A.ev(() => window.__gta.jobs.takeCall());
  const kind = await A.ev(() => window.__gta.jobs.debug().gig?.kind ?? null);
  check(taken == null && kind === 'player-fare', `player fare taken on the host (${taken ?? 'ok'}, gig ${kind})`);

  const assigned = await until(B, () => window.__gta.jobs.debug().cab?.phase === 'assigned', null, 15000);
  check(!!assigned, 'the guest cab is assigned');

  const boarded = await pressUntil(B, 'KeyE',
    () => !!window.__gta.player.vehicle && window.__gta.player.vehicle.driver === 'remote');
  check(boarded, 'rider boarded the taxi (guest rides in the host cart)');

  const pickedUp = await until(A, () => window.__gta.jobs.debug().gig?.idx >= 1, null, 20000);
  check(!!pickedUp, 'picked up');

  // Drive the cart to the drop. Repeat a few times so the pose reaches the guest.
  for (let i = 0; i < 4; i++) {
    await A.ev(() => {
      const d = window.__gta.jobs.debug();
      const n = d.gig?.next;
      const pv = window.__gta.player.vehicle;
      if (!n || !pv) return false;
      pv.x = n.x; pv.z = n.z; pv.speed = 0;
      return true;
    });
    await wait(500);
  }
  const dropped = await until(A, () => {
    const d = window.__gta.jobs.debug();
    return d.fares >= 1 ? d.fares : null;
  }, null, 20000);
  const idle = await until(B, () => window.__gta.jobs.debug().cab?.phase === 'idle', null, 15000);
  check(!!dropped && !!idle, 'dropped and paid');

  // 3. Tubing: B gets out, A tows B behind a boat on Loch Moss.
  await pressUntil(B, 'KeyE', () => !window.__gta.player.vehicle);

  const towing = await A.ev(() => {
    const g = window.__gta;
    const bt = g.spawn('gravy-boat', -700, -640, Math.PI);
    g.jobDeps.seatPlayer(bt);
    return g.tubing.setTow(true);
  });
  check(towing == null, `host tows from a boat (${towing ?? 'ok'})`);

  await B.ev((x, z) => window.__gta.player.respawn(x, z, Math.PI), -700, -652);
  let hop = 'not tried';
  for (let i = 0; i < 10; i++) {
    hop = await B.ev(() => window.__gta.tubing.hopOn());
    if (hop == null) break;
    await wait(1000);
  }
  check(hop == null, `guest hops on the tube (${hop ?? 'ok'})`);

  const hooked = await until(B, () => (window.__gta.tubing.debug().ride?.slot ?? -1) >= 0, null, 10000);
  const inTow = await until(A, (id) => {
    const s = window.__gta.tubing.debug().tow?.slots ?? [];
    return s.some((x) => x === id || x?.id === id);
  }, bId, 10000);
  check(!!hooked && !!inTow, 'guest is hooked to the host tow');

  const before = await B.ev(() => { const v = window.__gta.player.vehicle; return v ? { x: v.x, z: v.z } : null; });
  await A.page.keyboard.down('KeyW');
  await wait(4000);
  await A.page.keyboard.up('KeyW');
  await wait(500);
  const after = await B.ev(() => { const v = window.__gta.player.vehicle; return v ? { x: v.x, z: v.z } : null; });
  const moved = before && after ? Math.hypot(after.x - before.x, after.z - before.z) : 0;
  check(moved > 5, `guest's tube moved ${moved.toFixed(1)} m behind the boat`);

  const aRopes = await A.ev(() => window.__gta.tubing.debug().ropes ?? 0);
  const bRopes = await B.ev(() => window.__gta.tubing.debug().ropes ?? 0);
  check(aRopes >= 1, `host draws the tow rope (${aRopes})`);
  check(bRopes >= 1, `guest draws the tow rope (${bRopes})`);

  // 4. No console errors on either page.
  await wait(1000);
  const errs = [...A.errors, ...B.errors];
  for (const e of errs.slice(0, 5)) console.log('  ' + e.split('\n')[0]);
  check(errs.length === 0, `no console errors (${errs.length})`);
} catch (e) {
  check(false, `run: ${e.message}`);
} finally {
  await A?.browser.close();
  await B?.browser.close();
}
console.log(fails.length ? `${fails.length} failed` : 'all passed');
process.exit(fails.length ? 1 : 0);
