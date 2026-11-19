import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INVENTORY_SIZE } from '../config';
import { ITEMS } from '../content';
import {
  allEntities,
  applyRemoteLootDrop,
  applyRemoteLootTake,
  exportSyncedLoot,
  lootSyncOwner,
  removeEntity,
  setLootNet,
  type LootNetBridge,
} from '../entities';
import { addItem, countItem, dropFromSlot, pickUpLoot } from '../inventory';
import { player } from '../player';
import { newGameState, state } from '../state';
import { readLootItems, readLootSync, type LootSync } from './protocol';

function makeBridge(overrides: Partial<LootNetBridge> = {}): LootNetBridge {
  return {
    isOnline: () => true,
    myId: () => 5,
    sendLootDrop: vi.fn(),
    sendLootTake: vi.fn(),
    ...overrides,
  };
}

describe('dropped item sync protocol validators', () => {
  it('validates loot items and rejects unknown items or invalid counts', () => {
    expect(readLootItems([['beer', 2]])).toEqual([['beer', 2]]);
    expect(readLootItems([['not-a-real-item', 1]])).toBeNull();
    expect(readLootItems([['beer', 0]])).toBeNull();
    expect(readLootItems([['beer', 1.5]])).toBeNull();
    expect(readLootItems('bad')).toBeNull();
  });

  it('validates loot sync tuples and rejects empty or malformed entries', () => {
    const valid: LootSync = ['l:5:1', 'mossbottom', 4.5, 6.25, [['beer', 1]], 0, 90];
    expect(readLootSync(valid)).toEqual(valid);
    expect(readLootSync(['l:5:1', 'mossbottom', 4.5, 6.25, [], 0, 90])).toBeNull();
    expect(readLootSync(['', 'mossbottom', 0, 0, [['beer', 1]], 0, 90])).toBeNull();
    expect(readLootSync(['l:5:1', 'fakezone', 0, 0, [['beer', 1]], 0, 90])).toBeNull();
  });
});

describe('dropped item sync behavior', () => {
  beforeEach(() => {
    Object.assign(state, newGameState());
    player.position.set(3, 0, 3);
    for (const e of allEntities()) removeEntity(e.id);
  });

  afterEach(() => {
    setLootNet(null);
    for (const e of allEntities()) removeEntity(e.id);
  });

  it('broadcasts ldrop when dropping an item online and exports it for newcomers', () => {
    const bridge = makeBridge({ myId: () => 5 });
    setLootNet(bridge);

    addItem('beer', 2);
    const slot = state.inventory.findIndex((s) => s?.item === 'beer');
    expect(slot).toBeGreaterThanOrEqual(0);

    dropFromSlot(slot);

    expect(countItem('beer')).toBe(0);
    expect(bridge.sendLootDrop).toHaveBeenCalledTimes(1);
    const sent = vi.mocked(bridge.sendLootDrop).mock.calls[0][0];
    expect(lootSyncOwner(sent[0])).toBe(5);
    expect(sent[4]).toEqual([['beer', 2]]);

    const exported = exportSyncedLoot((ownerId) => ownerId === 5);
    expect(exported).toHaveLength(1);
    expect(exported[0][0]).toBe(sent[0]);
  });

  it('spawns remote dropped loot and broadcasts ltake when picked up', () => {
    const bridge = makeBridge({ myId: () => 7 });
    setLootNet(bridge);

    const drop: LootSync = ['l:2:1', 'mossbottom', 5, 5, [['cigs', 3]], 0, 85];
    const ent = applyRemoteLootDrop(drop);
    expect(ent).not.toBeNull();
    expect(ent!.loot).toEqual([{ item: 'cigs', count: 3 }]);

    // Duplicate ldrop with the same key is ignored.
    expect(applyRemoteLootDrop(drop)).toBeNull();

    pickUpLoot(ent!.id);
    expect(countItem('cigs')).toBe(3);
    expect(allEntities().some((e) => e.id === ent!.id)).toBe(false);
    expect(bridge.sendLootTake).toHaveBeenCalledWith('l:2:1', [], 0);

    // Late ldrop for an already-claimed key is ignored.
    expect(applyRemoteLootDrop(drop)).toBeNull();
  });

  it('syncs partial pickups when inventory is nearly full', () => {
    const bridge = makeBridge({ myId: () => 7 });
    setLootNet(bridge);

    const nonStackable = Object.values(ITEMS).find((i) => !i.stackable && !i.questItem)!;
    expect(nonStackable).toBeDefined();
    // Fill 27 of 28 slots so only 1 non-stackable item fits.
    state.inventory = Array.from({ length: INVENTORY_SIZE }, (_, idx) =>
      idx < INVENTORY_SIZE - 1 ? { item: nonStackable.id, count: 1 } : null,
    );

    const drop: LootSync = ['l:3:9', 'mossbottom', 4, 4, [[nonStackable.id, 2]], 0, 80];
    const ent = applyRemoteLootDrop(drop)!;
    expect(ent).not.toBeNull();

    pickUpLoot(ent.id);
    expect(ent.loot).toEqual([{ item: nonStackable.id, count: 1 }]);
    expect(bridge.sendLootTake).toHaveBeenCalledWith('l:3:9', [[nonStackable.id, 1]], 0);

    // Remote player takes the last remaining item.
    applyRemoteLootTake('l:3:9', [], 0);
    expect(allEntities().some((e) => e.id === ent.id)).toBe(false);
  });
});
