// Picking for the select tool. Pure: no DOM, no three.js, so it can be tested in plain node.
import type { CollectionDef, MutableZone } from '../context';

/**
 * The item under (x, z), or null. Among the candidates the one with the smallest distance relative to its own
 * pick radius wins, so a small lake inside a big region is picked near its own centre and the region near its edge.
 * An item is a candidate when it lies within max(radius, minPick). Ties go to the later collection.
 */
export function pickItem(
  def: MutableZone,
  collections: readonly CollectionDef[],
  x: number,
  z: number,
  minPick = 1.5,
): { collection: string; index: number } | null {
  let best: { collection: string; index: number; score: number } | null = null;
  for (const c of collections) {
    const list = c.items(def);
    for (let index = 0; index < list.length; index++) {
      const item = list[index];
      if (c.accepts && !c.accepts(item)) continue;
      const r = Math.max(c.radius(item), minPick);
      const d = Math.hypot(item.x - x, item.z - z);
      if (d > r) continue;
      const score = d / r;
      if (best === null || score <= best.score) best = { collection: c.id, index, score };
    }
  }
  return best === null ? null : { collection: best.collection, index: best.index };
}
