// The arena as a level document (src/data/levels/arena.level.json). config.ts, terrain.ts and world.ts read the arena
// from here. Type-only imports from config.ts are fine; nothing here may import config.ts at run time (it imports us).
import type { LevelDoc, MarkerDef } from '@lawn/level';
import type { FlagDef, Team, VehicleKind } from './config';
import arenaJson from './data/levels/arena.level.json';

export interface Mound {
  x: number;
  z: number;
  r: number;
  h: number;
}

/** A smoothstep ramp: flat inside `inner`, the open ground beyond `outer`. */
export interface Band {
  inner: number;
  outer: number;
}

/** A collision circle of a landmark, offset from the flag it belongs to. */
export interface LandmarkObstacle {
  dx: number;
  dz: number;
  r: number;
  h: number;
}

/** One prefab placed at an offset from a flag. Its obstacles are offsets from that same flag, in creation order. */
export interface Landmark {
  at: FlagDef['id'];
  dx: number;
  dz: number;
  prefab: string;
  scale: number;
  rotY: number;
  obstacles: LandmarkObstacle[];
}

/** One scatter() call of the cover. `sink` lowers the prefab into the turf; `spin` draws a random yaw after placing it. */
export interface CoverLayer {
  prefab: string;
  count: number;
  scale: number;
  sink?: number;
  spin?: boolean;
  obstacle: { r: number; h: number };
}

export interface ArenaData {
  mounds: Mound[];
  flatten: { edge: Band; base: Band; flag: Band };
  landmarks: Landmark[];
  cover: {
    seed: number;
    tries: number;
    edge: number;
    avoid: { flag: number; base: number; slot: number; cover: number };
    layers: CoverLayer[];
  };
}

export const ARENA_DOC = arenaJson as unknown as LevelDoc<ArenaData>;

export interface BaseDef {
  x: number;
  z: number;
  yaw: number;
}

export interface VehicleSlotDef {
  kind: VehicleKind;
  team: Team;
  x: number;
  z: number;
  yaw: number;
}

/** Half the arena's side: the battlefield runs -half..half on x and z. */
export function docHalf(doc: LevelDoc<unknown>): number {
  return doc.bounds.w / 2;
}

/** The two bases, indexed by team (team 0 first). */
export function docBases(doc: LevelDoc<unknown>): readonly [BaseDef, BaseDef] {
  const at = (team: Team): BaseDef => {
    const m = doc.markers.find((k) => k.kind === 'base' && k.data?.team === team);
    if (!m) throw new Error(`levelDoc: no base for team ${team}`);
    return { x: m.x, z: m.z, yaw: m.data?.yaw as number };
  };
  return [at(0), at(1)];
}

/** The flags in marker order. */
export function docFlags(doc: LevelDoc<unknown>): FlagDef[] {
  return doc.markers
    .filter((m) => m.kind === 'flag')
    .map((m: MarkerDef): FlagDef => ({
      id: m.id as FlagDef['id'],
      name: m.data?.name as string,
      x: m.x,
      z: m.z,
    }));
}

/** The vehicle home slots in marker order. */
export function docVehicleSlots(doc: LevelDoc<unknown>): VehicleSlotDef[] {
  return doc.markers
    .filter((m) => m.kind === 'vehicle')
    .map((m): VehicleSlotDef => ({
      kind: m.data?.vehicle as VehicleKind,
      team: m.data?.team as Team,
      x: m.x,
      z: m.z,
      yaw: m.data?.yaw as number,
    }));
}
