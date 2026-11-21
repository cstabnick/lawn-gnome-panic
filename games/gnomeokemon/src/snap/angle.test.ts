import { describe, expect, it } from 'vitest';
import { wrapAngle } from './angle';

describe('wrapAngle', () => {
  it('wraps 3*PI into [-PI, PI]', () => {
    expect(Math.abs(wrapAngle(3 * Math.PI) - Math.PI)).toBeLessThan(1e-9);
  });

  it('wraps -3*PI/2 to PI/2', () => {
    expect(Math.abs(wrapAngle((-3 * Math.PI) / 2) - Math.PI / 2)).toBeLessThan(1e-9);
  });

  it('leaves in-range angles unchanged', () => {
    expect(wrapAngle(0.3)).toBe(0.3);
  });
});
