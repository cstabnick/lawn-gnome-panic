// Pure game rules on GameState. No rendering, no DOM. Systems call these instead of editing state ad hoc.
import * as THREE from 'three';
import {
  BUILD_COSTS, DAY, DEBRIS, FUN, GRASS, ISLAND_ORDER, ISLANDS, ITEM_IDS, ITEMS, RAFT_TOP, RECIPES, REFUND, SEA, SHED, SPRINKLER, START_TILES, TILE_SIZE, TOOLS, WEATHER,
  type BuildKind, type DebrisDef, type GameState, type IslandId, type IslandState, type ItemId, type Prop, type PropKind, type RecipeId,
  type Structure, type Tile, type ToolId,
} from './config';

// ---------------------------------------------------------------- co-op

/**
 * Every rule that changes the shared world on a player's behalf reports itself here first. On a co-op guest,
 * net.ts sets `forward` to send the action to the host (the guest still applies it locally for instant feedback;
 * the host's snapshots then correct it). Solo and host leave it null.
 */
export const netHook: { forward: ((a: NetAction) => void) | null } = { forward: null };

export type NetAction =
  | ['place', number, number, BuildKind, 'x' | 'z']
  | ['cut', number, number, number]          // i, j, yieldMult
  | ['craft', RecipeId]
  | ['collect', DebrisDef]
  | ['loot', IslandId, number]
  | ['chart', IslandId]
  | ['castOff']
  | ['deconstruct', Structure | Prop]          // by value; the host finds the equal piece
  | ['fuel', number]
  | ['spot', IslandId];

function fwd(a: NetAction): void {
  netHook.forward?.(a);
}

/**
 * Host side: applies a guest's action to the host's world, without forwarding it and without
 * the host seeing the guest's toasts. The host keeps its own equipped tool.
 */
export function applyNetAction(s: GameState, a: NetAction): void {
  const saved = netHook.forward;
  netHook.forward = null;
  const msgCount = s.messages.length;
  const equipped: ToolId = s.equipped;
  try {
    switch (a[0]) {
      case 'place': placeTile(s, a[1], a[2], a[3], a[4]); break;
      case 'cut': {
        const t = s.tiles.get(tileKey(a[1], a[2]));
        if (t) cutTile(s, t, a[3]);
        break;
      }
      case 'craft': craft(s, a[1]); break;
      case 'collect': collectDebris(s, a[1]); break;
      case 'loot': lootCrate(s, a[1], a[2]); break;
      case 'chart': chartCourse(s, a[1]); break;
      case 'castOff': castOff(s); break;
      case 'deconstruct': {
        const want = JSON.stringify(a[1]);
        const piece = [...s.structures, ...s.props].find((p) => JSON.stringify(p) === want);
        if (piece) deconstruct(s, piece);
        break;
      }
      case 'fuel': burnFuel(s, a[1]); break;
      case 'spot': spotIsland(s, a[1]); break;
    }
  } finally {
    netHook.forward = saved;
    s.messages.length = msgCount;
    s.equipped = equipped;
  }
}

/** The shared world, as the host sends it. Per-player things (mode, player, equipped, buildKind, messages) are not in it. */
export interface WorldSnap {
  time: number;
  inv: Record<ItemId, number>;
  tools: Record<ToolId, boolean>;
  hasTelescope: boolean;
  /** [i, j, growth rounded to 3 decimals] */
  tiles: [number, number, number][];
  tilesBuilt: number;
  sea: GameState['sea'];
  islands: Record<IslandId, IslandState>;
  dayTime: number;
  raining: boolean;
  props: Prop[];
  structures: Structure[];
  stats: GameState['stats'];
  won: boolean;
}

export function snapshotWorld(s: GameState): WorldSnap {
  return {
    time: s.time,
    inv: { ...s.inv },
    tools: { ...s.tools },
    hasTelescope: s.hasTelescope,
    tiles: [...s.tiles.values()].map((t) => [t.i, t.j, Math.round(t.growth * 1000) / 1000]),
    tilesBuilt: s.tilesBuilt,
    sea: { ...s.sea },
    islands: JSON.parse(JSON.stringify(s.islands)) as Record<IslandId, IslandState>,
    dayTime: s.dayTime,
    raining: s.raining,
    props: s.props.map((p) => ({ ...p })),
    structures: s.structures.map((t) => ({ ...t })),
    stats: { ...s.stats },
    won: s.won,
  };
}

