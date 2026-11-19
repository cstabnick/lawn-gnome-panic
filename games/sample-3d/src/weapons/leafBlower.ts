import * as THREE from 'three';
import { buildHeld } from '@lawn/prefabs';
import { LEAF_BLOWER_LEVELS } from '../config';
import type { Weapon, WeaponContext } from '../config';

const LEAF_COUNT = 12;
const LEAF_SPEED = 6; // units per second along facing
const FAN_COLOR = 0xbfe8a0;
const FAN_OPACITY = 0.18;
const LEAF_COLORS = [0x5a9e3a, 0x3f7d2c, 0x7fb24a, 0x8a6a3a, 0x6b4a26].map((c) => new THREE.Color(c));

function sectorGeometry(range: number, halfAngleRad: number): THREE.CircleGeometry {
  // Centre line along local +X, so the mesh's rotation sets the aim.
  return new THREE.CircleGeometry(range, 32, -halfAngleRad, halfAngleRad * 2);
}

export function createLeafBlower(scene: THREE.Scene): Weapon {
  let level = 1;
  let timer = 0;
  const levelStats = () => LEAF_BLOWER_LEVELS[level - 1];

  // Visuals: a flat fan sector, a swarm of leaves, and the blower body (a held prefab).
  const fanMaterial = new THREE.MeshBasicMaterial({
    color: FAN_COLOR,
    transparent: true,
    opacity: FAN_OPACITY,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const initial = levelStats();
  const fan = new THREE.Mesh(sectorGeometry(initial.range, initial.halfAngleRad), fanMaterial);
  scene.add(fan);

  const leafGeometry = new THREE.PlaneGeometry(0.2, 0.12);
  const leafMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const leaves = new THREE.InstancedMesh(leafGeometry, leafMaterial, LEAF_COUNT);
  leaves.frustumCulled = false;
  const leafFrac: number[] = [];
  const leafLat: number[] = [];
  const leafSpin: number[] = [];
  for (let i = 0; i < LEAF_COUNT; i++) {
    leafFrac.push(Math.random());
    leafLat.push(Math.random() * 2 - 1);
    leafSpin.push(Math.random() * Math.PI * 2);
    leaves.setColorAt(i, LEAF_COLORS[i % LEAF_COLORS.length]);
  }
  scene.add(leaves);

  // The body's grip sits at its centre, so the origin is where the old handle's centre was.
  const blower = buildHeld('leaf-blower');
  scene.add(blower);

  const dummy = new THREE.Object3D();

  return {
    id: 'leafBlower',
    setLevel(l: number) {
      level = Math.min(LEAF_BLOWER_LEVELS.length, Math.max(1, Math.round(l)));
      const L = levelStats();
      fan.geometry.dispose();
      fan.geometry = sectorGeometry(L.range, L.halfAngleRad);
    },
    update(ctx: WeaponContext) {
      const L = levelStats();
      const a = ctx.facing;
      const fx = Math.sin(a);
      const fz = Math.cos(a);
      const px = ctx.player.x;
      const pz = ctx.player.z;

      // Fan: flat, centred on the gnome, aimed along facing.
      // Euler 'YXZ' applies the in-plane z spin first, then the flatten, then the yaw.
      const gy = ctx.player.y;
      fan.position.set(px, gy + 0.05, pz);
      fan.rotation.set(-Math.PI / 2, a - Math.PI / 2, 0, 'YXZ');

      // Blower at the player's hip, pointing along facing.
      blower.position.set(px + fx * 0.3, gy + 0.85, pz + fz * 0.3);
      blower.rotation.set(0, a, 0);

      // Leaves drift forward and wrap back to the gnome at range.
      const rx = Math.cos(a);
      const rz = -Math.sin(a);
      const halfWidth = L.range * Math.sin(L.halfAngleRad) * 0.6;
      for (let i = 0; i < LEAF_COUNT; i++) {
        leafFrac[i] = (leafFrac[i] + (ctx.dt * LEAF_SPEED) / L.range) % 1;
        const s = leafFrac[i] * L.range;
        const lat = leafLat[i] * halfWidth;
        dummy.position.set(px + fx * s + rx * lat, gy + 0.25, pz + fz * s + rz * lat);
        dummy.rotation.set(-Math.PI / 2, a - Math.PI / 2, leafSpin[i], 'YXZ');
        dummy.updateMatrix();
        leaves.setMatrixAt(i, dummy.matrix);
      }
      leaves.instanceMatrix.needsUpdate = true;

      // Damage and slow tick. No sound: it would play every tick.
      timer -= ctx.dt;
      if (timer > 0) return;

      const cosHalf = Math.cos(L.halfAngleRad);
      for (const e of ctx.enemies) {
        const dx = e.pos.x - px;
        const dz = e.pos.z - pz;
        const dist = Math.hypot(dx, dz);
        if (dist >= L.range + e.radius) continue;
        if (dx * fx + dz * fz < dist * cosHalf) continue;
        ctx.damage(e.id, L.damage * ctx.stats.damageMult);
        ctx.slow(e.id, L.slowFactor, L.slowS);
      }
      timer = L.tickS * ctx.stats.cooldownMult;
    },
    dispose() {
      scene.remove(fan, leaves, blower);
      fan.geometry.dispose();
      fanMaterial.dispose();
      leaves.dispose();
      leafGeometry.dispose();
      leafMaterial.dispose();
    },
  };
}
