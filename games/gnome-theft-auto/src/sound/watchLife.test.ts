import { describe, expect, it, vi } from 'vitest';
import type { CritterKind } from '../critters';
import type { SurfaceKind } from '../surfaces';

// watchLife imports bus.ts, which imports audio.ts; audio.ts touches `window` when it loads. Stub it for the node test run.
vi.hoisted(() => {
  const g = globalThis as { window?: unknown };
  if (g.window === undefined) g.window = { addEventListener() {}, removeEventListener() {} };
});

const { critterCall, stepId, strideSteps } = await import('./watchLife');

describe('critterCall', () => {
  it('maps every critter kind to its call', () => {
    const table: [CritterKind, string][] = [
      ['cow', 'moo'],
      ['sheep', 'baa'],
      ['pig', 'oink'],
      ['hen', 'cluck'],
      ['squirrel', 'squirrel'],
      ['polar-bear', 'bear'],
      ['bee', 'bee-buzz'],
    ];
    for (const [kind, id] of table) expect(critterCall(kind)).toBe(id);
  });
});

describe('stepId', () => {
  it('prefixes the surface kind', () => {
    expect(stepId('snow')).toBe('step-snow');
    const kinds: SurfaceKind[] = ['asphalt', 'ice', 'snow', 'sand', 'mud', 'grass', 'farm', 'rock', 'dirt', 'gravel', 'water'];
    for (const k of kinds) expect(stepId(k)).toBe(`step-${k}`);
  });
});

describe('strideSteps', () => {
  it('counts a step when carry plus movement reaches the stride', () => {
    const r = strideSteps(0.5, 0.5, 0.85);
    expect(r.steps).toBe(1);
    expect(r.carry).toBeCloseTo(0.15, 9);
  });
  it('carries short movement forward without a step', () => {
    const r = strideSteps(0, 0.3, 0.85);
    expect(r.steps).toBe(0);
    expect(r.carry).toBeCloseTo(0.3, 9);
  });
  it('can land several steps in one move', () => {
    const r = strideSteps(0, 2, 0.85);
    expect(r.steps).toBe(2);
    expect(r.carry).toBeCloseTo(0.3, 9);
  });
});
