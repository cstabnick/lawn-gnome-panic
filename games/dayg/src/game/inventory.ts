// Inventory: two hands, worn slots, a pack limited by bulk, carry weight, liquids in containers, tag queries.
// Rules name tags and properties, never specific items (docs/design/dayg/items.md).
import { CARRY } from '../config';
import { getItem, hasTag, type Tag, type WornSlot } from '../items/defs';
import type { ItemStack } from '../sim/types';
import type { Inventory, InventorySystem, StackRef } from './types';

const EPS = 1e-9;
const round2 = (x: number): number => Math.round(x * 100) / 100;
const notNull = (s: ItemStack | null): s is ItemStack => s !== null;
const isWeapon = (id: string): boolean => hasTag(id, 'BLUNT') || hasTag(id, 'CUT') || hasTag(id, 'PIERCE');

function cloneStack(s: ItemStack): ItemStack {
  const c: ItemStack = { def: s.def, count: s.count, condition: s.condition };
  if (s.liquid) c.liquid = { ...s.liquid };
  return c;
}

function cloneInv(inv: Inventory): Inventory {
  const worn: Inventory['worn'] = {};
  for (const slot of Object.keys(inv.worn) as WornSlot[]) {
    const v = inv.worn[slot];
    if (v) worn[slot] = cloneStack(v);
  }
  return {
    hands: [inv.hands[0] ? cloneStack(inv.hands[0]) : null, inv.hands[1] ? cloneStack(inv.hands[1]) : null],
    worn,
    pack: inv.pack.map(cloneStack),
  };
}

function wornList(inv: Inventory): ItemStack[] {
  const out: ItemStack[] = [];
  for (const slot of Object.keys(inv.worn) as WornSlot[]) {
    const v = inv.worn[slot];
    if (v) out.push(v);
  }
  return out;
}

// Hands, then pack, then worn. The returned objects are the live ones in inv.
function allStacks(inv: Inventory): ItemStack[] {
  return [...inv.hands.filter(notNull), ...inv.pack, ...wornList(inv)];
}

function getIn(inv: Inventory, ref: StackRef): ItemStack | null {
  if (ref.where === 'hand') return inv.hands[ref.index];
  if (ref.where === 'worn') return inv.worn[ref.slot] ?? null;
  return inv.pack[ref.index] ?? null;
}

function removeIn(inv: Inventory, ref: StackRef): ItemStack | null {
  const s = getIn(inv, ref);
  if (!s) return null;
  if (ref.where === 'hand') inv.hands[ref.index] = null;
  else if (ref.where === 'worn') delete inv.worn[ref.slot];
  else inv.pack.splice(ref.index, 1);
  return s;
}

function putIn(inv: Inventory, ref: StackRef, s: ItemStack): void {
  if (ref.where === 'hand') inv.hands[ref.index] = s;
  else if (ref.where === 'worn') inv.worn[ref.slot] = s;
  else inv.pack.push(s);
}

function accepts(ref: StackRef, s: ItemStack): boolean {
  return ref.where === 'worn' ? getItem(s.def).wear === ref.slot : true;
}

function bulkOf(inv: Inventory): number {
  return inv.pack.reduce((n, s) => n + getItem(s.def).bulk * s.count + (s.liquid?.litres ?? 0), 0);
}

function capOf(inv: Inventory): number {
  return CARRY.pocketsBulk + wornList(inv)
    .filter((s) => hasTag(s.def, 'CONTAINER'))
    .reduce((n, s) => n + (getItem(s.def).props?.capacity ?? 0), 0);
}

function weightOf(inv: Inventory): number {
  return allStacks(inv).reduce((n, s) => n + getItem(s.def).weight * s.count + (s.liquid?.litres ?? 0), 0);
}

function countOf(inv: Inventory, tag: Tag): number {
  return allStacks(inv).filter((s) => hasTag(s.def, tag)).reduce((n, s) => n + s.count, 0);
}

function findRef(inv: Inventory, tag: Tag): StackRef | null {
  for (const i of [0, 1] as const) {
    const s = inv.hands[i];
    if (s && hasTag(s.def, tag)) return { where: 'hand', index: i };
  }
  for (let i = 0; i < inv.pack.length; i++) if (hasTag(inv.pack[i].def, tag)) return { where: 'pack', index: i };
  for (const slot of Object.keys(inv.worn) as WornSlot[]) {
    const s = inv.worn[slot];
    if (s && hasTag(s.def, tag)) return { where: 'worn', slot };
  }
  return null;
}

// How many units of a per-unit bulk fit into the free bulk.
function fitUnits(perUnit: number, free: number): number {
  return perUnit <= 0 ? Infinity : Math.max(0, Math.floor((free + EPS) / perUnit));
}

