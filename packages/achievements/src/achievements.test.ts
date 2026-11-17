import { describe, expect, it } from 'vitest';
import { getPrefab } from '@lawn/prefabs';
import {
  ACHIEVEMENTS,
  ACHIEVEMENTS_STORAGE_KEY,
  LocalAchievementStore,
  achievementsForGame,
  createAchievementTracker,
  equipmentCatalog,
  getAchievement,
  type EquipSlot,
  type StorageLike,
} from './index';

function fakeStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => { map.set(k, v); },
  };
}

const SLOT_USE: Record<EquipSlot, string> = {
  head: 'wear-head',
  back: 'wear-back',
  neck: 'wear-neck',
  hand: 'hold',
};

describe('achievements catalog', () => {
  it('has unique ids and valid prefab rewards', () => {
    const ids = new Set<string>();
    for (const def of ACHIEVEMENTS) {
      expect(ids.has(def.id), `duplicate ${def.id}`).toBe(false);
      ids.add(def.id);
      if (def.reward) {
        const prefab = getPrefab(def.reward.prefabId);
        expect(prefab, `missing prefab ${def.reward.prefabId}`).toBeDefined();
        expect(prefab!.uses, `${def.reward.prefabId} missing ${SLOT_USE[def.reward.slot]}`).toContain(SLOT_USE[def.reward.slot]);
      }
    }
    expect(achievementsForGame('gnome-golf')).toHaveLength(5);
    expect(achievementsForGame('gnome-bowling')).toHaveLength(3);
    expect(achievementsForGame('gnome-front')).toHaveLength(1);
    expect(equipmentCatalog().length).toBe(ACHIEVEMENTS.length);
  });
});

describe('LocalAchievementStore', () => {
  it('unlocks once and persists to storage', async () => {
    const storage = fakeStorage();
    const store = new LocalAchievementStore(storage, () => new Date('2026-11-16T12:00:00Z'));

    const first = await store.unlock('golf-nice');
    expect(first.unlockedNow).toBe(true);
    expect(first.progress).toBe(1);

    const second = await store.unlock('golf-nice');
    expect(second.unlockedNow).toBe(false);

    const persisted = new LocalAchievementStore(storage);
    const state = await persisted.getState();
    expect(state.records['golf-nice']?.unlockedAt).toBe('2026-11-16T12:00:00.000Z');
    expect(JSON.parse(storage.getItem(ACHIEVEMENTS_STORAGE_KEY)!).version).toBe(1);
  });

  it('tracks progressive achievements until target', async () => {
    const store = new LocalAchievementStore(fakeStorage());
    const r1 = await store.increment('front-harvest-season');
    expect(r1.unlockedNow).toBe(false);
    expect(r1.progress).toBe(1);
    expect(r1.target).toBe(3);

    const r2 = await store.increment('front-harvest-season');
    expect(r2.unlockedNow).toBe(false);
    expect(r2.progress).toBe(2);

    const r3 = await store.increment('front-harvest-season');
    expect(r3.unlockedNow).toBe(true);
    expect(r3.progress).toBe(3);

    const r4 = await store.increment('front-harvest-season');
    expect(r4.unlockedNow).toBe(false);
  });

  it('fires onUnlock only on first unlock in tracker', async () => {
    const store = new LocalAchievementStore(fakeStorage());
    const unlocked: string[] = [];
    const tracker = createAchievementTracker({ store, onUnlock: (d) => unlocked.push(d.id) });

    await tracker.unlock('bowling-all-gnomes-down');
    await tracker.unlock('bowling-all-gnomes-down');
    expect(unlocked).toEqual(['bowling-all-gnomes-down']);
    expect(await tracker.isUnlocked('bowling-all-gnomes-down')).toBe(true);
    expect(getAchievement('bowling-all-gnomes-down')?.reward?.prefabId).toBe('bowling-pin-hat');
  });
});
