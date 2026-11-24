// Recipes are data only: the effects are applied in src/game/useItem.ts. Rules ask for tags, never item ids.
import type { Tag } from './defs';
import type { RecipeDef, RecipeId } from '../game/types';

export interface CampfireMeal {
  id: string;
  name: string;
  inputs: readonly { tag: Tag; count: number }[];
  water: number;
  needsFire: true;
  food: number;
  warmth: number;
  calm: number;
  summary: string;
}

export const CAMPFIRE_MEALS: readonly CampfireMeal[] = [
  {
    id: 'roast-apple',
    name: 'Roasted Apple',
    inputs: [{ tag: 'FOOD', count: 1 }],
    water: 0,
    needsFire: true,
    food: 28,
    warmth: 20,
    calm: 10,
    summary: 'Blistered over embers for sweet, warm energy.',
  },
  {
    id: 'mushroom-skewer',
    name: 'Charred Skewer',
    inputs: [{ tag: 'FOOD', count: 1 }, { tag: 'TINDER', count: 1 }],
    water: 0,
    needsFire: true,
    food: 35,
    warmth: 20,
    calm: 10,
    summary: 'Skewered bites seared crisp on a peeled twig.',
  },
  {
    id: 'hearth-stew',
    name: 'Hearth Stew',
    inputs: [{ tag: 'FOOD', count: 2 }],
    water: 0.25,
    needsFire: true,
    food: 52,
    warmth: 28,
    calm: 15,
    summary: 'Thick bubbling potage that staves off the chill.',
  },
  {
    id: 'spiced-cider',
    name: 'Spiced Cider',
    inputs: [{ tag: 'FOOD', count: 1 }],
    water: 0.3,
    needsFire: true,
    food: 22,
    warmth: 34,
    calm: 22,
    summary: 'Steaming garden cider that steadies shaky hands.',
  },
  {
    id: 'glazed-berry-tart',
    name: 'Glazed Berry Tart',
    inputs: [{ tag: 'FOOD', count: 2 }],
    water: 0,
    needsFire: true,
    food: 44,
    warmth: 18,
    calm: 24,
    summary: 'Caramelized hedgerow berries over toasted crust.',
  },
  {
    id: 'acorn-flatbread',
    name: 'Acorn Flatbread',
    inputs: [{ tag: 'FOOD', count: 1 }, { tag: 'SALT', count: 1 }],
    water: 0.15,
    needsFire: true,
    food: 40,
    warmth: 22,
    calm: 12,
    summary: 'Salted hearthcake baked on a flat grave-stone.',
  },
  {
    id: 'herbal-moss-tea',
    name: 'Herbal Moss-Ward Tea',
    inputs: [{ tag: 'MOSS', count: 1 }],
    water: 0.25,
    needsFire: true,
    food: 8,
    warmth: 36,
    calm: 30,
    summary: 'Bitter aromatic brew that warms the core and calms nerves.',
  },
  {
    id: 'wild-mushroom-soup',
    name: 'Wild Mushroom Soup',
    inputs: [{ tag: 'FOOD', count: 1 }, { tag: 'SALT', count: 1 }],
    water: 0.25,
    needsFire: true,
    food: 46,
    warmth: 30,
    calm: 16,
    summary: 'Savory broth simmered slowly beside the coals.',
  },
  {
    id: 'campfire-toast',
    name: 'Campfire Toast',
    inputs: [{ tag: 'FOOD', count: 1 }, { tag: 'FUEL', count: 1 }],
    water: 0,
    needsFire: true,
    food: 30,
    warmth: 24,
    calm: 14,
    summary: 'Crisp, smoky slices toasted right against the flame.',
  },
  {
    id: 'trail-ration-pack',
    name: 'Trail Ration Pack',
    inputs: [{ tag: 'FOOD', count: 2 }, { tag: 'SALT', count: 1 }],
    water: 0.1,
    needsFire: true,
    food: 60,
    warmth: 20,
    calm: 18,
    summary: 'Salted, fire-dried provisions built for long cemetery treks.',
  },
];

export const RECIPES: readonly RecipeDef[] = [
  { id: 'campfire', name: 'Lay and light a fire', inputs: [{ tag: 'TINDER', count: 1 }, { tag: 'FUEL', count: 1 }], water: 0, tool: 'FIRESTARTER', seconds: 20, needsFire: false },
  { id: 'salt-wash', name: 'Salt wash a crack', inputs: [{ tag: 'SALT', count: 1 }], water: 0.2, tool: null, seconds: 10, needsFire: false },
  { id: 'spirit-wash', name: 'Wash a crack with spirit', inputs: [{ tag: 'SPIRIT', count: 1 }], water: 0, tool: null, seconds: 10, needsFire: false },
  { id: 'scrape-seal', name: 'Scrape out the moss and seal it', inputs: [{ tag: 'SPIRIT', count: 1 }, { tag: 'ADHESIVE', count: 1 }], water: 0, tool: 'CUT', seconds: 30, needsFire: false },
  { id: 'boil-water', name: 'Boil dirty water', inputs: [], water: 0, tool: 'COOK_VESSEL', seconds: 35, needsFire: true },
  { id: 'mend-glaze', name: 'Glaze a crack', inputs: [{ tag: 'GLAZE', count: 1 }], water: 0, tool: null, seconds: 25, needsFire: false },
  { id: 'roast-apple', name: 'Cook: Roasted Apple', inputs: [{ tag: 'FOOD', count: 1 }], water: 0, tool: null, seconds: 12, needsFire: true },
  { id: 'mushroom-skewer', name: 'Cook: Charred Skewer', inputs: [{ tag: 'FOOD', count: 1 }, { tag: 'TINDER', count: 1 }], water: 0, tool: null, seconds: 14, needsFire: true },
  { id: 'hearth-stew', name: 'Cook: Hearth Stew', inputs: [{ tag: 'FOOD', count: 2 }], water: 0.25, tool: null, seconds: 18, needsFire: true },
  { id: 'spiced-cider', name: 'Cook: Spiced Cider', inputs: [{ tag: 'FOOD', count: 1 }], water: 0.3, tool: null, seconds: 15, needsFire: true },
];

export function getRecipe(id: RecipeId): RecipeDef {
  const r = RECIPES.find((x) => x.id === id);
  if (!r) throw new Error(`unknown recipe ${id}`);
  return r;
}
