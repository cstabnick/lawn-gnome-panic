// The loot budget: a fixed, non-renewing stock of every resource spread over the regions by loot tier.
// NPC scavenging (takeLoot) and the player's containers (rollContainer) both draw from it; only foraging adds food.
// Pure: no DOM, no Math.random, no Date. All randomness from `rng`.
import { getItem } from '../items/defs';
import { rectArea } from './regions';
import type { Rng } from './rng';
import { RESOURCES, type ContainerDef, type ContainerType, type ItemStack, type RegionId, type Resource, type WorldState } from './types';
import { emptyResources } from './world';

export interface ContainerTable {
  rolls: [number, number];
  empty: number;
  entries: { res: Resource; weight: number; items: string[] }[];
}

/** Weights are first drafts (docs/design/dayg/loot.md, "Tables"). Every item's resource matches its entry's res. */
export const CONTAINER_TABLES: Record<ContainerType, ContainerTable> = {
  vase: { rolls: [0, 2], empty: 0.3, entries: [
    { res: 'medicine', weight: 20, items: ['salt-pinch'] },
    { res: 'water', weight: 20, items: ['spigot-water'] },
    { res: 'fuel', weight: 25, items: ['candle'] },
    { res: 'valuables', weight: 5, items: ['button'] },
  ] },
  bin: { rolls: [1, 4], empty: 0.15, entries: [
    { res: 'food', weight: 50, items: ['crab-apple', 'bread-loaf', 'cheese-wedge', 'blackberry'] },
    { res: 'materials', weight: 20, items: ['spider-silk', 'stone-chunk', 'nails', 'scrap-gear'] },
    { res: 'tools', weight: 10, items: ['tin-pail', 'clay-jar'] },
  ] },
  'grave-goods': { rolls: [0, 3], empty: 0.4, entries: [
    { res: 'fuel', weight: 25, items: ['candle'] },
    { res: 'food', weight: 15, items: ['blackberry', 'crab-apple'] },
    { res: 'valuables', weight: 10, items: ['button', 'gold-coins'] },
    { res: 'medicine', weight: 5, items: ['salt-pinch'] },
  ] },
  crate: { rolls: [1, 3], empty: 0.35, entries: [
    { res: 'tools', weight: 30, items: ['old-trowel', 'hand-fork', 'rope-coil', 'tin-pail', 'garden-mallet', 'hand-saw'] },
    { res: 'materials', weight: 30, items: ['stone-chunk', 'clay-chunk', 'spider-silk', 'plank', 'nails', 'iron-hinge', 'iron-bar', 'scrap-gear'] },
    { res: 'fuel', weight: 20, items: ['twig-bundle', 'timber-log'] },
  ] },
  sack: { rolls: [1, 3], empty: 0.3, entries: [
    { res: 'food', weight: 40, items: ['bread-loaf', 'seed-cake', 'red-mushroom'] },
    { res: 'materials', weight: 20, items: ['spider-silk', 'clay-chunk', 'plank'] },
    { res: 'fuel', weight: 15, items: ['twig-bundle'] },
  ] },
  chest: { rolls: [1, 4], empty: 0.25, entries: [
    { res: 'tools', weight: 25, items: ['thorn-dagger', 'acorn-club', 'flint-striker', 'torch'] },
    { res: 'medicine', weight: 20, items: ['glaze-pot', 'slug-slime', 'stout-tankard', 'salt-pinch'] },
    { res: 'valuables', weight: 15, items: ['gold-coins', 'button'] },
    { res: 'food', weight: 20, items: ['cheese-wedge', 'seed-cake'] },
  ] },
  'camp-cache': { rolls: [2, 5], empty: 0.2, entries: [
    { res: 'food', weight: 30, items: ['seed-cake', 'bread-loaf'] },
    { res: 'medicine', weight: 15, items: ['salt-pinch', 'slug-slime', 'stout-tankard'] },
    { res: 'tools', weight: 25, items: ['rope-coil', 'ladder', 'thorn-dagger', 'flint-striker', 'garden-mallet'] },
    { res: 'fuel', weight: 10, items: ['twig-bundle', 'candle'] },
    { res: 'materials', weight: 5, items: ['wool-scarf'] },
  ] },
  body: { rolls: [0, 2], empty: 0.5, entries: [
    { res: 'food', weight: 30, items: ['bread-loaf'] },
    { res: 'tools', weight: 20, items: ['old-trowel'] },
    { res: 'medicine', weight: 10, items: ['salt-pinch'] },
  ] },
};

