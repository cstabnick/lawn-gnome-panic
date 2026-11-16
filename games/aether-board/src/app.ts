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
import { createAudio } from './audio';
import { volume } from './volume';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
const rider = createRider(scene, world);
const crowd = createCrowd(scene, world);
const fx = createFx(scene, camera, ui);
const hud = createHud(ui);
const audio = createAudio();

const volBox = document.createElement('div');
volBox.style.cssText = 'position:fixed;top:10px;right:10px;pointer-events:auto;z-index:5';
ui.appendChild(volBox);
createVolumeButton(volBox, volume);

let state: GameState = 'title';
canvas.addEventListener('click', () => {
  if (state !== 'playing') input.requestLock();
});

const DT = 1 / SIM_HZ;
const prevPos = player.pos.clone();
const renderPos = new THREE.Vector3();
const frameEvents: PhysEvent[] = [];
let acc = 0;
let last = performance.now();
let t = 0;
(window as unknown as { ab: unknown }).ab = { player, world, combo };

function frame(): void {
  const now = performance.now();
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  t += dt;

  if (input.consumeStart()) {
    if (state === 'title') audio.unlock();
    state = 'playing';
  }
  if (state === 'playing' && input.device === 'kbm' && !input.locked) state = 'paused';

  const inp = input.read(dt);
  frameEvents.length = 0;
  if (state === 'playing') {
    acc += dt;
    let first = true;
    while (acc >= DT) {
      prevPos.copy(player.pos);
      const stepInp = first ? inp : { ...inp, respawn: false };
      first = false;
      const cmd = recognizer.feed(inp.stick, player.mode, DT);
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
  cam.update(player, renderPos, dt, inp.steer, frameEvents);
  worldView.update(dt, t, camera.position, player.flow);
  fx.update(player, renderPos, dt, frameEvents);
  audio.update(player, dt, frameEvents);
  hud.update({ p: player, combo: combo.view(), state, device: input.device, stick: inp.stick, trail: recognizer.trail() });
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
