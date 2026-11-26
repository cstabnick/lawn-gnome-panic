// Race tracks as data (E14): a TrackDef describes a centre line (closed circuit or point-to-point route), its height
// profile (rises, banked corners, jumps, whoops, ford dips), its gates and how it shapes the terrain. createTrack(def)
// turns a def into a Track: samples, locate, gates, a gate tracker, the start grid and the terrain relief. The
// Lost & Found Speedway (track.ts), the Rutbottom Dirt Bowl and the Capwood Run (defs/) are all Tracks; tracks.ts is
// the registry. Pure: no three.js, no DOM, no game imports (only types).
//
// Coordinates are world metres, x east, z south; yaw 0 faces +z and yaw = atan2(dx, dz), like the rest of the game.
// `s` is the distance along the centre line in the direction of racing. Closed tracks: 0..length, 0 = start/finish
// line. Open (point-to-point) tracks: 0 = control point 0, the start line is at startS() and the finish at finishS().
import type { SurfaceKind } from '../surfaces';

/** A control point of the centre line. `lift` raises the road (m); `bank` raises the outside edge of a corner (m). */
export interface TrackControl { x: number; z: number; lift?: number; bank?: number }

/** A kicker on the road at distance `s`: rises `rise` m over `up` m, then drops back over `down` m. */
export interface TrackJump { id: string; name: string; s: number; rise: number; up: number; down: number }

/** A stretch of high-frequency bumps ("whoops"): `amp` m high, one every `wave` m, from s `from` to `to`. */
export interface TrackWhoops { from: number; to: number; amp: number; wave: number }

/**
 * A ford: the road dips `dip` m into a trough `len` m long centred on `s`, and a sheet of water stands `depth` m over the
 * bottom of the dip. The water reaches `reach` m either side of the centre line (default barrierOffset + 4). Ford
 * water is "Cap-water" (lore): it slows a car and soaks it a little, but never floods it (waterlog.ts WATERLOG.fordCap).
 */
export interface TrackFord { id: string; name: string; s: number; len: number; depth: number; dip: number; reach?: number }

/** Another drivable strip that counts as the track's road (the Speedway's pit lane). */
export interface TrackExtraRoad { points: readonly (readonly [number, number])[]; width: number }

export interface TrackDef {
  id: string;
  name: string;
  /** true: a circuit (the last control point joins the first). false: a point-to-point route. */
  closed: boolean;
  /** Road width (m). */
  width: number;
  /** Flat run-off each side of the road before the ground starts to blend back (m). */
  shoulder: number;
  /** Where the shaped ground blends back to the land, beyond the shoulder (m). */
  fade: number;
  /** Barriers (or the edge of the racing surface) stand this far from the centre line (m). */
  barrierOffset: number;
  /** The centre line in racing order. */
  control: readonly TrackControl[];
  jumps: readonly TrackJump[];
  whoops?: readonly TrackWhoops[];
  fords?: readonly TrackFord[];
  /** Gates per lap (closed) or along the route including start and finish lines (open, at least 2). */
  gates: number;
  /**
   * Closed: distance from control point 0 to the start/finish line (the samples are rotated so s = 0 is the line).
   * Open: s of the start line (the grid stands behind it, so keep it >= 40).
   */
  startOffset: number;
  /** Open only: the finish line stands this far before the last control point (m). Default 25. */
  finishPad?: number;
  /** What the road drives like (surfaces.ts): 'asphalt' for the Speedway, 'dirt' for the dirt tracks. */
  surface: SurfaceKind;
  /**
   * How the terrain is shaped (applyRelief):
   * - 'raise': the track sits on flattened ground and the road is raised by lift/bank/jumps (the Speedway, the Dirt Bowl).
   * - 'ribbon': the road is carved into natural ground: its height follows the land, smoothed over `smooth` m and limited
   *   to `maxGrade`, plus lift/bank/jumps/whoops/ford dips; cut and fill blend back over `fade` (the Capwood Run).
   */
  relief: 'raise' | 'ribbon';
  /** ribbon: the steepest the road may climb or fall (rise over run). Default 0.22. */
  maxGrade?: number;
  /** ribbon: the window (m) the land height is averaged over along the line. Default 30. */
  smooth?: number;
  /**
   * ribbon, open tracks only (E33): over this many metres at each end the road base eases back to the ground as it is,
   * so a route that starts on a highway meets it at the highway's own height instead of the smoothed average.
   */
  pinEnds?: number;
  /** Optional rectangle the whole track (with barriers) stays inside: a reserve marker or a site. Used by tests. */
  reserve?: { x: number; z: number; hw: number; hd: number };
  extraRoads?: readonly TrackExtraRoad[];
}

