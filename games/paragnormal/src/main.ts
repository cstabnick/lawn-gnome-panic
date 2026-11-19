import { loadMyGnome } from '@lawn/gnome';
await loadMyGnome();
import { onTabHidden } from '@lawn/mp/background';
import { initAudio, updateAudio } from './audio';
import { initSpatialChatter, updateSpatialChatter } from './chatter';
import { createHud } from './hud';
import { createInput } from './input';
import { initMusic } from './music';
import { createSim, stepSim } from './sim/engine';
import type { SimState } from './sim/types';
import { createSceneView, type SceneView } from './view/scene';

const params = new URLSearchParams(location.search);
const initialSeed = Number.parseInt(params.get('seed') ?? '1337', 10) || 1337;
const autostart = params.has('autostart');
const nohud = params.has('nohud');

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;

const input = createInput(canvas);
const hud = createHud(ui);
if (nohud) hud.setHidden(true);
const music = initMusic(initialSeed);

let sim: SimState = createSim(initialSeed);
let view: SceneView = createSceneView(canvas, sim);
let running = false;
let paused = false;
let ended = false;

function startRun(seed: number): void {
  view.dispose();
  sim = createSim(seed);
  view = createSceneView(canvas, sim);
  running = true;
  paused = false;
  ended = false;
  hud.hideStart();
  hud.hidePause();
  hud.hideEnd();
  initAudio();
  initSpatialChatter();
  music.setSeed(seed);
  music.start();
  if (!autostart) input.requestLock();
}

function openPause(): void {
  paused = true;
  document.exitPointerLock?.();
  hud.showPause(
    () => {
      paused = false;
      hud.hidePause();
      input.requestLock();
    },
    () => startRun(sim.seed),
  );
}

// Hiding the tab stops requestAnimationFrame; come back to the pause menu rather than a run that moved on without you.
onTabHidden(() => {
  if (running && !paused && !ended) openPause();
});

if (autostart) {
  startRun(initialSeed);
} else {
  hud.showStart(initialSeed, (seed) => startRun(seed));
}

window.addEventListener('resize', () => view.resize());

let lastTime = performance.now();
function loop(now: number): void {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
  lastTime = now;

  if (running && !ended && input.consumePauseToggle()) {
    paused = !paused;
    if (paused) {
      openPause();
    } else {
      hud.hidePause();
      input.requestLock();
    }
  }

  if (running && !paused && !ended) {
    const sampled = input.sample(dt);
    stepSim(sim, sampled, dt);
    updateAudio(sim);
    updateSpatialChatter(sim);

    if (sim.player.escaped || sim.player.caught) {
      ended = true;
      document.exitPointerLock?.();
      hud.showEnd(
        sim.player.escaped,
        sim,
        () => startRun(sim.seed),
        () => startRun(Math.floor(1 + Math.random() * 9999)),
      );
    }
  }

  hud.update(sim);
  view.sync(sim);
}

requestAnimationFrame(loop);
