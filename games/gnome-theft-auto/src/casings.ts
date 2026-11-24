// Spent acorn shells (L57): every shot from a gun ejects a small acorn-shell casing (prefab 'acorn-shell') to the
// gnome's right, which tumbles, bounces on the ground, lies there a while and fades. Pooled and capped like debris.ts.
// Local only (not sent online).
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { heightAt } from './terrain';
import type { GunKind } from './types';

/** Tuning. */
export const CASINGS = {
  /** At most this many shells in the world; the oldest goes first. */
  max: 40,
  /** Seconds a shell lies on the ground before it fades, and the fade time. */
  life: 12, fade: 1.5,
  /** Gravity (units/s^2), matching debris.ts. */
  gravity: 22,
  /** Ejection: sideways speed, upward speed (units/s), random spread (fraction). */
  side: 2.2, up: 2.6, spread: 0.35,
  /** Bounce: vertical restitution, ground friction per bounce, settle below this speed. */
  bounce: 0.3, friction: 0.55, settleSpeed: 0.5,
  /** Prefab scale of one shell. */
  scale: 1,
} as const;

/** Shotgun shells are this many times the size of a pistol shell. */
const SHOTGUN_SIZE = 1.6;
/** Random spin of a shell in flight, rad/s, per axis (half range). */
const SPIN = 8;
/** Guns that fire a cartridge and so eject a shell. */
const CARTRIDGE_GUNS: ReadonlySet<GunKind> = new Set<GunKind>(['pistol', 'smg', 'shotgun', 'rifle']);

export interface CasingSystem {
  /**
   * Eject one shell at world point (x, y, z) (the gun's ejection port, about the muzzle), thrown to the right of `yaw`
   * (the shooter's facing; right = (-cos yaw, 0, sin yaw)) plus the shooter's own velocity (vx, vz). Guns that fire no
   * cartridge (leaf-blower, acorn-mortar, tow-whip, dandelion-grenade, trip-mine) eject nothing. Shotgun shells are bigger.
   */
  eject(gun: GunKind, x: number, y: number, z: number, yaw: number, vx?: number, vz?: number): void;
  /** Step every shell: fly, fall, bounce on heightAt, rest, fade and remove old ones. */
  update(dt: number): void;
  /** Shells currently in the world. */
  count(): number;
  /** Remove every shell. */
  clear(): void;
}

interface Template {
  object: THREE.Group;
  /** Height of the origin above the ground when the shell lies on its side. */
  restY: number;
}

interface Shell {
  object: THREE.Object3D;
  vx: number; vy: number; vz: number;
  /** Angular velocity, rad/s, about the world axes. */
  wx: number; wy: number; wz: number;
  /** Orientation when lying on its side (a random yaw applied). */
  lying: THREE.Quaternion;
  restY: number;
  resting: boolean;
  age: number;
  /** Cloned materials used while fading; null until the shell starts to fade. */
  fadeMats: THREE.Material[] | null;
}

const UP = new THREE.Vector3(0, 1, 0);
const LYING_BASE = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
const TMP_QUAT = new THREE.Quaternion();
const TMP_EULER = new THREE.Euler();

function jitter(): number {
  return 1 + (Math.random() - 0.5) * CASINGS.spread;
}

