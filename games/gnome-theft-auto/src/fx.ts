// Water effects: splashes, drips and short spray streams. Pooled, so nothing allocates per frame.
import * as THREE from 'three';
import type { Fx } from './types';

const CAP = 500;
const GRAVITY = 9;
const SPRAY_CAP = 16;
const SPRAY_TIME = 0.12;
const SPRAY_OPACITY = 0.6;
const SPLASH_COUNT = 8;
const SPLASH_LIFE = 0.5;
const DRIP_LIFE = 0.6;
const UP = new THREE.Vector3(0, 1, 0);

interface Spray { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; t: number }

export function createFx(scene: THREE.Scene): Fx {
  // ---- Particles (splashes and drips) --------------------------------------------------------------------------
  const pos: THREE.Vector3[] = [];
  const vel: THREE.Vector3[] = [];
  const life = new Float32Array(CAP);
  const born = new Float64Array(CAP);
  let seq = 0;
  const scratchM = new THREE.Matrix4();
  const zeroM = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < CAP; i++) {
    pos.push(new THREE.Vector3());
    vel.push(new THREE.Vector3());
  }

  const particleGeo = new THREE.IcosahedronGeometry(0.06, 0);
  const particleMat = new THREE.MeshBasicMaterial({ color: 0x7fd3ff, transparent: true, opacity: 0.8 });
  const particles = new THREE.InstancedMesh(particleGeo, particleMat, CAP);
  particles.frustumCulled = false;
  particles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  for (let i = 0; i < CAP; i++) particles.setMatrixAt(i, zeroM);
  scene.add(particles);

  /** A free slot, else the oldest live particle (recycled). */
  function allocSlot(): number {
    let oldest = 0;
    for (let i = 0; i < CAP; i++) {
      if (life[i] <= 0) return i;
      if (born[i] < born[oldest]) oldest = i;
    }
    return oldest;
  }

  function spawn(x: number, y: number, z: number, vx: number, vy: number, vz: number, l: number): void {
    const i = allocSlot();
    pos[i].set(x, y, z);
    vel[i].set(vx, vy, vz);
    life[i] = l;
    born[i] = seq++;
    particles.setMatrixAt(i, scratchM.makeTranslation(x, y, z));
  }

  // ---- Spray streams --------------------------------------------------------------------------------------------
  const sprayGeo = new THREE.CylinderGeometry(0.035, 0.035, 1, 5);
  const sprays: Spray[] = [];
  for (let i = 0; i < SPRAY_CAP; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: 0x9fe0ff, transparent: true, opacity: SPRAY_OPACITY });
    const mesh = new THREE.Mesh(sprayGeo, mat);
    mesh.visible = false;
    mesh.frustumCulled = false;
    scene.add(mesh);
    sprays.push({ mesh, mat, t: 0 });
  }
  let sprayCursor = 0;

  const dirScratch = new THREE.Vector3();
  const midScratch = new THREE.Vector3();

  const fx: Fx = {
    // STUB (issue 1C): bullet effects.
    tracer() {},
    flash() {},
    spark() {},
    splash(x: number, y: number, z: number) {
      for (let k = 0; k < SPLASH_COUNT; k++) {
        const a = Math.random() * Math.PI * 2;
        dirScratch.set(Math.cos(a) * 0.7, 1, Math.sin(a) * 0.7).normalize();
        const speed = 2 + Math.random() * 2;
        spawn(x, y, z, dirScratch.x * speed, dirScratch.y * speed, dirScratch.z * speed, SPLASH_LIFE);
      }
    },

    drip(x: number, y: number, z: number) {
      spawn(x, y, z, (Math.random() - 0.5) * 0.3, 0, (Math.random() - 0.5) * 0.3, DRIP_LIFE);
    },

    spray(ax: number, ay: number, az: number, bx: number, by: number, bz: number) {
      const s = sprays[sprayCursor];
      sprayCursor = (sprayCursor + 1) % SPRAY_CAP;
      midScratch.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
      dirScratch.set(bx - ax, by - ay, bz - az);
      const len = dirScratch.length();
      s.mesh.position.copy(midScratch);
      if (len > 1e-5) {
        dirScratch.multiplyScalar(1 / len);
        s.mesh.quaternion.setFromUnitVectors(UP, dirScratch);
        s.mesh.scale.set(1, len, 1);
      } else {
        s.mesh.scale.set(0, 0, 0);
      }
      s.mat.opacity = SPRAY_OPACITY;
      s.t = SPRAY_TIME;
      s.mesh.visible = true;
      if (Math.random() < 0.3) fx.splash(bx, by, bz);
    },

    update(dt: number) {
      for (let i = 0; i < CAP; i++) {
        if (life[i] <= 0) continue;
        const v = vel[i];
        const p = pos[i];
        v.y -= GRAVITY * dt;
        p.addScaledVector(v, dt);
        life[i] -= dt;
        if (life[i] <= 0) {
          life[i] = 0;
          particles.setMatrixAt(i, zeroM);
        } else {
          particles.setMatrixAt(i, scratchM.makeTranslation(p.x, p.y, p.z));
        }
      }
      particles.instanceMatrix.needsUpdate = true;

      for (const s of sprays) {
        if (s.t <= 0) continue;
        s.t -= dt;
        if (s.t <= 0) {
          s.t = 0;
          s.mesh.visible = false;
        } else {
          s.mat.opacity = SPRAY_OPACITY * (s.t / SPRAY_TIME);
        }
      }
    },
  };
  return fx;
}
