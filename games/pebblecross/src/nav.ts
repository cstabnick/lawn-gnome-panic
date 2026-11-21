import { AGENT_RADIUS, NAV_CELL } from './config';

export interface Pt { x: number; z: number }
export interface Box { x: number; z: number; w: number; d: number }   // centre x, z; w along x, d along z; blocks walking
export interface Circle { x: number; z: number; r: number }           // blocks walking
export interface NavWorld { w: number; d: number; boxes: Box[]; circles: Circle[] }   // centred on (0,0)
export interface Nav {
  isFree(x: number, z: number): boolean;                       // true if a gnome of AGENT_RADIUS fits at x,z inside bounds
  nearestFree(x: number, z: number, maxR?: number): Pt | null; // default maxR 3
  findPath(from: Pt, to: Pt): Pt[] | null;   // waypoints after `from`, ending at the goal (snapped to a free cell); [] if already there; null if unreachable
}

const SQRT2 = Math.SQRT2;

// A tiny binary min-heap of (priority, node index). Lazy deletion: stale entries are skipped by the caller.
class MinHeap {
  private f: number[] = [];
  private v: number[] = [];
  get size(): number { return this.f.length; }
  push(priority: number, value: number): void {
    const f = this.f, v = this.v;
    let i = f.length;
    f.push(priority); v.push(value);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (f[p] <= priority) break;
      f[i] = f[p]; v[i] = v[p];
      i = p;
    }
    f[i] = priority; v[i] = value;
  }
  pop(): number {
    const f = this.f, v = this.v;
    const top = v[0];
    const lastF = f.pop() as number;
    const lastV = v.pop() as number;
    const n = f.length;
    if (n > 0) {
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        if (l >= n) break;
        const r = l + 1;
        const c = r < n && f[r] < f[l] ? r : l;
        if (f[c] >= lastF) break;
        f[i] = f[c]; v[i] = v[c];
        i = c;
      }
      f[i] = lastF; v[i] = lastV;
    }
    return top;
  }
}

