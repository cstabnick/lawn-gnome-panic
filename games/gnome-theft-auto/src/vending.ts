// Vending machines hit by a vehicle at speed rock away from the hit, settle back upright, and spit out a few cans of what they sell.
// The collider never moves: only the visual group tilts about its far bottom edge.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { aboveGround, heightAt } from './terrain';
import type { Fx, Sfx, Vehicle, VendingSpot } from './types';

export interface Vending {
  /** Detect vehicle hits, animate the wobble and the flying cans. Call once per frame. */
  update(dt: number, vehicles: readonly Vehicle[]): void;
}

export const VENDING = {
  minHitSpeed: 6,
  kickPerSpeed: 0.18,
  maxKick: 4,
  maxTilt: 0.6,
  spring: 55,
  damping: 4.5,
  groundBounce: 0.3,
  cooldown: 1.2,
  cansMin: 3,
  cansMax: 6,
  canGravity: 22,
  canLife: 25,
  maxCans: 40,
} as const;

/** A machine's rocking state: `angle` in radians leaning away from the hit, `rate` its angular speed. */
export interface Tilt { angle: number; rate: number }

/** Add the angular kick of a hit at `hitSpeed` (m/s into the machine). */
export function kickTilt(t: Tilt, hitSpeed: number): void {
  t.rate += Math.min(VENDING.maxKick, hitSpeed * VENDING.kickPerSpeed);
}

/** Advance the damped spring one frame (substepped at 60 Hz or finer). The machine stops at maxTilt and rocks back onto its base. */
export function stepTilt(t: Tilt, dt: number): void {
  const steps = Math.max(1, Math.ceil(dt * 60 - 1e-9));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    t.rate += (-VENDING.spring * t.angle - VENDING.damping * t.rate) * h;
    t.angle += t.rate * h;
    if (t.angle > VENDING.maxTilt) {
      t.angle = VENDING.maxTilt;
      t.rate = Math.min(t.rate, 0) * 0.3;
    }
    if (t.angle < 0) {
      t.angle = 0;
      t.rate = -t.rate * VENDING.groundBounce;
    }
  }
}

/** How many cans a hit at `hitSpeed` spills: 3 at the threshold, one more per 6 m/s over it, capped at cansMax. */
export function canCount(hitSpeed: number): number {
  const n = VENDING.cansMin + Math.floor((hitSpeed - VENDING.minHitSpeed) / 6);
  return Math.min(VENDING.cansMax, Math.max(VENDING.cansMin, n));
}

/** The can prefab a machine spills: Acorn-Cola cans from cola machines, Dandelion Fizz cans from fizz machines. */
export function canPrefabFor(brand: VendingSpot['brand']): 'gta-can-cola' | 'gta-can-fizz' {
  return brand === 'fizz' ? 'gta-can-fizz' : 'gta-can-cola';
}

interface MachineState {
  spot: VendingSpot;
  basePos: THREE.Vector3;
  baseQuat: THREE.Quaternion;
  tilt: Tilt;
  pivot: THREE.Vector3;
  axis: THREE.Vector3;
  cooldown: number;
}

interface Can {
  obj: THREE.Group;
  vx: number; vy: number; vz: number;
  spinX: number; spinY: number; spinZ: number;
  life: number;
  resting: boolean;
}

interface PrevState { speed: number; yaw: number }

interface HitInfo { dx: number; dz: number; hitSpeed: number; px: number; pz: number }

const CAN_RADIUS = 0.07;
const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();

/**
 * `spots` is world.vending. `onSpill(brand, by)` is called once per hit that spills cans; `by` is the vehicle that hit it
 * (main unlocks an achievement when by.driver === 'player'). `rand` drives the can spread (tests pass a fixed value).
 */
