// Grid A* pathfinding for click-to-move. Cells are 1 unit; cell (i, j) has its centre at (i, j).
export interface Point {
  x: number;
  z: number;
}

const SQRT2 = Math.SQRT2;
/** Give up after expanding this many nodes. */
const MAX_EXPAND = 6000;
/** Spacing of the samples used to test a straight line. */
const SAMPLE = 0.4;

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

  // A reached, free goal ends exactly on the requested point.
  if (reached) {
    const exact = { x: to.x, z: to.z };
    if (pts.length === 0) pts.push(exact);
    else pts[pts.length - 1] = exact;
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
