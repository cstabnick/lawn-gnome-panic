// E31 living world: the shared constants (docs/roadmaps/gta-batch-3/E31/). Pure data, no three.js, no DOM.
// Places are world metres (+x east, +z south, north is -z).
import type { VehicleKind } from '../types';

/** Achievement ids (packages/achievements catalog.ts, rewards in packages/prefabs gta-living-gear.ts). */
export const LIVING_ACH = {
  /** Tick every entry of the Unmown checklist. */
  checklist: 'gta-unmown-checklist',
  /** Walk the Reedmere boardwalk from one end to the other on foot. */
  dryFeet: 'gta-dry-feet',
  /** Stand inside all three Unmown bird hides (target 3). */
  hides: 'gta-hide-and-seek',
  /** Spot 5 of the E31 bird species (target 5). */
  freshFeathers: 'gta-fresh-feathers',
  /** Visit the three hamlets and the High Tarn (target 4). */
  offBeaten: 'gta-off-the-beaten-lane',
  /** Drive each of the three E31 vehicles (target 3). */
  weekendAway: 'gta-weekend-away',
} as const;

/** The bird species E31 adds to birding/species.ts (ids). */
export const NEW_BIRD_IDS = [
  'reedmere-bittern', 'marsh-harrier', 'meadow-cuckoo', 'thymes-kingfisher', 'pond-mallard', 'shore-cormorant',
  'snowcap-eagle', 'tarn-diver',
] as const;

/** The civilian vehicles E31 adds. */
export const NEW_RIDES: readonly VehicleKind[] = ['ranger-buggy', 'shell-camper', 'cone-van'];

/** A named place: centre and the radius that counts as "visited". */
export interface LivingPlace { id: string; name: string; x: number; z: number; r: number }

/**
 * The three hamlets in the outer bands and the High Tarn. Each hamlet's centre is its little green / square; its
 * houses and dressing stay within about 70 m of it and off the road (a band road runs past each).
 * - Espalier End (Trellisdown): north of `wicket-north-approach` (the road along z -500 from x -950 to -1400).
 * - Mittenholt (Snowcap Rise): north of `north-band-east` (the road along z ~-1320 from x 60 to 1060).
 * - Dunelow (the Saltbucket hinterland): on `south-band` (the road along z ~1000 from x 0 to -950).
 */
export const HAMLETS: readonly LivingPlace[] = [
  { id: 'espalier-end', name: 'Espalier End', x: -1080, z: -420, r: 75 },
  { id: 'mittenholt', name: 'Mittenholt', x: 550, z: -1375, r: 75 },
  { id: 'dunelow', name: 'Dunelow', x: -560, z: 965, r: 75 },
];
/** The High Tarn (site snowcap-high-tarn; water/high-tarn covers x 910..1040, z -1650..-1570). */
export const HIGH_TARN: LivingPlace = { id: 'high-tarn', name: 'the High Tarn', x: 1000, z: -1600, r: 120 };
/** Everything Off the Beaten Lane counts. */
export const OFF_BEATEN_PLACES: readonly LivingPlace[] = [...HAMLETS, HIGH_TARN];

// ---- The Unmown (sites from E28, src/sites.ts) ----------------------------------------------------------------------

/** Ranger station site: centre (-1560, -1150), 50 x 40 (x -1585..-1535, z -1170..-1130), flat. Door anchor (-1540, -1130)
 *  faces the Unmown Lane (+z side); the trailhead anchor (-1560, -1172) is on the -z side where trail/unmown-loop starts. */
export const STATION = { x: -1560, z: -1150, hw: 25, hd: 20, door: { x: -1540, z: -1130 }, trailhead: { x: -1560, z: -1172 } } as const;

/** The three bird hides (12 x 12 sites). `yaw` is where the viewing slot faces (three.js rotation.y, 0 = +z/south). */
export const UNMOWN_HIDES = [
  { id: 'unmown-hide-1', name: 'Reedmere Hide', x: -1050, z: -1550, yaw: 0 },           // looks south over the marsh
  { id: 'unmown-hide-2', name: 'Meadow Hide', x: -560, z: -1490, yaw: Math.PI },        // looks north over the Long Meadow
  { id: 'unmown-hide-3', name: 'Wood Hide', x: -1700, z: -1330, yaw: Math.PI },         // looks north into Oldroot Wood
] as const;
/** Standing within this many metres of a hide's centre (inside, or at its back door) counts as a visit. */
export const HIDE_INSIDE_R = 4.5;

/**
 * Reedmere: the marsh (water/reedmere: still water x -1260..-1040, z -1705..-1605, about 0.7 m deep) and the raised
 * boardwalk across it. The boardwalk leaves trail/reedmere-boardwalk at BOARDWALK[0] (on the north shore), crosses the
 * water in straight axis-aligned legs (each leg is one walkable rooftop rectangle) and ends on the viewing platform
 * (PLATFORM). Deck top is DECK_Y above the water surface.
 */
export const BOARDWALK: readonly (readonly [number, number])[] = [
  [-1100, -1560], [-1100, -1625], [-1150, -1625], [-1150, -1695],
];
export const PLATFORM = { x: -1150, z: -1699, w: 8, d: 6 } as const;
export const BOARDWALK_WIDTH = 2;
export const DECK_Y = 0.6;

/** The one plant on the checklist: the Last Dandelion, alone in a ring of stones in the Long Meadow. */
export const LAST_DANDELION = { x: -600, z: -1660 } as const;
