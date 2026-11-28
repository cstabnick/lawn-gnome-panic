// Golf swing pose: the gnome holds the club (prefab golf-club, buildGear('hand')) and moves the arms through address,
// backswing (raised with the meter) and a short follow-through. Arms and body only. The pure maths (swingAngles) is
// tested without three.js models; createSwingPose wires it to a gnome model like fishing/fishPose.ts does.
import * as THREE from 'three';
import { buildGear, type GnomeModel } from '@lawn/gnome';
import { applyPose, resetParts } from '../anim/animator';
import type { AnimPose } from '../anim';
import type { RoundPhase } from './types';

export const FOLLOW_S = 0.45;
export const BACKSWING_S = 0.35;
const RISE = 0.2;
const POSE_PARTS = ['armL', 'armR', 'body'] as const;
const mix = (a: number, b: number, k: number): number => a + (b - a) * k;
const ease = (k: number): number => { const c = Math.max(0, Math.min(1, k)); return c * c * (3 - 2 * c); };

type V3 = [number, number, number];
interface Triple { armR: V3; armL: V3; body: V3; tilt: number }
/** The pose plus the club tilt (radians about the hand, x axis, added to the grip anchor). */
export type SwingAngles = AnimPose & { tilt: number };

/** The arm and body angles for one moment. charge 0..1 is the backswing height; follow is seconds since the hit (or -1). */
export function swingAngles(phase: RoundPhase, charge: number, follow: number): SwingAngles {
  const c = Math.max(0, Math.min(1, charge));
  // Address: both arms down and forward to the club, a little crouch over the ball.
  const address: Triple = { armR: [-1.1, 0, -0.12], armL: [-1.1, 0, -0.12], body: [0.3, 0, 0], tilt: 1.5 };
  const top: Triple = { armR: [-2.5, 0, -0.35], armL: [-2.4, 0, 0.3], body: [-0.12, 0.35, 0], tilt: 0 };
  const through: Triple = { armR: [-1.5, 0, -0.15], armL: [-1.5, 0, 0.1], body: [0.18, -0.4, 0], tilt: 1.0 };
  const m = (x: V3, y: V3, k: number): V3 => [mix(x[0], y[0], k), mix(x[1], y[1], k), mix(x[2], y[2], k)];
  const blend = (a: Triple, b: Triple, k: number): Triple => ({ armR: m(a.armR, b.armR, k), armL: m(a.armL, b.armL, k), body: m(a.body, b.body, k), tilt: mix(a.tilt, b.tilt, k) });
  if (follow >= 0) {
    const k = follow / FOLLOW_S;
    // Whip from the top of the swing through the ball, then settle at address.
    if (k < 0.4) return blend(blend(address, top, c), through, ease(k / 0.4));
    return blend(through, address, ease((k - 0.4) / 0.6));
  }
  if (phase === 'swing') return blend(address, top, ease(c));
  return address;
}

/** The two tee markers of a hole (greens.ts places them 2 m either side of the first leg). */
export function teeMarkerSpots(h: { tee: { x: number; z: number }; path: readonly { x: number; z: number }[] }): { x: number; z: number }[] {
  const a = h.path[0], b = h.path[1];
  if (!a || !b) return [];
  const dx = b.x - a.x, dz = b.z - a.z;
  const len = Math.hypot(dx, dz) || 1;
  const px = -dz / len, pz = dx / len;
  return [-1, 1].map((side) => ({ x: h.tee.x + px * 2 * side, z: h.tee.z + pz * 2 * side }));
}

/** Push (x, z) away from any marker closer than `r` metres, along the line from the marker. */
export function nudgeOffMarkers(x: number, z: number, markers: readonly { x: number; z: number }[], r = 0.7): { x: number; z: number } {
  let ox = x, oz = z;
  for (const m of markers) {
    const dx = ox - m.x, dz = oz - m.z;
    const d = Math.hypot(dx, dz);
    if (d >= r) continue;
    if (d < 1e-6) { ox = m.x + r; continue; }
    ox = m.x + (dx / d) * r;
    oz = m.z + (dz / d) * r;
  }
  return { x: ox, z: oz };
}

export interface SwingPose {
  /** Every frame while a round is on: pose by phase; charge 0..1 is the meter. Holds the club. */
  apply(model: GnomeModel, phase: RoundPhase, charge: number, dt: number): void;
  /** The ball was hit: play the follow-through. */
  swing(): void;
  /** Put the arms back and drop the club (the round ended). */
  clear(model: GnomeModel): void;
}

export function createSwingPose(): SwingPose {
  let holder: THREE.Object3D | null = null;
  const baseQ = new THREE.Quaternion();
  const tiltQ = new THREE.Quaternion();
  const X = new THREE.Vector3(1, 0, 0);
  const tilt = (t: number): void => { if (holder) holder.quaternion.copy(tiltQ.setFromAxisAngle(X, t)).multiply(baseQ); };
  let w = 0;
  let follow = -1;
  let backT = 0;
  return {
    apply(model, phase, charge, dt) {
      if (!holder) {
        try { holder = buildGear('hand', 'golf-club'); } catch { holder = null; }
        if (holder) { holder.visible = true; baseQ.copy(holder.quaternion); }
      }
      if (holder && holder.parent !== model.arms.right) model.arms.right.add(holder);
      if (follow >= 0) { follow += dt; if (follow > FOLLOW_S) follow = -1; }
      // Without a meter value the backswing rises over a fixed 0.35 s while the phase is 'swing'.
      backT = phase === 'swing' ? Math.min(BACKSWING_S, backT + dt) : 0;
      const c = Math.max(charge, backT / BACKSWING_S);
      w = Math.min(1, w + dt / RISE);
      // Walking: only hold the club loosely; the arms stay near rest.
      if (phase === 'walk' && follow < 0) { applyPose(model, POSE_PARTS, { armR: [-0.35, 0, -0.1] }, w); tilt(1.5); return; }
      const ang = swingAngles(phase, c, follow);
      applyPose(model, POSE_PARTS, ang, w);
      tilt(ang.tilt * w + 1.5 * (1 - w));
    },
    swing() { follow = 0; },
    clear(model) {
      resetParts(model, POSE_PARTS);
      holder?.removeFromParent();
      w = 0; follow = -1; backT = 0;
    },
  };
}
