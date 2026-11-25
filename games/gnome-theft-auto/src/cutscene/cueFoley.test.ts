import { describe, it, expect } from 'vitest';
import { createFakeAudio } from '../sound/testing/fakeAudio';
import { FOLEY, INTRO_STINGER } from './cueFoley';
import type { Synth } from './cueFoley';
import { FOLEY_SFX } from './script';

const T = 1;
const LIMIT = T + 2.4 + 0.05;

function check(name: string, synth: Synth) {
  it(`${name} makes sound and finishes within 2.4 s`, () => {
    const { ctx, sources } = createFakeAudio();
    synth(ctx, ctx.destination, T);
    expect(sources.length).toBeGreaterThan(0);
    for (const s of sources) {
      expect(s.started).not.toBeNull();
      expect(s.stopped).not.toBeNull();
      expect(s.stopped!).toBeLessThanOrEqual(LIMIT);
    }
  });
}

describe('cutscene foley', () => {
  for (const id of FOLEY_SFX) check(id, FOLEY[id]);
  check('intro stinger', INTRO_STINGER);
});
