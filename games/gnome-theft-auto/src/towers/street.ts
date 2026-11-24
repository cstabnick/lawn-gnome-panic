// Tower street level and signage: striped shop awnings or a lobby canopy, the company sign (high on the face toward the
// city centre, and small over the door), and the mural on a side wall. Nothing below 3 m leaves the footprint.
import * as THREE from 'three';
import { LOBBY_H, TILE_W, box, colored, quad, type Facing } from './kit';
import { signUv } from './signAtlas';
import type { Mass, TowerGeoms, TowerSpec, TowerStyle } from './types';

/** Outward normal of each face. */
const NORMAL: Record<Facing, [number, number]> = { px: [1, 0], nx: [-1, 0], pz: [0, 1], nz: [0, -1] };
/** The side face of each front face (a quarter turn clockwise seen from above). */
const SIDE: Record<Facing, Facing> = { pz: 'nx', nx: 'nz', nz: 'px', px: 'pz' };
const OPPOSITE: Record<Facing, Facing> = { pz: 'nz', nz: 'pz', px: 'nx', nx: 'px' };
const FACES: Facing[] = ['pz', 'nz', 'px', 'nx'];

/** A face of a box mass: its centre on the wall plane, its length along the wall, and the along-wall axis. */
function face(m: Mass, f: Facing): { x: number; z: number; len: number; ax: [number, number] } {
  const [nx, nz] = NORMAL[f];
  return {
    x: m.x + (nx * m.w) / 2, z: m.z + (nz * m.d) / 2,
    len: nx !== 0 ? m.d : m.w,
    ax: nx !== 0 ? [0, 1] : [1, 0],
  };
}

/** Adds one tower's awnings / canopy, signs and mural to `out`. */
export function buildStreetLevel(
  spec: TowerSpec, style: TowerStyle, masses: readonly Mass[], out: TowerGeoms, _rnd: () => number,
): void {
  const ground = masses[0];
  const front: Facing = Math.abs(spec.x) > Math.abs(spec.z) ? (spec.x > 0 ? 'nx' : 'px') : (spec.z > 0 ? 'nz' : 'pz');
  let boxes = 0;
  const add = (g: THREE.BufferGeometry): void => { if (boxes < 40) { out.trim.push(g); boxes++; } };

  if (style.lobby === 'shops') {
    // One tilted awning per window bay, colours alternating, wall edge 0.05 inside the wall at y 3.6.
    for (const f of FACES) {
      const fc = face(ground, f);
      const [nx, nz] = NORMAL[f];
      let k = 0;
      for (let a = -Math.floor((fc.len / 2 - 3) / TILE_W) * TILE_W; a <= fc.len / 2 - 3 + 1e-6; a += TILE_W, k++) {
        const depth = 1.4, tilt = 0.28;
        const g = new THREE.BoxGeometry(fc.ax[0] ? 4.6 : depth, 0.15, fc.ax[0] ? depth : 4.6);
        // Tilt so the outer edge drops: about x for a z face, about z for an x face.
        if (nx === 0) g.rotateX(nz * tilt); else g.rotateZ(-nx * tilt);
        const out0 = (depth / 2) * Math.cos(tilt) - 0.05;
        const y = 3.6 - (depth / 2) * Math.sin(tilt);
        g.translate(fc.x + fc.ax[0] * a + nx * out0, y, fc.z + fc.ax[1] * a + nz * out0);
        add(colored(g, k % 2 ? 0xf4f1ea : style.awning));
      }
    }
  } else {
    // A flat canopy over the front and back doors, with a fascia under its outer edge.
    for (const f of [front, OPPOSITE[front]]) {
      const fc = face(ground, f);
      const [nx, nz] = NORMAL[f];
      const cw = Math.min(0.45 * fc.len, 14), depth = 2.2;
      const o = depth / 2 - 0.1;
      const sx = fc.ax[0] ? cw : depth, sz = fc.ax[0] ? depth : cw;
      add(box(sx, 0.35, sz, fc.x + nx * o, 4.1 - 0.35, fc.z + nz * o, style.awning));
      const fo = depth - 0.1 - 0.12;
      add(box(fc.ax[0] ? cw - 0.2 : 0.12, 0.55, fc.ax[0] ? 0.12 : cw - 0.2, fc.x + nx * fo, 4.1 - 0.35 - 0.5, fc.z + nz * fo, style.trim));
    }
  }

  /** A sign of width W centred at height yc on face f of mass m, with a backing board. */
  const sign = (m: Mass, f: Facing, W: number, yc: number, id: number): void => {
    const fc = face(m, f);
    const [nx, nz] = NORMAL[f];
    const H = W / 4;
    const bd = 0.34;
    const bo = bd / 2 - 0.05; // backing centre: its back 0.05 inside the wall
    add(box(fc.ax[0] ? W + 0.6 : bd, H + 0.6, fc.ax[0] ? bd : W + 0.6, fc.x + nx * bo, yc - (H + 0.6) / 2, fc.z + nz * bo, style.trim));
    const qo = bd - 0.05 + 0.12;
    out.sign.push(quad(fc.x + nx * qo, yc, fc.z + nz * qo, W, H, f, signUv(id)));
  };

  if (style.sign >= 0) {
    const tops = masses.slice(1).filter((m) => m.shape === 'box' && face(m, front).len >= 10);
    const high = tops.reduce<Mass | undefined>((a, m) => (!a || m.y1 > a.y1 ? m : a), undefined);
    const W2 = Math.min(0.5 * face(ground, front).len, 8);
    if (high) {
      const W = Math.min(0.7 * face(high, front).len, 16);
      // Only high up: on a low podium the top sign would sit on the street sign.
      if (high.y1 - 1.5 - W / 4 > LOBBY_H + 0.4 + W2 / 4 + 3) sign(high, front, W, high.y1 - 1.5 - W / 8, style.sign);
    }
    sign(ground, front, W2, LOBBY_H + 0.4 + W2 / 8, style.sign);
  }

  if (style.mural >= 0) {
    const side = SIDE[front];
    const wall = masses.slice(1).find((m) => m.shape === 'box' && face(m, side).len >= 10 && m.y1 - m.y0 >= 14);
    if (wall) {
      const fc = face(wall, side);
      const [nx, nz] = NORMAL[side];
      const S = Math.min(0.6 * fc.len, 0.6 * (wall.y1 - wall.y0), 14);
      const y = Math.max(wall.y0, LOBBY_H) + 2 + S / 2;
      out.sign.push(quad(fc.x + nx * 0.12, y, fc.z + nz * 0.12, S, S, side, signUv(style.mural)));
    }
  }
}
