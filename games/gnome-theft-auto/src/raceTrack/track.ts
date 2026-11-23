// The Lost & Found Speedway: the race circuit on the Dust Flats' alkali pan, north-east of the airfield.
// Pure data and geometry (no three.js, no DOM, no game imports): the centre line, its height profile (rises, banked
// corners, jumps), the checkpoint gates, the start grid, the pit lane and where things stand. terrain.ts reads
// applyTrackRelief() to raise the ground under the track; everything else (meshes, timing, races) reads the samples.
//
// Coordinates are world metres, x east, z south; yaw 0 faces +z and yaw = atan2(dx, dz), like the rest of the game.
// `s` is the distance along the centre line from the start/finish line, in the direction of racing, 0..TRACK_LENGTH.

/** A control point of the centre line. `lift` raises the road (m, above the flat pan); `bank` raises the outside edge of a corner (m). */
export interface TrackControl { x: number; z: number; lift?: number; bank?: number }

/** A kicker on the road at distance `s`: rises `rise` m over `up` m, then drops back over `down` m. */
export interface TrackJump { id: string; name: string; s: number; rise: number; up: number; down: number }

export const TRACK = {
  id: 'lost-and-found',
  name: 'Lost & Found Speedway',
  /** Road width (m). */
  width: 14,
  /** Flat run-off each side of the road before the ground starts to fall away (m). */
  shoulder: 4,
  /** Where raised ground blends back to the pan, beyond the shoulder (m). Kept under half the closest gap between two parts of the track. */
  fade: 9,
  /** Barriers stand this far from the centre line (m). */
  barrierOffset: 12.5,
  /**
   * The centre line, in racing order (clockwise on the map, north up). Closed: the last point joins the first.
   * Index 0 sits on the main straight, before the start line (the start line is at START_OFFSET along it).
   */
  control: [
    { x: 650, z: -362 }, { x: 760, z: -362 }, { x: 835, z: -366 },
    { x: 860, z: -395, bank: 1.2 }, { x: 862, z: -450, lift: 1.5 }, { x: 850, z: -520, lift: 3 },
    { x: 862, z: -562, lift: 3.5, bank: 1.5 }, { x: 838, z: -584, lift: 3.5, bank: 2.2 }, { x: 800, z: -572, lift: 3 },
    { x: 760, z: -560, lift: 2.5 }, { x: 715, z: -575, lift: 2 }, { x: 672, z: -562, lift: 1.5 },
    { x: 638, z: -578, lift: 1.2, bank: 1.5 }, { x: 617, z: -552, lift: 1, bank: 1.8 }, { x: 622, z: -500, lift: 0.5 },
    { x: 648, z: -468, bank: 1 }, { x: 700, z: -474 }, { x: 742, z: -515, lift: 1.5 },
    { x: 795, z: -512, lift: 2.5, bank: 1 }, { x: 821, z: -472, lift: 2.5, bank: 1.8 }, { x: 790, z: -436, lift: 1.5, bank: 1 },
    { x: 720, z: -426, lift: 0.5 }, { x: 662, z: -420 }, { x: 628, z: -405, bank: 1.6 }, { x: 625, z: -378, bank: 1.2 },
  ] as readonly TrackControl[],
  /** Jumps, by distance from the start line (negative: back from the line). track.test.ts checks each one is a real kicker. */
  jumps: [
    { id: 'rake-hop', name: 'Rake-Handle Hop', s: 405, rise: 1.4, up: 9, down: 4 },
    { id: 'frisbee-crest', name: 'Frisbee Crest', s: -224, rise: 1.0, up: 8, down: 5 },
  ] as readonly TrackJump[],
  /** The flat site the track sits on: a `reserve` marker in dust-flats.level.json with the same centre and half sizes. */
  reserve: { x: 741, z: -467, hw: 143, hd: 149 },
  /** Gates (checkpoints) per lap, evenly spaced; gate 0 is the start/finish line. */
  gates: 12,
} as const;

