// Searching the prefab catalog for the prop picker. Pure: the picker passes in whatever `allPrefabs()` returns.
export interface PrefabLite {
  id: string;
  name: string;
  category: string;
  tags: readonly string[];
  emoji: readonly string[];
}

/** Categories that belong in a level come first when nothing has been typed. */
const LEVEL_FIRST = ['prop', 'furniture', 'container'];
const rank = (c: string): number => { const i = LEVEL_FIRST.indexOf(c); return i < 0 ? LEVEL_FIRST.length : i; };

/** How well one query word matches a prefab (0 = not at all). The best field wins; ids and names beat tags. */
function wordScore(p: PrefabLite, w: string): number {
  const id = p.id.toLowerCase();
  const name = p.name.toLowerCase();
  if (id === w) return 100;
  if (id.startsWith(w)) return 80;
  if (name.startsWith(w)) return 70;
  if (id.includes(w)) return 50;
  if (name.includes(w)) return 40;
  if (p.tags.some((t) => t.toLowerCase() === w)) return 30;
  if (p.emoji.some((e) => e === w)) return 25;
  if (p.tags.some((t) => t.toLowerCase().includes(w))) return 15;
  if (p.category.toLowerCase() === w) return 10;
  return 0;
}

/** Prefabs matching `query` (every whitespace-separated word must match something), best first, at most `limit`.
 * An empty query lists the pool by category (props, furniture and containers first), then name. `category` 'all' (or '') does not filter. */
export function searchPrefabs(all: readonly PrefabLite[], query: string, category = 'all', limit = 80): PrefabLite[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const pool = category === 'all' || category === '' ? all : all.filter((p) => p.category === category);
  if (words.length === 0) {
    return [...pool].sort((a, b) => rank(a.category) - rank(b.category) || a.category.localeCompare(b.category) || a.name.localeCompare(b.name)).slice(0, limit);
  }
  const scored: { p: PrefabLite; s: number }[] = [];
  for (const p of pool) {
    let total = 0;
    let ok = true;
    for (const w of words) {
      const s = wordScore(p, w);
      if (s === 0) { ok = false; break; }
      total += s;
    }
    if (ok) scored.push({ p, s: total });
  }
  scored.sort((a, b) => b.s - a.s || a.p.id.length - b.p.id.length || a.p.id.localeCompare(b.p.id));
  return scored.slice(0, limit).map((x) => x.p);
}
