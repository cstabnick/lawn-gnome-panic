// The site registry (GTA batch 3, epic E01): every piece of ground reserved for a later epic, by id. Content epics read
// their footprint and anchor points here instead of typing coordinates, so nobody fights for ground.
//
// The data lives in the region documents as `slot` markers (src/data/levels/*.level.json, marker data
// { hw, hd, yaw?, kind, epic, flat, label?, parent?, overRoad?, anchors?: { name: { dx, dz, yaw? } } }); this module turns them
// into world coordinates. Renaming or moving a site is a document edit (plus SITE_IDS below).
//
// What a slot does to the world before its epic fills it (reservedRects is read by terrain.ts, landforms/macro.ts,
// biomes.ts, settlements.ts and cityScenery/site.ts):
//   - every slot keeps procedural scenery, settlements, fringe lots and street dressing out of its rectangle;
//   - a `flat: true` slot is also levelled (like a `reserve` marker: flat within TERRAIN.siteMargin, blended over siteFade)
//     and keeps the macro relief (landscape.json hills) off it; a `flat: false` slot keeps its natural ground.
// Rectangles are axis-aligned (hw along x, hd along z); `yaw` is only the way the content should face.
//
// Off the map: OFF_MAP lists the coordinates kept clear for rooms that are not part of the world (cutscene rooms,
// stages, interiors). Nothing in the world may be built there, and nothing there is clamped to the world.
//
// Pure: no three.js, no DOM, imports only levels.ts.
import { LAYOUT, markerNum, markersOf, type RegionId, type WorldMarker } from './levels';

/** Every slot id (sites.test.ts checks this list against the documents' slot markers, both ways). */
export const SITE_IDS = [
  // Downtown Turfton: the courts in the L92 park (Founders' Green), the L92 mega block over its tunnel (the Double Pot),
  // the player's block of flats (Saucer Court), four town homes
  'basketball-court', 'skate-park', 'double-pot', 'saucer-court', 'home-01', 'home-02', 'home-03', 'home-04',
  // The old 1800 square: dealerships, the under-Skyway site, the rally start, a farm plot, building sites, homes
  'car-dealer', 'boat-dealer', 'skyway-under', 'rally-route', 'farm-plot',
  'construction-1', 'construction-2', 'construction-3',
  'home-05', 'home-06', 'home-07', 'home-08', 'home-09', 'home-10', 'home-11', 'home-12',
  // North band
  'ski-hill', 'ice-lake', 'toadstool-forest', 'wind-farm',
  // East band
  'dirt-track', 'campus', 'observatory-mound', 'runway-2', 'aircraft-dealer',
  // South band
  'ocean', 'beach', 'boardwalk', 'ferris-wheel', 'pirate-ship',
  // West band
  'vineyard', 'mansion', 'cult-camp', 'mole-entrance', 'golf-yard',
] as const;
export type SiteId = (typeof SITE_IDS)[number];

/**
 * What a site is for (informational; content epics may ignore it):
 * venue (a place with an activity), water (a lake or sea to carve), natural (scenery-only ground: forest, ridge, mound),
 * corridor (a route; the rect is its start paddock, anchors give the way), airfield, dealer (a shop that sells
 * vehicles), building, home, park, block (a city block), farm, society (an underground or fringe faction's place),
 * construction (a building site).
 */
export type SiteKind =
  | 'venue' | 'water' | 'natural' | 'corridor' | 'airfield' | 'dealer' | 'building' | 'home' | 'park' | 'block' | 'farm'
  | 'society' | 'construction';

/** A named point of a site, world coordinates. `yaw` (radians, 0 = facing +z) when the point has a facing. */
export interface SiteAnchor { readonly x: number; readonly z: number; readonly yaw?: number }

export interface Site {
  readonly id: SiteId;
  /** The place's name (E04's story bible), for maps and signs. Ids stay placeholders; labels follow the story. */
  readonly label: string;
  readonly kind: SiteKind;
  /** The region whose document holds the slot marker (the region at the centre). */
  readonly region: RegionId;
  /** Centre, world coordinates. */
  readonly x: number;
  readonly z: number;
  /** Half sizes of the axis-aligned rectangle along x and z. */
  readonly hw: number;
  readonly hd: number;
  /** The way the content faces (radians), 0 when the document gives none. Does not rotate the rectangle. */
  readonly yaw: number;
  /** The epic that fills it ('E08', 'E13', ...). */
  readonly epic: string;
  /** True: the ground is levelled and the macro relief keeps off. False: natural ground (hills, slopes) kept. */
  readonly flat: boolean;
  /** A site that lies inside another (a home in the apartment block, the pirate ship in the ocean). */
  readonly parent?: SiteId;
  /** True for a site that is allowed to cover a road (the Double Pot straddles x = 120 over its tunnel). */
  readonly overRoad?: boolean;
  /** Named points: doors, gates, starts and finishes. World coordinates. */
  readonly anchors: Readonly<Record<string, SiteAnchor>>;
}

/** An axis-aligned ground rectangle. */
export interface SiteRect { readonly minX: number; readonly maxX: number; readonly minZ: number; readonly maxZ: number }

