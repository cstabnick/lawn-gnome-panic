import { describe, expect, it } from 'vitest';
import { generateWorld } from './world';
import type { HillParams } from './descent/types';

/** FNV-1a of a string (no node types needed). */
function fnv(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16);
}

// The free-ride mountain must not change: fingerprints of the worlds from before Descent existed (hazards and the
// race course's bumpers left out: they are laid on top of it from their own random stream).
const CLASSIC: [number, string, number][] = [
  [3, 'e4e0de54', 267421],
  [7, '34ae16c1', 234953],
  [42, '8321ccfb', 234339],
];

const DESCENT_KEYS = new Set(['hazards', 'bumpers', 'race', 'drops', 'theme']);

describe('free-ride worlds', () => {
  it('are unchanged by the Descent options', () => {
    for (const [seed, hash, len] of CLASSIC) {
      const w = generateWorld(seed);
      // Free ride's race course: rocks and spikes only (no Descent trees), and bumpers.
      expect(w.hazards.every((hz) => hz.kind === 'rock' || hz.kind === 'spike')).toBe(true);
      expect(w.bumpers.length).toBeGreaterThan(0);
      expect(w.theme).toBe('aether');
      for (const isl of w.islands) expect(isl.drops).toEqual([]);
      // Keys added for Descent (and side-mountain rails) are left out to verify the base free-ride world is unchanged.
      const base = { ...w, rails: w.rails.filter((r) => !r.side) };
      const j = JSON.stringify(base, (k, v) => (DESCENT_KEYS.has(k) ? undefined : v));
      expect(j.length, `seed ${seed}`).toBe(len);
      expect(fnv(j), `seed ${seed}`).toBe(hash);
    }
  });
});

describe('descent hills', () => {
  const SEEDS = [1, 2, 3];
  const EXTREMES = [0, 5];
  const hills: HillParams[] = [];
  for (const hazard of EXTREMES) for (const steep of EXTREMES) for (const tricky of EXTREMES) {
    hills.push({ hazard, steep, tricky, runs: 5 });
  }

  it('build the requested number of finite islands for every slider extreme', () => {
    for (const seed of SEEDS) {
      for (const hill of hills) {
        const tag = `seed ${seed} ${JSON.stringify(hill)}`;
        const w = generateWorld(seed, hill);
        expect(w.islands.length, tag).toBe(5);
        expect(Number.isFinite(w.gate.pos.x) && Number.isFinite(w.gate.pos.y) && Number.isFinite(w.gate.pos.z), tag).toBe(true);
        for (const isl of w.islands) expect(Number.isFinite(isl.baseY), tag).toBe(true);
        if (hill.hazard === 0) {
          // Hazard 0: only the edge pines, clear of the centre line.
          for (const hz of w.hazards) {
            expect(hz.kind, tag).toBe('tree');
            const isl = w.islands[hz.island];
            const sd = (hz.x - isl.cx) * isl.dz - (hz.z - isl.cz) * isl.dx;
            expect(Math.abs(sd) >= 0.8 * isl.r, tag).toBe(true);
          }
        } else expect(w.hazards.length, tag).toBeGreaterThan(0);
        for (const hz of w.hazards) {
          const vals = [hz.x, hz.y, hz.z, hz.r, hz.h];
          expect(vals.every((v) => Number.isFinite(v)), tag).toBe(true);
          expect(Number.isInteger(hz.island) && hz.island >= 0 && hz.island < 5, tag).toBe(true);
          if (hz.kind === 'tree') {
            expect(hz.r >= 0.7 && hz.r <= 1.0, tag).toBe(true);
            expect(hz.h >= 9 && hz.h <= 16, tag).toBe(true);
          } else if (hz.kind === 'rock') {
            expect(hz.r >= 1.4 && hz.r <= 3.0, tag).toBe(true);
            expect(hz.h >= 1.2 && hz.h <= 2.6, tag).toBe(true);
          } else {
            expect(hz.r >= 1.6 && hz.r <= 2.6, tag).toBe(true);
            expect(hz.h >= 1.6 && hz.h <= 2.4, tag).toBe(true);
          }
        }
        for (const isl of w.islands) for (const dr of isl.drops) {
          expect(dr.h > 0 && dr.lead > 0 && dr.half > 0, tag).toBe(true);
        }
      }
    }
  });

  it('steep 5 runs down more steeply than steep 0', () => {
    const avgSlope = (steep: number): number => {
      const w = generateWorld(1, { hazard: 0, steep, tricky: 0, runs: 5 });
      return w.islands.reduce((s, o) => s + o.slope, 0) / w.islands.length;
    };
    expect(avgSlope(5)).toBeGreaterThan(avgSlope(0));
  });

  it('hazard 5 has rocks and more trees than hazard 0', () => {
    for (const seed of SEEDS) {
      const h5 = generateWorld(seed, { hazard: 5, steep: 0, tricky: 0, runs: 5 });
      const h0 = generateWorld(seed, { hazard: 0, steep: 0, tricky: 0, runs: 5 });
      const trees = (w: typeof h0): number => w.hazards.filter((hz) => hz.kind === 'tree').length;
      expect(h5.hazards.some((hz) => hz.kind === 'rock'), `seed ${seed}`).toBe(true);
      expect(trees(h5) > trees(h0), `seed ${seed}`).toBe(true);
    }
  });

  it('steep 5 has cliff drops, and steep 0 with tricky 0 has none', () => {
    let drops5 = 0;
    for (const seed of SEEDS) {
      for (const hazard of EXTREMES) for (const tricky of EXTREMES) {
        const w5 = generateWorld(seed, { hazard, steep: 5, tricky, runs: 5 });
        drops5 += w5.islands.reduce((s, o) => s + o.drops.length, 0);
        const w0 = generateWorld(seed, { hazard, steep: 0, tricky: 0, runs: 5 });
        expect(w0.islands.every((o) => o.drops.length === 0), `seed ${seed}`).toBe(true);
      }
    }
    expect(drops5).toBeGreaterThan(0);
  });

  it('no hazard lies within 6 m of a rail point', () => {
    for (const seed of SEEDS) {
      for (const hill of hills) {
        const w = generateWorld(seed, hill);
        const tag = `seed ${seed} ${JSON.stringify(hill)}`;
        let closest = Infinity;
        for (const hz of w.hazards) {
          for (const rl of w.rails) {
            for (const p of rl.pts) closest = Math.min(closest, Math.hypot(hz.x - p.x, hz.z - p.z));
          }
        }
        expect(closest >= 6, tag).toBe(true);
      }
    }
  });
});
