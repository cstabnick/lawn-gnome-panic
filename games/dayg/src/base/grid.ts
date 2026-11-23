// Plot grid: snapping, slot keys, geometry of pieces. Pure: no DOM, no three.js, no Math.random.
import type { Collider } from '../world/collide';
import type { ClimbRouteDef, Side } from '../world/types';
import { REGIONS } from '../sim/regions';
import { BUILD_REACH, PIECES, PLOT, PLOT_SIZE } from './config';
import type { Aim, BaseState, Box, ClaimResult, EdgeAxis, PieceState, Placement, PlotDef, SlotKey, SlotKind } from './types';

export type ParsedSlot = { kind: 'edge'; axis: EdgeAxis; i: number; j: number } | { kind: 'cell'; i: number; j: number };

const T = PLOT.tiles;
const S = PLOT.tile;
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export function snapPlot(x: number, z: number): { x0: number; z0: number } {
  return {
    x0: PLOT.snap * Math.round((x - PLOT_SIZE / 2) / PLOT.snap),
    z0: PLOT.snap * Math.round((z - PLOT_SIZE / 2) / PLOT.snap),
  };
}

export function claimCheck(collider: Collider, x: number, y: number, z: number): ClaimResult {
  const { x0, z0 } = snapPlot(x, z);
  const region = collider.regionAt(x0 + PLOT_SIZE / 2, z0 + PLOT_SIZE / 2);
  if (region === null) return { ok: false, why: 'Off the map.' };
  for (let b = 0; b <= T; b++) {
    for (let a = 0; a <= T; a++) {
      const px = x0 + a * S, pz = z0 + b * S;
      if (!collider.inBounds(px, pz)) return { ok: false, why: 'Off the map.' };
      if (collider.regionAt(px, pz) !== region) return { ok: false, why: 'This spot straddles two places.' };
      if (collider.baseAt(px, pz) !== 0) return { ok: false, why: 'You cannot build in a pit.' };
      if (collider.havenAt(px, y, pz) !== null) return { ok: false, why: 'Too close to a haven.' };
      if (Math.abs(collider.groundAt(px, pz, y + 0.1) - y) > PLOT.flatTolerance) return { ok: false, why: 'The ground is not flat here.' };
    }
  }
  const def = REGIONS.find((r) => r.id === region);
  if (def?.traits.includes('HAVEN')) return { ok: false, why: 'Too close to a haven.' };
  const out = { x: 0, y, z: 0 };
  for (let b = 0; b < PLOT_SIZE; b++) {
    for (let a = 0; a < PLOT_SIZE; a++) {
      const px = x0 + a + 0.5, pz = z0 + b + 0.5;
      if (collider.move({ x: px, y, z: pz }, 0, 0, 0.3, 1.7, 0.5, out) !== null) return { ok: false, why: 'Something is in the way.' };
    }
  }
  return { ok: true, plot: { x0, z0, y, region } };
}

export function plotContains(plot: PlotDef, x: number, z: number, margin = 0): boolean {
  return x >= plot.x0 - margin && x <= plot.x0 + PLOT_SIZE + margin && z >= plot.z0 - margin && z <= plot.z0 + PLOT_SIZE + margin;
}

export function plotCenter(plot: PlotDef): { x: number; z: number } {
  return { x: plot.x0 + PLOT_SIZE / 2, z: plot.z0 + PLOT_SIZE / 2 };
}

export function edgeKey(axis: EdgeAxis, i: number, j: number): SlotKey { return `e:${axis}:${i}:${j}`; }
export function cellKey(i: number, j: number): SlotKey { return `c:${i}:${j}`; }

export function parseSlot(key: SlotKey): ParsedSlot | null {
  if (typeof key !== 'string') return null;
  let m = /^e:([xz]):(\d+):(\d+)$/.exec(key);
  if (m) {
    const axis = m[1] as EdgeAxis;
    const i = Number(m[2]), j = Number(m[3]);
    const inRange = axis === 'x'
      ? i <= T - 1 && j <= T
      : i <= T && j <= T - 1;
    if (!inRange || edgeKey(axis, i, j) !== key) return null;
    return { kind: 'edge', axis, i, j };
  }
  m = /^c:(\d+):(\d+)$/.exec(key);
  if (m) {
    const i = Number(m[1]), j = Number(m[2]);
    if (i > T - 1 || j > T - 1 || cellKey(i, j) !== key) return null;
    return { kind: 'cell', i, j };
  }
  return null;
}

export function allEdges(): SlotKey[] {
  const out: SlotKey[] = [];
  for (let j = 0; j <= T; j++) for (let i = 0; i <= T - 1; i++) out.push(edgeKey('x', i, j));
  for (let i = 0; i <= T; i++) for (let j = 0; j <= T - 1; j++) out.push(edgeKey('z', i, j));
  return out;
}