export function makeNav(world: NavWorld, agentRadius: number = AGENT_RADIUS): Nav {
  const cell = NAV_CELL;
  const halfW = world.w / 2;
  const halfD = world.d / 2;
  const cols = Math.max(1, Math.ceil(world.w / cell));
  const rows = Math.max(1, Math.ceil(world.d / cell));
  const boxes = world.boxes;
  const circles = world.circles;

  // Obstacles get a 5 cm margin on top of the gnome's radius, so a path can never graze an edge exactly.
  const OBSTACLE_MARGIN = 0.05;
  const clear = agentRadius + OBSTACLE_MARGIN;

  // The exact geometric test: does a gnome of agentRadius fit at (x, z)? Allocates nothing.
  function exactFree(x: number, z: number): boolean {
    if (x < -halfW + agentRadius || x > halfW - agentRadius) return false;
    if (z < -halfD + agentRadius || z > halfD - agentRadius) return false;
    for (let b = 0; b < boxes.length; b++) {
      const bx = boxes[b];
      if (Math.abs(x - bx.x) <= bx.w / 2 + clear && Math.abs(z - bx.z) <= bx.d / 2 + clear) return false;
    }
    for (let c = 0; c < circles.length; c++) {
      const cc = circles[c];
      const dx = x - cc.x, dz = z - cc.z, rr = clear + cc.r;
      if (dx * dx + dz * dz <= rr * rr) return false;
    }
    return true;
  }

  function cellCentreX(i: number): number { return -halfW + (i + 0.5) * cell; }
  function cellCentreZ(j: number): number { return -halfD + (j + 0.5) * cell; }

  // Baked grid: one flag per cell, true when the cell centre is blocked.
  const blocked = new Uint8Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      blocked[j * cols + i] = exactFree(cellCentreX(i), cellCentreZ(j)) ? 0 : 1;
    }
  }

  function cellIndexOf(x: number, z: number): { i: number; j: number } {
    const i = Math.min(cols - 1, Math.max(0, Math.floor((x + halfW) / cell)));
    const j = Math.min(rows - 1, Math.max(0, Math.floor((z + halfD) / cell)));
    return { i, j };
  }

  // Nearest free cell index to (x, z) within maxR metres, or -1.
  function snapCell(x: number, z: number, maxR: number): number {
    const start = cellIndexOf(x, z);
    if (!blocked[start.j * cols + start.i]) return start.j * cols + start.i;
    const kMax = Math.ceil(maxR / cell) + 1;
    let best = -1;
    let bestD = Infinity;
    for (let k = 1; k <= kMax; k++) {
      for (let dj = -k; dj <= k; dj++) {
        for (let di = -k; di <= k; di++) {
          if (Math.max(Math.abs(di), Math.abs(dj)) !== k) continue;
          const i = start.i + di, j = start.j + dj;
          if (i < 0 || j < 0 || i >= cols || j >= rows) continue;
          const idx = j * cols + i;
          if (blocked[idx]) continue;
          const dx = cellCentreX(i) - x, dz = cellCentreZ(j) - z;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (d < bestD) { bestD = d; best = idx; }
        }
      }
      if (best >= 0 && bestD <= k * cell) break;
    }
    return best >= 0 && bestD <= maxR ? best : -1;
  }

  // A straight segment is clear when every sample on it is free. Samples are 2 cm apart, so a shallow clip past an
  // obstacle's grown edge cannot slip between them.
  function visible(a: Pt, b: Pt): boolean {
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    const steps = Math.max(1, Math.ceil(len / 0.02));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      if (!exactFree(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false;
    }
    return true;
  }

  function isFree(x: number, z: number): boolean {
    return exactFree(x, z);
  }

  function nearestFree(x: number, z: number, maxR: number = 3): Pt | null {
    if (exactFree(x, z)) return { x, z };
    const idx = snapCell(x, z, maxR);
    if (idx < 0) return null;
    const i = idx % cols, j = (idx - i) / cols;
    return { x: cellCentreX(i), z: cellCentreZ(j) };
  }

  function findPath(from: Pt, to: Pt): Pt[] | null {
    const startIdx = snapCell(from.x, from.z, 3);
    const goalIdx = snapCell(to.x, to.z, 3);
    if (startIdx < 0 || goalIdx < 0) return null;
    if (startIdx === goalIdx) return [];

    const n = cols * rows;
    const gScore = new Float64Array(n).fill(Infinity);
    const parent = new Int32Array(n).fill(-1);
    const closed = new Uint8Array(n);
    const gi = goalIdx % cols, gj = (goalIdx - gi) / cols;
    const gx = cellCentreX(gi), gz = cellCentreZ(gj);
    const heuristic = (idx: number): number => {
      const i = idx % cols, j = (idx - i) / cols;
      return Math.hypot(cellCentreX(i) - gx, cellCentreZ(j) - gz);
    };

    const heap = new MinHeap();
    gScore[startIdx] = 0;
    heap.push(heuristic(startIdx), startIdx);
    let found = false;
    let expansions = 0;
    const maxExpansions = n;

    while (heap.size > 0 && expansions < maxExpansions) {
      const cur = heap.pop();
      if (closed[cur]) continue;
      if (cur === goalIdx) { found = true; break; }
      closed[cur] = 1;
      expansions++;
      const ci = cur % cols, cj = (cur - ci) / cols;
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          if (di === 0 && dj === 0) continue;
          const ni = ci + di, nj = cj + dj;
          if (ni < 0 || nj < 0 || ni >= cols || nj >= rows) continue;
          const nIdx = nj * cols + ni;
          if (blocked[nIdx] || closed[nIdx]) continue;
          const diagonal = di !== 0 && dj !== 0;
          if (diagonal) {
            // Do not cut a blocked corner.
            const sideA = cj * cols + ni, sideB = nj * cols + ci;
            if (blocked[sideA] || blocked[sideB]) continue;
          }
          const g = gScore[cur] + (diagonal ? SQRT2 : 1);
          if (g < gScore[nIdx]) {
            gScore[nIdx] = g;
            parent[nIdx] = cur;
            heap.push(g + heuristic(nIdx), nIdx);
          }
        }
      }
    }
    if (!found) return null;

    // Walk back from the goal to the start, collecting cell centres (start excluded).
    const cells: number[] = [];
    for (let idx = goalIdx; idx !== startIdx; idx = parent[idx]) cells.push(idx);
    cells.reverse();
    const waypoints: Pt[] = cells.map((idx) => {
      const i = idx % cols, j = (idx - i) / cols;
      return { x: cellCentreX(i), z: cellCentreZ(j) };
    });

    // String-pull: from the anchor, jump to the furthest waypoint that is in plain view.
    const startPt: Pt = exactFree(from.x, from.z)
      ? { x: from.x, z: from.z }
      : { x: cellCentreX(startIdx % cols), z: cellCentreZ(Math.floor(startIdx / cols)) };
    const out: Pt[] = [];
    let anchor = startPt;
    let cur = -1;
    const last = waypoints.length - 1;
    while (cur < last) {
      let k = last;
      while (k > cur + 1 && !visible(anchor, waypoints[k])) k--;
      out.push(waypoints[k]);
      anchor = waypoints[k];
      cur = k;
    }
    return out;
  }

  return { isFree, nearestFree, findPath };
}