/** Distance along the centre line from control point 0 to the start/finish line (m). */
export const START_OFFSET = 85;

// ---- Sampling ------------------------------------------------------------------------------------------------------
/** One centre-line sample, every SAMPLE_STEP metres. (tx, tz) is the unit direction of travel, (nx, nz) the unit left normal (-tz, tx). */
export interface TrackSample {
  s: number;
  x: number; z: number;
  tx: number; tz: number;
  nx: number; nz: number;
  yaw: number;
  /** Road height above the pan at the centre (lift plus any jump), m. */
  lift: number;
  /** How much the outside edge stands above the inside edge, m (0 on straights). */
  bank: number;
  /** Signed curvature (1/m): > 0 turns towards +n (left). */
  curv: number;
}

export const SAMPLE_STEP = 1;

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

let cache: { samples: TrackSample[]; length: number } | null = null;

function build(): { samples: TrackSample[]; length: number } {
  const C = TRACK.control;
  const n = C.length;
  const SUB = 40;
  // Dense points with lift and bank eased between control points.
  const dense: { x: number; z: number; lift: number; bank: number }[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = C[(i - 1 + n) % n], p1 = C[i], p2 = C[(i + 1) % n], p3 = C[(i + 2) % n];
    for (let k = 0; k < SUB; k++) {
      const t = k / SUB;
      const [x, z] = catmull([p0.x, p0.z], [p1.x, p1.z], [p2.x, p2.z], [p3.x, p3.z], t);
      const e = smooth(t);
      dense.push({ x, z, lift: (p1.lift ?? 0) + ((p2.lift ?? 0) - (p1.lift ?? 0)) * e, bank: (p1.bank ?? 0) + ((p2.bank ?? 0) - (p1.bank ?? 0)) * e });
    }
  }
  const cum = [0];
  for (let i = 1; i <= dense.length; i++) {
    const a = dense[i - 1], b = dense[i % dense.length];
    cum.push(cum[i - 1] + Math.hypot(b.x - a.x, b.z - a.z));
  }
  const total = cum[dense.length];
  const count = Math.round(total / SAMPLE_STEP);
  const step = total / count;
  // Raw samples from control point 0, then rotated so sample 0 is the start line.
  const raw: { x: number; z: number; lift: number; bank: number }[] = [];
  let j = 0;
  for (let k = 0; k < count; k++) {
    const s = k * step;
    while (cum[j + 1] < s) j++;
    const a = dense[j], b = dense[(j + 1) % dense.length];
    const f = (s - cum[j]) / (cum[j + 1] - cum[j] || 1);
    raw.push({ x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f, lift: a.lift + (b.lift - a.lift) * f, bank: a.bank + (b.bank - a.bank) * f });
  }
  const shift = Math.round(START_OFFSET / step);
  const pts = raw.map((_, k) => raw[(k + shift) % count]);
  const samples: TrackSample[] = pts.map((p, k) => {
    const a = pts[(k - 1 + count) % count], b = pts[(k + 1) % count];
    const l = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    const tx = (b.x - a.x) / l, tz = (b.z - a.z) / l;
    return { s: k * step, x: p.x, z: p.z, tx, tz, nx: -tz, nz: tx, yaw: Math.atan2(tx, tz), lift: p.lift, bank: p.bank, curv: 0 };
  });
  // Curvature over +-6 m (smooth enough to tell which side a corner's outside is).
  const W = Math.max(1, Math.round(6 / step));
  for (let k = 0; k < count; k++) {
    const a = samples[(k - W + count) % count], b = samples[(k + W) % count];
    const cross = a.tx * b.tz - a.tz * b.tx; // |sin| of the heading change (its sign is taken from towardsN below)
    const dot = a.tx * b.tx + a.tz * b.tz;
    // Turning towards +n (left normal n = (-tz, tx)) makes the later tangent gain a +n component: dot(b.t, a.n) > 0.
    const towardsN = b.tx * a.nx + b.tz * a.nz;
    const ang = Math.atan2(Math.abs(cross), dot);
    samples[k].curv = (towardsN >= 0 ? 1 : -1) * ang / (2 * W * step);
  }
  // Jumps add to the lift.
  for (const jp of TRACK.jumps) {
    for (const sm of samples) {
      let d = sm.s - jp.s;
      if (d > total / 2) d -= total;
      if (d < -total / 2) d += total;
      if (d > -jp.up && d <= 0) sm.lift += jp.rise * Math.pow((d + jp.up) / jp.up, 1.6);
      else if (d > 0 && d < jp.down) sm.lift += jp.rise * (1 - d / jp.down);
    }
  }
  return { samples, length: total };
}

