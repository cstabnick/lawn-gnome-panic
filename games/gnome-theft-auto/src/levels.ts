// The GTA world as level documents (@lawn/level): one `<region>.level.json` per region in src/data/levels/, placed by
// src/data/world.layout.json (each region's origin, the world size, the highway order). Documents are authored
// region-local (around 0, 0); everything this module hands out is in world coordinates.
//
// What lives where in a region document:
//   base      the region's procedural generator (`gta-city`, `gta-<biome>-scatter`) and its PRNG seed
//   paths     highways (kind 'road', width = road width), each in exactly one region; off-road dirt trails (kind 'road',
//             id 'trail/...', default width TERRAIN.trailWidth: no traffic, painted dirt); the river course (kind 'water',
//             reserved: nothing is carved or drawn in 3D yet), each stretch in exactly one region
//   props     hand-placed prefabs. `solid: true` = a box collider the size of the prefab's footprint. Three prefab ids
//             are special: 'team-banner' and 'windsock' are animated, 'gta-dew-barrel' is a shootable barrel.
//   markers   named points, by kind (MARKER_KINDS below). Offsets inside `data` ({ dx, dz }) are relative to the
//             marker and are NOT moved by the origin.
//   data      GtaRegionData
//
// Pure data: no three.js, no DOM, no imports from the rest of the game (the level editor imports this file too).
import { validateLevelDoc, type GeneratorRef, type LevelDoc, type MarkerDef, type PathDef, type PropDef } from '@lawn/level';
import layoutJson from './data/world.layout.json';
import turftonJson from './data/levels/turfton.level.json';
import dustFlatsJson from './data/levels/dust-flats.level.json';
import mossyWoodJson from './data/levels/mossy-wood.level.json';
import frostbiteFellsJson from './data/levels/frostbite-fells.level.json';
import cloverfieldFarmsJson from './data/levels/cloverfield-farms.level.json';
import lochMossJson from './data/levels/loch-moss.level.json';
import tallgrassCommonsJson from './data/levels/tallgrass-commons.level.json';
import northHighlandsJson from './data/levels/north-highlands.level.json';
import southShoreJson from './data/levels/south-shore.level.json';
import eastCampusJson from './data/levels/east-campus.level.json';
import westEstatesJson from './data/levels/west-estates.level.json';

/** Same strings as BiomeId in types.ts (declared here so this file imports nothing from the game). */
export type RegionBiome =
  | 'city' | 'desert' | 'forest' | 'tundra' | 'farmland' | 'loch' | 'parkland' | 'highland' | 'coast' | 'campus' | 'estate';
export type RegionId =
  | 'turfton' | 'dust-flats' | 'mossy-wood' | 'frostbite-fells' | 'cloverfield-farms' | 'loch-moss' | 'tallgrass-commons'
  | 'north-highlands' | 'south-shore' | 'east-campus' | 'west-estates';
/** Every biome id, in BiomeId order. */
export const REGION_BIOMES: readonly RegionBiome[] = [
  'city', 'desert', 'forest', 'tundra', 'farmland', 'loch', 'parkland', 'highland', 'coast', 'campus', 'estate',
];
/** Same strings as SurfaceKind in surfaces.ts. */
export type RegionSurface = 'asphalt' | 'ice' | 'snow' | 'sand' | 'mud' | 'grass' | 'farm';

/** A region document's own `data` block. */
export interface GtaRegionData {
  /** The biome id the game uses for this region. */
  region: RegionBiome;
  /** Ground colour, 0xRRGGBB. */
  ground: number;
  /** The off-road driving surface of the region (read by the terrain's surfaceAt from Epic 2 on). */
  surface: RegionSurface;
  /** Name of the region's merged static scenery group ('desert-scenery'...). Absent for Turfton. */
  batch?: string;
  /** Turfton only: the city grid. Road centre lines run along x = each line and z = each line. */
  grid?: { half: number; lines: number[]; pitch: number };
  /** Turfton only: PRNG state the kerb-side parked mowers are drawn from (world.ts). */
  kerbSeed?: number;
  /**
   * The region's border: a simple polygon (no holes, either winding), region-local [x, z]. The borders of all regions
   * tile the world square without gaps; regionAt() resolves a point on a shared edge by REGION_PRIORITY.
   */
  border: [number, number][];
  /** The region's landforms (Epic 5): its relief generator and the features it reads. Absent = no relief of its own. */
  terrain?: GtaTerrain;
}

