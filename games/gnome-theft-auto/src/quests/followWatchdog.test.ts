import { describe, expect, it } from 'vitest';
import { createFollowWatchdog, type FollowSample } from './followWatchdog';

const base: FollowSample = { leaderX: 0, leaderZ: 0, aimX: 0, aimZ: 100, playerDist: 5, maxDist: 60, waiting: false };

function run(w: ReturnType<typeof createFollowWatchdog>, secs: number, s: FollowSample): string[] {
  const out: string[] = [];
  for (let t = 0; t < secs * 10; t++) {
    const a = w.step(0.1, s);
    if (a !== 'none') out.push(a);
  }
  return out;
}

describe('follow watchdog', () => {
  it('no action while the leader keeps closing on the aim point', () => {
    const w = createFollowWatchdog();
    for (let i = 0; i < 300; i++) expect(w.step(0.1, { ...base, leaderZ: i * 0.3 })).toBe('none');
    expect(w.maxStall()).toBeLessThan(1);
  });

  it('a slow but advancing leader is not stuck', () => {
    const w = createFollowWatchdog();
    for (let i = 0; i < 600; i++) expect(w.step(0.1, { ...base, leaderZ: i * 0.02 })).toBe('none');
  });

  it('escalates nudge, snap-road, skip-waypoint on a real stall', () => {
    const w = createFollowWatchdog();
    w.step(0.1, base);
    expect(run(w, 16, base)).toEqual(['nudge', 'snap-road', 'skip-waypoint']);
    expect(w.maxStall()).toBeGreaterThanOrEqual(14.9);
    expect(w.maxStall()).toBeLessThan(16);
  });

  it('waiting for the player never counts as a stall', () => {
    const w = createFollowWatchdog();
    w.step(0.1, base);
    expect(run(w, 60, { ...base, waiting: true, playerDist: 90 })).toEqual([]);
    expect(w.maxStall()).toBe(0);
  });

  it('progress resets the escalation', () => {
    const w = createFollowWatchdog();
    w.step(0.1, base);
    expect(run(w, 5, base)).toEqual(['nudge']);
    w.step(0.1, { ...base, leaderZ: 5 });
    expect(w.stalledFor()).toBe(0);
    expect(run(w, 5, { ...base, leaderZ: 5 })).toEqual(['nudge']);
  });

  it('a new aim point restarts the clock', () => {
    const w = createFollowWatchdog();
    w.step(0.1, base);
    run(w, 3, base);
    w.step(0.1, { ...base, aimZ: 200 });
    expect(w.stalledFor()).toBe(0);
  });
});
