// The elevated roads of Turfton (docs/roadmaps/gta-highways.md, extended in gta-skyway-traffic-gps.md): plain data, no
// three.js, no DOM.
//
// A skyway is a deck on a centre-line polyline. Each control point says how high the deck top stands above the land
// (terrain.ts heightAt) right there; between control points the deck top runs in a straight grade. A control point with
// h 0 is a ramp foot: the deck meets the ground there and a car drives on. Where the deck stands less than
// SKYWAY.solidBelow above the land it is a solid embankment (walls down to the ground); higher up it is a viaduct on
// column bents, and anything shorter than the gap drives underneath.
//
// Junctions: a point with `on` sits on an earlier skyway's deck, at its height. A branch starts with two such points
// (the parent's centre line, then just past its edge), so the two decks are level where they overlap; deck.ts lets a body
// cross from one to the other there (no rail), and mesh.ts draws the branch from the parent's edge on.
//
// Rules the deck test (highways/deck.test.ts) checks:
//   - every solid (low) stretch lies on a leg along x or along z, so its side walls are tight axis-aligned boxes;
//   - nothing in world.boxes stands inside a solid stretch, or pokes up into a viaduct's underside;
//   - every crack opens over clear land (no road, column or building under the drop).

export interface SkywayPoint {
  readonly x: number;
  readonly z: number;
  /** Deck top above the land at this point, metres. 0 = a ramp foot on the ground. Ignored when `on` is set. */
  readonly h: number;
  /**
   * A junction: this point sits on the deck of that (earlier-listed) skyway, and its deck top is that skyway's top at
   * the nearest centre-line point.
   */
  readonly on?: string;
}

/**
 * What a deck is for. 'road': in the road graph (traffic, GPS, police, ambulance; highways/roads.ts). 'stunt': the
 * Unfinished Span. 'site': a construction-site plank ramp or work platform (a player-only shortcut: never in the road
 * graph, no map line).
 */
export type SkywayKind = 'road' | 'stunt' | 'site';

/** A gap in one rail (a crack): nothing holds a body on the deck there, so it can drive or walk off. Viaducts only. */
export interface SkywayCrack {
  /** Centre-line distance from the skyway's start to the middle of the gap. */
  readonly along: number;
  /** +1 = the right rail (right of the travel direction), -1 = the left. */
  readonly side: 1 | -1;
  /** Gap length, metres. */
  readonly length: number;
}

export interface SkywayDef {
  readonly id: string;
  /** Shown on the map and in toasts. */
  readonly name: string;
  /** Centre line, start to end. At least two points. */
  readonly points: readonly SkywayPoint[];
  /** Deck width between the rails, metres. */
  readonly width: number;
  /** True: the deck stops in mid-air at its last point (a stunt span, no ramp down). */
  readonly openEnd?: boolean;
  /** Default 'road'. */
  readonly kind?: SkywayKind;
  /** Rail gaps you can drop off through. */
  readonly cracks?: readonly SkywayCrack[];
}

/** A construction site beside a deck: its plank ramps (site-kind skyway ids) and the yard its dressing stays inside. */
export interface SkywaySite {
  readonly id: string;
  readonly name: string;
  /** Site-kind skyway ids that belong to this site (a ramp down from a deck, a work platform). */
  readonly ramps: readonly string[];
  /** Axis-aligned ground rectangle for the dressing (prefabs). Off roads; dressing also keeps off every deck footprint. */
  readonly yard: { readonly minX: number; readonly maxX: number; readonly minZ: number; readonly maxZ: number };
  /** Where the site's map badge and sign stand. */
  readonly x: number;
  readonly z: number;
}

/** Shared skyway tuning. */
export const SKYWAY = {
  /** A body's ground may step up onto a deck this far above it (groundAt, terrain.ts). */
  step: 0.6,
  /** Rail height above the deck top. */
  railHeight: 0.9,
  /** Deck slab thickness: a viaduct's underside is this far below its top. */
  slab: 1,
  /** Below this deck height above the land the deck is a solid embankment; at or above it, a viaduct. */
  solidBelow: 4,
  /** Column bents on a viaduct, at most this far apart along the centre line. */
  bentSpacing: 24,
  /** Column cross-section (square), metres. Columns stand just outside the rails. */
  columnSize: 1.2,
  /** Sample spacing along the centre line for meshes, walls and the map. */
  sample: 4,
  /** How tall a ground body counts as when it meets the side of a deck (wall test). */
  bodyHeight: 1.8,
} as const;

/** The kind of a skyway ('road' when not set). */
export function kindOf(def: SkywayDef): SkywayKind {
  return def.kind ?? 'road';
}