/** One centre-line sample, about every metre. (tx, tz) is the unit direction of travel, (nx, nz) the unit left normal (-tz, tx). */
export interface TrackSample {
  s: number;
  x: number; z: number;
  tx: number; tz: number;
  nx: number; nz: number;
  yaw: number;
  /** Road height at the centre relative to the track's base (lift plus jumps, whoops and ford dips), m. */
  lift: number;
  /** How much the outside edge stands above the inside edge, m (0 on straights). */
  bank: number;
  /** Signed curvature (1/m): > 0 turns towards +n (left). */
  curv: number;
}

export interface TrackSpot {
  /** Index of the nearest sample. */
  i: number;
  /** Its distance along the track. */
  s: number;
  /** Signed lateral offset from the centre line (+ = left of travel). */
  lat: number;
  /** Distance to the centre line (|lat| near the road). */
  dist: number;
}

export interface Gate {
  index: number;
  s: number;
  x: number; z: number;
  yaw: number;
  tx: number; tz: number;
  nx: number; nz: number;
  /** Half the gate's span across the track (to the barriers). */
  half: number;
}

/** Water standing in a ford at a point: the water surface (absolute y) and which ford. */
export interface FordHit { surface: number; ford: TrackFord }

export interface Track {
  readonly def: TrackDef;
  readonly id: string;
  readonly name: string;
  readonly closed: boolean;
  /** Every centre-line sample (closed: from the start line round to just before it; open: control 0 to the last point). */
  samples(): readonly TrackSample[];
  /** Lap length (closed) or route length (open), m. */
  length(): number;
  /** Where timing starts: 0 on a closed track, def.startOffset on an open one. */
  startS(): number;
  /** Where timing ends: length() on a closed track (the line again), length() - finishPad on an open one. */
  finishS(): number;
  /** Closed: wrap s into the lap (negative counts back from the line). Open: clamp into 0..length. */
  wrapS(s: number): number;
  /** The sample at distance s (wrapped or clamped, nearest sample). */
  sampleAt(s: number): TrackSample;
  /** A point `lat` metres left of the centre line (negative = right) at distance s, and the direction of travel there. */
  frame(s: number, lat?: number): { x: number; z: number; yaw: number };
  /** Road height relative to the base at lateral offset `lat` from sample p (bank tilts the road; the inside edge is at p.lift). */
  roadLiftAt(p: TrackSample, lat: number): number;
  /**
   * Absolute road height at sample p and offset lat, once the terrain has been built (applyRelief ran). Before that,
   * the base is 0 (a flat world).
   */
  roadTopAt(p: TrackSample, lat: number): number;
  /** Nearest centre-line sample within `reach` m (null if none); `hint` (last frame's index) searches `window` samples either side first. */
  locate(x: number, z: number, reach?: number, hint?: number, window?: number): TrackSpot | null;
  /** True on the road (within width / 2 + 0.5) or an extra road (the pit lane). */
  onRoad(x: number, z: number): boolean;
  /** True on the road or its run-off (within the barriers). */
  onTrack(x: number, z: number): boolean;
  /** def.surface on the road, else null (surfaces.ts). */
  surfaceAt(x: number, z: number): SurfaceKind | null;
  /** The gates: closed, evenly spaced, gates()[0] = the start/finish line; open, gates()[0] = start line, last = finish line. */
  gates(): readonly Gate[];
  /** A fresh lap/route tracker for this track. */
  tracker(): TrackGateTracker;
  /** The start grid: slot 0 is pole. Two columns, staggered, behind the start line. */
  gridSlot(slot: number): { x: number; z: number; yaw: number };
  /** Shape the terrain grid under the track (terrain.ts, in registry order, after the flat sites are levelled). */
  applyRelief(g: Float32Array, N: number, H: number, S: number): void;
  /** World rectangle the track can touch (samples plus barrierOffset plus shoulder and fade). */
  bounds(): { minX: number; maxX: number; minZ: number; maxZ: number };
  /** Ford water at (x, z), or null. */
  fordAt(x: number, z: number): FordHit | null;
}

