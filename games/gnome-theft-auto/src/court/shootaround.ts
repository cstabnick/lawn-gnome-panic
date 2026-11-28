// Drainpipe Court free shooting (batch 3 E19): walk round with a ball, hold Shoot to fill the release meter, let go,
// and the ball arcs to the nearer hoop. Pure: no three.js, no DOM.
import { COURT, SHOOT, type ShootEvent } from './types';

export interface ShootState {
  phase: 'hold' | 'charge' | 'flight';
  charge: number;            // 0..1 while charging
  makes: number; shots: number;
  /** In flight: start (world), the hoop aimed at, flight time and clock, whether it goes in, and if it was a three. */
  flight: { sx: number; sy: number; sz: number; hx: number; hz: number; dur: number; t: number; make: boolean; three: boolean; swish: boolean } | null;
}

export function newShoot(): ShootState {
  return { phase: 'hold', charge: 0, makes: 0, shots: 0, flight: null };
}

/** The nearer hoop to (x, z). */
export function nearestHoop(x: number, z: number): { x: number; z: number; side: 'left' | 'right' } {
  let best: { x: number; z: number; side: 'left' | 'right' } = COURT.hoops[0];
  let bestD = Infinity;
  for (const h of COURT.hoops) {
    const d = (h.x - x) ** 2 + (h.z - z) ** 2;
    if (d < bestD) { bestD = d; best = h; }
  }
  return { x: best.x, z: best.z, side: best.side };
}

/** A three: farther than COURT.threeRadius from that hoop. */
export function isThree(x: number, z: number): boolean {
  const h = nearestHoop(x, z);
  return Math.hypot(h.x - x, h.z - z) > COURT.threeRadius;
}

/** Make chance for a release at this charge, distance (m, to the rim) and three-ness. */
function makeChance(charge: number, dist: number, three: boolean): number {
  if (dist > 9) return 0;
  // 0.85 at the rim, falling linearly to 0.45 at 7 m.
  let chance = 0.85 - 0.4 * Math.min(1, dist / 7);
  // Outside the sweet spot the chance halves for each 0.1 of charge off it.
  const off = charge < SHOOT.sweetLo ? SHOOT.sweetLo - charge : charge > SHOOT.sweetHi ? charge - SHOOT.sweetHi : 0;
  chance *= 0.5 ** (off / 0.1);
  if (three) chance *= 0.85;
  return chance;
}

/** One frame. down = the shoot control held now. (px, pz) the player's feet, groundY the court ground height.
 *  rand: a 0..1 random number (Math.random in the game, fixed in tests). */
export function stepShoot(s: ShootState, dt: number, down: boolean, px: number, pz: number, groundY: number, rand: number): ShootEvent {
  if (s.phase === 'flight' && s.flight) {
    const f = s.flight;
    f.t += dt;
    if (f.t < f.dur) return null;
    s.flight = null;
    s.phase = 'hold';
    if (f.make) {
      s.makes += 1;
      return { kind: 'make', three: f.three, swish: f.swish };
    }
    return { kind: 'miss', clang: true };
  }

  if (s.phase === 'hold') {
    if (!down) return null;
    s.phase = 'charge';
    s.charge = 0;
  }

  if (s.phase === 'charge') {
    if (down) {
      s.charge = Math.min(1, s.charge + dt / SHOOT.fillS);
      return null;
    }
    // Released: shoot at the nearer hoop.
    const charge = s.charge;
    const three = isThree(px, pz);
    const hoop = nearestHoop(px, pz);
    const dist = Math.hypot(hoop.x - px, hoop.z - pz);
    const sweetMid = (SHOOT.sweetLo + SHOOT.sweetHi) / 2;
    const sweetHalf = (SHOOT.sweetHi - SHOOT.sweetLo) / 2;
    const chance = makeChance(charge, dist, three);
    const make = rand < chance;
    const swish = make && Math.abs(charge - sweetMid) <= sweetHalf / 3;
    s.flight = {
      sx: px, sy: groundY + 1.1, sz: pz, hx: hoop.x, hz: hoop.z,
      dur: Math.max(0.6, dist * SHOOT.flightPerM), t: 0, make, three, swish,
    };
    s.phase = 'flight';
    s.charge = 0;
    s.shots += 1;
    return { kind: 'release', charge, three };
  }

  return null;
}

/** The ball's world position: in flight along the arc, else in the player's hands (px, groundY + 0.7, pz). */
export function ballAt(s: ShootState, px: number, pz: number, groundY: number): { x: number; y: number; z: number } {
  const f = s.flight;
  if (s.phase !== 'flight' || !f) return { x: px, y: groundY + 0.7, z: pz };

  // End point: the rim centre if it goes in, else 0.35 m short of it on the shooter's side.
  const rimY = f.sy - 1.1 + COURT.hoopY;
  let ex = f.hx;
  let ez = f.hz;
  if (!f.make) {
    const dx = f.hx - f.sx;
    const dz = f.hz - f.sz;
    const len = Math.hypot(dx, dz) || 1;
    ex = f.hx - (dx / len) * 0.35;
    ez = f.hz - (dz / len) * 0.35;
  }

  const u = Math.min(1, Math.max(0, f.t / f.dur));
  // Straight line from start to end, plus a bulge so the apex sits 1.2 m above the higher end.
  const avg = (f.sy + rimY) / 2;
  const bulge = Math.max(f.sy, rimY) + 1.2 - avg;
  const y = f.sy + (rimY - f.sy) * u + 4 * bulge * u * (1 - u);
  return {
    x: f.sx + (ex - f.sx) * u,
    y,
    z: f.sz + (ez - f.sz) * u,
  };
}
