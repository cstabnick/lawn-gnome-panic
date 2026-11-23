// Recipes are data only: the effects are applied in src/game/useItem.ts. Rules ask for tags, never item ids.
import type { RecipeDef, RecipeId } from '../game/types';

export const RECIPES: readonly RecipeDef[] = [
  { id: 'campfire', name: 'Lay and light a fire', inputs: [{ tag: 'TINDER', count: 1 }, { tag: 'FUEL', count: 1 }], water: 0, tool: 'FIRESTARTER', seconds: 20, needsFire: false },
  { id: 'salt-wash', name: 'Salt wash a crack', inputs: [{ tag: 'SALT', count: 1 }], water: 0.2, tool: null, seconds: 10, needsFire: false },
  { id: 'spirit-wash', name: 'Wash a crack with spirit', inputs: [{ tag: 'SPIRIT', count: 1 }], water: 0, tool: null, seconds: 10, needsFire: false },
  { id: 'scrape-seal', name: 'Scrape out the moss and seal it', inputs: [{ tag: 'SPIRIT', count: 1 }, { tag: 'ADHESIVE', count: 1 }], water: 0, tool: 'CUT', seconds: 30, needsFire: false },
  { id: 'boil-water', name: 'Boil dirty water', inputs: [], water: 0, tool: 'COOK_VESSEL', seconds: 35, needsFire: true },
  { id: 'mend-glaze', name: 'Glaze a crack', inputs: [{ tag: 'GLAZE', count: 1 }], water: 0, tool: null, seconds: 25, needsFire: false },
];

export function getRecipe(id: RecipeId): RecipeDef {
  const r = RECIPES.find((x) => x.id === id);
  if (!r) throw new Error(`unknown recipe ${id}`);
  return r;
}
