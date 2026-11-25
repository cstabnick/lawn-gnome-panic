import { describe, expect, it } from 'vitest';
import { newRun, stepRun, formatTime } from './course';
import { TEA_TRAY_RUN, WOOL_RUN } from './types';
import type { RunEvent } from './types';

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

/** Piecewise-linear x along the Wool Run's centres: start, each gate, then the finish. */
const WOOL_CENTRES = [
  { x: WOOL_RUN.start.x, z: WOOL_RUN.start.z },
  ...WOOL_RUN.gates.map((g) => ({ x: g.x, z: g.z })),
  { x: WOOL_RUN.finish.x, z: WOOL_RUN.finish.z },
];
function centreX(z: number): number {
  for (let i = 0; i < WOOL_CENTRES.length - 1; i++) {
    const a = WOOL_CENTRES[i];
    const b = WOOL_CENTRES[i + 1];
    if (z >= a.z && z <= b.z) return a.x + (b.x - a.x) * ((z - a.z) / (b.z - a.z));
  }
  return z < WOOL_CENTRES[0].z ? WOOL_CENTRES[0].x : WOOL_CENTRES[WOOL_CENTRES.length - 1].x;
}

/** Straight line down x from z0 to z1 in 1 m steps. */
function straight(x: number, z0: number, z1: number) {
  const pts: { x: number; z: number }[] = [];
  for (let z = z0; z <= z1; z++) pts.push({ x, z });
  return pts;
}

describe('course: Wool Run', () => {
  it('does not start when the line is crossed outside its half-width', () => {
    const r = newRun(WOOL_RUN);
    const { events } = drive(r, straight(-400, -1260, -1250), 0.05);
    expect(events).toEqual([]);
    expect(r.phase).toBe('ready');
  });

  it('a slalom through every gate centre starts, passes 6 gates and finishes clean', () => {
    const r = newRun(WOOL_RUN);
    const pts: { x: number; z: number }[] = [];
    for (let z = -1260; z <= -1040; z++) pts.push({ x: centreX(z), z });
    const { events, afterStart } = drive(r, pts, 0.05);
    expect(events[0]).toEqual({ t: 'start' });
    const gates = events.filter((e) => e.t === 'gate');
    expect(gates.length).toBe(6);
    expect(gates.every((e) => e.t === 'gate' && e.ok)).toBe(true);
    const fin = events[events.length - 1];
    expect(fin.t).toBe('finish');
    if (fin.t !== 'finish') throw new Error('no finish');
    expect(fin.result.clean).toBe(true);
    expect(fin.result.missed).toBe(0);
    expect(fin.result.seconds).toBeCloseTo(afterStart, 6);
    expect(r.phase).toBe('done');
  });

  it('a straight line at x = -361 misses every gate and adds 3 s per miss', () => {
    const r = newRun(WOOL_RUN);
    const { events, afterStart } = drive(r, straight(-361, -1260, -1040), 0.05);
    const gates = events.filter((e) => e.t === 'gate');
    expect(gates.length).toBe(6);
    expect(gates.every((e) => e.t === 'gate' && !e.ok)).toBe(true);
    const fin = events[events.length - 1];
    if (fin.t !== 'finish') throw new Error('no finish');
    expect(fin.result.missed).toBe(6);
    expect(fin.result.clean).toBe(false);
    expect(fin.result.seconds).toBeCloseTo(afterStart + 18, 6);
  });

  it('moving north across a line never starts or finishes', () => {
    const r = newRun(WOOL_RUN);
    const { events } = drive(r, straight(-350, -1240, -1260), 0.05);
    expect(events).toEqual([]);
    expect(r.phase).toBe('ready');
  });

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
