// Two headless Edge pages join one Gnome Front match on a local mp-server and check they see each other.
// Needs: npm run dev -w packages/mp-server, npm run dev -w games/gnome-front. Usage: node tools/gnome-front-mp-e2e.mjs [gameUrl]
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL_ = process.argv[2] ?? 'http://localhost:5182/';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch(port) {
  const dir = mkdtempSync(join(tmpdir(), 'gf-e2e-'));
  const proc = spawn(EDGE, ['--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', `--remote-debugging-port=${port}`,
    `--user-data-dir=${dir}`, '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--mute-audio', URL_], { stdio: 'ignore' });
  let target;
  for (let i = 0; i < 60 && !target; i++) {
    await wait(500);
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = list.find((t) => t.type === 'page' && t.url.startsWith(URL_));
    } catch { /* not up yet */ }
  }
  if (!target) throw new Error('no page on ' + port);
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0;
  const pending = new Map();
  const errors = [];
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map((a) => a.value ?? a.description).join(' '));
  });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable');
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result.exceptionDetails) throw new Error(expr + ' -> ' + JSON.stringify(r.result.exceptionDetails.exception?.description));
    return r.result.result.value;
  };
  return { proc, ev, errors };
}

const STATE = `(() => { const g = window.game; return {
  me: g.player.id, team: g.player.team, alive: g.player.alive, x: g.player.pos.x, z: g.player.pos.z,
  remotes: g.soldiers.filter(s => s.remote).map(s => ({ id: s.id, name: s.name, x: s.pos.x, z: s.pos.z, alive: s.alive })),
  time: g.time, tickets: g.tickets, status: document.getElementById('gf-online')?.textContent?.slice(0, 120),
  bots: g.soldiers.filter(s => !s.remote && !s.isPlayer && s.alive).length,
}; })()`;

const fails = [];
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) fails.push(msg); };

const a = await launch(9301);
const b = await launch(9302);
try {
  await wait(3000);
  const join = (name) => `(() => { const p = document.getElementById('gf-online'); const ins = p.querySelectorAll('input');
    ins[0].value = '${name}'; ins[0].dispatchEvent(new Event('input'));
    const btn = [...p.querySelectorAll('button')].find(b => /QUICK/.test(b.textContent)); btn.click(); return true; })()`;
  await a.ev(join('Alfa'));
  await wait(500);
  await b.ev(join('Bravo'));
  // Public queue starts 15 s after the first player.
  let sa, sb;
  for (let i = 0; i < 40; i++) {
    await wait(1000);
    sa = await a.ev(STATE);
    sb = await b.ev(STATE);
    if (sa.remotes.length && sb.remotes.length && sa.time > 1 && sb.time > 1) break;
  }
  console.log('A', JSON.stringify(sa));
  console.log('B', JSON.stringify(sb));
  check(sa.remotes.length === 1 && sb.remotes.length === 1, 'each page sees exactly one remote human');
  check(sa.me !== sb.me, 'the two players have different soldier slots');
  check(sa.remotes[0]?.id === sb.me && sb.remotes[0]?.id === sa.me, 'each sees the other in the right slot');
  check(sa.remotes[0]?.name === 'Bravo' && sb.remotes[0]?.name === 'Alfa', 'remote names are the player names');
  check(sa.team !== sb.team, 'players are on opposite teams');

  // Guest walks forward for 2 s; the host should see it move.
  const host = sa.time > 0 ? a : b;
  const hostIsA = true;
  void host; void hostIsA;
  const before = await b.ev(STATE);
  await b.ev(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' })); true`);
  await wait(2000);
  await b.ev(`window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' })); true`);
  await wait(800);
  const afterB = await b.ev(STATE);
  const afterA = await a.ev(STATE);
  const movedB = Math.hypot(afterB.x - before.x, afterB.z - before.z);
  console.log('B moved locally', movedB.toFixed(2));
  const seen = afterA.remotes[0];
  const gap = seen ? Math.hypot(seen.x - afterB.x, seen.z - afterB.z) : 999;
  check(movedB > 3 || !afterB.alive, 'B walks on its own screen');
  check(gap < 1.5 || !afterB.alive, `A sees B where B is (gap ${gap.toFixed(2)})`);
  const gap2 = Math.hypot(afterB.remotes[0].x - afterA.x, afterB.remotes[0].z - afterA.z);
  check(gap2 < 1.5 || !afterA.alive, `B sees A where A is (gap ${gap2.toFixed(2)})`);
  check(Math.abs(afterA.tickets[0] - afterB.tickets[0]) <= 1 && Math.abs(afterA.tickets[1] - afterB.tickets[1]) <= 1, 'tickets agree');
  check(afterA.bots >= 10 && afterB.bots >= 10, `bots alive on both (${afterA.bots}, ${afterB.bots})`);
  // Let the match run a while for runtime errors (bots fight, guests apply events).
  await wait(10000);
  const endA = await a.ev(STATE);
  const endB = await b.ev(STATE);
  console.log('clock A', afterA.time, endA.time, 'B', afterB.time, endB.time);
  check(endB.time > afterB.time && Math.abs(endB.time - endA.time) < 0.5, 'guest clock runs and follows the host');
  check(Math.abs(endA.tickets[0] - endB.tickets[0]) <= 1, `tickets still agree (${endA.tickets} vs ${endB.tickets})`);
  console.log('errors A:', a.errors.slice(0, 5));
  console.log('errors B:', b.errors.slice(0, 5));
  check(a.errors.length === 0 && b.errors.length === 0, 'no page errors');
} finally {
  a.proc.kill();
  b.proc.kill();
}
console.log(fails.length ? `E2E FAILED (${fails.length})` : 'E2E OK');
process.exit(fails.length ? 1 : 0);
