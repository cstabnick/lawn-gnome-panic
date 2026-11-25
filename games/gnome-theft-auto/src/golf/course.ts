// Hedgeworth Links as a @lawn/golf course: the GTA ground (terrain.ts heightAt plus the greens' rise) and the holes'
// lies, in the package's golf frame (gnome yards, see golf/types.ts). Pure apart from reading the terrain.
import { featureLie, type CourseEnv, type HoleDef, type Lie, type Vec3 } from '@lawn/golf';
import { heightAt } from '../terrain';
import { GOLF_LIFT, HOLES, YD, greenRise, toGolf, toWorld, type HedgeworthHole } from './types';

const yd = (m: number): number => m / YD;
const pt = (p: { x: number; z: number }): { x: number; z: number } => toGolf(p.x, p.z);

/** A Hedgeworth hole in the golf frame (yards) for @lawn/golf. Green tilt is rise per unit, so it is unchanged. */
export function holeYards(h: HedgeworthHole): HoleDef {
  return {
    par: h.par,
    tee: pt(h.tee),
    path: h.path.map(pt),
    fairwayWidth: yd(h.fairwayWidth),
    fairwayStart: yd(h.fairwayStart),
    green: { ...pt(h.green), r: yd(h.green.r), slopeX: h.green.slopeX, slopeZ: h.green.slopeZ },
    pin: pt(h.pin),
    bunkers: h.bunkers.map((c) => ({ ...pt(c), r: yd(c.r) })),
    ponds: h.ponds.map((c) => ({ ...pt(c), r: yd(c.r) })),
  };
}

export const HOLES_YD: readonly HoleDef[] = HOLES.map(holeYards);

/** World ground height of the course surface at (x, z), metres: the terrain plus a green's rise. */
export function courseGroundY(x: number, z: number): number {
  return heightAt(x, z) + greenRise(x, z);
}

let floorY: number | null = null;
/** The yard floor (terrain height at the golf origin), metres: golf height 0 + GOLF_LIFT sits here. */
export function yardFloorY(): number {
  if (floorY === null) { const o = toWorld(0, 0); floorY = heightAt(o.x, o.z); }
  return floorY;
}

/** Golf-frame ground height (yards) at golf (gx, gz). */
export function golfHeight(gx: number, gz: number): number {
  const w = toWorld(gx, gz);
  return GOLF_LIFT + (courseGroundY(w.x, w.z) - yardFloorY()) / YD;
}

/** The lie at golf (gx, gz). Water is a pond (featureLie); never the package's sea. */
export function golfLie(gx: number, gz: number): Lie {
  return featureLie(HOLES_YD, gx, gz);
}

/** The lie at world (x, z). */
export function lieAtWorld(x: number, z: number): Lie {
  const g = toGolf(x, z);
  return golfLie(g.x, g.z);
}

const ENV: CourseEnv = {
  heightAt: golfHeight,
  gradientAt(x, z) {
    const e = 0.25;
    return { gx: (golfHeight(x + e, z) - golfHeight(x - e, z)) / (2 * e), gz: (golfHeight(x, z + e) - golfHeight(x, z - e)) / (2 * e) };
  },
  lieAt: golfLie,
};

/** The course for @lawn/golf simulateShot / previewShot. */
export function golfEnv(): CourseEnv {
  return ENV;
}

/** A ball resting on the ground at world (x, z), as a golf-frame start point. */
export function golfStart(x: number, z: number): Vec3 {
  const g = toGolf(x, z);
  return { x: g.x, y: golfHeight(g.x, g.z), z: g.z };
}

/** A golf-frame point (a flight sample) in the world, metres. */
export function golfToWorld(p: Vec3): { x: number; y: number; z: number } {
  const w = toWorld(p.x, p.z);
  return { x: w.x, y: yardFloorY() + (p.y - GOLF_LIFT) * YD, z: w.z };
}

/** Distance between two world points in gnome yards (what the HUD shows). */
export function yardsBetween(a: { x: number; z: number }, b: { x: number; z: number }): number {
  return Math.hypot(a.x - b.x, a.z - b.z) / YD;
}
