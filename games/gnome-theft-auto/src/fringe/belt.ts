// The fringe belt round Turfton (docs/roadmaps/gta-parks-and-fringe.md, lore: docs/lore/entries/apocrypha/turfton-fringe.md).
// Pure: no three.js, no DOM. Shared by fringe/ground.ts and fringe/lots.ts.
import { CITY_HALF } from '../config';
import { regionAt, type RegionId } from '../levels';

/** The belt starts this far from the city centre (Chebyshev: max(|x|, |z|)) and ends at OUTER. */
export const FRINGE = {
  inner: CITY_HALF + 9,
  outer: CITY_HALF + 185,
  /** Lot grid pitch (m) and how far a lot centre is jittered inside its cell. */
  lotPitch: 26, lotJitter: 6,
  /** Budgets. */
  maxLots: 140, maxDress: 2600, maxPlants: 1400,
  /** Bands of depth d = max(|x|, |z|) - CITY_HALF: edge works, scrub lots, field edge. */
  worksTo: 60, scrubTo: 120,
} as const;

/** Depth into the belt: max(|x|, |z|) - CITY_HALF (negative inside the city). */
export function beltDepth(x: number, z: number): number {
  return Math.max(Math.abs(x), Math.abs(z)) - CITY_HALF;
}

/** 1 at the city edge, falling to 0 at the outer edge (a lot / clutter probability multiplier). */
export function beltDensity(x: number, z: number): number {
  const d = beltDepth(x, z);
  if (d < FRINGE.inner - CITY_HALF || d > FRINGE.outer - CITY_HALF) return 0;
  const t = (d - (FRINGE.inner - CITY_HALF)) / (FRINGE.outer - FRINGE.inner);
  return Math.pow(1 - t, 1.4);
}

export type Band = 'works' | 'scrub' | 'field';
export function bandAt(x: number, z: number): Band {
  const d = beltDepth(x, z);
  return d < FRINGE.worksTo ? 'works' : d < FRINGE.scrubTo ? 'scrub' : 'field';
}

/** The four named edges (lore): which side of the city a point is on. */
export type EdgeId = 'scrapside' | 'stumpend' | 'chillyard' | 'lockside';
export const EDGE_NAMES: Record<EdgeId, string> = {
  scrapside: 'Scrapside', stumpend: 'Stumpend', chillyard: 'Chillyard', lockside: 'Lockside',
};
export function edgeAt(x: number, z: number): EdgeId {
  if (Math.abs(x) >= Math.abs(z)) return x > 0 ? 'scrapside' : 'stumpend';
  return z < 0 ? 'chillyard' : 'lockside';
}
/** Label spots for the map (one per edge, in the middle of its belt). */
export const EDGE_LABELS: Record<EdgeId, { x: number; z: number }> = {
  scrapside: { x: 290, z: 110 }, stumpend: { x: -290, z: -120 }, chillyard: { x: -110, z: -290 }, lockside: { x: 130, z: 300 },
};

/** A dirt track (fringe/ground.ts planTracks): its centre line from the road edge outwards, and its width. */
export interface Track {
  points: [number, number][];
  width: number;
  /** Region at its far end (lots along it take that region's look). */
  region: RegionId;
}

/**
 * The rough look per neighbouring region: what a fringe lot is built from there. Ids are @lawn/prefabs (existing ones
 * and this workstream's kit). `ground` is the yard patch kind; `track` the dirt track patch kind.
 */
export interface FringeTheme {
  ground: 'dirt' | 'gravel' | 'sand' | 'mud' | 'snow';
  track: 'dirt' | 'gravel' | 'sand' | 'mud' | 'snow';
  fences: string[];
  /** Buildings by band (weighted by repetition). */
  works: string[];
  scrub: string[];
  field: string[];
  clutter: string[];
  /** Long grass and weeds (mowable kinds, flora/kinds.ts) and other ground plants. */
  weeds: string[];
  trees: string[];
  hedge: string | null;
}

