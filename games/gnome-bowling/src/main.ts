// Gnome Bowling: renderer, scene, lights and the main loop. Systems live one per file; this file only wires them.
import * as THREE from 'three';
import { LOOK_COLORS, LOOK_ORDER, SEAT_COLORS, type Ctx, type System } from './config';
import { canBowlHere, makePlayer, newGame, newState, throwBall, tickGame } from './game';
import { createNet } from './net';
import { createLane } from './lane';
import { createPins } from './pins';
import { createBowler } from './bowler';
import { createCamera } from './camera';
import { createControls } from './controls';
import { createHud } from './hud';
import { createCelebrate } from './celebrate';
import { createMenu } from './menu';
import { createAudio } from './audio';

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

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: location.hash.includes('snap') });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(LOOK_COLORS.background);
scene.fog = new THREE.Fog(LOOK_COLORS.background, 30, 70);

const camera = new THREE.PerspectiveCamera(55, 1, 0.05, 200);
camera.position.set(0, 1.6, -3.5);
camera.lookAt(0, 0.4, 18);

const hemi = new THREE.HemisphereLight(0xfff0f8, 0x302040, 1.1);
scene.add(hemi);
// Key light over the lane, aimed at the pins; shadows on the lane.
const key = new THREE.DirectionalLight(0xfff4e8, 2.0);
key.position.set(2, 8, 4);
key.target.position.set(0, 0, 12);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
const sc = key.shadow.camera;
sc.left = -4; sc.right = 4; sc.top = 16; sc.bottom = -16; sc.near = 0.5; sc.far = 40;
scene.add(key, key.target);

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

// Debug: #play starts a local game for two at once. window.bowl is the game state.
if (location.hash.includes('play')) {
  newGame(state, [
    makePlayer('Gnorman', LOOK_ORDER[0], SEAT_COLORS[0]),
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
  createCamera(ctx),
  createControls(ctx),
  createHud(ctx),
  createCelebrate(ctx),
  createMenu(ctx),
  createAudio(ctx),
];

let last = performance.now();
function step(): void {
  const now = performance.now();
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  tickGame(state, dt);
  if (auto && canBowlHere(state) && state.phaseTime > 0.8) {
    // Roughly a right-hander's pocket ball, with some scatter.
    throwBall(state, { x: -0.22 + (autoRand() - 0.5) * 0.2, aim: 0, speed: 7 + autoRand() * 2.5, spin: 0.45 + (autoRand() - 0.5) * 0.4 });
  }
  for (const s of systems) s.update(dt);
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