/** Guest side: replaces the shared world with the host's. Keeps tile objects that still exist (renderers hold them). */
export function applyWorld(s: GameState, w: WorldSnap): void {
  s.time = w.time;
  Object.assign(s.inv, w.inv);
  Object.assign(s.tools, w.tools);
  if (!s.tools[s.equipped]) s.equipped = 'hands';
  s.hasTelescope = w.hasTelescope;
  const keep = new Set<string>();
  for (const [i, j, growth] of w.tiles) {
    const key = tileKey(i, j);
    keep.add(key);
    const t = s.tiles.get(key);
    if (t) t.growth = growth;
    else s.tiles.set(key, { i, j, growth });
  }
  for (const key of [...s.tiles.keys()]) if (!keep.has(key)) s.tiles.delete(key);
  s.tilesBuilt = w.tilesBuilt;
  Object.assign(s.sea, w.sea);
  for (const id of ISLAND_ORDER) {
    const src = w.islands[id];
    if (src) Object.assign(s.islands[id], { spotted: src.spotted, visited: src.visited, looted: [...src.looted] });
  }
  s.dayTime = w.dayTime;
  s.raining = w.raining;
  // Keep the same arrays and objects when nothing changed, so renderers keyed on them do not rebuild.
  if (JSON.stringify(s.props) !== JSON.stringify(w.props)) s.props = w.props.map((p) => ({ ...p }));
  if (JSON.stringify(s.structures) !== JSON.stringify(w.structures)) s.structures = w.structures.map((t) => ({ ...t }));
  Object.assign(s.stats, w.stats);
  s.won = w.won;
}

/** Marks an island as spotted through the telescope. */
export function spotIsland(s: GameState, id: IslandId): void {
  fwd(['spot', id]);
  s.islands[id].spotted = true;
}

/** Burns mower fuel (never below 0). */
export function burnFuel(s: GameState, n: number): void {
  if (n <= 0) return;
  fwd(['fuel', n]);
  s.inv.fuel = Math.max(0, s.inv.fuel - n);
}

export function tileKey(i: number, j: number): string {
  return `${i},${j}`;
}

/** Grid cell containing world point (x, z). */
export function cellAt(x: number, z: number): { i: number; j: number } {
  return { i: Math.round(x / TILE_SIZE), j: Math.round(z / TILE_SIZE) };
}

export function tileAt(s: GameState, x: number, z: number): Tile | undefined {
  const { i, j } = cellAt(x, z);
  return s.tiles.get(tileKey(i, j));
}

export function newState(): GameState {
  const inv = Object.fromEntries(ITEM_IDS.map((id) => [id, 0])) as Record<ItemId, number>;
  const tiles = new Map<string, Tile>();
  for (const [i, j] of START_TILES) tiles.set(tileKey(i, j), { i, j, growth: 0.6 });
  const islands = Object.fromEntries(
    ISLAND_ORDER.map((id) => [id, { spotted: false, visited: false, looted: ISLANDS[id].crates.map(() => false) }]),
  ) as Record<IslandId, IslandState>;
  return {
    mode: 'title',
    time: 0,
    inv,
    tools: { hands: true, push: false, gas: false, riding: false },
    equipped: 'hands',
    hasTelescope: false,
    tiles,
    tilesBuilt: 0,
    buildKind: 'turf',
    player: {
      position: new THREE.Vector3(TILE_SIZE / 2, RAFT_TOP, TILE_SIZE / 2),
      velocity: new THREE.Vector3(),
      facing: 0,
      grounded: true,
      jumpsUsed: 0,
      swimming: false,
    },
    sea: { x: 0, z: 0, heading: SEA.startHeading, speed: SEA.driftSpeed, course: null, docked: null },
    islands,
    messages: [],
    dayTime: DAY.startTime,
    raining: false,
    props: [],
    stats: { cut: 0, caught: 0, tilesLost: 0, gullsScared: 0, sharksBonked: 0 },
    won: false,
    structures: [],
    canGrab: false,
    netRole: 'solo',
    coop: { status: 'off', message: '', code: '', players: [], request: null },
  };
}

