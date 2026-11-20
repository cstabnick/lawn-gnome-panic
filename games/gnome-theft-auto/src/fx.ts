// Effects: clay shards when a gnome cracks, bullet tracers, muzzle flashes and impact sparks. Pooled, so nothing allocates per frame.
import * as THREE from 'three';
import { BULLET } from './config';
import type { Fx } from './types';

const CAP = 500;
const TRACER_CAP = 24;
const TRACER_THICKNESS = 0.025;
const FLASH_CAP = 4;
const FLASH_RADIUS = 0.12;
const SPARK_CAP = 96;
const SPARK_COUNT = 6;
const SPARK_LIFE = 0.3;
const SPARK_GRAVITY = 14;
const GRAVITY = 14;
const CRACK_COUNT = 18;
const SHARD_LIFE = 1.6;
const SHARD_FADE = 0.4;
const CLAY_COLORS = [0xc9824a, 0xb5703c, 0xd89a62, 0x8a4f2a];
const UP = new THREE.Vector3(0, 1, 0);

interface Spray { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; t: number }

export function createFx(scene: THREE.Scene): Fx {
  // ---- Particles (clay shards) --------------------------------------------------------------------------
  const pos: THREE.Vector3[] = [];
  const vel: THREE.Vector3[] = [];
  const life = new Float32Array(CAP);
  const born = new Float64Array(CAP);
  let seq = 0;
  const spin = new Float32Array(CAP);
  const tint = new THREE.Color();
  const shardScale = new THREE.Vector3();
  const scratchM = new THREE.Matrix4();
  const zeroM = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < CAP; i++) {
    pos.push(new THREE.Vector3());
    vel.push(new THREE.Vector3());
  }

  const particleGeo = new THREE.BoxGeometry(0.14, 0.09, 0.12);
  const particleMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
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

  // ---- Bullet tracers (thin lines, fading) ----------------------------------------------------------------------
  const tracerGeo = new THREE.BoxGeometry(TRACER_THICKNESS, 1, TRACER_THICKNESS);
  const tracers: Spray[] = [];
  for (let i = 0; i < TRACER_CAP; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: BULLET.tracerColor, transparent: true, opacity: 1 });
    const mesh = new THREE.Mesh(tracerGeo, mat);
    mesh.visible = false;
    mesh.frustumCulled = false;
    scene.add(mesh);
    tracers.push({ mesh, mat, t: 0 });
  }
  let tracerCursor = 0;

  // ---- Muzzle flashes ---------------------------------------------------------------------------------------------
  const flashGeo = new THREE.SphereGeometry(FLASH_RADIUS, 6, 4);
  const flashes: Spray[] = [];
  for (let i = 0; i < FLASH_CAP; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 1 });
    const mesh = new THREE.Mesh(flashGeo, mat);
    mesh.visible = false;
    mesh.frustumCulled = false;
    scene.add(mesh);
    flashes.push({ mesh, mat, t: 0 });
  }
  let flashCursor = 0;

  // ---- Impact sparks (own pooled InstancedMesh, ring-allocated) ---------------------------------------------------
  const sparkPos: THREE.Vector3[] = [];
  const sparkVel: THREE.Vector3[] = [];
  const sparkLife = new Float32Array(SPARK_CAP);
  for (let i = 0; i < SPARK_CAP; i++) {
    sparkPos.push(new THREE.Vector3());
    sparkVel.push(new THREE.Vector3());
  }
  const sparkGeo = new THREE.IcosahedronGeometry(0.035, 0);
  const sparkMat = new THREE.MeshBasicMaterial({ color: 0xd8d2a0, transparent: true, opacity: 0.95 });
  const sparkMesh = new THREE.InstancedMesh(sparkGeo, sparkMat, SPARK_CAP);
  sparkMesh.frustumCulled = false;
  sparkMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  for (let i = 0; i < SPARK_CAP; i++) sparkMesh.setMatrixAt(i, zeroM);
  scene.add(sparkMesh);
  let sparkCursor = 0;

  const dirScratch = new THREE.Vector3();
  const midScratch = new THREE.Vector3();

  const fx: Fx = {
    tracer(ax: number, ay: number, az: number, bx: number, by: number, bz: number) {
      const s = tracers[tracerCursor];
      tracerCursor = (tracerCursor + 1) % TRACER_CAP;
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
      s.mat.opacity = 1;
      s.t = BULLET.tracerLife;
      s.mesh.visible = true;
    },

    flash(x: number, y: number, z: number) {
      const s = flashes[flashCursor];
      flashCursor = (flashCursor + 1) % FLASH_CAP;
      s.mesh.position.set(x, y, z);
      s.mesh.scale.set(1, 1, 1);
      s.mat.opacity = 1;
      s.t = BULLET.flashLife;
      s.mesh.visible = true;
    },

    spark(x: number, y: number, z: number) {
      for (let k = 0; k < SPARK_COUNT; k++) {
        const i = sparkCursor;
        sparkCursor = (sparkCursor + 1) % SPARK_CAP;
        const a = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 2;
        const up = 0.4 + Math.random() * 0.8;
        sparkPos[i].set(x, y, z);
        sparkVel[i].set(Math.cos(a) * speed * 0.6, up * speed * 0.5, Math.sin(a) * speed * 0.6);
        sparkLife[i] = SPARK_LIFE;
        sparkMesh.setMatrixAt(i, scratchM.makeTranslation(x, y, z));
      }
    },

    crack(x: number, y: number, z: number, color = 0xc9824a) {
      for (let k = 0; k < CRACK_COUNT; k++) {
        const a = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3.5;
        const i = allocSlot();
        pos[i].set(x + (Math.random() - 0.5) * 0.4, y + (Math.random() - 0.3) * 0.8, z + (Math.random() - 0.5) * 0.4);
        vel[i].set(Math.cos(a) * speed, 2 + Math.random() * 3.5, Math.sin(a) * speed);
        life[i] = SHARD_LIFE * (0.7 + Math.random() * 0.3);
        born[i] = seq++;
        tint.setHex(k % 3 === 0 ? color : CLAY_COLORS[k % CLAY_COLORS.length]);
        particles.setColorAt(i, tint);
        spin[i] = Math.random() * 6;
        particles.setMatrixAt(i, scratchM.makeTranslation(pos[i].x, pos[i].y, pos[i].z));
      }
      if (particles.instanceColor) particles.instanceColor.needsUpdate = true;
    },

    update(dt: number) {
      for (let i = 0; i < CAP; i++) {
        if (life[i] <= 0) continue;
        const v = vel[i];
        const p = pos[i];
        v.y -= GRAVITY * dt;
        p.addScaledVector(v, dt);
        if (p.y < 0.06) {
          p.y = 0.06;
          v.set(v.x * 0.5, 0, v.z * 0.5);
        }
        life[i] -= dt;
        if (life[i] <= 0) {
          life[i] = 0;
          particles.setMatrixAt(i, zeroM);
        } else {
          const k = Math.min(1, life[i] / SHARD_FADE);
          spin[i] += dt * (v.x + v.z);
          scratchM.makeRotationY(spin[i]).scale(shardScale.set(k, k, k)).setPosition(p.x, p.y, p.z);
          particles.setMatrixAt(i, scratchM);
        }
      }
      particles.instanceMatrix.needsUpdate = true;

      for (const s of tracers) {
        if (s.t <= 0) continue;
        s.t -= dt;
        if (s.t <= 0) {
          s.t = 0;
          s.mesh.visible = false;
        } else {
          s.mat.opacity = s.t / BULLET.tracerLife;
        }
      }

      for (const s of flashes) {
        if (s.t <= 0) continue;
        s.t -= dt;
        if (s.t <= 0) {
          s.t = 0;
          s.mesh.visible = false;
        }
      }

      let sparksChanged = false;
      for (let i = 0; i < SPARK_CAP; i++) {
        if (sparkLife[i] <= 0) continue;
        const v = sparkVel[i];
        const p = sparkPos[i];
        v.y -= SPARK_GRAVITY * dt;
        p.addScaledVector(v, dt);
        sparkLife[i] -= dt;
        sparksChanged = true;
        if (sparkLife[i] <= 0) {
          sparkLife[i] = 0;
          sparkMesh.setMatrixAt(i, zeroM);
        } else {
          const k = sparkLife[i] / SPARK_LIFE;
          sparkMesh.setMatrixAt(i, scratchM.makeScale(k, k, k).setPosition(p.x, p.y, p.z));
        }
      }
      if (sparksChanged) sparkMesh.instanceMatrix.needsUpdate = true;
    },
  };
  return fx;
}
