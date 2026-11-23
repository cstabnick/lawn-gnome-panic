// Pure route builders for NPC aircraft (docs/roadmaps/gta-npc-planes.md). No three.js, no DOM. Every builder returns a
// new array of new objects, so a caller may keep or edit its route without touching the others.
import type { Pt, SkyWaypoint } from './types';

/** A taxi / flight circuit round a runway. Waypoints run: apron, taxi, line-up, rotate, climb-out, crosswind,
 *  downwind, base, final, touchdown, rollout, back to the apron. */
export function airfieldCircuit(af: { x: number; z: number; yaw: number; length: number }, apron: Pt & { yaw: number }): SkyWaypoint[] {
  const fx = Math.sin(af.yaw);
  const fz = Math.cos(af.yaw);
  const sx = Math.cos(af.yaw);
  const sz = -Math.sin(af.yaw);
  const L = af.length;
  const C = { x: af.x, z: af.z };
  // Along the runway from the centre: f, and to the right of it: s.
  const at = (base: Pt, f: number, s: number): Pt => ({ x: base.x + fx * f + sx * s, z: base.z + fz * f + sz * s });
  const thr = at(C, -(L / 2 - 10), 0);
  const E = at(C, L / 2, 0);
  const wp = (p: Pt, agl: number, speed: number, extra: Partial<SkyWaypoint> = {}): SkyWaypoint => ({ x: p.x, z: p.z, agl, speed, ...extra });
  return [
    wp({ x: apron.x, z: apron.z }, 0, 4, { ground: true, hold: 30 }),
    wp(thr, 0, 6, { ground: true }),
    wp(at(thr, 8, 0), 0, 3, { ground: true }),
    wp(at(C, L * 0.2, 0), 0, 24, { ground: true }),
    wp(at(E, 150, 0), 35, 32),
    wp(at(E, 200, 220), 60, 34),
    wp(at(thr, -200, 220), 60, 34),
    wp(at(thr, -260, 60), 40, 30),
    wp(at(thr, -140, 0), 22, 26),
    wp(at(thr, 20, 0), 0, 20, { ground: true }),
    wp(at(C, L * 0.25, 0), 0, 6, { ground: true }),
    wp({ x: apron.x + fx * 15, z: apron.z + fz * 15 }, 0, 5, { ground: true }),
  ];
}

/** n points on an ellipse round c, from angle 0 in steps of 2*PI/n. */
export function ellipseRoute(c: Pt, rx: number, rz: number, agl: number, speed: number, n: number): SkyWaypoint[] {
  const out: SkyWaypoint[] = [];
  for (let k = 0; k < n; k++) {
    const a = (2 * Math.PI * k) / n;
    out.push({ x: c.x + rx * Math.sin(a), z: c.z + rz * Math.cos(a), agl, speed });
  }
  return out;
}

/** One waypoint per point, all at the same height and speed. */
export function polyRoute(pts: readonly Pt[], agl: number, speed: number): SkyWaypoint[] {
  return pts.map((p) => ({ x: p.x, z: p.z, agl, speed }));
}

/** Crop-duster passes over a field centred (x, z), w along x and d along z. Passes are spaced evenly in z and
 *  alternate direction. Each pass: an entry 60 m out, the far edge (spraying), a turn 80 m beyond. */
export function cropPasses(field: { x: number; z: number; w: number; d: number }, passes: number, agl: number, speed: number): SkyWaypoint[] {
  const out: SkyWaypoint[] = [];
  const x0 = field.x - field.w / 2;
  const x1 = field.x + field.w / 2;
  const z0 = field.z - field.d / 2;
  const step = passes > 1 ? field.d / (passes - 1) : 0;
  for (let k = 0; k < passes; k++) {
    const z = passes > 1 ? z0 + k * step : field.z;
    const westToEast = k % 2 === 0;
    const entryX = westToEast ? x0 - 60 : x1 + 60;
    const farX = westToEast ? x1 : x0;
    const turnX = westToEast ? x1 + 80 : x0 - 80;
    out.push({ x: entryX, z, agl: agl + 25, speed });
    out.push({ x: farX, z, agl, speed, spray: true });
    out.push({ x: turnX, z, agl: agl + 25, speed });
  }
  return out;
}

/** A circle round c flown at fixed height. */
export function orbitRoute(c: Pt, r: number, agl: number, speed: number, n: number): SkyWaypoint[] {
  return ellipseRoute(c, r, r, agl, speed, n);
}

/** Sky-writing: 12 smoke points on a circle; points 3 and 9 each fly a vertical loop of radius 28. */
export function skyWriterRoute(c: Pt, r: number, agl: number, speed: number): SkyWaypoint[] {
  const pts = ellipseRoute(c, r, r, agl, speed, 12);
  return pts.map((p, k) => {
    const wp: SkyWaypoint = { ...p, smoke: true };
    if (k === 3 || k === 9) wp.loop = 28;
    return wp;
  });
}

/** A parcel run: approach 20 m above the zone, drop over it, climb 30 m away to `to`. */
export function dropRoute(from: Pt, zone: Pt, to: Pt, agl: number, speed: number): SkyWaypoint[] {
  return [
    { x: from.x, z: from.z, agl: agl + 20, speed },
    { x: zone.x, z: zone.z, agl, speed, drop: true },
    { x: to.x, z: to.z, agl: agl + 30, speed },
  ];
}
