// E25 firefighter: the hose stream in the world: instanced water droplets running along the arc and a splash ring
// where it lands. Built in code (no prefab): these are effects, like fx.ts sparks.
import * as THREE from 'three';

export interface HoseView {
  /** points: the arc (x, y, z triples, from hose.ts hoseArc), count = how many; null or 0 hides the stream. */
  set(points: Float32Array | null, count: number, dt: number): void;
  dispose(): void;
}

const DROPS = 120;
const SPLASH = 12;
/** Seconds for a droplet to run the whole arc. */
const RUN_TIME = 0.6;
const SPLASH_LIFE = 0.5;
const SPLASH_GRAVITY = 9.8;

const _pos = new THREE.Vector3();
const _next = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _mat = new THREE.Matrix4();
const _zAxis = new THREE.Vector3(0, 0, 1);
const _hidden = new THREE.Matrix4().makeScale(0, 0, 0);

export function createHoseView(scene: THREE.Scene): HoseView {
  // One shared stretched sphere for both the stream and the splash.
  const geo = new THREE.SphereGeometry(0.06, 6, 4);
  const mat = new THREE.MeshBasicMaterial({ color: 0xe8f6ff, transparent: true, opacity: 0.75, depthWrite: false });

  const drops = new THREE.InstancedMesh(geo, mat, DROPS);
  drops.frustumCulled = false;
  drops.count = 0;
  scene.add(drops);

  const splash = new THREE.InstancedMesh(geo, mat, SPLASH);
  splash.frustumCulled = false;
  splash.count = 0;
  scene.add(splash);

  // Stream droplets: phase 0..1 along the arc, a fixed random jitter that grows toward the end.
  const phase = new Float32Array(DROPS);
  const jitter = new Float32Array(DROPS * 3);
  for (let i = 0; i < DROPS; i++) {
    phase[i] = Math.random();
    for (let k = 0; k < 3; k++) jitter[i * 3 + k] = (Math.random() - 0.5) * 2;
  }

  // Splash droplets: ballistic, bouncing on the landing height.
  const sPos = new Float32Array(SPLASH * 3);
  const sVel = new Float32Array(SPLASH * 3);
  const sLife = new Float32Array(SPLASH);
  let splashY = 0;

  function spawnSplash(x: number, y: number, z: number): void {
    splashY = y;
    for (let i = 0; i < SPLASH; i++) {
      const a = (i / SPLASH) * Math.PI * 2;
      sPos[i * 3] = x;
      sPos[i * 3 + 1] = y + 0.05;
      sPos[i * 3 + 2] = z;
      sVel[i * 3] = Math.cos(a) * 2.2;
      sVel[i * 3 + 1] = 2.5 + Math.random() * 1.5;
      sVel[i * 3 + 2] = Math.sin(a) * 2.2;
      sLife[i] = SPLASH_LIFE * (0.7 + Math.random() * 0.3);
    }
  }

  function stepSplash(dt: number): void {
    for (let i = 0; i < SPLASH; i++) {
      const o = i * 3;
      if (sLife[i] <= 0) {
        splash.setMatrixAt(i, _hidden);
        continue;
      }
      sLife[i] -= dt;
      sVel[o + 1] -= SPLASH_GRAVITY * dt;
      sPos[o] += sVel[o] * dt;
      sPos[o + 1] += sVel[o + 1] * dt;
      sPos[o + 2] += sVel[o + 2] * dt;
      // Bounce off the ground, losing most of the speed.
      if (sPos[o + 1] < splashY + 0.03) {
        sPos[o + 1] = splashY + 0.03;
        sVel[o + 1] = -sVel[o + 1] * 0.3;
      }
      if (sLife[i] <= 0) {
        splash.setMatrixAt(i, _hidden);
        continue;
      }
      _pos.set(sPos[o], sPos[o + 1], sPos[o + 2]);
      _scale.set(0.6, 0.6, 0.6);
      _mat.compose(_pos, _quat.identity(), _scale);
      splash.setMatrixAt(i, _mat);
    }
    splash.instanceMatrix.needsUpdate = true;
  }

  function aliveSplash(): boolean {
    for (let i = 0; i < SPLASH; i++) if (sLife[i] > 0) return true;
    return false;
  }

  return {
    set(points, count, dt) {
      const n = points ? Math.min(count, Math.floor(points.length / 3)) : 0;
      if (!points || n < 2) {
        drops.count = 0;
        splash.count = 0;
        return;
      }

      // Stream droplets run along the arc.
      drops.count = DROPS;
      for (let i = 0; i < DROPS; i++) {
        phase[i] = (phase[i] + dt / RUN_TIME) % 1;
        const f = phase[i] * (n - 1);
        const i0 = Math.min(n - 2, Math.floor(f));
        const frac = f - i0;
        const a = i0 * 3;
        const b = a + 3;
        _pos.set(points[a], points[a + 1], points[a + 2]);
        _next.set(points[b], points[b + 1], points[b + 2]);
        _dir.subVectors(_next, _pos);
        if (_dir.lengthSq() > 1e-10) _dir.normalize();
        else _dir.set(0, 1, 0);
        _pos.lerp(_next, frac);
        // Jitter grows toward the end of the arc.
        const wob = 0.2 * phase[i];
        _pos.x += jitter[i * 3] * wob;
        _pos.y += jitter[i * 3 + 1] * wob;
        _pos.z += jitter[i * 3 + 2] * wob;
        _quat.setFromUnitVectors(_zAxis, _dir);
        _scale.set(1, 1, 2.2);
        _mat.compose(_pos, _quat, _scale);
        drops.setMatrixAt(i, _mat);
      }
      drops.instanceMatrix.needsUpdate = true;

      // Splash: respawn at the landing as soon as the last ring has gone.
      const lx = points[(n - 1) * 3];
      const ly = points[(n - 1) * 3 + 1];
      const lz = points[(n - 1) * 3 + 2];
      if (!aliveSplash()) spawnSplash(lx, ly, lz);
      stepSplash(dt);
      splash.count = SPLASH;
    },
    dispose() {
      scene.remove(drops);
      scene.remove(splash);
      geo.dispose();
      mat.dispose();
    },
  };
}
