// Ray march against the terrain height field. Pure maths, no three.js, so it can be tested without WebGL. The ray is
// stepped in fixed increments until a sample falls under the ground, then the crossing is refined by bisection: the
// height field is only sampled, never intersected analytically, so a fine step matters more than a clever solver.

export function marchToTerrain(
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  heightAt: (x: number, z: number) => number,
  maxDist: number,
  step = 1,
): { x: number; y: number; z: number } | null {
  const len = Math.hypot(dx, dy, dz);
  if (len === 0) return null;
  const ux = dx / len, uy = dy / len, uz = dz / len;
  const below = (t: number): boolean => {
    const x = ox + ux * t, y = oy + uy * t, z = oz + uz * t;
    return y < heightAt(x, z);
  };
  if (oy < heightAt(ox, oz)) return null;

  let prev = 0;
  while (prev < maxDist) {
    const next = Math.min(prev + step, maxDist);
    if (below(next)) {
      // `lo` is above ground, `hi` is below: bisect until they are within a few millimetres of each other.
      let lo = prev, hi = next;
      for (let i = 0; i < 12; i++) {
        const mid = (lo + hi) / 2;
        if (below(mid)) hi = mid; else lo = mid;
      }
      const x = ox + ux * hi, z = oz + uz * hi;
      return { x, y: heightAt(x, z), z };
    }
    prev = next;
  }
  return null;
}
