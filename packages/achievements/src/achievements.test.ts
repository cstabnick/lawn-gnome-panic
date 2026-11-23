import { describe, expect, it } from 'vitest';
import { getPrefab } from '@lawn/prefabs';
import { mergeStates } from './store';
import {
  ACHIEVEMENTS,
  ACHIEVEMENTS_STORAGE_KEY,
  LocalAchievementStore,
  achievementsForGame,
  createAchievementTracker,
  equipmentCatalog,
  emoteCatalog,
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
    expect(achievementsForGame('gnome-golf')).toHaveLength(11);
    expect(achievementsForGame('gnome-bowling')).toHaveLength(5);
    expect(achievementsForGame('gnome-front')).toHaveLength(3);
    expect(equipmentCatalog().length).toBe(ACHIEVEMENTS.filter((a) => a.reward).length);
    expect(emoteCatalog()).toHaveLength(14);
    for (const def of ACHIEVEMENTS) expect(def.reward || def.emote, `${def.id} rewards nothing`).toBeTruthy();
  });

  it('every gear and emote reward belongs to one achievement only', () => {
    const byPrefab = new Map<string, string[]>();
    const byEmote = new Map<string, string[]>();
    for (const def of ACHIEVEMENTS) {
      if (def.reward) byPrefab.set(def.reward.prefabId, [...(byPrefab.get(def.reward.prefabId) ?? []), def.id]);
      if (def.emote) byEmote.set(def.emote.emoteId, [...(byEmote.get(def.emote.emoteId) ?? []), def.id]);
    }
    for (const [prefab, ids] of byPrefab) expect(ids, `${prefab} is granted by ${ids.join(', ')}`).toHaveLength(1);
    for (const [emote, ids] of byEmote) expect(ids, `${emote} is granted by ${ids.join(', ')}`).toHaveLength(1);
  });

  it('a RARE (exclusive) reward is granted by its achievement alone', () => {
    const rare = ACHIEVEMENTS.filter((a) => a.reward?.exclusive);
    expect(rare.length).toBeGreaterThan(0);
    for (const def of rare) {
      const granted = ACHIEVEMENTS.filter((a) => a.reward?.prefabId === def.reward!.prefabId);
      expect(granted.map((a) => a.id), `${def.reward!.prefabId} is RARE`).toEqual([def.id]);
    }
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

  it('keeps both of two unlocks started in the same tick', async () => {
    const storage = fakeStorage();
    const store = new LocalAchievementStore(storage);
    await Promise.all([store.unlock('golf-nice'), store.unlock('bowling-all-gnomes-down')]);
    const state = await new LocalAchievementStore(storage).getState();
    expect(state.records['golf-nice']?.unlockedAt).toBeTruthy();
    expect(state.records['bowling-all-gnomes-down']?.unlockedAt).toBeTruthy();
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

describe('mergeStates', () => {
  it('keeps progress and unlocks earned in either tab', () => {
    const a = { version: 1 as const, records: { x: { progress: 3 }, y: { progress: 1, unlockedAt: '2026-02-01T00:00:00.000Z' } } };
    const b = { version: 1 as const, records: { x: { progress: 5 }, y: { progress: 1, unlockedAt: '2026-01-01T00:00:00.000Z' }, z: { progress: 2 } } };
    expect(mergeStates(a, b).records).toEqual({
      x: { progress: 5 },
      y: { progress: 1, unlockedAt: '2026-01-01T00:00:00.000Z' },
      z: { progress: 2 },
    });
  });
});
