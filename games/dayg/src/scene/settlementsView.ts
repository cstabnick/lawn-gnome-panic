// Constructed survivor settlements (defensive walls, watchtowers, spikes, crates) & biome/district visual diversity.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { PREFAB_SCALE } from '../config';
import type { RegionDef } from '../sim/types';
import type { BlockoutMap } from '../world/types';
import type { Collider } from '../world/collide';

function safePrefab(id: string): THREE.Object3D {
  try {
    const obj = buildPrefab(id);
    obj.scale.setScalar(PREFAB_SCALE);
    return obj;
  } catch {
    return new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.9, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 0.9 }),
    );
  }
}

export function createSettlementsView(deps: { scene: THREE.Scene; map: BlockoutMap; regions: readonly RegionDef[]; collider: Collider }): { update(dt: number): void } {
  const { scene, map, regions, collider } = deps;
  const root = new THREE.Group();
  root.name = 'dayg-settlements';
  scene.add(root);

  const postMat = new THREE.MeshStandardMaterial({ color: 0x5c3e24, roughness: 0.9 });
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x735232, roughness: 0.85 });
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x667060, roughness: 0.95 });

  // 1. Fortify every haven with perimeter barricades, spike lines, supply crates, and a corner watchtower.
  for (const h of map.havens) {
    const { x0, x1, z0, z1 } = h.rect;
    const cx = (x0 + x1) / 2;
    const cz = (z0 + z1) / 2;
    const baseY = collider.groundAt(cx, cz, h.minY + 4);

    // Corner watchtower on the NW corner of the haven
    const tx = x0 + 2.5;
    const tz = z0 + 2.5;
    const ty = collider.groundAt(tx, tz, h.minY + 4);
    const tower = new THREE.Group();
    tower.position.set(tx, ty, tz);
    const postGeo = new THREE.BoxGeometry(0.28, 3.6, 0.28);
    for (const [px, pz] of [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]] as const) {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(px, 1.8, pz);
      post.castShadow = true;
      tower.add(post);
    }
    const deck = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.22, 2.7), deckMat);
    deck.position.set(0, 3.3, 0);
    deck.castShadow = true;
    tower.add(deck);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.2, 2.9), postMat);
    roof.position.set(0, 5.1, 0);
    tower.add(roof);
    const lantern = new THREE.PointLight(0xffb86a, 1.4, 16, 2);
    lantern.position.set(0, 4.3, 0);
    tower.add(lantern);
    root.add(tower);

    // Perimeter defensive walls & spikes along the ground around the haven (leaving wide 4+ gm entryways).
    const edges: [number, number, number][] = [
      [x0 - 2.2, cz - 5, 0],
      [x0 - 2.2, cz + 5, 0],
      [x1 + 2.2, cz - 5, 0],
      [x1 + 2.2, cz + 5, 0],
      [cx - 5, z0 - 2.2, Math.PI / 2],
      [cx + 5, z0 - 2.2, Math.PI / 2],
    ];
    edges.forEach(([ex, ez, rot], i) => {
      if (!collider.inBounds(ex, ez)) return;
      const ey = collider.groundAt(ex, ez, 4);
      if (ey > 4) return;
      const wall = safePrefab(i % 2 === 0 ? 'barricade' : 'plank-wall');
      wall.position.set(ex, ey, ez);
      wall.rotation.y = rot;
      root.add(wall);

      const spike = safePrefab('spike-line');
      const sx = ex + (rot === 0 ? (ex < cx ? -1.4 : 1.4) : 0);
      const sz = ez + (rot !== 0 ? (ez < cz ? -1.4 : 1.4) : 0);
      if (collider.inBounds(sx, sz)) {
        spike.position.set(sx, collider.groundAt(sx, sz, 4), sz);
        spike.rotation.y = rot;
        root.add(spike);
      }

      // Register a compact collider block for the defensive barricade (never overlapping doorways).
      collider.addBlock({
        id: `settle-${h.id}-${i}`,
        kind: 'wall',
        x0: ex - 0.8, x1: ex + 0.8,
        z0: ez - 0.8, z1: ez + 0.8,
        y: ey, h: 1.8,
      });
    });

    // Supply crates inside the haven
    for (const [ox, oz] of [[4, -4], [-4, 4]] as const) {
      const bx = cx + ox, bz = cz + oz;
      const crate = safePrefab('crate');
      crate.position.set(bx, baseY, bz);
      root.add(crate);
    }
  }

  // 2. Biome / district visual diversity props across regions.
  const rockGeo = new THREE.DodecahedronGeometry(0.65, 0);
  regions.forEach((r, idx) => {
    const cx = (r.rect.x0 + r.rect.x1) / 2;
    const cz = (r.rect.z0 + r.rect.z1) / 2;
    const dx = (idx % 2 === 0 ? 1 : -1) * 9;
    const dz = (idx % 3 === 0 ? 1 : -1) * 9;
    const px = Math.min(r.rect.x1 - 3, Math.max(r.rect.x0 + 3, cx + dx));
    const pz = Math.min(r.rect.z1 - 3, Math.max(r.rect.z0 + 3, cz + dz));
    if (!collider.inBounds(px, pz)) return;
    const py = collider.groundAt(px, pz, 4);
    if (py > 4) return;
    if (r.traits.includes('MOSSY') || r.traits.includes('HUSH')) {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(px, py + 0.35, pz);
      rock.scale.set(1.3, 0.8, 1.1);
      root.add(rock);
    } else {
      const prop = safePrefab(idx % 2 === 0 ? 'wooden-chest' : 'crate');
      prop.position.set(px, py, pz);
      prop.rotation.y = (idx * 1.1) % Math.PI;
      root.add(prop);
    }
  });

  return { update() {} };
}
