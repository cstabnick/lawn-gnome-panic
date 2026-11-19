// Reachability: can a walker get from a zone's spawn to everything that matters in it?
import { WORLD, type ZoneDef, type ZoneId } from './config';
import { doorSpots } from './data/interiors';
import type { Terrain } from './terrainCore';

export interface ReachTarget {
  kind: 'spawn' | 'shrine' | 'region' | 'exit' | 'house' | 'deck' | 'prop';
  id: string;
  label: string;
  /** Where a walker has to get to, world coordinates. */
  x: number;
  z: number;
}

export interface ReachResult extends ReachTarget {
  reachable: boolean;
}

export interface ReachReport {
  zone: ZoneId;
  /** Cells the flood fill visited. */
  cells: number;
  results: ReachResult[];
  /** True when the flood fill visited the cell containing (x, z). */
  reached(x: number, z: number): boolean;
}

const CELL = 0.5;
const REACH_RADIUS = 1.5;
/** Cells per side of the window searched around a target: a cell centre up to REACH_RADIUS away lies within this many cells. */
const NEAR_CELLS = Math.ceil((REACH_RADIUS + CELL) / CELL);

const UNKNOWN = 0;
const VISITED = 1;
const BLOCKED = 2;

/** Flood fill over the terrain's isBlocked from def.spawn, 0.5 m cells, 4-connected, limited to the zone square plus
 * WORLD.blend, then checks every target. Uses whatever gate state `t` was built with. */
export function computeReachability(t: Terrain, def: ZoneDef): ReachReport {
  const origin = def.origin ?? { x: 0, z: 0 };
  const half = def.half + WORLD.blend;
  const minX = origin.x - half;
  const minZ = origin.z - half;
  const n = Math.ceil((2 * half) / CELL);

  // Cell (i, j) is state[i * n + j]: 0 not tested yet, 1 walker can stand there, 2 blocked.
  const state = new Uint8Array(n * n);
  const queue = new Int32Array(n * n);
  let tail = 0;

  const cellI = (x: number) => Math.floor((x - minX) / CELL);
  const cellJ = (z: number) => Math.floor((z - minZ) / CELL);
  const inGrid = (i: number, j: number) => i >= 0 && j >= 0 && i < n && j < n;
  const centreX = (i: number) => minX + (i + 0.5) * CELL;
  const centreZ = (j: number) => minZ + (j + 0.5) * CELL;

  const tryPush = (i: number, j: number) => {
    if (!inGrid(i, j)) return;
    const k = i * n + j;
    if (state[k] !== UNKNOWN) return;
    if (t.isBlocked(centreX(i), centreZ(j))) {
      state[k] = BLOCKED;
      return;
    }
    state[k] = VISITED;
    queue[tail++] = k;
  };

  const start = t.findFreeSpot(def.spawn.x, def.spawn.z);
  tryPush(cellI(start.x), cellJ(start.z));

  for (let head = 0; head < tail; head++) {
    const k = queue[head];
    const i = (k / n) | 0;
    const j = k - i * n;
    tryPush(i - 1, j);
    tryPush(i + 1, j);
    tryPush(i, j - 1);
    tryPush(i, j + 1);
  }

  const reached = (x: number, z: number): boolean => {
    const i = cellI(x);
    const j = cellJ(z);
    return inGrid(i, j) && state[i * n + j] === VISITED;
  };

  const reachedNear = (x: number, z: number, radius = REACH_RADIUS): boolean => {
    const ci = cellI(x);
    const cj = cellJ(z);
    const span = Math.max(NEAR_CELLS, Math.ceil(radius / CELL));
    for (let i = ci - span; i <= ci + span; i++) {
      for (let j = cj - span; j <= cj + span; j++) {
        if (!inGrid(i, j) || state[i * n + j] !== VISITED) continue;
        if (Math.hypot(centreX(i) - x, centreZ(j) - z) <= radius) return true;
      }
    }
    return false;
  };

  const targets: ReachTarget[] = [];
  targets.push({ kind: 'spawn', id: 'spawn', label: 'Spawn', x: def.spawn.x, z: def.spawn.z });
  targets.push({ kind: 'shrine', id: 'shrine', label: def.shrine.name, x: def.shrine.x, z: def.shrine.z });
  def.regions.forEach((r) => {
    targets.push({ kind: 'region', id: r.id, label: r.name, x: r.x, z: r.z });
  });
  for (const e of def.exits) {
    if (e.door) continue;
    targets.push({ kind: 'exit', id: e.to, label: `Exit to ${e.to}`, x: e.x, z: e.z });
  }
  def.houses.forEach((h, index) => {
    const id = h.id ?? `h${index}`;
    const door = doorSpots(h);
    targets.push({ kind: 'house', id, label: `House ${id}`, x: door.outX, z: door.outZ });
  });
  (def.decks ?? []).forEach((d, index) => {
    const foot = deckFoot(d);
    targets.push({ kind: 'deck', id: `deck${index}`, label: `Deck ${index}`, x: foot.x, z: foot.z });
  });

  // A region is an area, not a point: its centre may sit inside the building it is named after (the Granary, the Throne
  // Hall). It counts as reachable when a walker can stand within 60% of its radius of the centre.
  const regionR = new Map(def.regions.map((r) => [r.id, r.r]));
  const results: ReachResult[] = targets.map((target) => ({
    ...target,
    reachable: reachedNear(target.x, target.z, target.kind === 'region' ? Math.max(REACH_RADIUS, 0.6 * (regionR.get(target.id) ?? 0)) : REACH_RADIUS),
  }));

  let cells = 0;
  for (let k = 0; k < n * n; k++) if (state[k] === VISITED) cells++;

  return { zone: def.id, cells, results, reached };
}

/** The point at the foot of a deck's ramp, just off the ground end. */
function deckFoot(d: NonNullable<ZoneDef['decks']>[number]): { x: number; z: number } {
  switch (d.stair) {
    case 's': return { x: d.x, z: d.z + d.d / 2 + 2 * d.y };
    case 'n': return { x: d.x, z: d.z - d.d / 2 - 2 * d.y };
    case 'e': return { x: d.x + d.w / 2 + 2 * d.y, z: d.z };
    case 'w': return { x: d.x - d.w / 2 - 2 * d.y, z: d.z };
  }
}