/** Largest-remainder split of `total` whole units by `weights` (ties go to the earlier index). */
function apportion(total: number, weights: readonly number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (total <= 0 || sum <= 0) return weights.map(() => 0);
  const raw = weights.map((wt) => (total * wt) / sum);
  const out = raw.map((x) => Math.floor(x));
  let left = total - out.reduce((a, b) => a + b, 0);
  const order = raw.map((x, i) => ({ i, f: x - Math.floor(x) })).sort((a, b) => b.f - a.f || a.i - b.i);
  for (let k = 0; left > 0 && order.length > 0; k = (k + 1) % order.length, left--) out[order[k].i] += 1;
  return out;
}

export function initLoot(w: WorldState, _rng: Rng, containers: readonly ContainerDef[]): void {
  const t = w.tuning.loot;
  const regions = w.graph.regions;
  const npcCount = w.npcs.length;
  const weights = regions.map((r) =>
    t.tierWeight[r.lootTier] * (rectArea(r.rect) / 10000) *
    (r.traits.includes('NEST') ? t.nestMul : 1) * (r.traits.includes('HAVEN') ? t.havenMul : 1));
  for (const r of regions) { w.loot[r.id] = emptyResources(); w.forage[r.id] = r.forage * t.foragePerDay; }
  for (const res of RESOURCES) {
    const budget = Math.round(t.perGnome[res] * npcCount);
    const shares = apportion(budget, weights);
    regions.forEach((r, i) => { w.loot[r.id][res] = shares[i]; });
  }
  w.containers = {};
  for (const c of containers) {
    const contents: ItemStack[] = [];
    for (const id of c.guaranteed ?? []) {
      const res = getItem(id).resource;
      const stock = w.loot[c.region];
      if (stock) stock[res] = Math.max(0, stock[res] - 1);
      const st = contents.find((s) => s.def === id);
      if (st) st.count += 1; else contents.push({ def: id, count: 1, condition: 1 });
    }
    w.containers[c.id] = { id: c.id, region: c.region, type: c.type, opened: false, contents };
  }
  w.regionLootStart = {} as Record<RegionId, Record<Resource, number>>;
  for (const r of regions) w.regionLootStart[r.id] = { ...w.loot[r.id] };
}

export function dailyForage(w: WorldState, _rng: Rng): void {
  const t = w.tuning.loot;
  for (const r of w.graph.regions) {
    const perDay = r.forage * t.foragePerDay;
    w.forage[r.id] = Math.min(perDay * t.forageCapDays, (w.forage[r.id] ?? 0) + perDay);
  }
}

export function takeLoot(w: WorldState, r: RegionId, res: Resource, want: number, rng: Rng): number {
  const stock = w.loot[r]?.[res] ?? 0;
  if (stock <= 0 || want <= 0) return 0;
  const share = stock / Math.max(1, w.regionLootStart[r]?.[res] ?? 0);
  const got = Math.max(0, Math.min(stock, rng.round(want * Math.min(1, 0.25 + share))));
  w.loot[r][res] -= got;
  return got;
}

export function forage(w: WorldState, r: RegionId, want: number, rng: Rng): number {
  const avail = Math.floor(w.forage[r] ?? 0);
  if (avail <= 0 || want <= 0) return 0;
  const got = Math.max(0, Math.min(avail, rng.round(want)));
  w.forage[r] -= got;
  w.ledger.foraged.food += got;
  return got;
}

export function rollContainer(w: WorldState, id: string, rng: Rng): ItemStack[] {
  const c = w.containers[id];
  if (!c) return [];
  if (c.opened) return c.contents;
  const table = CONTAINER_TABLES[c.type];
  const stock = w.loot[c.region];
  const start = w.regionLootStart[c.region];
  let now = 0, was = 0;
  for (const res of RESOURCES) { now += stock[res]; was += start?.[res] ?? 0; }
  const regionShare = now / Math.max(1, was);
  const emptyChance = 1 - (1 - table.empty) * Math.min(1, regionShare + 0.2);
  if (!rng.chance(emptyChance)) {
    const rolls = rng.int(table.rolls[0], table.rolls[1]);
    for (let i = 0; i < rolls; i++) {
      const open = table.entries.filter((e) => stock[e.res] >= 1);
      if (open.length === 0) break;
      const entry = rng.weighted(open, (e) => e.weight);
      const item = rng.pick(entry.items);
      stock[entry.res] -= 1;
      const st = c.contents.find((s) => s.def === item);
      if (st) st.count += 1;
      else c.contents.push({ def: item, count: 1, condition: rng.range(0.4, 1) });
    }
  }
  c.opened = true;
  return c.contents;
}
