import * as THREE from 'three';
import { COLORS } from './config';
import type { DropSystem } from './config';
import { heightAt } from './terrain';

interface Drop {
  kind: 'xp' | 'acorn';
  mesh: THREE.Object3D;
  value: number;
  x: number;
  y: number;
  z: number;
  vy: number;
  magnet: boolean;
  magnetT: number;
  phase: number;
}

const REST_OFFSET = 0.3; // resting height above the terrain
const MAX_DROPS = 300;

export function createDropSystem(scene: THREE.Scene): DropSystem {
  const drops: Drop[] = [];
  let time = 0;

  const xpGeom = new THREE.OctahedronGeometry(0.15);
  const xpMat = new THREE.MeshStandardMaterial({ color: COLORS.xp, emissive: 0x2f7a00 });
  const nutGeom = new THREE.SphereGeometry(0.13, 12, 8);
  const nutMat = new THREE.MeshStandardMaterial({
    color: COLORS.acorn, metalness: 0.3, roughness: 0.4, emissive: 0x553300,
  });
  const capGeom = new THREE.SphereGeometry(0.14, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const capMat = new THREE.MeshStandardMaterial({ color: COLORS.acornCap });

  function xpScale(value: number): number {
    return 1 + Math.min(value, 20) * 0.04;
  }

  function makeXpMesh(value: number): THREE.Mesh {
    const m = new THREE.Mesh(xpGeom, xpMat);
    m.scale.setScalar(xpScale(value));
    return m;
  }

  function makeAcornMesh(): THREE.Group {
    const g = new THREE.Group();
    const nut = new THREE.Mesh(nutGeom, nutMat);
    nut.scale.y = 1.25;
    const cap = new THREE.Mesh(capGeom, capMat);
    cap.position.y = 0.08;
    g.add(nut, cap);
    return g;
  }

  function addDrop(kind: 'xp' | 'acorn', mesh: THREE.Object3D, value: number,
    x: number, y: number, z: number, vy: number): void {
    mesh.position.set(x, y, z);
    scene.add(mesh);
    drops.push({
      kind, mesh, value, x, y, z, vy,
      magnet: false, magnetT: 0, phase: Math.random() * Math.PI * 2,
    });
  }

  function spawnXpGem(x: number, z: number, value: number): void {
    if (drops.length > MAX_DROPS) {
      const oldest = drops.find((d) => d.kind === 'xp');
      if (oldest) {
        oldest.value += value;
        oldest.mesh.scale.setScalar(xpScale(oldest.value));
        return;
      }
    }
    addDrop('xp', makeXpMesh(value), value, x, heightAt(x, z) + REST_OFFSET, z, 3);
  }

  return {
    spawnXp(x: number, z: number, amount: number) {
      if (amount <= 0) return;
      if (amount > 10) {
        const n = Math.ceil(amount / 10);
        for (let i = 0; i < n; i++) {
          const value = i === n - 1 ? amount - 10 * (n - 1) : 10;
          const a = Math.random() * Math.PI * 2;
          const r = Math.sqrt(Math.random()) * 2;
          spawnXpGem(x + Math.cos(a) * r, z + Math.sin(a) * r, value);
        }
      } else {
        spawnXpGem(x + (Math.random() * 2 - 1) * 0.3, z + (Math.random() * 2 - 1) * 0.3, amount);
      }
    },

    spawnAcorns(x: number, z: number, count: number) {
      const radius = Math.min(2.5, 0.3 + count * 0.08);
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * radius;
        const dx = x + Math.cos(a) * r;
        const dz = z + Math.sin(a) * r;
        addDrop('acorn', makeAcornMesh(), 1, dx, heightAt(dx, dz) + REST_OFFSET, dz,
          4 + Math.random() * 2);
      }
    },

    update(dt: number, playerFeet: THREE.Vector3, magnetRadius: number) {
      time += dt;
      let xp = 0;
      let acorns = 0;
      const tx = playerFeet.x;
      const ty = playerFeet.y + 0.5;
      const tz = playerFeet.z;

      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];

        // Pop out of the ground; magnetized drops fly straight to the player instead.
        // The resting height follows the terrain under the drop (magnetised drops skip this).
        const ground = d.magnet ? 0 : heightAt(d.x, d.z) + REST_OFFSET;
        if (!d.magnet) {
          d.y += d.vy * dt;
          d.vy -= 20 * dt;
          if (d.y <= ground) {
            d.y = ground;
            d.vy = 0;
          }
        }
        d.mesh.rotation.y += 3 * dt;

        let dx = tx - d.x;
        let dy = ty - d.y;
        let dz = tz - d.z;
        if (!d.magnet && Math.sqrt(dx * dx + dy * dy + dz * dz) < magnetRadius) {
          d.magnet = true;
        }

        if (d.magnet) {
          d.magnetT += dt;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const step = 6 + 20 * d.magnetT;
          if (dist > 0) {
            const k = Math.min(1, (step * dt) / dist);
            d.x += dx * k;
            d.y += dy * k;
            d.z += dz * k;
          }
        }

        const bob = !d.magnet && d.y <= ground ? Math.sin(time * 4 + d.phase) * 0.05 : 0;
        d.mesh.position.set(d.x, d.y + bob, d.z);

        dx = tx - d.x;
        dy = ty - d.y;
        dz = tz - d.z;
        if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 0.5) {
          scene.remove(d.mesh);
          if (d.kind === 'xp') xp += d.value;
          else acorns += 1;
          drops.splice(i, 1);
        }
      }

      return { xp, acorns };
    },

    vacuum() { for (const d of drops) d.magnet = true; },
    reset() {
      for (const d of drops) scene.remove(d.mesh);
      drops.length = 0;
    },
  };
}
