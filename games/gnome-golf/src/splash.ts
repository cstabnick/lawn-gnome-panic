// Water splash: when the shot in the air (golf ball or flying gnome) reaches its 'water' event, a white spout,
// two spreading rings and a spray of droplets burst at the spot, so a ball in a pond or the sea is impossible to miss.
// Read-only on state: it watches state.flight and the phase clock.
import * as THREE from 'three';
import type { Ctx, ShotResult, System } from './config';

const LIFE_S = 1.6;
const DROPS = 28;
const GRAVITY = 14;

interface Burst {
  t: number;
  x: number;
  z: number;
  /** Size: a gnome makes a bigger splash than a ball. */
  size: number;
  vel: Float32Array;
}

export function createSplash(ctx: Ctx): System {
  const { scene, state } = ctx;
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);

  const white = (opacity: number): THREE.MeshBasicMaterial =>
    new THREE.MeshBasicMaterial({ color: 0xf4fbff, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide });

  const ringGeo = new THREE.RingGeometry(0.65, 1, 32);
  ringGeo.rotateX(-Math.PI / 2);
  const rings = [new THREE.Mesh(ringGeo, white(0.9)), new THREE.Mesh(ringGeo, white(0.7))];
  const spout = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1, 10, 1, true), white(0.75));
  const dropMat = white(0.95);
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.22, 6, 4), dropMat, DROPS);
  drops.frustumCulled = false;
  group.add(...rings, spout, drops);

  let burst: Burst | null = null;
  /** The flight whose splash already fired, so each flight splashes once. */
  let splashed: ShotResult | null = null;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  const pos = new THREE.Vector3();

  function start(f: ShotResult): void {
    const size = state.mode === 'disc' ? 1.8 : 1;
    const vel = new Float32Array(DROPS * 3);
    for (let i = 0; i < DROPS; i++) {
      const a = (i / DROPS) * Math.PI * 2 + Math.random() * 0.3;
      const out = (1.5 + Math.random() * 2.5) * size;
      vel[i * 3] = Math.cos(a) * out;
      vel[i * 3 + 1] = (5 + Math.random() * 5) * Math.sqrt(size);
      vel[i * 3 + 2] = Math.sin(a) * out;
    }
    burst = { t: 0, x: f.end.x, z: f.end.z, size, vel };
    group.visible = true;
  }

  return {
    update(dt) {
      const f = state.flight;
      if (f && f !== splashed && f.endLie === 'water' && state.phase === 'flight') {
        const ev = f.events.find((e) => e.kind === 'water');
        if (ev && state.phaseTime >= Math.min(ev.t, f.duration) - 0.02) {
          splashed = f;
          start(f);
        }
      }
      if (!burst) return;
      burst.t += dt;
      const t = burst.t;
      if (t >= LIFE_S) {
        burst = null;
        group.visible = false;
        return;
      }
      const u = t / LIFE_S;
      const { x, z, size } = burst;
      rings.forEach((r, k) => {
        const rt = Math.max(0, t - k * 0.22);
        r.visible = rt > 0;
        r.position.set(x, 0.05, z);
        r.scale.setScalar((0.6 + rt * 3.2) * size);
        (r.material as THREE.MeshBasicMaterial).opacity = (k === 0 ? 0.9 : 0.7) * Math.max(0, 1 - rt / (LIFE_S - 0.2));
      });
      // The spout shoots up and collapses in the first half second.
      const sh = Math.max(0, Math.sin(Math.min(1, t / 0.5) * Math.PI)) * 3.6 * size;
      spout.visible = sh > 0.02;
      spout.scale.set(size * (1 + u), Math.max(0.01, sh), size * (1 + u));
      spout.position.set(x, sh / 2, z);
      (spout.material as THREE.MeshBasicMaterial).opacity = 0.75 * (1 - u);
      for (let i = 0; i < DROPS; i++) {
        const vx = burst.vel[i * 3];
        const vy = burst.vel[i * 3 + 1];
        const vz = burst.vel[i * 3 + 2];
        const y = vy * t - 0.5 * GRAVITY * t * t;
        pos.set(x + vx * t, y, z + vz * t);
        sc.setScalar(y > 0 ? size : 0.0001);
        m.compose(pos, q, sc);
        drops.setMatrixAt(i, m);
      }
      drops.instanceMatrix.needsUpdate = true;
      dropMat.opacity = 0.95 * (1 - u * u);
    },
  };
}
