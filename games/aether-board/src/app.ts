// Aether Board: wiring and the loop. The board simulates at a fixed SIM_HZ; rendering interpolates between steps,
// so motion is smooth at any frame rate. Click (or pad A) to ride: the pointer locks and the mouse becomes the
// trick stick. Losing the lock (Esc) pauses.
// ?mode=descent is the roguelite: pick a hill card, ride it to the gate, crashes cost lives, harder hills pay more.
import * as THREE from 'three';
import { createVolumeButton } from '@arcade/volume';
import { ASSIST, SIM_HZ, type PhysEvent } from './config';
import { generateWorld, type World } from './world';
import { createPlayer, stepPlayer } from './physics';
import { createCombo, createRecognizer } from './tricks';
import { createInput } from './input';
import { createChaseCam } from './camera';
import { createWorldView } from './view/world';
import { createRider } from './view/rider';
import { createCrowd } from './view/crowd';
import { createFx } from './view/fx';
import { createHud, type GameState } from './hud';
import { createTrickBook } from './trickbook';
import { createAudio } from './audio';
import { createCheatBuffer, DENSHATTACK_CODE } from './cheat';
import { volume } from './volume';
import { DESCENT, type HillCard, type RunState } from './descent/types';
import { choosePerk, crash, createRun, finishHill, offerHills, startHill } from './descent/run';
import { applyPerks } from './descent/perks';
import { createDescentUi, createModeSwitch } from './descent/ui';

// Phones: no pinch zoom, no double-tap zoom, no page scroll (iOS ignores user-scalable=no in the viewport tag).
// Elements marked data-scroll (the trick book) keep one-finger scrolling.
const scrollable = (t: EventTarget | null): boolean => !!(t as Element | null)?.closest?.('[data-scroll]');
document.addEventListener('touchstart', (e) => {
  if (e.touches.length > 1 && e.cancelable) e.preventDefault();
}, { passive: false });
document.addEventListener('touchmove', (e) => {
  if (e.cancelable && (e.touches.length > 1 || !scrollable(e.target))) e.preventDefault();
}, { passive: false });
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = performance.now();
  if (now - lastTouchEnd < 350 && e.cancelable && !scrollable(e.target)) e.preventDefault(); // double-tap zoom
  lastTouchEnd = now;
}, { passive: false });
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
// Phones: a lighter render (fewer pixels) keeps the frame rate up, which matters more than sharpness here.
const coarse = matchMedia('(pointer: coarse)').matches;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(68, 1, 0.1, 2500);

