// The background show's vehicles that cross the track (runaway mowers, THE COMBINE, golf carts). Their motion is a
// pure function of race time, so the sim, every screen's view and the party slice agree without sending them.
// Touching one is punished with a long spin-out. Pure: no three.js, no DOM.
import { HAZARD, VEHICLES, type RaceState } from './config';
import type { HazardKind } from './courses';
import { pointAt, type Track } from './track';

export interface HazardPose {
  kind: HazardKind;
  x: number;
  z: number;
  /** Heading of travel (forward = (sin h, cos h)). */
  h: number;
  radius: number;
  /** -1..1 across the track (0 = on the centreline). */
  across: number;
}

/** Where every hazard of the track's course is at race time t. */
export function hazardsAt(track: Track, t: number): HazardPose[] {
  return track.course.hazards.map((hz) => {
    const p = pointAt(track, hz.crossF * track.length);
    // Left of the tangent is (tz, -tx).
    const lx = p.tz, lz = -p.tx;
    const period = (4 * hz.span) / hz.speed;
    const u = (((t + hz.phase) % period) + period) % period / period; // 0..1
    // Triangle wave: -span -> +span (first half), back to -span (second half).
    const outbound = u < 0.5;
    const off = outbound ? -hz.span + 4 * hz.span * u : 3 * hz.span - 4 * hz.span * u;
    const dirSign = outbound ? 1 : -1;
    return {
      kind: hz.kind,
      x: p.x + lx * off,
      z: p.z + lz * off,
      h: Math.atan2(lx * dirSign, lz * dirSign),
      radius: hz.radius,
      across: off / hz.span,
    };
  });
}

/** Spins out every kart touching a hazard at race.t and shoves it clear. Returns the indices of karts hit this step. */
export function hazardHits(race: RaceState, track: Track): number[] {
  const hit: number[] = [];
  if (track.course.hazards.length === 0) return hit;
  const poses = hazardsAt(track, race.t);
  race.karts.forEach((k, i) => {
    const kr = VEHICLES[k.vehicle].radius;
    for (const hz of poses) {
      const dx = k.x - hz.x, dz = k.z - hz.z;
      const d = Math.hypot(dx, dz);
      const r = kr + hz.radius;
      if (d >= r) continue;
      const nx = d > 1e-6 ? dx / d : 1, nz = d > 1e-6 ? dz / d : 0;
      k.x = hz.x + nx * r;
      k.z = hz.z + nz * r;
      if (k.spin <= 0) {
        k.spin = HAZARD.spinS;
        k.vx *= HAZARD.speedKept;
        k.vz *= HAZARD.speedKept;
        k.drift = 0;
        k.charge = 0;
        k.boost = 0;
        hit.push(i);
      }
    }
  });
  return hit;
}
