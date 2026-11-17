// Gnome Blackjack: renderer, camera, the host/client loop. Rules live in table.ts, the look in scene.ts, UI in hud.ts.
// Online by default: the page joins the public table at once (or ?room=CODE); offline it plays the same table with CPUs.
// The host's browser runs the rules; everyone else renders the host's snapshots and sends their clicks.
import * as THREE from 'three';
import type { PlayerInfo } from '@lawn/mp/protocol';
import { createGnomeModel, getMyGnome, GNORMAN_LOOK } from '@lawn/gnome';
import { createVolumeButton } from '@arcade/volume';
import { DEALER, LOCAL_ID, SNAPSHOT_EVERY_S, START_CHIPS, TIME_LOW_S, type TableEvent, type TableInput, type TableState } from './config';
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
import { SLOT_PLACEMENTS, createSlotsView } from './slots/view';
import { newSlotState, setSlotBet, startSpin, tickSlots } from './slots/engine';
import { slotSfx } from './slots/audio';
import { createSlotsHud } from './slots/hud';

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
const slotsView = createSlotsView(scene);
const rig: CameraRig = createCameraRig(camera, canvas, ui, view);
resize();
const me = getMyGnome();
const GUEST_NAMES = ['Gnewbie', 'Pip', 'Bramble', 'Toadwick', 'Fennel', 'Burdock', 'Clover', 'Nutmeg', 'Sprout', 'Gnimble'];
const myName = me?.name ?? GUEST_NAMES[Math.floor(Math.random() * GUEST_NAMES.length)];
const myCharacter = me?.code ?? '';
const MY_COLOR = 0xffd54f;

// Standing gnome model shown beside the active slot machine when the player stands up from the table
const slotsGnome = createGnomeModel(me?.look ?? GNORMAN_LOOK);
slotsGnome.object.visible = false;
scene.add(slotsGnome.object);
const slotsGnomePose = {
  position: new THREE.Vector3(),
  velocity: new THREE.Vector3(),
  facing: 0,
  grounded: true,
  jumpsUsed: 0,
};

let st: TableState = newTable((Math.random() * 2 ** 32) >>> 0);
let myId = LOCAL_ID;
let isHost = true;
let online = false;
let dirty = true;
let snapAcc = 0;
/** Host: a seat's look changed since the last snapshot (sent at LOOK_SEND_S, not every frame). */
let lookDirty = false;
const LOOK_SEND_S = 0.1;
let lookAcc = 0;
let sentLook: [number, number] | null = null;
let lastPlayers: PlayerInfo[] = [];
let hasSnapshot = false;

function openLocalTable(): void {
  st = newTable((Math.random() * 2 ** 32) >>> 0);
  myId = LOCAL_ID;
  isHost = true;
  seatHuman(st, LOCAL_ID, myName, myCharacter, MY_COLOR);
  handle(fillCpus(st));
  if (typeof st.musicSeed === 'number') music?.setSeed(st.musicSeed);
}

/** Host only: banter for each event, and mark the table changed. */
function handle(events: TableEvent[]): void {
  if (events.length === 0) return;
  dirty = true;
  for (const ev of events) {
    const line = banterFor(st, ev, Math.random);
    if (line) addBubble(st, line.seat, line.text);
    if (ev.e === 'result' && ev.hand === 0 && ev.seat === mySeatIndex(st, myId)) sfx(ev.delta > 0 ? 'win' : ev.delta < 0 ? 'lose' : 'chip');
  }
}

