// Boat wakes (Wild World Epic 4): flat foam quads trailing behind moving boats. A fixed pool, no allocation per frame.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { WATER } from './config';
import { waterAt } from './terrain';
import { waveSurfaceOffset } from './waves';
import type { Vehicle } from './types';

export interface Wakes {
  /** Spawn and fade foam behind every moving boat in `vehicles` (local and remote). */
  update(dt: number, vehicles: readonly Vehicle[]): void;
}

const POOL = 160;
const LIFE = 1.6;
const SPAWN_EVERY = 0.08;
const DRIFT = 0.8;
const SIZE_FROM = 0.6;
const SIZE_TO = 2.6;
const OPACITY = 0.5;
const MIN_SPEED = 2;

interface Quad {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  active: boolean;
  age: number;
  /** Drift direction: +1 to the boat's right, -1 to its left. */
  side: number;
  /** Unit vector of the drift (world XZ). */
  dx: number;
  dz: number;
  /** The still water level under it (surface minus the wave when it was laid). */
  baseY: number;
}

export function createWakes(scene: THREE.Scene): Wakes {
  const geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const base = flatLayer(
    new THREE.MeshBasicMaterial({ color: WATER.foam, transparent: true, opacity: OPACITY, depthWrite: false }),
    LAYER.marking,
  );
  const quads: Quad[] = [];
  for (let i = 0; i < POOL; i++) {
    const mat = base.clone();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;
    scene.add(mesh);
    quads.push({ mesh, mat, active: false, age: 0, side: 1, dx: 0, dz: 0, baseY: 0 });
  }

  /** Time since each boat last spawned a pair of quads. */
  const timers = new WeakMap<Vehicle, number>();

  function acquire(): Quad {
    let oldest: Quad | null = null;
    for (const q of quads) {
      if (!q.active) return q;
      if (!oldest || q.age > oldest.age) oldest = q;
    }
    return oldest as Quad; // pool full: recycle the oldest
  }

  function spawn(v: Vehicle, side: number, surface: number): void {
    const r = v.spec.radius;
    const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw);
    const rx = -Math.cos(v.yaw), rz = Math.sin(v.yaw);
    const q = acquire();
    q.active = true;
    q.age = 0;
    q.side = side;
    q.dx = rx * side;
    q.dz = rz * side;
    q.mesh.position.set(
      v.x - fx * r * 0.8 + rx * side * r * 0.3,
      surface + 0.02,
      v.z - fz * r * 0.8 + rz * side * r * 0.3,
    );
    q.baseY = surface - waveSurfaceOffset(q.mesh.position.x, q.mesh.position.z);
    q.mesh.rotation.y = v.yaw;
    q.mesh.visible = true;
  }

  return {
    update(dt, vehicles) {
      for (const v of vehicles) {
        if (!v.spec.boat || v.exploded || Math.abs(v.speed) <= MIN_SPEED) continue;
        const t = (timers.get(v) ?? 0) + dt;
        if (t < SPAWN_EVERY) {
          timers.set(v, t);
          continue;
        }
        timers.set(v, 0);
        const w = waterAt(v.x, v.z);
        if (!w) continue;
        spawn(v, 1, w.surface);
        spawn(v, -1, w.surface);
      }

      for (const q of quads) {
        if (!q.active) continue;
        q.age += dt;
        if (q.age >= LIFE) {
          q.active = false;
          q.mesh.visible = false;
          continue;
        }
        const t = q.age / LIFE;
        q.mesh.position.x += q.dx * DRIFT * dt;
        q.mesh.position.z += q.dz * DRIFT * dt;
        // Ride the waves (waves.ts): the still level it was laid on plus the wave here now; no allocation.
        q.mesh.position.y = q.baseY + waveSurfaceOffset(q.mesh.position.x, q.mesh.position.z) + 0.04;
        const size = SIZE_FROM + (SIZE_TO - SIZE_FROM) * t;
        q.mesh.scale.set(size, 1, size);
        q.mat.opacity = OPACITY * (1 - t);
      }
    },
  };
}