/** Every centre-line sample, from the start line round to just before it again. Built once. */
export function trackSamples(): readonly TrackSample[] {
  cache ??= build();
  return cache.samples;
}

/** Lap length (m). */
export function trackLength(): number {
  cache ??= build();
  return cache.length;
}

/** The sample at distance `s` (wrapped into the lap, nearest sample). */
export function sampleAt(s: number): TrackSample {
  const S = trackSamples();
  const L = trackLength();
  const w = ((s % L) + L) % L;
  return S[Math.round(w / (L / S.length)) % S.length];
}

/** A point `lat` metres left of the centre line (negative = right) at distance `s`, and the direction of travel there. */
export function trackFrame(s: number, lat = 0): { x: number; z: number; yaw: number } {
  const p = sampleAt(s);
  return { x: p.x + p.nx * lat, z: p.z + p.nz * lat, yaw: p.yaw };
}

/** Height of the road surface above the pan at lateral offset `lat` from sample `p` (the bank tilts the road; the inside edge is at p.lift). */
export function roadLiftAt(p: TrackSample, lat: number): number {
  const half = TRACK.width / 2;
  if (p.bank <= 0) return p.lift;
  // Outside of the corner: -n when turning left (curv > 0), +n when turning right.
  const outward = p.curv > 0 ? -lat : lat;
  const t = Math.max(0, Math.min(1, 0.5 + outward / (2 * half)));
  return p.lift + p.bank * t;
}

// ---- Finding where a point is on the track -----------------------------------------------------------------------
const CELL = 16;
let grid: Map<number, number[]> | null = null;
const key = (i: number, j: number): number => (i + 4096) * 8192 + (j + 4096);

function sampleGrid(): Map<number, number[]> {
  if (grid) return grid;
  grid = new Map();
  trackSamples().forEach((p, k) => {
    const g = key(Math.floor(p.x / CELL), Math.floor(p.z / CELL));
    const list = grid!.get(g);
    if (list) list.push(k); else grid!.set(g, [k]);
  });
  return grid;
}

export interface TrackSpot {
  /** Index of the nearest sample. */
  i: number;
  /** Its distance along the lap. */
  s: number;
  /** Signed lateral offset from the centre line (+ = left of travel). */
  lat: number;
  /** Distance to the centre line (|lat| near the road). */
  dist: number;
}

/**
 * The nearest centre-line sample to (x, z), within `reach` metres (null if none). With `hint` (the index found last
 * frame), searches only `window` samples either side of it first, so a car on one part of the track never snaps to a
 * neighbouring part.
 */
