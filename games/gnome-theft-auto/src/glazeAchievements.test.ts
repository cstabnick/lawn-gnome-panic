import { describe, expect, it } from 'vitest';
import { defaultLoadout, type Loadout } from '@lawn/glaze';
import { ACHIEVEMENTS } from '@lawn/achievements';
import { getPrefab } from '@lawn/prefabs';
import { GLAZE_ACHIEVEMENT_IDS, glazeAchievements, type AchievementSink, type GlazePurchase } from './glazeAchievements';

interface Call { fn: 'unlock' | 'increment'; id: string; by?: number }

function fakeSink(): AchievementSink & { calls: Call[] } {
  const calls: Call[] = [];
  return {
    calls,
    unlock: (id: string) => { calls.push({ fn: 'unlock', id }); },
    increment: (id: string, by?: number) => { calls.push({ fn: 'increment', id, by }); },
  };
}

const stock = (): Loadout => defaultLoadout(0xd8342c);

function purchase(before: Loadout, after: Loadout, spent = 10): GlazePurchase {
  return { kind: 'push-bike', before, after, spent };
}

function unlocked(calls: Call[]): string[] {
  return calls.filter((c) => c.fn === 'unlock').map((c) => c.id);
}

/** A loadout that owns every Show Pony part. */
function showPony(): Loadout {
  return {
    ...stock(),
    spoiler: 'picket', ornament: 'hat', seat: 'bench', decal: 'flames', extras: ['dice', 'flag'],
  };
}

describe('glazeAchievements', () => {
  it('a purchase that spent something unlocks New Coat and adds the spend to Full Glaze', () => {
    const sink = fakeSink();
    glazeAchievements(purchase(stock(), stock(), 240), sink);
    expect(unlocked(sink.calls)).toContain('gta-new-coat');
    expect(sink.calls).toContainEqual({ fn: 'increment', id: 'gta-full-glaze', by: 240 });
  });

  it('a purchase that spent 0 does nothing at all', () => {
    const sink = fakeSink();
    glazeAchievements(purchase(stock(), showPony(), 0), sink);
    expect(sink.calls).toEqual([]);
  });

  it('Slammed unlocks when ride height crosses to -0.95 or lower', () => {
    const sink = fakeSink();
    glazeAchievements(purchase(stock(), { ...stock(), rideHeight: -0.95 }), sink);
    expect(unlocked(sink.calls)).toContain('gta-slammed');
  });

  it('Slammed does not unlock when the ride height was already at the bottom', () => {
    const sink = fakeSink();
    glazeAchievements(purchase({ ...stock(), rideHeight: -1 }, { ...stock(), rideHeight: -1 }), sink);
    expect(unlocked(sink.calls)).not.toContain('gta-slammed');
  });

  it('Slammed does not unlock above -0.95', () => {
    const sink = fakeSink();
    glazeAchievements(purchase(stock(), { ...stock(), rideHeight: -0.94 }), sink);
    expect(unlocked(sink.calls)).not.toContain('gta-slammed');
  });

  it('Camber Gang unlocks when both axles lean in by 15 degrees or more', () => {
    const sink = fakeSink();
    glazeAchievements(purchase(stock(), { ...stock(), camberFront: -15, camberRear: -15 }), sink);
    expect(unlocked(sink.calls)).toContain('gta-camber-gang');
  });

  it('Camber Gang does not unlock when only one axle is far enough', () => {
    const sink = fakeSink();
    glazeAchievements(purchase(stock(), { ...stock(), camberFront: -20, camberRear: -14.9 }), sink);
    expect(unlocked(sink.calls)).not.toContain('gta-camber-gang');
  });

  it('Show Pony unlocks with a spoiler, ornament, seat, spray and two extras', () => {
    const sink = fakeSink();
    glazeAchievements(purchase(stock(), showPony()), sink);
    expect(unlocked(sink.calls)).toContain('gta-show-pony');
  });

  it('Show Pony does not unlock with only one extra', () => {
    const sink = fakeSink();
    glazeAchievements(purchase(stock(), { ...showPony(), extras: ['dice'] }), sink);
    expect(unlocked(sink.calls)).not.toContain('gta-show-pony');
  });

  it('Show Pony does not unlock without a spray', () => {
    const sink = fakeSink();
    glazeAchievements(purchase(stock(), { ...showPony(), decal: 'none' }), sink);
    expect(unlocked(sink.calls)).not.toContain('gta-show-pony');
  });

  it('Show Pony does not unlock without a spoiler, ornament or seat', () => {
    for (const part of ['spoiler', 'ornament', 'seat'] as const) {
      const sink = fakeSink();
      glazeAchievements(purchase(stock(), { ...showPony(), [part]: 'none' }), sink);
      expect(unlocked(sink.calls)).not.toContain('gta-show-pony');
    }
  });

  it('GLAZE_ACHIEVEMENT_IDS lists exactly the five Pay \'n\' Glaze achievements in the catalog', () => {
    expect([...GLAZE_ACHIEVEMENT_IDS].sort()).toEqual([
      'gta-camber-gang', 'gta-full-glaze', 'gta-new-coat', 'gta-show-pony', 'gta-slammed',
    ]);
  });

  it('every Pay \'n\' Glaze achievement is in the catalog with a reward prefab that exists', () => {
    for (const id of GLAZE_ACHIEVEMENT_IDS) {
      const def = ACHIEVEMENTS.find((a) => a.id === id);
      expect(def, id).toBeDefined();
      expect(def?.game).toBe('gnome-theft-auto');
      expect(def?.reward, id).toBeDefined();
      expect(getPrefab(def?.reward?.prefabId ?? ''), id).toBeDefined();
    }
  });

  it('Full Glaze is a 1,000 Acorn progress counter with an exclusive reward', () => {
    const def = ACHIEVEMENTS.find((a) => a.id === 'gta-full-glaze');
    expect(def?.target).toBe(1000);
    expect(def?.reward?.exclusive).toBe(true);
  });
});
