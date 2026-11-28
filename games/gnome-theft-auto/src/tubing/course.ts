// Tubing: the Loch Moss buoy run. A time trial for the boat: pass the gates in order (between each pair of buoys),
// riders on tow share the score. Pure: gates as data, crossing tests on segments.
import { COAST } from '../coast/config';

export interface BuoyGate {
  /** Centre of the gate, on open water. */
  x: number;
  z: number;
  /** Direction to pass through it (radians, 0 = +z). */
  yaw: number;
  /** Distance between its two buoys, m. */
  width: number;
}

/** The course, in order. Checked by course.test.ts: every buoy in water at least 1.5 m deep.
 *  Six gates on a hexagon of radius 44 m round (-700, -665), each pointing at the next (44 m apart). Radius 47 put
 *  gate 5's south-west buoy on the shore shelf (1.3 m deep). */
export const BUOY_GATES: readonly BuoyGate[] = [
  { x: -700, z: -709, yaw: 1.0471, width: 12 },
  { x: -661.9, z: -687, yaw: 0, width: 12 },
  { x: -661.9, z: -643, yaw: -1.0471, width: 12 },
  { x: -700, z: -621, yaw: -2.0945, width: 12 },
  { x: -738.1, z: -643, yaw: 3.1416, width: 12 },
  { x: -738.1, z: -687, yaw: 2.0945, width: 12 },
];
/** A tow course: an ordered list of gates, a run through them scores the tow. */
export interface TowCourse {
  id: string;
  name: string;
  gates: readonly BuoyGate[];
}

export const LOCH_COURSE: TowCourse = { id: 'loch-moss', name: 'Loch Moss buoy run', gates: BUOY_GATES };

/** The Saltwater slalom (COAST.slalom): gates along x heading east (+x), buoys alternating north and south of the line. */
export const OCEAN_GATES: readonly BuoyGate[] = (() => {
  const s = COAST.slalom;
  const out: BuoyGate[] = [];
  for (let i = 0; i < s.gates; i++) {
    const x = s.startX + (i * (s.endX - s.startX)) / (s.gates - 1);
    const z = s.z + (i % 2 === 0 ? -s.swing : s.swing);
    out.push({ x, z, yaw: Math.PI / 2, width: s.width });
  }
  return out;
})();

export const OCEAN_COURSE: TowCourse = { id: 'saltwater', name: 'Saltwater slalom', gates: OCEAN_GATES };

export const TOW_COURSES: readonly TowCourse[] = [LOCH_COURSE, OCEAN_COURSE];

/** The course whose first gate is nearest (x, z). */
export function courseNear(x: number, z: number): TowCourse {
  let best = TOW_COURSES[0];
  let bestD = Infinity;
  for (const c of TOW_COURSES) {
    const g = c.gates[0];
    const d = Math.hypot(g.x - x, g.z - z);
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

/** Where the run starts: the first gate. A run that has not passed a gate for this long is reset, s. */
export const RUN_TIMEOUT_S = 90;
/** Points per gate for everyone on the tow; a finished run adds FINISH_POINTS. */
export const GATE_POINTS = 150;
export const FINISH_POINTS = 1000;

/** The two buoy positions of a gate (width apart, across its yaw). */
export function buoysOf(g: BuoyGate): [{ x: number; z: number }, { x: number; z: number }] {
  const lx = Math.cos(g.yaw), lz = -Math.sin(g.yaw);
  const h = g.width / 2;
  return [
    { x: g.x + lx * h, z: g.z + lz * h },
    { x: g.x - lx * h, z: g.z - lz * h },
  ];
}

export interface RunState {
  /** Next gate index; BUOY_GATES.length when finished. */
  next: number;
  t: number;
  /** Seconds since the last gate. */
  sinceGate: number;
  finished: boolean;
  /** Finish time, s, or null. */
  time: number | null;
}

export function newRun(): RunState {
  return { next: 0, t: 0, sinceGate: 0, finished: false, time: null };
}

/** True when segment a->b properly crosses segment c->d (the ends touch no line). */
function crosses(ax: number, az: number, bx: number, bz: number, cx: number, cz: number, dx: number, dz: number): boolean {
  const side = (px: number, pz: number, qx: number, qz: number, rx: number, rz: number) =>
    (qx - px) * (rz - pz) - (qz - pz) * (rx - px);
  const d1 = side(ax, az, bx, bz, cx, cz);
  const d2 = side(ax, az, bx, bz, dx, dz);
  const d3 = side(cx, cz, dx, dz, ax, az);
  const d4 = side(cx, cz, dx, dz, bx, bz);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

/** The boat moved from (ax, az) to (bx, bz) this step. Returns 'gate' (passed the next gate), 'finish', 'reset'
 *  (timed out: back to gate 0) or null. Rules: roadmap issue 1.4. */
export function stepRun(
  r: RunState, ax: number, az: number, bx: number, bz: number, dt: number, gates: readonly BuoyGate[] = BUOY_GATES,
): 'gate' | 'finish' | 'reset' | null {
  if (r.finished) return null;
  r.sinceGate += dt;
  if (r.next > 0) r.t += dt;
  if (r.next > 0 && r.sinceGate > RUN_TIMEOUT_S) {
    Object.assign(r, newRun());
    return 'reset';
  }
  const g = gates[r.next];
  const [p, q] = buoysOf(g);
  const forward = (bx - ax) * Math.sin(g.yaw) + (bz - az) * Math.cos(g.yaw) > 0;
  if (!crosses(ax, az, bx, bz, p.x, p.z, q.x, q.z) || !forward) return null;
  if (r.next === 0) r.t = 0;
  r.next++;
  r.sinceGate = 0;
  if (r.next === gates.length) {
    r.finished = true;
    r.time = r.t;
    return 'finish';
  }
  return 'gate';
}
