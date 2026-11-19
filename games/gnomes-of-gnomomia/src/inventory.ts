// Inventory and equipment rules: stacking, equipping, potions, dropping and picking up loot.
import { state, maxHp, maxMp } from './state';
import { bus, say } from './events';
import { getEntity, notifyLootTaken, removeEntity, spawnLoot } from './entities';
import { player } from './player';
import { applyStatus } from './combat';
import { INVENTORY_SIZE, PLAYER_ID, UI, type EquipSlot } from './config';
import { ITEMS } from './content';
import { examineText } from './itemArt';

/** Adds items (stacking stackables). False (and a message) if there is no room. */
export function addItem(item: string, count = 1): boolean {
  const def = ITEMS[item];
  const inv = state.inventory;
  let left = count;
  let added = 0;

  // Stackables first top up an existing stack.
  if (def?.stackable) {
    const stack = inv.find((s) => s?.item === item);
    if (stack) {
      stack.count += left;
      added += left;
      left = 0;
    }
  }

  // Then fill empty slots: a stackable takes one slot, anything else one slot per item.
  for (let i = 0; i < INVENTORY_SIZE && left > 0; i++) {
    if (inv[i] !== null) continue;
    if (def?.stackable) {
      inv[i] = { item, count: left };
      added += left;
      left = 0;
    } else {
      inv[i] = { item, count: 1 };
      added += 1;
      left -= 1;
    }
  }

  if (left > 0) say('Your inventory is full.', UI.bad);
  if (added > 0) bus.emit('item-added', { item, count: added });
  bus.emit('changed', {});
  return left === 0;
}

export function removeItem(item: string, count = 1): boolean {
  if (countItem(item) < count) return false;
  let left = count;
  const inv = state.inventory;
  for (let i = 0; i < inv.length && left > 0; i++) {
    const s = inv[i];
    if (!s || s.item !== item) continue;
    const take = Math.min(s.count, left);
    s.count -= take;
    left -= take;
    if (s.count <= 0) inv[i] = null;
  }
  bus.emit('changed', {});
  return true;
}

/** Total of an item across all inventory slots. */
export function countItem(item: string): number {
  let total = 0;
  for (const s of state.inventory) if (s && s.item === item) total += s.count;
  return total;
}

/** Wear or wield the item in inventory slot i; the old item goes back into the same slot. */
export function equipFromSlot(i: number): void {
  const s = state.inventory[i];
  if (!s) return;
  const def = ITEMS[s.item];
  if (!def?.slot) return;
  const old = state.equipment[def.slot];
  state.equipment[def.slot] = s.item;
  state.inventory[i] = old ? { item: old, count: 1 } : null;
  say(`You equip the ${def.name}.`);
  bus.emit('changed', {});
}

/** Take off an equipped item into an empty inventory slot. */
export function unequip(slot: EquipSlot): void {
  const id = state.equipment[slot];
  if (!id) return;
  const empty = state.inventory.indexOf(null);
  if (empty < 0) {
    say('Your inventory is full.', UI.bad);
    return;
  }
  state.inventory[empty] = { item: id, count: 1 };
  state.equipment[slot] = null;
  bus.emit('changed', {});
}

/** Left-click on an inventory slot: drink potions, equip gear, examine misc. */
export function useFromSlot(i: number): void {
  const s = state.inventory[i];
  if (!s) return;
  const def = ITEMS[s.item];
  if (!def) return;

  if (def.kind === 'potion') {
    let hpGained = 0;
    if (def.heal) {
      const before = state.hp;
      state.hp = Math.min(maxHp(), state.hp + def.heal);
      hpGained = state.hp - before;
    }
    if (def.mana) state.mp = Math.min(maxMp(), state.mp + def.mana);
    s.count -= 1;
    if (s.count <= 0) state.inventory[i] = null;
    if (s.item === 'cigs') {
      applyStatus(PLAYER_ID, 'smoking', 45);
      say('You light up a cig and start smoking.');
    } else if (s.item === 'beer') {
      applyStatus(PLAYER_ID, 'tipsy', 45);
      say('You crack open a Dandelion beer and start drinking.');
    } else {
      say(s.item === 'mushroom' ? 'You eat the mushroom.' : `You drink the ${def.name}.`);
    }
    if (hpGained > 0) bus.emit('heal', { amount: hpGained });
    bus.emit('changed', {});
    return;
  }

  if (def.slot) {
    equipFromSlot(i);
    return;
  }

  say(examineText(def), UI.textWhite);
}

/** Drop an inventory item on the ground at the player's feet (synced to other online players). */
export function dropFromSlot(i: number): void {
  const s = state.inventory[i];
  if (!s) return;
  const def = ITEMS[s.item];
  spawnLoot(player.position.x, player.position.z, [{ ...s }], 0, { sync: true });
  state.inventory[i] = null;
  if (def) say(`You drop the ${def.name}.`);
  bus.emit('changed', {});
}

/** Take everything from a loot pile entity. */
export function pickUpLoot(id: number): void {
  const e = getEntity(id);
  if (!e || e.kind !== 'loot') return;

  let changed = false;
  if (e.gold > 0) {
    state.gold += e.gold;
    say(`You take ${e.gold} gold.`, UI.gold);
    e.gold = 0;
    changed = true;
  }

  const taken: string[] = [];
  const remaining: typeof e.loot = [];
  for (const slot of e.loot) {
    // Count what actually fit, so a partly-full inventory keeps the rest on the ground.
    const before = countItem(slot.item);
    addItem(slot.item, slot.count);
    const got = countItem(slot.item) - before;
    if (got > 0) {
      taken.push(ITEMS[slot.item]?.name ?? slot.item);
      changed = true;
    }
    if (got < slot.count) remaining.push({ item: slot.item, count: slot.count - got });
  }
  if (taken.length > 0) say(`You take: ${taken.join(', ')}.`);

  e.loot = remaining;
  if (changed) notifyLootTaken(id, remaining, e.gold);
  if (remaining.length === 0 && e.gold <= 0) removeEntity(id);
  bus.emit('changed', {});
}
