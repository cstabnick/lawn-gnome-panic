// Waves: a boat's prop out of the water on a crest makes the outboard race (docs/roadmaps/gta-water-waves.md).
import { describe, expect, it } from 'vitest';
import { conditionMix, engineSoundFor } from './engines';
import { VEHICLES } from '../config';

describe('conditionMix propOut', () => {
  const p = engineSoundFor(VEHICLES['gravy-boat']);
  it('propOut 0 is the old result', () => {
    expect(conditionMix(p, { propOut: 0 })).toEqual(conditionMix(p, {}));
  });
  it('prop out of the water: higher pitch, lower level', () => {
    const base = conditionMix(p, {});
    const out = conditionMix(p, { propOut: 1 });
    expect(out.pitch).toBeGreaterThan(base.pitch);
    expect(out.level).toBeLessThan(base.level);
  });
  it('a stalled engine ignores it', () => {
    expect(conditionMix(p, { stalled: true, propOut: 1 })).toEqual(conditionMix(p, { stalled: true }));
  });
});
