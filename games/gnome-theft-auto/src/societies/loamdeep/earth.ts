// Loamdeep's packed earth (E17 issue B8): everything in the cell that is not a hall or a tunnel is solid earth.
// Solid earth is invisible colliders (2 m tall, like E05's walls) plus dark packed-earth tops and earth faces that
// face OUT of the solid into the open floor, so the dollhouse camera standing inside the earth sees through them.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { flatLayer, LAYER } from '@lawn/depth';
import type { InteriorKit } from '../../interiors/types';
import { LOAMDEEP, type Rect } from '../config';

const EARTH_H_COLLIDER = 2;
const TOP_Y = 0.03;
const TOP_COLOR = 0x3b2a1e;
const FACE_COLOR = 0x5a4030;
const ROOT_COLOR = 0xd8c8a0;
const ROOT_PROUD = 0.05;
const ROOT_RADIUS = 0.04;
const ROOT_CHANCE = 0.25;
const SEGMENT = 1;

/** Deterministic pseudo-random number in [0, 1) from an integer seed. */
function rnd(seed: number): number {
  let h = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function isOpen(x: number, z: number, open: readonly Rect[]): boolean {
  for (const r of open) {
    if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) return true;
  }
  return false;
}

/** The solid rectangles of `bounds` left after carving out every `open` rect, on a `cell`-metre grid, merged. */
export function carveEarth(bounds: Rect, open: readonly Rect[], cell: number): Rect[] {
  const cols = Math.max(0, Math.ceil((bounds.maxX - bounds.minX) / cell - 1e-9));
  const rows = Math.max(0, Math.ceil((bounds.maxZ - bounds.minZ) / cell - 1e-9));
  const out: Rect[] = [];
  // Active rectangles keyed by their column run; a run that repeats in the next row extends the rectangle.
  let active = new Map<string, { a: number; b: number; r0: number; r1: number }>();
  for (let r = 0; r <= rows; r++) {
    const runs: [number, number][] = [];
    if (r < rows) {
      const z = bounds.minZ + (r + 0.5) * cell;
      let start = -1;
      for (let c = 0; c <= cols; c++) {
        const solid = c < cols && !isOpen(bounds.minX + (c + 0.5) * cell, z, open);
        if (solid && start < 0) start = c;
        else if (!solid && start >= 0) {
          runs.push([start, c]);
          start = -1;
        }
      }
    }
    const next = new Map<string, { a: number; b: number; r0: number; r1: number }>();
    for (const [a, b] of runs) {
      const key = `${a},${b}`;
      const prev = active.get(key);
      if (prev) {
        prev.r1 = r + 1;
        next.set(key, prev);
      } else {
        next.set(key, { a, b, r0: r, r1: r + 1 });
      }
    }
    for (const [key, rect] of active) {
      if (!next.has(key)) out.push(toRect(bounds, cell, rect));
    }
    active = next;
  }
  return out;
}

function toRect(
  bounds: Rect,
  cell: number,
  s: { a: number; b: number; r0: number; r1: number },
): Rect {
  return {
    minX: bounds.minX + s.a * cell,
    maxX: Math.min(bounds.maxX, bounds.minX + s.b * cell),
    minZ: bounds.minZ + s.r0 * cell,
    maxZ: Math.min(bounds.maxZ, bounds.minZ + s.r1 * cell),
  };
}