const SAMPLE_STEP = 1;

function catmull(p0: readonly number[], p1: readonly number[], p2: readonly number[], p3: readonly number[], t: number): [number, number] {
  // Centripetal Catmull-Rom (no loops or cusps on uneven spacing).
  const d = (p: readonly number[], q: readonly number[]): number => Math.sqrt(Math.hypot(q[0] - p[0], q[1] - p[1])) || 1e-4;
  const t0 = 0, t1 = t0 + d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3);
  const tt = t1 + (t2 - t1) * t;
  const L = (A: readonly number[], B: readonly number[], ta: number, tb: number): [number, number] => [
    ((tb - tt) / (tb - ta)) * A[0] + ((tt - ta) / (tb - ta)) * B[0],
    ((tb - tt) / (tb - ta)) * A[1] + ((tt - ta) / (tb - ta)) * B[1],
  ];
  const A1 = L(p0, p1, t0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
  const B1 = L(A1, A2, t0, t2), B2 = L(A2, A3, t1, t3);
  return L(B1, B2, t1, t2);
}

const smooth = (t: number): number => t * t * (3 - 2 * t);

/** True when moving from (ax, az) to (bx, bz) crosses gate `g` in the racing direction. */
export function crossedGate(g: Gate, ax: number, az: number, bx: number, bz: number): boolean {
  const da = (ax - g.x) * g.tx + (az - g.z) * g.tz;
  const db = (bx - g.x) * g.tx + (bz - g.z) * g.tz;
  if (!(da < 0 && db >= 0)) return false;
  const f = da / (da - db);
  const cx = ax + (bx - ax) * f, cz = az + (bz - az) * f;
  return Math.abs((cx - g.x) * g.nx + (cz - g.z) * g.nz) <= g.half;
}

/**
 * Lap counting through a track's gates, in order. Pure: feed it positions; it reports when a lap is started, a gate is
 * passed and a lap is finished. Driving the wrong way or skipping a gate never counts. On an open track the 'lap' event
 * is crossing the finish line; after it the tracker waits for the start line again.
 */
export class TrackGateTracker {
  /** The gate to pass next (0 = the line). -1 until the line is first crossed. */
  next = -1;
  /** Laps finished since the line was first crossed (open tracks: runs finished). */
  laps = 0;
  /** Seconds since the current lap began (0 before the first crossing). */
  lapTime = 0;
  /** Gates passed in the current lap. */
  passed = 0;
  private lastX = NaN;
  private lastZ = NaN;
  private lapDone = false;

  constructor(readonly track: Track) {}

  /** Back to the start: no lap running. */
  reset(): void {
    this.next = -1; this.laps = 0; this.lapTime = 0; this.passed = 0; this.lastX = NaN; this.lastZ = NaN; this.lapDone = false;
  }

  /** Start a lap now, as if the line had just been crossed. */
  begin(): void {
    this.next = 1; this.lapTime = 0; this.passed = 0; this.lapDone = false;
  }

