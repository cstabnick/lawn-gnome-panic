// Pure polyline maths for the entity overlay: no three.js, so it is tested without a browser.
import type { Rect } from '@lawn/level';

export type Pt3 = [number, number, number];
export type Height = (x: number, z: number) => number;

/** A closed circle of `segments` steps: segments + 1 points, the last equal to the first. */
export function ringPoints(cx: number, cz: number, r: number, heightAt: Height, segments = 48, lift = 0.4): Pt3[] {
  const out: Pt3[] = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const x = cx + Math.cos(a) * r;
    const z = cz + Math.sin(a) * r;
    out.push([x, heightAt(x, z) + lift, z]);
  }
  // Copied, not recomputed: sin(2*pi) is not exactly 0, so the closing point must be the first point itself.
  out.push([out[0][0], out[0][1], out[0][2]]);
  return out;
}

/** The outline of an axis-aligned w x d box, closed, with no two consecutive points more than stepM apart (xz). */
export function rectPoints(cx: number, cz: number, w: number, d: number, heightAt: Height, stepM = 2, lift = 0.4): Pt3[] {
  const hw = w / 2;
  const hd = d / 2;
  const corners: [number, number][] = [
    [cx - hw, cz - hd],
    [cx + hw, cz - hd],
    [cx + hw, cz + hd],
    [cx - hw, cz + hd],
  ];
  const out: Pt3[] = [];
  for (let i = 0; i < 4; i++) {
    const [ax, az] = corners[i];
    const [bx, bz] = corners[(i + 1) % 4];
    pushSegment(out, ax, az, bx, bz, heightAt, stepM, lift);
  }
  const [fx, fz] = corners[0];
  out.push([fx, heightAt(fx, fz) + lift, fz]);
  return out;
}

/** An open polyline subdivided so no two consecutive points are more than stepM apart (xz). */
export function polylinePoints(points: [number, number][], heightAt: Height, stepM = 2, lift = 0.4): Pt3[] {
  const out: Pt3[] = [];
  if (points.length === 0) return out;
  for (let i = 0; i + 1 < points.length; i++) {
    const [ax, az] = points[i];
    const [bx, bz] = points[i + 1];
    pushSegment(out, ax, az, bx, bz, heightAt, stepM, lift);
  }
  const [lx, lz] = points[points.length - 1];
  out.push([lx, heightAt(lx, lz) + lift, lz]);
  return out;
}

/** The zone's border square: the map is -half..+half around its origin (ZoneDef.origin, default 0,0). */
export function zoneBorderRect(def: { origin?: { x: number; z: number }; half: number }): { cx: number; cz: number; w: number; d: number } {
  return { cx: def.origin?.x ?? 0, cz: def.origin?.z ?? 0, w: 2 * def.half, d: 2 * def.half };
}

/** The part of segment a-b inside rect (Liang-Barsky), or null when none of it is inside. */
export function clipSegmentToRect(ax: number, az: number, bx: number, bz: number, rect: Rect): [number, number, number, number] | null {
  let t0 = 0;
  let t1 = 1;
  const dx = bx - ax;
  const dz = bz - az;
  const edges: [number, number][] = [
    [-dx, ax - rect.minX],
    [dx, rect.maxX - ax],
    [-dz, az - rect.minZ],
    [dz, rect.maxZ - az],
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return null;
      continue;
    }
    const t = q / p;
    if (p < 0) {
      if (t > t1) return null;
      if (t > t0) t0 = t;
    } else {
      if (t < t0) return null;
      if (t < t1) t1 = t;
    }
  }
  return [ax + t0 * dx, az + t0 * dz, ax + t1 * dx, az + t1 * dz];
}

function pushSegment(out: Pt3[], ax: number, az: number, bx: number, bz: number, heightAt: Height, stepM: number, lift: number): void {
  const len = Math.hypot(bx - ax, bz - az);
  const n = Math.max(1, Math.ceil(len / stepM));
  for (let k = 0; k < n; k++) {
    const t = k / n;
    const x = ax + (bx - ax) * t;
    const z = az + (bz - az) * t;
    out.push([x, heightAt(x, z) + lift, z]);
  }
}