export function notify(s: GameState, text: string): void {
  s.messages.push(text);
}

// ---------------------------------------------------------------- inventory

export function addItem(s: GameState, id: ItemId, n: number): void {
  s.inv[id] += n;
}

export function hasItems(s: GameState, cost: Partial<Record<ItemId, number>>): boolean {
  return ITEM_IDS.every((id) => s.inv[id] >= (cost[id] ?? 0));
}

/** Removes cost if affordable. Returns false (and changes nothing) if not. */
export function spend(s: GameState, cost: Partial<Record<ItemId, number>>): boolean {
  if (!hasItems(s, cost)) return false;
  for (const id of ITEM_IDS) s.inv[id] -= cost[id] ?? 0;
  return true;
}

export function costText(cost: Partial<Record<ItemId, number>>): string {
  return ITEM_IDS.filter((id) => cost[id]).map((id) => `${cost[id]} ${id}`).join(', ');
}

// ---------------------------------------------------------------- raft

/** Half-width of the raft from the origin, in metres (furthest tile edge). */
export function raftExtent(s: GameState): number {
  let r = 0;
  for (const t of s.tiles.values()) r = Math.max(r, Math.hypot(t.i * TILE_SIZE, t.j * TILE_SIZE) + TILE_SIZE * 0.7);
  return r;
}

export function canPlace(s: GameState, i: number, j: number): boolean {
  if (s.tiles.has(tileKey(i, j))) return false;
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([di, dj]) => s.tiles.has(tileKey(i + di, j + dj)));
}

export function propAt(s: GameState, i: number, j: number): Prop | undefined {
  return s.props.find((p) => p.i === i && p.j === j);
}

/** Can a prop go on cell (i, j)? It needs an existing tile with no prop on it. */
export function canPlaceProp(s: GameState, i: number, j: number): boolean {
  return s.tiles.has(tileKey(i, j)) && !propAt(s, i, j);
}

// ---------------------------------------------------------------- shed pieces

export function floorAt(s: GameState, i: number, j: number): Structure | undefined {
  return s.structures.find((t) => t.kind === 'floor' && t.i === i && t.j === j);
}

export function ceilingAt(s: GameState, i: number, j: number): Structure | undefined {
  return s.structures.find((t) => t.kind === 'ceiling' && t.i === i && t.j === j);
}

/** The wall on the +x (dir 'x') or +z (dir 'z') edge of cell (i, j). */
export function wallAt(s: GameState, i: number, j: number, dir: 'x' | 'z'): Structure | undefined {
  return s.structures.find((t) => t.kind === 'wall' && t.i === i && t.j === j && t.dir === dir);
}

/** The two cells a wall separates: (i, j) and its +x or +z neighbour. */
export function wallCells(i: number, j: number, dir: 'x' | 'z'): [[number, number], [number, number]] {
  return [[i, j], dir === 'x' ? [i + 1, j] : [i, j + 1]];
}

/** The 4 walls around cell (i, j), as [i, j, dir] in storage form. */
export function wallsAround(i: number, j: number): [number, number, 'x' | 'z'][] {
  return [[i, j, 'x'], [i - 1, j, 'x'], [i, j, 'z'], [i, j - 1, 'z']];
}

/** Wall centre in world space (y = RAFT_TOP) and whether it runs along z (dir 'x') or along x (dir 'z'). */
export function wallCentre(i: number, j: number, dir: 'x' | 'z'): { x: number; z: number } {
  return dir === 'x'
    ? { x: i * TILE_SIZE + TILE_SIZE / 2, z: j * TILE_SIZE }
    : { x: i * TILE_SIZE, z: j * TILE_SIZE + TILE_SIZE / 2 };
}

/**
 * True if building `kind` at (i, j) is allowed (ignoring cost). `dir` is only used for walls.
 * - water kinds: an empty cell next to the raft
 * - tile props: a tile with no prop and no floor
 * - floor: a tile with no floor and no prop
 * - wall: no wall on that edge yet, and a tile on at least one side
 * - ceiling: a tile with no roof yet that has a wall on one of its edges or a roofed 4-neighbour
 */
