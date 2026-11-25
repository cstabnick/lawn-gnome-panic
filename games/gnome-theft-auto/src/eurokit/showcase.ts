// The ?eurokit lab (E29): the European kit laid out on clear ground for smoke, zfight and screenshots. Never in the normal world.
import type * as THREE from 'three';
import { buildStaticPrefabs, type StaticPrefabPlacement } from '@lawn/prefabs';
import { roundBox } from '../collide';
import type { Box, VehicleKind } from '../types';
import { euroBuilding } from './catalog';
import { planStreetRow } from './street';

export interface EuroShowcaseDeps {
  scene: THREE.Scene;
  /** world.boxes: the showcase looks for clear ground among them and adds its buildings' colliders. */
  boxes: Box[];
  heightAt(x: number, z: number): number;
  /** Search for clear ground starts here (the player's start). */
  near: { x: number; z: number };
}

export interface EuroShowcase {
  /** Where the player stands (facing down the street). */
  stand: { x: number; z: number; yaw: number };
  /** The European rides to park (app.ts creates them with createVehicle). */
  parked: { kind: VehicleKind; x: number; z: number; yaw: number }[];
}

const SITE_W = 100;
const SITE_D = 80;
const MAX_FALL = 2.5;

function siteFits(boxes: readonly Box[], heightAt: (x: number, z: number) => number, cx: number, cz: number): boolean {
  const x0 = cx - SITE_W / 2, x1 = cx + SITE_W / 2, z0 = cz - SITE_D / 2, z1 = cz + SITE_D / 2;
  for (const b of boxes) if (b.minX < x1 && b.maxX > x0 && b.minZ < z1 && b.maxZ > z0) return false;
  let lo = Infinity, hi = -Infinity;
  for (let x = x0; x <= x1 + 1e-6; x += 10) {
    for (let z = z0; z <= z1 + 1e-6; z += 10) {
      const h = heightAt(x, z);
      if (h < lo) lo = h;
      if (h > hi) hi = h;
    }
  }
  return hi - lo < MAX_FALL;
}

/** Centre of the first 100 x 80 m level, box-free rectangle found on rings (every 20 m) around `near`, out to 600 m. */
export function findShowcaseSite(
  boxes: readonly Box[],
  heightAt: (x: number, z: number) => number,
  near: { x: number; z: number },
): { x: number; z: number } {
  for (let ring = 0; ring <= 30; ring++) {
    for (let i = -ring; i <= ring; i++) {
      for (let j = -ring; j <= ring; j++) {
        if (Math.max(Math.abs(i), Math.abs(j)) !== ring) continue;
        const cx = near.x + i * 20, cz = near.z + j * 20;
        if (siteFits(boxes, heightAt, cx, cz)) return { x: cx, z: cz };
      }
    }
  }
  return { x: near.x, z: near.z - 60 };
}

/** Axis-aligned collider of a footprint w x d centred at (x, z) turned by yaw. */
function footprintBox(x: number, z: number, w: number, d: number, yaw: number, h: number): Box {
  const c = Math.abs(Math.cos(yaw)), s = Math.abs(Math.sin(yaw));
  const hx = (c * w + s * d) / 2, hz = (s * w + c * d) / 2;
  return { minX: x - hx, maxX: x + hx, minZ: z - hz, maxZ: z + hz, h };
}

