// Pure combat math: ray/sphere intersection for bullets & Soul Acorn Orbs.

export interface RayHitResult {
  t: number;
  x: number;
  y: number;
  z: number;
}

/** Ray-sphere intersection from origin + dir * t (t >= 0, t <= maxDist). */
export function intersectRaySphere(
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  cx: number,
  cy: number,
  cz: number,
  radius: number,
  maxDist: number,
): RayHitResult | null {
  const fx = ox - cx;
  const fy = oy - cy;
  const fz = oz - cz;
  const b = fx * dx + fy * dy + fz * dz;
  const c = fx * fx + fy * fy + fz * fz - radius * radius;
  if (c > 0 && b > 0) return null;
  const disc = b * b - c;
  if (disc < 0) return null;
  let t = -b - Math.sqrt(disc);
  if (t < 0) t = 0;
  if (t > maxDist) return null;
  return {
    t,
    x: ox + dx * t,
    y: oy + dy * t,
    z: oz + dz * t,
  };
}

/** Distance squared from point to 3D point. */
export function dist3(
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
): number {
  return Math.hypot(ax - bx, ay - by, az - bz);
}
