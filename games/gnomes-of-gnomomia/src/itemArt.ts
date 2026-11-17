// Item pictures and extra examine text from the shared prefab library (@lawn/prefabs).
// Each item maps to a prefab by its `prefab` field, else by its emoji, name words and kind. No match: the emoji stays.
import type * as THREE from 'three';
import { prefabFromObject, prefabIconElement, resolvePrefab, type Category, type PrefabDef, type PrefabHit } from '@lawn/prefabs';
import type { ItemDef } from './config';

const PREFER: Record<ItemDef['kind'], readonly Category[]> = {
  weapon: ['weapon', 'tool'],
  offhand: ['shield', 'trinket'],
  armor: ['armor', 'shield'],
  trinket: ['trinket', 'key'],
  potion: ['consumable', 'food'],
  misc: ['material', 'document', 'key', 'food', 'tool', 'trinket', 'container'],
};

const cache = new Map<string, PrefabDef | null>();

/** The prefab that draws this item, or undefined. */
export function itemPrefab(def: ItemDef): PrefabDef | undefined {
  let hit = cache.get(def.id);
  if (hit === undefined) {
    hit = resolvePrefab({ prefab: def.prefab, icon: def.icon, name: def.name, prefer: PREFER[def.kind] }) ?? null;
    cache.set(def.id, hit);
  }
  return hit ?? undefined;
}

/** A picture of the item `px` CSS pixels square (an <img>), or its emoji in a <span> when there is no prefab. */
export function itemIcon(def: ItemDef, px: number): HTMLElement {
  return prefabIconElement(itemPrefab(def)?.id, def.icon, px);
}

const examined = new Map<string, number>();

/**
 * The line to show for "Examine": the item's own line first, then each examine line of its prefab in turn, then
 * around again. Lets players keep poking at an item and keep learning something.
 */
export function examineText(def: ItemDef): string {
  const lines = [def.examine, ...(itemPrefab(def)?.examine ?? [])];
  const n = examined.get(def.id) ?? 0;
  examined.set(def.id, n + 1);
  return lines[n % lines.length];
}

/** The examinable/interactable prefab (furniture or a prop) a clicked mesh belongs to, found via buildPrefab's userData.prefab. */
export function examinablePrefabFromMesh(obj: THREE.Object3D): PrefabHit | null {
  const hit = prefabFromObject(obj);
  return hit && (hit.def.category === 'furniture' || hit.def.category === 'prop') ? hit : null;
}

/** The next examine line of a prefab: each line in turn, then around again. */
export function prefabExamine(def: PrefabDef): string {
  const key = `prefab:${def.id}`;
  const n = examined.get(key) ?? 0;
  examined.set(key, n + 1);
  return def.examine[n % def.examine.length];
}
