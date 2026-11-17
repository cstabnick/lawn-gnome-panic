// Aether Board: wiring and the loop. The board simulates at a fixed SIM_HZ; rendering interpolates between steps,
// so motion is smooth at any frame rate. Click (or pad A) to ride: the pointer locks and the mouse becomes the
// trick stick. Losing the lock (Esc) pauses.
import * as THREE from 'three';
import { createVolumeButton } from '@arcade/volume';
import { SIM_HZ, type PhysEvent } from './config';
import { generateWorld } from './world';
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

// ?seed=N picks the world; the default is a world that rides well.
const seedParam = Number(new URLSearchParams(location.search).get('seed'));
const world = generateWorld(Number.isFinite(seedParam) && seedParam > 0 ? seedParam : 3);
const player = createPlayer(world);
const recognizer = createRecognizer();
const combo = createCombo();
const input = createInput(canvas);
const cam = createChaseCam(camera, world);
const worldView = createWorldView(scene, world);
const rider = createRider(scene, world, camera);
const crowd = createCrowd(scene, world);
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
    state = 'playing';
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
  if (state === 'playing' && !bookOpen) {
    acc += dt;
    let first = true;
    while (acc >= DT) {
      prevPos.copy(player.pos);
      const stepInp = first ? inp : { ...inp, respawn: false };
      first = false;
      const cmd = recognizer.feed(inp.stick, player.mode, DT, inp.grab !== 0);
      const before = frameEvents.length;
      stepPlayer(player, stepInp, cmd, world, DT, frameEvents);
      for (let i = before; i < frameEvents.length; i++) {
        const e = frameEvents[i];
        combo.event(e, player);
        if (e.e === 'respawn' || e.e === 'warp') prevPos.copy(player.pos);
      }
      combo.tick(DT, player);
      acc -= DT;
    }
  }
  renderPos.copy(prevPos).lerp(player.pos, acc / DT);

  rider.update(player, renderPos, dt, inp.steer);
  crowd.update(player, dt, t, frameEvents);
  cam.update(player, renderPos, dt, inp.steer, frameEvents, trainMode);
  worldView.update(dt, t, camera.position, player.flow);
  fx.update(player, renderPos, dt, frameEvents);
  audio.update(player, dt, frameEvents);
  hud.update({ p: player, combo: combo.view(), state, device: input.device, stick: inp.stick, trail: recognizer.trail(), trainMode });
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
