// Test-only: a JSON snapshot of everything the world build produces (colliders, walk points, parked mowers, barrels, the
// road graph, every static prefab placement, a fingerprint of every object in the scene) plus the layout constants and
// the quest givers. layout.golden.test.ts compares a fresh snapshot with src/data/layout.golden.json.
import * as THREE from 'three';
import type { StaticPrefabPlacement } from '@lawn/prefabs';
import type { World } from '../types';

export interface Batch { name: string; items: StaticPrefabPlacement[] }

/** Rounded to 4 decimals (and -0 becomes 0), so the fixture is small and stable. */
export const r4 = (v: number): number => {
  const n = Math.round(v * 1e4) / 1e4;
  return n === 0 ? 0 : n;
};

/** Every number in a plain value rounded with r4; functions dropped. */
export function roundDeep(v: unknown): unknown {
  if (typeof v === 'number') return r4(v);
  if (Array.isArray(v)) return v.map(roundDeep);
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) {
      if (typeof x === 'function' || x instanceof THREE.Object3D) continue;
      out[k] = roundDeep(x);
    }
    return out;
  }
  return v;
}

const key = (o: unknown): string => JSON.stringify(o);
/** Sorted copy (by the JSON of each rounded entry): for lists whose order the game does not depend on. */
const sorted = <T>(list: T[]): T[] => [...list].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));

function materialInfo(m: THREE.Material | THREE.Material[]): unknown {
  const one = (x: THREE.Material): unknown => {
    const s = x as THREE.MeshStandardMaterial;
    return { type: x.type, color: s.color ? s.color.getHex() : null, po: x.polygonOffset ? [x.polygonOffsetFactor, x.polygonOffsetUnits] : null };
  };
  return Array.isArray(m) ? m.map(one) : one(m);
}

/** One line per top-level scene object: what it is, where it is, how big it is. Sorted, so build order does not matter. */
export function sceneFingerprint(scene: THREE.Scene): unknown[] {
  scene.updateMatrixWorld(true);
  const out: unknown[] = [];
  for (const o of scene.children) {
    let verts = 0;
    const mats: unknown[] = [];
    const seen = new Set<unknown>();
    o.traverse((c) => {
      const mesh = c as THREE.Mesh;
      if (mesh.isMesh) {
        const pos = mesh.geometry.getAttribute('position');
        verts += pos ? pos.count : 0;
        // A batch split per cell for culling (cull.ts buildStaticCells) repeats the same few materials once per cell:
        // list each distinct one once, as the single merged batch did.
        if (o.userData.cullCells) {
          if (seen.has(mesh.material)) return;
          seen.add(mesh.material);
        }
        if (mats.length < 3) mats.push(materialInfo(mesh.material));
      }
    });
    const box = new THREE.Box3().setFromObject(o);
    const bb = box.isEmpty() ? null : [box.min.x, box.min.y, box.min.z, box.max.x, box.max.y, box.max.z];
    out.push(roundDeep({
      type: o.type, name: o.name,
      p: [o.position.x, o.position.y, o.position.z],
      r: [o.rotation.x, o.rotation.y, o.rotation.z],
      s: [o.scale.x, o.scale.y, o.scale.z],
      bb, verts, mats,
    }));
  }
  return sorted(out);
}

export interface LayoutSnapshot {
  layout: unknown;
  givers: unknown;
  world: unknown;
  batches: unknown;
  scene: unknown[];
}

export function snapshotLayout(
  scene: THREE.Scene, world: World, batches: Batch[], layout: Record<string, unknown>, givers: Record<string, unknown>,
): LayoutSnapshot {
  return {
    layout: roundDeep(layout),
    givers: roundDeep(givers),
    world: {
      half: world.half,
      spawn: roundDeep(world.spawn),
      hospital: roundDeep(world.hospital),
      base: roundDeep(world.base),
      airfield: roundDeep(world.airfield),
      boxes: sorted(world.boxes.map((b) => roundDeep(b))),
      walkPoints: sorted(world.walkPoints.map((p) => roundDeep(p))),
      parked: sorted(world.parked.map((p) => roundDeep(p))),
      dewBarrels: sorted((world.dewBarrels ?? []).map((d) => roundDeep({ x: d.x, y: d.y, z: d.z }))),
      roads: world.roads.nodes.map((n) => roundDeep({ id: n.id, x: n.x, z: n.z, links: [...n.links].sort((a, b) => a - b) })),
    },
    batches: batches.map((b) => ({ name: b.name, items: b.items.map((i) => roundDeep(i)) })),
    scene: sceneFingerprint(scene),
  };
}

/** Paths where two snapshots differ by more than `tol` (numbers) or at all (anything else). At most `max` of them. */
export function diffSnapshots(a: unknown, b: unknown, tol = 2e-4, max = 20, at = '', out: string[] = []): string[] {
  if (out.length >= max) return out;
  if (typeof a === 'number' && typeof b === 'number') {
    if (Math.abs(a - b) > tol) out.push(`${at}: ${b} (golden) vs ${a} (now)`);
    return out;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) out.push(`${at}: length ${b.length} (golden) vs ${a.length} (now)`);
    for (let i = 0; i < Math.min(a.length, b.length); i++) diffSnapshots(a[i], b[i], tol, max, `${at}[${i}]`, out);
    return out;
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) diffSnapshots((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], tol, max, `${at}.${k}`, out);
    return out;
  }
  if (a !== b) out.push(`${at}: ${JSON.stringify(b)} (golden) vs ${JSON.stringify(a)} (now)`);
  return out;
}