export function canBuild(s: GameState, i: number, j: number, kind: BuildKind, dir: 'x' | 'z' = 'x'): boolean {
  switch (BUILD_COSTS[kind].on) {
    case 'water': return canPlace(s, i, j);
    case 'tile': return canPlaceProp(s, i, j) && !floorAt(s, i, j);
    case 'floor': return s.tiles.has(tileKey(i, j)) && !floorAt(s, i, j) && !propAt(s, i, j);
    case 'edge': return !wallAt(s, i, j, dir) && wallCells(i, j, dir).some(([a, b]) => s.tiles.has(tileKey(a, b)));
    case 'ceiling':
      return s.tiles.has(tileKey(i, j)) && !ceilingAt(s, i, j) && (
        wallsAround(i, j).some(([a, b, d]) => wallAt(s, a, b, d)) ||
        [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([di, dj]) => ceilingAt(s, i + di, j + dj)));
  }
}

/**
 * Builds `kind` at cell (i, j) if allowed and affordable: a new tile on water next to the raft (turf, seeded),
 * a prop on an existing tile (sprinkler, flamingo, duck, statue) or a shed piece (floor, wall with `dir`, ceiling).
 * Notifies on a cost failure.
 */
export function placeTile(s: GameState, i: number, j: number, kind: BuildKind, dir: 'x' | 'z' = 'x'): boolean {
  if (!canBuild(s, i, j, kind, dir)) return false;
  const def = BUILD_COSTS[kind];
  if (!spend(s, def.cost)) {
    notify(s, `${def.name} needs ${costText(def.cost)}`);
    return false;
  }
  fwd(['place', i, j, kind, dir]);
  switch (def.on) {
    case 'tile':
      s.props.push({ kind: kind as PropKind, i, j });
      return true;
    case 'floor': {
      s.structures.push({ kind: 'floor', i, j });
      const t = s.tiles.get(tileKey(i, j));
      if (t) t.growth = 0;
      return true;
    }
    case 'ceiling':
      s.structures.push({ kind: 'ceiling', i, j });
      return true;
    case 'edge':
      s.structures.push({ kind: 'wall', i, j, dir });
      return true;
    case 'water':
      s.tiles.set(tileKey(i, j), { i, j, growth: kind === 'turf' ? GRASS.turfStartGrowth : GRASS.seededStartGrowth });
      s.tilesBuilt++;
      if (s.tilesBuilt === 3) notify(s, 'Dirt and grass seed are floating by now. Fish them up!');
      return true;
  }
}

/** Removes a shed piece (or a placed prop) and refunds REFUND of its cost, rounded down. Returns true if removed. */
export function deconstruct(s: GameState, piece: Structure | Prop): boolean {
  fwd(['deconstruct', { ...piece }]);
  if ('dir' in piece || piece.kind === 'floor' || piece.kind === 'ceiling' || piece.kind === 'wall') {
    const k = s.structures.indexOf(piece as Structure);
    if (k < 0) return false;
    s.structures.splice(k, 1);
  } else {
    const k = s.props.indexOf(piece as Prop);
    if (k < 0) return false;
    s.props.splice(k, 1);
  }
  const cost = BUILD_COSTS[piece.kind].cost;
  const back: Partial<Record<ItemId, number>> = {};
  for (const id of ITEM_IDS) {
    const n = Math.floor((cost[id] ?? 0) * REFUND);
    if (n > 0) { addItem(s, id, n); back[id] = n; }
  }
  // Props bought with a single trinket (duck, statue) come back whole.
  if (piece.kind === 'duck' || piece.kind === 'statue') addItem(s, piece.kind, 1);
  return true;
}

/** Height of the ground the gnome would stand on at (x, z), or null over open water. Floors raise it by FLOOR_THICK. */
export function surfaceY(s: GameState, x: number, z: number): number | null {
  const { i, j } = cellAt(x, z);
  if (s.tiles.has(tileKey(i, j))) return RAFT_TOP + (floorAt(s, i, j) ? SHED.FLOOR_THICK : 0);
  return onIsland(s, x, z) ? RAFT_TOP : null;
}

