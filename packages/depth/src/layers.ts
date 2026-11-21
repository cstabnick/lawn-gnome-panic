import type * as THREE from 'three';

/**
 * Draw order for flat things lying on other flat things: ground, tints, roads, markings, decals, markers.
 * A higher layer always wins over a lower one where they overlap, at any distance.
 *
 * Why: two surfaces at (nearly) the same height land on the same depth-buffer value, and the GPU picks
 * either one per pixel, per frame: they flicker through each other ("z-fighting"). A small y-lift alone
 * does not fix it, because depth precision falls off with the square of distance: 1 cm of lift is enough
 * up close and nothing 100 m away. Polygon offset is measured in depth-buffer steps, so it holds at every
 * distance.
 */
export const LAYER = {
  /** The base ground plane or terrain. */
  ground: 0,
  /** Large tints laid over the ground: biome wedges, fields, painted patches. */
  tint: 1,
  /** Areas on a tint: plazas, city squares, clearings, pads, aprons. */
  area: 2,
  /** Roads, paths, runways. */
  road: 3,
  /** Kerbs and sidewalks drawn flat on or beside roads. */
  edge: 4,
  /** Road lines, stripes, painted rings. */
  marking: 5,
  /** Stains, puddles, burn marks, shadows-as-meshes. */
  decal: 6,
  /** Gameplay markers on the ground: quest rings, target circles, telegraphs. */
  marker: 7,
} as const;

export type LayerName = keyof typeof LAYER;

/**
 * Puts a material on a draw layer (a number or a LAYER name) by giving it a polygon offset of one depth step
 * per layer. Returns the material.
 *
 * The material is changed in place, so give each layer its own material: a material shared with a mesh on
 * another layer moves that mesh too.
 *
 * A y-lift may be kept for shading or shadows, but must grow in the same order as the layer
 * (never lift a lower layer above a higher one).
 */
export function flatLayer<M extends THREE.Material>(material: M, layer: number | LayerName): M {
  const n = typeof layer === 'number' ? layer : LAYER[layer];
  material.polygonOffset = n !== 0;
  material.polygonOffsetFactor = -n;
  material.polygonOffsetUnits = -n;
  return material;
}
