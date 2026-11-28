import { describe, expect, it } from 'vitest';
import { clampView, fitScale, fitView, panBy, screenToWorld, worldToScreen, zoomAt, type MapViewport } from './bigMapView';

const half = 1800;
const vp: MapViewport = { w: 400, h: 400, half, minScale: fitScale(400, 400, half), maxScale: 2.4 };

describe('bigMapView', () => {
  it('round-trips world -> screen -> world', () => {
    const v = { cx: 300, cz: -120, scale: 0.8 };
    const s = worldToScreen(v, vp, 410, -75);
    const w = screenToWorld(v, vp, s.sx, s.sy);
    expect(w.x).toBeCloseTo(410, 6);
    expect(w.z).toBeCloseTo(-75, 6);
  });

  it('mirrors x: a larger world x is further left', () => {
    const v = fitView(vp);
    expect(worldToScreen(v, vp, 100, 0).sx).toBeLessThan(worldToScreen(v, vp, -100, 0).sx);
  });

  it('fits the whole world', () => {
    const v = fitView(vp);
    const a = worldToScreen(v, vp, half, half);
    const b = worldToScreen(v, vp, -half, -half);
    expect(Math.min(a.sx, b.sx)).toBeGreaterThanOrEqual(-1e-6);
    expect(Math.max(a.sx, b.sx)).toBeLessThanOrEqual(vp.w + 1e-6);
    expect(Math.max(a.sy, b.sy)).toBeLessThanOrEqual(vp.h + 1e-6);
  });

  it('zoomAt keeps the point under the anchor', () => {
    const v = { cx: 100, cz: 200, scale: 0.5 };
    const before = screenToWorld(v, vp, 130, 90);
    const z = zoomAt(v, vp, 130, 90, 2);
    expect(z.scale).toBeCloseTo(1, 9);
    const after = screenToWorld(z, vp, 130, 90);
    expect(after.x).toBeCloseTo(before.x, 6);
    expect(after.z).toBeCloseTo(before.z, 6);
  });

  it('clamps the scale and the centre', () => {
    expect(clampView({ cx: 0, cz: 0, scale: 99 }, vp).scale).toBe(vp.maxScale);
    expect(clampView({ cx: 0, cz: 0, scale: 0.001 }, vp).scale).toBe(vp.minScale);
    const c = clampView({ cx: 9999, cz: -9999, scale: 1 }, vp);
    expect(c.cx).toBeCloseTo(half - 200, 6);
    expect(c.cz).toBeCloseTo(-(half - 200), 6);
    // At the fitted scale the world stays centred.
    expect(clampView({ cx: 500, cz: 500, scale: vp.minScale }, vp)).toEqual({ cx: 0, cz: 0, scale: vp.minScale });
  });

  it('panBy moves the picture with the finger', () => {
    const v = { cx: 0, cz: 0, scale: 1 };
    const p = panBy(v, vp, 50, -20);
    const a = worldToScreen(v, vp, 10, 10);
    const b = worldToScreen(p, vp, 10, 10);
    expect(b.sx - a.sx).toBeCloseTo(50, 6);
    expect(b.sy - a.sy).toBeCloseTo(-20, 6);
  });

  it('a pinch is two zoomAt steps about the midpoint', () => {
    let v = { cx: 0, cz: 0, scale: 0.5 };
    const mid = screenToWorld(v, vp, 200, 150);
    v = zoomAt(v, vp, 200, 150, 1.5);
    v = zoomAt(v, vp, 200, 150, 1.5);
    const now = screenToWorld(v, vp, 200, 150);
    expect(now.x).toBeCloseTo(mid.x, 6);
    expect(now.z).toBeCloseTo(mid.z, 6);
  });
});
