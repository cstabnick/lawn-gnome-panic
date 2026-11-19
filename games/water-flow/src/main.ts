import { DEFAULTS, Params, SCENES, SceneId } from './config';
import { createSim, Targets, WaterSim } from './sim';
import { buildUi } from './ui';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const uiRoot = document.getElementById('ui') as HTMLElement;

declare global {
  interface Window {
    __water?: { sim: WaterSim; params: Params; stats: () => unknown };
  }
}

function fail(msg: string): void {
  const d = document.createElement('div');
  d.id = 'wf-error';
  d.style.cssText = 'position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:24px;font:16px system-ui;pointer-events:auto';
  d.textContent = msg;
  uiRoot.appendChild(d);
}

async function main(): Promise<void> {
  let sim: WaterSim;
  try {
    sim = await createSim(canvas);
  } catch (e) {
    fail(`${(e as Error).message} This demo needs WebGPU (recent Chrome or Edge, or Safari 26). The WebGL 2 fallback from the design doc is not built yet.`);
    return;
  }

  const params: Params = { ...DEFAULTS };
  const toggles = { autoPour: false, shake: false };
  let scene: SceneId = 0;
  let time = 0;

  const targets = (): Targets => {
    let tilt = params.tilt;
    let cupX = params.cupX;
    if (toggles.autoPour) tilt = 5 + 80 * (0.5 - 0.5 * Math.cos((time * Math.PI * 2) / 14));
    if (toggles.shake) cupX += 0.06 * Math.sin(time * Math.PI * 2 * 1.5);
    return { tilt, cupX, cupY: params.cupY, gate: params.gate };
  };

  const ui = buildUi({
    params,
    toggles,
    onScene: (id) => {
      scene = id;
      params.gate = 0;
      ui.setScene(id);
      doReset();
    },
    onReset: () => doReset(),
    onPause: () => (sim.paused = !sim.paused),
  });

  function doReset(): void {
    time = 0;
    sim.reset(scene, params.particles, { ...targets(), tilt: toggles.autoPour ? 0 : params.tilt });
    ui.setCapacity(sim.capacity);
  }
  doReset();
  window.__water = { sim, params, stats: () => sim.stats };

  let last = performance.now();
  let fps = 60;
  let hudAt = 0;
  const loop = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    fps += (1 / Math.max(dt, 1e-3) - fps) * 0.05;
    if (!sim.paused) time += dt;
    sim.frame(params, targets());
    if (now - hudAt > 250) {
      hudAt = now;
      const s = sim.stats;
      ui.setHud([
        SCENES[scene].name,
        `fps ${fps.toFixed(0)}   cpu ${sim.lastStepMs.toFixed(1)} ms   substeps ${sim.stepsPerFrame}`,
        `particles ${s.count} (scene holds ${s.capacity})`,
        `conserved ${s.count - s.nan}/${s.count} ${s.nan === 0 ? 'OK' : 'NaN!'}`,
        `inside walls ${s.inWall}`,
        `kinetic ${s.kinetic.toFixed(3)} J/kg   max ${s.maxSpeed.toFixed(2)} m/s`,
      ]);
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

void main();
