// Gnome Golf: renderer, scene, lights and the main loop. Systems live one per file; this file only wires them.
import * as THREE from 'three';
import { HOLES, LOOK, type Ctx, type System } from './config';
import { canAct, newRound, newState, placeBall, startHole, takeShot, takeThrow, tickRound } from './round';
import { createWorld } from './world';
import { createAmbient } from './ambient';
import { createParty } from './party';
import { createBall } from './ball';
import { createCameraRig } from './camera';
import { createControls } from './controls';
import { createHud } from './hud';
import { createMinimap } from './minimap';
import { createMusic } from './music';
import { createAudioSystem } from './audio';
import { createDisc } from './disc';
import { createOnline } from './online';
import { createLobby } from './lobby';
import { createRemotes } from './remotes';

// No page zoom on phones: iOS Safari ignores user-scalable=no and touch-action for double taps,
// so a fast double tap on SWING zoomed the page. Every control here runs on pointer events, which
// still arrive when the touch events are cancelled. The two scrollable panels (bag list, scorecard)
// keep their native touch handling so they can still scroll.
const SCROLLABLE = '#gc-bag, #gh-card';
const cancelTouch = (e: TouchEvent): void => {
  const target = e.target as Element | null;
  if (target?.closest?.(SCROLLABLE)) return;
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
scene.background = new THREE.Color(LOOK.sky);
scene.fog = new THREE.Fog(LOOK.sky, LOOK.fogNear, LOOK.fogFar);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, LOOK.cameraFar);

const hemi = new THREE.HemisphereLight(0xe8f6ff, 0x3d6b3a, 1.3);
scene.add(hemi);
// The sun's shadow box follows the camera's subject (camera.ts moves sun.position and sun.target).
const sun = new THREE.DirectionalLight(0xfff4e0, 2.4);
sun.position.set(60, 120, 40);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sc = sun.shadow.camera;
sc.left = -40; sc.right = 40; sc.top = 40; sc.bottom = -40; sc.near = 1; sc.far = 400;
scene.add(sun, sun.target);

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
const ctx: Ctx = { scene, camera, renderer, canvas, state, ui, lights: { sun, hemi } };

// Debug: #hole=N starts straight on hole N (1-based). #disc starts straight into Gnome Disc (combines with #hole=N).
const holeMatch = /hole=(\d+)/.exec(location.hash);
const discMatch = location.hash.includes('disc');
if (holeMatch || discMatch) {
  newRound(state, discMatch ? 'disc' : 'golf');
  if (holeMatch) startHole(state, Math.max(0, Number(holeMatch[1]) - 1));
}
// Debug: #putt=N puts the ball N yards short of the pin, on the line in from the last fairway corner.
const puttMatch = /putt=(\d+(?:\.\d+)?)/.exec(location.hash);
if (puttMatch && state.phase !== 'title') {
  const hole = HOLES[state.holeIndex];
  const from = hole.path[hole.path.length - 2];
  const d = Math.hypot(hole.pin.x - from.x, hole.pin.z - from.z);
  const n = Number(puttMatch[1]);
  placeBall(state, hole.pin.x + ((from.x - hole.pin.x) / d) * n, hole.pin.z + ((from.z - hole.pin.z) / d) * n);
}
(window as unknown as { golf: unknown }).golf = state; // debug handle

// Online play (lobby, turns, relays). Runs first each frame so the systems see this frame's network state.
const online = createOnline(ctx);
(window as unknown as { golfOnline: unknown }).golfOnline = online; // debug handle
(window as unknown as { golfDebug: unknown }).golfDebug = { takeShot, takeThrow, canAct }; // debug: scripted shots in tests

// Update order: online, world and ambient first, then the party and ball, then the camera (reads them), then UI and audio.
const systems: System[] = [
  online,
  createWorld(ctx),
  createAmbient(ctx),
  createParty(ctx),
  createRemotes(ctx),
  createBall(ctx),
  createDisc(ctx),
  createCameraRig(ctx),
  createControls(ctx),
  createHud(ctx, online),
  createLobby(ctx, online),
  createMinimap(ctx),
  createAudioSystem(ctx),
  createMusic(ctx),
];

// Debug: #norender skips drawing (headless logic tests run far faster without the software renderer).
const debugFlags = { noRender: location.hash.includes('norender') };
(window as unknown as { golfRender: unknown }).golfRender = debugFlags; // tests switch drawing back on for screenshots
let last = performance.now();
function step(): void {
  const now = performance.now();
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  tickRound(state, dt);
  for (const s of systems) s.update(dt);
  if (!debugFlags.noRender) renderer.render(scene, camera);
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