/**
 * A region's landforms. `relief` names the generator (src/landforms/<region>.ts registers it under this id and version)
 * and its tuning numbers; `features` are the shapes it reads (mesas, ridges, a canyon line...), region-local like the
 * rest of the document. Point features are plain document `stamps` (gauss / flatten) instead.
 */
export interface GtaTerrain {
  relief: { id: string; version: number; params: Record<string, number> };
  features?: GtaTerrainFeature[];
}

/** One landform shape: a point (one entry in `points`) or a polyline, with an optional radius / width `r` and height `h`. */
export interface GtaTerrainFeature {
  id: string;
  /** What the generator does with it ('mesa', 'ridge', 'canyon', 'terrace', ...): the generator's own words. */
  kind: string;
  points: [number, number][];
  r?: number;
  h?: number;
}

/** Road paths whose id starts with this are off-road dirt trails, not highways (no traffic, no asphalt). */
export const TRAIL_PREFIX = 'trail/';

/** A prop with the GTA extras. */
export type GtaProp = PropDef & { solid?: boolean };

/** One region document, as stored (region-local coordinates). */
export type GtaRegionDoc = Omit<LevelDoc<GtaRegionData>, 'props' | 'base'> & { base: GeneratorRef; props: GtaProp[] };

export interface GtaLayout {
  format: 'gta-layout';
  version: 1;
  /** Playable area is x, z in [-worldHalf, worldHalf]. */
  worldHalf: number;
  /** The perimeter fence stands at |x| = fenceEdge and |z| = fenceEdge. */
  fenceEdge: number;
  /** Every region, in build order (Turfton first, then the scatter order). */
  regions: { id: RegionId; origin: { x: number; z: number } }[];
  /** Highway ids in road-graph order (the graph numbers nodes in this order). */
  highways: string[];
}

/**
 * Marker kinds and what their `data` holds (offsets are relative to the marker):
 *   spawn     Turfton 'player': { yaw }
 *   landmark  Turfton buildings: { footprint?, height?, yaw?, respawn?: {dx,dz,yaw}, bay?: {dx,dz,radius?} }
 *   area      Turfton rectangles centred on the marker: { w, d }
 *   portal    culvert portals: no data
 *   giver     'giver/<quest giver id>': { exit: { dx, dz, yaw } }
 *   site      'fort-sandpit': { w, d, gate: {dx, width}, pad: {dx,dz}, wallHeight, guardPosts: {dx,dz}[] }
 *             'airfield': { yaw, length, width, planeSpots: {dx, dz, yaw, kind}[] }
 *   setpiece  a code-built landmark anchored here: { builder, yaw? }
 *   reserve   a rectangle scenery keeps out of: { hw, hd } (half sizes)
 *   walk      a point townsgnomes wander between: no data
 *   water     a reserved still-water body (the loch, the Puddle Sea), a rectangle centred on the marker: { w, d }.
 *             Reserved only: nothing is carved or drawn in 3D yet (Epic 4 turns these into polygons).
 *   slot      a site reserved for a later epic (src/sites.ts reads these): { hw, hd, yaw?, kind, epic, flat, label?, parent?,
 *             overRoad?, anchors?: { name: {dx, dz, yaw?} } }. Scenery keeps out; flat: true also levels the ground.
 */
export const MARKER_KINDS = ['spawn', 'landmark', 'area', 'portal', 'giver', 'site', 'setpiece', 'reserve', 'walk', 'water', 'slot'] as const;
export type GtaMarkerKind = (typeof MARKER_KINDS)[number];

/** Setpiece builder ids (biomes.ts has one builder per id). */
export const SETPIECE_BUILDERS = [
  'compost-heap', 'unmowed-ring', 'chapel-van', 'tall-house-porch', 'knot-hole', 'birdbath-basin', 'kiln-shrine',
  'ley-ramp', 'granny-farm', 'biscuits-nap', 'drainage-canal', 'brenda-throne', 'driftwood-raft', 'dew-station',
] as const;

/**
 * Generator ids by region (the `base` of each document) and the version the code implements.
 * The four biome scatters are version 2: version 1's scatter, unchanged, inside the old 1200 x 1200 world (its extent,
 * old fence line and road set come from base.params: `half` 600, `fence` 595, `roads` = how many of LAYOUT.highways
 * it saw), then an outer-ring pass for the land the map grew by. Loch Moss and Tallgrass Commons are empty for now.
 */
