// The tower kit: the few geometry pieces every tower is built from, so all towers merge into a handful of meshes
// (one per material in TowerGeoms). Every geometry made here is indexed and carries position, normal, uv and color
// (and facade walls also aTile), so the lists merge with mergeGeometries.
import * as THREE from 'three';
import type { Mass } from './types';

/** One facade tile repeats every TILE_W metres across and TILE_H metres up (two windows by two floors of 3.2 m). */
export const TILE_W = 6;
export const TILE_H = 6.4;
/** Ground floor height: the lobby or shopfront band runs 0..LOBBY_H on every tower. */
export const LOBBY_H = 4.5;

/** A seeded random number generator (mulberry32): the same seed always gives the same sequence in 0..1. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A stable integer seed from a position (towers are seeded by where they stand, never by build order). */
export function hash2(x: number, z: number): number {
  let h = Math.imul(Math.round(x * 10) | 0, 73856093) ^ Math.imul(Math.round(z * 10) | 0, 19349663);
  h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
  return (h ^ (h >>> 15)) >>> 0;
}

/** Adds a per-vertex colour attribute (hex) to a geometry and returns it. */
export function colored<T extends THREE.BufferGeometry>(g: T, hex: number): T {
  const c = new THREE.Color(hex);
  const n = g.getAttribute('position').count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
}

/** A coloured box w x h x d whose BOTTOM is at y, centred on (x, z), turned ry radians about y. */
export function box(w: number, h: number, d: number, x: number, y: number, z: number, hex: number, ry = 0): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  if (ry) g.rotateY(ry);
  return colored(g.translate(x, y + h / 2, z), hex);
}

/** A coloured cylinder (or cone when rTop is 0) whose BOTTOM is at y, centred on (x, z). */
export function cyl(rTop: number, rBot: number, h: number, seg: number, x: number, y: number, z: number, hex: number): THREE.BufferGeometry {
  return colored(new THREE.CylinderGeometry(rTop, rBot, h, seg).translate(x, y + h / 2, z), hex);
}

/** A coloured sphere centred on (x, y, z). */
export function ball(r: number, x: number, y: number, z: number, hex: number): THREE.BufferGeometry {
  return colored(new THREE.SphereGeometry(r, 8, 6).translate(x, y, z), hex);
}

/** Which way a wall (or a sign on it) faces. */
export type Facing = 'px' | 'nx' | 'pz' | 'nz';

/**
 * A flat quad facing `facing`, centred at (x, y, z), w wide and h tall, with uv mapped to the atlas rectangle
 * [u0, v0, u1, v1] (sign atlas, signAtlas.ts signUv). Put it at least 0.12 m out from the wall it hangs on.
 */
export function quad(x: number, y: number, z: number, w: number, h: number, facing: Facing, uvRect: readonly [number, number, number, number]): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(w, h); // faces +z
  const rot = { pz: 0, px: Math.PI / 2, nz: Math.PI, nx: -Math.PI / 2 }[facing];
  g.rotateY(rot);
  g.translate(x, y, z);
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  const [u0, v0, u1, v1] = uvRect;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
  return colored(g, 0xffffff);
}

/**
 * The walls of one mass as facade geometry: the four sides of a box, or the side of a cylinder (16 sides), no top or
 * bottom (caps are trim: capFor). UVs are in tile repeats and world-aligned (v = y / TILE_H), so floors line up across
 * stacked masses; each wall starts its u at a whole tile so windows sit centred. `tint` multiplies the texture.
 */
export function facadeWalls(m: Mass, tile: number, tint: number): THREE.BufferGeometry {
  const pos: number[] = [], nor: number[] = [], uvs: number[] = [], idx: number[] = [];
  const quadWall = (ax: number, az: number, bx: number, bz: number, nx: number, nz: number, u0: number, u1: number): void => {
    const base = pos.length / 3;
    const v0 = m.y0 / TILE_H, v1 = m.y1 / TILE_H;
    pos.push(ax, m.y0, az, bx, m.y0, bz, bx, m.y1, bz, ax, m.y1, az);
    for (let k = 0; k < 4; k++) nor.push(nx, 0, nz);
    uvs.push(u0, v0, u1, v0, u1, v1, u0, v1);
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  if (m.shape === 'box') {
    const x0 = m.x - m.w / 2, x1 = m.x + m.w / 2, z0 = m.z - m.d / 2, z1 = m.z + m.d / 2;
    // Whole tiles across each face, centred: a face of length L shows L / TILE_W tiles from -L/2 to L/2.
    const uw = m.w / TILE_W / 2, ud = m.d / TILE_W / 2;
    quadWall(x0, z1, x1, z1, 0, 1, -uw, uw);     // +z face, left to right seen from outside
    quadWall(x1, z0, x0, z0, 0, -1, -uw, uw);    // -z face
    quadWall(x1, z1, x1, z0, 1, 0, -ud, ud);     // +x face
    quadWall(x0, z0, x0, z1, -1, 0, -ud, ud);    // -x face
  } else {
    const seg = 16, r = m.w / 2;
    const around = (2 * Math.PI * r) / TILE_W;
    const u = Math.max(1, Math.round(around));
    for (let s = 0; s < seg; s++) {
      const a0 = (s / seg) * Math.PI * 2, a1 = ((s + 1) / seg) * Math.PI * 2;
      const base = pos.length / 3;
      const v0 = m.y0 / TILE_H, v1 = m.y1 / TILE_H;
      const p = (a: number): [number, number] => [m.x + Math.sin(a) * r, m.z + Math.cos(a) * r];
      const [ax, az] = p(a0), [bx, bz] = p(a1);
      pos.push(ax, m.y0, az, bx, m.y0, bz, bx, m.y1, bz, ax, m.y1, az);
      nor.push(Math.sin(a0), 0, Math.cos(a0), Math.sin(a1), 0, Math.cos(a1), Math.sin(a1), 0, Math.cos(a1), Math.sin(a0), 0, Math.cos(a0));
      const ua = (s / seg) * u, ub = ((s + 1) / seg) * u;
      uvs.push(ua, v0, ub, v0, ub, v1, ua, v1);
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute('aTile', new THREE.Float32BufferAttribute(new Array(pos.length / 3).fill(tile), 1));
  g.setIndex(idx);
  return colored(g, tint);
}

/**
 * The roof cap (or ledge) on top of a mass, as trim: a slab from y1 - 0.3 to y1 + 0.35, `overhang` wider than the
 * mass on every side (at least 0.15, so its sides stand proud of the walls). A cylinder gets a round cap.
 */
export function capFor(m: Mass, hex: number, overhang = 0.3): THREE.BufferGeometry {
  const o = Math.max(0.15, overhang);
  if (m.shape === 'cyl') return cyl(m.w / 2 + o, m.w / 2 + o, 0.65, 16, m.x, m.y1 - 0.3, m.z, hex);
  return box(m.w + 2 * o, 0.65, m.d + 2 * o, m.x, m.y1 - 0.3, m.z, hex);
}

/** Top of the cap capFor puts on a mass: where roof gear stands. */
export const capTop = (m: Mass): number => m.y1 + 0.35;
