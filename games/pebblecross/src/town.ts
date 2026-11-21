import { applyStamps } from '@lawn/level';
import type { LevelDoc, MarkerDef, Stamp } from '@lawn/level';
import doc from './data/levels/pebblecross.level.json';
import type { Box, Circle, NavWorld, Pt } from './nav';
import type { GiftId } from './config';

export interface TownData {
  ground: string;                       // '#rrggbb'
  ponds: Circle[];                      // a pond: drawn as water and blocks walking
  blockers: Box[];                      // extra blocked boxes (walls, the oak trunk)
  buildings: { id: string; label: string; x: number; z: number; w: number; d: number; h: number; color: string; roof: string }[];
}
export interface TownBuilding { id: string; label: string; x: number; z: number; w: number; d: number; h: number; color: number; roof: number }
export interface TownPlace { id: string; kind: 'place' | 'forage' | 'spawn'; label: string; x: number; z: number; r: number; item?: GiftId }
export interface TownProp { prefab: string; x: number; z: number; rot: number; scale: number; solidR?: number }
export interface Town {
  id: string; name: string; w: number; d: number;
  ground: number;                       // colour as a number
  buildings: TownBuilding[];
  roads: { points: Pt[]; width: number }[];
  ponds: Circle[];
  props: TownProp[];
  stamps: Stamp[];
  spawn: Pt;
  places: Record<string, TownPlace>;    // every `place` marker, keyed by its id (PlaceId)
  forage: TownPlace[];                  // every `forage` marker, in file order
  navWorld: NavWorld;                   // boxes = data.blockers + every building footprint; circles = ponds + props with solidR
  heightAt(x: number, z: number): number; // ground height in metres: the base is 0, then the stamps are applied
}

export const TOWN_DOC = doc as unknown as LevelDoc<TownData>;   // the imported src/data/levels/pebblecross.level.json

function hexToNumber(s: string): number {
  return parseInt(s.slice(1), 16);
}

function placeOf(m: MarkerDef, label: string, kind: TownPlace['kind']): TownPlace {
  return { id: m.id, kind, label, x: m.x, z: m.z, r: m.r ?? 1.5 };
}

export function loadTown(doc: LevelDoc<TownData>): Town {
  const src = structuredClone(doc);
  const data = src.data;

  const buildings: TownBuilding[] = data.buildings.map((b) => ({
    id: b.id,
    label: b.label,
    x: b.x,
    z: b.z,
    w: b.w,
    d: b.d,
    h: b.h,
    color: hexToNumber(b.color),
    roof: hexToNumber(b.roof),
  }));

  const roads = src.paths
    .filter((p) => p.kind === 'road')
    .map((p) => ({
      points: p.points.map(([x, z]) => ({ x, z })),
      width: p.width ?? 2.4,
    }));

  const props: TownProp[] = src.props.map((p) => ({
    prefab: p.prefab,
    x: p.x,
    z: p.z,
    rot: p.rot ?? 0,
    scale: p.scale ?? 1,
    ...(p.solidR !== undefined ? { solidR: p.solidR } : {}),
  }));

  const places: Record<string, TownPlace> = {};
  const forage: TownPlace[] = [];
  let spawn: Pt = { x: 0, z: 0 };
  for (const m of src.markers) {
    if (m.kind === 'place') {
      places[m.id] = placeOf(m, String(m.data?.label ?? m.id), 'place');
    } else if (m.kind === 'forage') {
      forage.push({
        ...placeOf(m, String(m.data?.label ?? 'Forage'), 'forage'),
        item: m.data?.item as GiftId,
      });
    } else if (m.kind === 'spawn') {
      spawn = { x: m.x, z: m.z };
    }
  }

  const navWorld: NavWorld = {
    w: src.bounds.w,
    d: src.bounds.d,
    boxes: [
      ...data.blockers,
      ...buildings.map((b) => ({ x: b.x, z: b.z, w: b.w, d: b.d })),
    ],
    circles: [
      ...data.ponds,
      ...props
        .filter((p) => p.solidR !== undefined)
        .map((p) => ({ x: p.x, z: p.z, r: p.solidR as number })),
    ],
  };

  const stamps = src.stamps;

  return {
    id: src.id,
    name: src.name,
    w: src.bounds.w,
    d: src.bounds.d,
    ground: hexToNumber(data.ground),
    buildings,
    roads,
    ponds: data.ponds,
    props,
    stamps,
    spawn,
    places,
    forage,
    navWorld,
    heightAt: (x: number, z: number) => applyStamps(0, stamps, x, z),
  };
}
