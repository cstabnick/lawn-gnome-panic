import { describe, expect, it } from 'vitest';
import { newRun, stepRun, formatTime } from './course';
import { NURSERY_RUN, TEA_TRAY_RUN, WOOL_RUN } from './types';
import type { RunDef, RunEvent } from './types';

/** Run a list of (x, z) positions, one dt per step; returns the events and the summed dt after the start. */
function drive(run: ReturnType<typeof newRun>, pts: { x: number; z: number }[], dt: number) {
  const events: NonNullable<RunEvent>[] = [];
  let afterStart = 0;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1];
    const q = pts[i];
    const wasRunning = run.phase === 'running';
    const ev = stepRun(run, p.x, p.z, q.x, q.z, dt);
    if (ev) events.push(ev);
    if (wasRunning) afterStart += dt;
  }
  return { events, afterStart };
}

/** Piecewise-linear x along a run's centres: start, each gate, then the finish. */
function centreFn(run: RunDef): (z: number) => number {
  const centres = [
    { x: run.start.x, z: run.start.z },
    ...run.gates.map((g) => ({ x: g.x, z: g.z })),
    { x: run.finish.x, z: run.finish.z },
  ];
  return (z) => {
    for (let i = 0; i < centres.length - 1; i++) {
      const a = centres[i];
      const b = centres[i + 1];
      if (z >= a.z && z <= b.z) return a.x + (b.x - a.x) * ((z - a.z) / (b.z - a.z));
    }
    return z < centres[0].z ? centres[0].x : centres[centres.length - 1].x;
  };
}

/** Straight line down x from z0 to z1 in 1 m steps. */
function straight(x: number, z0: number, z1: number) {
  const pts: { x: number; z: number }[] = [];
  for (let z = z0; z <= z1; z++) pts.push({ x, z });
  return pts;
}

// The Nursery is the old six-gate Wool Run; the Wool Run is the long course from the summit.
describe.each([
  ['the Nursery', NURSERY_RUN, 6],
  ['the Wool Run', WOOL_RUN, 11],
] as const)('course: %s', (_name, run, gateCount) => {
  const centreX = centreFn(run);
  const top = run.start.z - 5;
  const foot = run.finish.z + 5;

  it('has its gates in order between the start and the finish', () => {
    expect(run.gates).toHaveLength(gateCount);
    for (let i = 1; i < run.gates.length; i++) expect(run.gates[i].z).toBeGreaterThan(run.gates[i - 1].z);
    expect(run.gates[0].z).toBeGreaterThan(run.start.z);
    expect(run.gates[run.gates.length - 1].z).toBeLessThan(run.finish.z);
  });

  it('does not start when the line is crossed outside its half-width', () => {
    const r = newRun(run);
    const { events } = drive(r, straight(run.start.x - run.start.half - 30, top, top + 10), 0.05);
    expect(events).toEqual([]);
    expect(r.phase).toBe('ready');
  });

  it(`a slalom through every gate centre starts, passes ${gateCount} gates and finishes clean`, () => {
    const r = newRun(run);
    const pts: { x: number; z: number }[] = [];
    for (let z = top; z <= foot; z++) pts.push({ x: centreX(z), z });
    const { events, afterStart } = drive(r, pts, 0.05);
    expect(events[0]).toEqual({ t: 'start' });
    const gates = events.filter((e) => e.t === 'gate');
    expect(gates.length).toBe(gateCount);
    expect(gates.every((e) => e.t === 'gate' && e.ok)).toBe(true);
    const fin = events[events.length - 1];
    expect(fin.t).toBe('finish');
    if (fin.t !== 'finish') throw new Error('no finish');
    expect(fin.result.clean).toBe(true);
    expect(fin.result.missed).toBe(0);
    expect(fin.result.seconds).toBeCloseTo(afterStart, 6);
    expect(r.phase).toBe('done');
  });

  it('a straight line down the start misses the off-line gates and adds 3 s per miss', () => {
    const r = newRun(run);
    const lineX = run.start.x;
    const { events, afterStart } = drive(r, straight(lineX, top, foot), 0.05);
    const gates = events.filter((e) => e.t === 'gate');
    expect(gates.length).toBe(gateCount);
    const missed = run.gates.filter((g) => Math.abs(g.x - lineX) > g.half).length;
    expect(missed).toBeGreaterThan(0);
    expect(gates.filter((e) => e.t === 'gate' && !e.ok).length).toBe(missed);
    const fin = events[events.length - 1];
    if (fin.t !== 'finish') throw new Error('no finish');
    expect(fin.result.missed).toBe(missed);
    expect(fin.result.clean).toBe(false);
    expect(fin.result.seconds).toBeCloseTo(afterStart + 3 * missed, 6);
  });

  it('moving north across a line never starts or finishes', () => {
    const r = newRun(run);
    const { events } = drive(r, straight(run.start.x, top, top + 20).reverse(), 0.05);
    expect(events).toEqual([]);
    expect(r.phase).toBe('ready');
  });
});

describe('course: the two ski courses', () => {
  it('the Wool Run starts above the Nursery, which keeps the old gates', () => {
    expect(WOOL_RUN.start.z).toBeLessThan(NURSERY_RUN.start.z);
    expect(NURSERY_RUN.start).toEqual({ x: -350, z: -1255, half: 12 });
    expect(NURSERY_RUN.gates).toHaveLength(6);
    // The Nursery's start line lies mid-way down the Wool Run, so the runtime must keep it from starting then.
    expect(NURSERY_RUN.start.z).toBeLessThan(WOOL_RUN.finish.z);
  });
});

describe('course: finish line', () => {
  it('crossing the finish outside its half-width does not finish', () => {
    const r = newRun(TEA_TRAY_RUN);
    // Start cleanly at x = -405, then cross the finish z at x = -375 (30 m off, half-width 18).
    stepRun(r, -405, -1251, -405, -1249, 0.05);
    expect(r.phase).toBe('running');
    const ev = stepRun(r, -375, -1041, -375, -1039, 0.05);
    expect(ev).toBeNull();
    expect(r.phase).toBe('running');
  });
});

describe('course: Tea-Tray Run', () => {
  it('a straight line at x = -405 starts and finishes clean', () => {
    const r = newRun(TEA_TRAY_RUN);
    const { events, afterStart } = drive(r, straight(-405, -1260, -1030), 0.05);
    expect(events[0]).toEqual({ t: 'start' });
    const fin = events[events.length - 1];
    if (fin.t !== 'finish') throw new Error('no finish');
    expect(fin.result.clean).toBe(true);
    expect(fin.result.missed).toBe(0);
    expect(fin.result.seconds).toBeCloseTo(afterStart, 6);
  });
});

describe('formatTime', () => {
  it('formats m:ss.t', () => {
    expect(formatTime(31.44)).toBe('0:31.4');
    expect(formatTime(75)).toBe('1:15.0');
    expect(formatTime(0)).toBe('0:00.0');
  });
});
