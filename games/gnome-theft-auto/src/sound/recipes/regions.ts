// Region and weather spot sounds for the batch-3 places (ids.ts REGION_SOUNDS). Procedural WebAudio only.
// Stubs until E09 issue 07: each is a short placeholder tick so the recipe test passes.
import type { Recipe, RecipeTable, RegionSoundId } from '../ids';
import { burst } from '../synth';

const tick: Recipe = (c, out, t) => {
  burst(c, out, t, 0.05, 'bandpass', 1500, 1500, 0.05);
  return 0.06;
};

export const REGION_RECIPES: RecipeTable<RegionSoundId> = {
  'surf-wash': tick,
  'buoy-bell': tick,
  'snow-creak': tick,
  'icicle-tink': tick,
  'cafe-clink': tick,
  'chapel-chime': tick,
  'grass-hiss': tick,
  'thunder-far': tick,
  'campus-bell': tick,
  'sprinkler-tick': tick,
};
