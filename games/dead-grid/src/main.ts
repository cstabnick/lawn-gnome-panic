import { Viewport } from './render/viewport';
import {
  createSim,
  DEFAULT_PARAMS,
  PRESETS,
  type BrushTool,
  type DeadGridSim,
  type SimParams,
} from './sim/bridge';
import { Hud, type HistorySample } from './ui/hud';

declare global {
  interface Window {
    __deadGrid?: {
      sim: DeadGridSim;
      viewport: Viewport;
      hud: Hud;
    };
  }
}

async function main(): Promise<void> {
  const canvas = document.getElementById('game') as HTMLCanvasElement | null;
  const ui = document.getElementById('ui');
  if (!canvas || !ui) throw new Error('Missing #game or #ui element');

  let params: SimParams = { ...DEFAULT_PARAMS };
  let seed = 1337;
  let speed = 1;
  let paused = false;
  let activeBrush: BrushTool = 'inspect';
  const history: HistorySample[] = [];
  let lastHistoryTick = -100;

  const sim = await createSim(seed, params);

  const viewport = new Viewport(canvas, {
    onTap(wx, wy) {
      if (activeBrush === 'zombies') {
        sim.brushSpawnZombies(wx, wy, 10, 150);
      } else if (activeBrush === 'survivors') {
        sim.brushSpawnSurvivors(wx, wy, 8, 40);
      } else if (activeBrush === 'airdrop') {
        sim.brushAirdrop(wx, wy, 8);
      } else if (activeBrush === 'clear') {
        sim.brushClear(wx, wy, 12);
      } else {
        const ag = sim.findNearestAgent(wx, wy, Math.max(4, 14 / viewport.zoom));
        viewport.selectedAgent = ag;
        viewport.selectedTile = { x: Math.floor(wx), y: Math.floor(wy) };
        const tile = sim.inspectTile(wx, wy);
        const agent = ag >= 0 ? sim.inspectAgent(ag) : null;
        hud.showInspection(tile, agent, sim.readFactions());
        return;
      }
      hud.updateStats(sim.readStats(), history);
    },
  });

  const hud = new Hud(ui, params, seed, {
    onSpeedChange(newSpeed, isPaused) {
      speed = newSpeed;
      paused = isPaused;
    },
    onParamsChange(next) {
      params = next;
      sim.applyParams(params);
    },
    onPresetSelect(presetId) {
      const preset = PRESETS.find((p) => p.id === presetId);
      if (!preset) return;
      params = { ...preset.params };
      history.length = 0;
      lastHistoryTick = -100;
      sim.reset(seed, params);
    },
    onResetWorld(newSeed, nextParams) {
      seed = newSeed;
      params = { ...nextParams };
      history.length = 0;
      lastHistoryTick = -100;
      viewport.selectedAgent = -1;
      viewport.selectedTile = null;
      hud.showInspection(null, null, []);
      sim.reset(seed, params);
    },
    onOverlayChange(overlay) {
      viewport.overlay = overlay;
    },
    onBrushChange(brush) {
      activeBrush = brush;
      viewport.brushRadius =
        brush === 'zombies' ? 10 :
        brush === 'survivors' ? 8 :
        brush === 'airdrop' ? 8 :
        brush === 'clear' ? 12 : 0;
    },
    onRecenter() {
      viewport.fitWorld();
    },
  });

  window.__deadGrid = { sim, viewport, hud };

  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
    if (e.code === 'Space') {
      e.preventDefault();
      paused = !paused;
      hud.setSpeedVisual(speed, paused);
    } else if (e.code === 'Digit1') {
      paused = false; speed = 1; hud.setSpeedVisual(speed, paused);
    } else if (e.code === 'Digit2') {
      paused = false; speed = 5; hud.setSpeedVisual(speed, paused);
    } else if (e.code === 'Digit3') {
      paused = false; speed = 15; hud.setSpeedVisual(speed, paused);
    } else if (e.code === 'Digit4') {
      paused = false; speed = 40; hud.setSpeedVisual(speed, paused);
    } else if (e.code === 'KeyR' || e.code === 'KeyH') {
      viewport.fitWorld();
    }
  });

  let lastTime = performance.now();
  function frame(now: number): void {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    viewport.stepKeyboardPan(dt);

    if (!paused && speed > 0) {
      const budgetStart = performance.now();
      let left = speed;
      while (left > 0) {
        const chunk = Math.min(left, 4);
        sim.step(chunk);
        left -= chunk;
        if (performance.now() - budgetStart > 12) break;
      }
    }

    const stats = sim.readStats();
    if (stats.tick - lastHistoryTick >= 20) {
      lastHistoryTick = stats.tick;
      history.push({
        survivors: stats.survivors,
        zombies: stats.zombies,
        settlements: stats.settlements,
      });
      if (history.length > 140) history.shift();
    }

    const factions = sim.readFactions();
    viewport.render(sim, factions);
    hud.updateStats(stats, history);
    hud.appendEvents(sim.drainEvents());

    if (viewport.selectedAgent >= 0) {
      const ag = sim.inspectAgent(viewport.selectedAgent);
      if (ag) {
        hud.showInspection(sim.inspectTile(ag.x, ag.y), ag, factions);
      }
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

main();
