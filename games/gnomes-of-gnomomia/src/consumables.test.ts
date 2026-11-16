import { beforeEach, describe, expect, it } from 'vitest';
import { PLAYER_ID } from './config';
import { ITEMS, NPCS } from './content';
import { hasStatus, resetCombatState, statusSecondsLeft, updateCombat } from './combat';
import { addItem, countItem, useFromSlot } from './inventory';
import { maxHp, newGameState, state } from './state';

describe('cigs and beer shop consumables', () => {
  beforeEach(() => {
    Object.assign(state, newGameState());
    resetCombatState();
  });

  it('are defined in ITEMS and stocked in Mossbottom and Thatchford shops', () => {
    expect(ITEMS.cigs).toBeDefined();
    expect(ITEMS.beer).toBeDefined();
    expect(ITEMS.cigs.kind).toBe('potion');
    expect(ITEMS.beer.kind).toBe('potion');
    expect(NPCS.tansy.shop).toContain('cigs');
    expect(NPCS.tansy.shop).toContain('beer');
    expect(NPCS.puddleby.shop).toContain('cigs');
    expect(NPCS.puddleby.shop).toContain('beer');
  });

  it('using cigs consumes one and applies the smoking status', () => {
    addItem('cigs', 2);
    const slot = state.inventory.findIndex((s) => s?.item === 'cigs');
    expect(slot).toBeGreaterThanOrEqual(0);

    useFromSlot(slot);

    expect(countItem('cigs')).toBe(1);
    expect(hasStatus(PLAYER_ID, 'smoking')).toBe(true);
    expect(statusSecondsLeft(PLAYER_ID, 'smoking')).toBeGreaterThan(0);

    updateCombat(46);
    expect(hasStatus(PLAYER_ID, 'smoking')).toBe(false);
  });

  it('using beer consumes one, mildly heals, and applies the tipsy status', () => {
    state.hp = Math.max(1, maxHp() - 10);
    const beforeHp = state.hp;
    addItem('beer', 1);
    const slot = state.inventory.findIndex((s) => s?.item === 'beer');
    expect(slot).toBeGreaterThanOrEqual(0);

    useFromSlot(slot);

    expect(countItem('beer')).toBe(0);
    expect(state.hp).toBe(beforeHp + (ITEMS.beer.heal ?? 0));
    expect(hasStatus(PLAYER_ID, 'tipsy')).toBe(true);
    expect(statusSecondsLeft(PLAYER_ID, 'tipsy')).toBeGreaterThan(0);

    updateCombat(46);
    expect(hasStatus(PLAYER_ID, 'tipsy')).toBe(false);
  });
});
