// Floor 2½: Synergy. A beige maze of 4 x 4 m cubicles where everyone is asleep at their desk,
// a break room to the west (arcade cabinet, vending machine, couch) and a clear aisle down the middle from the lift.
import type { FloorLayout, NpcPlacement, PropPlacement, WallSeg } from '../types';

type Side = 'N' | 'S' | 'E' | 'W';

const CELL = 4;
const GAP = 1.6;
const MAZE_Z0 = -9;
const ROWS = 5;
/** Two blocks of cubicles either side of the aisle (x -1.5..1.5). Columns are numbered 0..4 across both. */
const BLOCKS = [
  { x0: -10, cols: 2, first: 0 },
  { x0: 2, cols: 3, first: 2 },
] as const;
const COL_X0 = [-10, -6, 2, 6, 10];

/**
 * Each cubicle has exactly one 1.6 m gap, alternating sides by row. Every gap leads one step closer to an open
 * corridor or the aisle, so the cubicles form a tree rooted outside and the whole maze is connected:
 * col 0 -> west corridor, col 1 -> aisle, col 2 -> aisle, col 3 -> col 2 or col 4, col 4 -> east corridor.
 */
function gapOf(col: number, row: number): Side {
  const even = row % 2 === 0;
  switch (col) {
    case 0: return even ? 'W' : 'N';
    case 1: return even ? 'E' : 'N';
    case 2: return even ? 'W' : 'S';
    case 3: return even ? 'W' : 'E';
    default: return even ? 'E' : 'N';
  }
}

/** Emits one grid line as merged runs (no two collinear partitions touching end to end), cut at gapped edges. */
function emitLine(out: WallSeg[], edges: { a: number; gapped: boolean }[], fixed: number, alongX: boolean): void {
  let start: number | null = null;
  const push = (from: number, to: number) => {
    if (to - from < 0.05) return;
    out.push(alongX ? { x0: from, z0: fixed, x1: to, z1: fixed } : { x0: fixed, z0: from, x1: fixed, z1: to });
  };
  for (const e of edges) {
    if (start === null) start = e.a;
    if (e.gapped) {
      const mid = e.a + CELL / 2;
      push(start, mid - GAP / 2);
      start = mid + GAP / 2;
    }
  }
  const last = edges[edges.length - 1];
  if (start !== null && last) push(start, last.a + CELL);
}

function mazeWalls(): WallSeg[] {
  const out: WallSeg[] = [];
  for (const b of BLOCKS) {
    // Horizontal lines z = MAZE_Z0 + 4k.
    for (let k = 0; k <= ROWS; k++) {
      const edges = [];
      for (let c = 0; c < b.cols; c++) {
        const col = b.first + c;
        const gapped = (k > 0 && gapOf(col, k - 1) === 'S') || (k < ROWS && gapOf(col, k) === 'N');
        edges.push({ a: b.x0 + c * CELL, gapped });
      }
      emitLine(out, edges, MAZE_Z0 + k * CELL, true);
    }
    // Vertical lines x = x0 + 4j.
    for (let j = 0; j <= b.cols; j++) {
      const edges = [];
      for (let r = 0; r < ROWS; r++) {
        const west = j > 0 ? b.first + j - 1 : -1;
        const east = j < b.cols ? b.first + j : -1;
        const gapped = (west >= 0 && gapOf(west, r) === 'E') || (east >= 0 && gapOf(east, r) === 'W');
        edges.push({ a: MAZE_Z0 + r * CELL, gapped });
      }
      emitLine(out, edges, b.x0 + j * CELL, false);
    }
  }
  return out;
}

// ---------- desks, chairs, sleepers ----------
const OPPOSITE: Record<Side, Side> = { N: 'S', S: 'N', E: 'W', W: 'E' };
/** Unit vector pointing from the cubicle centre toward a side. */
const DIR: Record<Side, { x: number; z: number }> = { N: { x: 0, z: -1 }, S: { x: 0, z: 1 }, E: { x: 1, z: 0 }, W: { x: -1, z: 0 } };
/** Yaw (radians) that faces a side: the gnome model faces +z at 0. */
const FACE: Record<Side, number> = { N: Math.PI, S: 0, E: Math.PI / 2, W: -Math.PI / 2 };

const HATS = [0x4a6fa5, 0x8a5a3b, 0x6b8f4e, 0xb04a4a, 0x7a5a9a, 0x3f7f7f, 0xc28a2e, 0x5a5a6a];
const SHIRTS = [0xd8cfc0, 0xb7c6d8, 0xe0d2a8, 0xc9b6c9, 0xa8c2a0, 0xe6c2a8, 0xbfbfbf, 0xd0b090];