/**
 * True if moving from (x, z) to (nx, nz) crosses a shed wall or ends within `margin` of one (approaching it).
 * Only walls the gnome is below matter: pass the gnome's feet height as `y` (a gnome on the roof is not blocked).
 */
export function wallBlocks(s: GameState, x: number, z: number, nx: number, nz: number, margin: number, y = RAFT_TOP): boolean {
  if (y > RAFT_TOP + SHED.WALL_HEIGHT - 0.2) return false;
  const half = TILE_SIZE / 2 + margin * 0.5;
  for (const w of s.structures) {
    if (w.kind !== 'wall' || !w.dir) continue;
    const c = wallCentre(w.i, w.j, w.dir);
    // a = across the wall (the axis it blocks), b = along the wall.
    const [a0, a1, b, wa, wb] = w.dir === 'x' ? [x, nx, nz, c.x, c.z] : [z, nz, nx, c.z, c.x];
    if (Math.abs(b - wb) > half) continue;
    const d0 = a0 - wa;
    const d1 = a1 - wa;
    if (Math.sign(d0) !== Math.sign(d1) && d0 !== 0) return true;
    if (Math.abs(d1) < margin + SHED.WALL_THICK / 2 && Math.abs(d1) < Math.abs(d0)) return true;
  }
  return false;
}

/** Cuts a tile if grown enough. Returns grass gained (0 if not cuttable). */
export function cutTile(s: GameState, t: Tile, yieldMult: number): number {
  if (t.growth < GRASS.cutMin) return 0;
  fwd(['cut', t.i, t.j, yieldMult]);
  const gained = Math.max(1, Math.round(GRASS.baseYield * t.growth * yieldMult));
  t.growth = GRASS.cutResetTo;
  addItem(s, 'grass', gained);
  s.stats.cut++;
  if (Math.random() < 0.08) {
    addItem(s, 'seed', 1);
    notify(s, 'Found a grass seed in the clippings!');
  }
  return gained;
}

// ---------------------------------------------------------------- crafting

export function craft(s: GameState, id: RecipeId): boolean {
  const owned = id === 'telescope' ? s.hasTelescope : s.tools[id];
  if (owned) {
    notify(s, `You already have a ${RECIPES[id].name}.`);
    return false;
  }
  // Forward before spending: the host checks the cost against the shared inventory itself.
  if (hasItems(s, RECIPES[id].cost)) fwd(['craft', id]);
  if (!spend(s, RECIPES[id].cost)) {
    notify(s, `${RECIPES[id].name} needs ${costText(RECIPES[id].cost)}`);
    return false;
  }
  if (id === 'telescope') s.hasTelescope = true;
  else {
    s.tools[id] = true;
    s.equipped = id;
  }
  notify(s, `Crafted ${RECIPES[id].name}!`);
  return true;
}

/** Can the equipped tool cut right now (fuel check)? */
export function toolHasFuel(s: GameState): boolean {
  return TOOLS[s.equipped].fuelPerCut === 0 || s.inv.fuel > 0;
}

// ---------------------------------------------------------------- sea and islands

export function raftVelocity(s: GameState): { x: number; z: number } {
  return { x: Math.sin(s.sea.heading) * s.sea.speed, z: Math.cos(s.sea.heading) * s.sea.speed };
}

/** Island centre in scene coordinates (the raft sits at the scene origin). */
export function islandRelPos(s: GameState, id: IslandId): { x: number; z: number } {
  return { x: ISLANDS[id].x - s.sea.x, z: ISLANDS[id].z - s.sea.z };
}

/** The island whose land covers scene point (x, z), or null. */
export function islandAt(s: GameState, x: number, z: number): IslandId | null {
  for (const id of ISLAND_ORDER) {
    const p = islandRelPos(s, id);
    if (Math.hypot(x - p.x, z - p.z) <= ISLANDS[id].radius) return id;
  }
  return null;
}

function onIsland(s: GameState, x: number, z: number): boolean {
  return islandAt(s, x, z) !== null;
}

/** True if (x, z) is on a raft tile or on any island's land. */
export function isWalkable(s: GameState, x: number, z: number): boolean {
  return tileAt(s, x, z) !== undefined || onIsland(s, x, z);
}

