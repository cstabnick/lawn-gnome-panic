// Gnome Theft Auto's regions as the editor holds them: one region document (games/gnome-theft-auto/src/data/levels/<id>.level.json)
// at a time, in its own region-local coordinates (the documents are centred on 0, 0: no origin maths here).
import { distToSeg, type GeneratorRef, type MarkerDef, type PathDef, type Stamp } from '@lawn/level';
import type { ZoneDef } from '@gnomomia/config';
import { inPolygon, REGION_DOCS, REGION_IDS, type GtaProp, type GtaRegionData, type GtaRegionDoc, type RegionId } from '@gta/levels';
import type { PaintKind } from '@gta/landforms';

/** A region as the editor holds it: the document's own fields, plus what the editor core reads. */
export interface GtaLevel {
  id: RegionId;
  name: string;
  /** doc.bounds */
  w: number;
  d: number;
  /** Camera framing: the region's centre (always 0, 0: documents are region-local) and half its larger side. */
  origin: { x: number; z: number };
  half: number;
  indoor: false;
  /** The Road tool shows only drawn roads (GTA has no derived roads). Not saved. */
  roadMode: 'authored';
  base: GeneratorRef;
  stamps: Stamp[];
  paths: PathDef[];
  props: GtaProp[];
  markers: MarkerDef[];
  data: GtaRegionData;
}

const ROAD_COLOUR = 0x55555b;
const OUTSIDE_COLOUR = 0x2a2e36;
const WATER_COLOUR = 0x3d8fd6;
/** The colour of a dirt trail (a road path whose id starts with `trail/`). */
export const TRAIL_COLOUR = 0xa07a4f;
/** The colour of each terrain paint the game lays down (games/gnome-theft-auto/src/terrainPaint.ts). */
export const PAINT_COLOUR: Record<PaintKind, number> = {
  rock: 0x8a8580,
  dirt: 0xa07a4f,
  gravel: 0x9a958c,
  mud: 0x6b5134,
  ice: 0xbfe3f2,
  snow: 0xe8f0f5,
  sand: 0xd9b87a,
  grass: 0x5fae4a,
  farm: 0x8fc24f,
  forest: 0x3d8a45,
  moss: 0x2f6b5c,
  meadow: 0xb5d94a,
};
/** The width of Turfton's city grid roads (games/gnome-theft-auto/src/config.ts ROAD_WIDTH) and of a path without a width. */
const GRID_ROAD_WIDTH = 10;
const DEFAULT_PATH_WIDTH = 10;
const DEFAULT_WATER_WIDTH = 8;

export const REGION_LIST: { id: string; name: string }[] = REGION_IDS.map((id) => ({ id, name: REGION_DOCS[id].name }));

/** The region as the editor edits it. A structured copy: the stored document is never changed by an edit. */
export function docToLevel(doc: GtaRegionDoc): GtaLevel {
  const d = structuredClone(doc);
  const half = Math.max(d.bounds.w, d.bounds.d) / 2;
  return {
    id: d.id as RegionId,
    name: d.name,
    w: d.bounds.w,
    d: d.bounds.d,
    origin: { x: 0, z: 0 },
    half,
    indoor: false,
    roadMode: 'authored',
    base: d.base,
    stamps: d.stamps,
    paths: d.paths,
    props: d.props,
    markers: d.markers,
    data: d.data,
  };
}

/** The region document the editor saves. The key order is the file's, so an unedited region is written byte for byte. */
export function levelToDoc(l: GtaLevel): GtaRegionDoc {
  return {
    format: 'lawn-level',
    version: 1,
    game: 'gnome-theft-auto',
    id: l.id,
    name: l.name,
    bounds: { w: l.w, d: l.d },
    base: l.base,
    stamps: l.stamps,
    paths: l.paths,
    props: l.props,
    markers: l.markers,
    data: l.data,
  } as unknown as GtaRegionDoc;
}

export const asZone = (l: GtaLevel): ZoneDef => l as unknown as ZoneDef;

/** Distance from (x, z) to a road path's centre line (a single-node path is a point). */
function distToPath(p: PathDef, x: number, z: number): number {
  if (p.points.length === 1) return Math.hypot(x - p.points[0][0], z - p.points[0][1]);
  let best = Infinity;
  for (let i = 0; i < p.points.length - 1; i++) {
    const [ax, az] = p.points[i];
    const [bx, bz] = p.points[i + 1];
    best = Math.min(best, distToSeg(x, z, ax, az, bx, bz));
  }
  return best;
}

/** Whether (x, z) lies on Turfton's city grid: a grid line runs along x = each line (inside data.grid.half) and z = each line. */
function onGrid(l: GtaLevel, x: number, z: number): boolean {
  const g = l.data.grid;
  if (!g) return false;
  const reach = GRID_ROAD_WIDTH / 2;
  return g.lines.some((line) => (Math.abs(x - line) <= reach && Math.abs(z) <= g.half) || (Math.abs(z - line) <= reach && Math.abs(x) <= g.half));
}

/**
 * What the ground looks like at (x, z), in region-local metres, in this order: the road colour on a road (a drawn highway
 * within half its width, or a Turfton grid line inside data.grid.half); the water colour within half the width of a reserved
 * river or canal ('water' path, default width 8); a dark colour outside the region's border polygon (when it has one, 3 or
 * more points) or outside the bounds; else the game's terrain paint at (x, z) when `paint` gives one (a trail, a road path
 * whose id starts with `trail/`, shows as TRAIL_COLOUR instead of the road colour); else the region's ground colour.
 * `paint` takes region-local x, z and returns a PaintKind or null (unpainted).
 */
export function groundColourAt(l: GtaLevel, x: number, z: number, paint?: (x: number, z: number) => PaintKind | null): number {
  const onRoadPath = (p: PathDef) => p.kind === 'road' && distToPath(p, x, z) <= (p.width ?? DEFAULT_PATH_WIDTH) / 2;
  const grid = onGrid(l, x, z);
  const onRoad = grid || l.paths.some(onRoadPath);
  if (onRoad) {
    // A trail gives way to a highway or the Turfton grid where they overlap.
    const onHighway = grid || l.paths.some((p) => onRoadPath(p) && !p.id.startsWith('trail/'));
    return onHighway ? ROAD_COLOUR : TRAIL_COLOUR;
  }
  const onWater = l.paths.some((p) => p.kind === 'water' && distToPath(p, x, z) <= (p.width ?? DEFAULT_WATER_WIDTH) / 2);
  if (onWater) return WATER_COLOUR;
  const border = l.data.border;
  const outsideBorder = Array.isArray(border) && border.length >= 3 && !inPolygon(border, x, z);
  if (outsideBorder || Math.abs(x) > l.w / 2 || Math.abs(z) > l.d / 2) return OUTSIDE_COLOUR;
  const p = paint?.(x, z);
  if (p) return PAINT_COLOUR[p];
  return l.data.ground;
}
