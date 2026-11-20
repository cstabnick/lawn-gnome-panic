// Tiny vector and quaternion maths. Right-handed, y up, vehicle-local +z forward, +x LEFT (the three.js convention),
// so a vehicle with yaw `a` about +y faces (sin a, 0, cos a) exactly as three.js and Gnome Theft Auto do.
export interface Vec3 { x: number; y: number; z: number }
export interface Quat { x: number; y: number; z: number; w: number }

export const v3 = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });
export const copy3 = (a: Vec3): Vec3 => ({ x: a.x, y: a.y, z: a.z });
export const add = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export const scale = (a: Vec3, k: number): Vec3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
export const dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
export const cross = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
export const len = (a: Vec3): number => Math.sqrt(dot(a, a));
export function norm(a: Vec3): Vec3 {
  const l = len(a);
  return l < 1e-12 ? { x: 0, y: 0, z: 0 } : scale(a, 1 / l);
}
/** a + b * k */
export const addScaled = (a: Vec3, b: Vec3, k: number): Vec3 => ({ x: a.x + b.x * k, y: a.y + b.y * k, z: a.z + b.z * k });

export const clamp = (n: number, lo: number, hi: number): number => (n < lo ? lo : n > hi ? hi : n);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const sign = (n: number): number => (n < 0 ? -1 : 1);
export const deg2rad = (d: number): number => (d * Math.PI) / 180;
export const rad2deg = (r: number): number => (r * 180) / Math.PI;
/** Move `a` toward `b` by at most `maxDelta` without overshooting. */
export function moveTowards(a: number, b: number, maxDelta: number): number {
  if (Math.abs(b - a) <= maxDelta) return b;
  return a + Math.sign(b - a) * maxDelta;
}
export const smoothstep = (e0: number, e1: number, x: number): number => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

export const qIdentity = (): Quat => ({ x: 0, y: 0, z: 0, w: 1 });
export function qFromAxisAngle(axis: Vec3, angle: number): Quat {
  const a = norm(axis);
  const s = Math.sin(angle / 2);
  return { x: a.x * s, y: a.y * s, z: a.z * s, w: Math.cos(angle / 2) };
}
export function qMul(a: Quat, b: Quat): Quat {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  };
}
export function qNorm(q: Quat): Quat {
  const l = Math.hypot(q.x, q.y, q.z, q.w) || 1;
  return { x: q.x / l, y: q.y / l, z: q.z / l, w: q.w / l };
}
export const qConj = (q: Quat): Quat => ({ x: -q.x, y: -q.y, z: -q.z, w: q.w });
export function qRotate(q: Quat, v: Vec3): Vec3 {
  // v' = v + 2w (u x v) + 2 u x (u x v)
  const u = { x: q.x, y: q.y, z: q.z };
  const t = scale(cross(u, v), 2);
  return add(add(v, scale(t, q.w)), cross(u, t));
}
export const qRotateInv = (q: Quat, v: Vec3): Vec3 => qRotate(qConj(q), v);
/** Integrate an orientation by world angular velocity w over dt. */
export function qIntegrate(q: Quat, w: Vec3, dt: number): Quat {
  const dq = { x: w.x * dt * 0.5, y: w.y * dt * 0.5, z: w.z * dt * 0.5, w: 0 };
  const d = qMul(dq, q);
  return qNorm({ x: q.x + d.x, y: q.y + d.y, z: q.z + d.z, w: q.w + d.w });
}
export function qSlerp(a: Quat, b: Quat, t: number): Quat {
  let c = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
  let bb = b;
  if (c < 0) { c = -c; bb = { x: -b.x, y: -b.y, z: -b.z, w: -b.w }; }
  if (c > 0.9995) {
    return qNorm({ x: lerp(a.x, bb.x, t), y: lerp(a.y, bb.y, t), z: lerp(a.z, bb.z, t), w: lerp(a.w, bb.w, t) });
  }
  const th = Math.acos(c);
  const s = Math.sin(th);
  const wa = Math.sin((1 - t) * th) / s;
  const wb = Math.sin(t * th) / s;
  return { x: a.x * wa + bb.x * wb, y: a.y * wa + bb.y * wb, z: a.z * wa + bb.z * wb, w: a.w * wa + bb.w * wb };
}
/** Heading (yaw about +y) of a quaternion: the forward vector's angle, so forward = (sin yaw, 0, cos yaw). */
export function qYaw(q: Quat): number {
  const f = qRotate(q, { x: 0, y: 0, z: 1 });
  return Math.atan2(f.x, f.z);
}
