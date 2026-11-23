import { describe, expect, it } from 'vitest';
import { installFakeDom } from '../testing/fakeDom';
import type { Vehicle } from '../types';
import { createLapTimer, LAP_SAVE_KEY, type LapInfo } from './lapTimer';
import { gates, locate, trackLength, trackSamples } from './track';

installFakeDom();

const S = trackSamples();
const N = S.length;
const L = trackLength();

/** A fake in-memory localStorage on globalThis. Returns the backing map. */
function stubStorage(): Map<string, string> {
  const m = new Map<string, string>();
  const ls = {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => { m.set(k, String(v)); },
    removeItem: (k: string) => { m.delete(k); },
    clear: () => m.clear(),
  };
  Object.defineProperty(globalThis, 'localStorage', { value: ls, configurable: true, writable: true });
  return m;
}

function makeCar(): Vehicle {
  return { id: 1, x: 0, z: 0, kind: 'zero-turn', spec: { flies: false, boat: false } } as unknown as Vehicle;
}

/** Sample index for an unwrapped distance u (samples from the start line; negative = before it). */
const idx = (u: number): number => ((Math.round(u) % N) + N) % N;

function makeUi(): HTMLElement {
  return document.createElement('div') as unknown as HTMLElement;
}

describe('free-roam lap timer', () => {
  it('times two laps at the car speed and saves the best', () => {
    const store = stubStorage();
    const laps: LapInfo[] = [];
    const timer = createLapTimer(makeUi(), (info) => { laps.push(info); });
    const car = makeCar();

    // Start 20 m before the line; 2 m per 0.1 s frame.
    let u = -20;
    for (let n = 0; laps.length < 2 && n < 5000; n++) {
      const p = S[idx(u)];
      car.x = p.x;
      car.z = p.z;
      timer.update(0.1, car);
      u += 2;
    }

    expect(laps).toHaveLength(2);
    const expected = L / 20;
    for (const lap of laps) {
      expect(lap.kind).toBe('zero-turn');
      expect(Math.abs(lap.time - expected)).toBeLessThan(0.25);
    }
    expect(laps[0].personalBest).toBe(true);
    const fastest = Math.min(laps[0].time, laps[1].time);
    expect(laps[1].overallBest).toBeCloseTo(fastest, 5);

    const saved = JSON.parse(store.get(LAP_SAVE_KEY) ?? 'null');
    expect(saved.best['zero-turn'].time).toBeCloseTo(fastest, 5);
    expect(saved.best['zero-turn'].splits).toHaveLength(11);
    expect(timer.best('zero-turn')).toBeCloseTo(fastest, 5);
    expect(timer.best()).toBeCloseTo(fastest, 5);
    expect(timer.best('ride-on')).toBeNull();
  });

  it('does not count a lap when a gate is skipped', () => {
    stubStorage();
    const laps: LapInfo[] = [];
    const timer = createLapTimer(makeUi(), (info) => { laps.push(info); });
    const car = makeCar();

    // Index of gate 3 and gate 5 on the centre line.
    const G = gates();
    const g3 = locate(G[3].x, G[3].z)!.i;
    const g5 = locate(G[5].x, G[5].z)!.i;

    // Unwrapped distance from the line. Drive past gate 3, then jump the car to just beyond gate 5.
    let u = -20;
    let jumped = false;
    const end = N + 20;
    while (u < end) {
      const p = S[idx(u)];
      car.x = p.x;
      car.z = p.z;
      timer.update(0.1, car);
      if (!jumped && u >= g3 - 4) {
        jumped = true;
        u = g5 + 2;
        continue;
      }
      u += 2;
    }

    expect(jumped).toBe(true);
    expect(laps).toHaveLength(0);
    expect(timer.best()).toBeNull();
  });
});
