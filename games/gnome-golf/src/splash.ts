// Water splash: when the shot in the air (golf ball or flying gnome) reaches its 'water' event, a white spout,
// two spreading rings and a spray of droplets burst at the spot, so a ball in a pond or the sea is impossible to miss.
// One time in four (seaMowerCatch, round.ts) a sea mower leaps out of the water like a fish, catches the ball at
// the top of its jump and dives back in, with a splash where it leaves the water and where it goes back in.
// Read-only on state: it watches state.flight and the phase clock.
import * as THREE from 'three';
import type { Ctx, ShotResult, System } from './config';
import { createCartModel } from './cartModel';
import { lieAt } from './course';
import { seaMowerCatch } from './round';

const LIFE_S = 1.6;
const DROPS = 28;
const GRAVITY = 14;

/** The sea mower's leap: seconds in the air, peak height (yd), and how far it travels (yd). */
const LEAP_S = 1.3;
const LEAP_PEAK = 3.2;
const LEAP_SPAN = 9;
/** The mower catches the ball this long before it would reach the water (ball.ts hides the ball from then on). */
export const SEA_MOWER_CATCH_S = 0.15;
/** The leap starts this long before the ball reaches the water, so the mower is at its peak for the catch. */
const LEAP_LEAD = LEAP_S / 2 + SEA_MOWER_CATCH_S;
const SEA_MOWER_COLOR = 0x2a9d8f;

interface Burst {
  t: number;
  x: number;
  z: number;
  /** Size: a gnome makes a bigger splash than a ball. */
  size: number;
  vel: Float32Array;
}

/** One splash's meshes; a pool of these lets the leap's exit, catch and re-entry splashes overlap. */
function createBurstFx(scene: THREE.Scene): { start(x: number, z: number, size: number): void; update(dt: number): void } {
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
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  const pos = new THREE.Vector3();

  return {
    start(x, z, size) {
      const vel = new Float32Array(DROPS * 3);
      for (let i = 0; i < DROPS; i++) {
        const a = (i / DROPS) * Math.PI * 2 + Math.random() * 0.3;
        const out = (1.5 + Math.random() * 2.5) * size;
        vel[i * 3] = Math.cos(a) * out;
        vel[i * 3 + 1] = (5 + Math.random() * 5) * Math.sqrt(size);
        vel[i * 3 + 2] = Math.sin(a) * out;
      }
      burst = { t: 0, x, z, size, vel };
      group.visible = true;
    },
    update(dt) {
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

export function createSplash(ctx: Ctx): System {
  const { scene, state } = ctx;
  const pool = [createBurstFx(scene), createBurstFx(scene), createBurstFx(scene)];
  let next = 0;
  const splash = (x: number, z: number, size: number): void => {
    pool[next].start(x, z, size);
    next = (next + 1) % pool.length;
  };

  // The sea mower: a teal riding mower, nose up out of the water, nose down back in.
  const mower = createCartModel({ color: SEA_MOWER_COLOR });
  mower.group.rotation.order = 'YXZ';
  mower.group.visible = false;
  scene.add(mower.group);
  /** The leap in progress: from (x0, z0) to (x1, z1), peaking over the catch spot; t counts from the leap start. */
  let leap: { t: number; x0: number; z0: number; x1: number; z1: number; yaw: number; reentered: boolean } | null = null;

  /** The flights whose splash / leap already fired, so each flight does each once. */
  let splashed: ShotResult | null = null;
  let leapt: ShotResult | null = null;

  function startLeap(f: ShotResult, ex: number, ez: number): void {
    // Leap along the ball's direction of travel, from behind the catch spot to beyond it.
    const n = f.points.length;
    const a = f.points[Math.max(0, n - 6)];
    let dx = ex - a.x;
    let dz = ez - a.z;
    const len = Math.hypot(dx, dz);
    if (len < 0.01) {
      dx = 0;
      dz = 1;
    } else {
      dx /= len;
      dz /= len;
    }
    // Each end of the leap is in the water: shorten that side until it is (a ball that lands near the bank).
    const reach = (sign: number): number => {
      let d = LEAP_SPAN / 2;
      while (d > 0.5 && lieAt(ex + dx * d * sign, ez + dz * d * sign) !== 'water') d -= 0.5;
      return d;
    };
    const back = reach(-1);
    const ahead = reach(1);
    leap = {
      t: 0, x0: ex - dx * back, z0: ez - dz * back, x1: ex + dx * ahead, z1: ez + dz * ahead,
      yaw: Math.atan2(dx, dz), reentered: false,
    };
    mower.group.visible = true;
    splash(leap.x0, leap.z0, 1.4);
  }

  return {
    update(dt) {
      const f = state.flight;
      if (f && f.endLie === 'water' && state.phase === 'flight') {
        const ev = f.events.find((e) => e.kind === 'water');
        const tWater = Math.min(ev?.t ?? f.duration, f.duration);
        const size = state.mode === 'disc' ? 1.8 : 1;
        if (f !== leapt && seaMowerCatch(f) && state.phaseTime >= tWater - LEAP_LEAD) {
          leapt = f;
          startLeap(f, f.end.x, f.end.z);
        }
        if (f !== splashed && state.phaseTime >= tWater - 0.02) {
          splashed = f;
          splash(f.end.x, f.end.z, size);
        }
      }
      for (const b of pool) b.update(dt);

      if (!leap) return;
      leap.t += dt;
      const u = leap.t / LEAP_S;
      if (u >= 1.15) {
        leap = null;
        mower.group.visible = false;
        return;
      }
      if (u >= 1 && !leap.reentered) {
        leap.reentered = true;
        splash(leap.x1, leap.z1, 1.4);
      }
      // A fish's arc: a parabola from the water up to LEAP_PEAK and back, then a little under the surface.
      const y = 4 * LEAP_PEAK * u * (1 - u) - 0.4;
      const span = Math.max(1, Math.hypot(leap.x1 - leap.x0, leap.z1 - leap.z0));
      const slope = (4 * LEAP_PEAK * (1 - 2 * u)) / span; // dy per yard along the leap
      const g = mower.group;
      g.position.set(leap.x0 + (leap.x1 - leap.x0) * u, y, leap.z0 + (leap.z1 - leap.z0) * u);
      g.rotation.set(-Math.atan(slope), leap.yaw, Math.sin(u * Math.PI) * 0.25);
      mower.animate(dt, 6);
    },
  };
}
