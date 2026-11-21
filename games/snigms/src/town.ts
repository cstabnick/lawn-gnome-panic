// The town: a level document (src/data/levels/town.level.json, edited in the level editor) read into a Lot the brain walks and the view draws.
// Props are centred metres with the origin in the middle of the town; a tile (tx, ty) covers [tx, tx + 1] x [ty, ty + 1] in tile units.
import townDoc from './data/levels/town.level.json';
import { FURNITURE } from './config';
import { placeItem, type Tile } from './world';
import type { FloorKind, Lot, Rot } from './types';

interface TownProp { prefab: string; x: number; z: number; rot?: number }
interface TownMarker { id: string; kind: string; x: number; z: number; data?: { label?: string } }
interface TownDocShape {
  bounds: { w: number; d: number };
  props: TownProp[];
  markers: TownMarker[];
  data: { floors: Record<string, FloorKind> };
}
const doc = townDoc as unknown as TownDocShape;

export const TOWN_W = doc.bounds.w;
export const TOWN_H = doc.bounds.d;

/** Named places in the town: the gate (where trips arrive and leave), the shops and squares, and each neighbour's home. */
export type SpotId = string;

/** The tile a marker stands on. */
function markerTile(m: TownMarker): Tile {
  return { tx: Math.floor(m.x + TOWN_W / 2), ty: Math.floor(m.z + TOWN_H / 2) };
}

const quarter = (rot: number | undefined): Rot => {
  const q = Math.round(((rot ?? 0) / (Math.PI / 2)) % 4);
  return (((q % 4) + 4) % 4) as Rot;
};

/** The kind of a town prop, by prefab: each town kind has one prefab (config.ts TOWN). */
export function townKindOf(prefab: string): string | null {
  for (const def of Object.values(FURNITURE)) if (def.room === 'town' && def.prefab === prefab) return def.kind;
  return null;
}

/** Props that could not be placed (overlap, or a prefab no town kind uses). Empty for the shipped town; tests keep it so. */
export function townLotProblems(): string[] {
  const problems: string[] = [];
  buildLot(problems);
  return problems;
}

function buildLot(problems: string[]): Lot {
  const lot: Lot = { w: TOWN_W, h: TOWN_H, edges: {}, items: [], nextId: 1, floors: {} };
  for (const [key, kind] of Object.entries(doc.data.floors)) lot.floors[key] = kind;
  for (const p of doc.props) {
    const kind = townKindOf(p.prefab);
    if (!kind) {
      problems.push(`no town kind for prefab ${p.prefab}`);
      continue;
    }
    const def = FURNITURE[kind];
    const rot = quarter(p.rot);
    const cx = p.x + TOWN_W / 2;
    const cz = p.z + TOWN_H / 2;
    // rot 0 and 2 keep w along x; rot 1 and 3 swap them (see itemSize in world.ts)
    const sideways = rot === 1 || rot === 3;
    const w = sideways ? def.d : def.w;
    const d = sideways ? def.w : def.d;
    const tx = Math.round(cx - w / 2);
    const ty = Math.round(cz - d / 2);
    if (!placeItem(lot, kind, tx, ty, rot)) problems.push(`${kind} at ${tx},${ty} does not fit`);
  }
  return lot;
}

let cached: Lot | null = null;
/** The town lot. Built once; the brain and the view share it. Do not change it at run time: the town is not built in game. */
export function townLot(): Lot {
  if (!cached) cached = buildLot([]);
  return cached;
}

export function townSpot(id: SpotId): Tile {
  const m = doc.markers.find((x) => x.id === id);
  if (!m) throw new Error(`The town has no spot "${id}"`);
  return markerTile(m);
}

export function townGate(): Tile {
  return townSpot('gate');
}

export function townSpotIds(): SpotId[] {
  return doc.markers.map((m) => m.id);
}

export function townSpotLabel(id: SpotId): string {
  return doc.markers.find((m) => m.id === id)?.data?.label ?? id;
}
