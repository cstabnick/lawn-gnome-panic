import { describe, expect, it } from 'vitest';
import { paintGrid } from './overlayPaint';

function pixel(img: { width: number; data: Uint8ClampedArray }, i: number, j: number): number[] {
  const o = (j * img.width + i) * 4;
  return [...img.data.slice(o, o + 4)];
}

describe('paintGrid', () => {
  it('sizes the image from the rect and the cell', () => {
    const img = paintGrid({ minX: 0, maxX: 10, minZ: -4, maxZ: 2 }, 1, () => [0, 0, 0, 0]);
    expect(img.width).toBe(10);
    expect(img.height).toBe(6);
    expect(img.data.length).toBe(10 * 6 * 4);
  });

  it('samples cell centres, with row 0 on the minZ edge', () => {
    // Cells of 1 m over [0, 4] x [0, 2]: pixel (i, j) is the cell whose centre is (i + 0.5, j + 0.5).
    const red: [number, number, number, number] = [255, 0, 0, 255];
    const green: [number, number, number, number] = [0, 255, 0, 255];
    const img = paintGrid({ minX: 0, maxX: 4, minZ: 0, maxZ: 2 }, 1, (x, z) =>
      (Math.floor(x) + Math.floor(z)) % 2 === 0 ? red : green,
    );
    expect(img.width).toBe(4);
    expect(img.height).toBe(2);
    expect(pixel(img, 0, 0)).toEqual(red);
    expect(pixel(img, 1, 0)).toEqual(green);
    expect(pixel(img, 0, 1)).toEqual(green);
    expect(pixel(img, 1, 1)).toEqual(red);
  });

  it('a row-0 test: only the minZ half is coloured', () => {
    const img = paintGrid({ minX: 0, maxX: 2, minZ: 10, maxZ: 12 }, 1, (_x, z) =>
      z < 11 ? [9, 9, 9, 255] : [0, 0, 0, 0],
    );
    expect(pixel(img, 0, 0)).toEqual([9, 9, 9, 255]);
    expect(pixel(img, 1, 1)).toEqual([0, 0, 0, 0]);
  });

  it('a transparent function gives all zeros', () => {
    const img = paintGrid({ minX: -3, maxX: 3, minZ: -3, maxZ: 3 }, 0.5, () => [0, 0, 0, 0]);
    expect(img.data.every((v) => v === 0)).toBe(true);
  });
});