/**
 * How far island `id`'s shore is from the nearest raft tile: distance from the island centre to the closest point
 * of any tile square, minus the island radius. Negative = they overlap.
 */
export function islandGap(s: GameState, id: IslandId): number {
  const p = islandRelPos(s, id);
  const h = TILE_SIZE / 2;
  let best = Infinity;
  for (const t of s.tiles.values()) {
    const cx = t.i * TILE_SIZE;
    const cz = t.j * TILE_SIZE;
    const qx = Math.max(cx - h, Math.min(p.x, cx + h));
    const qz = Math.max(cz - h, Math.min(p.z, cz + h));
    best = Math.min(best, Math.hypot(p.x - qx, p.z - qz));
  }
  return best - ISLANDS[id].radius;
}

/** Docks at an island: the raft stops with its nearest tile overlapping the shore so the gnome can walk across. */
function dockAt(s: GameState, id: IslandId): void {
  s.sea.docked = id;
  s.sea.course = null;
  s.sea.speed = 0;
  if (!s.islands[id].visited) {
    s.islands[id].visited = true;
    s.islands[id].spotted = true;
    notify(s, `Landed on ${ISLANDS[id].name}! Walk ashore and look for crates (E).`);
  } else notify(s, `Docked at ${ISLANDS[id].name}.`);
}

export function chartCourse(s: GameState, id: IslandId): void {
  if (!s.islands[id].spotted) return;
  fwd(['chart', id]);
  s.sea.course = id;
  s.sea.docked = null;
  notify(s, `Course charted for ${ISLANDS[id].name}.`);
}

/** Leave the docked island and drift on, pointing away from it. */
export function castOff(s: GameState): void {
  if (!s.sea.docked) return;
  fwd(['castOff']);
  const p = islandRelPos(s, s.sea.docked);
  notify(s, `Cast off from ${ISLANDS[s.sea.docked].name}.`);
  s.sea.heading = Math.atan2(-p.x, -p.z);
  s.sea.docked = null;
  s.sea.course = null;
}

/** Opens crate `index` on the docked island. Returns false if already looted or not docked there. */
export function lootCrate(s: GameState, id: IslandId, index: number): boolean {
  if (s.sea.docked !== id || s.islands[id].looted[index]) return false;
  fwd(['loot', id, index]);
  s.islands[id].looted[index] = true;
  const loot = ISLANDS[id].crates[index];
  for (const item of ITEM_IDS) if (loot[item]) addItem(s, item, loot[item]!);
  notify(s, `Crate: ${costText(loot)}`);
  return true;
}

/** Removes a tile (shark bite), any prop, floor or roof on it, and walls left with no tile on either side. */
export function removeTile(s: GameState, i: number, j: number, minTiles: number): boolean {
  if (s.tiles.size <= minTiles || !s.tiles.delete(tileKey(i, j))) return false;
  s.props = s.props.filter((p) => p.i !== i || p.j !== j);
  s.structures = s.structures.filter((t) => {
    if (t.kind !== 'wall') return t.i !== i || t.j !== j;
    return wallCells(t.i, t.j, t.dir ?? 'x').some(([a, b]) => s.tiles.has(tileKey(a, b)));
  });
  s.stats.tilesLost++;
  return true;
}

/**
 * Collects one piece of floating junk (hooked or grabbed): adds its items, counts it in stats.caught and
 * returns the toast text (already pushed with notify). Bottles reveal an island; fun junk gives FUN[fun].loot.
 * The caller plays the sound: 'bottle' for bottles, 'quack' for the duck, 'catch' for the rest.
 */
export function collectDebris(s: GameState, def: DebrisDef): string {
  fwd(['collect', def]);
  s.stats.caught++;
  if (def.bottle) {
    revealIsland(s);
    return s.messages[s.messages.length - 1] ?? '';
  }
  let text: string;
  if (def.fun) {
    const f = FUN[def.fun];
    for (const id of ITEM_IDS) if (f.loot[id]) addItem(s, id, f.loot[id]!);
    text = `${f.msg} (+${costText(f.loot)})`;
  } else {
    addItem(s, def.item, def.amount);
    text = `+${def.amount} ${ITEMS[def.item].name}`;
  }
  notify(s, text);
  return text;
}

