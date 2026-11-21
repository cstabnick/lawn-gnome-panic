/**
 * Maps an angle in radians into [-PI, PI]. Values that land on the +PI or -PI
 * boundary within float noise are kept on +PI, so wrapAngle(3 * PI) is PI.
 */
export function wrapAngle(a: number): number {
  const TAU = Math.PI * 2;
  const EPS = 1e-12;
  let r = a % TAU;
  if (r < -Math.PI - EPS) r += TAU;
  else if (r > Math.PI + EPS) r -= TAU;
  return r;
}