export const FRINGE_THEMES: Record<RegionId, FringeTheme> = {
  turfton: {
    ground: 'gravel', track: 'gravel', fences: ['chain-link-fence', 'corrugated-fence'],
    works: ['rough-workshop', 'lockup-row', 'rough-warehouse', 'portacabin'], scrub: ['caravan', 'half-built-house', 'lean-to-shed'],
    field: ['lean-to-shed', 'polytunnel'], clutter: ['oil-drum', 'pallet-stack', 'tyre-pile', 'crate'],
    weeds: ['ornamental-grass', 'wildflower-patch'], trees: ['broadleaf-tree'], hedge: 'hedgerow',
  },
  'dust-flats': {
    ground: 'sand', track: 'sand', fences: ['corrugated-fence', 'chain-link-fence', 'adobe-wall'],
    works: ['rough-workshop', 'lockup-row', 'shipping-container', 'rough-warehouse', 'portacabin'],
    scrub: ['trailer-home', 'caravan', 'adobe-hut', 'half-built-house', 'water-tower'],
    field: ['adobe-hut', 'lean-to-shed', 'water-tower'], clutter: ['tyre-pile', 'scrap-car', 'oil-drum', 'scrap-heap', 'barrel-cactus'],
    weeds: ['barrel-cactus', 'ornamental-grass'], trees: ['palm-tree'], hedge: null,
  },
  'mossy-wood': {
    ground: 'dirt', track: 'dirt', fences: ['split-rail-fence', 'corrugated-fence'],
    works: ['rough-workshop', 'lean-to-shed', 'lockup-row', 'nissen-hut'], scrub: ['lean-to-shed', 'caravan', 'half-built-house', 'log-cabin'],
    field: ['log-cabin', 'lean-to-shed'], clutter: ['woodpile', 'woodpile', 'fallen-log', 'tree-stump', 'pallet-stack'],
    weeds: ['fern-clump', 'ornamental-grass'], trees: ['cone-pine', 'broadleaf-tree'], hedge: null,
  },
  'frostbite-fells': {
    ground: 'gravel', track: 'snow', fences: ['snowcap-stone-wall', 'chain-link-fence'],
    works: ['portacabin', 'nissen-hut', 'rough-workshop', 'lockup-row'], scrub: ['nissen-hut', 'half-built-house', 'water-tower', 'caravan'],
    field: ['snow-cottage', 'lean-to-shed'], clutter: ['oil-drum', 'stone-cairn', 'pallet-stack', 'woodpile'],
    weeds: ['ornamental-grass'], trees: ['snow-pine'], hedge: null,
  },
  'cloverfield-farms': {
    ground: 'mud', track: 'dirt', fences: ['wooden-fence', 'chain-link-fence', 'dry-stone-wall'],
    works: ['rough-workshop', 'lockup-row', 'nissen-hut'], scrub: ['caravan', 'polytunnel', 'lean-to-shed', 'half-built-house'],
    field: ['barn', 'polytunnel', 'haystack', 'silo'], clutter: ['hay-bale', 'pallet-stack', 'tyre-pile', 'wooden-cart'],
    weeds: ['wheat-patch', 'wildflower-patch', 'ornamental-grass'], trees: ['broadleaf-tree'], hedge: 'hedgerow',
  },
  'loch-moss': {
    ground: 'mud', track: 'dirt', fences: ['wattle-fence'],
    works: ['lean-to-shed'], scrub: ['caravan', 'lean-to-shed'], field: ['lean-to-shed'],
    clutter: ['woodpile', 'crate'], weeds: ['reed-bed', 'fern-clump'], trees: ['cone-pine'], hedge: null,
  },
  'tallgrass-commons': {
    ground: 'dirt', track: 'dirt', fences: ['wattle-fence'],
    works: ['lean-to-shed'], scrub: ['caravan', 'polytunnel'], field: ['polytunnel', 'lean-to-shed'],
    clutter: ['bee-skep', 'hay-bale'], weeds: ['wildflower-patch', 'ornamental-grass'], trees: ['broadleaf-tree'], hedge: null,
  },
  // Batch 3 bands (E01): no fringe belt reaches them yet; these are the looks a later fringe pass would use.
  'north-highlands': {
    ground: 'gravel', track: 'dirt', fences: ['dry-stone-wall'],
    works: ['nissen-hut', 'lean-to-shed'], scrub: ['lean-to-shed', 'caravan'], field: ['lean-to-shed'],
    clutter: ['stone-cairn', 'woodpile'], weeds: ['ornamental-grass'], trees: ['cone-pine'], hedge: null,
  },
  'south-shore': {
    ground: 'sand', track: 'sand', fences: ['wooden-fence'],
    works: ['lean-to-shed', 'shipping-container'], scrub: ['caravan', 'lean-to-shed'], field: ['lean-to-shed'],
    clutter: ['crate', 'oil-drum'], weeds: ['ornamental-grass'], trees: ['palm-tree'], hedge: null,
  },
  'east-campus': {
    ground: 'gravel', track: 'gravel', fences: ['chain-link-fence', 'wooden-fence'],
    works: ['portacabin', 'rough-workshop'], scrub: ['portacabin', 'lean-to-shed'], field: ['polytunnel'],
    clutter: ['pallet-stack', 'crate'], weeds: ['ornamental-grass'], trees: ['broadleaf-tree'], hedge: 'hedgerow',
  },
  'west-estates': {
    ground: 'gravel', track: 'gravel', fences: ['wooden-fence', 'dry-stone-wall'],
    works: ['lean-to-shed'], scrub: ['lean-to-shed'], field: ['polytunnel', 'lean-to-shed'],
    clutter: ['hay-bale', 'crate'], weeds: ['wildflower-patch'], trees: ['broadleaf-tree'], hedge: 'hedgerow',
  },
};

/** The fringe look at (x, z): the region there (the city counts as its nearest neighbour's edge). */
export function fringeRegion(x: number, z: number): RegionId {
  return regionAt(x, z);
}
