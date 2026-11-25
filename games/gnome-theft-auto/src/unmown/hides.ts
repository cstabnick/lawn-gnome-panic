// The Unmown bird hides (E31): Reedmere Hide, Meadow Hide, Wood Hide.
// Each hide faces its habitat (the slot is on the prefab's +z), has a rules board by the door, a feeder, and a small
// props-only story. Walls are thin colliders with a gap at the back door, so the inside stays walkable.
import * as THREE from 'three';
import { buildStaticCells } from '../cull';
import { textPlate } from '../homes/pieces';
import { UNMOWN_HIDES } from '../living/config';
import { heightAt } from '../terrain';
import type { Box } from '../types';

interface HideSpec {
  id: string;
  /** World point the slot looks at (decides the yaw; the config's yaw is only a hint). */
  look: readonly [number, number];
  sign: string;
  vignette: 'reedmere' | 'meadow' | 'wood';
}

// Reedmere marsh (x -1260..-1040, z -1705..-1605) lies north-west of its hide (smaller z is north), not south as the
// config hint says; the Long Meadow (z -1760..-1520) is north of Meadow Hide (z -1490); Oldroot Wood is north-north-west
// of Wood Hide. Every yaw is computed with atan2 toward the habitat.
const SPECS: readonly HideSpec[] = [
  { id: 'unmown-hide-1', look: [-1150, -1655], sign: 'REEDMERE HIDE\nWhisper. The bittern is listening.\nIt is always listening.', vignette: 'reedmere' },
  { id: 'unmown-hide-2', look: [-560, -1640], sign: 'MEADOW HIDE\nPlease do not count the grass.\nWe tried. We ran out of numbers.', vignette: 'meadow' },
  { id: 'unmown-hide-3', look: [-1690, -1500], sign: 'WOOD HIDE\nThe fox was here first.\nKnock before entering.', vignette: 'wood' },
];

const HALF_X = 2.55;
const HALF_Z = 1.8;
const WALL_T = 0.075;
const WALL_H = 2.2;
const DOOR_GAP = 1.2;
const SINK = 0.1;

/** Hide-local (lx, lz) to world offset, for a three.js rotation.y of `yaw`. */
function rot(yaw: number, lx: number, lz: number): [number, number] {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return [lx * c + lz * s, -lx * s + lz * c];
}

/** Axis-aligned boxes along the local segment (ax,az)-(bx,bz), skipping any piece whose middle is inside the door gap. */
function wallBoxes(
  cx: number, cz: number, yaw: number, y0: number,
  ax: number, az: number, bx: number, bz: number, gap: boolean,
): Box[] {
  const len = Math.hypot(bx - ax, bz - az);
  const n = Math.max(1, Math.ceil(len / 0.7));
  const out: Box[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n;
    const mx = ax + (bx - ax) * ((t0 + t1) / 2);
    if (gap && Math.abs(mx) < DOOR_GAP / 2) continue;
    const [x0, z0] = rot(yaw, ax + (bx - ax) * t0, az + (bz - az) * t0);
    const [x1, z1] = rot(yaw, ax + (bx - ax) * t1, az + (bz - az) * t1);
    out.push({
      minX: cx + Math.min(x0, x1) - WALL_T, maxX: cx + Math.max(x0, x1) + WALL_T,
      minZ: cz + Math.min(z0, z1) - WALL_T, maxZ: cz + Math.max(z0, z1) + WALL_T,
      h: y0 + WALL_H,
    });
  }
  return out;
}