export const GENERATORS: Record<RegionId, { id: string; version: number }> = {
  turfton: { id: 'gta-city', version: 1 },
  'dust-flats': { id: 'gta-desert-scatter', version: 2 },
  'mossy-wood': { id: 'gta-forest-scatter', version: 2 },
  'frostbite-fells': { id: 'gta-tundra-scatter', version: 2 },
  'cloverfield-farms': { id: 'gta-farmland-scatter', version: 2 },
  'loch-moss': { id: 'gta-loch-scatter', version: 1 },
  'tallgrass-commons': { id: 'gta-parkland-scatter', version: 1 },
  'north-highlands': { id: 'gta-highland-scatter', version: 1 },
  'south-shore': { id: 'gta-coast-scatter', version: 1 },
  'east-campus': { id: 'gta-campus-scatter', version: 1 },
  'west-estates': { id: 'gta-estate-scatter', version: 1 },
};

export const LAYOUT = layoutJson as unknown as GtaLayout;

/** The documents as stored, by region id. Read-only: the game never changes them. */
export const REGION_DOCS: Record<RegionId, GtaRegionDoc> = {
  turfton: turftonJson as unknown as GtaRegionDoc,
  'dust-flats': dustFlatsJson as unknown as GtaRegionDoc,
  'mossy-wood': mossyWoodJson as unknown as GtaRegionDoc,
  'frostbite-fells': frostbiteFellsJson as unknown as GtaRegionDoc,
  'cloverfield-farms': cloverfieldFarmsJson as unknown as GtaRegionDoc,
  'loch-moss': lochMossJson as unknown as GtaRegionDoc,
  'tallgrass-commons': tallgrassCommonsJson as unknown as GtaRegionDoc,
  'north-highlands': northHighlandsJson as unknown as GtaRegionDoc,
  'south-shore': southShoreJson as unknown as GtaRegionDoc,
  'east-campus': eastCampusJson as unknown as GtaRegionDoc,
  'west-estates': westEstatesJson as unknown as GtaRegionDoc,
};

/** Region ids in build order (LAYOUT.regions order). */
export const REGION_IDS: readonly RegionId[] = LAYOUT.regions.map((r) => r.id);

/** A marker in world coordinates, with the region it came from. */
export type WorldMarker = MarkerDef & { region: RegionId };

/** A region in world coordinates: paths, props and markers moved by the origin. `data` and marker `data` untouched. */
export interface Region {
  id: RegionId;
  name: string;
  origin: { x: number; z: number };
  bounds: { w: number; d: number };
  base: GeneratorRef;
  data: GtaRegionData;
  /** data.border in world coordinates. */
  border: [number, number][];
  paths: PathDef[];
  props: GtaProp[];
  markers: WorldMarker[];
}

function toWorld(id: RegionId): Region {
  const doc = REGION_DOCS[id];
  const o = LAYOUT.regions.find((r) => r.id === id)?.origin;
  if (!o) throw new Error(`world.layout.json has no region "${id}"`);
  return {
    id, name: doc.name, origin: { ...o }, bounds: { ...doc.bounds }, base: doc.base, data: doc.data,
    border: doc.data.border.map(([x, z]): [number, number] => [x + o.x, z + o.z]),
    paths: doc.paths.map((p) => ({ ...p, points: p.points.map(([x, z]): [number, number] => [x + o.x, z + o.z]) })),
    props: doc.props.map((p) => ({ ...p, x: p.x + o.x, z: p.z + o.z })),
    markers: doc.markers.map((m) => ({ ...m, x: m.x + o.x, z: m.z + o.z, region: id })),
  };
}

/** Every region in world coordinates, by id. */
export const REGIONS: Record<RegionId, Region> = Object.fromEntries(REGION_IDS.map((id) => [id, toWorld(id)])) as Record<RegionId, Region>;

/** The region whose data.region is `biome`. Throws when there is none. */
export function regionOf(biome: RegionBiome): Region {
  const r = REGION_IDS.map((id) => REGIONS[id]).find((x) => x.data.region === biome);
  if (!r) throw new Error(`no region document for biome "${biome}"`);
  return r;
}

/** Every marker of `kind`, in world coordinates: regions in build order, then document order. */
export function markersOf(kind: string): WorldMarker[] {
  return REGION_IDS.flatMap((id) => REGIONS[id].markers.filter((m) => m.kind === kind));
}

