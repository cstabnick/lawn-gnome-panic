import { describe, expect, it } from 'vitest';
import { clipSegmentToRect, polylinePoints, rectPoints, ringPoints, zoneBorderRect } from './overlayGeom';

const flat = () => 0;
const slope = (x: number, z: number) => 0.5 * x + 0.25 * z;

function maxXzStep(pts: [number, number, number][]): number {
  let m = 0;
  for (let i = 1; i < pts.length; i++) {
    m = Math.max(m, Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][2] - pts[i - 1][2]));
  }
  return m;
}

describe('ringPoints', () => {
  it('is a closed loop of segments + 1 points', () => {
    const pts = ringPoints(10, -4, 3, flat, 16);
    expect(pts).toHaveLength(17);
    expect(pts[16]).toEqual(pts[0]);
  });

  it('defaults to 48 segments and lifts above the ground', () => {
    const pts = ringPoints(0, 0, 5, () => 2);
    expect(pts).toHaveLength(49);
    for (const p of pts) expect(p[1]).toBeCloseTo(2.4);
  });

  it('keeps every point at radius r from the centre', () => {
    for (const [x, , z] of ringPoints(7, 3, 4, flat)) {
      expect(Math.hypot(x - 7, z - 3)).toBeCloseTo(4);
    }
  });

  it('follows a sloped heightAt', () => {
    for (const [x, y, z] of ringPoints(0, 0, 5, slope, 12, 0)) {
      expect(y).toBeCloseTo(slope(x, z));
    }
  });
});

describe('rectPoints', () => {
  it('is a closed outline of the box', () => {
    const pts = rectPoints(0, 0, 4, 2, flat, 2);
    expect(pts[pts.length - 1]).toEqual(pts[0]);
    const xs = pts.map((p) => p[0]);
    const zs = pts.map((p) => p[2]);
    expect(Math.min(...xs)).toBeCloseTo(-2);
    expect(Math.max(...xs)).toBeCloseTo(2);
    expect(Math.min(...zs)).toBeCloseTo(-1);
    expect(Math.max(...zs)).toBeCloseTo(1);
  });

  it('has one point per stepM along each side, plus the closing point', () => {
    // 4 x 2 box, stepM 2: sides of 4, 2, 4, 2 m split into 2, 1, 2, 1 pieces = 6 points, plus the closing point.
    expect(rectPoints(0, 0, 4, 2, flat, 2)).toHaveLength(7);
    // stepM 1 splits every side more finely.
    expect(rectPoints(0, 0, 4, 2, flat, 1)).toHaveLength(13);
  });

  it('never has two points more than stepM apart', () => {
    expect(maxXzStep(rectPoints(3, -5, 9.5, 2.25, flat, 2))).toBeLessThanOrEqual(2 + 1e-9);
    expect(maxXzStep(rectPoints(0, 0, 30, 1, flat, 0.75))).toBeLessThanOrEqual(0.75 + 1e-9);
  });

  it('follows a sloped heightAt', () => {
    for (const [x, y, z] of rectPoints(0, 0, 6, 6, slope, 2, 0.4)) {
      expect(y).toBeCloseTo(slope(x, z) + 0.4);
    }
  });
});

describe('polylinePoints', () => {
  it('returns nothing for no points', () => {
    expect(polylinePoints([], flat)).toEqual([]);
  });

  it('keeps the end point and never spaces points more than stepM apart', () => {
    const pts = polylinePoints([[0, 0], [10, 0], [10, 3]], flat, 2);
    expect(pts[pts.length - 1][0]).toBeCloseTo(10);
    expect(pts[pts.length - 1][2]).toBeCloseTo(3);
    expect(maxXzStep(pts)).toBeLessThanOrEqual(2 + 1e-9);
  });

  it('does not close the loop', () => {
    const pts = polylinePoints([[0, 0], [4, 0]], flat, 2);
    expect(pts[pts.length - 1]).not.toEqual(pts[0]);
  });

  it('follows a sloped heightAt', () => {
    for (const [x, y, z] of polylinePoints([[-5, 2], [5, -3]], slope, 1, 0)) {
      expect(y).toBeCloseTo(slope(x, z));
    }
  });
});

describe('zoneBorderRect', () => {
  it('is centred on the origin when there is one', () => {
    expect(zoneBorderRect({ origin: { x: 200, z: -80 }, half: 60 })).toEqual({ cx: 200, cz: -80, w: 120, d: 120 });
  });

  it('is centred on 0,0 without an origin', () => {
    expect(zoneBorderRect({ half: 40 })).toEqual({ cx: 0, cz: 0, w: 80, d: 80 });
  });

  it('gives an outline that spans -half..+half around the origin', () => {
    const r = zoneBorderRect({ origin: { x: 100, z: 50 }, half: 20 });
    const pts = rectPoints(r.cx, r.cz, r.w, r.d, flat, 5);
    expect(Math.min(...pts.map((p) => p[0]))).toBeCloseTo(80);
    expect(Math.max(...pts.map((p) => p[0]))).toBeCloseTo(120);
    expect(Math.min(...pts.map((p) => p[2]))).toBeCloseTo(30);
    expect(Math.max(...pts.map((p) => p[2]))).toBeCloseTo(70);
  });
});

describe('clipSegmentToRect', () => {
  const rect = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };

  it('keeps a segment that is already inside', () => {
    expect(clipSegmentToRect(-1, -2, 3, 4, rect)).toEqual([-1, -2, 3, 4]);
  });

  it('trims a segment that leaves the rectangle on one side', () => {
    const c = clipSegmentToRect(-20, 0, 0, 0, rect);
    expect(c).not.toBeNull();
    expect(c![0]).toBeCloseTo(-10);
    expect(c![1]).toBeCloseTo(0);
    expect(c![2]).toBeCloseTo(0);
    expect(c![3]).toBeCloseTo(0);
  });

  it('trims a segment that crosses the whole rectangle', () => {
    const c = clipSegmentToRect(-30, -30, 30, 30, rect);
    expect(c![0]).toBeCloseTo(-10);
    expect(c![1]).toBeCloseTo(-10);
    expect(c![2]).toBeCloseTo(10);
    expect(c![3]).toBeCloseTo(10);
  });

  it('returns null for a segment outside the rectangle', () => {
    expect(clipSegmentToRect(20, 0, 30, 5, rect)).toBeNull();
    expect(clipSegmentToRect(-20, 15, 20, 15, rect)).toBeNull();
  });
});