export function createVending(
  scene: THREE.Scene,
  spots: readonly VendingSpot[],
  fx: Fx,
  play: (sfx: Sfx) => void,
  onSpill: (brand: VendingSpot['brand'], by: Vehicle) => void,
  rand: () => number = Math.random,
): Vending {
  const machines: MachineState[] = spots.map((spot) => ({
    spot,
    basePos: spot.object.position.clone(),
    baseQuat: spot.object.quaternion.clone(),
    tilt: { angle: 0, rate: 0 },
    pivot: new THREE.Vector3(),
    axis: new THREE.Vector3(0, 0, 1),
    cooldown: 0,
  }));
  const cans: Can[] = [];
  let prev = new Map<Vehicle, PrevState>();

  function hitTest(m: MachineState, v: Vehicle, prevSpeed: number, prevYaw: number): HitInfo | null {
    const b = m.spot.box;
    const nx = Math.min(b.maxX, Math.max(b.minX, v.x));
    const nz = Math.min(b.maxZ, Math.max(b.minZ, v.z));
    if (Math.hypot(v.x - nx, v.z - nz) > v.spec.radius + 0.35) return null;
    const cx = (b.minX + b.maxX) / 2;
    const cz = (b.minZ + b.maxZ) / 2;
    const ax = cx - v.x;
    const az = cz - v.z;
    const len = Math.hypot(ax, az);
    if (len < 1e-6) return null;
    const dx = ax / len;
    const dz = az / len;
    const hitSpeed = Math.sin(prevYaw) * prevSpeed * dx + Math.cos(prevYaw) * prevSpeed * dz;
    return { dx, dz, hitSpeed, px: nx, pz: nz };
  }

  function spawnCan(m: MachineState, dx: number, dz: number): void {
    const yaw = m.spot.yaw;
    const fwdX = Math.sin(yaw);
    const fwdZ = Math.cos(yaw);
    const sideX = Math.cos(yaw);
    const sideZ = -Math.sin(yaw);
    const lerp = (a: number, b: number) => a + (b - a) * rand();
    const sx = m.spot.x + fwdX * 0.5;
    const sz = m.spot.z + fwdZ * 0.5;
    const sy = heightAt(sx, sz) + 0.3;
    const along = lerp(2.5, 5);
    const side = lerp(-1.5, 1.5);
    const away = lerp(1, 2);
    const obj = buildPrefab(canPrefabFor(m.spot.brand));
    obj.position.set(sx, sy, sz);
    scene.add(obj);
    cans.push({
      obj,
      vx: fwdX * along + sideX * side + dx * away,
      vy: lerp(2.5, 4.5),
      vz: fwdZ * along + sideZ * side + dz * away,
      spinX: (rand() - 0.5) * 12,
      spinY: (rand() - 0.5) * 12,
      spinZ: (rand() - 0.5) * 12,
      life: 0,
      resting: false,
    });
    while (cans.length > VENDING.maxCans) {
      const old = cans.shift();
      if (old) scene.remove(old.obj);
    }
  }

  function triggerHit(m: MachineState, v: Vehicle, hit: HitInfo): void {
    m.cooldown = VENDING.cooldown;
    if (m.tilt.angle < 1e-3) {
      const b = m.spot.box;
      const cx = (b.minX + b.maxX) / 2;
      const cz = (b.minZ + b.maxZ) / 2;
      const half = Math.abs(hit.dx) * (b.maxX - b.minX) / 2 + Math.abs(hit.dz) * (b.maxZ - b.minZ) / 2;
      m.pivot.set(cx + hit.dx * half, m.basePos.y, cz + hit.dz * half);
      m.axis.set(hit.dz, 0, -hit.dx);
    }
    kickTilt(m.tilt, hit.hitSpeed);
    fx.spark(hit.px, heightAt(hit.px, hit.pz) + 0.5, hit.pz);
    play('smash');
    const n = canCount(hit.hitSpeed);
    for (let i = 0; i < n; i++) spawnCan(m, hit.dx, hit.dz);
    onSpill(m.spot.brand, v);
  }

  function stepCans(dt: number): void {
    for (let i = cans.length - 1; i >= 0; i--) {
      const c = cans[i];
      c.life += dt;
      if (c.life >= VENDING.canLife) {
        scene.remove(c.obj);
        cans.splice(i, 1);
        continue;
      }
      if (c.resting) continue;
      const o = c.obj;
      c.vy -= VENDING.canGravity * dt;
      o.position.x += c.vx * dt;
      o.position.y += c.vy * dt;
      o.position.z += c.vz * dt;
      o.rotation.x += c.spinX * dt;
      o.rotation.y += c.spinY * dt;
      o.rotation.z += c.spinZ * dt;
      const floor = heightAt(o.position.x, o.position.z);
      if (o.position.y <= floor) {
        if (Math.abs(c.vy) > 1.5) {
          o.position.y = floor;
          c.vy = -c.vy * 0.35;
          c.vx *= 0.7;
          c.vz *= 0.7;
          c.spinX *= 0.6;
          c.spinY *= 0.6;
          c.spinZ *= 0.6;
        } else {
          c.resting = true;
          c.vx = 0;
          c.vy = 0;
          c.vz = 0;
          o.rotation.x = Math.PI / 2;
          o.position.y = floor + CAN_RADIUS;
        }
      }
    }
    while (cans.length > VENDING.maxCans) {
      const old = cans.shift();
      if (old) scene.remove(old.obj);
    }
  }

  function update(dt: number, vehicles: readonly Vehicle[]): void {
    for (const m of machines) if (m.cooldown > 0) m.cooldown = Math.max(0, m.cooldown - dt);

    // Hit tests use last frame's speed and heading: this frame's wall push-out has already slowed the car.
    for (const v of vehicles) {
      const last = prev.get(v);
      if (!last || Math.abs(last.speed) < VENDING.minHitSpeed || aboveGround(v.x, v.y, v.z) > 1.2) continue;
      for (const m of machines) {
        if (m.cooldown > 0) continue;
        const hit = hitTest(m, v, last.speed, last.yaw);
        if (hit && hit.hitSpeed >= VENDING.minHitSpeed) triggerHit(m, v, hit);
      }
    }
    const next = new Map<Vehicle, PrevState>();
    for (const v of vehicles) next.set(v, { speed: v.speed, yaw: v.yaw });
    prev = next;

    for (const m of machines) {
      stepTilt(m.tilt, dt);
      const obj = m.spot.object;
      if (m.tilt.angle < 0.002 && Math.abs(m.tilt.rate) < 0.01) {
        m.tilt.angle = 0;
        m.tilt.rate = 0;
        obj.position.copy(m.basePos);
        obj.quaternion.copy(m.baseQuat);
        continue;
      }
      _q.setFromAxisAngle(m.axis, m.tilt.angle);
      _p.copy(m.basePos).sub(m.pivot).applyQuaternion(_q).add(m.pivot);
      obj.position.copy(_p);
      obj.quaternion.copy(_q).multiply(m.baseQuat);
    }

    stepCans(dt);
  }

  return { update };
}
