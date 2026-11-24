import { describe, expect, it, vi } from 'vitest';

// The runner module imports the vehicle code, whose audio module touches `window` at load time.
vi.hoisted(() => {
  (globalThis as { window?: unknown }).window = { addEventListener() {}, removeEventListener() {} };
});

const { gateHit, clockLeft } = await import('./objectivesCity');

describe('gateHit', () => {
  it('a ground gate counts anywhere inside its radius, at any height', () => {
    const g = { at: [10, 0] as [number, number], radius: 5, label: 'g' };
    expect(gateHit(g, 12, 0, 0, 0)).toBe(true);
    expect(gateHit(g, 16, 0, 0, 0)).toBe(false);
  });

  it('an air gate counts only near its height (on the Skyway deck, not under it)', () => {
    const g = { at: [0, 0] as [number, number], radius: 5, height: 7.5, label: 'deck' };
    expect(gateHit(g, 0, 7.5, 0, 0)).toBe(true);
    expect(gateHit(g, 1, 4, 1, 0)).toBe(true);
    expect(gateHit(g, 0, 0, 0, 0)).toBe(false);
    expect(gateHit(g, 0, 9.5, 0, 2)).toBe(true);
  });
});

describe('clockLeft', () => {
  it('is null with no clock or before the start gate', () => {
    expect(clockLeft(undefined, 10, 20)).toBeNull();
    expect(clockLeft(0, 10, 20)).toBeNull();
    expect(clockLeft(45, null, 20)).toBeNull();
  });

  it('counts down from the start gate', () => {
    expect(clockLeft(45, 10, 20)).toBe(35);
    expect(clockLeft(45, 10, 60)).toBe(-5);
  });
});