/** Tiles with a missing 4-neighbour (where a shark can bite). */
export function edgeTiles(s: GameState): Tile[] {
  return [...s.tiles.values()].filter((t) =>
    [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([di, dj]) => !s.tiles.has(tileKey(t.i + di, t.j + dj))));
}

/** Message in a bottle: spots the nearest unspotted island. Returns its id, or null if all are spotted. */
export function revealIsland(s: GameState): IslandId | null {
  let best: IslandId | null = null;
  let bestD = Infinity;
  for (const id of ISLAND_ORDER) {
    if (s.islands[id].spotted) continue;
    const p = islandRelPos(s, id);
    const d = Math.hypot(p.x, p.z);
    if (d < bestD) { bestD = d; best = id; }
  }
  if (best) {
    s.islands[best].spotted = true;
    notify(s, `A message in a bottle! It marks ${ISLANDS[best].name} on your map.`);
  } else notify(s, 'A message in a bottle: "Nice lawn." That is all it says.');
  return best;
}

/** Sun height: 1 at noon, -1 at midnight. */
export function sunHeight(s: GameState): number {
  return Math.sin(s.dayTime * Math.PI * 2);
}

/** 0 in daylight, 1 at full night. */
export function nightAmount(s: GameState): number {
  const h = sunHeight(s);
  return Math.min(1, Math.max(0, (0.15 - h) / 0.4));
}

/** Growth multiplier for a tile: rain and nearby sprinklers. */
export function growthMult(s: GameState, t: Tile): number {
  let m = s.raining ? WEATHER.growthMult : 1;
  for (const p of s.props) {
    if (p.kind === 'sprinkler' && Math.hypot(p.i - t.i, p.j - t.j) * TILE_SIZE <= SPRINKLER.radius) {
      m *= SPRINKLER.growthMult;
      break;
    }
  }
  return m;
}

/** Debris kinds that can spawn now. */
export function debrisTable(s: GameState): DebrisDef[] {
  return DEBRIS.filter((d) =>
    d.unlock === 'start' ||
    (d.unlock === 'tiles3' && s.tilesBuilt >= 3) ||
    (d.unlock === 'island1' && s.islands.scrapyard.visited) ||
    (d.unlock === 'island2' && s.islands.fuelDepot.visited));
}

export function pickDebris(s: GameState): DebrisDef {
  const table = debrisTable(s);
  let r = Math.random() * table.reduce((a, d) => a + d.weight, 0);
  for (const d of table) if ((r -= d.weight) <= 0) return d;
  return table[0];
}

/** Grows grass, moves the sea, steers to the course and docks on arrival. Call once per frame in play. */
export function tickWorld(s: GameState, dt: number): void {
  s.time += dt;
  s.dayTime = (s.dayTime + dt / DAY.lengthSeconds) % 1;
  for (const t of s.tiles.values()) {
    if (s.structures.length && floorAt(s, t.i, t.j)) t.growth = 0; // no grass grows under a plank floor
    else t.growth = Math.min(1, t.growth + (dt * growthMult(s, t)) / GRASS.growSeconds);
  }

  if (s.sea.docked) {
    s.sea.speed = 0;
    return;
  }
  if (s.sea.course) {
    const p = islandRelPos(s, s.sea.course);
    s.sea.heading = Math.atan2(p.x, p.z);
    s.sea.speed = SEA.sailSpeed;
  } else s.sea.speed = SEA.driftSpeed;
  const v = raftVelocity(s);
  s.sea.x += v.x * dt;
  s.sea.z += v.z * dt;

  // Islands are solid: touching one while moving toward it docks there (the course target or any island in the way).
  for (const id of ISLAND_ORDER) {
    const gap = islandGap(s, id);
    if (gap > SEA.dockGap) continue;
    const p = islandRelPos(s, id);
    if (v.x * p.x + v.z * p.z <= 0) continue; // moving away (just cast off)
    // Back off any overshoot so the raft rests exactly at the docking overlap.
    const back = SEA.dockGap - gap;
    const len = Math.hypot(v.x, v.z) || 1;
    s.sea.x -= (v.x / len) * back;
    s.sea.z -= (v.z / len) * back;
    dockAt(s, id);
    return;
  }
}