/**
 * The Turfton Skyway: up from the west highway just outside Turfton, across the whole city above the z = -60 street
 * (its columns stand on the pavements, mid-block), over Ring Road North-East and the airfield spur, and down onto the
 * east highway in the Dust Flats. The East Beltway ("easy side" read as east side): a partial beltway east of the city
 * along x = 255, branching off the Skyway at a level junction; north it comes down beside Ring Road North-East, south
 * it crosses over the east highway and comes down beside Ring Road South-East. The Unfinished Span: a stub that climbs
 * north of the east highway and stops in mid-air above it (Local 404 walked off the job). Local 404's two work sites
 * hang plank ramps off the decks, with a work platform each, and a few rails are cracked open.
 */
export const SKYWAYS: readonly SkywayDef[] = [
  {
    id: 'turfton-skyway',
    name: 'Turfton Skyway',
    width: 11,
    points: [
      { x: -219, z: -30, h: 0 },
      // A level landing round the sharp corner, so the two climbing legs meet at one height (no step at the inside).
      { x: -219, z: -52, h: 3.4 },
      { x: -219, z: -60, h: 3.4 },
      { x: -211, z: -60, h: 3.4 },
      { x: -188, z: -60, h: 7.5 },
      { x: 360, z: -60, h: 7.5 },
      { x: 400, z: -46, h: 7.5 },
      { x: 480, z: -46, h: 7.5 },
      { x: 535, z: -46, h: 6 },
      { x: 550, z: -31, h: 4.6 },
      { x: 550, z: 20, h: 0 },
    ],
    cracks: [
      { along: 539, side: 1, length: 7 },
      { along: 656, side: 1, length: 6 },
    ],
  },
  {
    id: 'beltway-north',
    name: 'East Beltway',
    width: 11,
    points: [
      { x: 255, z: -60, h: 0, on: 'turfton-skyway' },
      { x: 255, z: -72, h: 0, on: 'turfton-skyway' },
      { x: 255, z: -120, h: 7.5 },
      { x: 255, z: -200, h: 0 },
    ],
    cracks: [{ along: 88, side: 1, length: 6 }],
  },
  {
    id: 'beltway-south',
    name: 'East Beltway',
    width: 11,
    points: [
      { x: 255, z: -60, h: 0, on: 'turfton-skyway' },
      { x: 255, z: -48, h: 0, on: 'turfton-skyway' },
      { x: 255, z: 40, h: 7.5 },
      { x: 290, z: 60, h: 6.5 },
      { x: 290, z: 130, h: 0 },
    ],
  },
  {
    id: 'unfinished-span',
    name: 'The Unfinished Span',
    width: 9,
    kind: 'stunt',
    openEnd: true,
    points: [
      { x: 610, z: -56, h: 0 },
      { x: 610, z: 4, h: 6.5 },
    ],
  },
  // ---- Local 404 work sites: plank ramps off the decks and work platforms (player-only shortcuts) -------------------
  {
    id: 'site-airfield-ramp',
    name: 'Local 404 Works ramp',
    width: 5,
    kind: 'site',
    points: [
      { x: 420, z: -46, h: 0, on: 'turfton-skyway' },
      { x: 420, z: -39, h: 0, on: 'turfton-skyway' },
      { x: 420, z: 15, h: 0 },
    ],
  },
  {
    id: 'site-airfield-platform',
    name: 'Local 404 Works platform',
    width: 5,
    kind: 'site',
    openEnd: true,
    points: [
      { x: 434, z: -18, h: 0 },
      { x: 434, z: 14, h: 3.2 },
    ],
  },
  {
    id: 'site-beltway-ramp',
    name: 'Beltway Works ramp',
    width: 5,
    kind: 'site',
    points: [
      { x: 255, z: -100, h: 0, on: 'beltway-north' },
      { x: 262, z: -100, h: 0, on: 'beltway-north' },
      { x: 310, z: -100, h: 0 },
    ],
  },
  {
    id: 'site-beltway-platform',
    name: 'Beltway Works platform',
    width: 5,
    kind: 'site',
    openEnd: true,
    points: [
      { x: 282, z: -150, h: 0 },
      { x: 282, z: -126, h: 3.5 },
    ],
  },
];

/** The construction sites (dressing in highways/sites.ts, a badge on the map). */
export const SKYWAY_SITES: readonly SkywaySite[] = [
  {
    id: 'airfield-works', name: 'Local 404 Works', ramps: ['site-airfield-ramp', 'site-airfield-platform'],
    yard: { minX: 425, maxX: 442, minZ: -24, maxZ: 18 }, x: 438, z: 0,
  },
  {
    id: 'beltway-works', name: 'Beltway Works', ramps: ['site-beltway-ramp', 'site-beltway-platform'],
    yard: { minX: 288, maxX: 312, minZ: -128, maxZ: -106 }, x: 300, z: -118,
  },
];
