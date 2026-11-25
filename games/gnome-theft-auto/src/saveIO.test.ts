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
      'gta-lockup-v1': JSON.stringify({ v: 1, slots: { ground: [], air: [], water: [] } }),
      'gta-estates-v1': JSON.stringify({ v: 1, owned: { air: true, water: false } }),
      'gta-hunting-v1': JSON.stringify({ v: 1, licensed: true, bag: { 'tuft-fox': 2 }, journal: {}, sold: 0, earned: 0 }),
      'gta-craft-tune-v1': JSON.stringify({ 'gravy-boat': { engine: 1, topSpeed: 0, handling: 0, lift: 0 } }),
      'gta-air-flown-v1': JSON.stringify(['hedge-hopper']),
      'gta-birding-v1': JSON.stringify({ v: 1, seen: { 'hedge-robin': { first: '2026-11-23', count: 2 } }, heard: [], photos: [], claimed: 0, optics: 0 }),
      'gta-trainer-v1': JSON.stringify({ modified: true, first: '2026-01-01T00:00:00.000Z', last: '2026-01-01T00:00:00.000Z', count: 1, what: ['x'] }),
      'gta-sky-v1': JSON.stringify(['acorn-cola-1', '#spotted']),
      'gta-fishing-v1': JSON.stringify({ v: 1, rods: ['twig'], rod: 'twig', baits: { 'cheese-rind': 4 }, bait: 'cheese-rind', journal: { 'fish-gudgeon': { caught: 2, best: 14, first: '2026-11-23' } }, cards: [{ id: 'fish-gudgeon', size: 14 }], caught: 2, sold: 1, earned: 4, derbyBest: 0 }),
      'gta-jobs-v1': JSON.stringify({ v: 1, jobs: { taxi: { xp: 120, done: 3, failed: 0, earned: 90, bestTip: 9, fiveStars: 1, licensed: true } }, parcels: 0, tubeSeconds: 12 }),
      'gta-outskirts-v1': JSON.stringify({ v: 1, visited: true, shops: ['diner'], souvenirs: ['postcard'], wished: 3, wellJackpot: false, knocked: false }),
      'gta-mowing-v1': JSON.stringify({ v: 1, total: 12, lawn: 3, byKind: { 'wheat-patch': 12 } }),
      'gta-odd-rides-v1': JSON.stringify(['pot-rod']),
      'gta-inventory-v1': JSON.stringify({ v: 1, items: { 'seed-cake': 2 }, quick: 'seed-cake' }),
      'gta-ownership-v1': JSON.stringify({ v: 1, properties: [], policies: {}, wrecks: [], bought: {} }),
      'gta-position-v1': JSON.stringify({ v: 1, x: 12, z: -40, yaw: 1.2, t: 1 }),
      'gta-gnomeybird-v1': JSON.stringify({ best: 7 }),
      'gta-home-v1': JSON.stringify({ v: 1, items: [], stored: { bed: 1 }, wall: 'cream', floor: 'oak' }),
      'gta-homes-visited-v1': JSON.stringify(['juniper']),
      'gta-winter-v1': JSON.stringify({ v: 1, best: { 'wool-run': 31.5 }, runs: { 'wool-run': 2 } }),
      'gta-golf-v1': JSON.stringify({ v: 1, boardBroken: true, holesPlayed: 4, parHoles: 2, rounds: 1, best: [4, null, null, 5], bestRound: 19, aces: 0, ballsFound: ['lb-1'], molehills: [] }),
      'gta-rootwell-v1': JSON.stringify({ v: 1, doors: ['long-shelf'] }),
      'gta-farm-v1': JSON.stringify({ v: 1, savedAt: 1, beds: [], seed: 'radish' }),
      'gta-country-v1': JSON.stringify({ v: 1, sites: ['construction-1'], camps: [], deer: 0, mansion: false }),
      'gta-camp-loot-v1': JSON.stringify({ 'camp-west-1': 1 }),
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

  it('every GTA save key survives export, reset and import on its own', () => {
    const initial: Record<string, string> = {};
    for (const k of GTA_SAVE_KEYS) initial[k] = '{"x":1}';
    const store = fakeStorage(initial);

    const bundle = exportSaveBundle(store);
    for (const k of GTA_SAVE_KEYS) expect(bundle.data[k]).toEqual({ x: 1 });

    resetSaveBundle(store);
    for (const k of GTA_SAVE_KEYS) expect(store.getItem(k)).toBeNull();

    const res = importSaveBundle(JSON.stringify(bundle), store);
    expect(res.ok).toBe(true);
    for (const k of GTA_SAVE_KEYS) expect(store.getItem(k)).toBe('{"x":1}');
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
