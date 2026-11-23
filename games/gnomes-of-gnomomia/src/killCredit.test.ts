import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dealDamage, resetCombatState } from './combat';
import { allEntities, COMPANION_TARGET_BASE, encounterOf, clearEncounter, removeEntity, spawnEnemyAt } from './entities';
import { bus } from './events';
import { ENEMIES } from './content';
import { initProgression } from './progression';
import { state } from './state';

describe('kill credit and quest encounters', () => {
  beforeEach(() => {
    resetCombatState();
  });

  afterEach(() => {
    for (const e of allEntities()) removeEntity(e.id);
  });

  it('credits the player for a kill they landed', () => {
    const e = spawnEnemyAt('slug', 20, 20)!;
    const spy = vi.fn();
    bus.on('enemy-killed', spy);
    dealDamage(e.id, 9999, 'crush');
    bus.off('enemy-killed', spy);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatchObject({ byPlayer: true });
  });

  it('does not credit the player for a kill an AI gnome made alone', () => {
    const e = spawnEnemyAt('slug', 20, 20)!;
    const spy = vi.fn();
    bus.on('enemy-killed', spy);
    dealDamage(e.id, 9999, 'crush', { attacker: COMPANION_TARGET_BASE });
    bus.off('enemy-killed', spy);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatchObject({ byPlayer: false });
  });

  it('credits the player when they hit the enemy first and an AI gnome lands the last blow', () => {
    const e = spawnEnemyAt('slug', 20, 20)!;
    const spy = vi.fn();
    bus.on('enemy-killed', spy);
    dealDamage(e.id, 1, 'crush');
    dealDamage(e.id, 9999, 'crush', { attacker: COMPANION_TARGET_BASE - 2 });
    bus.off('enemy-killed', spy);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatchObject({ byPlayer: true });
  });

  it('clears only the living enemies of one encounter, without credit', () => {
    const a = spawnEnemyAt('slug', 20, 20, { encounter: 'q#0' })!;
    const b = spawnEnemyAt('slug', 21, 21, { encounter: 'q#0' })!;
    const plain = spawnEnemyAt('slug', 22, 22)!;
    expect(encounterOf(a.id)).toBe('q#0');
    expect(encounterOf(b.id)).toBe('q#0');
    expect(encounterOf(plain.id)).toBeUndefined();

    const spy = vi.fn();
    bus.on('enemy-killed', spy);
    expect(clearEncounter('q#0')).toBe(2);
    bus.off('enemy-killed', spy);

    const left = allEntities().filter((e) => e.kind === 'enemy');
    expect(left).toHaveLength(1);
    expect(left[0].id).toBe(plain.id);
    expect(spy).not.toHaveBeenCalled();
    expect(clearEncounter('q#0')).toBe(0);
  });

  it('pays a raid spawn (noReward) no XP or loot, even when the player lands the kill', () => {
    ENEMIES['test-raid-slug'] = { ...ENEMIES.slug, id: 'test-raid-slug', noReward: true };
    try {
      initProgression();
      const xpBefore = state.xp;
      const e = spawnEnemyAt('test-raid-slug', 20, 20)!;
      dealDamage(e.id, 9999, 'crush');
      expect(state.xp).toBe(xpBefore);
      expect(allEntities().some((x) => x.kind === 'loot')).toBe(false);
    } finally {
      delete ENEMIES['test-raid-slug'];
    }
  });
});
