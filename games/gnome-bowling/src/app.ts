// Gnome Bowling: renderer, scene, lights and the main loop. Systems live one per file; this file only wires them.
import * as THREE from 'three';
import { getMyGnome } from '@lawn/gnome';
import { LOOK_ORDER, SEAT_COLORS, type Ctx, type System } from './config';
import { canBowlHere, makeNpcPlayer, makePlayer, newGame, newState, throwBall, tickGame } from './game';
import { whileHidden } from '@lawn/mp/background';
import { createNet } from './net';
import { addAlleyLight, createLane } from './lane';
import { createPins } from './pins';
import { createBowler } from './bowler';
import { createAmbient } from './ambient';
import { createCamera } from './camera';
import { createControls } from './controls';
import { createHud } from './hud';
import { createCelebrate } from './celebrate';
import { createReplay } from './replay';
import { createMenu } from './menu';
import { createAudio } from './audio';
import { createAnnouncer } from './announcer';
import { createMusic } from './music';
import { createAchievements } from './achievements';

// No page zoom or scroll on phones: every control runs on pointer events, which still arrive
// when the touch events are cancelled. Elements marked data-scroll keep native scrolling.
const cancelTouch = (e: TouchEvent): void => {
  const target = e.target as Element | null;
  if (target?.closest?.('[data-scroll]')) return;
  if (e.cancelable) e.preventDefault();
};
document.addEventListener('touchstart', cancelTouch, { passive: false });
document.addEventListener('touchend', cancelTouch, { passive: false });
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
}

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;

const COARSE = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: location.hash.includes('snap') });
// Phones: a lighter render keeps the frame rate up.
renderer.setPixelRatio(Math.min(window.devicePixelRatio, COARSE ? 1.5 : 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 1, 0.05, 200);
camera.position.set(0, 1.6, -3.5);
camera.lookAt(0, 0.4, 18);

// Key light over the one playable lane, aimed at the pins; shadows on the lane.
const { key, hemi } = addAlleyLight(scene, renderer, 4);

function resize(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const state = newState();
const net = createNet({ scene, camera, renderer, canvas, state, ui, lights: { key, hemi }, net: null as never });
const ctx: Ctx = { scene, camera, renderer, canvas, state, ui, lights: { key, hemi }, net };

// Debug: #play starts a local game for two at once; #cpu starts a game of two CPU bowlers to watch.
// window.bowl is the game state.
if (location.hash.includes('cpu')) {
  newGame(state, [makeNpcPlayer('lou'), makeNpcPlayer('chad')], 'local');
} else if (location.hash.includes('play')) {
  const my = getMyGnome();
  newGame(state, [
    makePlayer(my?.name ?? 'Gnorman', LOOK_ORDER[0], SEAT_COLORS[0], true, -1, null, my?.look),
    makePlayer('Gnancy', LOOK_ORDER[1], SEAT_COLORS[1]),
  ], 'local');
}
(window as unknown as { bowl: unknown }).bowl = state;

// Debug: #auto bowls for every local player (headless checks and the landing-page thumbnail).
const auto = location.hash.includes('auto');
let autoSeed = 7;
const autoRand = (): number => {
  autoSeed = (autoSeed * 16807) % 2147483647;
  return autoSeed / 2147483647;
};

// Update order: net first (applies incoming throws), then the world, then the camera (reads it), then UI and audio.
const systems: System[] = [
  net,
  createLane(ctx),
  createPins(ctx),
  createBowler(ctx),
  createAmbient(ctx),
  createCamera(ctx),
  createControls(ctx),
  createHud(ctx),
  createCelebrate(ctx),
  createReplay(ctx),
  createMenu(ctx),
  createAudio(ctx),
  createAnnouncer(ctx),
  createMusic(ctx),
  createAchievements(ctx),
];

let last = performance.now();

/** Advances the game and every system by dt seconds. No rendering: the hidden-tab loop calls this alone. */
function simulate(dt: number): void {
  tickGame(state, dt);
  if (auto && canBowlHere(state) && state.phaseTime > 0.8) {
    // Roughly a right-hander's pocket ball, with some scatter.
    throwBall(state, { x: -0.22 + (autoRand() - 0.5) * 0.2, aim: 0, speed: 7 + autoRand() * 2.5, spin: 0.45 + (autoRand() - 0.5) * 0.4 });
  }
  for (const s of systems) s.update(dt);
}

function step(): void {
  const now = performance.now();
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  simulate(dt);
  renderer.render(scene, camera);
  if (location.hash.includes('dbg')) {
    let meshes = 0;
    scene.traverse((o) => { if ((o as THREE.Mesh).isMesh && o.visible) meshes++; });
    const p = camera.position;
    const d = new THREE.Vector3();
    camera.getWorldDirection(d);
    const m = /shot=(\d+(?:\.\d+)?)/.exec(location.hash);
    if (m && state.time >= Number(m[1]) && !document.getElementById('dbg-shot')) {
      const pre = document.createElement('pre');
      pre.id = 'dbg-shot';
      pre.textContent = canvas.toDataURL('image/png');
      document.body.appendChild(pre);
    }
    document.title = `DBG ${state.phase} cam ${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)} dir ${d.x.toFixed(2)},${d.y.toFixed(2)},${d.z.toFixed(2)} meshes ${meshes} calls ${renderer.info.render.calls} tris ${renderer.info.render.triangles}`;
  }
}

// A hidden tab stops requestAnimationFrame, so an online match would go silent and the server would drop us.
// Keep simulating (and so pinging and relaying) while hidden; nothing is drawn until the tab is back.
whileHidden((dt) => {
  if (state.net.status !== 'playing') return;
  last = performance.now();
  simulate(dt);
});

if (location.hash.includes('snap')) {
  // Headless browsers may not fire requestAnimationFrame, so debug runs tick on a timer.
  setInterval(step, 16);
} else {
  const frame = (): void => {
    step();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
