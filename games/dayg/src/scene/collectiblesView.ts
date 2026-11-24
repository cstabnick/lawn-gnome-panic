// 3D collectible pickups placed across Mossgrave regions + Curio Display Rack at Lychgate Waystation.
import * as THREE from 'three';
import { flatLayer, LAYER } from '@lawn/depth';
import { buildPrefab } from '@lawn/prefabs';
import { PREFAB_SCALE } from '../config';
import type { Interact } from '../game/interact';
import type { RegionDef } from '../sim/types';
import type { Collider } from '../world/collide';
import { COLLECTIBLES, collectItem, loadCollectibles, turnInCollectibles } from '../sim/collectibles';

const RACK_POS = { x: 344, y: 18, z: 480 } as const;

function makeCollectibleBody(prefab: string, scaleMul = 0.9): THREE.Object3D {
  const g = new THREE.Group();
  try {
    const obj = buildPrefab(prefab);
    obj.scale.setScalar(PREFAB_SCALE * scaleMul);
    g.add(obj);
  } catch {
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24 * scaleMul, 0),
      new THREE.MeshStandardMaterial({ color: 0xe8c35a, emissive: 0x554210, roughness: 0.3, metalness: 0.6 }),
    );
    gem.position.y = 0.3 * scaleMul;
    g.add(gem);
  }
  return g;
}

function makeCollectibleMesh(prefab: string): THREE.Object3D {
  const g = makeCollectibleBody(prefab, 0.9);
  const ringMat = flatLayer(
    new THREE.MeshBasicMaterial({ color: 0xe8c35a, side: THREE.DoubleSide, transparent: true, opacity: 0.75 }),
    LAYER.marker,
  );
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.42, 16), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.04;
  g.add(ring);
  return g;
}

function buildCurioRack(scene: THREE.Scene): { sync(found: readonly string[]): void } {
  const root = new THREE.Group();
  root.position.set(RACK_POS.x, RACK_POS.y, RACK_POS.z);

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3f24, roughness: 0.85 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x7c786e, roughness: 0.9 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xe8c35a, emissive: 0x3b2c08, roughness: 0.4, metalness: 0.5 });

  // Plinth base (16 pedestals arranged in 2 rows of 8)
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.16, 1.8), woodMat);
  plinth.position.y = 0.08;
  root.add(plinth);

  const slots = new Map<string, { holder: THREE.Group; cap: THREE.Mesh; shown: boolean }>();

  COLLECTIBLES.forEach((col, idx) => {
    const row = Math.floor(idx / 8);
    const colIdx = idx % 8;
    const px = -2.1 + colIdx * 0.6;
    const pz = row === 0 ? -0.45 : 0.45;
    const pedH = row === 0 ? 0.52 : 0.34;

    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, pedH, 8), stoneMat);
    ped.position.set(px, 0.16 + pedH / 2, pz);
    root.add(ped);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 8), stoneMat.clone());
    cap.position.set(px, 0.16 + pedH + 0.02, pz);
    root.add(cap);

    const holder = new THREE.Group();
    holder.position.set(px, 0.16 + pedH + 0.05, pz);
    root.add(holder);

    slots.set(col.id, { holder, cap, shown: false });
  });

  scene.add(root);

  function sync(found: readonly string[]): void {
    const foundSet = new Set(found);
    for (const col of COLLECTIBLES) {
      const slot = slots.get(col.id);
      if (!slot) continue;
      if (foundSet.has(col.id) && !slot.shown) {
        slot.shown = true;
        slot.cap.material = goldMat;
        slot.holder.add(makeCollectibleBody(col.prefab, 0.45));
      }
    }
  }

  return { sync };
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

  const rack = buildCurioRack(scene);
  rack.sync(saved.found);

  interact.add({
    id: 'curio-display-rack',
    x: RACK_POS.x,
    y: RACK_POS.y,
    z: RACK_POS.z,
    radius: 3.0,
    label: () => {
      const s = loadCollectibles();
      return `Curio Display Rack (${s.found.length}/${COLLECTIBLES.length}) — Turn In`;
    },
    act: () => {
      const s = loadCollectibles();
      rack.sync(s.found);
      const res = turnInCollectibles();
      if (res.acorns > 0) {
        onToast(`Curio Rack: +${res.acorns} acorns (${res.unlocked.join(', ')})`);
      } else {
        onToast(`Curio Rack: ${s.found.length}/${COLLECTIBLES.length} displayed. Find more for the next milestone!`);
      }
    },
  });

  COLLECTIBLES.forEach((col, i) => {
    if (saved.found.includes(col.id)) return;
    const reg = regions.find((r) => r.id === col.region);
    if (!reg) return;
    const cx = (reg.rect.x0 + reg.rect.x1) / 2 + col.offset[0];
    const cz = (reg.rect.z0 + reg.rect.z1) / 2 + col.offset[1];
    const x = Math.min(reg.rect.x1 - 2, Math.max(reg.rect.x0 + 2, cx));
    const z = Math.min(reg.rect.z1 - 2, Math.max(reg.rect.z0 + 2, cz));
    if (!collider.inBounds(x, z)) return;
    const y = collider.groundAt(x, z, reg.floorY + 4);
    if (y > 24) return;

    const mesh = makeCollectibleMesh(col.prefab);
    mesh.position.set(x, y + 0.12, z);
    scene.add(mesh);
    active.push({ id: col.id, mesh, baseY: y + 0.12, phase: i * 0.9 });

    let taken = false;
    interact.add({
      id: `collect:${col.id}`,
      x, y, z,
      radius: 2.0,
      label: () => (taken ? null : `Collect [${col.rarity}]: ${col.name}`),
      act: () => {
        if (taken) return;
        taken = true;
        scene.remove(mesh);
        const res = collectItem(col.id);
        rack.sync(loadCollectibles().found);
        onToast(`Found [${col.rarity}] ${col.name} (${res.total}/${COLLECTIBLES.length})`);
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
