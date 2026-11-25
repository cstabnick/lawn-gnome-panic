import { describe, expect, it } from 'vitest';
import { CLUBS, estimateCarry, previewShot, simulateShot, type CourseEnv } from './index';

const flat: CourseEnv = { heightAt: () => 1, gradientAt: () => ({ gx: 0, gz: 0 }), lieAt: () => 'fairway' };
const pin = { x: 0, z: 1000 };
const calm = { yaw: 0, mph: 0 };

describe('golf physics', () => {
  it('a perfect full driver carries its listed distance', () => {
    const r = simulateShot(flat, { x: 0, y: 1, z: 0 }, { club: 'DR', power: 1, accuracy: 0, yaw: 0 }, 'tee', calm, pin, { noWind: true });
    expect(Math.abs(r.carry - CLUBS.DR.carry)).toBeLessThan(0.5);
    expect(Math.abs(r.end.x)).toBeLessThan(1e-9);
  });

  it('is deterministic', () => {
    const run = () => simulateShot(flat, { x: 0, y: 1, z: 0 }, { club: '7I', power: 0.9, accuracy: 0.4, yaw: 0.3 }, 'fairway', { yaw: 1, mph: 8 }, pin);
    expect(run()).toEqual(run());
  });

  it('holes a putt that is aimed at the pin on a flat green', () => {
    const green: CourseEnv = { ...flat, lieAt: () => 'green' };
    const p = 0.5;
    const d = 0.9 * estimateCarry('PT', 'green', p);
    const r = simulateShot(green, { x: 0, y: 1, z: 0 }, { club: 'PT', power: p, accuracy: 0, yaw: 0 }, 'green', calm, { x: 0, z: d });
    expect(r.holed).toBe(true);
    expect(r.endLie).toBe('green');
  });

  it('does not share point objects and previews stop at landing', () => {
    const r = previewShot(flat, { x: 0, y: 1, z: 0 }, 'DR', 'tee', 0, pin);
    expect(r.points[r.points.length - 1]).not.toBe(r.end);
    expect(new Set(r.points).size).toBe(r.points.length);
    expect(r.events.some((e) => e.kind === 'rest')).toBe(false);
  });

  it('a ball over water is dropped at the last dry point', () => {
    const sea: CourseEnv = { heightAt: (x, z) => (z > 100 ? -1 : 1), gradientAt: () => ({ gx: 0, gz: 0 }), lieAt: (_x, z) => (z > 100 ? 'water' : 'fairway') };
    const r = simulateShot(sea, { x: 0, y: 1, z: 0 }, { club: 'DR', power: 1, accuracy: 0, yaw: 0 }, 'tee', calm, pin, { noWind: true });
    expect(r.endLie).toBe('water');
    expect(r.dropPoint).not.toBeNull();
    expect(r.dropPoint!.z).toBeLessThan(110);
  });
});
