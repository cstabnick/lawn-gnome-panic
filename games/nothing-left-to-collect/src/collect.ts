// Pure collecting simulation: items, magnet pickups, multiplier, falling rain, number formatting.
// No DOM, window or three: the game, its chapters and the party slice all call it. CollectState stays plain JSON.
import { ITEM_KINDS, TUNING } from './config';
import type { CollectState, Item, ItemKind, Pickup, Rect } from './types';

/** Items keep this far from a rectangle's edges when scattered or rained. */
const EDGE = 0.4;

export function emptyCounts(): Record<ItemKind, number> {
  return { acorn: 0, 'golden-acorn': 0, clip: 0, sticky: 0, button: 0, token: 0, star: 0, badge: 0, anything: 0 };
}

export function createCollectState(seed: number): CollectState {
  return { t: 0, nextId: 1, seed: seed >>> 0, items: [], counts: emptyCounts(), total: 0, multiplier: 1, magnet: TUNING.magnet };
}

/** mulberry32 on s.seed: advances the seed, returns [0, 1). */
export function rand(s: CollectState): number {
  s.seed = (s.seed + 0x6d2b79f5) >>> 0;
  let t = s.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function spawnItem(s: CollectState, kind: ItemKind, x: number, z: number, y?: number, prefab?: string): Item | null {
  if (s.items.length >= TUNING.maxLiveItems) return null;
  const item: Item = { id: s.nextId++, kind, x, y: y ?? TUNING.itemRestY, z, vy: 0, falling: false };
  if (prefab !== undefined) item.prefab = prefab;
  s.items.push(item);
  return item;
}

/** A random point inside r, EDGE metres from its sides (or its centre line if r is narrower than that). */
function pointIn(s: CollectState, r: Rect): { x: number; z: number } {
  const mx = Math.min(EDGE, Math.abs(r.x1 - r.x0) / 2);
  const mz = Math.min(EDGE, Math.abs(r.z1 - r.z0) / 2);
  const lx = Math.min(r.x0, r.x1) + mx, hx = Math.max(r.x0, r.x1) - mx;
  const lz = Math.min(r.z0, r.z1) + mz, hz = Math.max(r.z0, r.z1) - mz;
  return { x: lx + rand(s) * (hx - lx), z: lz + rand(s) * (hz - lz) };
}

/**
 * Scatters n items inside r. `hidden(x, z)` says a spot is inside furniture or otherwise out of sight;
 * such spots are re-rolled so no item ends up behind a desk or inside a solid.
 */
export function scatter(
  s: CollectState, kind: ItemKind, n: number, r: Rect, y?: number, hidden?: (x: number, z: number) => boolean,
): number {
  let spawned = 0;
  for (let i = 0; i < n; i++) {
    let p = pointIn(s, r);
    for (let tries = 0; hidden && hidden(p.x, p.z) && tries < 40; tries++) p = pointIn(s, r);
    if (hidden && hidden(p.x, p.z)) continue;
    if (!spawnItem(s, kind, p.x, p.z, y)) break;
    spawned++;
  }
  return spawned;
}

export function rain(s: CollectState, kind: ItemKind, n: number, r: Rect, height: number = TUNING.rainHeight): number {
  let spawned = 0;
  for (let i = 0; i < n; i++) {
    const p = pointIn(s, r);
    const item = spawnItem(s, kind, p.x, p.z, height + rand(s) * 2);
    if (!item) break;
    item.falling = true;
    spawned++;
  }
  return spawned;
}

export function stepCollect(s: CollectState, collectors: readonly { x: number; y: number; z: number }[], dt: number): Pickup[] {
  s.t += dt;
  const rest = TUNING.itemRestY;
  for (const it of s.items) {
    if (!it.falling) continue;
    it.vy -= TUNING.itemFallG * dt;
    it.y += it.vy * dt;
    if (it.y <= rest) { it.y = rest; it.vy = 0; it.falling = false; }
  }

  const pickups: Pickup[] = [];
  if (collectors.length === 0 || s.items.length === 0) return pickups;
  const r2 = s.magnet * s.magnet;
  const taken = new Set<number>();
  for (const it of s.items) {
    for (let by = 0; by < collectors.length; by++) {
      const c = collectors[by];
      const dx = c.x - it.x, dz = c.z - it.z;
      if (dx * dx + dz * dz >= r2 || Math.abs(c.y + 0.5 - it.y) >= 1.5) continue;
      const amount = ITEM_KINDS[it.kind].value * s.multiplier;
      s.counts[it.kind] += amount;
      s.total += amount;
      const p: Pickup = { id: it.id, kind: it.kind, x: it.x, y: it.y, z: it.z, amount, by };
      if (it.prefab !== undefined) p.prefab = it.prefab;
      pickups.push(p);
      taken.add(it.id);
      break;
    }
  }
  if (taken.size) s.items = s.items.filter((i) => !taken.has(i.id));
  return pickups;
}

export function clearItems(s: CollectState, kind?: ItemKind): void {
  s.items = kind ? s.items.filter((i) => i.kind !== kind) : [];
}

const SUFFIXES: [number, string][] = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M']];

export function formatCount(n: number): string {
  if (!Number.isFinite(n) || n >= 1e100) return '∞';
  if (n < 1000) return String(Math.floor(n));
  if (n < 1e6) return Math.floor(n).toLocaleString('en-US');
  if (n < 1e15) {
    for (const [div, suf] of SUFFIXES) {
      if (n >= div) {
        const v = (n / div).toFixed(1);
        // 999.95M rounds to "1000.0M": show the next suffix (or scientific) instead.
        if (v === '1000.0') return suf === 'T' ? n.toExponential(1).replace('e+', 'e') : `1.0${SUFFIXES[SUFFIXES.findIndex((e) => e[1] === suf) - 1][1]}`;
        return `${v}${suf}`;
      }
    }
  }
  return n.toExponential(1).replace('e+', 'e');
}
