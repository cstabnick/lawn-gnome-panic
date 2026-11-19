// The library: every catalog file's prefabs, merged once. Duplicate ids throw at import time.
import type { Category, PrefabDef } from './types';
import { CATALOG } from './catalog';

const byId = new Map<string, PrefabDef>();
/** Every prefab that lists the emoji, in catalog order. The first is the emoji's default. */
const byEmoji = new Map<string, PrefabDef[]>();

/** Strip variation selectors and skin tones so '🛡️' and '🛡' match. */
export function normalizeEmoji(e: string): string {
  return e.replace(/[︎️]|\u{1F3FB}|\u{1F3FC}|\u{1F3FD}|\u{1F3FE}|\u{1F3FF}/gu, '').trim();
}

for (const def of CATALOG) {
  if (byId.has(def.id)) throw new Error(`Duplicate prefab id: ${def.id}`);
  byId.set(def.id, def);
  for (const e of def.emoji) {
    const k = normalizeEmoji(e);
    const list = byEmoji.get(k) ?? [];
    list.push(def);
    byEmoji.set(k, list);
  }
}

export function getPrefab(id: string): PrefabDef | undefined {
  return byId.get(id);
}

/** The ground footprint of a prefab at scale 1 (see PrefabDef.footprint), or undefined when it is not solid or unknown. */
export function prefabFootprint(id: string): { r: number; h: number } | undefined {
  return getPrefab(id)?.footprint;
}

export function allPrefabs(): readonly PrefabDef[] {
  return CATALOG;
}

export function prefabsIn(category: Category): PrefabDef[] {
  return CATALOG.filter((p) => p.category === category);
}

/** The default prefab for this emoji (the first to list it), if any. */
export function prefabForEmoji(emoji: string): PrefabDef | undefined {
  return byEmoji.get(normalizeEmoji(emoji))?.[0];
}

/** Every prefab that lists this emoji. */
export function prefabsForEmoji(emoji: string): readonly PrefabDef[] {
  return byEmoji.get(normalizeEmoji(emoji)) ?? [];
}

export interface ItemLike {
  /** An explicit prefab id. Always wins when it exists. */
  prefab?: string;
  /** The item's emoji. */
  icon?: string;
  /** The item's name: its words pick between prefabs ('Bottlecap plate' → the prefab tagged 'plate'). */
  name?: string;
  /** Categories to prefer, best first (a game maps its item kinds: offhand → ['shield']). */
  prefer?: readonly Category[];
}

function words(name: string | undefined): string[] {
  return (name ?? '').toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 2);
}

/** Higher is better: tag or id-word matches count most (the last name word, the noun, counts double), then category. */
function score(def: PrefabDef, ws: readonly string[], prefer: readonly Category[]): number {
  const idWords = def.id.split('-');
  let s = 0;
  ws.forEach((w, i) => {
    if (def.tags.includes(w) || idWords.includes(w)) s += i === ws.length - 1 ? 20 : 10;
  });
  const rank = prefer.indexOf(def.category);
  if (rank >= 0) s += 5 - Math.min(rank, 4);
  return s;
}

function best(list: readonly PrefabDef[], ws: readonly string[], prefer: readonly Category[]): PrefabDef | undefined {
  let top: PrefabDef | undefined;
  let topScore = -1;
  for (const d of list) {
    const s = score(d, ws, prefer);
    if (s > topScore) { top = d; topScore = s; } // ties keep the earlier (catalog order)
  }
  return top;
}

/**
 * Best prefab for a game's item:
 * 1. `prefab`, if that id exists.
 * 2. Among the prefabs listing the emoji, the one whose tags best match the name (then `prefer`).
 * 3. With no emoji match: the prefab whose tags best match the name, if any word matches at all.
 */
export function resolvePrefab(item: ItemLike): PrefabDef | undefined {
  if (item.prefab) {
    const p = byId.get(item.prefab);
    if (p) return p;
  }
  const ws = words(item.name);
  const prefer = item.prefer ?? [];
  const candidates = item.icon ? prefabsForEmoji(item.icon) : [];
  if (candidates.length) return best(candidates, ws, prefer);
  if (!ws.length) return undefined;
  const p = best(CATALOG, ws, prefer);
  return p && score(p, ws, []) > 0 ? p : undefined;
}
