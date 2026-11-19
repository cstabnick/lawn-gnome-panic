// Water guns and their droplets. The held gun is a @lawn/prefabs model; droplets are a pooled InstancedMesh.
import * as THREE from 'three';
import { buildHeld } from '@lawn/prefabs';
import { insideBox } from './collide';
import { GUNS, GUN_ORDER, WATER } from './config';
import type { Fx, HitTest, Weapons, World } from './types';

const HELD_POS = { x: 0, y: -0.32, z: 0.02 };

export function createWeapons(scene: THREE.Scene, fx: Fx): Weapons {
  const CAP = WATER.maxDrops;

  // ---- Droplet pool ---------------------------------------------------------------------------------------------
  const pos: THREE.Vector3[] = [];
  const vel: THREE.Vector3[] = [];
  const life = new Float32Array(CAP);
  const alive = new Uint8Array(CAP);
  for (let i = 0; i < CAP; i++) {
    pos.push(new THREE.Vector3());
    vel.push(new THREE.Vector3());
  }

  const dropGeo = new THREE.SphereGeometry(WATER.dropRadius, 6, 4);
  const dropMat = new THREE.MeshStandardMaterial({
    color: 0x5ec8ff, emissive: 0x1a5f8a, transparent: true, opacity: 0.85,
  });
  const drops = new THREE.InstancedMesh(dropGeo, dropMat, CAP);
  drops.frustumCulled = false;
  drops.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const m = new THREE.Matrix4();
  const zeroM = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < CAP; i++) drops.setMatrixAt(i, zeroM);
  scene.add(drops);

  function freeSlot(): number {
    for (let i = 0; i < CAP; i++) if (!alive[i]) return i;
    return -1;
  }

  // ---- Scratch vectors (no per-frame allocation) ----------------------------------------------------------------
  const v = new THREE.Vector3();
  const r = new THREE.Vector3();

  /** A uniformly random unit vector, written into r. */
  function randomUnit(): THREE.Vector3 {
    const z = Math.random() * 2 - 1;
    const t = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - z * z);
    return r.set(s * Math.cos(t), z, s * Math.sin(t));
  }

  // Fractional droplets carried between frames, and seconds since the last droplet.
  let emitAcc = 0;
  let sinceShot: number = WATER.refillDelay;

  // ---- Held gun -------------------------------------------------------------------------------------------------
  let hand: THREE.Object3D | null = null;
  let held: THREE.Group | null = null;
  let heldVisible = true;

  function buildGun(): void {
    if (held) held.removeFromParent();
    held = buildHeld(GUNS[w.gun].prefab);
    held.position.set(HELD_POS.x, HELD_POS.y, HELD_POS.z);
    held.rotation.x = Math.PI;
    held.visible = heldVisible;
    if (hand) hand.add(held);
  }

  const w: Weapons = {
    gun: 'squirt-pistol',
    tank: 1,

    attachTo(h: THREE.Object3D) {
      hand = h;
      buildGun();
    },

    setVisible(vis: boolean) {
      heldVisible = vis;
      if (held) held.visible = vis;
    },

    switchGun() {
      w.gun = GUN_ORDER[(GUN_ORDER.indexOf(w.gun) + 1) % GUN_ORDER.length];
      if (hand) buildGun();
    },

    update(dt: number, firing: boolean, origin: THREE.Vector3, dir: THREE.Vector3, hitTest: HitTest, world: World): number {
      const spec = GUNS[w.gun];
      let hits = 0;

      // Emit droplets while firing and the tank allows.
      if (firing && w.tank >= spec.cost) {
        emitAcc += spec.rate * dt;
        while (emitAcc >= 1 && w.tank >= spec.cost) {
          const i = freeSlot();
          if (i < 0) break; // pool full: try again next frame
          emitAcc -= 1;
          w.tank -= spec.cost;
          sinceShot = 0;
          alive[i] = 1;
          life[i] = spec.life;
          pos[i].copy(origin);
          // Random direction within the cone: add a random vector of length `spread`, then normalise.
          v.copy(dir).normalize().addScaledVector(randomUnit(), spec.spread).normalize().multiplyScalar(spec.speed);
          vel[i].copy(v);
        }
      }
      if (!firing) emitAcc = 0;
      else emitAcc = Math.min(emitAcc, 1);

      // Refill after a pause.
      sinceShot += dt;
      if (sinceShot >= WATER.refillDelay) w.tank = Math.min(1, w.tank + WATER.refillPerSecond * dt);

      // Move droplets; each one ends on a hit, the ground, a box or when its life runs out.
      for (let i = 0; i < CAP; i++) {
        if (!alive[i]) continue;
        const p = pos[i];
        const vv = vel[i];
        vv.y -= WATER.gravity * dt;
        p.addScaledVector(vv, dt);
        life[i] -= dt;

        let end = false;
        if (hitTest(p.x, p.y, p.z)) {
          hits++;
          fx.splash(p.x, p.y, p.z);
          end = true;
        } else if (p.y <= 0) {
          fx.splash(p.x, 0.05, p.z);
          end = true;
        } else if (insideBox(p.x, p.y, p.z, world.boxes)) {
          fx.splash(p.x, p.y, p.z);
          end = true;
        } else if (life[i] <= 0) {
          end = true;
        }

        if (end) {
          alive[i] = 0;
          life[i] = 0;
          drops.setMatrixAt(i, zeroM);
        } else {
          drops.setMatrixAt(i, m.makeTranslation(p.x, p.y, p.z));
        }
      }
      drops.instanceMatrix.needsUpdate = true;
      return hits;
    },
  };

  return w;
}
