import { Viewport } from './render/viewport';
import {
  createSim,
  DEFAULT_PARAMS,
  PRESETS,
  type BrushTool,
  type DeadGridSim,
  type SimParams,
} from './sim/bridge';
import { EconomyModal, type PriceSample } from './ui/economyModal';
import { Hud, type HistorySample } from './ui/hud';
import { OptimizerModal } from './ui/optimizerModal';

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
  let tickAccum = 0;
  let activeBrush: BrushTool = 'inspect';
  let brushRadius = 12;
  let brushCount = 200;

  const history: HistorySample[] = [];
  const priceHistory: PriceSample[] = [];
  let lastHistoryTick = -100;

  const sim = await createSim(seed, params);

  const applyBrushAt = (wx: number, wy: number) => {
    if (activeBrush === 'zombies') {
      sim.brushSpawnZombies(wx, wy, brushRadius, brushCount);
    } else if (activeBrush === 'humans') {
      sim.brushSpawnHumans(wx, wy, brushRadius, Math.max(5, Math.round(brushCount * 0.25)));
    } else if (activeBrush === 'animals') {
      sim.brushSpawnAnimals(wx, wy, brushRadius, Math.max(5, Math.round(brushCount * 0.25)));
    } else if (activeBrush === 'airdrop') {
      sim.brushAirdrop(wx, wy, Math.max(4, Math.round(brushRadius * 0.7)));
    } else if (activeBrush === 'clear') {
      sim.brushClear(wx, wy, brushRadius);
    } else if (activeBrush === 'wildfire') {
      sim.disasterWildfire(wx, wy, brushRadius);
    } else if (activeBrush === 'flood') {
      sim.disasterFlood(wx, wy, brushRadius);
    } else if (activeBrush === 'quake') {
      sim.disasterQuake(wx, wy, brushRadius);
    } else if (activeBrush === 'plague') {
      sim.disasterPlague(wx, wy, brushRadius);
    } else if (activeBrush === 'drought') {
      sim.disasterDrought(wx, wy, brushRadius);
    } else if (activeBrush === 'zone-city') {
      sim.brushPaintZone(wx, wy, brushRadius, 9);
    } else if (activeBrush === 'zone-military') {
      sim.brushPaintZone(wx, wy, brushRadius, 10);
    } else if (activeBrush === 'zone-farm') {
      sim.brushPaintZone(wx, wy, brushRadius, 11);
    } else if (activeBrush === 'zone-industrial') {
      sim.brushPaintZone(wx, wy, brushRadius, 12);
    }
    hud.updateStats(sim.readStats(), history);
  };

  const viewport = new Viewport(canvas, {
    isBrushActive: () => activeBrush !== 'inspect',
    onBrushStroke(wx, wy) {
      applyBrushAt(wx, wy);
    },
    onTap(wx, wy) {
      if (activeBrush !== 'inspect') {
        applyBrushAt(wx, wy);
        return;
      }
      const ag = sim.findNearestAgent(wx, wy, Math.max(4, 14 / viewport.zoom));
      viewport.selectedAgent = ag;
      viewport.selectedTile = { x: Math.floor(wx), y: Math.floor(wy) };
      const tile = sim.inspectTile(wx, wy);
      const agent = ag >= 0 ? sim.inspectAgent(ag) : null;
      hud.showInspection(tile, agent, sim.readFactions(), sim.readRepublics());
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
      tickAccum = 0;
      sim.reset(seed, params);
      viewport.syncWorldSize(sim.gridW, sim.gridH);
    },
    onResetWorld(newSeed, nextParams) {
      seed = newSeed;
      params = { ...nextParams };
      history.length = 0;
      lastHistoryTick = -100;
      tickAccum = 0;
      viewport.selectedAgent = -1;
      viewport.selectedTile = null;
      hud.showInspection(null, null, [], []);
      sim.reset(seed, params);
      viewport.syncWorldSize(sim.gridW, sim.gridH);
    },
    onOverlayChange(overlay) {
      viewport.overlay = overlay;
    },
    onBrushChange(brush, radius, count) {
      activeBrush = brush;
      brushRadius = radius;
      brushCount = count;
      viewport.brushRadius = brush === 'inspect' ? 0 : radius;
    },
    onRecenter() {
      viewport.fitWorld();
    },
    onOpenOptimizer() {
      optimizerModal.open();
    },
    onOpenEconomy() {
      economyModal.open();
    },
  });

  const economyModal = new EconomyModal(ui, {
    getLootTable: () => params.lootTable,
    onApplyLootLive(table) {
      params = { ...params, lootTable: table };
      sim.applyParams(params);
    },
    onApplyLootReset(table) {
      params = { ...params, lootTable: table };
      history.length = 0;
      priceHistory.length = 0;
      lastHistoryTick = -100;
      sim.reset(seed, params);
      viewport.syncWorldSize(sim.gridW, sim.gridH);
    },
    onSelectZoneBrush(brush) {
      hud.setBrushTool(brush);
    },
  });

  const optimizerModal = new OptimizerModal(ui, {
    getCurrentParams: () => ({ ...params }),
    getCurrentSeed: () => seed,
    onApplyBest(bestParams) {
      params = { ...bestParams };
      hud.syncParams(params);
      history.length = 0;
      lastHistoryTick = -100;
      tickAccum = 0;
      sim.reset(seed, params);
      viewport.syncWorldSize(sim.gridW, sim.gridH);
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
      tickAccum += speed;
      const toRun = Math.floor(tickAccum);
      if (toRun > 0) {
        tickAccum -= toRun;
        const budgetStart = performance.now();
        let left = toRun;
        while (left > 0) {
          const chunk = Math.min(left, 4);
          sim.step(chunk);
          left -= chunk;
          if (performance.now() - budgetStart > 12) break;
        }
      }
    }

    const stats = sim.readStats();
    if (stats.tick - lastHistoryTick >= 15) {
      lastHistoryTick = stats.tick;
      history.push({
        tick: stats.tick,
        day: stats.day,
        humans: stats.humans,
        zombies: stats.zombies,
        animals: stats.animals,
        soloHumans: stats.soloHumans,
        groupHumans: stats.groupHumans,
        societyHumans: stats.societyHumans,
        settlements: stats.settlements,
        zombiePacks: stats.zombiePacks,
        pdCoops: stats.pdCoops,
        pdDefects: stats.pdDefects,
        pdMutualCoop: stats.pdMutualCoop,
        pdBetrayals: stats.pdBetrayals,
        avgFood: stats.avgFood,
        avgWater: stats.avgWater,
        avgGear: stats.avgGear,
        republics: stats.republics,
        roadTiles: stats.roadTiles,
        roadsBuilt: stats.roadsBuilt,
        territoryTiles: stats.territoryTiles,
        farmsBuilt: stats.farmsBuilt,
        terraforms: stats.terraforms,
        disasters: stats.disasters,
      });
      if (history.length > 1000) history.shift();
      priceHistory.push({
        tick: stats.tick,
        food: stats.avgPriceFood,
        water: stats.avgPriceWater,
        gear: stats.avgPriceGear,
        mats: stats.avgPriceMats,
      });
      if (priceHistory.length > 500) priceHistory.shift();
    }

    const factions = sim.readFactions();
    const republics = sim.readRepublics();
    viewport.render(sim, factions, republics);
    hud.updateStats(stats, history);
    hud.appendEvents(sim.drainEvents());
    economyModal.update(stats, factions, priceHistory);

    if (viewport.selectedAgent >= 0) {
      const ag = sim.inspectAgent(viewport.selectedAgent);
      if (ag) {
        hud.showInspection(sim.inspectTile(ag.x, ag.y), ag, factions, republics);
      }
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

main();