export function locate(x: number, z: number, reach = 40, hint = -1, window = 60): TrackSpot | null {
  const S = trackSamples();
  let best = -1, bestD = Infinity;
  if (hint >= 0) {
    for (let d = -window; d <= window; d++) {
      const k = (hint + d + S.length) % S.length;
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
}

/** True when (x, z) is on the paved road or the pit lane (asphalt for surfaces.ts). */
export function onTrackRoad(x: number, z: number): boolean {
  const r = TRACK.reserve;
  if (Math.abs(x - r.x) > r.hw || Math.abs(z - r.z) > r.hd) return false;
  const spot = locate(x, z, TRACK.width);
  if (spot && Math.abs(spot.lat) <= TRACK.width / 2 + 0.5) return true;
  for (let k = 0; k + 1 < PIT_LANE.length; k++) {
    const [ax, az] = PIT_LANE[k];
    const [bx, bz] = PIT_LANE[k + 1];
    const vx = bx - ax, vz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz)));
    if (Math.hypot(x - (ax + vx * t), z - (az + vz * t)) <= PIT_LANE_WIDTH / 2 + 0.5) return true;
  }
  return false;
}

/** True when (x, z) is on the road or its run-off (within the barriers). */
export function onTrack(x: number, z: number): boolean {
  const spot = locate(x, z, TRACK.barrierOffset + 2);
  return !!spot && Math.abs(spot.lat) <= TRACK.barrierOffset;
}

// ---- Gates (checkpoints) -------------------------------------------------------------------------------------------
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

/** The checkpoint gates: TRACK.gates of them, evenly spaced; gates()[0] is the start/finish line. */
export function gates(): readonly Gate[] {
  const L = trackLength();
  return Array.from({ length: TRACK.gates }, (_, i) => {
    const p = sampleAt((i * L) / TRACK.gates);
    return { index: i, s: p.s, x: p.x, z: p.z, yaw: p.yaw, tx: p.tx, tz: p.tz, nx: p.nx, nz: p.nz, half: TRACK.barrierOffset };
  });
}

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
 * Lap counting through the gates, in order. Pure: feed it positions; it reports when a lap is started, a gate is
 * passed and a lap is finished. Driving the wrong way or skipping a gate never counts. Shared by the free-roam lap
 * timer and the races.
 */
export class GateTracker {
  /** The gate to pass next (0 = the line). -1 until the line is first crossed. */
  next = -1;
  /** Laps finished since the line was first crossed. */
  laps = 0;
  /** Seconds since the current lap began (0 before the first crossing). */
  lapTime = 0;
  /** Gates passed in the current lap. */
  passed = 0;
  private lastX = NaN;
  private lastZ = NaN;
  private lapDone = false;

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
    const G = gates();
    let ev: 'start' | 'gate' | 'lap' | null = null;
    // The frame after a lap the clock starts again from zero (lapTime held the finished lap until now).
    if (this.lapDone) { this.lapTime = 0; this.lapDone = false; }
    if (this.next >= 0) this.lapTime += dt;
    if (Number.isFinite(this.lastX)) {
      const target = this.next < 0 ? 0 : this.next;
      if (crossedGate(G[target], this.lastX, this.lastZ, x, z)) {
        if (this.next < 0) { this.next = 1; this.lapTime = 0; this.passed = 0; ev = 'start'; }
        else if (target === 0) { this.laps++; this.passed = 0; this.next = 1; this.lapDone = true; ev = 'lap'; }
        else { this.passed++; this.next = (target + 1) % G.length; ev = 'gate'; }
      }
    }
    this.lastX = x; this.lastZ = z;
    return ev;
  }
}

// ---- Terrain relief -------------------------------------------------------------------------------------------------
/**
 * Raise the terrain grid under the track (terrain.ts calls this after the reserve marker has flattened the pan).
 * `g` is the height grid (N x N, vertex (i, j) at x = -H + i * S, z = -H + j * S). Each grid vertex near the track takes
 * the lift of its nearest centre-line sample: the road surface within half the width plus the shoulder, easing back
 * to the pan over TRACK.fade.
 */
