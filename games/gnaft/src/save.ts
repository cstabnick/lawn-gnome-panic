// localStorage save/load. Autosaves every 10 s while playing and offers a 'New raft' button on the title screen.
import type { Ctx, GameState, IslandId, ItemId, System, Tile, ToolId } from './config';
import { ISLAND_ORDER, ITEM_IDS, TOOL_ORDER } from './config';
import { tileKey } from './rules';

const KEY = 'gnaft-save-v1';
const SAVE_EVERY = 10;
const CHECK_EVERY = 0.5;

interface SaveData {
  version: 1;
  time: number;
  inv: Partial<Record<ItemId, number>>;
  tools: Partial<Record<ToolId, boolean>>;
  equipped: ToolId;
  hasTelescope: boolean;
  tiles: [number, number, number][];
  tilesBuilt: number;
  buildKind: GameState['buildKind'];
  player: { position: [number, number, number]; facing: number };
  sea: GameState['sea'];
  islands: Partial<Record<IslandId, { spotted: boolean; visited: boolean; looted: boolean[] }>>;
  dayTime: number;
  props: GameState['props'];
  stats: Partial<GameState['stats']>;
  won: boolean;
  structures?: GameState['structures'];
}

function readRaw(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function hasSave(): boolean {
  return readRaw() !== null;
}

function writeSave(state: GameState): void {
  const p = state.player.position;
  const data: SaveData = {
    version: 1,
    time: state.time,
    inv: state.inv,
    tools: state.tools,
    equipped: state.equipped,
    hasTelescope: state.hasTelescope,
    tiles: [...state.tiles.values()].map((t) => [t.i, t.j, t.growth]),
    tilesBuilt: state.tilesBuilt,
    buildKind: state.buildKind,
    player: { position: [p.x, p.y, p.z], facing: state.player.facing },
    sea: state.sea,
    islands: state.islands,
    dayTime: state.dayTime,
    props: state.props,
    stats: state.stats,
    won: state.won,
    structures: state.structures,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked: play on without saving.
  }
}

/** Loads a saved game into `state` (mode stays 'title'). Returns true if a save was found and applied. */
export function loadGame(state: GameState): boolean {
  const raw = readRaw();
  if (raw === null) return false;

  let saved: SaveData;
  try {
    saved = JSON.parse(raw) as SaveData;
  } catch {
    return false;
  }
  if (!saved || saved.version !== 1 || !Array.isArray(saved.tiles)) return false;

  const tiles = new Map<string, Tile>();
  for (const [i, j, growth] of saved.tiles) {
    tiles.set(tileKey(i, j), { i, j, growth });
  }
  if (tiles.size === 0) return false;

  state.time = saved.time ?? state.time;
  Object.assign(state.inv, saved.inv ?? {});
  // Make sure every item key exists even if the save predates it.
  for (const id of ITEM_IDS) state.inv[id] = state.inv[id] ?? 0;
  Object.assign(state.tools, saved.tools ?? {});
  for (const id of TOOL_ORDER) state.tools[id] = state.tools[id] ?? false;
  state.equipped = saved.equipped ?? state.equipped;
  state.hasTelescope = saved.hasTelescope ?? state.hasTelescope;
  state.tiles = tiles;
  state.tilesBuilt = saved.tilesBuilt ?? state.tilesBuilt;
  state.buildKind = saved.buildKind ?? state.buildKind;

  if (saved.player) {
    const pos = saved.player.position;
    if (pos) state.player.position.set(pos[0], pos[1], pos[2]);
    state.player.facing = saved.player.facing ?? state.player.facing;
  }
  state.player.velocity.set(0, 0, 0);
  state.player.grounded = true;
  state.player.jumpsUsed = 0;

  Object.assign(state.sea, saved.sea ?? {});

  for (const id of ISLAND_ORDER) {
    const s = saved.islands?.[id];
    if (!s) continue;
    const cur = state.islands[id];
    cur.spotted = s.spotted ?? cur.spotted;
    cur.visited = s.visited ?? cur.visited;
    if (Array.isArray(s.looted)) {
      cur.looted = cur.looted.map((_, k) => s.looted[k] ?? false);
    }
  }

  state.dayTime = saved.dayTime ?? state.dayTime;
  state.props.splice(0, state.props.length, ...(saved.props ?? []).map((p) => ({ ...p })));
  Object.assign(state.stats, saved.stats ?? {});
  state.won = saved.won ?? state.won;
  state.structures = (saved.structures ?? []).map((t) => ({ ...t }));
  state.player.swimming = false;
  state.mode = 'title';
  return true;
}

export function createSave(ctx: Ctx): System {
  // Debug runs (URL hash set) must not overwrite or offer to delete a real save.
  if (location.hash !== '') return { update() {} };

  const { state, ui } = ctx;

  const btn = document.createElement('button');
  btn.id = 'rg-newgame';
  btn.textContent = 'New raft';
  btn.style.cssText = [
    'position:absolute', 'right:16px', 'bottom:16px', 'pointer-events:auto',
    'padding:8px 14px', 'font:600 14px system-ui,sans-serif', 'color:#fff',
    'background:rgba(20,24,30,0.7)', 'border:1px solid rgba(255,255,255,0.35)',
    'border-radius:6px', 'cursor:pointer', 'display:none',
  ].join(';');
  btn.addEventListener('click', () => {
    if (!window.confirm('Start a new raft? Your saved game will be lost.')) return;
    try {
      localStorage.removeItem(KEY);
    } catch {
      // Ignore: reload anyway.
    }
    location.reload();
  });
  ui.appendChild(btn);

  let saveTimer = 0;
  let checkTimer = 0;

  // A co-op guest plays in the host's world: never overwrite the guest's own raft with it.
  const save = () => {
    if (state.mode !== 'title' && state.netRole !== 'guest') writeSave(state);
  };

  window.addEventListener('beforeunload', save);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') save();
  });

  return {
    update(dt: number) {
      if (state.mode === 'title') {
        checkTimer -= dt;
        if (checkTimer <= 0) {
          checkTimer = CHECK_EVERY;
          btn.style.display = hasSave() ? 'block' : 'none';
        }
      } else if (btn.style.display !== 'none') {
        btn.style.display = 'none';
      }

      if (state.mode === 'title' || state.netRole === 'guest') return;
      saveTimer -= dt;
      if (saveTimer <= 0) {
        saveTimer = SAVE_EVERY;
        writeSave(state);
      }
    },
  };
}