function resize(): void {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ?seed=N picks the world (in Descent: the run); the default free-ride world is one that rides well.
const params = new URLSearchParams(location.search);
const descentMode = params.get('mode') === 'descent';
const seedParam = Number(params.get('seed'));
const seedGiven = Number.isFinite(seedParam) && seedParam > 0;
const world = generateWorld(seedGiven ? seedParam : 3);
const player = createPlayer(world);
const recognizer = createRecognizer();
const combo = createCombo();
const input = createInput(canvas);
const cam = createChaseCam(camera, world);
let worldView = createWorldView(scene, world);
const rider = createRider(scene, world, camera);
let crowd = createCrowd(scene, world);
const fx = createFx(scene, camera, ui);
const hud = createHud(ui);
const book = createTrickBook(ui);
let bookOpen = false;
const audio = createAudio();

const volBox = document.createElement('div');
volBox.style.cssText = 'position:fixed;top:10px;right:10px;pointer-events:auto;z-index:5';
ui.appendChild(volBox);
createVolumeButton(volBox, volume);

let state: GameState = 'title';

// ---------------------------------------------------------------- Descent
const dui = createDescentUi(ui);
const modeSwitch = createModeSwitch(ui, descentMode);
const BEST_KEY = 'ab-descent-best';
const readBest = (): number => {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
};
const newRunSeed = (): number => (seedGiven ? seedParam : 1 + Math.floor(Math.random() * 2147483646));
let run: RunState = createRun(newRunSeed());
/** combo.total when the current hill started: the hill's trick score is the difference. */
let hillStartTotal = 0;
let lastCrashT = -Infinity;
/** Set when a new world was swapped in: the next frame tells the views (camera, effects) to snap, like a warp. */
let snapViews = false;

/** Swap the world in place (every module holds the same World object) and rebuild what was built from it. */
function loadWorld(next: World): void {
  worldView.dispose();
  crowd.dispose();
  Object.assign(world, next);
  worldView = createWorldView(scene, world);
  crowd = createCrowd(scene, world);
  Object.assign(player, createPlayer(world));
  prevPos.copy(player.pos);
  acc = 0;
  snapViews = true;
}

/** ?autopick=1: take the first card without asking (smoke tests and demos). */
const autopick = params.get('autopick') === '1';
function showPicker(): void {
  const cards = offerHills(run);
  if (autopick) {
    pickHill(cards[0]);
    return;
  }
  dui.showPicker(run, cards, pickHill);
}
function pickHill(card: HillCard): void {
  {
    dui.hideScreens();
    loadWorld(generateWorld(card.seed, card.params));
    startHill(run, card);
    ASSIST.landSaves = run.perks.guardianGnome ?? 0;
    hillStartTotal = combo.view().total;
    lastCrashT = -Infinity;
    // The pick was a click / key / tap: ride straight away (mouse players take the pointer lock in this gesture).
    if (input.device === 'kbm' && !autopick) input.requestLock();
    else state = 'playing';
  }
}

function endRun(): void {
  let best = readBest();
  if (run.score > best) {
    best = run.score;
    try {
      localStorage.setItem(BEST_KEY, String(best));
    } catch {
      // private mode: the best just is not kept
    }
  }
  dui.showEnd(run, run.phase === 'won', best, () => {
    run = createRun(newRunSeed());
    applyPerks({});
    showPicker();
  });
}

/** Leave riding (the sim stops) and free the mouse for the overlay. */
function stopRiding(): void {
  state = 'title';
  if (document.pointerLockElement) document.exitPointerLock();
}

/** Crashes and the finish, from this frame's physics events. */
function descentEvents(events: PhysEvent[]): void {
  if (run.phase !== 'ride') return;
  for (const e of events) {
    if (e.e === 'saved') dui.flashSave(e.reason);
    if ((e.e === 'bail' || e.e === 'skyfall') && t - lastCrashT > DESCENT.crashGrace) {
      lastCrashT = t;
      const r = crash(run);
      dui.flashCrash(r);
      if (r.over) {
        stopRiding();
        endRun();
        return;
      }
    } else if (e.e === 'warp') {
      // Through the gate: the hill is done.
      const result = finishHill(run, Math.max(0, combo.view().total - hillStartTotal));
      stopRiding();
      dui.showReward(run, result, (perk) => {
        choosePerk(run, perk);
        applyPerks(run.perks);
        if (run.phase === 'won') endRun();
        else showPicker();
      });
      return;
    }
  }
}

let trainMode = false;
const cheat = createCheatBuffer(DENSHATTACK_CODE, () => {
  trainMode = !trainMode;
  rider.setTrainMode(trainMode);
});
window.addEventListener('keydown', (e) => {
  if (state !== 'playing' && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) {
    cheat.feed(e.key);
  }
});
canvas.addEventListener('click', () => {
  if (state !== 'playing' && input.device !== 'touch') input.requestLock();
});
// Start audio inside the user's gesture itself (iOS only allows it there).
input.onGesture(() => audio.unlock());

const DT = 1 / SIM_HZ;
const prevPos = player.pos.clone();
const renderPos = new THREE.Vector3();
const frameEvents: PhysEvent[] = [];
let acc = 0;
let last = performance.now();
let t = 0;
(window as unknown as { ab: unknown }).ab = { player, world, combo, input };

function frame(): void {
  const now = performance.now();
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  t += dt;

  if (input.consumeStart()) {
    if (state === 'title') audio.unlock();
    // In Descent you ride only once a hill is picked (a pad press on the picker does not start anything).
    if (!descentMode || run.phase === 'ride') state = 'playing';
  }
  // Pause only when the player leaves pointer lock (Esc). A gamepad or touch player never needs the lock.
  if (input.consumePause() && state === 'playing') state = 'paused';
  if (document.body.dataset.state !== state) document.body.dataset.state = state;

  if (input.consumeBook() && state !== 'title') {
    bookOpen = !bookOpen;
    book.set(bookOpen, input.device);
  }

  const inp = input.read(dt);
  frameEvents.length = 0;
  // The views snap on a warp; Descent must not read this one as the finish (descentEvents skips it).
  const snapped = snapViews;
  if (snapViews) {
    snapViews = false;
    frameEvents.push({ e: 'warp' });
  }
  if (state === 'playing' && !bookOpen && (!descentMode || run.phase === 'ride')) {
    acc += dt;
    let first = true;
    while (acc >= DT) {
      prevPos.copy(player.pos);
      const stepInp = first ? inp : { ...inp, respawn: false };
      first = false;
      const cmd = recognizer.feed(inp.stick, player.mode, DT, inp.grab !== 0);
      const before = frameEvents.length;
      const islandBefore = player.island;
      stepPlayer(player, stepInp, cmd, world, DT, frameEvents);
      for (let i = before; i < frameEvents.length; i++) {
        // Descent: flying off the end of the last run finishes the hill even if you miss the gate ring.
        if (descentMode && frameEvents[i].e === 'skyfall' && islandBefore === world.islands.length - 1) frameEvents[i] = { e: 'warp' };
        const e = frameEvents[i];
        combo.event(e, player);
        if (e.e === 'respawn' || e.e === 'warp') prevPos.copy(player.pos);
      }
      combo.tick(DT, player);
      acc -= DT;
    }
  }
  renderPos.copy(prevPos).lerp(player.pos, acc / DT);
  if (descentMode) descentEvents(snapped ? frameEvents.slice(1) : frameEvents);

  rider.update(player, renderPos, dt, inp.steer);
  crowd.update(player, dt, t, frameEvents);
  cam.update(player, renderPos, dt, inp.steer, frameEvents, trainMode);
  worldView.update(dt, t, camera.position, player.flow);
  fx.update(player, renderPos, dt, frameEvents);
  audio.update(player, dt, frameEvents);
  hud.update({ p: player, combo: combo.view(), state, device: input.device, stick: inp.stick, trail: recognizer.trail(), trainMode });
  modeSwitch.update(state !== 'playing');
  if (descentMode) dui.updateHud(run, Math.max(0, combo.view().total - hillStartTotal), run.phase === 'ride');
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
if (descentMode) {
  applyPerks({});
  showPicker();
}
requestAnimationFrame(frame);
