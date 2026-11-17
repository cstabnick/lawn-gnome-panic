// Grid A* pathfinding for click-to-move. Cells are 1 unit; cell (i, j) has its centre at (i, j).
export interface Point {
  x: number;
  z: number;
}

const SQRT2 = Math.SQRT2;
/** Give up after expanding this many nodes. */
const MAX_EXPAND = 16000;
/** Spacing of the samples used to test a straight line (finer than player WALK_SUBSTEP = 0.25). */
const SAMPLE = 0.2;

const DIRS: readonly [number, number][] = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

interface Node {
  i: number;
  j: number;
  g: number;
  h: number;
  f: number;
  parent: Node | null;
}

/** Binary min-heap ordered by f, then h. */
class MinHeap {
  private a: Node[] = [];

  get size(): number {
    return this.a.length;
  }

  private less(x: Node, y: Node): boolean {
    return x.f < y.f || (x.f === y.f && x.h < y.h);
  }

  push(n: Node): void {
    const a = this.a;
    a.push(n);
    let k = a.length - 1;
    while (k > 0) {
      const p = (k - 1) >> 1;
      if (!this.less(a[k], a[p])) break;
      [a[k], a[p]] = [a[p], a[k]];
      k = p;
    }
  }

  pop(): Node | undefined {
    const a = this.a;
    if (a.length === 0) return undefined;
    const top = a[0];
    const last = a.pop()!;
    if (a.length > 0) {
      a[0] = last;
      let k = 0;
      for (;;) {
        const l = 2 * k + 1;
        const r = l + 1;
        let m = k;
        if (l < a.length && this.less(a[l], a[m])) m = l;
        if (r < a.length && this.less(a[r], a[m])) m = r;
        if (m === k) break;
        [a[k], a[m]] = [a[m], a[k]];
        k = m;
      }
    }
    return top;
  }
}

/** Unique numeric key for a cell (safe for negative indices within the world). */
function cellKey(i: number, j: number): number {
  return (i + 4096) * 8192 + (j + 4096);
}

