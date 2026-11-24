// Spent acorn shells (L57): every shot from a gun ejects a small acorn-shell casing (prefab 'acorn-shell') to the
// gnome's right, which tumbles, bounces on the ground, lies there a while and fades. Pooled and capped like debris.ts.
// Local only (not sent online). STUB: filled by issue E02 1-5.
import type * as THREE from 'three';
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

export function createCasings(_scene: THREE.Scene): CasingSystem {
  return {
    eject() { /* stub */ },
    update() { /* stub */ },
    count() { return 0; },
    clear() { /* stub */ },
  };
}
