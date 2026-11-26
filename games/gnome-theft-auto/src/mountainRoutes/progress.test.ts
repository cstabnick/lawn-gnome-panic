import { describe, expect, it } from 'vitest';
import { ROUTES } from './routes';
import { RouteRun, modeOk } from './progress';

const track = ROUTES['spine-cut'];

/** Feed the route's own centre-line samples at 10 m/s (about 1 m per sample, dt 0.1 s). */
function feed(run: RouteRun, points: readonly { x: number; z: number }[], ok = true): number {
  let completions = 0;
  for (const p of points) if (run.update(0.1, p.x, p.z, ok)) completions++;
  return completions;
}

describe('modeOk', () => {
  it('lets a car drive a road and refuses a plane', () => {
    expect(modeOk('road', 'hoa-van')).toBe(true);
    expect(modeOk('road', 'plane')).toBe(false);
    expect(modeOk('road', null)).toBe(false);
  });

  it('allows the trail on foot only', () => {
    expect(modeOk('trail', null)).toBe(true);
    expect(modeOk('trail', 'push-bike')).toBe(false);
  });

  it('allows small two-wheelers on the track, not the van', () => {
    expect(modeOk('track', 'dirt-bike')).toBe(true);
    expect(modeOk('track', 'hoa-van')).toBe(false);
  });
});

describe('RouteRun', () => {
  it('completes once going start to end', () => {
    const run = new RouteRun(track);
    expect(feed(run, track.samples())).toBe(1);
  });

  it('completes once going end to start', () => {
    const run = new RouteRun(track);
    expect(feed(run, [...track.samples()].reverse())).toBe(1);
  });

  it('does not complete when the run jumps from the start straight to the end', () => {
    const run = new RouteRun(track);
    const samples = track.samples();
    const head = samples.filter((p) => p.s <= 30);
    const tail = samples[samples.length - 1];
    expect(feed(run, head)).toBe(0);
    expect(run.update(0.1, tail.x, tail.z, true)).toBe(false);
    expect(feed(run, [tail])).toBe(0);
  });

  it('does not complete when ok is false throughout', () => {
    const run = new RouteRun(track);
    expect(feed(run, track.samples(), false)).toBe(0);
  });
});
