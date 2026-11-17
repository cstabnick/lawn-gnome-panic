// Gnome Blackjack: renderer, camera, the host/client loop. Rules live in table.ts, the look in scene.ts, UI in hud.ts.
// Online by default: the page joins the public table at once (or ?room=CODE); offline it plays the same table with CPUs.
// The host's browser runs the rules; everyone else renders the host's snapshots and sends their clicks.
import * as THREE from 'three';
import { getMyGnome } from '@lawn/gnome';
import { createVolumeButton } from '@arcade/volume';
import { DEALER, LOCAL_ID, SNAPSHOT_EVERY_S, TIME_LOW_S, type TableEvent, type TableInput, type TableState } from './config';
import { DEALER_CHAR } from './characters';
import { addBubble, applyInput, fillCpus, mySeatIndex, newTable, removeHuman, seatHuman, snapshot, tickTable } from './table';
import { banterFor } from './banter';
import { mutter, sfx, unlockAudio } from './mutter';
import { initMusic } from './music';
import { createTableView } from './scene';
import { createCameraRig, type CameraRig } from './camera';
import { createHud } from './hud';
import { createNet } from './net';
import { volume } from './volume';

// Phones: no pinch zoom, double-tap zoom or page scroll. Buttons still get their clicks (pointer events);
// the chat input keeps focus and typing because touches on inputs are left alone.
const cancelTouch = (e: TouchEvent): void => {
  const t = e.target as Element | null;
  if (t?.closest?.('input, textarea, [data-scroll]')) return;
  if (e.cancelable && e.touches.length > 1) e.preventDefault();
};
document.addEventListener('touchstart', cancelTouch, { passive: false });
document.addEventListener('touchmove', (e) => { if (e.cancelable) e.preventDefault(); }, { passive: false });
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x140d08);
const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 100);

function resize(): void {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  rig.resize();
}
window.addEventListener('resize', resize);

const view = createTableView(scene);
const rig: CameraRig = createCameraRig(camera, canvas, ui, view);
resize();
const me = getMyGnome();
const GUEST_NAMES = ['Gnewbie', 'Pip', 'Bramble', 'Toadwick', 'Fennel', 'Burdock', 'Clover', 'Nutmeg', 'Sprout', 'Gnimble'];
const myName = me?.name ?? GUEST_NAMES[Math.floor(Math.random() * GUEST_NAMES.length)];
const myCharacter = me?.code ?? '';
const MY_COLOR = 0xffd54f;

let st: TableState = newTable((Math.random() * 2 ** 32) >>> 0);
let myId = LOCAL_ID;
let isHost = true;
let online = false;
let dirty = true;
let snapAcc = 0;

function openLocalTable(): void {
  st = newTable((Math.random() * 2 ** 32) >>> 0);
  myId = LOCAL_ID;
  isHost = true;
  seatHuman(st, LOCAL_ID, myName, myCharacter, MY_COLOR);
  handle(fillCpus(st));
}

/** Host only: banter for each event, and mark the table changed. */
function handle(events: TableEvent[]): void {
  if (events.length === 0) return;
  dirty = true;
  for (const ev of events) {
    const line = banterFor(st, ev, Math.random);
    if (line) addBubble(st, line.seat, line.text);
    if (ev.e === 'result' && ev.seat === mySeatIndex(st, myId)) sfx(ev.delta > 0 ? 'win' : ev.delta < 0 ? 'lose' : 'chip');
  }
}

const net = createNet({
  onMatch(you, hostId, players) {
    online = true;
    myId = you;
    isHost = you === hostId;
    st = newTable((Math.random() * 2 ** 32) >>> 0);
    if (isHost) {
      for (const p of [...players].sort((a, b) => a.id - b.id)) seatHuman(st, p.id, p.name, p.character, p.id === you ? MY_COLOR : p.color);
      handle(fillCpus(st));
    }
    lastBubble = isHost ? 0 : Infinity; // a client's first snapshot sets it, so old lines are not muttered
  },
  onJoined(p) {
    if (isHost) handle(seatHuman(st, p.id, p.name, p.character, p.color).events);
  },
  onLeft(id) {
    // Clients apply it too, so a client that becomes host next does not keep a ghost seat.
    const ev = removeHuman(st, id);
    if (isHost) handle(ev);
  },
  onHost(hostId) {
    if (hostId === myId && !isHost) {
      isHost = true;
      dirty = true;
    }
  },
  onSnapshot(s) {
    if (isHost) return;
    if (lastBubble === Infinity) lastBubble = s.bubbles.reduce((m, b) => Math.max(m, b.id), 0);
    st = s;
  },
  onInput(from, i) {
    if (!isHost) return;
    const seat = mySeatIndex(st, from);
    if (seat >= 0) handle(applyInput(st, seat, i));
  },
  onChat(from, text) {
    if (!isHost) return;
    const seat = mySeatIndex(st, from);
    if (seat >= 0) {
      addBubble(st, seat, text);
      dirty = true;
    }
  },
  onLost() {
    // Keep playing offline: everyone else's seat goes back to a CPU.
    online = false;
    isHost = true;
    for (const s of st.seats) if (s && !s.cpu && s.id !== myId) handle(removeHuman(st, s.id));
  },
});

