// The variety toolkit in direct.ts: same intent and side of the line, different angle, height and movement.
import { describe, expect, it } from 'vitest';
import type { CamShot, ShotSize, Step } from './script';
import { coverage, cut, insert, pickAngle, pullOut, pushIn, seedOf, varied, vary } from './direct';

const RANGES: Record<ShotSize, [number, number]> = { cu: [15, 40], mcu: [15, 40], ms: [20, 55], fs: [20, 55], ws: [10, 70] };

describe('pickAngle', () => {
  it('is deterministic for a seed', () => {
    expect(pickAngle('scene-a:3', 'ms', 1)).toEqual(pickAngle('scene-a:3', 'ms', 1));
    expect(seedOf('scene-a')).toBe(seedOf('scene-a'));
  });

  it('keeps the side sign and stays in its swing range', () => {
    for (const size of Object.keys(RANGES) as ShotSize[]) {
      const [lo, hi] = RANGES[size];
      for (let i = 0; i < 60; i++) {
        for (const side of [1, -1] as const) {
          const a = pickAngle(`seed-${i}`, size, side);
          expect(Math.sign(a.side)).toBe(side);
          expect(Math.abs(a.side)).toBeGreaterThanOrEqual(lo);
          expect(Math.abs(a.side)).toBeLessThanOrEqual(hi);
          expect(['eye', 'low', 'high']).toContain(a.height);
        }
      }
    }
  });

  it('gives a ws shot no low angle', () => {
    for (let i = 0; i < 60; i++) expect(pickAngle(`ws-${i}`, 'ws').height).not.toBe('low');
  });
});

describe('pushIn / pullOut', () => {
  it('pushes in to one size tighter by default', () => {
    expect(pushIn('a', 'ms', 2)).toMatchObject({ kind: 'frame', who: 'a', size: 'ms', push: { to: 'mcu', s: 2 } });
  });

  it('pulls out to one size wider, and clamps at the ends', () => {
    expect(pullOut('a', 'ws', 2)).toMatchObject({ size: 'ws', push: { to: 'ws', s: 2 } });
    expect(pullOut('a', 'ms', 1.5, { to: 'fs' })).toMatchObject({ push: { to: 'fs', s: 1.5 } });
  });
});

describe('insert / two', () => {
  it('insert is a high close-up on the hands, side 30 by default', () => {
    expect(insert('a')).toMatchObject({ kind: 'frame', size: 'cu', height: 'high', side: 30 });
  });

  it('a two-shot stays on the same side of the line as the singles', () => {
    for (const side of [1, -1] as const) {
      const c = coverage('a', 'b', side);
      expect(Math.sign((c.two() as { side: number }).side)).toBe(Math.sign((c.single('a') as { side: number }).side));
      expect(c.two()).toMatchObject({ who: 'a', size: 'fs', toward: 'b' });
    }
  });
});

describe('vary', () => {
  const frame = (size: 'ms' | 'mcu'): Step => cut(coverage('a', 'b').single('a', size));
  const run = (): Step[] => [frame('ms'), { do: 'wait', s: 0.5 }, frame('ms'), frame('ms'), frame('ms')];

  it('changes a run of four identical frame cams (at least one differs)', () => {
    const before = run();
    const after = vary(before, 'scene-x');
    expect(after).not.toEqual(before);
    expect(after[0]).toEqual(before[0]);
    expect(after[1]).toEqual(before[1]);
  });

  it('never changes the sign of side', () => {
    for (const side of [1, -1] as const) {
      const before = Array.from({ length: 6 }, () => cut(coverage('a', 'b', side).single('a', 'ms')));
      const after = vary(before, `seed-${side}`);
      after.forEach((s, i) => {
        if (s.do !== 'cam' || s.shot.kind !== 'frame') throw new Error('expected frame cam');
        expect(Math.sign(s.shot.side as number)).toBe(Math.sign((before[i] as { shot: CamShot & { side: number } }).shot.side));
      });
    }
  });

  it('leaves a run that is already varied alone', () => {
    const steps: Step[] = [
      cut(coverage('a', 'b').single('a', 'ms', { height: 'eye' })),
      cut(coverage('a', 'b').single('a', 'ms', { height: 'high' })),
      cut(coverage('a', 'b').single('a', 'ms', { height: 'eye' })),
      cut(varied('a', 'ms', 'x')),
    ];
    expect(vary(steps, 'scene-y')).toEqual(steps);
  });

  it('walks nested parallel tracks and returns a new list', () => {
    const steps: Step[] = [{ do: 'parallel', tracks: [run(), []] }];
    const after = vary(steps, 'p');
    expect(after).not.toBe(steps);
    expect(after).not.toEqual(steps);
  });
});
