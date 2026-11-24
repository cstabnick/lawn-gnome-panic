// 3D collectible pickups placed across Mossgrave regions.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { PREFAB_SCALE } from '../config';
import type { Interact } from '../game/interact';
import type { RegionDef } from '../sim/types';
import type { Collider } from '../world/collide';
import { COLLECTIBLES, collectItem, loadCollectibles } from '../sim/collectibles';

function makeCollectibleMesh(prefab: string): THREE.Object3D {
  const g = new THREE.Group();
  try {
    const obj = buildPrefab(prefab);
    obj.scale.setScalar(PREFAB_SCALE * 0.9);
    g.add(obj);
  } catch {
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.28, 0),
      new THREE.MeshStandardMaterial({ color: 0xe8c35a, emissive: 0x554210, roughness: 0.3, metalness: 0.6 }),
    );
    gem.position.y = 0.35;
    g.add(gem);
  }
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.32, 0.42, 16),
    new THREE.MeshBasicMaterial({ color: 0xe8c35a, side: THREE.DoubleSide, transparent: true, opacity: 0.75 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.04;
  g.add(ring);
  return g;
}

export function createCollectiblesView(deps: {
  scene: THREE.Scene;
  regions: readonly RegionDef[];
  interact: Interact;
  collider: Collider;
  onToast: (text: string) => void;
}): { update(dt: number): void } {
  const { scene, regions, interact, collider, onToast } = deps;
  const saved = loadCollectibles();
  const active: { id: string; mesh: THREE.Object3D; baseY: number; phase: number }[] = [];
  let t = 0;

  COLLECTIBLES.forEach((col, i) => {
    if (saved.found.includes(col.id)) return;
    const reg = regions.find((r) => r.id === col.region);
    if (!reg) return;
    const cx = (reg.rect.x0 + reg.rect.x1) / 2 + col.offset[0];
    const cz = (reg.rect.z0 + reg.rect.z1) / 2 + col.offset[1];
    const x = Math.min(reg.rect.x1 - 2, Math.max(reg.rect.x0 + 2, cx));
    const z = Math.min(reg.rect.z1 - 2, Math.max(reg.rect.z0 + 2, cz));
    if (!collider.inBounds(x, z)) return;
    const y = collider.groundAt(x, z, 6);
    if (y > 20) return;

    const mesh = makeCollectibleMesh(col.prefab);
    mesh.position.set(x, y + 0.12, z);
    scene.add(mesh);
    active.push({ id: col.id, mesh, baseY: y + 0.12, phase: i * 0.9 });

    let taken = false;
    interact.add({
      id: `collect:${col.id}`,
      x, y, z,
      radius: 2.0,
      label: () => (taken ? null : `Collect: ${col.name}`),
      act: () => {
        if (taken) return;
        taken = true;
        scene.remove(mesh);
        const res = collectItem(col.id);
        onToast(`✨ Found ${col.name} (${res.total}/${COLLECTIBLES.length})`);
      },
    });
  });

  return {
    update(dt: number) {
      t += dt;
      for (const a of active) {
        a.mesh.rotation.y += dt * 1.4;
        a.mesh.position.y = a.baseY + Math.sin(t * 2.5 + a.phase) * 0.08;
      }
    },
  };
}
