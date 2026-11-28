// Every built-in world sound has a recipe that schedules and stops its sources within the duration it returns.
// Run one table: npx vitest run src/sound/recipes -t vehicles   (or combat, critters, world)
import { describe, expect, it } from 'vitest';
import { COMBAT_SOUNDS, CRITTER_SOUNDS, REGION_SOUNDS, STEP_SOUNDS, VEHICLE_SOUNDS, WORLD_SOUNDS, type Recipe } from '../ids';
import { createFakeAudio } from '../testing/fakeAudio';
import { COMBAT_RECIPES } from './combat';
import { CRITTER_RECIPES } from './critters';
import { REGION_RECIPES } from './regions';
import { VEHICLE_RECIPES } from './vehicles';
import { WORLD_RECIPES } from './world';

const TABLES: [string, readonly string[], Partial<Record<string, Recipe>>][] = [
  ['vehicles', VEHICLE_SOUNDS, VEHICLE_RECIPES],
  ['combat', COMBAT_SOUNDS, COMBAT_RECIPES],
  ['critters', CRITTER_SOUNDS, CRITTER_RECIPES],
  ['world', [...STEP_SOUNDS, ...WORLD_SOUNDS], WORLD_RECIPES],
  ['regions', REGION_SOUNDS, REGION_RECIPES],
];

for (const [name, ids, table] of TABLES) {
  describe(name, () => {
    for (const id of ids) {
      it(`${id} plays and stops in time`, () => {
        const recipe = table[id];
        expect(recipe, `missing recipe for ${id}`).toBeTypeOf('function');
        for (const info of [{ dist: 0, rand: 0, param: 0 }, { dist: 150, rand: 0.99, param: 1 }, { dist: 20, rand: 0.5, param: 0.5 }]) {
          const { ctx, sources } = createFakeAudio();
          const t = 1;
          const dur = recipe!(ctx, ctx.destination, t, info);
          expect(Number.isFinite(dur)).toBe(true);
          expect(dur).toBeGreaterThanOrEqual(0.03);
          expect(dur).toBeLessThanOrEqual(10);
          expect(sources.length).toBeGreaterThan(0);
          for (const s of sources) {
            expect(s.started, `${id}: a source never started`).not.toBeNull();
            expect(s.stopped, `${id}: a source never stopped`).not.toBeNull();
            expect(s.stopped!).toBeLessThanOrEqual(t + dur + 0.05);
          }
        }
      });
    }
  });
}
