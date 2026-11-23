// Each region's look (terrain pass, regional motifs): the data is src/data/regionThemes.json; this file types it and
// answers "which theme applies here", blending neighbouring themes near region borders so the change is soft.
// Pure: no three.js, no DOM.
import themesJson from './data/regionThemes.json';
import { REGION_IDS, regionAt, type RegionId } from './levels';
import { borderDistAt } from './landforms';

/** A palette name from @lawn/prefabs PALETTE, or a 0xRRGGBB number. */
export type ThemeColour = string | number;

export interface RegionTheme {
  name: string;
  /** One line: the region's motif (also in its lore entry). */
  motif: string;
  /** Colours for tinting houses (walls = tint, roofs = trim) and flowers. */
  palette: { walls: ThemeColour[]; roofs: ThemeColour[]; flowers: ThemeColour[] };
  /** What lines the country highways: the hedge, the wall, the fence, or nothing. */
  roadside: 'hedge' | 'wall' | 'fence' | 'none';
  hedge: string | null;
  wall: string | null;
  /** Yard and field fence (also the roadside piece when roadside is 'fence'). */
  fence: string;
  /** Plants for yards, verges and understorey. */
  planting: string[];
  /** Garden and yard border piece. */
  border: string;
  /** Driveway piece. */
  paving: string;
  /** Sparse props that say "this region". */
  signature: string[];
  /** House prefabs (empty: no houses here). */
  houses: string[];
  /** Small yard dressing beside a house. */
  yard: string[];
  /** Tree prefabs. */
  trees: string[];
}

interface ThemesDoc {
  format: 'gta-region-themes';
  version: number;
  borderBlend: number;
  sizes: Record<string, number>;
  themes: Record<RegionId, RegionTheme>;
}

const DOC = themesJson as unknown as ThemesDoc;

/** Every region's theme. */
export const REGION_THEMES: Readonly<Record<RegionId, RegionTheme>> = DOC.themes;

for (const id of REGION_IDS) if (!REGION_THEMES[id]) throw new Error(`regionThemes.json has no theme for ${id}`);

/**
 * The longest side (metres) to place a prefab at, for prefabs built at a reduced scale (log-cabin, barn, ...), or null
 * when the prefab is life-size (place it at scale 1).
 */
export function themeSize(id: string): number | null {
  return DOC.sizes[id] ?? null;
}

/** Metres over which a region's theme gives way to its neighbour's at a border. */
export const THEME_BLEND = DOC.borderBlend;

/**
 * The theme at (x, z). `u` is a uniform random number in [0, 1) from the caller's own seeded generator: within
 * THEME_BLEND metres of an inner region border the neighbour's theme is returned with a chance that rises to 50 % on
 * the border itself, so motifs mingle across it instead of switching on a line.
 */
export function themeAt(x: number, z: number, u = 1): RegionTheme {
  const here = regionAt(x, z);
  const d = borderDistAt(x, z);
  if (d < THEME_BLEND && u < 0.5 * (1 - d / THEME_BLEND)) {
    const r = d + 20;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const other = regionAt(x + Math.cos(a) * r, z + Math.sin(a) * r);
      if (other !== here) return REGION_THEMES[other];
    }
  }
  return REGION_THEMES[here];
}

/** The region id whose theme themeAt returned (for tests and debugging). */
export function themeRegion(t: RegionTheme): RegionId {
  return REGION_IDS.find((id) => REGION_THEMES[id] === t)!;
}