/** The marker of `kind` with `id` (world coordinates), searching every region. Throws when it is missing. */
export function marker(kind: string, id: string): WorldMarker {
  const m = markersOf(kind).find((x) => x.id === id);
  if (!m) throw new Error(`level documents have no ${kind} marker "${id}"`);
  return m;
}

/** A number from a marker's data (or a nested object in it, e.g. markerNum(m, 'respawn', 'dx')). Throws when missing. */
export function markerNum(m: MarkerDef, ...path: string[]): number {
  let v: unknown = m.data;
  for (const k of path) v = v && typeof v === 'object' ? (v as Record<string, unknown>)[k] : undefined;
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`marker "${m.id}": data.${path.join('.')} must be a number`);
  return v;
}

/**
 * The highways (road paths of every region) in world coordinates: first the ones LAYOUT.highways lists, in that order
 * (the road graph numbers its nodes in this order), then any road a region has that the layout does not list yet
 * (drawn in the editor), in region then document order. Throws when a listed highway is missing.
 */
export function highways(): { id: string; points: [number, number][]; width: number }[] {
  const all = REGION_IDS.flatMap((id) => REGIONS[id].paths.filter((p) => p.kind === 'road' && !p.id.startsWith(TRAIL_PREFIX)));
  const out = (p: PathDef) => ({ id: p.id, points: p.points, width: p.width ?? 10 });
  const listed = LAYOUT.highways.map((hid) => {
    const p = all.find((x) => x.id === hid);
    if (!p) throw new Error(`world.layout.json lists highway "${hid}" but no region has a road path with that id`);
    return out(p);
  });
  return [...listed, ...all.filter((p) => !LAYOUT.highways.includes(p.id)).map(out)];
}

/** Every off-road trail (a road path whose id starts with TRAIL_PREFIX), world coordinates; width 0 = the default. */
export function trails(): { id: string; region: RegionId; points: [number, number][]; width: number }[] {
  return REGION_IDS.flatMap((id) => REGIONS[id].paths
    .filter((p) => p.kind === 'road' && p.id.startsWith(TRAIL_PREFIX))
    .map((p) => ({ id: p.id, region: id, points: p.points, width: p.width ?? 0 })));
}

// ---- Which region a point is in ---------------------------------------------------------------------------------
/**
 * Order regionAt() tests the borders in. A point on an edge two regions share goes to the earlier one: Turfton's square
 * includes its edges, and a point on a diagonal between two wedges goes to the east/west wedge (Dust Flats, Mossy Wood),
 * exactly as the old diagonal rule did; the corner regions come last, so the old 1200 x 1200 square (edges included)
 * keeps its old biomes.
 */
export const REGION_PRIORITY: readonly RegionId[] = [
  'turfton', 'dust-flats', 'mossy-wood', 'frostbite-fells', 'cloverfield-farms', 'loch-moss', 'tallgrass-commons',
  // The batch-3 bands round the old 1800 x 1800 square: their inner edges meet the old regions' outer edges, which win.
  'north-highlands', 'south-shore', 'east-campus', 'west-estates',
];
const EDGE_EPS = 1e-9;

function onSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number): boolean {
  const cross = (bx - ax) * (pz - az) - (bz - az) * (px - ax);
  if (Math.abs(cross) > EDGE_EPS * Math.max(1, Math.hypot(bx - ax, bz - az))) return false;
  return px >= Math.min(ax, bx) - EDGE_EPS && px <= Math.max(ax, bx) + EDGE_EPS
    && pz >= Math.min(az, bz) - EDGE_EPS && pz <= Math.max(az, bz) + EDGE_EPS;
}

/** True when (x, z) is inside the polygon or on its edge (even-odd rule; any winding). */
export function inPolygon(poly: readonly (readonly [number, number])[], x: number, z: number): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, az] = poly[j];
    const [bx, bz] = poly[i];
    if (onSegment(x, z, ax, az, bx, bz)) return true;
    if ((az > z) !== (bz > z) && x < ((bx - ax) * (z - az)) / (bz - az) + ax) inside = !inside;
  }
  return inside;
}

/** regionAt without the raster: the first region in REGION_PRIORITY whose border holds the point (edges included). */
export function regionAtExact(x: number, z: number): RegionId {
  for (const id of REGION_PRIORITY) if (inPolygon(REGIONS[id].border, x, z)) return id;
  // Off the map: the region with the nearest origin, so callers always get an answer.
  let best: RegionId = 'turfton';
  let bestD = Infinity;
  for (const id of REGION_PRIORITY) {
    const o = REGIONS[id].origin;
    const d = (o.x - x) ** 2 + (o.z - z) ** 2;
    if (d < bestD) { bestD = d; best = id; }
  }
  return best;
}