export function allCells(): SlotKey[] {
  const out: SlotKey[] = [];
  for (let j = 0; j < T; j++) for (let i = 0; i < T; i++) out.push(cellKey(i, j));
  return out;
}

export function isPerimeter(key: SlotKey): boolean {
  const p = parseSlot(key);
  if (!p || p.kind !== 'edge') return false;
  return p.axis === 'x' ? (p.j === 0 || p.j === T) : (p.i === 0 || p.i === T);
}

export function edgeCenter(plot: PlotDef, key: SlotKey): { x: number; z: number } {
  const p = parseSlot(key);
  if (!p) return plotCenter(plot);
  if (p.kind === 'cell') return cellCenter(plot, key);
  return p.axis === 'x'
    ? { x: plot.x0 + (p.i + 0.5) * S, z: plot.z0 + p.j * S }
    : { x: plot.x0 + p.i * S, z: plot.z0 + (p.j + 0.5) * S };
}

export function cellCenter(plot: PlotDef, key: SlotKey): { x: number; z: number } {
  const p = parseSlot(key);
  if (!p) return plotCenter(plot);
  const i = p.i, j = p.j;
  return { x: plot.x0 + (i + 0.5) * S, z: plot.z0 + (j + 0.5) * S };
}

export function aimAt(plot: PlotDef, x: number, z: number, facing: number, kind: SlotKind): Aim | null {
  const ax = x + Math.sin(facing) * BUILD_REACH;
  const az = z + Math.cos(facing) * BUILD_REACH;
  if (!plotContains(plot, ax, az, 0.5)) return null;
  if (kind === 'cell') {
    const i = clamp(Math.floor((ax - plot.x0) / S), 0, T - 1);
    const j = clamp(Math.floor((az - plot.z0) / S), 0, T - 1);
    return { slot: cellKey(i, j), kind: 'cell', side: 1 };
  }
  // nearest 'x' edge
  const xj = clamp(Math.round((az - plot.z0) / S), 0, T);
  const xi = clamp(Math.floor((ax - plot.x0) / S), 0, T - 1);
  const xDist = Math.abs(az - (plot.z0 + xj * S));
  // nearest 'z' edge
  const zi = clamp(Math.round((ax - plot.x0) / S), 0, T);
  const zj = clamp(Math.floor((az - plot.z0) / S), 0, T - 1);
  const zDist = Math.abs(ax - (plot.x0 + zi * S));
  if (xDist <= zDist) {
    if (xDist > 1.5) return null;
    const line = plot.z0 + xj * S;
    return { slot: edgeKey('x', xi, xj), kind, side: z < line ? -1 : 1 };
  }
  if (zDist > 1.5) return null;
  const line = plot.x0 + zi * S;
  return { slot: edgeKey('z', zi, zj), kind, side: x < line ? -1 : 1 };
}

/** The closed box of a solid edge piece, ignoring whether a door is open. */
function closedEdgeBox(plot: PlotDef, piece: Pick<PieceState, 'kind' | 'slot' | 'side' | 'overDoor'>): Box | null {
  const def = PIECES[piece.kind];
  const p = parseSlot(piece.slot);
  if (!def.solid || !p || p.kind !== 'edge') return null;
  const t = PLOT.thickness, inset = PLOT.inset;
  const i = p.i, j = p.j;
  const useOverDoor = piece.kind === 'barricade' && piece.overDoor;
  if (p.axis === 'x') {
    const line = plot.z0 + j * S;
    const start = plot.x0 + i * S + inset, end = plot.x0 + (i + 1) * S - inset;
    const c = useOverDoor ? line + piece.side * (t / 2 + 0.15) : line;
    const half = useOverDoor ? 0.1 : t / 2;
    return { x0: start, x1: end, z0: c - half, z1: c + half, y: plot.y, h: def.height };
  }
  const line = plot.x0 + i * S;
  const start = plot.z0 + j * S + inset, end = plot.z0 + (j + 1) * S - inset;
  const c = useOverDoor ? line + piece.side * (t / 2 + 0.15) : line;
  const half = useOverDoor ? 0.1 : t / 2;
  return { x0: c - half, x1: c + half, z0: start, z1: end, y: plot.y, h: def.height };
}

export function pieceBox(plot: PlotDef, piece: Pick<PieceState, 'kind' | 'slot' | 'side' | 'overDoor' | 'open'>): Box | null {
  if (piece.kind === 'door' && piece.open) return null;
  return closedEdgeBox(plot, piece);
}

