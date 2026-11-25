// Dynamic Supply Drop world events: flare smoke beacon, lootable crate, Hatless attraction & map marker.
import * as THREE from 'three';
import type { Bus } from '../game/bus';
import type { Interact } from '../game/interact';
import type { HatlessSystem } from '../game/types';
import type { ItemId, RegionDef } from '../sim/types';
import type { Collider } from '../world/collide';
import { PART_CATALOG } from '../vehicles/model';

export interface SupplyDropReward {
  acorns: number;
  items: { def: ItemId; count: number }[];
  vehiclePartId: string;
}

export function rollSupplyDrop(seed: number): SupplyDropReward {
  let s = (Math.floor(seed) ^ 0x9e3779b9) >>> 0 || 1;
  const next = (): number => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const acorns = 20 + Math.floor(next() * 26);
  const items: { def: ItemId; count: number }[] = [
    { def: 'glaze-pot', count: 1 },
    { def: 'seed-cake', count: 1 + Math.floor(next() * 2) },
    { def: 'torch', count: 1 },
  ];
  const part = PART_CATALOG[Math.floor(next() * PART_CATALOG.length) % PART_CATALOG.length];
  return { acorns, items, vehiclePartId: part.id };
}

export interface WorldEvents {
  triggerDrop(): void;
  activeMarker(): { x: number; z: number; label: string; color: string } | null;
  update(dt: number): void;
}

export function createWorldEvents(deps: {
  scene: THREE.Scene;
  regions: readonly RegionDef[];
  collider: Collider;
  interact: Interact;
  hatless: HatlessSystem;
  bus: Bus;
  onReward: (reward: SupplyDropReward) => void;
  onToast: (t: string) => void;
}): WorldEvents {
  const { scene, regions, collider, interact, hatless, bus, onReward, onToast } = deps;
  let timer = 150;
  let dropSeq = 1;
  let active: {
    id: string;
    x: number;
    y: number;
    z: number;
    regionName: string;
    group: THREE.Group;
    puffs: THREE.Mesh[];
    looted: boolean;
  } | null = null;

  function clearActive(): void {
    if (!active) return;
    scene.remove(active.group);
    active = null;
  }

  function triggerDrop(): void {
    clearActive();
    const candidates = regions.filter((r) => !r.traits.includes('HAVEN'));
    const pick = (candidates.length > 0 ? candidates : regions)[(dropSeq * 7) % Math.max(1, candidates.length || regions.length)];
    if (!pick) return;

    const x = (pick.rect.x0 + pick.rect.x1) / 2 + (((dropSeq % 3) - 1) * 4);
    const z = (pick.rect.z0 + pick.rect.z1) / 2 + ((((dropSeq + 1) % 3) - 1) * 4);
    const y = collider.groundAt(x, z, 6);

    const group = new THREE.Group();
    group.position.set(x, y, z);

    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.85, 1.1),
      new THREE.MeshStandardMaterial({ color: 0x8b6b3a, roughness: 0.75 }),
    );
    crate.position.y = 0.42;
    const strap = new THREE.Mesh(
      new THREE.BoxGeometry(1.14, 0.14, 1.14),
      new THREE.MeshStandardMaterial({ color: 0xd96b27, roughness: 0.5 }),
    );
    strap.position.y = 0.44;
    const beacon = new THREE.PointLight(0xff8c3a, 1.6, 18, 2);
    beacon.position.y = 1.4;
    group.add(crate, strap, beacon);

    const puffs: THREE.Mesh[] = [];
    const puffGeo = new THREE.SphereGeometry(0.28, 6, 6);
    const puffMat = new THREE.MeshBasicMaterial({ color: 0xff8c3a, transparent: true, opacity: 0.55 });
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(puffGeo, puffMat);
      m.position.set(0, 1.2 + i * 2.2, 0);
      group.add(m);
      puffs.push(m);
    }
    scene.add(group);

    const id = `drop-${dropSeq++}`;
    const ref = { id, x, y, z, regionName: pick.name, group, puffs, looted: false };
    active = ref;

    interact.add({
      id: `supply:${id}`,
      x, y, z,
      radius: 2.5,
      label: () => (ref.looted ? null : 'Loot Supply Drop'),
      act: () => {
        if (ref.looted) return;
        ref.looted = true;
        const reward = rollSupplyDrop(dropSeq * 97 + Math.round(x + z));
        onReward(reward);
        clearActive();
      },
    });

    bus.emit('noise', { x, z, radius: 28, source: 'attack' });
    hatless.spawn(pick.id, 2, []);
    onToast(`📦 Supply Drop landed in ${pick.name}! Follow the orange smoke!`);
  }

  return {
    triggerDrop,
    activeMarker() {
      if (!active || active.looted) return null;
      return { x: active.x, z: active.z, label: '📦 Supply Drop', color: '#ff8c3a' };
    },
    update(dt: number) {
      timer -= dt;
      if (timer <= 0) {
        timer = 240;
        triggerDrop();
      }
      if (active) {
        for (let i = 0; i < active.puffs.length; i++) {
          const p = active.puffs[i];
          p.position.y += dt * 3.2;
          if (p.position.y > 15) p.position.y = 1.2;
          const sc = 0.7 + (p.position.y / 15) * 1.4;
          p.scale.setScalar(sc);
        }
      }
    },
  };
}
