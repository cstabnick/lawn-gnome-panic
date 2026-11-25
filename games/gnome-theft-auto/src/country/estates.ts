// Thorne Even-Estates' three Levelright building sites (E16 B1): hoardings with a gate, identical empty show-homes, the
// half-built house in scaffolding, the bucket crane, the materials yard, the site caravan and the sign at the gate.
// Everything is placed from EVEN_ESTATES (world coordinates); one culled static batch per site.
import * as THREE from 'three';
import { flatLayer, LAYER } from '@lawn/depth';
import { buildPieces, litWindow, textPlate, type HomePiece } from '../homes/pieces';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { E, EVEN_ESTATES, type EstateSite, type Footprint } from './types';

const PANEL = 4;          // hoarding panel length (site-hoarding is 4 m along its local x)
const GATE_W = 8;         // the gap in the hoarding, centred on the gate
const HOARD_H = 2.4;
const WALL = 0.3;         // hoarding collider thickness
const HOME_H = 4.75;
const BEIGE_SIGN = 0xd9c8a5;
const INK = 0x2b2116;

/** World point of a local (lx, lz) inside a footprint turned by its yaw. */
function rot(f: { x: number; z: number; yaw: number }, lx: number, lz: number): { x: number; z: number } {
  const c = Math.cos(f.yaw), sn = Math.sin(f.yaw);
  return { x: f.x + lx * c + lz * sn, z: f.z - lx * sn + lz * c };
}

/** Axis-aligned box around a centre and half sizes. */
function boxAt(x: number, z: number, hw: number, hd: number, h: number): Box {
  // h is a height above the ground; Box.h is the top in world y.
  return { minX: x - hw, maxX: x + hw, minZ: z - hd, maxZ: z + hd, h: heightAt(x, z) + h };
}

/** A footprint's own box (w along x, d along z in world terms). */
function footBox(f: Footprint, h: number): Box {
  return boxAt(f.x, f.z, f.w / 2, f.d / 2, h);
}

interface Side {
  /** 'z': a side along world x at z = at; 'x': a side along world z at x = at. */
  axis: 'x' | 'z';
  at: number;
  from: number;
  to: number;
  /** Outward normal. */
  nx: number;
  nz: number;
  /** Panel yaw: runs along the side. */
  yaw: number;
}

function sidesOf(s: EstateSite): Side[] {
  const r = s.hoarding;
  return [
    { axis: 'z', at: r.minZ, from: r.minX, to: r.maxX, nx: 0, nz: -1, yaw: 0 },
    { axis: 'z', at: r.maxZ, from: r.minX, to: r.maxX, nx: 0, nz: 1, yaw: 0 },
    { axis: 'x', at: r.minX, from: r.minZ, to: r.maxZ, nx: -1, nz: 0, yaw: E },
    { axis: 'x', at: r.maxX, from: r.minZ, to: r.maxZ, nx: 1, nz: 0, yaw: E },
  ];
}

const sidePoint = (sd: Side, t: number): { x: number; z: number } =>
  sd.axis === 'z' ? { x: sd.from + t, z: sd.at } : { x: sd.at, z: sd.from + t };