export function applyTrackRelief(g: Float32Array, N: number, H: number, S: number): void {
  const samples = trackSamples();
  const inner = TRACK.width / 2 + TRACK.shoulder;
  const reach = inner + TRACK.fade;
  const r = TRACK.reserve;
  const i0 = Math.max(0, Math.floor((r.x - r.hw - reach + H) / S)), i1 = Math.min(N - 1, Math.ceil((r.x + r.hw + reach + H) / S));
  const j0 = Math.max(0, Math.floor((r.z - r.hd - reach + H) / S)), j1 = Math.min(N - 1, Math.ceil((r.z + r.hd + reach + H) / S));
  const W = i1 - i0 + 1, D = j1 - j0 + 1;
  const bestD = new Float32Array(W * D).fill(Infinity);
  const bestK = new Int32Array(W * D).fill(-1);
  const cells = Math.ceil(reach / S);
  samples.forEach((p, k) => {
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
      const p = samples[k];
      const x = -H + i * S;
      const lat = (x - p.x) * p.nx + (z - p.z) * p.nz;
      const half = TRACK.width / 2;
      const top = roadLiftAt(p, Math.max(-half, Math.min(half, lat)));
      if (top <= 0) continue;
      const w = d <= inner ? 1 : 1 - smooth((d - inner) / TRACK.fade);
      g[j * N + i] += top * w;
    }
  }
}

// ---- Places around the track ------------------------------------------------------------------------------------------
/**
 * A flat rectangle spectators stand on (a grandstand tier, a cooler lid...), world coordinates: centre (x, z), the
 * surface height y (absolute), the yaw the crowd faces (towards the track), w across that facing and d front to back.
 */
export interface Deck { x: number; z: number; y: number; yaw: number; w: number; d: number }

/** The start grid: slot 0 is pole. Two columns, 8 m apart in rows, staggered. */
export function gridSlot(slot: number): { x: number; z: number; yaw: number } {
  const row = Math.floor(slot / 2);
  const lat = slot % 2 === 0 ? 3.2 : -3.2;
  return trackFrame(trackLength() - 8 - row * 9 - (slot % 2) * 4.5, lat);
}

/** The pit lane: a lane inside the main straight, entered after the last corner and left before turn 1. */
export const PIT_LANE: readonly [number, number][] = [[688, -368], [710, -384], [805, -384], [826, -369]];
export const PIT_LANE_WIDTH = 8;

/**
 * Pay 'n' Glaze (Speedway branch): the same drive-through building as Turfton's (prefab gta-pay-n-glaze, open along z),
 * entered from the pit lane. The bay is the building's centre, like Turfton's.
 */
export const SPEEDWAY_GLAZE = { x: 800, z: -399, footprint: 16, yaw: 0, bay: { x: 800, z: -399, radius: 7 } } as const;

/** Where the race director stands (the 'speedway' quest giver; giver/speedway marker in dust-flats.level.json). */
export const RACE_DESK = { x: 742, z: -393 } as const;

/** The podium behind the race desk, facing the pit lane (+z): steps 1.5 (centre), 1.0 (x - 2) and 0.7 (x + 2) high, 2 m square. */
export const PODIUM = { x: 742, z: -400 } as const;

/** A distance along the lap; a negative one counts back from the line (so places late in the lap survive a longer lap). */
export const wrapS = (s: number): number => ((s % trackLength()) + trackLength()) % trackLength();

/**
 * Gaps in the barriers, as distance ranges along the lap (0..length, written back from the line where negative).
 * `side`: 'left' is +n (the outside of the main straight, south), 'right' is -n. The right-hand barrier along the main
 * straight doubles as the pit wall.
 */
export interface BarrierGap { from: number; to: number; side: 'left' | 'right'; why: string }
export const BARRIER_GAPS: readonly BarrierGap[] = ([
  { from: -58, to: -32, side: 'right', why: 'pit lane entry' },
  { from: 78, to: 98, side: 'right', why: 'pit lane exit' },
  { from: 40, to: 58, side: 'left', why: 'the access road from the east-outer highway' },
] as BarrierGap[]).map((g) => ({ ...g, from: wrapS(g.from), to: wrapS(g.to) }));
