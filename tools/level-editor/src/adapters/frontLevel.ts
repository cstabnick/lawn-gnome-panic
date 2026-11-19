// Gnome Front's arena as something the editor can change: a live object with absolute positions, and the conversion back to
// the level document. The document stores each landmark as an offset from its flag, and its collision circles as offsets from
// the same flag; here a landmark has an absolute position and its circles are offsets from the landmark, so dragging a
// landmark (or a flag, which its landmarks follow) takes its circles with it. Conversion back rounds only what it computes.
import type { LevelDoc } from '@lawn/level';
import type { ZoneDef } from '@gnomomia/config';
import { ARENA_DOC, type ArenaData, type Landmark, type Mound } from '@front/levelDoc';
import { makeHeightAt } from '@front/terrain';
import type { Arena } from '@front/world';

export interface LiveLandmark {
  at: string;
  prefab: string;
  scale: number;
  rotY: number;
  /** Absolute position. */
  x: number;
  z: number;
  /** Collision circles, offsets from (x, z). */
  obstacles: { dx: number; dz: number; r: number; h: number }[];
}

export interface FrontLevel {
  id: string;
  name: string;
  half: number;
  origin: { x: number; z: number };
  indoor: false;
  w: number;
  d: number;
  bases: { id: string; team: number; x: number; z: number; yaw: number }[];
  flags: { id: string; name: string; x: number; z: number }[];
  vehicles: { id: string; vehicle: string; team: number; x: number; z: number; yaw: number }[];
  mounds: Mound[];
  landmarks: LiveLandmark[];
  flatten: ArenaData['flatten'];
  cover: ArenaData['cover'];
}

/** Rounds a value the conversion computed (offsets), so adding and subtracting leaves no float dust in the file. */
const clean = (v: number): number => Math.round(v * 1e6) / 1e6;

export function docToLevel(doc: LevelDoc<ArenaData> = ARENA_DOC): FrontLevel {
  const d = structuredClone(doc);
  const flag = (id: string): { x: number; z: number } => {
    const m = d.markers.find((k) => k.kind === 'flag' && k.id === id);
    if (!m) throw new Error(`arena has no flag ${id}`);
    return m;
  };
  return {
    id: d.id,
    name: d.name,
    half: d.bounds.w / 2,
    origin: { x: 0, z: 0 },
    indoor: false,
    w: d.bounds.w,
    d: d.bounds.d,
    bases: d.markers.filter((m) => m.kind === 'base').map((m) => ({ id: m.id, team: m.data?.team as number, x: m.x, z: m.z, yaw: m.data?.yaw as number })),
    flags: d.markers.filter((m) => m.kind === 'flag').map((m) => ({ id: m.id, name: m.data?.name as string, x: m.x, z: m.z })),
    vehicles: d.markers.filter((m) => m.kind === 'vehicle').map((m) => ({
      id: m.id, vehicle: m.data?.vehicle as string, team: m.data?.team as number, x: m.x, z: m.z, yaw: m.data?.yaw as number,
    })),
    mounds: d.data.mounds,
    landmarks: d.data.landmarks.map((L): LiveLandmark => {
      const f = flag(L.at);
      return {
        at: L.at, prefab: L.prefab, scale: L.scale, rotY: L.rotY,
        x: clean(f.x + L.dx), z: clean(f.z + L.dz),
        obstacles: L.obstacles.map((o) => ({ dx: clean(o.dx - L.dx), dz: clean(o.dz - L.dz), r: o.r, h: o.h })),
      };
    }),
    flatten: d.data.flatten,
    cover: d.data.cover,
  };
}

/** The landmarks as the document stores them (offsets from their flag). */
export function liveLandmarks(level: FrontLevel): Landmark[] {
  return level.landmarks.map((L): Landmark => {
    const f = level.flags.find((k) => k.id === L.at) ?? { x: 0, z: 0 };
    const dx = clean(L.x - f.x);
    const dz = clean(L.z - f.z);
    return {
      at: L.at as Landmark['at'], dx, dz, prefab: L.prefab, scale: L.scale, rotY: L.rotY,
      obstacles: L.obstacles.map((o) => ({ dx: clean(dx + o.dx), dz: clean(dz + o.dz), r: o.r, h: o.h })),
    };
  });
}

/** The editable level as the document the dev server saves. Key order is the file's own. */
export function levelToDoc(level: FrontLevel): LevelDoc<ArenaData> {
  return {
    format: 'lawn-level',
    version: 1,
    game: 'gnome-front',
    id: level.id,
    name: level.name,
    bounds: { w: level.w, d: level.d },
    stamps: [],
    paths: [],
    props: [],
    markers: [
      ...level.bases.map((b) => ({ id: b.id, kind: 'base', x: b.x, z: b.z, data: { team: b.team, yaw: b.yaw } })),
      ...level.flags.map((f) => ({ id: f.id, kind: 'flag', x: f.x, z: f.z, data: { name: f.name } })),
      ...level.vehicles.map((v, i) => ({ id: `slot-${i}`, kind: 'vehicle', x: v.x, z: v.z, data: { vehicle: v.vehicle, team: v.team, yaw: v.yaw } })),
    ],
    data: {
      mounds: level.mounds.map((m) => ({ x: m.x, z: m.z, r: m.r, h: m.h })),
      flatten: level.flatten,
      landmarks: liveLandmarks(level),
      cover: {
        seed: level.cover.seed,
        tries: level.cover.tries,
        edge: level.cover.edge,
        avoid: level.cover.avoid,
        layers: level.cover.layers.map((l) => ({
          prefab: l.prefab, count: l.count, scale: l.scale,
          ...(l.sink !== undefined ? { sink: l.sink } : {}),
          ...(l.spin ? { spin: true } : {}),
          obstacle: l.obstacle,
        })),
      },
    },
  };
}

/** The arena the game's own builders (landmarks, headquarters, cover) need, from the live level. */
export function arenaOf(level: FrontLevel): Arena {
  const heightAt = makeHeightAt({ half: level.half, mounds: level.mounds, flatten: level.flatten, bases: level.bases, flags: level.flags });
  return {
    half: level.half,
    bases: level.bases,
    flags: level.flags,
    slots: level.vehicles,
    data: { landmarks: liveLandmarks(level), cover: level.cover },
    heightAt,
  };
}

export const asZone = (level: FrontLevel): ZoneDef => level as unknown as ZoneDef;