/** Build the showcase. */
export function buildEuroShowcase(deps: EuroShowcaseDeps): EuroShowcase {
  const { heightAt, boxes } = deps;
  const site = findShowcaseSite(boxes, heightAt, deps.near);
  const cx = site.x, cz = site.z;
  const x0 = cx - 50;
  const rowZ = cz - 12; // frontage line of the row
  const out: StaticPrefabPlacement[] = [];

  const put = (id: string, x: number, z: number, yaw = 0, extra: Partial<StaticPrefabPlacement> = {}): void => {
    out.push({ id, x, y: heightAt(x, z), z, yaw, ...extra });
  };

  // Ground: pavement strip (4 m) in front of the row, cobbles (6 m) beyond it, a paved square at the far end.
  for (let i = 0; i < 30; i++) {
    const x = x0 + 1 + i * 2;
    for (let k = 0; k < 2; k++) put('euro-paving-tile', x, rowZ + 1 + k * 2);
    for (let k = 0; k < 3; k++) put('euro-cobble-tile', x, rowZ + 5 + k * 2);
  }
  for (let i = 0; i < 18; i++) for (let k = 0; k < 5; k++) put('euro-paving-tile', cx + 13 + i * 2, rowZ + 1 + k * 2);

  // Street row, every footprint corner on or above the ground.
  const row = planStreetRow({ x: x0, z: rowZ, yaw: 0, length: 60, seed: 29, corner: true });
  for (const p of row) {
    const b = euroBuilding(p.id);
    if (!b) continue;
    const hx = b.width / 2, hz = b.depth / 2, c = Math.cos(p.yaw), s = Math.sin(p.yaw);
    let y = Infinity;
    for (const [lx, lz] of [[-hx, -hz], [hx, -hz], [-hx, hz], [hx, hz]]) {
      y = Math.min(y, heightAt(p.x + lx * c + lz * s, p.z - lx * s + lz * c));
    }
    out.push({ id: p.id, x: p.x, y, z: p.z, yaw: p.yaw, scale: p.scale, tint: p.tint, trim: p.trim });
    boxes.push(footprintBox(p.x, p.z, b.width, b.depth, p.yaw, b.height));
  }

  // Furniture along the pavement.
  const fz = rowZ + 3;
  for (let i = 0; i < 6; i++) {
    const x = x0 + 5 + i * 10;
    put('euro-lamp-post', x, fz);
    boxes.push(roundBox(x, fz, 0.2, 4));
  }
  for (let i = 0; i < 5; i++) put('euro-bollard', x0 + 10 + i * 10, fz + 0.4);
  put('euro-flower-trough', x0 + 12, rowZ + 3.4);
  put('euro-flower-trough', x0 + 32, rowZ + 3.4);
  for (let i = 0; i < 3; i++) put('euro-iron-railing', x0 + 40 + i * 2.06, rowZ + 3.6);
  put('euro-bike-rack', x0 + 47, rowZ + 3.2);
  put('euro-chalkboard-sign', x0 + 52, rowZ + 3.4);
  put('euro-poster-board', x0 + 25, rowZ + 3.6);
  put('euro-street-sign', x0 + 1, rowZ + 3.4);
  const tx = x0 + 57, tz = rowZ + 2;
  put('euro-cafe-table', tx, tz);
  put('euro-cafe-chair', tx - 0.8, tz);
  put('euro-cafe-chair', tx + 0.8, tz);
  // Vignette 1: a chair knocked over beside a table (lying on its side, raised by half its width).
  put('euro-cafe-table', tx - 3, tz);
  put('euro-cafe-chair', tx - 3.9, tz + 0.4, 0, { y: heightAt(tx - 3.9, tz + 0.4) + 0.25, rot: [0, 0, Math.PI / 2] });
  // Vignette 3: the bike rack holds a single geranium pot in place of a bike.
  put('euro-geranium-pot', x0 + 47, rowZ + 3.2);

  // Far-end square: fountain, kiosk and post booth.
  const fx = cx + 30, fzs = rowZ + 5;
  put('euro-fountain', fx, fzs);
  boxes.push(roundBox(fx, fzs, 2, 1));
  for (const [id, x, z] of [['euro-tabac-kiosk', cx + 40, rowZ + 3], ['euro-post-booth', cx + 43, rowZ + 3]] as const) {
    const b = euroBuilding(id);
    put(id, x, z);
    if (b) boxes.push(footprintBox(x, z, b.width, b.depth, 0, b.height));
  }

  // Landmarks across the street, fronts toward the row, 3 m apart.
  const landmarks = ['euro-opera-hall', 'euro-steeple-church', 'euro-market-hall', 'euro-apartment-block', 'euro-canal-boathouse'];
  let lx = x0;
  for (const id of landmarks) {
    const b = euroBuilding(id);
    if (!b) continue;
    const x = lx + b.width / 2, z = rowZ + 16 + b.depth / 2;
    put(id, x, z, Math.PI);
    boxes.push(footprintBox(x, z, b.width, b.depth, Math.PI, b.height));
    lx += b.width + 3;
  }

  // Back garden behind the row.
  const gz = cz - 38;
  for (let i = 0; i < 10; i++) put('euro-ivy-wall', x0 + 2 + i * 3.06, gz);
  put('euro-boules-court', x0 + 10, cz - 30);
  put('euro-vine-pergola', x0 + 30, cz - 30);
  put('euro-bistro-set', x0 + 30, cz - 30);
  put('euro-washing-line', x0 + 48, cz - 28);
  // Vignette 2: the boules court's own stray boule (modelled in the prefab, far from the jack), and a bistro chair dragged
  // off to the washing line, where someone gave up on the game and sat down to watch the laundry instead.
  put('euro-cafe-chair', x0 + 50, cz - 26.5, Math.PI);
  put('euro-topiary-spiral', x0 + 4, cz - 26);
  put('euro-topiary-lollipop', x0 + 7, cz - 26);
  for (let i = 0; i < 3; i++) put('euro-box-hedge', x0 + 16 + i * 2.2, cz - 24);
  put('euro-geranium-bed', x0 + 20, cz - 33);
  put('euro-geranium-bed', x0 + 23, cz - 33);
  put('euro-geranium-pot', x0 + 4, cz - 33);
  put('euro-geranium-pot', x0 + 6, cz - 33);
  put('euro-espalier-pear', x0 + 40, gz + 1);
  put('euro-plane-tree', x0 + 56, cz - 33);
  put('euro-rose-arch', x0 + 20, cz - 27);
  put('euro-water-butt', x0 + 58, cz - 24);

  deps.scene.add(buildStaticPrefabs(out, { name: 'eurokit-showcase' }));

  const kinds: VehicleKind[] = ['euro-hatch', 'deux-pots', 'wespa', 'baguette-trike', 'crepe-van'];
  const parked = kinds.map((kind, i) => ({ kind, x: x0 + 8 + i * 6, z: rowZ + 9, yaw: Math.PI / 2 }));
  return { stand: { x: x0 + 2, z: rowZ + 7, yaw: Math.PI / 2 }, parked };
}
