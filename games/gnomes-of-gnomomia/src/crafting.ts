// Reforging: recipes at reforging anvils turn raid gear (plus coins) into a new piece. docs/design/gnomomia/raids.md.
import { UI } from './config';
import { ITEMS, OBJECTS, RECIPES } from './content';
import { bus, say } from './events';
import { addItem, countItem, removeItem } from './inventory';
import { checkCondition } from './quests';
import type { RecipeDef } from './raidTypes';
import { state } from './state';

export interface CraftCheck { ok: boolean; why: string | null }

/** True for an object that is a reforging anvil (model 'anvil'). */
export function isCraftStation(objectId: string): boolean {
  return OBJECTS[objectId]?.model === 'anvil';
}

/** The recipes an anvil offers, by the made item's ilvl, then name. */
export function recipesAt(stationId: string): RecipeDef[] {
  const name = (item: string): string => ITEMS[item]?.name ?? item;
  return Object.values(RECIPES)
    .filter((r) => r.station === stationId)
    .sort((a, b) => (ITEMS[a.makes]?.ilvl ?? 0) - (ITEMS[b.makes]?.ilvl ?? 0) || name(a.makes).localeCompare(name(b.makes)));
}

/** Says what is missing for a recipe. The first failure wins. */
export function craftCheck(recipe: RecipeDef): CraftCheck {
  if (!checkCondition(recipe.when)) return { ok: false, why: 'Not yet.' };
  for (const need of recipe.needs) {
    if (countItem(need.item) >= need.count) continue;
    const name = ITEMS[need.item]?.name ?? need.item;
    const worn = Object.values(state.equipment).includes(need.item);
    return { ok: false, why: worn ? `Take off ${name} first.` : `Needs ${name}.` };
  }
  if (state.gold < recipe.gold) return { ok: false, why: `Needs ${recipe.gold} coins.` };
  return { ok: true, why: null };
}

/** Makes the recipe: takes the ingredients and coins, gives the new piece. False (nothing taken) if it cannot be made. */
export function craft(recipeId: string): boolean {
  const recipe = RECIPES[recipeId];
  if (!recipe) {
    say('You cannot make that.', UI.bad);
    return false;
  }
  const check = craftCheck(recipe);
  if (!check.ok) {
    say(check.why ?? 'You cannot make that.', UI.bad);
    return false;
  }

  // Room check: the new piece needs a slot once the ingredients are gone. Restore the pack if it does not fit.
  const snapshot = state.inventory.map((s) => (s ? { ...s } : null));
  for (const need of recipe.needs) removeItem(need.item, need.count);
  if (!addItem(recipe.makes, 1)) {
    state.inventory.splice(0, state.inventory.length, ...snapshot);
    bus.emit('changed', {});
    return false;
  }
  state.gold -= recipe.gold;

  const name = ITEMS[recipe.makes]?.name ?? recipe.makes;
  say(`You reforge the ${name}.`, UI.good);
  bus.emit('item-crafted', { recipeId, item: recipe.makes });
  bus.emit('changed', {});
  return true;
}
