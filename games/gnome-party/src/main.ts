// Gnome Party: renderer, loop, and the wiring of menu / net / flow / board view / hud / minigame runner.
// Modules live one per file; this file only connects them.
import * as THREE from 'three';
import { GNORMAN_LOOK, getMyGnome, loadMyGnome, resolveLook } from '@lawn/gnome';
import { createPad, seedFrom, startMinigame, type Runner, type SeatIndex } from '@lawn/party';
import { BOARD, CPU_NAMES, SEAT_COLORS, type PartyMsg, type PartyState, type Seat } from './config';
import { MINIGAMES, minigameById } from './minigames';
import { createBoardView } from './board/view';
import { createFlow, newParty, type Flow } from './party/flow';
import { createNet, type MatchInfo } from './net';
import { createMenu } from './ui/menu';
import { createHud } from './ui/hud';

await loadMyGnome();

// No page zoom or scroll on phones; elements marked data-scroll (and inputs) keep their touch handling.
const cancelTouch = (e: TouchEvent): void => {
  const target = e.target as Element | null;
  if (target?.closest?.('[data-scroll], input, textarea, select')) return;
  if (e.cancelable) e.preventDefault();
};
document.addEventListener('touchstart', cancelTouch, { passive: false });
document.addEventListener('touchend', cancelTouch, { passive: false });
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: location.hash.includes('snap') });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 5000);

