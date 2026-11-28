// Every workplace sound id is registered on the bus, and every recipe renders without throwing and stops in time.
import { describe, expect, it } from 'vitest';
import { hasSound } from '../sound/bus';
import { createFakeAudio } from '../sound/testing/fakeAudio';
import { WORK_RECIPES, WORK_SOUND_IDS, registerWorkSounds } from './sounds';

describe('workplace sounds', () => {
  it('registers a sound for every id (idempotent)', () => {
    registerWorkSounds();
    registerWorkSounds();
    for (const id of WORK_SOUND_IDS) expect(hasSound(id), `${id} not registered`).toBe(true);
  });

  for (const id of WORK_SOUND_IDS) {
    it(`${id} plays and stops in time`, () => {
      const recipe = WORK_RECIPES[id];
      expect(recipe, `missing recipe for ${id}`).toBeTypeOf('function');
      for (const info of [{ dist: 0, rand: 0, param: 0 }, { dist: 20, rand: 0.99, param: 1 }, { dist: 5, rand: 0.5, param: 0.5 }]) {
        const { ctx, sources } = createFakeAudio();
        const t = 1;
        const dur = recipe(ctx, ctx.destination, t, info);
        expect(Number.isFinite(dur)).toBe(true);
        expect(dur).toBeGreaterThanOrEqual(0.1);
        expect(dur).toBeLessThanOrEqual(1.5);
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
