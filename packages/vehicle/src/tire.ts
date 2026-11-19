// Layer 4, tyre half: simplified 4-parameter Pacejka, normalised combined slip, implicit Bernard-Clover relaxation.
import { clamp, deg2rad } from './math';
import type { LatTire, LongTire, PacejkaParams } from './config';

/** Friction coefficient mu (force / normal load) at slip x. Odd in x. Multiply by Fz (Newtons) for force. */
export function pacejkaMu(x: number, p: PacejkaParams): number {
  const bx = p.B * x;
  return p.D * Math.sin(p.C * Math.atan(bx - p.E * (bx - Math.atan(bx))));
}

/**
 * Combined slip: normalise both slips against their peak coordinates, evaluate each curve at the combined magnitude and
 * project along the slip vector, so a spinning or locked wheel loses sideways grip (friction-circle behaviour).
 * Returns mu along the wheel (kappa sense) and across it (alpha sense, same sign as alpha).
 */
export function combinedMu(kappa: number, alpha: number, long: LongTire, lat: LatTire): { mux: number; muy: number } {
  const peakAlpha = deg2rad(lat.peakAngleDeg);
  const sx = kappa / long.peakSlip;
  const sy = clamp(alpha, -1.5, 1.5) / peakAlpha;
  const s = Math.hypot(sx, sy);
  if (s < 1e-6) return { mux: 0, muy: 0 };
  return {
    mux: (sx / s) * pacejkaMu(s * long.peakSlip, long),
    muy: (sy / s) * pacejkaMu(s * peakAlpha, lat),
  };
}

/** Peak of the longitudinal curve (the grip an ABS or TCS works against). */
export const peakLongMu = (long: LongTire): number => long.D;

/** Relaxation state of one tyre. kappa: slip ratio; sy: tan(slip angle), left-positive velocity sense. */
export interface SlipState { kappa: number; sy: number }

/**
 * Implicit-Euler relaxation: sigma * d(slip)/dt + |vx| * slip = (input). At speed it converges to the classical slip;
 * at standstill |vx| -> 0 and the slip integrates tread displacement, so the tyre acts as a spring that holds the car parked.
 * vlong/vlat: contact velocity along/across the wheel (m/s). omegaR: wheel surface speed (m/s).
 */
export function relaxSlip(s: SlipState, vlong: number, vlat: number, omegaR: number, sigmaLong: number, sigmaLat: number, dt: number): void {
  const av = Math.abs(vlong);
  s.kappa = clamp((s.kappa + (dt * (omegaR - vlong)) / sigmaLong) / (1 + (dt * av) / sigmaLong), -3, 3);
  s.sy = clamp((s.sy + (dt * vlat) / sigmaLat) / (1 + (dt * av) / sigmaLat), -12, 12);
}