/** Packed earth for Loamdeep: colliders and inward-facing earth faces round every hall and tunnel. */
export function buildEarth(kit: InteriorKit): void {
  const { w, d, h } = kit.size;
  const open: Rect[] = [...Object.values(LOAMDEEP.halls), ...Object.values(LOAMDEEP.tunnels)];
  const bounds: Rect = { minX: -w / 2, maxX: w / 2, minZ: -d / 2, maxZ: d / 2 };
  const solid = carveEarth(bounds, open, 1);

  const tops: THREE.BufferGeometry[] = [];
  const faces: THREE.BufferGeometry[] = [];
  const roots: THREE.BufferGeometry[] = [];
  const shade = new THREE.Color(FACE_COLOR);

  solid.forEach((rect, ri) => {
    const rw = rect.maxX - rect.minX;
    const rd = rect.maxZ - rect.minZ;
    const cx = (rect.minX + rect.maxX) / 2;
    const cz = (rect.minZ + rect.maxZ) / 2;

    // Invisible collider, 2 m tall.
    kit.block(rw, EARTH_H_COLLIDER, rd, cx, cz, { solid: true }).visible = false;

    // Dark packed-earth top.
    const top = new THREE.PlaneGeometry(rw, rd);
    top.applyMatrix4(
      new THREE.Matrix4().makeTranslation(cx, TOP_Y, cz).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2)),
    );
    tops.push(top);

    // Edges: north, south, west, east. Each has an outward normal (into the open floor).
    const edges = [
      { horiz: true, fixed: rect.minZ, u0: rect.minX, u1: rect.maxX, nx: 0, nz: -1 },
      { horiz: true, fixed: rect.maxZ, u0: rect.minX, u1: rect.maxX, nx: 0, nz: 1 },
      { horiz: false, fixed: rect.minX, u0: rect.minZ, u1: rect.maxZ, nx: -1, nz: 0 },
      { horiz: false, fixed: rect.maxX, u0: rect.minZ, u1: rect.maxZ, nx: 1, nz: 0 },
    ];
    edges.forEach((e, ei) => {
      const point = (u: number, off: number): [number, number] => {
        const f = e.fixed + (e.horiz ? e.nz : e.nx) * off;
        return e.horiz ? [u, f] : [f, u];
      };
      // Emit runs of 1 m segments whose outside neighbour is open floor.
      let runStart = NaN;
      let runEnd = NaN;
      const flush = (): void => {
        if (Number.isNaN(runStart)) return;
        emitFace(e, ri, ei, runStart, runEnd);
        runStart = NaN;
        runEnd = NaN;
      };
      for (let u = e.u0; u < e.u1 - 1e-9; u += SEGMENT) {
        const segEnd = Math.min(e.u1, u + SEGMENT);
        const [px, pz] = point((u + segEnd) / 2, 0.5);
        if (isOpen(px, pz, open)) {
          if (Number.isNaN(runStart) || runEnd !== u) {
            flush();
            runStart = u;
          }
          runEnd = segEnd;
        } else {
          flush();
        }
      }
      flush();
    });

    function emitFace(
      e: { horiz: boolean; fixed: number; nx: number; nz: number },
      r: number,
      edge: number,
      u0: number,
      u1: number,
    ): void {
      const yaw = Math.atan2(e.nx, e.nz);
      const mid = (u0 + u1) / 2;
      const mx = e.horiz ? mid : e.fixed;
      const mz = e.horiz ? e.fixed : mid;
      const seed = (r * 8 + edge) * 4096 + Math.round(u0 * 10);
      const s = 0.9 + 0.2 * rnd(seed);
      const plane = new THREE.PlaneGeometry(u1 - u0, h);
      plane.applyMatrix4(
        new THREE.Matrix4().makeTranslation(mx, h / 2, mz).multiply(new THREE.Matrix4().makeRotationY(yaw)),
      );
      paint(plane, shade, s);
      faces.push(plane);

      if (rnd(seed + 1) < ROOT_CHANCE) {
        const len = Math.min(u1 - u0, 1.2) * (0.5 + 0.5 * rnd(seed + 2));
        if (len >= 0.4) {
          const y = 0.3 + rnd(seed + 3) * (h - 0.6);
          const rx = mx + e.nx * ROOT_PROUD;
          const rz = mz + e.nz * ROOT_PROUD;
          const root = new THREE.CylinderGeometry(ROOT_RADIUS, ROOT_RADIUS, len, 5);
          const ry = e.horiz ? 0 : -Math.PI / 2;
          root.applyMatrix4(
            new THREE.Matrix4()
              .makeTranslation(rx, y, rz)
              .multiply(new THREE.Matrix4().makeRotationY(ry))
              .multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2)),
          );
          roots.push(root);
        }
      }
    }
  });

  const topMat = flatLayer(new THREE.MeshLambertMaterial({ color: TOP_COLOR }), LAYER.marking);
  const faceMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.FrontSide });
  const rootMat = new THREE.MeshLambertMaterial({ color: ROOT_COLOR });

  const addMerged = (geos: THREE.BufferGeometry[], mat: THREE.Material): void => {
    if (geos.length === 0) return;
    const merged = mergeGeometries(geos, false);
    if (!merged) return;
    kit.group.add(new THREE.Mesh(merged, mat));
  };
  addMerged(tops, topMat);
  addMerged(faces, faceMat);
  addMerged(roots, rootMat);
}

/** Gives every vertex of `geo` the face colour times `s` (a per-face shade variation). */
function paint(geo: THREE.BufferGeometry, base: THREE.Color, s: number): void {
  const count = geo.getAttribute('position').count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    colors[i * 3] = Math.min(1, base.r * s);
    colors[i * 3 + 1] = Math.min(1, base.g * s);
    colors[i * 3 + 2] = Math.min(1, base.b * s);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}
