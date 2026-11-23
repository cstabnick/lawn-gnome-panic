// Stunt ramps as solid ground. Pure: no three.js, no DOM.
//
// A ramp is a wedge mesh on the terrain (stunts.ts). Its top is ground the car can drive up: `rampGroundProbe` wraps the
// @lawn/vehicle wheel probe so the rays also hit the slope, and `pushOutOfRampSides` makes the two long sides and the
// tall lip end walls. The low entry end is open, so a car drives up it.
import type { GroundHit, GroundProbe, Vec3 } from '@lawn/vehicle';
import { heightAt } from './terrain';
import { STUNT_RAMPS, rampElevationAt, type StuntRamp } from './stunts';

export interface RampContact {
  ramp: StuntRamp;
  /** Metres along the ramp's forward from its centre (-length/2 at the entry, +length/2 at the lip). */
  along: number;
  /** Metres across the ramp from its centre (+ = the ramp's right). */
  across: number;
  /** Height of the slope above the terrain under this point. */
  elev: number;
  /** World height of the slope surface at this point. */
  surfaceY: number;
}

/** A ray origin this far (m) outside a footprint is still checked for a hit on the ramp top. */
const NEAR = 4;

/** Ramp-frame coordinates of a world point: forward = (sin yaw, cos yaw), right = (cos yaw, -sin yaw). */
function toRamp(ramp: StuntRamp, x: number, z: number): { along: number; across: number } {
  const dx = x - ramp.x;
  const dz = z - ramp.z;
  const fx = Math.sin(ramp.yaw);
  const fz = Math.cos(ramp.yaw);
  const rx = Math.cos(ramp.yaw);
  const rz = -Math.sin(ramp.yaw);
  return { along: dx * fx + dz * fz, across: dx * rx + dz * rz };
}

/** World (x, z) of a ramp-frame point. */
function fromRamp(ramp: StuntRamp, along: number, across: number): { x: number; z: number } {
  const fx = Math.sin(ramp.yaw);
  const fz = Math.cos(ramp.yaw);
  const rx = Math.cos(ramp.yaw);
  const rz = -Math.sin(ramp.yaw);
  return { x: ramp.x + along * fx + across * rx, z: ramp.z + along * fz + across * rz };
}

/** Slope height above the terrain at a ramp-frame `along` (0 at the entry, `height` at the lip). */
function elevAlong(ramp: StuntRamp, along: number): number {
  return ((along + ramp.length / 2) / ramp.length) * ramp.height;
}

/** Nearest point of the footprint to a ramp-frame point, and the slope height there. */
function surfaceNear(ramp: StuntRamp, along: number, across: number): { x: number; z: number; y: number } {
  const hl = ramp.length / 2;
  const hw = ramp.width / 2;
  const ca = Math.max(-hl, Math.min(hl, along));
  const cc = Math.max(-hw, Math.min(hw, across));
  const p = fromRamp(ramp, ca, cc);
  return { x: p.x, z: p.z, y: heightAt(p.x, p.z) + elevAlong(ramp, ca) };
}

/** The ramp whose footprint holds (x, z), with the slope under it, or null when no ramp is there. */
export function rampContactAt(x: number, z: number): RampContact | null {
  for (const ramp of STUNT_RAMPS) {
    const { along, across } = toRamp(ramp, x, z);
    if (Math.abs(across) > ramp.width / 2 || Math.abs(along) > ramp.length / 2) continue;
    const elev = rampElevationAt(ramp, x, z);
    if (elev === null) continue;
    return { ramp, along, across, elev, surfaceY: heightAt(x, z) + elev };
  }
  return null;
}

/** The slope's angle above horizontal (radians). */
export function rampSlope(ramp: StuntRamp): number {
  return Math.atan2(ramp.height, ramp.length);
}

/** Unit normal of the slope: tilted back, away from the lip. */
export function rampNormal(ramp: StuntRamp): { x: number; y: number; z: number } {
  const k = ramp.height / ramp.length;
  const x = -Math.sin(ramp.yaw) * k;
  const y = 1;
  const z = -Math.cos(ramp.yaw) * k;
  const len = Math.hypot(x, y, z);
  return { x: x / len, y: y / len, z: z / len };
}

