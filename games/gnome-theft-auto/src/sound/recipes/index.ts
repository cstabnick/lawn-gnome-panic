// Every built-in world-sound recipe, merged from the per-theme tables.
import type { RecipeTable } from '../ids';
import { COMBAT_RECIPES } from './combat';
import { CRITTER_RECIPES } from './critters';
import { VEHICLE_RECIPES } from './vehicles';
import { WORLD_RECIPES } from './world';

export const RECIPES: RecipeTable = { ...VEHICLE_RECIPES, ...COMBAT_RECIPES, ...CRITTER_RECIPES, ...WORLD_RECIPES };
