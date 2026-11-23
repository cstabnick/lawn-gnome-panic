import { describe, expect, it } from 'vitest';
import { exportSaveBundle, GTA_SAVE_KEYS, importSaveBundle, resetSaveBundle, type StorageLike } from './saveIO';

function fakeStorage(initial: Record<string, string> = {}): StorageLike & { dump: () => Record<string, string> } {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => { map.set(k, v); },
    removeItem: (k) => { map.delete(k); },
    dump: () => Object.fromEntries(map),
  };
}

describe('saveIO', () => {
  it('round-trips export -> reset -> import across all GTA save keys', () => {
    const store = fakeStorage({
      'gta-quests-v1': JSON.stringify({ 'prologue-fresh-kiln': { state: 'done', step: 2, cracked: [] } }),
      'gta-economy-v1': JSON.stringify({ acorns: 420, debtRemaining: 3500, debtPaidOff: false }),
      'gta-collectibles-v1': JSON.stringify({ acorns: ['a1'], shards: [], signs: ['s1'] }),
      'gta-glaze-v1': JSON.stringify({ 'ride-on': 'g1.x' }),
      'gta-gunmods-v1': JSON.stringify({ owned: { pistol: ['red-dot'] }, fitted: { pistol: 'o0' } }),
      'gta-garage': JSON.stringify({ lowrider: { grip: 1.2 } }),
      'gta-stunts-v1': JSON.stringify(['big-air']),
      'gta-speedway-laps-v1': JSON.stringify({ best: { 'ride-on': { time: 61.5, splits: [20, 41] } } }),
      'gta-boats-helmed-v1': JSON.stringify(['gravy-boat']),
      'gta-intro-seen-v1': '1',
      'unrelated-key': 'keep-me',
    });

    const bundle = exportSaveBundle(store);
    expect(bundle.format).toBe('gta-save/v1');
    expect(Object.keys(bundle.data).sort()).toEqual([...GTA_SAVE_KEYS].sort());
    expect(GTA_SAVE_KEYS).toContain('gta-glaze-v1');

    resetSaveBundle(store);
    expect(store.getItem('gta-quests-v1')).toBeNull();
    expect(store.getItem('gta-economy-v1')).toBeNull();
    expect(store.getItem('gta-collectibles-v1')).toBeNull();
    expect(store.getItem('gta-glaze-v1')).toBeNull();
    expect(store.getItem('unrelated-key')).toBe('keep-me');

    const res = importSaveBundle(JSON.stringify(bundle), store);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.keys.sort()).toEqual([...GTA_SAVE_KEYS].sort());
    expect(exportSaveBundle(store).data).toEqual(bundle.data);
  });

  it('rejects invalid JSON and wrong format without mutating storage', () => {
    const store = fakeStorage({ 'gta-economy-v1': JSON.stringify({ acorns: 99 }) });
    expect(importSaveBundle('{bad json', store).ok).toBe(false);
    expect(importSaveBundle(JSON.stringify({ format: 'wrong', data: {} }), store).ok).toBe(false);
    expect(importSaveBundle(JSON.stringify({ format: 'gta-save/v1', data: [] }), store).ok).toBe(false);
    expect(JSON.parse(store.getItem('gta-economy-v1')!)).toEqual({ acorns: 99 });
  });

  it('ignores unknown keys and clears absent GTA keys on import', () => {
    const store = fakeStorage({
      'gta-quests-v1': JSON.stringify({ old: { state: 'active', step: 0, cracked: [] } }),
    });
    const res = importSaveBundle(JSON.stringify({
      format: 'gta-save/v1',
      data: {
        'gta-economy-v1': { acorns: 777, debtRemaining: 0, debtPaidOff: true },
        'evil-extra-key': { hack: true },
      },
    }), store);

    expect(res).toEqual({ ok: true, keys: ['gta-economy-v1'] });
    expect(store.getItem('gta-quests-v1')).toBeNull();
    expect(store.getItem('evil-extra-key')).toBeNull();
    expect(JSON.parse(store.getItem('gta-economy-v1')!)).toEqual({ acorns: 777, debtRemaining: 0, debtPaidOff: true });
  });
});