function sendInput(i: TableInput): void {
  unlockAudio();
  if (isHost) handle(applyInput(st, mySeatIndex(st, myId), i));
  else net.sendInput(i);
}

const hud = createHud(ui, {
  input: sendInput,
  chat(text) {
    if (/^\/(?:shoot(?:\s+dealer)?|shotgun)$/i.test(text.trim())) {
      sendInput({ k: 'shoot' });
      return;
    }
    if (online) net.chat(text);
    else {
      addBubble(st, mySeatIndex(st, myId), text);
      dirty = true;
    }
  },
  joinRoom(code) {
    if (net.available()) net.start(code, myName, myCharacter);
  },
  quickMatch() {
    if (net.available()) net.start(null, myName, myCharacter);
  },
});
const volBox = document.createElement('div');
volBox.style.cssText = 'position:fixed;top:8px;right:8px;pointer-events:auto;z-index:5';
ui.appendChild(volBox);
createVolumeButton(volBox, volume, { title: 'Volume (M mute all, N mute music)' });
initMusic();
window.addEventListener('pointerdown', unlockAudio);
window.addEventListener('keydown', unlockAudio);

openLocalTable();
const room = /[?&#]room=([A-Za-z0-9]{4,8})/.exec(location.search + location.hash)?.[1]?.toUpperCase() ?? null;
if (net.available() && !location.hash.includes('offline') && !location.search.includes('offline')) net.start(room, myName, myCharacter);
(window as unknown as { bj: () => TableState }).bj = () => st;

// ---------------------------------------------------------------- loop
let lastBubble = 0;
let lastCards = 0;
let lastTick = -1;
let lastShotAt = -1;
const tmp = new THREE.Vector3();

function headScreen(seat: number): { x: number; y: number } | null {
  // First person: my own head is the camera, so my plate and bubbles sit at the bottom of the screen.
  if (seat >= 0 && seat === mySeatIndex(st, myId) && rig.mode === 'first') {
    const self = rig.selfScreen();
    if (self) return self;
  }
  view.headPos(seat, tmp).project(camera);
  if (tmp.z > 1) return null;
  return { x: (tmp.x * 0.5 + 0.5) * window.innerWidth, y: (-tmp.y * 0.5 + 0.5) * window.innerHeight };
}

function voiceOf(seat: number): number {
  if (seat === DEALER) return DEALER_CHAR.voice;
  return st.seats[seat]?.voice ?? 100;
}

let last = performance.now();
/** One update. The table's clocks use real time (up to 1 s a step), so a slow phone or a hidden host tab
 *  (ticked once a second by the timer below) keeps the 15 s clocks honest for everyone. Animation uses at most 0.05 s. */
function step(render: boolean): void {
  const now = performance.now();
  const real = Math.min((now - last) / 1000, 1);
  const dt = Math.min(real, 0.05);
  last = now;

  if (isHost) {
    handle(tickTable(st, real));
    snapAcc += real;
    if (online && (dirty || snapAcc >= SNAPSHOT_EVERY_S)) {
      net.sendSnapshot(snapshot(st));
      snapAcc = 0;
    }
    dirty = false;
  } else {
    // Between snapshots, run the clocks locally so timers and bubbles move smoothly.
    st.t += real;
    st.timer = Math.max(0, st.timer - real);
  }
  net.update(dt);
  if (!render) {
    // Hidden: lines said meanwhile are not muttered all at once on return.
    for (const b of st.bubbles) lastBubble = Math.max(lastBubble, b.id);
    return;
  }

  // Sound from what the table shows, so host and clients hear the same.
  for (const b of st.bubbles) {
    if (b.id > lastBubble) {
      lastBubble = b.id;
      mutter(b.text, voiceOf(b.seat));
    }
  }
  const cards = st.dealer.length + st.seats.reduce((n, s) => n + (s?.hand?.cards.length ?? 0), 0);
  if (cards > lastCards) sfx('card');
  lastCards = cards;
  if (st.dealerShot && st.t - st.dealerShot.at >= 0.3 && st.dealerShot.at !== lastShotAt) {
    lastShotAt = st.dealerShot.at;
    sfx('shotgun');
  }
  const mySeat = mySeatIndex(st, myId);
  const secs = Math.ceil(st.timer);
  if (st.phase === 'playing' && st.turn === mySeat && st.timer <= TIME_LOW_S && secs !== lastTick) sfx('tick');
  lastTick = secs;

  rig.update(dt, mySeat, now / 1000);
  view.hideSeat(rig.mode === 'first' ? mySeat : -1);
  view.sync(st, dt);
  hud.update({ st, mySeat, net: net.status, headScreen });
  renderer.render(scene, camera);
}
const frame = (): void => {
  step(true);
  requestAnimationFrame(frame);
};
requestAnimationFrame(frame);
// requestAnimationFrame stops in a hidden tab: keep the table (and the host's snapshots) going.
setInterval(() => {
  if (document.hidden) step(false);
}, 1000);
