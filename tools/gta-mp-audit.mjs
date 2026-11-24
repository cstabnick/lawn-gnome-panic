// Headless online-world audit for Gnome Theft Auto (docs/roadmaps/gta-multiplayer-audit.md). Up to five Edge pages:
// A (host), B, C (late joiner), D (offline, no room, dead relay) and E (&offline). Checks that the world sync works with
// 2 and 3 players in one ?room=, survives the host leaving, costs little bandwidth, and that the game runs offline.
// Starts nothing itself. Needs the mp relay and the game's dev server already up:
//   PORT=8432 node packages/mp-server/dist/server.mjs            (repo root)
//   npx vite --config <temp config on port 5446>                  (games/gnome-theft-auto)
// MANUAL validation only (about 12 minutes): never part of npm test or any default script. Run it once to establish
// results, then only the scenario a fix touched:
// Usage: node tools/gta-mp-audit.mjs [gameUrl] [mpUrl] [--only emote,act,vehicles,park,event,latejoin,sea,bandwidth,migration,offline]
// Exit 1 on any FAIL; a `skip` line is not a failure.
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const argv = process.argv.slice(2);
const onlyAt = argv.indexOf('--only');
const ONLY = onlyAt >= 0 ? new Set(String(argv.splice(onlyAt, 2)[1] ?? '').split(',').filter(Boolean)) : null;
// Scenarios a selected one needs: the late joiner C is opened by 'latejoin'.
if (ONLY) for (const n of ['sea', 'bandwidth', 'migration']) if (ONLY.has(n)) ONLY.add('latejoin');
const GAME = argv[0] ?? 'http://localhost:5446/';
const MP = argv[1] ?? 'ws://localhost:8432/ws';
/** Step label -> scenario name for --only (steps 1 and 2 are the setup and always run). */
const SCENARIO = (label) => {
  const n = String(label).split(' ')[0];
  const map = { 1: 'setup', 2: 'setup', 3: 'emote', 4: 'act', 5: 'vehicles', 6: 'park', 7: 'park', 8: 'event', '11a': 'bandwidth', 9: 'latejoin', 10: 'sea', '11b': 'bandwidth', 12: 'migration', 13: 'offline' };
  return map[n] ?? n;
};
const ROOM = `AUD${Math.floor(Math.random() * 9000 + 1000)}`;
const KINDS = ['golf-cart', 'hedge-hopper', 'sycamore-copter', 'dandelion-drifter'];
const IGNORE = /WebSocket|favicon|GPU stall/i;
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
if (!exe) { console.error('gta-mp-audit: no Chrome or Edge found; set DEMO_BROWSER'); process.exit(2); }

const fails = [];
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) fails.push(msg); return !!ok; };
const skip = (msg) => console.log('skip ' + msg);
const browsers = [];

async function open(name, { room = true, mp = true, mpUrl = MP, offline = false, waitId = true } = {}) {
  let browser = null;
  for (let attempt = 1; !browser; attempt++) {
    try {
      browser = await puppeteer.launch({
        executablePath: exe, headless: 'new', protocolTimeout: 300_000, timeout: 120_000,
        args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--mute-audio'],
      });
    } catch (e) {
      if (attempt >= 3) throw e;
      console.log(`     ${name}: browser launch failed (${String(e.message).split('\n')[0]}), retrying`);
      await wait(3000);
    }
  }
  browsers.push(browser);
  const page = await browser.newPage();
  await page.setViewport({ width: 640, height: 400 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`${name}: ${e.stack ?? e}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${name}: ${m.text()}`); });
  // Bandwidth and frame counts (text payload length; binary frames arrive base64 and count a little high).
  const ws = { sentB: 0, recvB: 0, sentF: 0, recvF: 0, urls: [] };
  const cdp = await page.target().createCDPSession();
  await cdp.send('Network.enable');
  cdp.on('Network.webSocketCreated', (e) => { ws.urls.push(e.url); });
  cdp.on('Network.webSocketFrameSent', (e) => { ws.sentB += e.response.payloadData.length; ws.sentF++; });
  cdp.on('Network.webSocketFrameReceived', (e) => { ws.recvB += e.response.payloadData.length; ws.recvF++; });
  const parts = ['no-intro', 'debug', 'quality=low'];
  if (room) parts.push(`room=${ROOM}`);
  if (mp) parts.push(`mp=${encodeURIComponent(mpUrl)}`);
  if (offline) parts.push('offline');
  await page.goto(`${GAME}?${parts.join('&')}`, { waitUntil: 'load', timeout: 180_000 });
  await page.waitForFunction(
    waitId ? () => window.__gta?.net?.myId != null : () => !!window.__gta?.player,
    { timeout: 180_000 },
  );
  return {
    name, browser, page, errors, ws, closed: false,
    ev: (fn, ...a) => page.evaluate(fn, ...a),
  };
}