  /**
   * One frame at (x, z). Returns 'start' when the line is crossed to start timing, 'gate' when a checkpoint is
   * passed, 'lap' when a lap is completed (lapTime then holds the finished lap's time until the next update), else null.
   */
  update(dt: number, x: number, z: number): 'start' | 'gate' | 'lap' | null {
    const G = this.track.gates();
    const closed = this.track.closed;
    let ev: 'start' | 'gate' | 'lap' | null = null;
    // The frame after a lap the clock starts again from zero (lapTime held the finished lap until now).
    if (this.lapDone) { this.lapTime = 0; this.lapDone = false; }
    if (this.next >= 0) this.lapTime += dt;
    if (Number.isFinite(this.lastX)) {
      const target = this.next < 0 ? 0 : this.next;
      if (crossedGate(G[target], this.lastX, this.lastZ, x, z)) {
        if (this.next < 0) { this.next = 1; this.lapTime = 0; this.passed = 0; ev = 'start'; }
        else if (closed && target === 0) { this.laps++; this.passed = 0; this.next = 1; this.lapDone = true; ev = 'lap'; }
        else if (!closed && target === G.length - 1) { this.laps++; this.passed = 0; this.next = -1; this.lapDone = true; ev = 'lap'; }
        else { this.passed++; this.next = closed ? (target + 1) % G.length : target + 1; ev = 'gate'; }
      }
    }
    this.lastX = x; this.lastZ = z;
    return ev;
  }
}

interface Built { samples: TrackSample[]; length: number }

function buildSamples(def: TrackDef): Built {
  const C = def.control;
  const n = C.length;
  const SUB = 40;
  const closed = def.closed;
  const at = (i: number): TrackControl => (closed ? C[((i % n) + n) % n] : C[Math.max(0, Math.min(n - 1, i))]);
  // Dense points with lift and bank eased between control points.
  const dense: { x: number; z: number; lift: number; bank: number }[] = [];
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    for (let k = 0; k < SUB; k++) {
      const t = k / SUB;
      const [x, z] = catmull([p0.x, p0.z], [p1.x, p1.z], [p2.x, p2.z], [p3.x, p3.z], t);
      const e = smooth(t);
      dense.push({ x, z, lift: (p1.lift ?? 0) + ((p2.lift ?? 0) - (p1.lift ?? 0)) * e, bank: (p1.bank ?? 0) + ((p2.bank ?? 0) - (p1.bank ?? 0)) * e });
    }
  }
  if (!closed) {
    const last = C[n - 1];
    dense.push({ x: last.x, z: last.z, lift: last.lift ?? 0, bank: last.bank ?? 0 });
  }
  const m = dense.length;
  const cum = [0];
  const links = closed ? m : m - 1;
  for (let i = 1; i <= links; i++) {
    const a = dense[i - 1], b = dense[i % m];
    cum.push(cum[i - 1] + Math.hypot(b.x - a.x, b.z - a.z));
  }
  const total = cum[links];
  const count = closed ? Math.round(total / SAMPLE_STEP) : Math.round(total / SAMPLE_STEP) + 1;
  const step = closed ? total / count : total / (count - 1);
  const raw: { x: number; z: number; lift: number; bank: number }[] = [];
  let j = 0;
  for (let k = 0; k < count; k++) {
    const s = Math.min(total, k * step);
    while (j < links - 1 && cum[j + 1] < s) j++;
    const a = dense[j], b = dense[(j + 1) % m];
    const f = Math.max(0, Math.min(1, (s - cum[j]) / (cum[j + 1] - cum[j] || 1)));
    raw.push({ x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f, lift: a.lift + (b.lift - a.lift) * f, bank: a.bank + (b.bank - a.bank) * f });
  }
  // Closed: rotate so sample 0 is the start line.
  const shift = closed ? Math.round(def.startOffset / step) : 0;
  const pts = raw.map((_, k) => raw[(k + shift) % count]);
  const idx = (k: number): number => (closed ? (k + count) % count : Math.max(0, Math.min(count - 1, k)));
  const samples: TrackSample[] = pts.map((p, k) => {
    const a = pts[idx(k - 1)], b = pts[idx(k + 1)];
    const l = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    const tx = (b.x - a.x) / l, tz = (b.z - a.z) / l;
    return { s: k * step, x: p.x, z: p.z, tx, tz, nx: -tz, nz: tx, yaw: Math.atan2(tx, tz), lift: p.lift, bank: p.bank, curv: 0 };
  });
  // Curvature over +-6 m (smooth enough to tell which side a corner's outside is).
  const W = Math.max(1, Math.round(6 / step));
  for (let k = 0; k < count; k++) {
    const a = samples[idx(k - W)], b = samples[idx(k + W)];
    const cross = a.tx * b.tz - a.tz * b.tx;
    const dot = a.tx * b.tx + a.tz * b.tz;
    // Turning towards +n (left normal n = (-tz, tx)) makes the later tangent gain a +n component: dot(b.t, a.n) > 0.
    const towardsN = b.tx * a.nx + b.tz * a.nz;
    const ang = Math.atan2(Math.abs(cross), dot);
    samples[k].curv = (towardsN >= 0 ? 1 : -1) * ang / (2 * W * step);
  }
  const delta = (s: number, at0: number): number => {
    let d = s - at0;
    if (closed) {
      if (d > total / 2) d -= total;
      if (d < -total / 2) d += total;
    }
    return d;
  };
  const norm = (s: number): number => (closed ? ((s % total) + total) % total : s);
  // Jumps add to the lift.
  for (const jp of def.jumps) {
    const js = norm(jp.s);
    for (const sm of samples) {
      const d = delta(sm.s, js);
      if (d > -jp.up && d <= 0) sm.lift += jp.rise * Math.pow((d + jp.up) / jp.up, 1.6);
      else if (d > 0 && d < jp.down) sm.lift += jp.rise * (1 - d / jp.down);
    }
  }
  // Whoops: rounded bumps, eased in and out over the first and last bump.
  for (const w of def.whoops ?? []) {
    const from = norm(w.from), span = (closed ? norm(w.to - w.from) : w.to - w.from);
    for (const sm of samples) {
      const d = closed ? norm(sm.s - from) : sm.s - from;
      if (d < 0 || d > span) continue;
      sm.lift += w.amp * 0.5 * (1 - Math.cos((2 * Math.PI * d) / w.wave));
    }
  }
  // Fords dip the road.
  for (const f of def.fords ?? []) {
    const fs = norm(f.s);
    for (const sm of samples) {
      const d = Math.abs(delta(sm.s, fs));
      if (d >= f.len / 2) continue;
      sm.lift -= f.dip * smooth(1 - d / (f.len / 2));
    }
  }
  return { samples, length: total };
}