/** Raster cell size (m) of the regionAt cache. */
export const REGION_CELL = 16;
const RASTER_N = Math.ceil((2 * LAYOUT.worldHalf) / REGION_CELL);
/** Region index per cell (into REGION_PRIORITY), or -1 where a border touches the cell and the exact test decides. */
let raster: Int8Array | null = null;

function buildRaster(): Int8Array {
  const out = new Int8Array(RASTER_N * RASTER_N);
  const x0 = -LAYOUT.worldHalf;
  const verts = REGION_PRIORITY.flatMap((id) => REGIONS[id].border);
  for (let j = 0; j < RASTER_N; j++) {
    for (let i = 0; i < RASTER_N; i++) {
      const ax = x0 + i * REGION_CELL, az = x0 + j * REGION_CELL;
      const bx = ax + REGION_CELL, bz = az + REGION_CELL;
      const r = regionAtExact(ax, az);
      // One region when the four corners agree and no border vertex lies in the (closed) cell: a straight border edge
      // that crossed the cell would split its corners.
      const same = r === regionAtExact(bx, az) && r === regionAtExact(ax, bz) && r === regionAtExact(bx, bz)
        && !verts.some(([vx, vz]) => vx >= ax && vx <= bx && vz >= az && vz <= bz);
      out[j * RASTER_N + i] = same ? REGION_PRIORITY.indexOf(r) : -1;
    }
  }
  return out;
}

/**
 * Which region (x, z) is in, in world coordinates. A cached raster answers most points; cells a border touches fall
 * back to regionAtExact, so the answer is always exact. Points off the map get the region with the nearest origin.
 */
export function regionAt(x: number, z: number): RegionId {
  const i = Math.floor((x + LAYOUT.worldHalf) / REGION_CELL);
  const j = Math.floor((z + LAYOUT.worldHalf) / REGION_CELL);
  if (i < 0 || j < 0 || i >= RASTER_N || j >= RASTER_N) return regionAtExact(x, z);
  raster ??= buildRaster();
  const k = raster[j * RASTER_N + i];
  return k >= 0 ? REGION_PRIORITY[k] : regionAtExact(x, z);
}

/** Fast lookup when the entire 16 m raster cell containing (x, z) lies inside a single region; null along region seams. */
export function uniformRegionAt(x: number, z: number): RegionId | null {
  const i = Math.floor((x + LAYOUT.worldHalf) / REGION_CELL);
  const j = Math.floor((z + LAYOUT.worldHalf) / REGION_CELL);
  if (i < 0 || j < 0 || i >= RASTER_N || j >= RASTER_N) return null;
  raster ??= buildRaster();
  const k = raster[j * RASTER_N + i];
  return k >= 0 ? REGION_PRIORITY[k] : null;
}

/** The biome id (data.region) of the region at (x, z). */
export function biomeAtPoint(x: number, z: number): RegionBiome {
  return REGIONS[regionAt(x, z)].data.region;
}

/** The reserved river and canal course (every region's 'water' paths) in world coordinates, region then document order. */
export function waterPaths(): { id: string; points: [number, number][]; width: number }[] {
  return REGION_IDS.flatMap((id) => REGIONS[id].paths.filter((p) => p.kind === 'water'))
    .map((p) => ({ id: p.id, points: p.points, width: p.width ?? 8 }));
}

/** The reserved still-water bodies ('water' markers) as world rectangles. */
export function waterBodies(): { id: string; minX: number; maxX: number; minZ: number; maxZ: number }[] {
  return markersOf('water').map((m) => {
    const w = markerNum(m, 'w');
    const d = markerNum(m, 'd');
    return { id: m.id, minX: m.x - w / 2, maxX: m.x + w / 2, minZ: m.z - d / 2, maxZ: m.z + d / 2 };
  });
}