function resize(): void {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const pad = createPad(canvas);
const boardView = createBoardView(camera);
const net = createNet();

// ------------------------------------------------------------------ party state
let state: PartyState | null = null;
let flow: Flow | null = null;
let mySeat: SeatIndex | null = null;
let online = false;
/** v = the minigame's seed; snap/in messages carry it so stray ones from an older minigame are dropped. */
let runner: { mini: string; v: number; runner: Runner; scene: THREE.Scene } | null = null;

const hud = createHud(ui, {
  onRoll() {
    if (!state || state.phase.p !== 'roll' || mySeat === null) return;
    if (flow) flow.roll(mySeat);
    else net.sendToHost({ k: 'roll' });
  },
  onBackToMenu: () => endParty(),
});

const menu = createMenu(ui, MINIGAMES.map((m) => ({ id: m.meta.id, title: m.meta.title })), {
  onSolo(rounds) {
    startSolo(rounds, false, menu.pool());
  },
  onQuickMatch(name) {
    menu.show('waiting');
    net.quickMatch(name);
  },
  onRoom(code, name) {
    menu.show('waiting');
    net.joinRoom(code, name);
  },
  onLeave() {
    endParty(); // leaves the online match too (endParty calls net.leave when online)
  },
});
menu.setOnlineAvailable(!net.unavailable);
menu.show('title');
net.onStatus((s) => menu.setStatus(s));

function seatLook(color: number, look = GNORMAN_LOOK): Seat['look'] {
  return { ...look, hat: color };
}

function cpuSeat(seat: SeatIndex): Seat {
  return { seat, name: CPU_NAMES[seat], look: seatLook(SEAT_COLORS[seat]), color: SEAT_COLORS[seat], cpu: true, playerId: null };
}

function startSolo(rounds: number, allCpu: boolean, pool?: readonly string[]): void {
  const mine = getMyGnome();
  const seats: Seat[] = ([0, 1, 2, 3] as SeatIndex[]).map((k) => cpuSeat(k));
  if (!allCpu) {
    seats[0] = { seat: 0, name: mine?.name ?? 'You', look: seatLook(SEAT_COLORS[0], mine?.look), color: SEAT_COLORS[0], cpu: false, playerId: null };
  }
  online = false;
  mySeat = allCpu ? null : 0;
  const seed = Date.now() & 0x7fffffff;
  flow = createFlow(newParty(seats, rounds, seed, pool), onChange);
  onChange(structuredClone(flow.state)); // show the board and HUD now, not after the first resend
  menu.show('hidden');
}

/** Host: every state the flow produces. */
function onChange(s: PartyState): void {
  apply(s);
  if (online && net.isHost) net.broadcast({ k: 'party', s });
}

function apply(s: PartyState): void {
  if (state && s.v < state.v) return;
  state = s;
  (window as unknown as { party: PartyState }).party = s;
  syncRunner();
  hud.show(s, mySeat);
}

function disposeRunner(): void {
  if (!runner) return;
  runner.runner.dispose();
  runner = null;
}

/** Starts the runner when the phase is 'mini', and disposes it otherwise. */
function syncRunner(): void {
  if (!state) return;
  const ph = state.phase;
  if (ph.p !== 'mini') {
    disposeRunner();
    return;
  }
  // One runner per minigame: identified by its seed, so a party resend (or a seat turning CPU) does not restart it.
  if (runner && runner.mini === ph.mini && runner.v === ph.seed) return;
  disposeRunner();
  const def = minigameById(ph.mini);
  if (!def) {
    console.error(`Unknown party slice "${ph.mini}"`);
    if (flow) flow.miniFinished([0, 0, 0, 0]);
    return;
  }
  const scene = new THREE.Scene();
  const v = ph.seed;
  const isHost = !online || net.isHost;
  const r = startMinigame({
    def,
    scene,
    camera,
    renderer,
    uiParent: ui,
    seats: state.seats,
    mySeat,
    isHost,
    seed: ph.seed,
    pad: () => padState,
    sendSnapshot: online ? (t, s) => net.broadcast({ k: 'snap', v, t, s }) : null,
    sendInput: online ? (i) => net.sendToHost({ k: 'in', v, i }) : null,
    onDone: (places) => flow?.miniFinished(places),
  });
  runner = { mini: ph.mini, v, runner: r, scene };
}

function seatOf(playerId: number): SeatIndex | null {
  const s = state?.seats.find((x) => x.playerId === playerId);
  return s ? s.seat : null;
}

function endParty(): void {
  if (online) net.leave();
  disposeRunner();
  flow = null;
  state = null;
  mySeat = null;
  online = false;
  hud.hide();
  menu.show('title');
}

// ------------------------------------------------------------------ online
net.onMatch((m: MatchInfo) => {
  online = true;
  const seats: Seat[] = ([0, 1, 2, 3] as SeatIndex[]).map((k) => {
    const p = m.players[k];
    if (!p) return cpuSeat(k);
    return { seat: k, name: p.name, look: seatLook(p.color, resolveLook(p) ?? GNORMAN_LOOK), color: p.color, cpu: false, playerId: p.id };
  });
  mySeat = seats.find((s) => s.playerId === m.you)?.seat ?? null;
  state = null;
  menu.show('hidden');
  if (m.hostId === m.you) {
    // The host's mini-game choice is the party's; it travels in PartyState.pool, so a new host keeps it.
    flow = createFlow(newParty(seats, BOARD.defaultRounds, m.seed & 0x7fffffff, menu.pool()), onChange);
    onChange(structuredClone(flow.state)); // the host's first state goes out now, not after the first resend
  } else {
    // Until the host's first broadcast (v:1), keep a local copy so this client can take over if the host drops.
    state = { ...newParty(seats, BOARD.defaultRounds, m.seed & 0x7fffffff), v: 0 };
  }
});

net.onMessage((from, m: PartyMsg) => {
  if (net.isHost && flow) {
    const seat = seatOf(from);
    if (seat === null) return;
    if (m.k === 'roll') flow.roll(seat);
    else if (m.k === 'in' && runner && runner.v === m.v) runner.runner.receiveInput(seat, m.i);
    return;
  }
  if (m.k === 'party') apply(m.s);
  else if (m.k === 'snap' && runner && runner.v === m.v) runner.runner.receiveSnapshot(m.t, m.s);
});

net.onLeft((id) => {
  const seat = seatOf(id);
  if (seat === null) return;
  flow?.setCpu(seat);
  runner?.runner.setCpu(seat);
  // Keep the local copy in step too: a client about to become host needs the seat already CPU.
  if (state) {
    const s = state.seats[seat];
    s.cpu = true;
    s.playerId = null;
  }
});

net.onHost((hostId) => {
  if (hostId !== net.myId || !state || flow) return;
  flow = createFlow(state, onChange);
  runner?.runner.becomeHost();
});

net.onLost((reason) => {
  console.warn('Party lost:', reason);
  endParty();
});

// ------------------------------------------------------------------ dev hashes
const hash = location.hash;
const roundsMatch = /rounds=(\d+)/.exec(hash);
const miniMatch = /mini=([a-z0-9-]+)/.exec(hash);
if (miniMatch) {
  // #mini=<id>: that slice against 3 CPUs, again and again (places to the console).
  const def = minigameById(miniMatch[1]) ?? MINIGAMES[0];
  menu.show('hidden');
  let n = 0;
  const loopMini = (): void => {
    const mine = getMyGnome();
    const seats: Seat[] = ([0, 1, 2, 3] as SeatIndex[]).map((k) => cpuSeat(k));
    seats[0] = { seat: 0, name: mine?.name ?? 'You', look: seatLook(SEAT_COLORS[0], mine?.look), color: SEAT_COLORS[0], cpu: false, playerId: null };
    mySeat = 0;
    const seed = seedFrom(Date.now(), n++);
    const fake: PartyState = { ...newParty(seats, 1, seed), phase: { p: 'mini', mini: def.meta.id, seed } };
    state = fake;
    const scene = new THREE.Scene();
    const r = startMinigame({
      def, scene, camera, renderer, uiParent: ui, seats, mySeat, isHost: true, seed,
      pad: () => padState, sendSnapshot: null, sendInput: null,
      onDone(places) {
        console.log(`${def.meta.id} places`, places);
        setTimeout(() => { disposeRunner(); loopMini(); }, 2000);
      },
    });
    runner = { mini: def.meta.id, v: -1, runner: r, scene };
  };
  loopMini();
} else if (hash.includes('cpu')) {
  startSolo(roundsMatch ? Number(roundsMatch[1]) : BOARD.defaultRounds, true, menu.pool());
} else if (roundsMatch) {
  startSolo(Number(roundsMatch[1]), false, menu.pool());
}

// ------------------------------------------------------------------ loop
let padState = pad.read();
let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  padState = pad.read();
  net.update(dt);
  if (flow && !miniMatch) flow.update(dt);
  // Between host broadcasts (1 s apart) nobody else counts phase.left down; the board's move animation reads it.
  // apply() replaces state with each new broadcast, which resets it to the host's value.
  if (state && 'left' in state.phase) state.phase.left = Math.max(0, state.phase.left - dt);
  hud.update(dt);
  // On the host, the update that finishes a minigame reaches flow.miniFinished -> syncRunner, which disposes the
  // runner and sets it to null. Read `runner` again after updating, or this frame throws and the loop stops.
  runner?.runner.update(dt);
  if (runner) {
    renderer.render(runner.scene, camera);
  } else {
    if (state) boardView.render(state, dt);
    renderer.render(boardView.scene, camera);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