export function piecePlacement(plot: PlotDef, piece: Pick<PieceState, 'kind' | 'slot' | 'side' | 'overDoor'>): Placement {
  const p = parseSlot(piece.slot);
  if (!p) return { x: plot.x0 + PLOT_SIZE / 2, y: plot.y, z: plot.z0 + PLOT_SIZE / 2, rotY: 0 };
  if (p.kind === 'cell') {
    const c = cellCenter(plot, piece.slot);
    return { x: c.x, y: plot.y, z: c.z, rotY: 0 };
  }
  const t = PLOT.thickness;
  if (piece.kind === 'ladder') {
    const off = t / 2 + 0.6;
    if (p.axis === 'x') {
      const c = edgeCenter(plot, piece.slot);
      const line = plot.z0 + p.j * S;
      return { x: c.x, y: plot.y, z: line + piece.side * off, rotY: piece.side === -1 ? 0 : Math.PI };
    }
    const c = edgeCenter(plot, piece.slot);
    const line = plot.x0 + p.i * S;
    return { x: line + piece.side * off, y: plot.y, z: c.z, rotY: piece.side === -1 ? Math.PI / 2 : -Math.PI / 2 };
  }
  const box = closedEdgeBox(plot, piece);
  if (!box) return { x: plot.x0 + PLOT_SIZE / 2, y: plot.y, z: plot.z0 + PLOT_SIZE / 2, rotY: 0 };
  return {
    x: (box.x0 + box.x1) / 2,
    y: plot.y,
    z: (box.z0 + box.z1) / 2,
    rotY: p.axis === 'x' ? 0 : -Math.PI / 2,
  };
}

export function doorHinge(plot: PlotDef, piece: Pick<PieceState, 'slot'>): { x: number; z: number } {
  const p = parseSlot(piece.slot);
  const box = closedEdgeBox(plot, { kind: 'door', slot: piece.slot, side: 1, overDoor: false });
  if (!p || p.kind !== 'edge' || !box) return plotCenter(plot);
  if (p.axis === 'x') return { x: box.x0, z: (box.z0 + box.z1) / 2 };
  return { x: (box.x0 + box.x1) / 2, z: box.z0 };
}

export function ladderRoute(piece: Pick<PieceState, 'id' | 'side'>, wall: Pick<PieceState, 'id' | 'slot'>): ClimbRouteDef {
  const p = parseSlot(wall.slot);
  const axis: EdgeAxis = p && p.kind === 'edge' ? p.axis : 'x';
  let side: Side;
  if (axis === 'x') side = piece.side === -1 ? 'n' : 's';
  else side = piece.side === -1 ? 'w' : 'e';
  return { id: `${piece.id}-route`, block: wall.id, side, kind: 'ladder', at: (S - 2 * PLOT.inset) / 2 };
}

export function sealedCells(base: BaseState): boolean[] {
  const closed = new Set<SlotKey>();
  for (const pc of base.pieces) {
    if (pc.kind === 'plank-wall' || pc.kind === 'barricade' || (pc.kind === 'door' && !pc.open)) closed.add(pc.slot);
  }
  const isOpen = (key: SlotKey): boolean => !closed.has(key);
  const reachable: boolean[] = new Array(T * T).fill(false);
  const queue: number[] = [];
  for (let j = 0; j < T; j++) {
    for (let i = 0; i < T; i++) {
      const outside =
        (j === 0 && isOpen(edgeKey('x', i, 0))) ||
        (j === T - 1 && isOpen(edgeKey('x', i, T))) ||
        (i === 0 && isOpen(edgeKey('z', 0, j))) ||
        (i === T - 1 && isOpen(edgeKey('z', T, j)));
      if (outside) { reachable[j * T + i] = true; queue.push(j * T + i); }
    }
  }
  while (queue.length > 0) {
    const idx = queue.shift()!;
    const i = idx % T, j = Math.floor(idx / T);
    const next: [number, number, SlotKey][] = [
      [i, j - 1, edgeKey('x', i, j)],
      [i, j + 1, edgeKey('x', i, j + 1)],
      [i - 1, j, edgeKey('z', i, j)],
      [i + 1, j, edgeKey('z', i + 1, j)],
    ];
    for (const [ni, nj, key] of next) {
      if (ni < 0 || nj < 0 || ni >= T || nj >= T) continue;
      const nIdx = nj * T + ni;
      if (reachable[nIdx] || !isOpen(key)) continue;
      reachable[nIdx] = true;
      queue.push(nIdx);
    }
  }
  return reachable.map((r) => !r);
}

export function sealedAt(base: BaseState, x: number, z: number): boolean {
  if (!plotContains(base.plot, x, z)) return false;
  const i = clamp(Math.floor((x - base.plot.x0) / S), 0, T - 1);
  const j = clamp(Math.floor((z - base.plot.z0) / S), 0, T - 1);
  return sealedCells(base)[j * T + i];
}

export function boxHitsCircle(box: Box, x: number, z: number, r: number): boolean {
  const cx = clamp(x, box.x0, box.x1), cz = clamp(z, box.z0, box.z1);
  const dx = x - cx, dz = z - cz;
  return Math.sqrt(dx * dx + dz * dz) < r;
}