/** Builds the three bird hides. Pushes its colliders into `boxes`. Runs once from living/build.ts during the world build (also in tests: no DOM). */
export function buildUnmownHides(scene: THREE.Scene, boxes: Box[]): void {
  const placements: Parameters<typeof buildStaticCells>[0][number][] = [];
  const plates: THREE.Mesh[] = [];

  for (const spec of SPECS) {
    const def = UNMOWN_HIDES.find((h) => h.id === spec.id);
    if (!def) continue;
    const cx = def.x, cz = def.z;
    const yaw = Math.atan2(spec.look[0] - cx, spec.look[1] - cz);
    const y0 = heightAt(cx, cz);
    const baseY = y0 - SINK;

    /** Place a prefab at hide-local (lx, lz) (ground-following), local yaw offset. */
    const put = (id: string, lx: number, lz: number, dyaw = 0, scale?: number, lift = 0): void => {
      const [dx, dz] = rot(yaw, lx, lz);
      placements.push({ id, x: cx + dx, y: heightAt(cx + dx, cz + dz) + lift, z: cz + dz, yaw: yaw + dyaw, scale });
    };

    placements.push({ id: 'bird-hide', x: cx, y: baseY, z: cz, yaw });

    // Walls: front (slot side, +z), back (door side, -z, with a gap), two ends.
    boxes.push(
      ...wallBoxes(cx, cz, yaw, y0, -HALF_X, HALF_Z, HALF_X, HALF_Z, false),
      ...wallBoxes(cx, cz, yaw, y0, -HALF_X, -HALF_Z, HALF_X, -HALF_Z, true),
      ...wallBoxes(cx, cz, yaw, y0, -HALF_X, -HALF_Z, -HALF_X, HALF_Z, false),
      ...wallBoxes(cx, cz, yaw, y0, HALF_X, -HALF_Z, HALF_X, HALF_Z, false),
    );

    // Rules board beside the door, facing away from the hide (local -z), with its text plate.
    const boardYaw = yaw + Math.PI;
    const [bx, bz] = rot(yaw, 2.4, -3.6);
    const bX = cx + bx, bZ = cz + bz, bY = heightAt(bX, bZ);
    placements.push({ id: 'rules-board', x: bX, y: bY, z: bZ, yaw: boardYaw });
    const [px, pz] = rot(boardYaw, 0, 0.09);
    plates.push(textPlate(spec.sign, bX + px, bY + 1.45, bZ + pz, boardYaw, { w: 1.3, h: 0.8 }));
    boxes.push({ minX: bX - 0.4, maxX: bX + 0.4, minZ: bZ - 0.4, maxZ: bZ + 0.4, h: bY + 2.25 });

    // Feeder nearby.
    put('bird-feeder', -3.6, -2.6);
    put('bird-box', 3.8, 1.0);

    if (spec.vignette === 'reedmere') {
      // A tripod with its telescope knocked over, a flask, a notebook with one line crossed out.
      put('camera-tripod', -1.5, -0.6, 0.6, undefined, 0);
      put('field-binoculars', -0.9, -0.2, 1.1);
      put('honeydew-flask', 0.9, 0.5);
      const [nx, nz] = rot(yaw, 1.4, -0.4);
      const nX = cx + nx, nZ = cz + nz, nY = heightAt(nX, nZ);
      placements.push({ id: 'red-book', x: nX, y: nY + 0.03, z: nZ, yaw: yaw + 0.4, scale: 0.7 });
      plates.push(textPlate('Heard a bittern.\n-----------', nX, nY + 0.07, nZ, yaw, { w: 0.2, h: 0.12 }));
      plates[plates.length - 1].rotation.x = -Math.PI / 2;
    } else if (spec.vignette === 'meadow') {
      // A folding chair facing the wrong way (at the wall), 30 sweet wrappers, binoculars.
      put('deck-chair', 0.4, 1.2, 0);
      for (let i = 0; i < 30; i++) {
        const a = i * 2.4, r = 0.15 + 0.07 * Math.sqrt(i);
        put('red-book', -1.2 + Math.cos(a) * r, -0.6 + Math.sin(a) * r, a, 0.12, 0.02);
      }
      put('field-binoculars', 1.5, 0.3, 0.3);
    } else {
      // One muddy boot by the door and a trail of acorns leading inside.
      put('court-boots', 0.9, -3.0, 0.5, 0.6);
      for (let i = 0; i < 7; i++) put('acorn', 0.4 - i * 0.07, -2.6 + i * 0.55, i, 0.6, 0.02);
    }
  }

  scene.add(buildStaticCells(placements, { name: 'unmown-hides' }));
  for (const p of plates) scene.add(p);
}
