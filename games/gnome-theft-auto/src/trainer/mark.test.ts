import { describe, expect, it } from 'vitest';
import { GTA_SAVE_KEYS, importSaveBundle, type StorageLike } from '../saveIO';
import { markTrainerModified, readTrainerBackup, readTrainerMark, TRAINER_BACKUP_KEY, TRAINER_KEY } from './mark';
import { clearTrainerRegistryForTest, listTrainerSections, listTrainerSpawnables, registerTrainerSection, registerTrainerSpawnable } from './registry';

function mem(init: Record<string, string> = {}): StorageLike & { m: Map<string, string> } {
  const m = new Map(Object.entries(init));
  return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}

describe('trainer mark', () => {
  it('is a save key, the backup is not', () => {
    expect(GTA_SAVE_KEYS as readonly string[]).toContain(TRAINER_KEY);
    expect(GTA_SAVE_KEYS as readonly string[]).not.toContain(TRAINER_BACKUP_KEY);
  });

  it('backs up once, before the first change, and counts changes', () => {
    const s = mem({ 'gta-economy-v1': '{"acorns":50}' });
    const a = markTrainerModified('acorns 9999', s, new Date('2026-01-01T00:00:00Z'));
    expect(a?.count).toBe(1);
    const backup = readTrainerBackup(s)!;
    expect(JSON.parse(backup).data['gta-economy-v1']).toEqual({ acorns: 50 });
    s.setItem('gta-economy-v1', '{"acorns":9999}');
    markTrainerModified('heat 5', s, new Date('2026-01-02T00:00:00Z'));
    expect(JSON.parse(readTrainerBackup(s)!).data['gta-economy-v1']).toEqual({ acorns: 50 });
    const m = readTrainerMark(s)!;
    expect(m.count).toBe(2);
    expect(m.first).toBe('2026-01-01T00:00:00.000Z');
    expect(m.what).toEqual(['acorns 9999', 'heat 5']);
  });

  it('restoring the backup clears the mark', () => {
    const s = mem({ 'gta-economy-v1': '{"acorns":50}' });
    markTrainerModified('x', s);
    expect(importSaveBundle(readTrainerBackup(s)!, s).ok).toBe(true);
    expect(readTrainerMark(s)).toBeNull();
  });
});

describe('trainer registry', () => {
  it('orders sections and groups spawnables', () => {
    clearTrainerRegistryForTest();
    registerTrainerSection({ id: 'b', label: 'B', order: 20, build: () => {} });
    registerTrainerSection({ id: 'a', label: 'A', order: 10, build: () => {} });
    registerTrainerSection({ id: 'a', label: 'A2', order: 30, build: () => {} });
    expect(listTrainerSections().map((s) => s.label)).toEqual(['B', 'A2']);
    registerTrainerSpawnable('Birds', 'robin', 'Robin', () => 'ok');
    registerTrainerSpawnable('Vehicles', 'ride-on', 'Ride-On', () => {});
    registerTrainerSpawnable('Birds', 'wren', 'Wren', () => {});
    expect(listTrainerSpawnables().map((g) => [g.group, g.items.map((i) => i.id)])).toEqual([
      ['Birds', ['robin', 'wren']],
      ['Vehicles', ['ride-on']],
    ]);
    clearTrainerRegistryForTest();
  });
});
