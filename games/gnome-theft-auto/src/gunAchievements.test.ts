import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from '@lawn/achievements';
import { getPrefab } from '@lawn/prefabs';
import {
  GUN_ACHIEVEMENT_IDS, crackAchievements, modFitAchievements, shotAchievements, type AchievementSink, type ModFit,
} from './gunAchievements';
import type { GunLoadout } from './gunMods';
import type { GunKind } from './types';

interface Call { fn: 'unlock' | 'increment'; id: string; by?: number }

function fakeSink(): AchievementSink & { calls: Call[] } {
  const calls: Call[] = [];
  return {
    calls,
    unlock: (id: string) => { calls.push({ fn: 'unlock', id }); },
    increment: (id: string, by?: number) => { calls.push({ fn: 'increment', id, by }); },
  };
}

function unlocked(calls: Call[]): string[] {
  return calls.filter((c) => c.fn === 'unlock').map((c) => c.id);
}

function fit(gun: GunKind, loadout: GunLoadout, spent = 0): ModFit {
  return { gun, bought: Object.values(loadout).filter((id): id is string => !!id), spent, loadout };
}

/** A pistol with a mod in every slot it takes. */
const FULL_PISTOL: GunLoadout = {
  optic: 'red-dot', muzzle: 'suppressor', barrel: 'long-barrel', under: 'laser',
  mag: 'speed-mag', stock: 'wire-stock', finish: 'chrome', charm: 'charm-acorn',
};

describe('modFitAchievements', () => {
  it('a fitting that spent something unlocks Bolt-On and adds the spend to Shiny Bits', () => {
    const sink = fakeSink();
    modFitAchievements(fit('pistol', { optic: 'red-dot' }, 180), sink);
    expect(unlocked(sink.calls)).toContain('gta-bolt-on');
    expect(sink.calls).toContainEqual({ fn: 'increment', id: 'gta-gilded', by: 180 });
  });

  it('a fitting that spent 0 unlocks nothing but Hush Hush and Fully Kitted', () => {
    const sink = fakeSink();
    modFitAchievements(fit('pistol', { muzzle: 'suppressor' }, 0), sink);
    expect(unlocked(sink.calls)).toEqual(['gta-hush-hush']);
    expect(sink.calls.some((c) => c.fn === 'increment')).toBe(false);
  });

  it('a fitting that spent 0 and fills every slot unlocks only Hush Hush and Fully Kitted', () => {
    const sink = fakeSink();
    modFitAchievements(fit('pistol', FULL_PISTOL, 0), sink);
    expect(unlocked(sink.calls).sort()).toEqual(['gta-fully-kitted', 'gta-hush-hush']);
  });

  it('Hush Hush needs a suppressor on the muzzle, not a kazoo', () => {
    const sink = fakeSink();
    modFitAchievements(fit('pistol', { muzzle: 'kazoo' }, 60), sink);
    expect(unlocked(sink.calls)).not.toContain('gta-hush-hush');
  });

  it('Fully Kitted needs every slot the gun takes', () => {
    const sink = fakeSink();
    modFitAchievements(fit('pistol', { ...FULL_PISTOL, charm: undefined }, 500), sink);
    expect(unlocked(sink.calls)).not.toContain('gta-fully-kitted');
  });

  it('Fully Kitted fires on a full loadout of a different gun', () => {
    const sink = fakeSink();
    modFitAchievements(fit('smg', { optic: 'long-scope', muzzle: 'brake', barrel: 'ported-barrel', under: 'foregrip', mag: 'drum-mag', stock: 'padded-stock', finish: 'gilded', charm: 'charm-bell' }, 1000), sink);
    expect(unlocked(sink.calls)).toContain('gta-fully-kitted');
  });
});

describe('Roadside Armourer', () => {
  it('a fit made with the Pocket Kit out in the world unlocks gta-pocket-armourer', () => {
    const sink = fakeSink();
    modFitAchievements({ ...fit('pistol', { muzzle: 'kazoo' }, 0), field: true }, sink);
    expect(unlocked(sink.calls)).toContain('gta-pocket-armourer');
  });

  it('a fit made at Ammu-Gnation does not unlock gta-pocket-armourer', () => {
    const sink = fakeSink();
    modFitAchievements(fit('pistol', { muzzle: 'kazoo' }, 60), sink);
    expect(unlocked(sink.calls)).not.toContain('gta-pocket-armourer');
  });
});

describe('shotAchievements', () => {
  it('a kazoo shot unlocks Party Piece', () => {
    const sink = fakeSink();
    shotAchievements('kazoo', sink);
    expect(unlocked(sink.calls)).toEqual(['gta-party-piece']);
  });

  it('a squeaky duck shot unlocks Party Piece', () => {
    const sink = fakeSink();
    shotAchievements('squeak', sink);
    expect(unlocked(sink.calls)).toEqual(['gta-party-piece']);
  });

  it('a stock, suppressed or heavy shot unlocks nothing', () => {
    for (const sound of ['stock', 'suppressed', 'heavy'] as const) {
      const sink = fakeSink();
      shotAchievements(sound, sink);
      expect(sink.calls, sound).toEqual([]);
    }
  });
});

describe('crackAchievements', () => {
  it('a crack at 60 m through a 2x zoom unlocks Long Look', () => {
    const sink = fakeSink();
    crackAchievements({ distance: 60, zoom: 2 }, sink);
    expect(unlocked(sink.calls)).toEqual(['gta-long-look']);
  });

  it('a long crack without aiming does not unlock Long Look', () => {
    const sink = fakeSink();
    crackAchievements({ distance: 90, zoom: 1 }, sink);
    expect(unlocked(sink.calls)).toEqual([]);
  });

  it('a close crack through a scope does not unlock Long Look', () => {
    const sink = fakeSink();
    crackAchievements({ distance: 59.9, zoom: 3.4 }, sink);
    expect(unlocked(sink.calls)).toEqual([]);
  });
});

describe('GUN_ACHIEVEMENT_IDS', () => {
  it('lists exactly the seven Ammu-Gnation achievements', () => {
    expect([...GUN_ACHIEVEMENT_IDS].sort()).toEqual([
      'gta-bolt-on', 'gta-fully-kitted', 'gta-gilded', 'gta-hush-hush', 'gta-long-look', 'gta-party-piece',
      'gta-pocket-armourer',
    ]);
  });

  it('every Ammu-Gnation achievement is in the catalog with a reward prefab that exists', () => {
    for (const id of GUN_ACHIEVEMENT_IDS) {
      const def = ACHIEVEMENTS.find((a) => a.id === id);
      expect(def, id).toBeDefined();
      expect(def?.game).toBe('gnome-theft-auto');
      expect(def?.reward, id).toBeDefined();
      expect(getPrefab(def?.reward?.prefabId ?? ''), id).toBeDefined();
    }
  });

  it('Shiny Bits is a 2,000 Acorn progress counter with an exclusive reward', () => {
    const def = ACHIEVEMENTS.find((a) => a.id === 'gta-gilded');
    expect(def?.target).toBe(2000);
    expect(def?.reward?.exclusive).toBe(true);
  });
});