async function close(p) {
  if (!p || p.closed) return;
  p.closed = true;
  await p.browser.close().catch(() => {});
}

/** Poll fn on page until done(value) is true (or time out); returns the last value. */
async function poll(p, fn, arg, done, ms = 15000) {
  const end = Date.now() + ms;
  let v;
  while (Date.now() < end) {
    v = await p.ev(fn, arg);
    if (done(v)) return v;
    await wait(300);
  }
  return v;
}
const until = (p, fn, arg, ms = 15000) => poll(p, fn, arg, Boolean, ms);

/** One step: a thrown error is a FAIL for this step only; the run goes on. */
async function step(label, fn) {
  const sc = SCENARIO(label);
  if (ONLY && sc !== 'setup' && !ONLY.has(sc)) { console.log(`not run ${label} (--only)`); return; }
  try { await fn(); } catch (e) { check(false, `${label}: ${String(e.message ?? e).split('\n')[0]}`); }
}

// Page-side helpers (serialised into the page, so they must not use node variables).
const place = (x, z) => { window.__gta.player.respawn(x, z, 0); return true; };
const pickEvent = () => {
  const g = window.__gta;
  const ids = g.streetEvents.list().map((e) => e.id);
  const id = ids.includes('street-busker') ? 'street-busker' : ids[0];
  g.streetEvents.trigger(id);
  return id;
};
const planeUp = () => window.__gta.sky.list().some((b) => b.id === 'banner-tow' && b.active);
/** Keep a street event and the banner plane running on this page (they may have ended since they were started). */
const ensureEventAndPlane = () => {
  const g = window.__gta;
  const flying = () => g.sky.list().some((b) => b.id === 'banner-tow' && b.active);
  if (g.streetEvents.active().length === 0) {
    const ids = g.streetEvents.list().map((e) => e.id);
    g.streetEvents.trigger(ids.includes('street-busker') ? 'street-busker' : ids[0]);
  }
  if (!flying()) g.sky.spawn('banner-tow');
  return { events: g.streetEvents.active().length, plane: flying() };
};

/** Bytes and frames per second per page, plus the hub's per-system message deltas, over `ms`. */
async function measure(list, ms) {
  const snap = async (p) => ({ sent: p.ws.sentB, recv: p.ws.recvB, t: Date.now(), bys: await p.ev(() => window.__gta.online.hub.stats().bySys) });
  const before = await Promise.all(list.map(snap));
  await wait(ms);
  const after = await Promise.all(list.map(snap));
  return list.map((p, i) => {
    const secs = (after[i].t - before[i].t) / 1000;
    const delta = {};
    for (const k of Object.keys(after[i].bys)) {
      const d = (after[i].bys[k] ?? 0) - (before[i].bys[k] ?? 0);
      if (d) delta[k] = d;
    }
    return { name: p.name, sentPs: (after[i].sent - before[i].sent) / secs, recvPs: (after[i].recv - before[i].recv) / secs, delta };
  });
}