export function createInventory(start: readonly ItemStack[]): InventorySystem {
  const state: Inventory = { hands: [null, null], worn: {}, pack: [] };
  const listeners = new Set<() => void>();
  const changed = (): void => { for (const fn of [...listeners]) fn(); };

  // Start: wearable items go to their empty worn slot; the first weapon goes to hand 0; the rest to the pack.
  let weaponPlaced = false;
  for (const s of start) {
    const c = cloneStack(s);
    const def = getItem(s.def);
    if (def.wear && !state.worn[def.wear]) { state.worn[def.wear] = c; continue; }
    if (!weaponPlaced && isWeapon(s.def)) { state.hands[0] = c; weaponPlaced = true; continue; }
    state.pack.push(c);
  }

  const free = (): number => capOf(state) - bulkOf(state);

  return {
    state,
    add(stack) {
      const def = getItem(stack.def);
      const liquid = stack.liquid ? { ...stack.liquid } : undefined;
      const litres = liquid?.litres ?? 0;
      const initial = stack.count;
      let remaining = stack.count;
      if (remaining <= 0) return null;

      // Merge into same-def stacks with room (hands, then pack). Merging averages condition.
      const merge = (t: ItemStack, inPack: boolean): void => {
        if (remaining <= 0 || t.def !== stack.def || t.liquid || liquid || def.stack <= 1) return;
        let n = Math.min(def.stack - t.count, remaining);
        if (inPack) n = Math.min(n, fitUnits(def.bulk, free()));
        if (n <= 0) return;
        t.condition = (t.condition * t.count + stack.condition * n) / (t.count + n);
        t.count += n;
        remaining -= n;
      };
      for (const h of state.hands) if (h) merge(h, false);
      for (const p of state.pack) merge(p, true);

      // New pack stacks while bulk allows.
      while (remaining > 0) {
        let n = liquid ? 1 : Math.min(remaining, def.stack);
        if (def.bulk * n + litres > free() + EPS) {
          if (liquid) break;
          n = Math.min(n, fitUnits(def.bulk, free()));
          if (n <= 0) break;
        }
        const entry: ItemStack = { def: stack.def, count: n, condition: stack.condition };
        if (liquid) entry.liquid = { ...liquid };
        state.pack.push(entry);
        remaining -= n;
      }

      // Then empty hands.
      for (const i of [0, 1] as const) {
        if (remaining <= 0) break;
        if (state.hands[i] !== null) continue;
        const n = liquid ? 1 : Math.min(remaining, def.stack);
        const h: ItemStack = { def: stack.def, count: n, condition: stack.condition };
        if (liquid) h.liquid = { ...liquid };
        state.hands[i] = h;
        remaining -= n;
      }

      if (remaining !== initial) changed();
      return remaining > 0 ? { ...cloneStack(stack), count: remaining } : null;
    },
    get: (ref) => getIn(state, ref),
    take(ref, count) {
      const s = getIn(state, ref);
      if (!s || count <= 0) return null;
      const n = Math.min(count, s.count);
      const out = { ...cloneStack(s), count: n };
      s.count -= n;
      if (s.count <= 0) removeIn(state, ref);
      changed();
      return out;
    },
    move(from, to) {
      if (JSON.stringify(from) === JSON.stringify(to) || !getIn(state, from)) return false;
      const before = bulkOf(state);
      const c = cloneInv(state);
      const moving = removeIn(c, from);
      if (!moving) return false;
      const displaced = to.where === 'pack' ? null : removeIn(c, to);
      if (!accepts(to, moving)) return false;
      if (displaced && !accepts(from, displaced)) return false;
      if (displaced) putIn(c, from, displaced);
      putIn(c, to, moving);
      const after = bulkOf(c);
      if (after > capOf(c) + EPS && after > before + EPS) return false;
      state.hands = c.hands;
      state.worn = c.worn;
      state.pack = c.pack;
      changed();
      return true;
    },
    findTag: (tag) => findRef(state, tag),
    countTag: (tag) => countOf(state, tag),
    consumeTag(tag, count) {
      if (count <= 0) return true;
      if (countOf(state, tag) < count) return false;
      let left = count;
      while (left > 0) {
        const ref = findRef(state, tag);
        if (!ref) break;
        const s = getIn(state, ref);
        if (!s) break;
        const n = Math.min(left, s.count);
        s.count -= n;
        left -= n;
        if (s.count <= 0) removeIn(state, ref);
      }
      changed();
      return true;
    },
    held: () => state.hands[0],
    weight: () => weightOf(state),
    carryCapacity: () => CARRY.capacityKg,
    bulkUsed: () => bulkOf(state),
    bulkCapacity: () => capOf(state),
    cleanWater() {
      let total = 0;
      for (const s of allStacks(state)) {
        if (hasTag(s.def, 'HOLD_LIQUID') && s.liquid?.kind === 'clean') total += s.liquid.litres;
        if (hasTag(s.def, 'DRINK')) total += 0.5 * s.count;
      }
      return round2(total);
    },
    useWater(litres) {
      let need = litres;
      let removed = 0;
      // Clean liquid first.
      for (const s of allStacks(state)) {
        if (need <= EPS) break;
        if (!s.liquid || s.liquid.kind !== 'clean') continue;
        const t = Math.min(need, s.liquid.litres);
        s.liquid.litres = round2(s.liquid.litres - t);
        need -= t;
        removed += t;
        if (s.liquid.litres <= EPS) delete s.liquid;
      }
      // Then whole DRINK items, 0.5 L each.
      while (need > EPS) {
        const ref = findRef(state, 'DRINK');
        if (!ref) break;
        const s = getIn(state, ref);
        if (!s) break;
        s.count -= 1;
        if (s.count <= 0) removeIn(state, ref);
        need -= 0.5;
        removed += 0.5;
      }
      if (removed > 0) changed();
      return round2(removed);
    },
    fillLiquid(kind, litres) {
      let need = litres;
      let stored = 0;
      for (const s of allStacks(state)) {
        if (need <= EPS) break;
        if (!hasTag(s.def, 'HOLD_LIQUID') || s.count !== 1) continue;
        if (s.liquid && s.liquid.kind !== kind) continue;
        const cap = getItem(s.def).props?.liquidCap ?? 0;
        const cur = s.liquid?.litres ?? 0;
        let add = Math.min(cap - cur, need);
        if (state.pack.includes(s)) add = Math.min(add, free());
        if (add <= EPS) continue;
        s.liquid = { kind, litres: round2(cur + add) };
        need -= add;
        stored += add;
      }
      if (stored > 0) changed();
      return round2(stored);
    },
    onChange(fn) { listeners.add(fn); return () => { listeners.delete(fn); }; },
  };
}