/** True when every sample along the straight line a -> b is free. */
function lineClear(a: Point, b: Point, blocked: (x: number, z: number) => boolean): boolean {
  const len = Math.hypot(b.x - a.x, b.z - a.z);
  const steps = Math.max(1, Math.ceil(len / SAMPLE));
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    if (blocked(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false;
  }
  return true;
}

/**
 * Waypoints from `from` to `to` (excluding `from`, including the end point), avoiding cells where blocked(x, z) is true.
 * If `to` is blocked or unreachable, the path ends at the reachable cell closest to `to`. Empty array = cannot move.
 */
export function findPath(from: Point, to: Point, blocked: (x: number, z: number) => boolean): Point[] {
  const si = Math.round(from.x);
  const sj = Math.round(from.z);
  const gi = Math.round(to.x);
  const gj = Math.round(to.z);

  // The start cell always counts as free, even if it is blocked.
  const isFree = (i: number, j: number): boolean => (i === si && j === sj) || !blocked(i, j);

  // Octile distance to the goal cell.
  const heur = (i: number, j: number): number => {
    const dx = Math.abs(i - gi);
    const dz = Math.abs(j - gj);
    return Math.max(dx, dz) + (SQRT2 - 1) * Math.min(dx, dz);
  };

  const bestG = new Map<number, number>();
  const closed = new Set<number>();
  const open = new MinHeap();

  const start: Node = { i: si, j: sj, g: 0, h: heur(si, sj), f: heur(si, sj), parent: null };
  open.push(start);
  bestG.set(cellKey(si, sj), 0);

  const startBlocked = blocked(from.x, from.z);
  // Expanded cell closest to the goal, used when the goal is not reached.
  let closest = start;
  let reached: Node | null = null;
  let expanded = 0;

  while (open.size > 0) {
    const n = open.pop()!;
    const k = cellKey(n.i, n.j);
    if (closed.has(k)) continue;

    if (n.i === gi && n.j === gj) {
      reached = n;
      break;
    }

    closed.add(k);
    expanded++;
    if (n.h < closest.h) closest = n;
    if (expanded >= MAX_EXPAND) break;

    for (const [di, dj] of DIRS) {
      const ni = n.i + di;
      const nj = n.j + dj;
      if (!isFree(ni, nj)) continue;
      const diagonal = di !== 0 && dj !== 0;
      // No corner cutting: both orthogonal neighbours must be free.
      if (diagonal && (!isFree(n.i + di, n.j) || !isFree(n.i, n.j + dj))) continue;
      if (!(n === start && startBlocked)) {
        const ax = n === start ? from.x : n.i;
        const az = n === start ? from.z : n.j;
        if (!lineClear({ x: ax, z: az }, { x: ni, z: nj }, blocked)) continue;
      }

      const nk = cellKey(ni, nj);
      if (closed.has(nk)) continue;
      const g = n.g + (diagonal ? SQRT2 : 1);
      if (g < (bestG.get(nk) ?? Infinity)) {
        bestG.set(nk, g);
        const h = heur(ni, nj);
        open.push({ i: ni, j: nj, g, h, f: g + h, parent: n });
      }
    }
  }

  const end = reached ?? closest;
  if (!reached && end === start) return [];

  // Walk the parents back to the start, then drop the start cell.
  const cells: Node[] = [];
  for (let n: Node | null = end; n !== null; n = n.parent) cells.push(n);
  cells.reverse();
  const pts: Point[] = cells.slice(1).map((n) => ({ x: n.i, z: n.j }));

  // A reached, free goal ends exactly on the requested point if the final segment is clear.
  if (reached) {
    const exact = { x: to.x, z: to.z };
    const prev = pts.length >= 2 ? pts[pts.length - 2] : from;
    if (lineClear(prev, exact, blocked)) {
      if (pts.length === 0) pts.push(exact);
      else pts[pts.length - 1] = exact;
    }
  }

  // Smooth: from the current point, jump to the farthest waypoint with a clear straight line.
  const out: Point[] = [];
  let cur: Point = { x: from.x, z: from.z };
  let k = 0;
  while (k < pts.length) {
    let far = k;
    for (let m = k + 1; m < pts.length; m++) {
      if (lineClear(cur, pts[m], blocked)) far = m;
      else break;
    }
    cur = pts[far];
    out.push(cur);
    k = far + 1;
  }
  return out;
}

// ---------------------------------------------------------------- heights

export interface Point3 {
  x: number;
  y: number;
  z: number;
}

/** Height a walker standing at fromY ends up at when stepping onto (x, z), or null when it cannot step there. */
export type StepFn = (x: number, z: number, fromY: number) => number | null;

/** Height bands of the search state: a node is (cell, level), level = floor(y / LEVEL_HEIGHT). */
const LEVEL_HEIGHT = 2;
/** How close (m) a path's end height must be to the requested one. */
const HEIGHT_TOL = 1.5;

interface Node3 extends Node {
  y: number;
}

function stateKey(i: number, j: number, y: number): number {
  const level = Math.max(-32, Math.min(31, Math.floor(y / LEVEL_HEIGHT)));
  return cellKey(i, j) * 64 + (level + 32);
}

/** Walks from (ax, az) at ay to (bx, bz) in SAMPLE-sized steps, returning the ending height or null if blocked. */
function walkLine3(ax: number, az: number, ay: number, bx: number, bz: number, step: StepFn): number | null {
  const len = Math.hypot(bx - ax, bz - az);
  const steps = Math.max(1, Math.ceil(len / SAMPLE));
  let y = ay;
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    const ny = step(ax + (bx - ax) * t, az + (bz - az) * t, y);
    if (ny === null) return null;
    y = ny;
  }
  return y;
}

/** True when the straight line a -> b can be walked from a.y, sampling every SAMPLE metres, and ends near b.y. */
function lineClear3(a: Point3, b: Point3, step: StepFn): boolean {
  const y = walkLine3(a.x, a.z, a.y, b.x, b.z, step);
  return y !== null && Math.abs(y - b.y) < HEIGHT_TOL;
}

/**
 * Like findPath, but walking is height-aware: step(x, z, fromY) says where a walker at fromY lands when it steps onto
 * (x, z) (a ramp, deck or ground surface), or null when it cannot. Returns waypoints with their y. The goal is reached
 * at the goal cell with a height within 1.5 m of to.y; otherwise the path ends at the closest node reached.
 */