/** Problems with a GTA region document (the shared layers plus the GTA rules), empty when it is fine. Never throws. */
export function regionDocProblems(doc: unknown): string[] {
  const out = validateLevelDoc(doc);
  if (out.length > 0) return out;
  const d = doc as GtaRegionDoc;
  if (d.game !== 'gnome-theft-auto') out.push('game: must be "gnome-theft-auto"');
  if (!d.base) out.push('base: every region names its generator');
  const data = d.data as unknown as Record<string, unknown>;
  if (!data || typeof data !== 'object') return [...out, 'data: must be an object'];
  if (!(REGION_BIOMES as readonly string[]).includes(String(data.region))) out.push('data.region: must be a biome id');
  if (typeof data.ground !== 'number' || !Number.isInteger(data.ground) || data.ground < 0 || data.ground > 0xffffff) out.push('data.ground: must be a 0xRRGGBB number');
  if (!['asphalt', 'ice', 'snow', 'sand', 'mud', 'grass', 'farm'].includes(String(data.surface))) out.push('data.surface: must be a surface kind');
  const border = data.border;
  const isPt = (p: unknown): boolean => Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === 'number' && Number.isFinite(n));
  if (!Array.isArray(border) || border.length < 3 || !border.every(isPt)) out.push('data.border: must be at least 3 [x, z] points');
  if (data.terrain !== undefined) {
    const t = data.terrain as Partial<GtaTerrain>;
    const r = t?.relief as Partial<GtaTerrain['relief']> | undefined;
    if (!r || typeof r.id !== 'string' || !Number.isInteger(r.version)) out.push('data.terrain.relief: needs an id and an integer version');
    else if (!r.params || typeof r.params !== 'object' || !Object.values(r.params).every((v) => typeof v === 'number' && Number.isFinite(v))) out.push('data.terrain.relief.params: must be numbers');
    if (t.features !== undefined) {
      if (!Array.isArray(t.features)) out.push('data.terrain.features: must be a list');
      else t.features.forEach((f, i) => {
        if (typeof f?.id !== 'string' || typeof f.kind !== 'string') out.push(`data.terrain.features[${i}]: needs an id and a kind`);
        else if (!Array.isArray(f.points) || f.points.length < 1 || !f.points.every(isPt)) out.push(`data.terrain.features[${i}].points: must be at least one [x, z] point`);
        else if ((f.r !== undefined && !Number.isFinite(f.r)) || (f.h !== undefined && !Number.isFinite(f.h))) out.push(`data.terrain.features[${i}]: r and h must be numbers`);
      });
    }
  }
  d.props.forEach((p, i) => {
    if (p.solid !== undefined && typeof p.solid !== 'boolean') out.push(`props[${i}].solid: must be true or false`);
  });
  d.markers.forEach((m, i) => {
    if (!(MARKER_KINDS as readonly string[]).includes(m.kind)) out.push(`markers[${i}].kind: "${m.kind}" is not one of ${MARKER_KINDS.join(', ')}`);
    if (m.kind === 'setpiece' && !(SETPIECE_BUILDERS as readonly string[]).includes(String(m.data?.builder))) out.push(`markers[${i}].data.builder: "${String(m.data?.builder)}" is not a setpiece builder`);
    if (m.kind === 'reserve' && !(typeof m.data?.hw === 'number' && typeof m.data?.hd === 'number')) out.push(`markers[${i}].data: a reserve needs hw and hd`);
    if (m.kind === 'water' && !(typeof m.data?.w === 'number' && typeof m.data?.d === 'number')) out.push(`markers[${i}].data: a water body needs w and d`);
    if (m.kind === 'slot') {
      const sd = (m.data ?? {}) as Record<string, unknown>;
      if (!(typeof sd.hw === 'number' && sd.hw > 0 && typeof sd.hd === 'number' && sd.hd > 0)) out.push(`markers[${i}].data: a slot needs hw and hd > 0`);
      if (typeof sd.kind !== 'string' || typeof sd.epic !== 'string' || typeof sd.flat !== 'boolean') out.push(`markers[${i}].data: a slot needs kind, epic and flat`);
      if (sd.yaw !== undefined && typeof sd.yaw !== 'number') out.push(`markers[${i}].data.yaw: must be a number`);
      if (sd.anchors !== undefined) {
        const a = sd.anchors as Record<string, { dx?: unknown; dz?: unknown }>;
        if (!a || typeof a !== 'object' || !Object.values(a).every((v) => typeof v?.dx === 'number' && typeof v?.dz === 'number')) out.push(`markers[${i}].data.anchors: each anchor needs dx and dz`);
      }
    }
  });
  d.paths.forEach((p, i) => {
    if (p.kind !== 'road' && p.kind !== 'water') out.push(`paths[${i}].kind: GTA regions only have roads and water for now`);
  });
  return out;
}