/** Hoarding panels and their colliders on the four sides, with the gap at the gate. Returns the gate's side and offset. */
function addHoarding(s: EstateSite, pieces: HomePiece[], boxes: Box[]): { side: Side; t: number } {
  const sides = sidesOf(s);
  const gateDist = (sd: Side): number => (sd.axis === 'z' ? Math.abs(s.gate.z - sd.at) : Math.abs(s.gate.x - sd.at));
  const gateSide = sides.reduce((a, b) => (gateDist(b) < gateDist(a) ? b : a));
  const gateT = (gateSide.axis === 'z' ? s.gate.x : s.gate.z) - gateSide.from;

  for (const sd of sides) {
    const len = sd.to - sd.from;
    const spans: [number, number][] = sd === gateSide
      ? [[0, gateT - GATE_W / 2], [gateT + GATE_W / 2, len]]
      : [[0, len]];
    for (const [a, b] of spans) {
      const n = Math.max(1, Math.round((b - a) / PANEL));
      const pl = (b - a) / n;
      for (let i = 0; i < n; i++) {
        const p = sidePoint(sd, a + (i + 0.5) * pl);
        pieces.push({ prefab: 'site-hoarding', x: p.x, z: p.z, yaw: sd.yaw, size: pl, solid: false });
      }
      // One thin collider per side segment.
      const p0 = sidePoint(sd, a), p1 = sidePoint(sd, b);
      boxes.push({
        minX: Math.min(p0.x, p1.x) - (sd.axis === 'x' ? WALL / 2 : 0),
        maxX: Math.max(p0.x, p1.x) + (sd.axis === 'x' ? WALL / 2 : 0),
        minZ: Math.min(p0.z, p1.z) - (sd.axis === 'z' ? WALL / 2 : 0),
        maxZ: Math.max(p0.z, p1.z) + (sd.axis === 'z' ? WALL / 2 : 0),
        h: heightAt((p0.x + p1.x) / 2, (p0.z + p1.z) / 2) + HOARD_H,
      });
    }
  }
  const g = sidePoint(gateSide, gateT);
  pieces.push({ prefab: 'site-hoarding-gate', x: g.x, z: g.z, yaw: gateSide.yaw, solid: false });
  return { side: gateSide, t: gateT };
}

/** A tall thin post as plain architecture. */
function post(scene: THREE.Scene, x: number, z: number, h: number): void {
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, h, 0.12), new THREE.MeshLambertMaterial({ color: 0x6b5a45 }));
  m.position.set(x, heightAt(x, z) + h / 2, z);
  m.name = 'estate-sign-post';
  scene.add(m);
}

/** The sign board outside the gate: 3 m x 1.6 m on two posts, facing out of the gate. */
function addSign(scene: THREE.Scene, s: EstateSite, gate: { side: Side; t: number }): void {
  const sd = gate.side;
  const along = sd.from + gate.t + 4;
  const cx = sd.axis === 'z' ? along : sd.at + sd.nx * 5;
  const cz = sd.axis === 'z' ? sd.at + sd.nz * 5 : along;
  const yaw = Math.atan2(sd.nx, sd.nz);
  const ax = sd.axis === 'z' ? 1.3 : 0, az = sd.axis === 'z' ? 0 : 1.3;
  post(scene, cx - ax, cz - az, 2.8);
  post(scene, cx + ax, cz + az, 2.8);
  const plate = textPlate(`THORNE EVEN-ESTATES\n${s.name}\nCOMING SOON: SAMENESS`,
    cx + sd.nx * 0.1, heightAt(cx, cz) + 2.0, cz + sd.nz * 0.1, yaw,
    { w: 3, h: 1.6, bg: BEIGE_SIGN, fg: INK });
  scene.add(plate);
}

/** Packed-dirt yard across the inside of the hoarding (a flat decal). */
function addYardDecal(scene: THREE.Scene, s: EstateSite): void {
  const r = s.hoarding;
  const cx = (r.minX + r.maxX) / 2, cz = (r.minZ + r.maxZ) / 2;
  const mat = flatLayer(new THREE.MeshLambertMaterial({ color: 0xb59b6e }), LAYER.area);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r.maxX - r.minX, r.maxZ - r.minZ), mat);
  m.rotation.x = -Math.PI / 2;
  // Low (1.5 cm): yard props stand 3-7 cm up, and the draw layer keeps it off the terrain.
  m.position.set(cx, heightAt(cx, cz) + 0.015, cz);
  m.name = 'estate-dirt';
  scene.add(m);
}

