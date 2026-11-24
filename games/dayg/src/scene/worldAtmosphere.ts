// Per-region biome diversity & lush 3D environmental dressing (trees, deadwood, wildflowers, boulders, night streetlamps).
import * as THREE from 'three';
import { flatLayer, LAYER } from '@lawn/depth';
import type { RegionDef } from '../sim/types';
import type { Collider } from '../world/collide';

export function createWorldAtmosphere(deps: {
  scene: THREE.Scene;
  regions: readonly RegionDef[];
  collider: Collider;
}): { update(dt: number, night: boolean): void } {
  const { scene, regions, collider } = deps;
  const root = new THREE.Group();
  root.name = 'dayg-world-atmosphere';
  scene.add(root);

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3625, roughness: 0.95 });
  const deadWoodMat = new THREE.MeshStandardMaterial({ color: 0x564e44, roughness: 0.95 });
  const yewMat = new THREE.MeshStandardMaterial({ color: 0x284724, roughness: 0.9 });
  const pineMat = new THREE.MeshStandardMaterial({ color: 0x355a30, roughness: 0.9 });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x262a2e, metalness: 0.5, roughness: 0.5 });
  const flowerColors = [0xe8c35a, 0xd9738a, 0xa8c8f0, 0xf2efe4];
  const nightLights: THREE.PointLight[] = [];
  const lampBulbs: THREE.MeshBasicMaterial[] = [];

  function addTree(x: number, y: number, z: number, dead: boolean, scale: number): void {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    if (dead) {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * scale, 0.24 * scale, 3.4 * scale, 6), deadWoodMat);
      trunk.position.y = 1.7 * scale;
      trunk.rotation.z = 0.08;
      const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * scale, 0.1 * scale, 1.4 * scale, 5), deadWoodMat);
      b1.position.set(0.4 * scale, 2.5 * scale, 0);
      b1.rotation.z = -0.8;
      g.add(trunk, b1);
    } else {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * scale, 0.25 * scale, 1.8 * scale, 7), trunkMat);
      trunk.position.y = 0.9 * scale;
      const c1 = new THREE.Mesh(new THREE.ConeGeometry(1.15 * scale, 2.4 * scale, 7), yewMat);
      c1.position.y = 2.4 * scale;
      const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.82 * scale, 1.9 * scale, 7), pineMat);
      c2.position.y = 3.6 * scale;
      c1.castShadow = true;
      g.add(trunk, c1, c2);
    }
    root.add(g);
  }

  function addLampPost(x: number, y: number, z: number): void {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 3.2, 8), ironMat);
    pole.position.y = 1.6;
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffd57a });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), bulbMat);
    bulb.position.y = 3.25;
    const light = new THREE.PointLight(0xffcb72, 0, 14, 1.8);
    light.position.y = 3.1;
    g.add(pole, bulb, light);
    lampBulbs.push(bulbMat);
    nightLights.push(light);
    root.add(g);
  }

  regions.forEach((r, idx) => {
    const { x0, x1, z0, z1 } = r.rect;
    const cx = (x0 + x1) / 2;
    const cz = (z0 + z1) / 2;
    const isWet = r.traits.includes('FLOODS');
    const isMossy = r.traits.includes('MOSSY');
    const isSacred = r.traits.includes('SACRED');

    // Biome ground patch using @lawn/depth flatLayer (zero z-fighting)
    const patchColor = isWet ? 0x455a44 : isMossy ? 0x4b683b : isSacred ? 0x67705c : 0x587440;
    const patchMat = flatLayer(new THREE.MeshLambertMaterial({ color: patchColor, transparent: true, opacity: 0.45 }), LAYER.ground + 1);
    const pw = Math.max(8, (x1 - x0) * 0.45);
    const pd = Math.max(8, (z1 - z0) * 0.45);
    const patch = new THREE.Mesh(new THREE.PlaneGeometry(pw, pd), patchMat);
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(cx, 0, cz);
    root.add(patch);

    // Corner trees & deadwood
    const corners: [number, number][] = [
      [x0 + 4, z0 + 4],
      [x1 - 4, z0 + 4],
      [x0 + 4, z1 - 4],
      [x1 - 4, z1 - 4],
    ];
    corners.forEach(([tx, tz], ci) => {
      if (!collider.inBounds(tx, tz)) return;
      const ty = collider.groundAt(tx, tz, 4);
      if (ty > 4) return;
      if ((idx + ci) % 2 === 0) addTree(tx, ty, tz, isWet, 0.85 + ((idx + ci) % 3) * 0.2);
    });

    // Wildflower / fern tufts
    for (let f = 0; f < 4; f++) {
      const fx = Math.min(x1 - 2, Math.max(x0 + 2, cx + Math.cos(idx * 2.1 + f * 1.6) * 8));
      const fz = Math.min(z1 - 2, Math.max(z0 + 2, cz + Math.sin(idx * 1.7 + f * 1.9) * 8));
      if (!collider.inBounds(fx, fz)) continue;
      const fy = collider.groundAt(fx, fz, 4);
      if (fy > 4) continue;
      const bloom = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.25, 5),
        new THREE.MeshStandardMaterial({ color: flowerColors[(idx + f) % flowerColors.length], roughness: 0.85 }),
      );
      bloom.position.set(fx, fy + 0.13, fz);
      root.add(bloom);
    }

    // Iron cemetery lamp-posts along haven/sacred/open regions
    if (r.traits.includes('HAVEN') || isSacred || idx % 3 === 0) {
      const lx = Math.min(x1 - 3, Math.max(x0 + 3, cx + 6));
      const lz = Math.min(z1 - 3, Math.max(z0 + 3, cz - 6));
      if (collider.inBounds(lx, lz)) {
        const ly = collider.groundAt(lx, lz, 4);
        if (ly <= 4) addLampPost(lx, ly, lz);
      }
    }
  });

  let wasNight: boolean | null = null;
  return {
    update(_dt: number, night: boolean) {
      if (night === wasNight) return;
      wasNight = night;
      for (const l of nightLights) l.intensity = night ? 1.5 : 0;
      for (const m of lampBulbs) m.color.setHex(night ? 0xffe49e : 0x6f756e);
    },
  };
}
