// Traffic-hat wardens (E28): the stop/go cycle, who must stop, the speed cap, where they stand, and the wave watch.
import { afterEach, describe, expect, it } from 'vitest';
import { CITY_HALF, HIGHWAYS, ROAD_LINES } from './config';
import {
  DIRECTORS, STOP_LINE, createWaveWatch, directorAt, directorFacing, directorSignal, directorSpeedCap, mustStop,
  nowSeconds, onAxisA, setDirectorClock, type Director,
} from './trafficDirectors';

const D: Director = { id: 't', label: 't', x: 0, z: 0, yaw: 0, period: 6, clear: 1, offset: 0 };

afterEach(() => setDirectorClock());

describe('traffic-hat wardens', () => {
  it('cycle: axis A, clear, axis B, clear', () => {
    expect(directorSignal(D, 0)).toBe('a');
    expect(directorSignal(D, 5.9)).toBe('a');
    expect(directorSignal(D, 6.5)).toBe('clear');
    expect(directorSignal(D, 7.5)).toBe('b');
    expect(directorSignal(D, 13.5)).toBe('clear');
    expect(directorSignal(D, 14.2)).toBe('a');
    expect(directorSignal(D, -0.5)).toBe('clear');
  });

  it('holds the road that is not waved through, both ways along it', () => {
    expect(onAxisA(D, 0, 1)).toBe(true);
    expect(onAxisA(D, 0, -1)).toBe(true);
    expect(onAxisA(D, 1, 0)).toBe(false);
    expect(mustStop(D, 1, 0, 1)).toBe(false);
    expect(mustStop(D, 1, 1, 0)).toBe(true);
    expect(mustStop(D, 8, 1, 0)).toBe(false);
    expect(mustStop(D, 8, 0, -1)).toBe(true);
    expect(mustStop(D, 6.5, 0, 1)).toBe(true); // clearing: everyone waits
  });

  it('caps speed to stop at the line, and lets a car already past the line go on', () => {
    expect(directorSpeedCap(D, 1, 1, 0, STOP_LINE + 8)).toBeCloseTo(8, 5); // sqrt(2 * 4 * 8)
    expect(directorSpeedCap(D, 1, 1, 0, STOP_LINE)).toBe(0);
    expect(directorSpeedCap(D, 1, 1, 0, STOP_LINE - 3)).toBe(Infinity);
    expect(directorSpeedCap(D, 1, 0, 1, STOP_LINE + 8)).toBe(Infinity);
    expect(directorSpeedCap(D, 1, 1, 0, 200)).toBe(Infinity);
  });

  it('faces the held road', () => {
    expect(directorFacing(D, 1)).toBeCloseTo(Math.PI / 2, 6);
    expect(directorFacing(D, 8)).toBeCloseTo(0, 6);
  });

  it('every warden stands on a junction where roads cross', () => {
    const vertices = HIGHWAYS.flatMap((h) => h.points);
    for (const d of DIRECTORS) {
      expect(directorAt(d.x, d.z), d.id).toBe(d);
      const onGrid = Math.abs(d.x) <= CITY_HALF && Math.abs(d.z) <= CITY_HALF && ROAD_LINES.includes(d.x) && ROAD_LINES.includes(d.z);
      const meetings = vertices.filter(([x, z]) => Math.hypot(x - d.x, z - d.z) < 0.01).length;
      expect(onGrid || meetings >= 2, d.id).toBe(true);
    }
  });

  it('the clock can be swapped for tests', () => {
    setDirectorClock(() => 42);
    expect(nowSeconds()).toBe(42);
    setDirectorClock();
    expect(Math.abs(nowSeconds() - Date.now() / 1000)).toBeLessThan(600);
  });

  it('the wave watch fires after waiting at the line and being waved on, not for driving straight through', () => {
    const w = createWaveWatch([D]);
    // Approaching along x (axis B) from the west, stopped 12 m out while A goes (t 0..5), then B goes at 7.
    let fired = false;
    for (let t = 0; t < 9; t += 0.1) fired = w.step(-12, 0, Math.PI / 2, t < 7 ? 0 : 3, t) || fired;
    expect(fired).toBe(true);
    const w2 = createWaveWatch([D]);
    let free = false;
    for (let t = 0; t < 5; t += 0.1) free = w2.step(-12, 0, 0, 8, t) || free; // along axis A: never held
    expect(free).toBe(false);
  });
});
