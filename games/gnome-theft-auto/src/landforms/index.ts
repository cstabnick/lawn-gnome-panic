// The region landforms (Epic 5): the regional tilt plus each region's relief generator, faded to 0 at inner region
// borders and near rivers. terrain.ts adds tiltAt + reliefAt to the natural height (times TERRAIN amplitude), then
// applies the document stamps, flattens roads, trails and sites.
//
// Data moves, code stays: each region's generator lives in its own file here (src/landforms/<region>.ts) and its
// numbers and shapes live in that region's document, data.terrain ({ relief: { id, version, params }, features }).
//
// Pure: no three.js, no DOM.
import { TERRAIN } from '../config';
import { LAYOUT, REGION_DOCS, REGION_IDS, regionAt, type RegionId } from '../levels';
import { borderDistAt, riverDistAt } from './fields';
import { smoothstep } from './noise';
import type { GroundFacts, Landform, LandformInput, PaintKind } from './types';
import { landform as dustFlats } from './dustFlats';
import { landform as mossyWood } from './mossyWood';
import { landform as frostbiteFells } from './frostbiteFells';
import { landform as cloverfieldFarms } from './cloverfieldFarms';
import { landform as tallgrassCommons } from './tallgrassCommons';
import { landform as lochMoss } from './lochMoss';

export type { GroundFacts, Landform, LandformFeature, LandformInput, PaintKind } from './types';
export { PAINT_KINDS } from './types';
export { borderDistAt, riverDistAt, roadDistAt, waterDistAt } from './fields';

/** Each region's generator. Turfton has none (the city is flat). */
export const LANDFORMS: Partial<Record<RegionId, Landform>> = {
  'dust-flats': dustFlats,
  'mossy-wood': mossyWood,
  'frostbite-fells': frostbiteFells,
  'cloverfield-farms': cloverfieldFarms,
  'tallgrass-commons': tallgrassCommons,
  'loch-moss': lochMoss,
};

interface Entry { landform: Landform; input: LandformInput }

/** The generator and world-space input of every region whose document has data.terrain. Throws on a mismatch. */
function buildEntries(): Partial<Record<RegionId, Entry>> {
  const out: Partial<Record<RegionId, Entry>> = {};
  for (const id of REGION_IDS) {
    const t = REGION_DOCS[id].data.terrain;
    if (!t) continue;
    const lf = LANDFORMS[id];
    if (!lf) throw new Error(`${id}.level.json has data.terrain but src/landforms has no generator for ${id}`);
    if (lf.id !== t.relief.id || lf.version !== t.relief.version) {
      throw new Error(`${id}.level.json data.terrain.relief is ${t.relief.id} v${t.relief.version}, the code is ${lf.id} v${lf.version}`);
    }
    const o = LAYOUT.regions.find((r) => r.id === id)!.origin;
    out[id] = {
      landform: lf,
      input: {
        params: t.relief.params,
        features: (t.features ?? []).map((f) => ({ ...f, points: f.points.map(([x, z]): [number, number] => [x + o.x, z + o.z]) })),
      },
    };
  }
  return out;
}

const ENTRIES = buildEntries();

/** The world-space input a region's generator gets (its document's data.terrain), or null when it has none. */
export function landformInput(id: RegionId): LandformInput | null {
  return ENTRIES[id]?.input ?? null;
}

// ---- The regional tilt --------------------------------------------------------------------------------------------
/**
 * The garden falls gently from the house (north, -z) to the low corner (south, the Puddle Sea): TERRAIN.tiltPerM metres
 * per metre of z, level across Turfton's band (|z| <= tiltFlatHalf): about +2.5 m at the north edge and -2.5 m at the south
 * edge with the shipped numbers (before amplitude). Rivers that run west or east (the upper river, the canal) are level or rise
 * at most tiltPerM per metre northward; the water epic carves their beds.
 */
export function tiltAt(_x: number, z: number): number {
  const F = TERRAIN.tiltFlatHalf;
  if (z >= -F && z <= F) return 0;
  return -TERRAIN.tiltPerM * (z < 0 ? z + F : z - F);
}

/** How much of a region's relief shows at (x, z): 0 on inner borders and near rivers, 1 well inside. */
export function reliefMaskAt(x: number, z: number): number {
  const b = smoothstep(0, TERRAIN.reliefBorderFade, borderDistAt(x, z));
  if (b <= 0) return 0;
  return b * smoothstep(TERRAIN.riverClear, TERRAIN.riverClear + TERRAIN.riverFade, riverDistAt(x, z));
}

// ---- What terrain.ts and terrainPaint.ts call ------------------------------------------------------------------------
/** The region relief at (x, z), metres, already masked (0 where the region has no data.terrain). */
export function reliefAt(x: number, z: number): number {
  const e = ENTRIES[regionAt(x, z)];
  if (!e) return 0;
  const m = reliefMaskAt(x, z);
  return m > 0 ? m * e.landform.relief(x, z, e.input) : 0;
}

/** The region's own paint at (x, z), or null (no data.terrain, no paint function, or "not mine"). */
export function regionPaintAt(x: number, z: number, g: GroundFacts): PaintKind | null {
  const e = ENTRIES[g.region];
  return e?.landform.paint ? e.landform.paint(x, z, g, e.input) : null;
}