/** Where a ray from `origin` along `dir` meets this ramp's top, or null. */
function castRamp(ramp: StuntRamp, origin: Vec3, dir: Vec3, maxDist: number): GroundHit | null {
  const hl = ramp.length / 2;
  const hw = ramp.width / 2;
  const o = toRamp(ramp, origin.x, origin.z);
  if (Math.abs(o.across) > hw + NEAR || Math.abs(o.along) > hl + NEAR) return null;
  // A ray that starts below the slope (a wheel beside a tall side) does not hit its top.
  const under = surfaceNear(ramp, o.along, o.across);
  if (origin.y < under.y - 0.05) return null;

  // Solve origin.y + dir.y * t = surfaceY(origin + dir * t) by fixed-point iteration.
  let t = 0;
  for (let i = 0; i < 6; i++) {
    const px = origin.x + dir.x * t;
    const pz = origin.z + dir.z * t;
    const q = toRamp(ramp, px, pz);
    const surf = surfaceNear(ramp, q.along, q.across).y;
    t = (origin.y - surf) / -dir.y;
  }
  if (!(t >= 0 && t <= maxDist)) return null;
  const point = { x: origin.x + dir.x * t, y: origin.y + dir.y * t, z: origin.z + dir.z * t };
  const hq = toRamp(ramp, point.x, point.z);
  if (Math.abs(hq.across) > hw || Math.abs(hq.along) > hl) return null;
  return { distance: t, normal: rampNormal(ramp), point };
}

/**
 * A ground probe that also hits the ramp tops. Downward rays from a body above a ramp land on the slope, not on the terrain
 * underneath. The base probe's answer is kept when it is nearer.
 */
export function rampGroundProbe(base: GroundProbe): GroundProbe {
  return {
    cast(origin, dir, maxDist) {
      const h0 = base.cast(origin, dir, maxDist);
      if (dir.y > -0.2) return h0;
      let best: GroundHit | null = null;
      for (const ramp of STUNT_RAMPS) {
        const hit = castRamp(ramp, origin, dir, maxDist);
        if (hit && (best === null || hit.distance < best.distance)) best = hit;
      }
      if (best === null) return h0;
      if (h0 !== null && h0.distance <= best.distance) return h0;
      return best;
    },
  };
}

const rampProbes = new WeakSet<GroundProbe>();

/** Make a vehicle controller's wheels see the ramp tops. Idempotent. */
export function attachRampGround(ctrl: { ground: GroundProbe }): void {
  if (rampProbes.has(ctrl.ground)) return;
  const wrapped = rampGroundProbe(ctrl.ground);
  rampProbes.add(wrapped);
  ctrl.ground = wrapped;
}

/**
 * Push a circle out of the sides and the lip end of any ramp it meets as a wall. A side or the lip is a wall when the slope
 * there is more than 0.5 m above `baseY` (the vehicle's base height). The low entry end is never a wall.
 */
export function pushOutOfRampSides(
  x: number,
  z: number,
  r: number,
  baseY: number,
): { x: number; z: number; hit: boolean; nx: number; nz: number } {
  let cx = x;
  let cz = z;
  let hit = false;
  let nx = 0;
  let nz = 0;
  for (const ramp of STUNT_RAMPS) {
    const hl = ramp.length / 2;
    const hw = ramp.width / 2;
    const c = toRamp(ramp, cx, cz);
    if (Math.abs(c.across) > hw + r || Math.abs(c.along) > hl + r) continue;
    const near = surfaceNear(ramp, c.along, c.across);
    if (near.y - baseY <= 0.5) continue;

    // Candidate faces: left side, right side, lip end. Take the one that moves the centre least.
    const faces = [
      { along: c.along, across: -(hw + r), nx: -Math.cos(ramp.yaw), nz: Math.sin(ramp.yaw) },
      { along: c.along, across: hw + r, nx: Math.cos(ramp.yaw), nz: -Math.sin(ramp.yaw) },
      { along: hl + r, across: c.across, nx: Math.sin(ramp.yaw), nz: Math.cos(ramp.yaw) },
    ];
    let best = faces[0];
    let bestD = Infinity;
    for (const f of faces) {
      const d = Math.hypot(f.along - c.along, f.across - c.across);
      if (d < bestD) { bestD = d; best = f; }
    }
    const p = fromRamp(ramp, best.along, best.across);
    cx = p.x;
    cz = p.z;
    hit = true;
    nx = best.nx;
    nz = best.nz;
  }
  return hit ? { x: cx, z: cz, hit, nx, nz } : { x, z, hit: false, nx: 0, nz: 0 };
}
