// Gnome Golf's island as something the editor can change. The document stores nine holes, each with its tee, a fairway path
// (tee, any dogleg corners, green), the green, the pin, bunkers and ponds. Here every kind of thing is a flat list with a hole
// number, so the Select tool can place and move each one; conversion back builds the holes (and rewrites the path from the tee,
// the corners and the green) in the file's own key order.
import type { LevelDoc } from '@lawn/level';
import type { ZoneDef } from '@gnomomia/config';
import type { HoleDef } from '@golf/config';
import { COURSE_DOC } from '@golf/levelDoc';
import { createCourse, type CourseSource, type IslandParams } from '@golf/course';

export interface GolfLevel {
  id: string;
  name: string;
  half: number;
  origin: { x: number; z: number };
  indoor: false;
  w: number;
  d: number;
  island: { -readonly [K in keyof IslandParams]: number };
  /** One per hole, positioned at its tee. */
  holes: { n: number; par: number; fairwayWidth: number; fairwayStart: number; x: number; z: number }[];
  greens: { n: number; x: number; z: number; r: number; slopeX: number; slopeZ: number }[];
  pins: { n: number; x: number; z: number }[];
  /** Dogleg corners of the fairway path, in path order within a hole. */
  corners: { n: number; x: number; z: number }[];
  bunkers: { n: number; x: number; z: number; r: number }[];
  ponds: { n: number; x: number; z: number; r: number }[];
}

type CourseDoc = LevelDoc<{ holes: HoleDef[] }>;

export function docToLevel(doc: CourseDoc = COURSE_DOC): GolfLevel {
  const d = structuredClone(doc);
  const p = d.base!.params as unknown as IslandParams;
  const level: GolfLevel = {
    id: d.id, name: d.name, half: Math.max(p.rx, p.rz), origin: { x: 0, z: 0 }, indoor: false, w: d.bounds.w, d: d.bounds.d,
    island: { rx: p.rx, rz: p.rz, beach: p.beach, inland: p.inland, roll: p.roll, seaFloor: p.seaFloor },
    holes: [], greens: [], pins: [], corners: [], bunkers: [], ponds: [],
  };
  d.data.holes.forEach((h, i) => {
    const n = i + 1;
    level.holes.push({ n, par: h.par, fairwayWidth: h.fairwayWidth, fairwayStart: h.fairwayStart, x: h.tee.x, z: h.tee.z });
    level.greens.push({ n, x: h.green.x, z: h.green.z, r: h.green.r, slopeX: h.green.slopeX, slopeZ: h.green.slopeZ });
    level.pins.push({ n, x: h.pin.x, z: h.pin.z });
    for (const c of h.path.slice(1, -1)) level.corners.push({ n, x: c.x, z: c.z });
    for (const b of h.bunkers) level.bunkers.push({ n, x: b.x, z: b.z, r: b.r });
    for (const o of h.ponds) level.ponds.push({ n, x: o.x, z: o.z, r: o.r });
  });
  return level;
}

/** The holes as the game's HoleDefs (path rebuilt from the tee, the corners and the green). */
export function levelToHoles(level: GolfLevel): HoleDef[] {
  return level.holes.map((h): HoleDef => {
    const g = level.greens.find((x) => x.n === h.n)!;
    const pin = level.pins.find((x) => x.n === h.n)!;
    return {
      par: h.par,
      tee: { x: h.x, z: h.z },
      path: [{ x: h.x, z: h.z }, ...level.corners.filter((c) => c.n === h.n).map((c) => ({ x: c.x, z: c.z })), { x: g.x, z: g.z }],
      fairwayWidth: h.fairwayWidth,
      fairwayStart: h.fairwayStart,
      green: { x: g.x, z: g.z, r: g.r, slopeX: g.slopeX, slopeZ: g.slopeZ },
      pin: { x: pin.x, z: pin.z },
      bunkers: level.bunkers.filter((b) => b.n === h.n).map((b) => ({ x: b.x, z: b.z, r: b.r })),
      ponds: level.ponds.filter((o) => o.n === h.n).map((o) => ({ x: o.x, z: o.z, r: o.r })),
    };
  });
}

export function levelToDoc(level: GolfLevel): CourseDoc {
  const holes = levelToHoles(level);
  const i = level.island;
  return {
    format: 'lawn-level',
    version: 1,
    game: 'gnome-golf',
    id: level.id,
    name: level.name,
    bounds: { w: 2 * i.rx, d: 2 * i.rz },
    base: { id: 'golf-island', version: 1, params: { rx: i.rx, rz: i.rz, beach: i.beach, inland: i.inland, roll: i.roll, seaFloor: i.seaFloor } },
    stamps: [],
    paths: [],
    props: [],
    markers: holes.flatMap((h, k) => [
      { id: `tee-${k + 1}`, kind: 'tee', x: h.tee.x, z: h.tee.z, data: { hole: k + 1 } },
      { id: `pin-${k + 1}`, kind: 'pin', x: h.pin.x, z: h.pin.z, data: { hole: k + 1 } },
      { id: `green-${k + 1}`, kind: 'green', x: h.green.x, z: h.green.z, r: h.green.r, data: { hole: k + 1 } },
    ]),
    data: { holes },
  };
}

export function sourceOf(level: GolfLevel): CourseSource {
  return { island: level.island, holes: levelToHoles(level) };
}

/** The ground and lie functions for the level as it is now. */
export function courseOf(level: GolfLevel): ReturnType<typeof createCourse> {
  return createCourse(sourceOf(level));
}

/** The hole whose fairway (tee, corners, green) is nearest to (x, z): where a new bunker or pond most likely belongs. */
export function nearestHole(level: GolfLevel, x: number, z: number): number {
  const holes = levelToHoles(level);
  let best = 1;
  let bestD = Infinity;
  holes.forEach((h, i) => {
    for (let k = 0; k + 1 < h.path.length; k++) {
      const a = h.path[k], b = h.path[k + 1];
      const dx = b.x - a.x, dz = b.z - a.z;
      const len2 = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / len2));
      const d = Math.hypot(x - (a.x + t * dx), z - (a.z + t * dz));
      if (d < bestD) { bestD = d; best = level.holes[i].n; }
    }
  });
  return best;
}

export const asZone = (level: GolfLevel): ZoneDef => level as unknown as ZoneDef;