function siteOf(m: WorldMarker): Site {
  const d = (m.data ?? {}) as Record<string, unknown>;
  const anchors: Record<string, SiteAnchor> = {};
  for (const [name, a] of Object.entries((d.anchors ?? {}) as Record<string, { dx: number; dz: number; yaw?: number }>)) {
    anchors[name] = a.yaw === undefined ? { x: m.x + a.dx, z: m.z + a.dz } : { x: m.x + a.dx, z: m.z + a.dz, yaw: a.yaw };
  }
  if (!(SITE_IDS as readonly string[]).includes(m.id)) throw new Error(`slot "${m.id}" is not in SITE_IDS (src/sites.ts)`);
  return {
    id: m.id as SiteId, label: typeof d.label === 'string' ? d.label : m.id, kind: d.kind as SiteKind, region: m.region, x: m.x, z: m.z,
    hw: markerNum(m, 'hw'), hd: markerNum(m, 'hd'), yaw: typeof d.yaw === 'number' ? d.yaw : 0,
    epic: String(d.epic), flat: d.flat === true,
    ...(typeof d.parent === 'string' ? { parent: d.parent as SiteId } : {}),
    ...(d.overRoad === true ? { overRoad: true } : {}),
    anchors,
  };
}

/** Every reserved site, world coordinates, in document order (regions in build order). */
export const SITES: readonly Site[] = markersOf('slot').map(siteOf);
const BY_ID = new Map<string, Site>(SITES.map((s) => [s.id, s]));

/** The site with this id. Throws when the documents have no such slot. */
export function siteById(id: SiteId): Site {
  const s = BY_ID.get(id);
  if (!s) throw new Error(`no slot "${id}" in the region documents`);
  return s;
}

/** Every site an epic fills ('E13'), in document order. */
export function sitesByEpic(epic: string): Site[] {
  return SITES.filter((s) => s.epic === epic);
}

/** A site's rectangle, world coordinates. */
export function siteRect(id: SiteId): SiteRect {
  const s = siteById(id);
  return { minX: s.x - s.hw, maxX: s.x + s.hw, minZ: s.z - s.hd, maxZ: s.z + s.hd };
}

/** A named anchor of a site, world coordinates. Throws when the site has no such anchor. */
export function anchorOf(id: SiteId, name: string): SiteAnchor {
  const a = siteById(id).anchors[name];
  if (!a) throw new Error(`slot "${id}" has no anchor "${name}"`);
  return a;
}

/** True when (x, z) lies inside the site's rectangle grown by `margin`. */
export function inSite(id: SiteId, x: number, z: number, margin = 0): boolean {
  const r = siteRect(id);
  return x >= r.minX - margin && x <= r.maxX + margin && z >= r.minZ - margin && z <= r.maxZ + margin;
}

/** A reserved rectangle and where it came from ('reserve/...' marker id, or the slot id). */
export interface ReservedRect extends SiteRect { readonly id: string; readonly source: 'reserve' | 'slot'; readonly flat: boolean }

/**
 * Every reserved rectangle in the world: the `reserve` markers (always flat) then the slots, world coordinates.
 * `flatOnly` leaves out the slots that keep their natural ground (terrain levelling and the macro mask read it so).
 */
export function reservedRects(opts: { flatOnly?: boolean } = {}): ReservedRect[] {
  const out: ReservedRect[] = [];
  for (const m of markersOf('reserve')) {
    const hw = markerNum(m, 'hw'), hd = markerNum(m, 'hd');
    out.push({ id: m.id, source: 'reserve', flat: true, minX: m.x - hw, maxX: m.x + hw, minZ: m.z - hd, maxZ: m.z + hd });
  }
  for (const s of SITES) {
    if (opts.flatOnly && !s.flat) continue;
    out.push({ id: s.id, source: 'slot', flat: s.flat, minX: s.x - s.hw, maxX: s.x + s.hw, minZ: s.z - s.hd, maxZ: s.z + s.hd });
  }
  return out;
}

// ---- Off the map --------------------------------------------------------------------------------------------------
/** Half size of the playable map (the same number as config.ts WORLD_HALF; the map / minimap extent). */
export const MAP_EXTENT = LAYOUT.worldHalf;

/**
 * Coordinates kept clear outside the map, for rooms that are not part of the world. Interiors (E05) take x >= 5000;
 * anything new off the map picks a free spot here and adds a line.
 */
export const OFF_MAP: readonly { readonly id: string; readonly x: number; readonly z: number; readonly what: string }[] = [
  { id: 'cutscene-rooms', x: 3000, z: 3000, what: 'cutscene rooms (cutscene/rooms.ts ROOM_ORIGIN)' },
  { id: 'glaze-stage', x: 4000, z: 0, what: "Pay 'n' Glaze paint stage (glazeStage.ts STAGE_CENTRE)" },
  { id: 'gun-back-room', x: 4000, z: 900, what: 'gun store back-room stage (gunStore.ts STAGE)' },
  { id: 'interiors', x: 5000, z: 0, what: 'interiors (E05): every x >= INTERIOR_MIN_X is interior space' },
];
/** Every point with x at or past this is interior space (E05), never part of the world. */
export const INTERIOR_MIN_X = 5000;

/** True when (x, z) is outside the playable map (an off-map room, a stage or an interior). */
export function isOffMap(x: number, z: number): boolean {
  return Math.abs(x) > MAP_EXTENT || Math.abs(z) > MAP_EXTENT;
}
