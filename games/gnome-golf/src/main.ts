// Gnome Golf: renderer, scene, lights and the main loop. Systems live one per file; this file only wires them.
import * as THREE from 'three';
import { LOOK, type Ctx, type System } from './config';
import { newRound, newState, startHole, tickRound } from './round';
import { createWorld } from './world';
import { createAmbient } from './ambient';
import { createParty } from './party';
import { createBall } from './ball';
import { createCameraRig } from './camera';
import { createControls } from './controls';
import { createHud } from './hud';
import { createMinimap } from './minimap';
import { createAudioSystem } from './audio';

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

// Debug: #hole=N starts straight on hole N (1-based).
const holeMatch = /hole=(\d+)/.exec(location.hash);
if (holeMatch) {
  newRound(state);
  startHole(state, Math.max(0, Number(holeMatch[1]) - 1));
}
(window as unknown as { golf: unknown }).golf = state; // debug handle

// Update order: world and ambient first, then the party and ball, then the camera (reads them), then UI and audio.
const systems: System[] = [
  createWorld(ctx),
  createAmbient(ctx),
  createParty(ctx),
  createBall(ctx),
  createCameraRig(ctx),
  createControls(ctx),
  createHud(ctx),
  createMinimap(ctx),
  createAudioSystem(ctx),
];

let last = performance.now();
function step(): void {
  const now = performance.now();
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  tickRound(state, dt);
  for (const s of systems) s.update(dt);
  renderer.render(scene, camera);
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
