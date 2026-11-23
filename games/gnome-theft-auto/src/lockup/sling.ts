// The Sling-Lift, the scripted (non-driveable) delivery helicopter. Pure flight stepping (planSling / startSling /
// stepSling) plus the three.js rig that draws the chopper and its rope (createSlingRig). The load is moved by the
// caller: it hangs at (s.hx, s.loadY, s.hz).
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { LOCKUP } from './config';
import type { DropSpot, SlingPlan, SlingState } from './types';

const S = LOCKUP.sling;

/** Plan a delivery to `drop`: the chopper comes in from `approachYaw` (radians), appearing spawnDist metres away. */
export function planSling(drop: DropSpot, approachYaw: number): SlingPlan {
  return {
    fromX: drop.x - Math.sin(approachYaw) * S.spawnDist,
    fromZ: drop.z - Math.cos(approachYaw) * S.spawnDist,
    drop,
    cruiseY: drop.y + S.cruiseHeight,
    hoverY: drop.y + S.hoverHeight,
  };
}

export function startSling(plan: SlingPlan): SlingState {
  const { drop } = plan;
  return {
    phase: 'inbound',
    t: 0,
    hx: plan.fromX,
    hy: plan.cruiseY,
    hz: plan.fromZ,
    heading: Math.atan2(drop.x - plan.fromX, drop.z - plan.fromZ),
    loadY: plan.cruiseY - S.ropeMin,
    released: false,
  };
}

/** Advance s by dt. Returns 'released' on the frame the load touches down, 'gone' on the frame the flight ends, else null. */
export function stepSling(s: SlingState, plan: SlingPlan, dt: number): 'released' | 'gone' | null {
  const { drop } = plan;
  s.t += dt;
  switch (s.phase) {
    case 'inbound': {
      const dx = drop.x - s.hx;
      const dz = drop.z - s.hz;
      const dist = Math.hypot(dx, dz);
      if (dist > 0) {
        const step = Math.min(dist, S.speedIn * dt);
        s.hx += (dx / dist) * step;
        s.hz += (dz / dist) * step;
      }
      const remaining = Math.hypot(drop.x - s.hx, drop.z - s.hz);
      const targetY = remaining < 40 ? plan.hoverY : plan.cruiseY;
      s.hy += (targetY - s.hy) * Math.min(1, 1.5 * dt);
      s.loadY = s.hy - S.ropeMin;
      if (remaining < 0.3 && Math.abs(s.hy - plan.hoverY) < 0.5) {
        s.hx = drop.x;
        s.hz = drop.z;
        s.hy = plan.hoverY;
        s.loadY = s.hy - S.ropeMin;
        s.phase = 'lowering';
        s.t = 0;
      }
      return null;
    }
    case 'lowering': {
      s.loadY -= S.lowerSpeed * dt;
      if (s.loadY <= drop.y) {
        s.loadY = drop.y;
        s.released = true;
        s.phase = 'release';
        s.t = 0;
        return 'released';
      }
      return null;
    }
    case 'release': {
      if (s.t >= S.releaseS) {
        s.phase = 'outbound';
        s.t = 0;
      }
      return null;
    }
    case 'outbound': {
      const v = S.speedOut * dt;
      s.hx += Math.sin(s.heading) * v;
      s.hz += Math.cos(s.heading) * v;
      s.hy += S.climbOut * dt;
      if (s.t >= S.outboundS) {
        s.phase = 'done';
        s.t = 0;
        return 'gone';
      }
      return null;
    }
    case 'done':
      return null;
  }
}

export interface SlingRig {
  /** Pose the chopper and rope from s (rope hidden once s.released). */
  update(s: SlingState, dt: number): void;
  dispose(): void;
}

export function createSlingRig(scene: THREE.Scene): SlingRig {
  const body = buildPrefab(S.prefab, { scale: S.scale });
  body.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = true;
  });
  const root = new THREE.Group();
  root.add(body);
  scene.add(root);

  const rope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 1, 6),
    new THREE.MeshStandardMaterial({ color: 0x3a2f22 }),
  );
  const hook = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x222222 }),
  );
  scene.add(rope);
  scene.add(hook);

  const rotor = body.getObjectByName('rotor');
  const tailRotor = body.getObjectByName('tail-rotor');

  return {
    update(s: SlingState, dt: number): void {
      root.position.set(s.hx, s.hy, s.hz);
      const pitch = s.phase === 'inbound' || s.phase === 'outbound' ? 0.12 : 0;
      root.rotation.set(pitch, s.heading, 0, 'YXZ');

      if (rotor) rotor.rotation.y += dt * 30;
      if (tailRotor) tailRotor.rotation.x += dt * 45;

      const visible = !s.released;
      rope.visible = visible;
      hook.visible = visible;
      if (visible) {
        const top = s.hy;
        const bottom = s.loadY + 1.2;
        rope.position.set(s.hx, (top + bottom) / 2, s.hz);
        rope.scale.y = Math.max(0.01, top - bottom);
        hook.position.set(s.hx, bottom, s.hz);
      }
    },
    dispose(): void {
      scene.remove(root);
      scene.remove(rope);
      scene.remove(hook);
      rope.geometry.dispose();
      (rope.material as THREE.Material).dispose();
      hook.geometry.dispose();
      (hook.material as THREE.Material).dispose();
    },
  };
}
