// The courses: layouts, item box rows and the background show's vehicles that cross the track (hazards).
// Pure data. Scenery for each course lives in scene/courses/<id>.ts.
import type { CourseId } from './config';

export type HazardKind = 'mower' | 'combine' | 'golfcart';

/** A background vehicle that drives back and forth straight across the track (perpendicular to it). */
export interface HazardDef {
  kind: HazardKind;
  /** Where it crosses, as a fraction of the lap (0..1). */
  crossF: number;
  /** It drives from -span to +span metres either side of the centreline and back. */
  span: number;
  /** m/s. */
  speed: number;
  /** Seconds into its back-and-forth cycle at race time 0. */
  phase: number;
  /** Collision radius, m. */
  radius: number;
}

export interface CourseDef {
  id: CourseId;
  name: string;
  /** One line for the menu. */
  blurb: string;
  /** Closed Catmull-Rom centreline, driven in this order (x, z before scale). */
  controlPoints: readonly (readonly [number, number])[];
  scale: number;
  /** Start line distance along the track, m. */
  startS: number;
  /** Karts are kept inside this box (metres, after scale). */
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  /** Item box rows, as fractions of the lap. */
  boxRows: readonly number[];
  hazards: readonly HazardDef[];
}

export const COURSES: Record<CourseId, CourseDef> = {
  garden: {
    id: 'garden', name: 'Garden Loop', blurb: 'The back garden. Flower beds, hay bales and a robot mower that never stops.',
    controlPoints: [
      [0, -30], [0, 10], [4, 24], [16, 30], [28, 24], [30, 12], [22, 2], [24, -8], [36, -14], [44, -26],
      [38, -38], [24, -40], [12, -36], [4, -44], [-10, -44], [-16, -34], [-10, -28], [-4, -34],
    ],
    scale: 1.56, startS: 6,
    bounds: { minX: -52, maxX: 94, minZ: -94, maxZ: 68 },
    boxRows: [0.2, 0.62],
    hazards: [{ kind: 'mower', crossF: 0.42, span: 20, speed: 5, phase: 0, radius: 1.1 }],
  },
  panic: {
    id: 'panic', name: 'Panic Yard', blurb: 'Round the yard while a gnome dodges mowers for golden acorns. Runaway mowers cross the road.',
    controlPoints: [
      [-30, -20], [-30, 10], [-24, 22], [-10, 26], [0, 18], [10, 26], [24, 22], [30, 10], [30, -10], [22, -22],
      [8, -26], [-2, -18], [-14, -26], [-26, -26],
    ],
    scale: 1.75, startS: 6,
    bounds: { minX: -75, maxX: 75, minZ: -68, maxZ: 68 },
    boxRows: [0.25, 0.65],
    hazards: [
      { kind: 'mower', crossF: 0.35, span: 22, speed: 7, phase: 0, radius: 1.1 },
      { kind: 'mower', crossF: 0.78, span: 22, speed: 6, phase: 3, radius: 1.1 },
    ],
  },
  front: {
    id: 'front', name: 'The Front', blurb: 'Straight through a Red Caps vs Blue Caps battle. Mind THE COMBINE.',
    controlPoints: [
      [-36, -10], [-36, 14], [-28, 22], [-16, 16], [-6, 24], [6, 16], [16, 24], [28, 20], [36, 8], [34, -8],
      [24, -16], [10, -14], [0, -22], [-14, -16], [-26, -22],
    ],
    scale: 1.75, startS: 6,
    bounds: { minX: -86, maxX: 86, minZ: -65, maxZ: 68 },
    boxRows: [0.3, 0.7],
    hazards: [
      { kind: 'combine', crossF: 0.5, span: 18, speed: 2.2, phase: 0, radius: 2.4 },
      { kind: 'mower', crossF: 0.85, span: 24, speed: 8, phase: 2, radius: 1.1 },
    ],
  },
  golf: {
    id: 'golf', name: 'Island Links', blurb: 'Down the fairways past gnomes putting out. Golf carts have right of way.',
    controlPoints: [
      [-34, -4], [-30, 16], [-16, 24], [-4, 16], [2, 4], [14, 0], [26, 8], [36, 2], [36, -14], [24, -24],
      [8, -20], [-6, -28], [-22, -26], [-32, -18],
    ],
    scale: 1.75, startS: 6,
    bounds: { minX: -81, maxX: 86, minZ: -73, maxZ: 65 },
    boxRows: [0.28, 0.68],
    hazards: [
      { kind: 'golfcart', crossF: 0.4, span: 20, speed: 6, phase: 0, radius: 1.2 },
      { kind: 'golfcart', crossF: 0.82, span: 20, speed: 5, phase: 4, radius: 1.2 },
    ],
  },
};

export const COURSE_ORDER: readonly CourseId[] = ['garden', 'panic', 'front', 'golf'];
