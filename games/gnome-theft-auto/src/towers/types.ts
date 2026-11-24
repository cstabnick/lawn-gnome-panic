// Turfton tower styling: the shared types. world.ts decides WHERE each downtown tower stands and how big its collider
// is (TowerSpec); src/towers/ decides only how it LOOKS (TowerStyle). Nothing here may move or resize a footprint: the
// collider is always the box x ± w/2, z ± d/2, 0..h, and every visible mass stays inside it (crowns may rise above h).

/** One downtown tower as world.ts placed it. */
export interface TowerSpec {
  /** Centre and footprint. The collider is exactly x ± w/2, z ± d/2, height h. */
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  /** Centre of the city block it stands in, its slot in that block (0 west, 1 east) and how many towers the block has. */
  blockX: number;
  blockZ: number;
  slot: number;
  count: number;
  /** The old random rolls, kept as style seeds: palette 0-3, stepped, roof roll 0..1. */
  pal: number;
  stepped: boolean;
  roofRoll: number;
  /** True when the intro flyover lowered it: nothing may rise more than 2 m above h (no spire, no mast). */
  capped: boolean;
}

/** Overall shape. Every mass stays inside the footprint and under h. */
export type Silhouette =
  | 'box'        // one block, maybe with a cornice
  | 'setback'    // 2-3 stacked blocks, each narrower (wedding cake)
  | 'taper'      // a block whose top third steps in on all sides in 3 thin stages
  | 'twin'       // a shared podium and two slim towers with a gap between them
  | 'lean'       // stacked slices, each shifted a little to one side (the leaning one)
  | 'ziggurat'   // 5 equal steps, a stepped pyramid
  | 'drum'       // a round tower (cylinder) on a square podium
  | 'hblock'     // an H in plan: two wings and a lower bridge
  | 'slab';      // a thin slab along the long side with a service core behind

export type Crown =
  | 'flat'        // roof slab only
  | 'spire'       // a tall needle with a red light
  | 'water-tank'  // a timber water tank on legs
  | 'helipad'     // a round pad with an H and corner lights
  | 'garden'      // a roof garden: planters, little trees, a pergola
  | 'antenna-farm'// several masts and dishes
  | 'sail'        // a curved sail fin
  | 'gnome-hat'   // a giant red gnome-hat finial
  | 'billboard'   // left bare: a rooftop billboard (brands.ts BILLBOARD_SPOTS) stands there already
  | 'pyramid'     // a pointed glass pyramid cap
  | 'clock'       // a clock box with four faces
  | 'crown-ring'; // a ring of gold fins (art deco)

export type Weathering = 'none' | 'stains' | 'scaffold';

/** How one tower looks. Colours are 0xRRGGBB. */
export interface TowerStyle {
  silhouette: Silhouette;
  /** Facade tile (FACADE ids in facadeAtlas.ts) for the body. */
  facade: number;
  /** Multiplies the facade texture (keep near white, 0xc0c0c0..0xffffff, or the windows go muddy). */
  facadeTint: number;
  /** Roof slabs, cornices, ledges, ribs, the lobby frame. */
  trim: number;
  /** One signature horizontal colour band (0 = none). */
  band: number;
  /** Vertical ribs or pilasters on the faces. */
  ribs: boolean;
  /** Balcony slabs every few floors on the two long faces. */
  balconies: boolean;
  crown: Crown;
  /** Crown accent colour (fins, hat, sail). */
  accent: number;
  /** Ground floor: shopfront tile with awnings, or a tall glass lobby with a canopy. */
  lobby: 'shops' | 'lobby';
  /** Awning / canopy colour. */
  awning: number;
  weathering: Weathering;
  /** Sign tile (SIGN ids in signAtlas.ts) on the crown or the facade, or -1 for none. */
  sign: number;
  /** Mural tile (SIGN ids) painted on the blank side, or -1. */
  mural: number;
}

/** A named landmark tower: identity, lore and its hand-made style. */
export interface LandmarkTower {
  /** Lore entry id (docs/lore/entries/apocrypha/<id>.md) and map label id. */
  id: string;
  name: string;
  owner: string;
  /** Which spec: the block centre and slot. */
  blockX: number;
  blockZ: number;
  slot: number;
  /** Show a label on the big map (mapPois). */
  poi: boolean;
  style: TowerStyle;
}

/** Geometry for the whole downtown, sorted by material. One merged mesh per list. */
export interface TowerGeoms {
  /** Atlas facade: BufferGeometry with position, normal, uv (in tile repeats), color, aTile. */
  facade: import('three').BufferGeometry[];
  /** Painted solids (vertex colours): slabs, ribs, ledges, awnings, crowns. */
  trim: import('three').BufferGeometry[];
  /** Shiny solids (vertex colours, metal): spires, fins, glass caps, sails. */
  metal: import('three').BufferGeometry[];
  /** Always-lit bits (vertex colours, unlit): aircraft lights, crown lights, neon strips. */
  glow: import('three').BufferGeometry[];
  /** Sign and mural quads: position, normal, uv into the sign atlas. */
  sign: import('three').BufferGeometry[];
}

/**
 * One solid piece of a tower's silhouette (silhouettes.ts makes them, kit.ts turns them into facade walls).
 * A box spans x ± w/2, z ± d/2, y0..y1. A cylinder ('cyl') has diameter w (d is ignored, set it equal to w).
 * Rules: every mass stays inside the tower's footprint and under spec.h; a mass standing on another starts 0.1 below
 * the top of the one under it; two masses side by side overlap by at least 0.2 (no shared faces).
 */
export interface Mass {
  shape: 'box' | 'cyl';
  x: number;
  z: number;
  w: number;
  d: number;
  y0: number;
  y1: number;
  /** Facade tile for this mass instead of the style's (a podium in another material). */
  facade?: number;
}
