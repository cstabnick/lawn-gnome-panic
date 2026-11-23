import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { RECIPES } from './content';
import { bus } from './events';
import { addItem, countItem } from './inventory';
import { craft, craftCheck, isCraftStation, recipesAt } from './crafting';
import { newGameState, state } from './state';
import type { RecipeDef } from './raidTypes';

const TEST_RECIPE: RecipeDef = {
  id: 'test-recipe',
  station: 'raid-anvil-sodbury',
  makes: 'c4-ribbon-wand',
  needs: [{ item: 'beetle-shell', count: 1 }],
  gold: 50,
};

describe('reforging', () => {
  beforeEach(() => {
    Object.assign(state, newGameState());
    RECIPES['test-recipe'] = TEST_RECIPE;
  });

  afterEach(() => {
    delete RECIPES['test-recipe'];
  });

  it('says what is missing: the ingredient first, then the coins', () => {
    const none = craftCheck(TEST_RECIPE);
    expect(none.ok).toBe(false);
    expect(none.why?.startsWith('Needs')).toBe(true);

    addItem('beetle-shell', 1);
    state.gold = 10;
    expect(craftCheck(TEST_RECIPE)).toEqual({ ok: false, why: 'Needs 50 coins.' });
  });

  it('makes the piece, takes the ingredients and coins, and reports the event', () => {
    addItem('beetle-shell', 1);
    state.gold = 60;
    const made: string[] = [];
    const onMade = (p: { recipeId: string }) => made.push(p.recipeId);
    bus.on('item-crafted', onMade);

    try {
      expect(craft('test-recipe')).toBe(true);
    } finally {
      bus.off('item-crafted', onMade);
    }

    expect(state.gold).toBe(10);
    expect(countItem('c4-ribbon-wand')).toBe(1);
    expect(countItem('beetle-shell')).toBe(0);
    expect(made).toEqual(['test-recipe']);
  });

  it('does nothing when the craft is not possible', () => {
    addItem('beetle-shell', 1);
    state.gold = 10;
    expect(craft('test-recipe')).toBe(false);
    expect(countItem('beetle-shell')).toBe(1);
    expect(state.gold).toBe(10);
  });

  it('lists the recipe at its anvil and recognises anvils', () => {
    expect(recipesAt('raid-anvil-sodbury').map((r) => r.id)).toContain('test-recipe');
    expect(isCraftStation('raid-anvil-sodbury')).toBe(true);
    expect(isCraftStation('no-such-object')).toBe(false);
  });
});
