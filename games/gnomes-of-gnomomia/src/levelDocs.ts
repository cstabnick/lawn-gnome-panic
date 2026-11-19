// STUB: a worker fills this in (docs/roadmaps/level-format.md, issue A2). Keep the exported names and signatures.
// A zone as a level document: the shared layers (stamps, paths, props) plus Gnomomia's own block (`data`).
import type { LevelDoc } from '@lawn/level';
import type { Deck, HouseDef, Region, ZoneDef, ZoneExit, ZoneId } from './config';

/** The ZoneDef fields that are not a shared layer. Zone-local coordinates, like the old zone files. Colours are '#rrggbb'. */
export interface ZoneData {
  levels: [number, number];
  half: number;
  indoor?: boolean;
  spawn: { x: number; z: number };
  shrine: { x: number; z: number; name: string };
  regions: Region[];
  lakes: { x: number; z: number; r: number }[];
  houses: HouseDef[];
  decks?: Deck[];
  walls?: { x1: number; z1: number; x2: number; z2: number }[];
  theme: { ground: string; groundAlt: string; flora: ZoneDef['theme']['flora']; floraDensity: number; fog: string; sky: string; hilliness: number };
  exits: ZoneExit[];
}

/** The level document of every authored zone (the 8 files in src/data/levels/<id>.level.json). */
export const ZONE_DOCS: Partial<Record<ZoneId, LevelDoc<ZoneData>>> = {};

/** A document as a ZoneDef, zone-local (no origin yet): what src/data/zones/<id>.ts used to export. */
export function docToZone(_doc: LevelDoc<ZoneData>): ZoneDef {
  throw new Error('levelDocs.ts is not implemented yet');
}

/** A zone in WORLD coordinates (def.origin set, as content.ts leaves it) back to its document: subtracts the origin from
 * every position (and from each exit's arriveX/arriveZ, using the destination zone's origin), drops what content.ts
 * generates (house door exits, default house ids), and writes colours as '#rrggbb'. */
export function worldZoneToDoc(_def: ZoneDef): LevelDoc<ZoneData> {
  throw new Error('levelDocs.ts is not implemented yet');
}