/** Turn a TrackDef into a Track. Samples are built on first use. */
export function createTrack(def: TrackDef): Track {
  let built: Built | null = null;
  /** Absolute ground height under each sample's road base (set by applyRelief; 0 until then). */
  let base: Float32Array | null = null;
  let grid: Map<number, number[]> | null = null;
  let gateList: Gate[] | null = null;
  let box: { minX: number; maxX: number; minZ: number; maxZ: number } | null = null;
  const CELL = 16;
  const key = (i: number, j: number): number => (i + 4096) * 8192 + (j + 4096);
  const half = def.width / 2;
  const finishPad = def.finishPad ?? 25;

  const get = (): Built => (built ??= buildSamples(def));
  const samples = (): readonly TrackSample[] => get().samples;
  const length = (): number => get().length;
  const wrapS = (s: number): number => {
    const L = length();
    return def.closed ? ((s % L) + L) % L : Math.max(0, Math.min(L, s));
  };
  const sampleAt = (s: number): TrackSample => {
    const S = samples();
    const L = length();
    if (def.closed) return S[Math.round(wrapS(s) / (L / S.length)) % S.length];
    return S[Math.max(0, Math.min(S.length - 1, Math.round((wrapS(s) / L) * (S.length - 1))))];
  };
  const roadLiftAt = (p: TrackSample, lat: number): number => {
    if (p.bank <= 0) return p.lift;
    // Outside of the corner: -n when turning left (curv > 0), +n when turning right.
    const outward = p.curv > 0 ? -lat : lat;
    const t = Math.max(0, Math.min(1, 0.5 + outward / (2 * half)));
    return p.lift + p.bank * t;
  };
  const indexOf = (p: TrackSample): number => {
    const S = samples();
    const k = def.closed ? Math.round(p.s / (length() / S.length)) % S.length : Math.round((p.s / length()) * (S.length - 1));
    return Math.max(0, Math.min(S.length - 1, k));
  };
  const roadTopAt = (p: TrackSample, lat: number): number => (base ? base[indexOf(p)] : 0) + roadLiftAt(p, lat);

  const sampleGrid = (): Map<number, number[]> => {
    if (grid) return grid;
    const gmap = new Map<number, number[]>();
    samples().forEach((p, k) => {
      const g = key(Math.floor(p.x / CELL), Math.floor(p.z / CELL));
      const list = gmap.get(g);
      if (list) list.push(k); else gmap.set(g, [k]);
    });
    grid = gmap;
    return gmap;
  };

  const locate = (x: number, z: number, reach = 40, hint = -1, window = 60): TrackSpot | null => {
    const S = samples();
    let best = -1, bestD = Infinity;
    if (hint >= 0) {
      for (let d = -window; d <= window; d++) {
        let k = hint + d;
        if (def.closed) k = (k + S.length) % S.length;
        else if (k < 0 || k >= S.length) continue;
        const dd = (S[k].x - x) ** 2 + (S[k].z - z) ** 2;
        if (dd < bestD) { bestD = dd; best = k; }
      }
      if (bestD > reach * reach) best = -1;
    }
    if (best < 0) {
      bestD = Infinity;
      const g = sampleGrid();
      const r = Math.ceil(reach / CELL);
      const ci = Math.floor(x / CELL), cj = Math.floor(z / CELL);
      for (let i = ci - r; i <= ci + r; i++) for (let j = cj - r; j <= cj + r; j++) {
        for (const k of g.get(key(i, j)) ?? []) {
          const dd = (S[k].x - x) ** 2 + (S[k].z - z) ** 2;
          if (dd < bestD) { bestD = dd; best = k; }
        }
      }
      if (best < 0 || bestD > reach * reach) return null;
    }
    const p = S[best];
    const lat = (x - p.x) * p.nx + (z - p.z) * p.nz;
    return { i: best, s: p.s, lat, dist: Math.sqrt(bestD) };
  };

  const bounds = (): { minX: number; maxX: number; minZ: number; maxZ: number } => {
    if (box) return box;
    const m = Math.max(def.barrierOffset, half + def.shoulder + def.fade) + 2;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const p of samples()) {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
    }
    for (const r of def.extraRoads ?? []) for (const [x, z] of r.points) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    }
    box = { minX: minX - m, maxX: maxX + m, minZ: minZ - m, maxZ: maxZ + m };
    return box;
  };
  const inBounds = (x: number, z: number): boolean => {
    const b = bounds();
    return x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ;
  };

  const onRoad = (x: number, z: number): boolean => {
    if (!inBounds(x, z)) return false;
    const spot = locate(x, z, def.width);
    if (spot && Math.abs(spot.lat) <= half + 0.5) return true;
    for (const r of def.extraRoads ?? []) {
      const P = r.points;
      for (let k = 0; k + 1 < P.length; k++) {
        const [ax, az] = P[k];
        const [bx, bz] = P[k + 1];
        const vx = bx - ax, vz = bz - az;
        const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz)));
        if (Math.hypot(x - (ax + vx * t), z - (az + vz * t)) <= r.width / 2 + 0.5) return true;
      }
    }
    return false;
  };

  const onTrack = (x: number, z: number): boolean => {
    if (!inBounds(x, z)) return false;
    const spot = locate(x, z, def.barrierOffset + 2);
    return !!spot && Math.abs(spot.lat) <= def.barrierOffset;
  };

  const startS = (): number => (def.closed ? 0 : def.startOffset);
  const finishS = (): number => (def.closed ? length() : length() - finishPad);

  const gates = (): readonly Gate[] => {
    if (gateList) return gateList;
    const L = length();
    const n = def.gates;
    gateList = Array.from({ length: n }, (_, i) => {
      const s = def.closed ? (i * L) / n : startS() + ((finishS() - startS()) * i) / (n - 1);
      const p = sampleAt(s);
      return { index: i, s: p.s, x: p.x, z: p.z, yaw: p.yaw, tx: p.tx, tz: p.tz, nx: p.nx, nz: p.nz, half: def.barrierOffset };
    });
    return gateList;
  };

  const frame = (s: number, lat = 0): { x: number; z: number; yaw: number } => {
    const p = sampleAt(s);
    return { x: p.x + p.nx * lat, z: p.z + p.nz * lat, yaw: p.yaw };
  };

  const gridSlot = (slot: number): { x: number; z: number; yaw: number } => {
    const row = Math.floor(slot / 2);
    const lat = slot % 2 === 0 ? 3.2 : -3.2;
    // Closed: startS() - 8 wraps to length() - 8, as the Speedway always had it.
    return frame(startS() - 8 - row * 9 - (slot % 2) * 4.5, lat);
  };

  const applyRelief = (g: Float32Array, N: number, H: number, S: number): void => {
    const smp = samples();
    const inner = half + def.shoulder;
    const reach = inner + def.fade;
    const b = bounds();
    const i0 = Math.max(0, Math.floor((b.minX - reach + H) / S)), i1 = Math.min(N - 1, Math.ceil((b.maxX + reach + H) / S));
    const j0 = Math.max(0, Math.floor((b.minZ - reach + H) / S)), j1 = Math.min(N - 1, Math.ceil((b.maxZ + reach + H) / S));
    // The base under each sample: the ground there now (a flat pan for 'raise'), smoothed and grade-limited for 'ribbon'.
    const groundAt = (x: number, z: number): number => {
      const u = Math.max(0, Math.min(N - 1.001, (x + H) / S)), v = Math.max(0, Math.min(N - 1.001, (z + H) / S));
      const i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j;
      const a = g[j * N + i], bb = g[j * N + i + 1], c = g[(j + 1) * N + i], d = g[(j + 1) * N + i + 1];
      return (a * (1 - fu) + bb * fu) * (1 - fv) + (c * (1 - fu) + d * fu) * fv;
    };
    const nS = smp.length;
    const raw = new Float32Array(nS);
    for (let k = 0; k < nS; k++) raw[k] = groundAt(smp[k].x, smp[k].z);
    const bs = new Float32Array(nS);
    if (def.relief === 'ribbon') {
      const step = length() / (def.closed ? nS : nS - 1);
      const W = Math.max(1, Math.round((def.smooth ?? 30) / 2 / step));
      for (let k = 0; k < nS; k++) {
        let sum = 0, cnt = 0;
        for (let d = -W; d <= W; d++) {
          let q = k + d;
          if (def.closed) q = (q + nS) % nS;
          else if (q < 0 || q >= nS) continue;
          sum += raw[q]; cnt++;
        }
        bs[k] = sum / cnt;
      }
      // E33: ease the base back to the ground as it is at both ends of an open route (pinEnds metres).
      if (!def.closed && def.pinEnds && def.pinEnds > 0) {
        for (let k = 0; k < nS; k++) {
          const d = Math.min(k, nS - 1 - k) * step;
          if (d >= def.pinEnds) continue;
          const t = d / def.pinEnds;
          bs[k] = raw[k] + (bs[k] - raw[k]) * t * t * (3 - 2 * t);
        }
      }
      // Grade limit: forward then backward pass, so no step climbs or falls more than maxGrade * step.
      const lim = (def.maxGrade ?? 0.22) * step;
      for (let pass = 0; pass < 2; pass++) {
        for (let k = 1; k < nS; k++) bs[k] = Math.max(bs[k - 1] - lim, Math.min(bs[k - 1] + lim, bs[k]));
        for (let k = nS - 2; k >= 0; k--) bs[k] = Math.max(bs[k + 1] - lim, Math.min(bs[k + 1] + lim, bs[k]));
      }
    } else {
      bs.set(raw);
    }
    base = bs;
    const W = i1 - i0 + 1, D = j1 - j0 + 1;
    if (W <= 0 || D <= 0) return;
    const bestD = new Float32Array(W * D).fill(Infinity);
    const bestK = new Int32Array(W * D).fill(-1);
    const cells = Math.ceil(reach / S);
    smp.forEach((p, k) => {
      const ci = Math.round((p.x + H) / S), cj = Math.round((p.z + H) / S);
      for (let j = Math.max(j0, cj - cells); j <= Math.min(j1, cj + cells); j++) {
        const z = -H + j * S;
        for (let i = Math.max(i0, ci - cells); i <= Math.min(i1, ci + cells); i++) {
          const x = -H + i * S;
          const d = (x - p.x) ** 2 + (z - p.z) ** 2;
          const idx = (j - j0) * W + (i - i0);
          if (d < bestD[idx]) { bestD[idx] = d; bestK[idx] = k; }
        }
      }
    });
    for (let j = j0; j <= j1; j++) {
      const z = -H + j * S;
      for (let i = i0; i <= i1; i++) {
        const idx = (j - j0) * W + (i - i0);
        const k = bestK[idx];
        if (k < 0) continue;
        const d = Math.sqrt(bestD[idx]);
        if (d >= reach) continue;
        const p = smp[k];
        // Open tracks: no shaping beyond the two ends of the route.
        if (!def.closed && (k === 0 || k === nS - 1)) {
          const x0 = -H + i * S;
          const along = (x0 - p.x) * p.tx + (z - p.z) * p.tz;
          if ((k === 0 && along < -0.5) || (k === nS - 1 && along > 0.5)) continue;
        }
        const x = -H + i * S;
        const lat = (x - p.x) * p.nx + (z - p.z) * p.nz;
        const top = roadLiftAt(p, Math.max(-half, Math.min(half, lat)));
        const w = d <= inner ? 1 : 1 - smooth((d - inner) / def.fade);
        const gi = j * N + i;
        if (def.relief === 'raise') {
          if (top <= 0) continue;
          g[gi] += top * w;
        } else {
          const target = bs[k] + top;
          g[gi] = g[gi] + (target - g[gi]) * w;
        }
      }
    }
  };

  const fordAt = (x: number, z: number): FordHit | null => {
    const fords = def.fords;
    if (!fords || fords.length === 0 || !inBounds(x, z)) return null;
    const maxReach = Math.max(...fords.map((f) => f.reach ?? def.barrierOffset + 4));
    const spot = locate(x, z, maxReach);
    if (!spot) return null;
    for (const f of fords) {
      const r = f.reach ?? def.barrierOffset + 4;
      if (Math.abs(spot.lat) > r) continue;
      let d = spot.s - wrapS(f.s);
      if (def.closed && d > length() / 2) d -= length();
      if (def.closed && d < -length() / 2) d += length();
      if (Math.abs(d) >= f.len / 2) continue;
      const bottom = roadTopAt(sampleAt(f.s), 0);
      const surface = bottom + f.depth;
      // On the road the water only stands where the road is below it (the trough), not on the climb out.
      if (Math.abs(spot.lat) <= half && roadTopAt(samples()[spot.i], spot.lat) >= surface) return null;
      return { surface, ford: f };
    }
    return null;
  };

  const track: Track = {
    def, id: def.id, name: def.name, closed: def.closed,
    samples, length, startS, finishS, wrapS, sampleAt, frame, roadLiftAt, roadTopAt, locate, onRoad, onTrack,
    surfaceAt: (x, z) => (onRoad(x, z) ? def.surface : null),
    gates, tracker: () => new TrackGateTracker(track), gridSlot, applyRelief, bounds, fordAt,
  };
  return track;
}
