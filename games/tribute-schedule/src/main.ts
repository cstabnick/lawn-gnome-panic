import { initAudio, isMuted, setMuted, updateAudio } from './audio';
import { createHud } from './hud';
import { createInput } from './input';
import { getActiveLore } from './lore/registry';
import { createSim, stepSim } from './sim/engine';
import type { SimState } from './sim/types';
import { createSceneView, type SceneView } from './view/scene';

const params = new URLSearchParams(location.search);
const initialSeed = Number.parseInt(params.get('seed') ?? '1337', 10) || 1337;
const autostart = params.has('autostart');
const nohud = params.has('nohud');

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;

let lore = getActiveLore();
const input = createInput(canvas);
let sim: SimState = createSim(initialSeed, lore);
let view: SceneView = createSceneView(canvas, sim);
let running = false;
let paused = false;
let ended = false;

const hud = createHud(ui, input, {
  onMuteToggle: () => {
    setMuted(!isMuted());
    return isMuted();
  },
  onLoreChanged: () => {
    lore = getActiveLore();
  },
});
if (nohud) hud.setHidden(true);

function startRun(seed: number): void {
  lore = getActiveLore();
  view.dispose();
  sim = createSim(seed, lore);
  view = createSceneView(canvas, sim);
  running = true;
  paused = false;
  ended = false;
  hud.hideStart();
  hud.hidePause();
  hud.hideEnd();
  initAudio();
  if (!autostart) input.requestLock();
}

if (autostart) {
  startRun(initialSeed);
} else {
  hud.showStart(() => startRun(initialSeed));
}

window.addEventListener('resize', () => view.resize());

let lastTime = performance.now();
function loop(now: number): void {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
  lastTime = now;

  if (running && !ended && input.consumeLedgerToggle()) {
    const opened = hud.toggleLedger(sim);
    paused = opened;
  }

  if (running && !ended && input.consumePauseToggle()) {
    paused = !paused;
    if (paused) {
      document.exitPointerLock?.();
      hud.showPause(
        () => {
          paused = false;
          hud.hidePause();
          input.requestLock();
        },
        () => startRun(sim.seed + 1),
      );
    } else {
      hud.hidePause();
      input.requestLock();
    }
  }

  if (running && !paused && !ended) {
    const sampled = input.sample();
    stepSim(sim, sampled, dt, lore);
    updateAudio(sim);
    hud.update(sim);

    if (sim.outcome !== 'playing') {
      ended = true;
      document.exitPointerLock?.();
      hud.showEnd(sim, () => startRun(sim.seed + 1));
    }
  }

  view.render(sim, dt);
}

requestAnimationFrame(loop);
