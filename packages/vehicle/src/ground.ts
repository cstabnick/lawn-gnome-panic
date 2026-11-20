// Ground probes: how the chassis asks "where is the road under this wheel?". The game supplies its own (heightfield, mesh);
// the package ships a flat plane, a tilted plane and a moving wrapper for tests and simple worlds.
import { add, cross, dot, norm, scale, v3, type Vec3 } from './math';

export interface GroundHit {
  /** Distance from the ray origin to the surface along the ray. */
  distance: number;
  /** Unit surface normal, pointing up out of the road. */
  normal: Vec3;
  point: Vec3;
  /** World velocity of the surface at the hit point (default zero): ferries, lifts and turntables. */
  velocity?: Vec3;
}

export interface GroundProbe {
  cast(origin: Vec3, dir: Vec3, maxDist: number): GroundHit | null;
}

/** An infinite plane through `point` with unit `normal`; optional surface velocity field. */
export function planeGround(point: Vec3, normal: Vec3, velocityAt?: (p: Vec3) => Vec3): GroundProbe {
  const n = norm(normal);
  return {
    cast(origin, dir, maxDist) {
      const denom = dot(dir, n);
      if (denom > -1e-6) return null;
      const t = dot({ x: point.x - origin.x, y: point.y - origin.y, z: point.z - origin.z }, n) / denom;
      if (t < 0 || t > maxDist) return null;
      const p = add(origin, scale(dir, t));
      return { distance: t, normal: n, point: p, velocity: velocityAt ? velocityAt(p) : undefined };
    },
  };
}

export const flatGround = (y = 0): GroundProbe => planeGround(v3(0, y, 0), v3(0, 1, 0));

/** A plane tilted by `angleRad` about the world z axis, rising toward +x (so downhill is -x... facing +x climbs). */
export function slopeGround(angleRad: number): GroundProbe {
  return planeGround(v3(0, 0, 0), v3(-Math.sin(angleRad), Math.cos(angleRad), 0));
}

/** A flat plane that moves with a constant velocity, optionally turning about the vertical axis through `centre`. */
export function movingPlatform(velocity: Vec3, spinRadPerSec = 0, centre: Vec3 = v3()): GroundProbe {
  return planeGround(v3(0, 0, 0), v3(0, 1, 0), (p) => {
    if (spinRadPerSec === 0) return velocity;
    const r = { x: p.x - centre.x, y: 0, z: p.z - centre.z };
    const w = cross(v3(0, spinRadPerSec, 0), r);
    return add(velocity, w);
  });
}