/** Show-homes: the same window lit and the same number on every door. */
function addHomes(scene: THREE.Scene, s: EstateSite, pieces: HomePiece[], boxes: Box[]): void {
  for (const h of s.homes) {
    pieces.push({ prefab: 'even-show-home', x: h.x, z: h.z, yaw: h.yaw, solid: false });
    boxes.push(footBox(h, HOME_H));
    const door = rot(h, 0, 3.57);
    const ground = heightAt(h.x, h.z);
    scene.add(textPlate('1', door.x, ground + 1.6, door.z, h.yaw, { w: 0.3, h: 0.22, bg: 0xefe3c8, fg: INK }));
    const win = rot(h, 2.0, 3.565);
    scene.add(litWindow(win.x, ground + 2.6, win.z, h.yaw, 0.8, 0.8));
  }
}

/** The half-built house: prefab, four scaffold bays outside it, and four corner posts as its only colliders. */
function addHalfBuilt(s: EstateSite, pieces: HomePiece[], boxes: Box[]): void {
  const hb = s.halfBuilt;
  pieces.push({ prefab: 'even-half-built', x: hb.x, z: hb.z, yaw: hb.yaw, solid: false });
  for (const [lx, lz, yaw] of [[0, -5, hb.yaw], [0, 5, hb.yaw], [-5, 0, hb.yaw + E], [5, 0, hb.yaw + E]] as const) {
    const p = rot(hb, lx, lz);
    pieces.push({ prefab: 'tower-scaffold', x: p.x, z: p.z, yaw, solid: false });
  }
  for (const [lx, lz] of [[-3.7, -3.7], [3.7, -3.7], [-3.7, 3.7], [3.7, 3.7]]) {
    const p = rot(hb, lx, lz);
    boxes.push(boxAt(p.x, p.z, 0.3, 0.3, 4));
  }
}

/** The bucket crane: footing collider; its jib points over the half-built house. */
function addCrane(s: EstateSite, pieces: HomePiece[], boxes: Box[]): void {
  const c = s.crane;
  const hb = s.halfBuilt;
  const yaw = Math.atan2(hb.x - c.x, hb.z - c.z);
  pieces.push({ prefab: 'bucket-crane', x: c.x, z: c.z, yaw, solid: false });
  boxes.push(boxAt(c.x, c.z, 1.5, 1.5, 14));
}

/** The materials yard (10 x 8): mixer, two pallets, girders, three cones, and a portaloo at a corner. */
function addYard(s: EstateSite, pieces: HomePiece[]): void {
  const y = s.yard;
  const at = (id: string, lx: number, lz: number): void => {
    const p = rot(y, lx, lz);
    pieces.push({ prefab: id, x: p.x, z: p.z, yaw: y.yaw });
  };
  at('site-portaloo', -3.8, -2.8);
  at('site-cement-mixer', -1.0, -2.2);
  at('clay-brick-pallet', 1.5, -2.6);
  at('clay-brick-pallet', 1.5, 1.2);
  at('mushroom-girder-stack', -1.0, 2.2);
  at('site-cone', 4.2, -3.5);
  at('site-cone', 4.2, 3.5);
  at('site-cone', -4.3, 3.8);
}

/** The site caravan: its footprint (3 x 6 in world terms) is the collider. */
function addCaravan(s: EstateSite, pieces: HomePiece[], boxes: Box[]): void {
  const c = s.caravan;
  pieces.push({ prefab: 'caravan', x: c.x, z: c.z, yaw: c.yaw, solid: false });
  boxes.push(footBox(c, 2.6));
}

/** Hoardings, show-homes, the half-built house in scaffolding, crane, yard, caravan and sign for every EVEN_ESTATES site. */
export function buildEstates(scene: THREE.Scene, boxes: Box[]): void {
  for (const s of EVEN_ESTATES) {
    const pieces: HomePiece[] = [];
    const siteBoxes: Box[] = [];
    const gate = addHoarding(s, pieces, siteBoxes);
    addHomes(scene, s, pieces, siteBoxes);
    addHalfBuilt(s, pieces, siteBoxes);
    addCrane(s, pieces, siteBoxes);
    addYard(s, pieces);
    addCaravan(s, pieces, siteBoxes);
    boxes.push(...siteBoxes, ...buildPieces(scene, pieces, 'estate-' + s.id));
    addYardDecal(scene, s);
    addSign(scene, s, gate);
  }
}
