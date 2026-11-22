import { describe, expect, it } from 'vitest';
import { ITEM_KINDS, TUNING } from './config';
import { clearItems, createCollectState, formatCount, rain, rand, scatter, spawnItem, stepCollect } from './collect';
import type { Rect } from './types';

const ROOM: Rect = { x0: -5, z0: -4, x1: 5, z1: 4 };

describe('rand', () => {
  it('is deterministic per seed and differs between seeds', () => {
    const a = createCollectState(42), b = createCollectState(42), c = createCollectState(7);
    const sa = Array.from({ length: 8 }, () => rand(a));
    const sb = Array.from({ length: 8 }, () => rand(b));
    const sc = Array.from({ length: 8 }, () => rand(c));
    expect(sa).toEqual(sb);
    expect(sa).not.toEqual(sc);
    for (const v of sa) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); }
  });
  it('stores the seed as an unsigned 32-bit int', () => {
    expect(createCollectState(-1).seed).toBe(0xffffffff);
  });
});

describe('spawning', () => {
  it('scatter never lands an item on a hidden spot', () => {
    const s = createCollectState(2);
    const hidden = (x: number) => x > 0;
    expect(scatter(s, 'acorn', 30, ROOM, undefined, hidden)).toBe(30);
    expect(s.items.every((it) => it.x <= 0)).toBe(true);
  });
  it('scatter puts every item inside the rectangle and returns n', () => {
    const s = createCollectState(1);
    expect(scatter(s, 'clip', 50, ROOM)).toBe(50);
    expect(s.items).toHaveLength(50);
    for (const i of s.items) {
      expect(i.x).toBeGreaterThanOrEqual(ROOM.x0 + 0.4);
      expect(i.x).toBeLessThanOrEqual(ROOM.x1 - 0.4);
      expect(i.z).toBeGreaterThanOrEqual(ROOM.z0 + 0.4);
      expect(i.z).toBeLessThanOrEqual(ROOM.z1 - 0.4);
      expect(i.y).toBe(TUNING.itemRestY);
    }
  });
  it('spawnItem returns null past maxLiveItems', () => {
    const s = createCollectState(1);
    for (let i = 0; i < TUNING.maxLiveItems; i++) expect(spawnItem(s, 'acorn', 0, 0)).not.toBeNull();
    expect(spawnItem(s, 'acorn', 0, 0)).toBeNull();
    expect(s.items).toHaveLength(TUNING.maxLiveItems);
  });
  it('omits prefab when undefined and keeps it when given', () => {
    const s = createCollectState(1);
    expect('prefab' in spawnItem(s, 'acorn', 0, 0)!).toBe(false);
    expect(spawnItem(s, 'anything', 0, 0, 1, 'chair')!.prefab).toBe('chair');
    clearItems(s, 'acorn');
    expect(s.items.map((i) => i.kind)).toEqual(['anything']);
    clearItems(s);
    expect(s.items).toHaveLength(0);
  });
});

describe('stepCollect', () => {
  it('a collector standing on an item picks it up', () => {
    const s = createCollectState(1);
    s.multiplier = 3;
    const item = spawnItem(s, 'clip', 1, 2)!;
    const got = stepCollect(s, [{ x: 1, y: 0, z: 2 }], 1 / 60);
    const amount = ITEM_KINDS.clip.value * 3;
    expect(got).toEqual([{ id: item.id, kind: 'clip', x: 1, y: TUNING.itemRestY, z: 2, amount, by: 0 }]);
    expect(s.counts.clip).toBe(amount);
    expect(s.total).toBe(amount);
    expect(s.items).toHaveLength(0);
  });
  it('a collector 5 m away picks nothing up until the magnet reaches 6', () => {
    const s = createCollectState(1);
    spawnItem(s, 'acorn', 5, 0);
    const far = [{ x: 0, y: 0, z: 0 }];
    expect(stepCollect(s, far, 0.1)).toEqual([]);
    expect(s.items).toHaveLength(1);
    s.magnet = 6;
    expect(stepCollect(s, far, 0.1)).toHaveLength(1);
    expect(s.items).toHaveLength(0);
  });
  it('the first collector in range takes it', () => {
    const s = createCollectState(1);
    spawnItem(s, 'acorn', 0, 0);
    const got = stepCollect(s, [{ x: 50, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0.1, y: 0, z: 0 }], 0.1);
    expect(got.map((p) => p.by)).toEqual([1]);
  });
  it('rained items fall and come to rest at itemRestY', () => {
    const s = createCollectState(9);
    expect(rain(s, 'sticky', 10, ROOM)).toBe(10);
    for (const i of s.items) { expect(i.falling).toBe(true); expect(i.y).toBeGreaterThanOrEqual(TUNING.rainHeight); }
    for (let k = 0; k < 300; k++) stepCollect(s, [], 1 / 60);
    for (const i of s.items) {
      expect(i.falling).toBe(false);
      expect(i.y).toBe(TUNING.itemRestY);
      expect(i.vy).toBe(0);
    }
    expect(s.t).toBeCloseTo(5);
  });
});

describe('formatCount', () => {
  it.each([
    [0, '0'], [999, '999'], [12345, '12,345'], [1_200_000, '1.2M'], [3e9, '3.0B'], [4.5e12, '4.5T'],
    [1.2e18, '1.2e18'], [Infinity, '∞'], [1e120, '∞'], [NaN, '∞'],
  ])('%s -> %s', (n, out) => {
    expect(formatCount(n)).toBe(out);
  });
});
