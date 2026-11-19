import {
  MAX_GRID_COLS,
  MAX_GRID_ROWS,
  PLOT_TIERS,
} from '../balance.ts';
import type { GameState, TileState } from './types.ts';

export const SAVE_VERSION = 1;

export function makeTiles(plotLevel: number): TileState[] {
  const tier = PLOT_TIERS[Math.min(plotLevel, PLOT_TIERS.length - 1)];
  const startCol = Math.floor((MAX_GRID_COLS - tier.cols) / 2);
  const startRow = Math.floor((MAX_GRID_ROWS - tier.rows) / 2);
  const tiles: TileState[] = [];
  let idx = 0;
  for (let row = 0; row < MAX_GRID_ROWS; row++) {
    for (let col = 0; col < MAX_GRID_COLS; col++) {
      const unlocked =
        col >= startCol &&
        col < startCol + tier.cols &&
        row >= startRow &&
        row < startRow + tier.rows;
      tiles.push({
        index: idx++,
        col,
        row,
        unlocked,
        grass: 'bare',
        height: 0,
        overgrownSec: 0,
        weed: false,
        puddle: false,
        grub: false,
        mole: false,
        dogSpot: false,
        shaded: false,
        scorched: false,
        golden: false,
        trench: false,
        decor: null,
        oakSapling: false,
        bootPrint: false,
      });
    }
  }
  return tiles;
}

export function applyPlotTierToTiles(tiles: TileState[], plotLevel: number): void {
  const tier = PLOT_TIERS[Math.min(plotLevel, PLOT_TIERS.length - 1)];
  const startCol = Math.floor((MAX_GRID_COLS - tier.cols) / 2);
  const startRow = Math.floor((MAX_GRID_ROWS - tier.rows) / 2);
  for (const t of tiles) {
    if (
      t.col >= startCol &&
      t.col < startCol + tier.cols &&
      t.row >= startRow &&
      t.row < startRow + tier.rows
    ) {
      t.unlocked = true;
    }
  }
}

export function createInitialState(): GameState {
  const tiles = makeTiles(0);
  // Seed 4 starter crabgrass tiles so the player immediately sees grass growing
  const unlocked = tiles.filter((t) => t.unlocked);
  for (const i of [5, 6, 9, 10]) {
    if (unlocked[i]) {
      unlocked[i].grass = 'crabgrass';
      unlocked[i].height = 35 + (i % 3) * 15;
    }
  }

  return {
    version: SAVE_VERSION,
    week: 1,
    weekElapsedSec: 0,
    totalElapsedSec: 0,
    ended: false,
    sandboxMode: false,
    secretHatEnding: false,

    clippings: 0,
    clippingsThisWeek: 0,
    lifetimeClippings: 0,
    water: 45,
    waterCap: 80,
    loam: 40,
    loamCap: 100,
    acorns: 3, // enough for first couple hires
    wishes: 0,
    mulch: 0,
    lifetimeMulch: 0,

    plotLevel: 0,
    selectedGrass: 'crabgrass',
    placingDecor: null,
    tiles,

    gnomes: 1,
    jobs: {
      trim: 1,
      water: 0,
      weed: 0,
      compost: 0,
      dog: 0,
      bees: 0,
    },
    trimTool: 0,
    waterTool: 0,
    weedTool: 0,
    compostShare: 0.15,

    unlockedGrasses: ['crabgrass'],
    befriendedCritters: [],
    biscuitFetches: 0,
    biscuitTricks: [],
    biscuitPets: 0,
    chippedGnomes: 0,

    treeNodes: [],
    canRespec: false,

    trimsThisWeek: 0,
    totalTrims: 0,
    dandelionsPulled: 0,
    squirrelTrades: 0,
    mowingDays: 0,
    tapCombo: 0,
    tapComboDecaySec: 0,
    tapsThisSecond: 0,
    tapWindowSec: 0,
    rainSec: 0,
    rainCooldownSec: 0,
    drySummerActive: false,
    combineBannerSec: 0,
    gnomedayActive: false,
    sundialTaps: 0,
    dayIndex: 0,

    seenProblems: ['bare-dirt'],
    activeProblems: ['bare-dirt'],
    problemGraceSec: {},

    buffs: [],
    goldenAcorn: null,
    easterEgg: null,
    acornDripSec: 18,
    goldenSpawnSec: 65,
    easterSpawnSec: 90,
    nextSpawnId: 1,

    teacupLine: 'Foreman Teacup: "Nothing grows on wishful thinking. Tap bare dirt to sow Crabgrass."',
    recentLines: [
      'Foreman Teacup: "Welcome to the Bare Patch. Tap dirt to sow, tap tall grass to trim."',
    ],

    mowerRide: {
      active: false,
      remainingSec: 60,
      durationSec: 60,
      x: 4,
      y: 5,
      angle: 0,
      mowedTiles: [],
      hatPatternScore: 0,
      finished: false,
    },

    lastSavedAt: Date.now(),
  };
}

export function serializeState(state: GameState): string {
  return JSON.stringify({ ...state, version: SAVE_VERSION, lastSavedAt: Date.now() });
}

export function migrateState(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Partial<GameState>;
  if (typeof obj.week !== 'number' || !Array.isArray(obj.tiles)) return null;
  const base = createInitialState();
  const merged: GameState = {
    ...base,
    ...obj,
    version: SAVE_VERSION,
    jobs: { ...base.jobs, ...(obj.jobs ?? {}) },
    mowerRide: { ...base.mowerRide, ...(obj.mowerRide ?? {}) },
    problemGraceSec: { ...(obj.problemGraceSec ?? {}) },
  };
  if (merged.tiles.length !== MAX_GRID_COLS * MAX_GRID_ROWS) {
    merged.tiles = makeTiles(merged.plotLevel);
  }
  return merged;
}

export function exportSaveString(state: GameState): string {
  const json = serializeState(state);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export function importSaveString(str: string): GameState | null {
  try {
    const bin = atob(str.trim());
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    return migrateState(JSON.parse(json));
  } catch {
    return null;
  }
}
