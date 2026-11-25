// Every cutscene ambience bed (EXTRA_BEDS) builds on a fake audio context, wires something into its output gain, and
// its spot sounds run without throwing.
import { describe, expect, it } from 'vitest';
import { createFakeAudio } from '../sound/testing/fakeAudio';
import { EXTRA_BED_BUILDERS, type BedKit } from './cueBeds';
import { EXTRA_BEDS, type ExtraBed } from './script';

interface Probe {
  kit: BedKit;
  loops: number;
  links: AudioNode[][];
  everies: Array<(t: number) => void>;
}

function probeKit(): Probe {
  const { ctx } = createFakeAudio();
  const c = ctx;
  const gain = c.createGain();
  const probe: Probe = { kit: null as unknown as BedKit, loops: 0, links: [], everies: [] };
  probe.kit = {
    c,
    gain,
    loop: () => {
      probe.loops++;
      const s = c.createBufferSource();
      s.start();
      return s;
    },
    filt: (type, f, q = 0.7) => {
      const b = c.createBiquadFilter();
      b.type = type;
      b.frequency.value = f;
      b.Q.value = q;
      return b;
    },
    level: (v) => {
      const g = c.createGain();
      g.gain.value = v;
      return g;
    },
    lfo: () => {},
    link: (...ns) => {
      probe.links.push(ns);
    },
    every: (_minS, _maxS, fn) => {
      probe.everies.push(fn);
    },
  };
  return probe;
}

describe('cutscene ambience beds', () => {
  it('lists the eight batch-3 beds', () => {
    expect([...EXTRA_BEDS].sort()).toEqual(['cave', 'garden', 'market', 'meadow', 'office', 'shore', 'snow', 'storm']);
  });

  for (const bed of EXTRA_BEDS as readonly ExtraBed[]) {
    it(`${bed} builds, makes sound, and its spot sounds run`, () => {
      const p = probeKit();
      expect(() => EXTRA_BED_BUILDERS[bed](p.kit)).not.toThrow();
      // Looping noise or a chained layer that ends at the bed's output gain.
      expect(p.loops + p.links.length).toBeGreaterThan(0);
      expect(p.links.some((chain) => chain[chain.length - 1] === p.kit.gain)).toBe(true);
      // Spot sounds (at most two each) run once without throwing.
      expect(p.everies.length).toBeLessThanOrEqual(2);
      for (const fn of p.everies) expect(() => fn(0.5)).not.toThrow();
    });
  }
});
