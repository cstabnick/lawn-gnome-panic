// Merging two saves of the same player (this browser's and the account's, or two tabs'), the way @lawn/sync does it
// for the gnome and achievements: merge what can be merged, take the latest write where it cannot. Progress never goes
// backwards: the higher level, the best stars of every level and every built house item all survive.
import { AREAS } from './house/houseData';
import { normalizeSave, type SaveData } from './save';
import type { BoosterKind } from './engine/types';

const COST = new Map(AREAS.flatMap((a) => a.slots.map((s) => [s.id, s.cost] as const)));

/** True when `a` has at least everything `b` has: level, best stars and built items. */
function covers(a: SaveData, b: SaveData): boolean {
  if (a.level < b.level) return false;
  for (const [id, n] of Object.entries(b.best)) if ((a.best[Number(id)] ?? 0) < n) return false;
  for (const id of Object.keys(b.house)) if (a.house[id] === undefined) return false;
  return true;
}

/** Same key order every time, so merging is idempotent on the text too. */
function stable(s: SaveData): SaveData {
  const house: Record<string, number> = {};
  for (const id of Object.keys(s.house).sort()) house[id] = s.house[id];
  const best: Record<number, number> = {};
  for (const id of Object.keys(s.best).map(Number).sort((x, y) => x - y)) best[id] = s.best[id];
  const out: SaveData = { level: s.level, stars: s.stars, coins: s.coins, house, boosters: { ...s.boosters }, best };
  if (s.t !== undefined) out.t = s.t;
  return out;
}

/** Merges two saves. Commutative and idempotent: merge(merge(a, b), b) equals merge(a, b). */
export function mergeSaves(a: SaveData, b: SaveData): SaveData {
  const ta = a.t ?? 0;
  const tb = b.t ?? 0;
  // The newer save wins anything that cannot be merged (a restyled item, coins and boosters if neither covers the other).
  const [newer, older] = ta > tb || (ta === tb && JSON.stringify(stable(a)) >= JSON.stringify(stable(b))) ? [a, b] : [b, a];
  const aCovers = covers(a, b);
  const bCovers = covers(b, a);
  // One save already has all the other's progress (the usual case: one device is just behind): keep it whole, stars
  // and coins included. Same progress on both sides: the newer one.
  if (aCovers || bCovers) {
    const keep = aCovers && bCovers ? newer : aCovers ? a : b;
    const t = Math.max(ta, tb);
    return stable(t > 0 ? { ...keep, t } : keep);
  }
  const best: Record<number, number> = { ...older.best };
  for (const [id, n] of Object.entries(newer.best)) best[Number(id)] = Math.max(best[Number(id)] ?? 0, n);
  const house: Record<string, number> = { ...older.house, ...newer.house };
  // Stars are earned only by beating a level's best and spent only on building, so they follow from best and house.
  const earned = Object.values(best).reduce((x, n) => x + n, 0);
  const spent = Object.keys(house).reduce((x, id) => x + (COST.get(id) ?? 0), 0);
  const boosters = { ...newer.boosters };
  for (const k of Object.keys(boosters) as BoosterKind[]) boosters[k] = Math.max(a.boosters[k] ?? 0, b.boosters[k] ?? 0);
  const out: SaveData = {
    level: Math.max(a.level, b.level),
    stars: Math.max(0, earned - spent),
    coins: Math.max(a.coins, b.coins),
    house,
    boosters,
    best,
  };
  const t = Math.max(ta, tb);
  if (t > 0) out.t = t;
  return stable(out);
}

/** Text form for the cloud slot's merge(): this browser's text (null = none) and the account's. */
export function mergeSaveTexts(local: string | null, remote: string): string {
  const parse = (text: string): SaveData => {
    try {
      return normalizeSave(JSON.parse(text));
    } catch {
      return normalizeSave(null);
    }
  };
  if (local === null) return JSON.stringify(stable(parse(remote)));
  return JSON.stringify(mergeSaves(parse(local), parse(remote)));
}
