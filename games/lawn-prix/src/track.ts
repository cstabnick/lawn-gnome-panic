// The track as pure geometry: a closed centreline sampled from a course's control points, projection of any point
// onto it (distance along + signed lateral offset), and the starting grid. No three.js, no DOM: the sim, the view and
// the party slice all use it. getTrack(course) builds each course's Track once and caches it.
import { TRACK, type CourseId } from './config';
import { COURSES, type CourseDef } from './courses';

export interface TrackPoint {
  x: number;
  z: number;
  /** Distance along the centreline from point 0, m. */
  s: number;
  /** Unit tangent (direction of travel). */
  tx: number;
  tz: number;
}

export interface TrackHit {
  /** Distance along the track, 0..track.length. */
  s: number;
  /** Signed offset from the centreline, m: + is LEFT of the direction of travel. */
  lateral: number;
  /** Closest centreline point and its unit tangent. */
  x: number;
  z: number;
  tx: number;
  tz: number;
}

export interface Track {
  course: CourseDef;
  /** Centreline samples in driving order; segment i runs from points[i] to points[(i + 1) % n]. */
  points: readonly TrackPoint[];
  /** One lap, m. */
  length: number;
  /** Mown surface width, m. */
  width: number;
}

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

function buildTrack(course: CourseDef): Track {
  const cp = course.controlPoints.map(([x, z]) => [x * course.scale, z * course.scale] as const);
  const n = cp.length;
  const raw: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const p0 = cp[(i - 1 + n) % n], p1 = cp[i], p2 = cp[(i + 1) % n], p3 = cp[(i + 2) % n];
    for (let k = 0; k < TRACK.samplesPerSegment; k++) {
      const t = k / TRACK.samplesPerSegment;
      raw.push([catmullRom(p0[0], p1[0], p2[0], p3[0], t), catmullRom(p0[1], p1[1], p2[1], p3[1], t)]);
    }
  }
  const points: TrackPoint[] = [];
  let s = 0;
  for (let i = 0; i < raw.length; i++) {
    const [x, z] = raw[i];
    const [nx, nz] = raw[(i + 1) % raw.length];
    const len = Math.hypot(nx - x, nz - z);
    points.push({ x, z, s, tx: (nx - x) / len, tz: (nz - z) / len });
    s += len;
  }
  return { course, points, length: s, width: TRACK.width };
}

const cache = new Map<CourseId, Track>();

/** The course's track (built once, then cached). */
export function getTrack(id: CourseId): Track {
  let t = cache.get(id);
  if (!t) {
    t = buildTrack(COURSES[id]);
    cache.set(id, t);
  }
  return t;
}

/** Wraps any distance into 0..track.length. */
export function wrapS(track: Track, s: number): number {
  return ((s % track.length) + track.length) % track.length;
}

/** The centreline point and tangent at distance s (any value; wrapped). */
export function pointAt(track: Track, s: number): { x: number; z: number; tx: number; tz: number } {
  const pts = track.points;
  const w = wrapS(track, s);
  let lo = 0, hi = pts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (pts[mid].s <= w) lo = mid; else hi = mid - 1;
  }
  const a = pts[lo];
  const b = pts[(lo + 1) % pts.length];
  const segLen = (lo + 1 < pts.length ? b.s : track.length) - a.s;
  const f = segLen > 0 ? (w - a.s) / segLen : 0;
  return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f, tx: a.tx, tz: a.tz };
}

/** Closest point of the centreline to (x, z). Brute force over all segments (a few hundred; cheap). */
export function projectOnTrack(track: Track, x: number, z: number): TrackHit {
  const pts = track.points;
  let best = Infinity;
  let hit: TrackHit = { s: 0, lateral: 0, x: 0, z: 0, tx: 0, tz: 1 };
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const ex = b.x - a.x, ez = b.z - a.z;
    const len2 = ex * ex + ez * ez;
    let f = len2 > 0 ? ((x - a.x) * ex + (z - a.z) * ez) / len2 : 0;
    f = Math.max(0, Math.min(1, f));
    const px = a.x + ex * f, pz = a.z + ez * f;
    const d2 = (x - px) ** 2 + (z - pz) ** 2;
    if (d2 < best) {
      best = d2;
      const segLen = Math.sqrt(len2);
      // Left of tangent (tx, tz) is (tz, -tx).
      const lateral = (x - px) * a.tz - (z - pz) * a.tx;
      hit = { s: wrapS(track, a.s + segLen * f), lateral, x: px, z: pz, tx: a.tx, tz: a.tz };
    }
  }
  return hit;
}

/** True when the hit is on the mown track surface. */
export function isOnTrack(track: Track, hit: TrackHit): boolean {
  return Math.abs(hit.lateral) <= track.width / 2;
}

/** Heading (yaw) that faces along a tangent: forward is (sin h, cos h). */
export function headingOf(tx: number, tz: number): number {
  return Math.atan2(tx, tz);
}

/** Grid slot i (0 = pole): two columns, rows behind the start line. dist is the kart's starting progress (negative). */
export function gridSlot(track: Track, i: number): { x: number; z: number; h: number; s: number; dist: number } {
  const row = Math.floor(i / 2);
  const side = i % 2 === 0 ? 1 : -1; // pole on the left
  const back = TRACK.gridRowGap * (row + 1) - (i % 2) * TRACK.gridRowGap * 0.5;
  const s = wrapS(track, track.course.startS - back);
  const p = pointAt(track, s);
  const off = TRACK.gridColOffset * side;
  return { x: p.x + p.tz * off, z: p.z - p.tx * off, h: headingOf(p.tx, p.tz), s, dist: -back };
}
