import { describe, expect, it } from 'vitest';
import { pinchZoomDelta } from './input';

describe('pinchZoomDelta', () => {
  it('is zero when the fingers do not move apart', () => {
    expect(pinchZoomDelta(100, 100)).toBe(0);
  });

  it('is negative when the fingers spread apart (zoom in)', () => {
    expect(pinchZoomDelta(100, 150)).toBeCloseTo(-0.5);
  });

  it('is positive when the fingers pinch together (zoom out)', () => {
    expect(pinchZoomDelta(150, 100)).toBeCloseTo(0.5);
  });
});
