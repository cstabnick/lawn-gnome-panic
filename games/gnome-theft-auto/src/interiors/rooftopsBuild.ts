// Rooftops from the downtown towers and the Double Pot slab (E05, L75): registers them (rooftops.ts addRooftop), adds
// parapet colliders and meshes, and the helipad on the slab. Built once by buildRooftops (app.ts, after buildWorld).
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MEGA_BLOCK } from '../city/megaBlock';
import type { Box, World } from '../types';
import { lastTowerSpecs, lastTowerStyles } from '../towers/index';
import { landmarkFor } from '../towers/landmarks';
import { massesFor } from '../towers/silhouettes';
import { addRooftop, ROOFTOPS } from './rooftops';
import type { Rooftop } from './types';

/** Parapet height above the roof and wall thickness, metres. */
export const PARAPET_H = 1.1;
export const PARAPET_T = 0.35;

/** Inset of a parapet wall inside the rim, metres. */
const INSET = 0.15;
/** Shortest parapet piece kept after a pad gap is cut, metres. */
const MIN_PIECE = 0.3;

/** Pieces of [a, b] left after removing [cutA, cutB] (no cut when null); pieces shorter than MIN_PIECE are dropped. */
function splitSpan(a: number, b: number, cutA: number | null, cutB: number | null): [number, number][] {
  if (cutA === null || cutB === null) return [[a, b]];
  const out: [number, number][] = [];
  if (Math.min(cutA, b) - a >= MIN_PIECE) out.push([a, Math.min(cutA, b)]);
  if (b - Math.max(cutB, a) >= MIN_PIECE) out.push([Math.max(cutB, a), b]);
  return out;
}

/**
 * Pure: the parapet boxes for one rooftop (empty when parapet is false). Each wall runs along one walled side, inset
 * 0.15 m inside the rim, top at r.y + PARAPET_H. A side crossed by r.pad's circle is split so the gap clears the pad.
 */
export function parapetBoxes(r: Rooftop): Box[] {
  const sides: ('n' | 's' | 'e' | 'w')[] = r.parapet === true ? ['n', 's', 'e', 'w'] : r.parapet === false ? [] : r.parapet;
  const h = r.y + PARAPET_H;
  const I = INSET;
  const T = PARAPET_T;
  const pad = r.pad;
  const out: Box[] = [];

  for (const side of sides) {
    if (side === 'n' || side === 's') {
      const z0 = side === 'n' ? r.minZ + I : r.maxZ - I - T;
      const hit = pad !== undefined && Math.abs(pad.z - (z0 + T / 2)) < pad.r;
      const spans = splitSpan(r.minX + I, r.maxX - I, hit ? pad.x - pad.r : null, hit ? pad.x + pad.r : null);
      for (const [a, b] of spans) out.push({ minX: a, maxX: b, minZ: z0, maxZ: z0 + T, h });
    } else {
      const x0 = side === 'w' ? r.minX + I : r.maxX - I - T;
      const hit = pad !== undefined && Math.abs(pad.x - (x0 + T / 2)) < pad.r;
      const spans = splitSpan(r.minZ + I, r.maxZ - I, hit ? pad.z - pad.r : null, hit ? pad.z + pad.r : null);
      for (const [a, b] of spans) out.push({ minX: x0, maxX: x0 + T, minZ: a, maxZ: b, h });
    }
  }
  return out;
}

let built = false;

/**
 * Registers a rooftop for every downtown tower (towers/index.ts lastTowerSpecs + lastTowerStyles) and the Double Pot
 * slab, pushes the parapet boxes into world.boxes and adds one merged parapet mesh plus the slab helipad to the scene.
 * Call once, after buildWorld.
 */
export function buildRooftops(scene: THREE.Scene, world: World): void {
  if (built) return;
  built = true;

  // 1. Towers: the roof is the mass with the highest top. Round roofs get no rooftop.
  lastTowerSpecs.forEach((spec, i) => {
    const style = lastTowerStyles[i];
    if (!style) return;
    const masses = massesFor(spec, style);
    let top = masses[0];
    for (const m of masses) if (m.y1 > top.y1) top = m;
    if (top.shape === 'cyl') return;

    const pad = style.crown === 'helipad' && Math.min(top.w, top.d) >= 12
      ? { x: top.x, z: top.z, r: Math.min(top.w, top.d) / 2 - 1.5 }
      : undefined;
    const landmark = landmarkFor(spec);
    const def: Rooftop = {
      id: landmark?.id ?? 'tower-' + i,
      name: landmark?.name,
      minX: top.x - top.w / 2,
      maxX: top.x + top.w / 2,
      minZ: top.z - top.d / 2,
      maxZ: top.z + top.d / 2,
      y: spec.h,
      solid: true,
      parapet: true,
      pad,
    };
    try {
      addRooftop(def);
    } catch {
      addRooftop({ ...def, id: 'tower-' + i });
    }
  });

  // 2. The Double Pot slab: no box collider (the street runs under it); terrain.ts stands bodies on it.
  addRooftop({
    id: 'double-pot-slab',
    name: 'Thorne Helipad (the Double Pot)',
    minX: 111,
    maxX: 129,
    minZ: -110.7,
    maxZ: -69.3,
    y: MEGA_BLOCK.roof.y,
    solid: false,
    parapet: ['n', 's'],
    pad: { x: 120, z: -92, r: 7 },
  });

  // 3. Parapets: colliders into world.boxes, one merged mesh.
  const geoms: THREE.BufferGeometry[] = [];
  for (const r of ROOFTOPS) {
    for (const b of parapetBoxes(r)) {
      world.boxes.push(b);
      const bottom = r.y - 0.05;
      const g = new THREE.BoxGeometry(b.maxX - b.minX, b.h - bottom, b.maxZ - b.minZ);
      g.translate((b.minX + b.maxX) / 2, (bottom + b.h) / 2, (b.minZ + b.maxZ) / 2);
      geoms.push(g);
    }
  }
  if (geoms.length > 0) {
    const merged = mergeGeometries(geoms, false);
    for (const g of geoms) g.dispose();
    if (merged) {
      const mesh = new THREE.Mesh(merged, new THREE.MeshStandardMaterial({ color: 0xa7a39a, roughness: 0.95 }));
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      mesh.name = 'rooftop-parapets';
      scene.add(mesh);
    }
  }

  // 4. The slab helipad: widest side 12 m, bottom on the slab, centred on the pad point (120, -92).
  const heli = buildPrefab('tower-helipad', { lights: false, shadows: false });
  const bb0 = new THREE.Box3().setFromObject(heli);
  const widest = Math.max(bb0.max.x - bb0.min.x, bb0.max.z - bb0.min.z);
  if (widest > 0) heli.scale.setScalar(12 / widest);
  const bb = new THREE.Box3().setFromObject(heli);
  const cx = (bb.min.x + bb.max.x) / 2;
  const cz = (bb.min.z + bb.max.z) / 2;
  heli.position.set(120 - cx, MEGA_BLOCK.roof.y + 0.02 - bb.min.y, -92 - cz);
  heli.name = 'double-pot-helipad';
  scene.add(heli);
}