const net = createNet({
  onMatch(you, hostId, players) {
    online = true;
    myId = you;
    isHost = you === hostId;
    lastPlayers = [...players];
    hasSnapshot = isHost;
    st = newTable((Math.random() * 2 ** 32) >>> 0);
    if (isHost) {
      for (const p of [...players].sort((a, b) => a.id - b.id)) seatHuman(st, p.id, p.name, p.character, p.id === you ? MY_COLOR : p.color);
      handle(fillCpus(st));
      if (typeof st.musicSeed === 'number') music?.setSeed(st.musicSeed);
    }
    lastBubble = isHost ? 0 : Infinity; // a client's first snapshot sets it, so old lines are not muttered
  },
  onJoined(p) {
    if (!lastPlayers.some((x) => x.id === p.id)) lastPlayers.push(p);
    if (isHost) handle(seatHuman(st, p.id, p.name, p.character, p.color).events);
  },
  onLeft(id) {
    lastPlayers = lastPlayers.filter((x) => x.id !== id);
    // Clients apply it too, so a client that becomes host next does not keep a ghost seat.
    const ev = removeHuman(st, id);
    if (isHost) handle(ev);
  },
  onHost(hostId) {
    if (hostId === myId && !isHost) {
      isHost = true;
      if (!hasSnapshot) {
        for (const p of [...lastPlayers].sort((a, b) => a.id - b.id)) seatHuman(st, p.id, p.name, p.character, p.id === myId ? MY_COLOR : p.color);
        handle(fillCpus(st));
      }
      dirty = true;
    }
  },
  onSnapshot(s) {
    if (isHost) return;
    hasSnapshot = true;
    if (lastBubble === Infinity) lastBubble = s.bubbles.reduce((m, b) => Math.max(m, b.id), 0);
    st = s;
    if (typeof s.musicSeed === 'number') music?.setSeed(s.musicSeed);
  },
  onInput(from, i) {
    if (!isHost) return;
    const seat = mySeatIndex(st, from);
    if (seat < 0) return;
    handle(applyInput(st, seat, i));
    if (i.k === 'look') lookDirty = true;
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
  if (i.k !== 'look') unlockAudio();
  if (isHost) {
    handle(applyInput(st, mySeatIndex(st, myId), i));
    if (i.k === 'look') lookDirty = true;
  } else net.sendInput(i);
}

/** First person: tell the table where I am looking, at most every LOOK_SEND_S and only when it moved. */
function sendLook(dt: number): void {
  lookAcc += dt;
  if (lookAcc < LOOK_SEND_S) return;
  const l = rig.look();
  const moved = (a: [number, number] | null, b: [number, number] | null): boolean =>
    !a || !b ? a !== b : Math.abs(a[0] - b[0]) > 0.02 || Math.abs(a[1] - b[1]) > 0.02;
  if (!moved(l, sentLook)) return;
  lookAcc = 0;
  sentLook = l ? [l[0], l[1]] : null;
  sendInput({ k: 'look', yaw: l?.[0] ?? 0, pitch: l?.[1] ?? 0 });
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
  playOffline() {
    net.leave();
    online = false;
    openLocalTable();
  },
  standUpToSlots() {
    standUpToSlots();
  },
});

// ---------------------------------------------------------------- slots state & HUD
let activity: 'blackjack' | 'slots' = 'blackjack';
let myChips = START_CHIPS;
let activeMachineId = SLOT_PLACEMENTS[0].id;
const slotStates = new Map(
  SLOT_PLACEMENTS.map((p, i) => [p.id, newSlotState(p.id, p.machineType, ((Math.random() * 2 ** 32) >>> 0) + i)]),
);
let reelTickAcc = 0;

function activeSlotState() {
  return slotStates.get(activeMachineId)!;
}

function selectSlotMachine(machineId: string): void {
  if (!slotStates.has(machineId)) return;
  activeMachineId = machineId;
  const spot = slotsView.gnomeSpot(machineId);
  slotsGnomePose.position.copy(spot.pos);
  slotsGnomePose.facing = spot.facing;
  if (activity === 'slots') {
    rig.setOverride(slotsView.cameraTarget(machineId));
  }
}

function standUpToSlots(machineId = activeMachineId): void {
  unlockAudio();
  const seat = mySeatIndex(st, myId);
  if (seat >= 0 && st.seats[seat]) {
    myChips = st.seats[seat]!.chips;
  }
  if (activity === 'blackjack') {
    if (online) {
      net.leave();
      online = false;
      isHost = true;
    }
    if (seat >= 0) {
      handle(removeHuman(st, myId));
      handle(fillCpus(st));
    }
    activity = 'slots';
    slotsGnome.object.visible = true;
    slotSfx.coinIn();
  }
  selectSlotMachine(machineId);
}

function sitBackAtBlackjack(): void {
  if (activity !== 'slots') return;
  activity = 'blackjack';
  slotsGnome.object.visible = false;
  rig.setOverride(null);
  if (mySeatIndex(st, myId) < 0) {
    handle(seatHuman(st, myId, myName, myCharacter, MY_COLOR, myChips).events);
  }
}

const slotsHud = createSlotsHud(ui, {
  spin() {
    unlockAudio();
    const s = activeSlotState();
    const res = startSpin(s, myChips);
    if (!res.ok) return;
    myChips -= res.cost;
    reelTickAcc = 0;
    slotsView.triggerPull(activeMachineId);
    slotSfx.leverPull();
    slotSfx.coinIn();
  },
  setBet(amount) {
    unlockAudio();
    setSlotBet(activeSlotState(), amount, myChips);
    slotSfx.coinIn();
  },
  selectMachine(machineId) {
    unlockAudio();
    selectSlotMachine(machineId);
  },
  backToBlackjack() {
    sitBackAtBlackjack();
  },
  rebuy() {
    unlockAudio();
    myChips += 100;
    slotSfx.coinIn();
  },
});

// Allow clicking any 3D slot machine in the lounge to walk over and play it
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let downX = 0;
let downY = 0;
canvas.addEventListener('pointerdown', (e) => {
  downX = e.clientX;
  downY = e.clientY;
});
canvas.addEventListener('pointerup', (e) => {
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
  ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hitId = slotsView.pick(raycaster);
  if (hitId) standUpToSlots(hitId);
});
const volBox = document.createElement('div');
volBox.style.cssText = 'position:fixed;top:8px;right:8px;pointer-events:auto;z-index:5';
ui.appendChild(volBox);
createVolumeButton(volBox, volume, { title: 'Volume (M mute all, N mute music)' });
const music = initMusic(st.musicSeed);
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
    if (online && (dirty || snapAcc >= SNAPSHOT_EVERY_S || (lookDirty && snapAcc >= LOOK_SEND_S))) {
      net.sendSnapshot(snapshot(st));
      snapAcc = 0;
      lookDirty = false;
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
  const cards = st.dealer.length + st.seats.reduce((n, s) => n + (s?.hands.reduce((m, h) => m + h.cards.length, 0) ?? 0), 0);
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
  sendLook(dt);
  view.hideSeat(rig.mode === 'first' && activity === 'blackjack' ? mySeat : -1);
  view.sync(st, dt);

  // Tick & render slots
  const curSlot = activeSlotState();
  if (activity === 'slots') {
    const { events, payout } = tickSlots(curSlot, dt);
    if (payout > 0) myChips += payout;
    for (const ev of events) {
      if (ev.e === 'reel-stop') slotSfx.reelStop(ev.reel, ev.matchSoFar);
      else if (ev.e === 'anticipation') slotSfx.anticipation();
      else if (ev.e === 'win') {
        if (ev.jackpot) slotSfx.jackpot();
        else slotSfx.win(ev.multiplier);
      } else if (ev.e === 'lose') slotSfx.lose();
    }
    if (curSlot.phase === 'spinning') {
      reelTickAcc += dt;
      if (reelTickAcc >= 0.095) {
        reelTickAcc = 0;
        slotSfx.reelTick();
      }
    }
    slotsGnome.update(slotsGnomePose, dt);
  }
  slotsView.sync(activeMachineId, curSlot, dt);

  hud.update({ st, mySeat, net: net.status, headScreen, hidden: activity === 'slots' });
  slotsHud.update(activity === 'slots', curSlot, myChips);
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
