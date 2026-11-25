import { describe, expect, it } from 'vitest';
import { SKATE_ORIGIN, type BoardState, type BoardMode } from './types';
import { abortLineRun, lineById, newLineRun, stepLineRun } from './lines';

/** A board at park-frame (u, v) in the given mode. */
function at(u: number, v: number, mode: BoardMode): BoardState {
  return {
    x: SKATE_ORIGIN.x + u, y: 0, z: SKATE_ORIGIN.z + v, vx: 0, vy: 0, vz: 0, yaw: 0, mode, airT: 0, spin: 0,
    switchStance: false, trick: null, grab: null, grind: null, bailT: 0, nx: 0, ny: 1, nz: 0, lean: 0, t: 0,
  };
}

describe('skate lines', () => {
  it('finishes First Push through the gates in the right states', () => {
    const run = newLineRun(lineById('first-push'));
    expect(stepLineRun(run, at(-1, 0, 'ground'), 0.1)).toEqual({ kind: 'gate', index: 0, of: 3 });
    for (let i = 0; i < 5; i++) stepLineRun(run, at(0 + i, 0, 'ground'), 0.1);
    expect(stepLineRun(run, at(4.3, 0, 'air'), 0.1)).toEqual({ kind: 'gate', index: 1, of: 3 });
    const end = stepLineRun(run, at(9, 0, 'grind'), 0.1);
    expect(end?.kind).toBe('done');
    expect(end && end.kind === 'done' ? end.time : -1).toBeGreaterThan(0);
    expect(stepLineRun(run, at(9, 0, 'grind'), 0.1)).toBeNull();
  });

  it('never finishes when the air state is skipped at gate 2', () => {
    const run = newLineRun(lineById('first-push'));
    stepLineRun(run, at(-1, 0, 'ground'), 0.1);
    for (let i = 0; i < 100; i++) {
      const ev = stepLineRun(run, at(4.3, 0, 'ground'), 0.1);
      expect(ev?.kind === 'done').toBe(false);
    }
    for (let i = 0; i < 20; i++) stepLineRun(run, at(9, 0, 'grind'), 0.1);
    expect(run.done).toBe(false);
    expect(run.next).toBe(1);
  });

  it('fails on the time limit', () => {
    const run = newLineRun(lineById('first-push'));
    stepLineRun(run, at(-1, 0, 'ground'), 0.1);
    let ev = null;
    for (let i = 0; i < 400 && !ev; i++) ev = stepLineRun(run, at(-30, 0, 'ground'), 0.1);
    expect(ev).toEqual({ kind: 'fail', reason: 'time' });
    expect(stepLineRun(run, at(-1, 0, 'ground'), 0.1)).toBeNull();
  });

  it('fails when the board bails', () => {
    const run = newLineRun(lineById('first-push'));
    stepLineRun(run, at(-1, 0, 'ground'), 0.1);
    expect(stepLineRun(run, at(0, 0, 'bail'), 0.1)).toEqual({ kind: 'fail', reason: 'bail' });
  });

  it('abortLineRun fails with reason off unless the run is over', () => {
    const run = newLineRun(lineById('first-push'));
    expect(abortLineRun(run)).toEqual({ kind: 'fail', reason: 'off' });
    expect(abortLineRun(run)).toBeNull();
  });
});