export function createCasings(scene: THREE.Scene): CasingSystem {
  const shells: Shell[] = [];
  const templates = new Map<number, Template>();

  /** One template per size: built once, then cloned for every shell. */
  function templateFor(scale: number): Template {
    let t = templates.get(scale);
    if (!t) {
      const object = buildPrefab('acorn-shell', { scale });
      // Height of the origin above the ground when lying on the side (the yaw about +Y does not change it).
      object.quaternion.copy(LYING_BASE);
      object.updateMatrixWorld(true);
      const restY = -new THREE.Box3().setFromObject(object).min.y;
      object.quaternion.identity();
      object.updateMatrixWorld(true);
      t = { object, restY };
      templates.set(scale, t);
    }
    return t;
  }

  function dropShell(s: Shell): void {
    s.object.removeFromParent();
    for (const m of s.fadeMats ?? []) m.dispose();
  }

  /** Give every mesh under the shell its own copy of its material(s), so the copies can fade without touching shared ones. */
  function makeFadeable(s: Shell): void {
    const mats: THREE.Material[] = [];
    s.object.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      const src = Array.isArray(o.material) ? o.material : [o.material];
      const copies = src.map((m) => {
        const c = m.clone();
        c.transparent = true;
        c.needsUpdate = true;
        mats.push(c);
        return c;
      });
      o.material = Array.isArray(o.material) ? copies : copies[0];
    });
    s.fadeMats = mats;
  }

  return {
    eject(gun, x, y, z, yaw, vx = 0, vz = 0) {
      if (!CARTRIDGE_GUNS.has(gun)) return;
      const tpl = templateFor(CASINGS.scale * (gun === 'shotgun' ? SHOTGUN_SIZE : 1));
      const object = tpl.object.clone(true);
      object.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = true; });
      object.position.set(x, y, z);
      scene.add(object);

      const rightX = -Math.cos(yaw);
      const rightZ = Math.sin(yaw);
      const yawQ = new THREE.Quaternion().setFromAxisAngle(UP, Math.random() * Math.PI * 2);
      shells.push({
        object,
        vx: rightX * CASINGS.side * jitter() + vx,
        vy: CASINGS.up * jitter(),
        vz: rightZ * CASINGS.side * jitter() + vz,
        wx: (Math.random() - 0.5) * 2 * SPIN,
        wy: (Math.random() - 0.5) * 2 * SPIN,
        wz: (Math.random() - 0.5) * 2 * SPIN,
        lying: yawQ.multiply(LYING_BASE.clone()),
        restY: tpl.restY,
        resting: false,
        age: 0,
        fadeMats: null,
      });
      while (shells.length > CASINGS.max) dropShell(shells.shift()!);
    },

    update(rawDt) {
      const dt = Math.min(Math.max(0, rawDt), 0.1);
      for (let i = shells.length - 1; i >= 0; i--) {
        const s = shells[i];
        const o = s.object;
        if (!s.resting) {
          s.vy -= CASINGS.gravity * dt;
          o.position.x += s.vx * dt;
          o.position.y += s.vy * dt;
          o.position.z += s.vz * dt;
          TMP_QUAT.setFromEuler(TMP_EULER.set(s.wx * dt, s.wy * dt, s.wz * dt));
          o.quaternion.multiply(TMP_QUAT);
          const ground = heightAt(o.position.x, o.position.z);
          if (o.position.y <= ground + s.restY) {
            o.position.y = ground + s.restY;
            s.vy = -s.vy * CASINGS.bounce;
            s.vx *= CASINGS.friction;
            s.vz *= CASINGS.friction;
            s.wx *= 0.5;
            s.wy *= 0.5;
            s.wz *= 0.5;
            if (Math.abs(s.vy) < CASINGS.settleSpeed && Math.hypot(s.vx, s.vz) < CASINGS.settleSpeed) {
              s.resting = true;
            }
          }
        } else {
          o.quaternion.slerp(s.lying, Math.min(1, 8 * dt));
          o.position.y = heightAt(o.position.x, o.position.z) + s.restY;
        }

        s.age += dt;
        if (s.age > CASINGS.life) {
          if (!s.fadeMats) makeFadeable(s);
          const t = (s.age - CASINGS.life) / CASINGS.fade;
          if (t >= 1) {
            dropShell(s);
            shells.splice(i, 1);
            continue;
          }
          for (const m of s.fadeMats ?? []) m.opacity = 1 - t;
        }
      }
    },

    count() {
      return shells.length;
    },

    clear() {
      for (const s of shells) dropShell(s);
      shells.length = 0;
    },
  };
}
