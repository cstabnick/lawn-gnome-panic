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
const FLAME_CAP = 260;
const CRACK_COUNT = 18;
const SHARD_LIFE = 1.6;
const SHARD_FADE = 0.4;
const CLAY_COLORS = [0xc9824a, 0xb5703c, 0xd89a62, 0x8a4f2a];
const TRAIL_COLORS: Record<'smoke' | 'sand' | 'snow' | 'grass', readonly [number, number]> = {
  smoke: [0x9ca3af, 0xd1d5db],
  sand: [0xd6b87c, 0xc4a265],
  snow: [0xf0f8ff, 0xdbeafe],
  grass: [0x59a838, 0x76c442],
};
const WATER_COLORS = [0x38bdf8, 0x7dd3fc, 0xe0f2fe] as const;
const BOOST_COLORS = [0x38bdf8, 0xff7a1a, 0xffd84a] as const;
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

  // ---- Fire and smoke (vehicle wrecks): rising, shrinking billboard-free blobs, one pooled InstancedMesh ---------------------
  const flamePos: THREE.Vector3[] = [];
  const flameVel: THREE.Vector3[] = [];
  const flameLife = new Float32Array(FLAME_CAP);
  const flameMax = new Float32Array(FLAME_CAP);
  const flameSize = new Float32Array(FLAME_CAP);
  for (let i = 0; i < FLAME_CAP; i++) {
    flamePos.push(new THREE.Vector3());
    flameVel.push(new THREE.Vector3());
  }
  const flameMesh = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(0.5, 0),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false }),
    FLAME_CAP,
  );
  flameMesh.frustumCulled = false;
  flameMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  for (let i = 0; i < FLAME_CAP; i++) flameMesh.setMatrixAt(i, zeroM);
  scene.add(flameMesh);
  let flameCursor = 0;
  const flameColor = new THREE.Color();
  const FLAME_COLORS = [0xff7a1a, 0xffb02e, 0xff4d12, 0xffd84a];

  function puff(x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, size: number, hex: number): void {
    const i = flameCursor;
    flameCursor = (flameCursor + 1) % FLAME_CAP;
    flamePos[i].set(x, y, z);
    flameVel[i].set(vx, vy, vz);
    flameLife[i] = life;
    flameMax[i] = life;
    flameSize[i] = size;
    flameMesh.setColorAt(i, flameColor.setHex(hex));
    if (flameMesh.instanceColor) flameMesh.instanceColor.needsUpdate = true;
  }

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

    fire(x: number, y: number, z: number, spread = 0.8) {
      const j = () => (Math.random() - 0.5) * spread;
      puff(x + j(), y, z + j(), j() * 0.4, 1.6 + Math.random() * 1.6, j() * 0.4, 0.7 + Math.random() * 0.4, 0.35 + Math.random() * 0.3,
        FLAME_COLORS[Math.floor(Math.random() * FLAME_COLORS.length)]);
      if (Math.random() < 0.35) puff(x + j(), y + 0.6, z + j(), j() * 0.3, 1.2 + Math.random(), j() * 0.3, 1.6 + Math.random(), 0.5 + Math.random() * 0.4, 0x2a2a2a);
    },

    explode(x: number, y: number, z: number) {
      for (let k = 0; k < 4; k++) fx.flash(x + (Math.random() - 0.5), y + 0.4 + k * 0.2, z + (Math.random() - 0.5));
      for (let k = 0; k < 46; k++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 2 + Math.random() * 6;
        puff(x, y + 0.5, z, Math.cos(a) * sp, 1 + Math.random() * 6, Math.sin(a) * sp, 0.6 + Math.random() * 0.7, 0.4 + Math.random() * 0.7,
          k % 3 === 0 ? 0x2a2a2a : FLAME_COLORS[k % FLAME_COLORS.length]);
      }
      for (let k = 0; k < 3; k++) fx.spark(x, y + 0.6, z);
      fx.crack(x, y + 0.4, z, 0x333333);
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

    airBlast(x: number, y: number, z: number, dx: number, dz: number) {
      const len = Math.hypot(dx, dz) || 1;
      const ux = dx / len;
      const uz = dz / len;
      const px = -uz;
      const pz = ux;
      const colors = [0x6abf4b, 0xd8d2a0, 0xf4f4f0, 0x8ad16a];
      for (let k = 0; k < 16; k++) {
        const spread = (Math.random() - 0.5) * 0.45;
        const sp = 14 + Math.random() * 10;
        const vx = (ux + px * spread) * sp;
        const vz = (uz + pz * spread) * sp;
        const vy = 0.5 + Math.random() * 2.2;
        puff(
          x + ux * 0.4 + px * spread, y + (Math.random() - 0.3) * 0.4, z + uz * 0.4 + pz * spread,
          vx, vy, vz, 0.45 + Math.random() * 0.25, 0.25 + Math.random() * 0.35, colors[k % colors.length],
        );
      }
    },

    dandelionCloud(x: number, y: number, z: number) {
      const colors = [0xffffff, 0xf8f6e8, 0xf2efe0];
      for (let k = 0; k < 30; k++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * 4.2;
        const ox = Math.cos(a) * r;
        const oz = Math.sin(a) * r;
        const oy = 0.4 + Math.random() * 1.8;
        puff(
          x + ox, y + oy, z + oz,
          (Math.random() - 0.5) * 0.6, 0.15 + Math.random() * 0.35, (Math.random() - 0.5) * 0.6,
          4.5 + Math.random() * 1.0, 0.75 + Math.random() * 0.65, colors[k % colors.length],
        );
      }
    },

    confetti(x: number, y: number, z: number) {
      const colors = [0xff3b9a, 0xffd23f, 0x34d399, 0x38bdf8, 0xf97316, 0xa78bfa];
      for (let k = 0; k < 28; k++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 2 + Math.random() * 5;
        const i = allocSlot();
        pos[i].set(x + (Math.random() - 0.5) * 0.8, y + 0.5 + Math.random() * 0.5, z + (Math.random() - 0.5) * 0.8);
        vel[i].set(Math.cos(a) * sp, 4 + Math.random() * 5, Math.sin(a) * sp);
        life[i] = 1.6 + Math.random() * 0.6;
        born[i] = seq++;
        tint.setHex(colors[k % colors.length]);
        particles.setColorAt(i, tint);
        spin[i] = Math.random() * 6;
        particles.setMatrixAt(i, scratchM.makeTranslation(pos[i].x, pos[i].y, pos[i].z));
      }
      if (particles.instanceColor) particles.instanceColor.needsUpdate = true;
    },

    trail(x: number, y: number, z: number, kind: 'smoke' | 'sand' | 'snow' | 'grass') {
      const palette = TRAIL_COLORS[kind];
      const hex = palette[Math.random() < 0.5 ? 0 : 1];
      const vy = kind === 'smoke' ? 0.9 + Math.random() * 0.6 : 0.4 + Math.random() * 0.5;
      const lifeS = kind === 'smoke' ? 0.55 : 0.38;
      const size = kind === 'smoke' ? 0.24 + Math.random() * 0.14 : 0.2 + Math.random() * 0.12;
      puff(
        x + (Math.random() - 0.5) * 0.25,
        y + 0.08,
        z + (Math.random() - 0.5) * 0.25,
        (Math.random() - 0.5) * 0.6,
        vy,
        (Math.random() - 0.5) * 0.6,
        lifeS,
        size,
        hex,
      );
    },

    waterJet(x: number, y: number, z: number) {
      for (let k = 0; k < 4; k++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 0.8 + Math.random() * 1.4;
        puff(
          x + (Math.random() - 0.5) * 0.2,
          y + 0.2,
          z + (Math.random() - 0.5) * 0.2,
          Math.cos(a) * sp,
          4.5 + Math.random() * 3.5,
          Math.sin(a) * sp,
          0.45 + Math.random() * 0.25,
          0.22 + Math.random() * 0.18,
          WATER_COLORS[k % WATER_COLORS.length],
        );
      }
    },

    boostFlame(x: number, y: number, z: number, yaw: number) {
      const bx = -Math.sin(yaw);
      const bz = -Math.cos(yaw);
      for (let k = 0; k < 2; k++) {
        const spread = (Math.random() - 0.5) * 0.8;
        const sp = 4 + Math.random() * 3;
        puff(
          x + (Math.random() - 0.5) * 0.18,
          y,
          z + (Math.random() - 0.5) * 0.18,
          bx * sp + spread,
          0.3 + Math.random() * 0.5,
          bz * sp + spread,
          0.22 + Math.random() * 0.12,
          0.26 + Math.random() * 0.16,
          BOOST_COLORS[(Math.random() * BOOST_COLORS.length) | 0],
        );
      }
    },

    smash(x: number, y: number, z: number, color = 0x8a6d4b) {
      for (let k = 0; k < 12; k++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 1.4 + Math.random() * 3.2;
        const i = allocSlot();
        pos[i].set(x + (Math.random() - 0.5) * 0.5, y + 0.2 + Math.random() * 0.5, z + (Math.random() - 0.5) * 0.5);
        vel[i].set(Math.cos(a) * sp, 2.2 + Math.random() * 3.2, Math.sin(a) * sp);
        life[i] = 1.1 + Math.random() * 0.4;
        born[i] = seq++;
        tint.setHex(k % 2 === 0 ? color : 0x6b5338);
        particles.setColorAt(i, tint);
        spin[i] = Math.random() * 6;
        particles.setMatrixAt(i, scratchM.makeTranslation(pos[i].x, pos[i].y, pos[i].z));
      }
      if (particles.instanceColor) particles.instanceColor.needsUpdate = true;
      for (let k = 0; k < 4; k++) {
        puff(
          x + (Math.random() - 0.5) * 0.4,
          y + 0.3,
          z + (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 1.5,
          0.8 + Math.random() * 0.8,
          (Math.random() - 0.5) * 1.5,
          0.45 + Math.random() * 0.2,
          0.35 + Math.random() * 0.2,
          0xc4b89b,
        );
      }
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

      let flamesChanged = false;
      for (let i = 0; i < FLAME_CAP; i++) {
        if (flameLife[i] <= 0) continue;
        flameLife[i] -= dt;
        flamesChanged = true;
        if (flameLife[i] <= 0) {
          flameLife[i] = 0;
          flameMesh.setMatrixAt(i, zeroM);
          continue;
        }
        const p = flamePos[i];
        p.addScaledVector(flameVel[i], dt);
        const k = flameSize[i] * Math.min(1, flameLife[i] / flameMax[i] * 1.5);
        flameMesh.setMatrixAt(i, scratchM.makeScale(k, k, k).setPosition(p.x, p.y, p.z));
      }
      if (flamesChanged) flameMesh.instanceMatrix.needsUpdate = true;

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