let A, B, C, D, E;
let aId, bId, cId;
let vid, bpos, movedAt;
let sawHostAlone = false;
const run0 = Date.now();
try {
  // 1. Host alone costs nothing.
  await step('1', async () => {
    A = await open('host');
    aId = await A.ev(() => window.__gta.net.myId);
    await wait(5000);
    const s = await A.ev(() => window.__gta.online.hub.stats());
    sawHostAlone = check(s.online === false && s.sentMsgs === 0, `1. host alone in the room: online ${s.online}, sent msgs ${s.sentMsgs}`);
  });

  // 2. Second client joins; both see each other; host is A; stand together in Turfton.
  await step('2', async () => {
    B = await open('guest');
    bId = await B.ev(() => window.__gta.net.myId);
    const seenB = await until(B, () => window.__gta.remotes.count() === 1, null, 30000);
    const seenA = await until(A, () => window.__gta.remotes.count() === 1, null, 30000);
    check(!!seenB && !!seenA, `2. both see each other (host ${aId}, guest ${bId})`);
    check(await A.ev(() => window.__gta.net.hostId === window.__gta.net.myId), '2. the first client is the host');
    await A.ev(place, 0, -115);
    await B.ev(place, 4, -112);
    await wait(2500);
  });

  // 3. Emote.
  await step('3', async () => {
    await A.ev(() => window.__gta.anim.play('wave'));
    const emote = await until(B, (id) => window.__gta.remotes.activityOf(id)?.emote, aId);
    check(emote === 'wave', `3. guest sees the host's emote (${emote})`);
  });

  // 4. Rod and binoculars. Binoculars: the scope listens for the V key on window, so a synthetic key drives it.
  // The rod has no code entry point (fishing.ts starts it from the X key, and only at the water's edge), so it is skipped.
  await step('4', async () => {
    skip('4. rod: fishing.ts has no code entry point to take the rod out; it needs the X key at the water\'s edge. Not checked.');
    await A.ev(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyV' })));
    await wait(800);
    const up = await A.ev(() => window.__gta.birding.viewing());
    const mode = await until(B, (id) => window.__gta.remotes.activityOf(id)?.mode, aId, 8000);
    check(mode === 2, `4. guest sees the host's binoculars (host scope up ${up}, guest sees mode ${mode}, want 2)`);
    await A.ev(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyV' })));
  });

  // 5. New vehicle kinds: each one A drives away from is seen by B and left where A got out.
  for (const kind of KINDS) {
    await step(`5 ${kind}`, async () => {
      const at = await A.ev((k) => {
        const g = window.__gta;
        const v = g.spawn(k, g.player.x + 6, g.player.z, 0);
        v.driver = 'player';
        g.player.enter(v);
        window.__audLast = v;
        return true;
      }, kind);
      check(at, `5. ${kind}: host spawns and enters one`);
      const seenA = await until(B, ({ k, id }) => window.__gta.remotes.vehicleOf(id)?.kind === k, { k: kind, id: aId }, 10000);
      check(!!seenA, `5. ${kind}: guest sees the host driving it`);
      const left = await A.ev(() => {
        const g = window.__gta;
        g.player.exit();
        const v = window.__audLast;
        v.driver = 'none';
        return { x: v.x, z: v.z };
      });
      const there = await until(B, ({ k, x, z }) => window.__gta.vehicles.some((v) => v.kind === k && Math.hypot(v.x - x, v.z - z) < 4), { k: kind, x: left.x, z: left.z }, 10000);
      check(!!there, `5. ${kind}: guest has one within 4 m of where the host left it`);
    });
  }

  // 6. A parked vehicle is taken by B and moved 30 m; A mirrors it, then it is parked again where B left it.
  await step('6', async () => {
    const pick = await B.ev(() => {
      const g = window.__gta;
      const px = g.player.x;
      const pz = g.player.z;
      const cands = g.vehicles.filter((v) => v.driver === 'none' && g.online.park.entryOf(v)?.stable === true);
      cands.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
      const v = cands[0];
      if (!v) return null;
      g.player.respawn(v.x + 3, v.z, 0);
      return { vid: g.online.park.entryOf(v).vid, x: v.x, z: v.z };
    });
    if (!pick) { check(false, '6. a stable parked vehicle to take'); return; }
    vid = pick.vid;
    console.log(`     parked vehicle vid ${vid} at ${pick.x.toFixed(1)}, ${pick.z.toFixed(1)}`);
    await wait(1500);
    // B enters and drives it 30 m east over 2 s (40 steps of 0.75 m, 50 ms apart).
    await B.ev(async (id) => {
      const g = window.__gta;
      const v = g.vehicles.find((x) => g.online.park.entryOf(x)?.vid === id);
      v.driver = 'player';
      g.player.enter(v);
      const timer = setInterval(() => { v.x += 0.75; }, 50);
      await new Promise((r) => setTimeout(r, 2000));
      clearInterval(timer);
      return { x: v.x, z: v.z };
    }, vid);
    const driven = await until(A, (id) => {
      const g = window.__gta;
      const e = g.online.park.entryOf(id);
      return !!e && e.state === 1 && (!e.v || !g.vehicles.includes(e.v));
    }, vid, 15000);
    const probe6 = await A.ev((id) => {
      const g = window.__gta;
      const e = g.online.park.entryOf(id);
      return { state: e?.state ?? null, hasCopy: !!e?.v, inWorld: !!e?.v && g.vehicles.includes(e.v), owner: e?.owner ?? null };
    }, vid);
    console.log(`     host entry for ${vid}: ${JSON.stringify(probe6)}`);
    check(!!driven, `6. host sees the vehicle driven (state 1) and its copy out of its world`);
    await B.ev(() => { const g = window.__gta; const v = g.player.vehicle; g.player.exit(); if (v) v.driver = 'none'; return true; });
    const bAt = await B.ev((id) => {
      const g = window.__gta;
      const e = g.online.park.entryOf(id);
      return e?.v ? { x: e.v.x, z: e.v.z } : null;
    }, vid);
    bpos = bAt;
    movedAt = bAt;
    const back = await until(A, ({ id, b }) => {
      const g = window.__gta;
      const e = g.online.park.entryOf(id);
      if (!e || e.state !== 0 || !b) return false;
      // The ledger has it where the guest left it; a local copy exists only within 50 m (parkSync buildNear).
      if (Math.hypot(e.x - b.x, e.z - b.z) >= 4) return false;
      return !e.v || (g.vehicles.includes(e.v) && Math.hypot(e.v.x - b.x, e.v.z - b.z) < 4);
    }, { id: vid, b: bAt }, 15000);
    check(!!back, `6. host has it parked back, within 4 m of where the guest left it`);
  });

  // 7. Damage on the host reaches the guest.
  await step('7', async () => {
    // Stand the host by the vehicle: a far vehicle may have no local copy (parkSync builds it within 50 m).
    await A.ev((id) => { const e = window.__gta.online.park.entryOf(id); if (e) window.__gta.player.respawn(e.x + 4, e.z, 0); }, vid);
    await poll(A, (id) => !!window.__gta.online.park.entryOf(id)?.v, vid, Boolean, 5000);
    const hostHp = await A.ev((id) => {
      const g = window.__gta;
      const e = g.online.park.entryOf(id);
      if (!e?.v) return null;
      g.damageVehicle(e.v, 0.6);
      // A prefab with no damage stages ignores damageVehicle (vehicles.ts): set the hit points directly then.
      if (e.v.hp > 0.5) e.v.hp = 0.4;
      return e.v.hp;
    }, vid);
    console.log(`     host copy hp after damage: ${hostHp}`);
    const hp = await poll(B, (id) => {
      const e = window.__gta.online.park.entryOf(id);
      return e?.v ? e.v.hp : null;
    }, vid, (v) => v !== null && v < 0.6, 15000);
    const bEntry = await B.ev((id) => {
      const e = window.__gta.online.park.entryOf(id);
      return e ? { state: e.state, owner: e.owner, hp: e.hp, hasCopy: !!e.v } : null;
    }, vid);
    console.log(`     guest entry for ${vid}: ${JSON.stringify(bEntry)}`);
    check(hp !== null && hp < 0.6, `7. guest's copy takes the damage (hp ${hp})`);
  });

  // 8. A street event and the banner plane, mirrored on the guest.
  await step('8', async () => {
    const id = await A.ev(pickEvent);
    const guestEv = await until(B, () => window.__gta.online.hub.stats().mirrors[3] ?? 0, null, 20000);
    check(!!guestEv, `8. street event ${id} mirrored on the guest (${guestEv} pieces)`);
    const spawned = await A.ev(() => { const s = window.__gta.sky; s.spawn('banner-tow'); return s.list().some((b) => b.id === 'banner-tow' && b.active); });
    const guestSky = await until(B, () => window.__gta.online.hub.stats().mirrors[2] ?? 0, null, 20000);
    check(spawned && !!guestSky, `8. banner plane spawned on the host and mirrored on the guest (${guestSky})`);
  });

  // 11a. Bandwidth with two clients idle (before the third opens).
  await step('11a', async () => {
    const rows = await measure([A, B], 10000);
    console.log('     bandwidth, 2 idle clients (10 s):');
    for (const r of rows) console.log(`       ${r.name.padEnd(6)} sent ${r.sentPs.toFixed(0).padStart(6)} B/s  recv ${r.recvPs.toFixed(0).padStart(6)} B/s  bySys delta ${JSON.stringify(r.delta)}`);
    for (const r of rows) check(r.sentPs < 1024, `11a. ${r.name} sends < 1024 B/s idle (${r.sentPs.toFixed(0)})`);
  });

  // 9. Late join: C opens near the moved vehicle and gets the event, the plane and the parked vehicle.
  await step('9', async () => {
    C = await open('late');
    cId = await C.ev(() => window.__gta.net.myId);
    await C.ev(place, movedAt.x + 4, movedAt.z);
    const count = await until(C, () => window.__gta.remotes.count() === 2, null, 15000);
    check(!!count, `9. late joiner sees 2 remotes (${cId})`);
    const mirrored = await until(C, () => { const m = window.__gta.online.hub.stats().mirrors; return (m[3] ?? 0) + (m[2] ?? 0) > 0; }, null, 15000);
    check(!!mirrored, '9. late joiner has the street event or the plane mirrored');
    const ent = await until(C, ({ id, b }) => {
      const e = window.__gta.online.park.entryOf(id);
      if (!e || e.state !== 0 || !e.v) return false;
      return Math.hypot(e.v.x - b.x, e.v.z - b.z) < 4;
    }, { id: vid, b: bpos }, 15000);
    check(!!ent, '9. late joiner has the moved parked vehicle (state 0) within 4 m of the guest\'s copy');
  });

  // 10. Sea: waves time agrees across the three pages.
  await step('10', async () => {
    const times = await Promise.all([A, B, C].map((p) => p.ev(async () => { const w = await import('/src/waves.ts'); w.tickWaveClock(); return w.waveTime(); })));
    const spread = Math.max(...times) - Math.min(...times);
    // The guest adopts the host clock as it arrives, so the spread is about one-way delivery time. Under headless
    // swiftshader a frame takes up to a second and a message waits for it; on real devices it is the network latency
    // (well under the 0.2 s dead band). src/online/seaShare.test.ts checks the exact agreement given the record.
    check(spread < 1.5, `10. sea time agrees on all three pages within delivery time (spread ${spread.toFixed(3)} s)`);
  });

  // 11b. Bandwidth with three clients busy: event and plane running, each page driving a golf cart in a 20 m circle.
  await step('11b', async () => {
    const busy = await Promise.all([A, B, C].map((p) => p.ev(() => {
      const g = window.__gta;
      const v = g.spawn('golf-cart', g.player.x + 8, g.player.z, 0);
      v.driver = 'player';
      g.player.enter(v);
      const cx = v.x - 10;
      const cz = v.z;
      let t = 0;
      window.__audCircle = setInterval(() => {
        t += 0.015;
        v.x = cx + 10 * Math.cos(t);
        v.z = cz + 10 * Math.sin(t);
      }, 50);
      return true;
    })));
    check(busy.every(Boolean), '11b. each page drives a golf cart in a circle');
    const ensured = await A.ev(ensureEventAndPlane);
    console.log(`     event and plane on host: ${ensured.events} event(s), plane ${ensured.plane}`);
    const rows = await measure([A, B, C], 10000);
    console.log('     bandwidth, 3 busy clients (10 s):');
    for (const r of rows) console.log(`       ${r.name.padEnd(6)} sent ${r.sentPs.toFixed(0).padStart(6)} B/s  recv ${r.recvPs.toFixed(0).padStart(6)} B/s  bySys delta ${JSON.stringify(r.delta)}`);
    for (const r of rows) check(r.sentPs < 4096, `11b. ${r.name} sends < 4096 B/s busy (${r.sentPs.toFixed(0)})`);
    await Promise.all([A, B, C].map((p) => p.ev(() => { clearInterval(window.__audCircle); return true; })));
  });

  // 12. Host migration: close the host's browser.
  await step('12', async () => {
    const skyInfo = () => { const g = window.__gta; return { lead: g.online.hub.lead(), me: [Math.round(g.player.x), Math.round(g.player.z)], own: g.sky.netList().filter((r) => r.id === 'banner-tow').map((r) => ({ key: r.key, state: r.state, at: [Math.round(r.v.x), Math.round(r.v.z)] })), mirrors: g.online.hub.stats().mirrors[2] ?? 0 }; };
    for (const p of [A, B, C]) console.log(`     before: ${p.name} ${JSON.stringify(await p.ev(skyInfo))}`);
    await close(A);
    const end = Date.now() + 8000;
    let hb = null;
    let hc = null;
    while (Date.now() < end) {
      hb = await B.ev(() => window.__gta.net.hostId);
      hc = await C.ev(() => window.__gta.net.hostId);
      if (hb != null && hb === hc && (hb === bId || hb === cId)) break;
      await wait(300);
    }
    check(hb != null && hb === hc && (hb === bId || hb === cId), `12. host migrated: B's host ${hb}, C's host ${hc} (B ${bId}, C ${cId})`);
    await wait(4000);
    for (const p of [B, C]) console.log(`     after: ${p.name} ${JSON.stringify(await p.ev(skyInfo))}`);
    let planes = 0;
    for (const p of [B, C]) planes += await p.ev(() => window.__gta.sky.netList().filter((r) => r.id === 'banner-tow' && r.state === 'flying').length);
    check(planes <= 1, `12. banner-tow planes owned on B and C: ${planes} (want at most 1)`);
    for (const p of [B, C]) {
      const info = await p.ev((id) => {
        const g = window.__gta;
        const e = g.online.park.entryOf(id);
        const v = g.vehicles.find((x) => g.online.park.entryOf(x)?.vid === id);
        return { owner: e?.owner ?? null, state: e?.state ?? null, inPlace: !!v && !!e && Math.hypot(v.x - e.x, v.z - e.z) < 4 };
      }, vid);
      console.log(`     ${p.name}: parked vid ${vid} owner ${info.owner}, state ${info.state}, still in place ${info.inPlace}`);
    }
  });

  // 13. Offline. D: no room, relay that nothing listens on. E: &offline with no relay at all.
  await step('13', async () => {
    D = await open('offline', { room: false, mp: true, mpUrl: 'ws://127.0.0.1:9/ws', waitId: false });
    D.ws.sentF = 0;
    await wait(15000);
    const d = await D.ev(() => {
      const g = window.__gta;
      return { player: !!g.player, myId: g.net.myId ?? null, sent: g.online.hub.stats().sentMsgs };
    });
    check(d.player && d.myId == null && d.sent === 0, `13. offline page runs (player ${d.player}, myId ${d.myId}, sent msgs ${d.sent})`);
    const dErr = D.errors.filter((e) => !IGNORE.test(e));
    check(dErr.length === 0, `13. offline page has no page errors (${dErr.length})`);
    E = await open('offline-flag', { room: false, mp: false, offline: true, waitId: false });
    const before = E.ws.sentF;
    await wait(10000);
    const frames = E.ws.sentF - before;
    // The game's own relay socket only: the Vite dev client's socket (/@vite or ?token=) is the dev server, not the game.
    const game = E.ws.urls.filter((u) => !/token=|@vite|vite-hmr/.test(u));
    console.log(`     &offline page websockets: ${JSON.stringify(E.ws.urls)}`);
    check(game.length === 0, `13. &offline page opens no game websocket (${game.length}; ${frames} frame(s) in 10 s)`);
  });

  // 14. No console or page errors on A, B, C.
  const errs = [...(A?.errors ?? []), ...(B?.errors ?? []), ...(C?.errors ?? [])].filter((e) => !IGNORE.test(e));
  for (const e of errs.slice(0, 10)) console.log('     ' + e.split('\n')[0]);
  check(errs.length === 0, `14. no console or page errors on host, guest or late joiner (${errs.length})`);
} catch (e) {
  check(false, `run: ${e.message}`);
} finally {
  for (const b of browsers) await b.close().catch(() => {});
}
void sawHostAlone;
console.log(`elapsed ${((Date.now() - run0) / 1000).toFixed(0)} s`);
console.log(fails.length ? `${fails.length} failed` : 'all passed');
process.exit(fails.length ? 1 : 0);