/** Cubicles [col, row] with a sleeping coworker. sleeper-1 is next to the aisle, just south of the lift. */
const SLEEPERS: readonly [number, number][] = [[1, 0], [2, 1], [0, 2], [3, 3], [4, 0], [1, 4], [4, 2], [2, 4]];
/** Cubicles left bare (a desk only, no chair): "most cubicles" get both. */
const BARE: readonly [number, number][] = [[3, 1], [0, 4]];

const props: PropPlacement[] = [];
const npcs: NpcPlacement[] = [];
let sleeperFront = { x: 0, z: 0 };

for (let col = 0; col < COL_X0.length; col++) {
  for (let row = 0; row < ROWS; row++) {
    const cx = COL_X0[col] + CELL / 2;
    const cz = MAZE_Z0 + row * CELL + CELL / 2;
    const gap = gapOf(col, row);
    const back = OPPOSITE[gap];
    const d = DIR[back];
    // Desk against the wall opposite the gap, long side along that wall.
    const deskOff = CELL / 2 - 0.65;
    const along = back === 'N' || back === 'S';
    props.push({ prefab: 'office-desk', x: cx + d.x * deskOff, z: cz + d.z * deskOff, rot: along ? 0 : 90, solid: true });

    const seatOff = CELL / 2 - 1.45;
    const seat = { x: cx + d.x * seatOff, z: cz + d.z * seatOff };
    const si = SLEEPERS.findIndex(([c, r]) => c === col && r === row);
    if (si >= 0) {
      const n = si + 1;
      npcs.push({
        id: `sleeper-${n}`,
        x: seat.x, z: seat.z,
        facing: FACE[back],
        asleep: true,
        look: {
          hat: HATS[si], shirt: SHIRTS[si],
          ...(si % 3 === 0 ? { beard: 0xdedede } : {}),
          ...(si % 2 === 1 ? { glasses: true } : {}),
        },
      });
      // The chair got pushed into a corner a long time ago.
      const side = along ? { x: 1, z: 0 } : { x: 0, z: 1 };
      props.push({ prefab: 'chair', x: cx + side.x * 1.35 - d.x * 1.2, z: cz + side.z * 1.35 - d.z * 1.2, rot: 30 + si * 17 });
      if (n === 1) sleeperFront = { x: seat.x - d.x * 0.85, z: seat.z - d.z * 0.85 };
    } else if (!BARE.some(([c, r]) => c === col && r === row)) {
      // An empty chair pulled up to the desk, facing it.
      props.push({ prefab: 'chair', x: seat.x, z: seat.z, rot: (FACE[back] * 180) / Math.PI });
    }
  }
}

// ---------- break room (west) ----------
const breakWalls: WallSeg[] = [
  { x0: -18, z0: -6, x1: -12.5, z1: -6 },
  { x0: -18, z0: 6, x1: -12.5, z1: 6 },
  // One wide doorway in the east side (z -2.5..2.5).
  { x0: -12.5, z0: -6, x1: -12.5, z1: -2.5 },
  { x0: -12.5, z0: 2.5, x1: -12.5, z1: 6 },
];
props.push(
  { prefab: 'arcade-cabinet', x: -17, z: 0, rot: 90, solid: true },
  { prefab: 'vending-machine', x: -17, z: 3.5, rot: 90, solid: true },
  { prefab: 'couch', x: -14, z: -4.5, solid: true },
);

// ---------- odds and ends ----------
const plant = (x: number, z: number): PropPlacement => ({ prefab: 'spiky-potted-plant', x, z, solid: true });
props.push(
  { prefab: 'wall-clock', x: 6, z: -14.85, y: 2.2 },
  plant(-17.2, -14.2), plant(17.2, -14.2), plant(-17.2, 14.2), plant(17.2, 14.2),
  plant(-3, -14.2), plant(3, -14.2),
);

export const F3: FloorLayout = {
  id: 'f3',
  title: 'Floor 2½: Synergy',
  w: 36,
  d: 30,
  floorColor: 0xb8a08f,
  wallColor: 0xf2ece9,
  elevatorX: 0,
  spawn: { x: 0, z: -12.5, facing: 0 },
  windows: false,
  walls: [...mazeWalls(), ...breakWalls],
  props,
  npcs,
  areas: {
    maze: { x0: -12, z0: -9, x1: 16, z1: 12 },
    aisle: { x0: -1.5, z0: -14, x1: 1.5, z1: 13 },
    'break-room': { x0: -17.5, z0: -6, x1: -12.5, z1: 6 },
    all: { x0: -17.5, z0: -14.5, x1: 17.5, z1: 14.5 },
  },
  interactables: [
    { id: 'arcade', label: 'Play', x: -16, z: 0, radius: 1.4 },
    { id: 'clock', label: 'Look', x: 6, z: -14, radius: 1.2 },
    { id: 'sleeper', label: 'Wake', x: sleeperFront.x, z: sleeperFront.z, radius: 1.2 },
  ],
};
