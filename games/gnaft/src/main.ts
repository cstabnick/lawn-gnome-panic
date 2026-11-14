// Gnaft: scene setup and the main loop. Systems live one per file; this file only wires them.
import * as THREE from 'three';
import { COLORS, SEA, TELESCOPE, type Ctx, type System } from './config';
import { createInput } from './input';
import { newState, tickWorld } from './rules';
import { createOcean } from './ocean';
import { createRaft } from './raft';
import { createPlayer } from './player';
import { createMowing } from './mowing';
import { createFishing } from './fishing';
import { createBuilding } from './building';
import { createNavigation } from './navigation';
import { createHud } from './hud';
import { createDayNight } from './daynight';
import { createWeather } from './weather';
import { createSeagull } from './seagull';
import { createShark } from './shark';
import { createMinimap } from './minimap';
import { createObjectives } from './objectives';
import { createMusic } from './music';
import { createSave, loadGame } from './save';
import { createNet } from './net';
import { createCoopUi } from './coopUi';
import { createTouch } from './touch';
import { loadMyGnome } from '@lawn/gnome';

// Read the player's saved gnome before anything is built, so every model and the hello use it.
await loadMyGnome();

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: location.hash.startsWith('#snap') });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.sky);
scene.fog = new THREE.Fog(COLORS.sky, SEA.fogNear, SEA.fogFar);

const camera = new THREE.PerspectiveCamera(TELESCOPE.normalFov, 1, 0.1, SEA.cameraFar);

const hemi = new THREE.HemisphereLight(0xdff3ff, 0x2a5d7a, 1.2);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(30, 50, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sc = sun.shadow.camera;
sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30; sc.near = 1; sc.far = 150;
scene.add(sun);

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
if (!location.hash) loadGame(state);
const input = createInput(canvas);
// ?touch=1 forces the on-screen touch controls (for testing on a desktop).
if (new URLSearchParams(location.search).has('touch')) input.virtual.setTouch(true);
const ctx: Ctx = { scene, camera, renderer, state, input, ui, lights: { sun, hemi } };
(window as unknown as { raft: unknown }).raft = state; // debug handle

canvas.addEventListener('click', () => {
  if (state.mode === 'play' || state.mode === 'build' || state.mode === 'telescope') input.requestLock();
});

// Co-op guests take seagulls, the shark and the weather timer from the host, so these two never run there.
const seagull = createSeagull(ctx);
const shark = createShark(ctx);
const hostOnly = new Set<System>([seagull, shark]);

// Update order matters: the player sets the camera, then the telescope may override it.
// net runs first (applies the host's snapshot before anything reads the world); coopUi after the HUD.
const systems: System[] = [
  createNet(ctx),
  createOcean(ctx),
  createDayNight(ctx),
  createWeather(ctx),
  createRaft(ctx),
  createPlayer(ctx),
  createMowing(ctx),
  createFishing(ctx),
  createBuilding(ctx),
  seagull,
  shark,
  createNavigation(ctx),
  createMinimap(ctx),
  createObjectives(ctx),
  createMusic(ctx),
  createSave(ctx),
  createHud(ctx),
  createCoopUi(ctx),
  createTouch(ctx),
];

let last = performance.now();
function step(): void {
  const now = performance.now();
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (state.mode !== 'title') tickWorld(state, dt);
  for (const s of systems) {
    if (state.netRole === 'guest' && hostOnly.has(s)) continue;
    s.update(dt);
  }
  input.endFrame();
  renderer.render(scene, camera);
}

const debugHash = location.hash;
if (debugHash === '#selftest' || debugHash.startsWith('#snap') || debugHash.startsWith('#cooptest')) {
  // Headless browsers may not fire requestAnimationFrame, so debug runs tick on a timer.
  if (!debugHash.startsWith('#cooptest')) document.getElementById('rg-title')?.remove();
  setInterval(step, 16);
  void import('./selftest').then((m) => {
    if (debugHash === '#selftest') return m.runSelfTest(state, ui);
    if (debugHash.startsWith('#cooptest')) return m.runCoopTest(state, ui, debugHash.split('=')[1] ?? 'host');
    return m.runSnap(state, ui, canvas, debugHash.split('=')[1] ?? 'raft');
  });
} else {
  const frame = (): void => {
    step();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
