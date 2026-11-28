// Every Trellisdown sign's joke fits its board's plate at a legible size (D58: long jokes read at 6 m).
import { describe, expect, it } from 'vitest';
import { layoutPlate, PLATE_MIN_PX } from '../homes/pieces';
import { SIGNS } from './trellisLife';

describe('Trellisdown signs', () => {
  it.each(SIGNS.map((s) => [s.text]))('%s fits its 1.75 x 0.9 m plate at a legible size', (text) => {
    const lay = layoutPlate(text, 1.75, 0.9, (s, px) => s.length * px * 0.62);
    expect(lay.fits).toBe(true);
    expect(lay.px).toBeGreaterThanOrEqual(PLATE_MIN_PX);
  });
});
