// The contract every region's landform module (src/landforms/<region>.ts) implements. Pure: no three.js, no DOM.
import type { RegionId } from '../levels';

/**
 * What the ground can be painted as. Each kind drives like a SurfaceKind and looks like a ground texture
 * (terrainPaint.ts PAINT_SURFACE / PAINT_GROUND): 'forest', 'moss' and 'meadow' drive like grass but keep their region's
 * texture.
 */
export type PaintKind =
  | 'rock' | 'dirt' | 'gravel' | 'mud' | 'ice' | 'snow' | 'sand' | 'grass' | 'farm' | 'forest' | 'moss' | 'meadow';

/** Every paint kind; a painted cell stores its index + 1 (0 = unpainted, the region's own ground). */
export const PAINT_KINDS: readonly PaintKind[] = [
  'rock', 'dirt', 'gravel', 'mud', 'ice', 'snow', 'sand', 'grass', 'farm', 'forest', 'moss', 'meadow',
];

/** A document landform feature (data.terrain.features), moved to WORLD coordinates. */
export interface LandformFeature {
  id: string;
  kind: string;
  points: [number, number][];
  r?: number;
  h?: number;
}

/** What a region's generator gets: its document's data.terrain, in world coordinates. */
export interface LandformInput {
  params: Readonly<Record<string, number>>;
  features: readonly LandformFeature[];
}

/** The ground at a paint cell, measured after roads and sites are flattened. */
export interface GroundFacts {
  /** heightAt, metres. */
  height: number;
  /** Rise over run (0 = level, 1 = 45 degrees). */
  slope: number;
  /** Metres from the nearest river or canal bank (a `water` path's centre line minus half its width), 0 on the water. */
  riverDist: number;
  /** Metres from any water: a river bank or the edge of a still-water body (loch, Puddle Sea); 0 inside one. */
  waterDist: number;
  region: RegionId;
}

/** One region's landforms. Registered in src/landforms/index.ts under the region id. */
export interface Landform {
  /** Generator id; the region document's data.terrain.relief.id must equal it. */
  id: string;
  /** Bump when the shape changes; the document's data.terrain.relief.version must equal it. */
  version: number;
  /**
   * Relief in metres at world (x, z), added to the regional tilt. Called only for points inside this region, and the
   * result is faded to 0 at inner region borders and near rivers by the caller, so it need not do either itself.
   * Must be cheap (it runs about a million times when the world loads): at most 4 noise octaves plus a loop over the
   * features.
   */
  relief(x: number, z: number, input: LandformInput): number;
  /**
   * The region's own paint at world (x, z), or null for "not mine" (then the shared river-mud rule and the region's
   * default ground apply). Never sees trail cells or rock-steep cells: those are already dirt and rock.
   */
  paint?(x: number, z: number, g: GroundFacts, input: LandformInput): PaintKind | null;
}