export function findPath3(from: Point3, to: Point3, step: StepFn): Point3[] {
  const si = Math.round(from.x);
  const sj = Math.round(from.z);
  const gi = Math.round(to.x);
  const gj = Math.round(to.z);

  // The start cell always counts as reachable, as in findPath.
  const canStep = (i: number, j: number, fromY: number): boolean =>
    (i === si && j === sj) || step(i, j, fromY) !== null;

  const heur = (i: number, j: number): number => {
    const dx = Math.abs(i - gi);
    const dz = Math.abs(j - gj);
    return Math.max(dx, dz) + (SQRT2 - 1) * Math.min(dx, dz);
  };
  const heightGap = (y: number): number => Math.abs(y - to.y);

  const bestG = new Map<number, number>();
  const closed = new Set<number>();
  const open = new MinHeap();

  const h0 = heur(si, sj);
  const start: Node3 = { i: si, j: sj, y: from.y, g: 0, h: h0, f: h0, parent: null };
  open.push(start);
  bestG.set(stateKey(si, sj, from.y), 0);

  const startBlocked = step(from.x, from.z, from.y) === null;
  // Expanded node closest to the goal (by cell distance plus height gap), used when the goal is not reached.
  let closest: Node3 = start;
  let closestScore = h0 + heightGap(from.y);
  let reached: Node3 | null = null;
  let expanded = 0;

  while (open.size > 0) {
    const n = open.pop() as Node3;
    const k = stateKey(n.i, n.j, n.y);
    if (closed.has(k)) continue;

    if (n.i === gi && n.j === gj && heightGap(n.y) < HEIGHT_TOL) {
      reached = n;
      break;
    }

    closed.add(k);
    expanded++;
    const score = n.h + heightGap(n.y);
    if (score < closestScore) {
      closest = n;
      closestScore = score;
    }
    if (expanded >= MAX_EXPAND) break;

    for (const [di, dj] of DIRS) {
      const ni = n.i + di;
      const nj = n.j + dj;
      const diagonal = di !== 0 && dj !== 0;
      // No corner cutting: both orthogonal neighbours must be reachable from this height.
      if (diagonal && (!canStep(n.i + di, n.j, n.y) || !canStep(n.i, n.j + dj, n.y))) continue;
      let ny = step(ni, nj, n.y);
      if (ny === null) continue;
      if (!(n === start && startBlocked)) {
        ny = walkLine3(n === start ? from.x : n.i, n === start ? from.z : n.j, n.y, ni, nj, step);
        if (ny === null) continue;
      }

      const nk = stateKey(ni, nj, ny);
      if (closed.has(nk)) continue;
      const g = n.g + (diagonal ? SQRT2 : 1);
      if (g < (bestG.get(nk) ?? Infinity)) {
        bestG.set(nk, g);
        const h = heur(ni, nj);
        const node: Node3 = { i: ni, j: nj, y: ny, g, h, f: g + h, parent: n };
        open.push(node);
      }
    }
  }

  const end = reached ?? closest;
  if (!reached && end === start) return [];

  // Walk the parents back to the start, then drop the start cell.
  const cells: Node3[] = [];
  for (let n: Node3 | null = end; n !== null; n = n.parent as Node3 | null) cells.push(n);
  cells.reverse();
  const pts: Point3[] = cells.slice(1).map((n) => ({ x: n.i, y: n.y, z: n.j }));

  // A reached goal ends exactly on the requested point if the final segment is clear.
  if (reached) {
    const prev = pts.length >= 2 ? pts[pts.length - 2] : from;
    const ey = walkLine3(prev.x, prev.z, prev.y, to.x, to.z, step);
    if (ey !== null && Math.abs(ey - reached.y) < HEIGHT_TOL) {
      const exact: Point3 = { x: to.x, y: ey, z: to.z };
      if (pts.length === 0) pts.push(exact);
      else pts[pts.length - 1] = exact;
    }
  }

  // Smooth: from the current point, jump to the farthest waypoint that a walker can reach in a straight line.
  const out: Point3[] = [];
  let cur: Point3 = { x: from.x, y: from.y, z: from.z };
  let k = 0;
  while (k < pts.length) {
    let far = k;
    for (let m = k + 1; m < pts.length; m++) {
      if (lineClear3(cur, pts[m], step)) far = m;
      else break;
    }
    cur = pts[far];
    out.push(cur);
    k = far + 1;
  }
  return out;
}
