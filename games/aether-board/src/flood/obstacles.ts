// Cannons and geysers: placement on the mountain, and the pure timing and geometry queries about them. Pure.
import { runY, type Island, type World } from '../world';
import { FLOOD, makeRng, type Cannon, type CycleState, type Geyser, type Obstacles } from './types';

/** A ground point on a run, in its fall-line frame, with its world position and ground height. */
interface Spot { al: number; sd: number; x: number; y: number; z: number }

/** Ground point at along (al) and across (sd) on island isl, or null off the island. */
function spotAt(world: World, isl: Island, al: number, sd: number): Spot | null {
  // Across unit vector is (-dz, dx).
  const x = isl.cx + isl.dx * al - isl.dz * sd;
  const z = isl.cz + isl.dz * al + isl.dx * sd;
  const y = runY(world, isl, x, z);
  return y === null ? null : { al, sd, x, y, z };
}

export function generateObstacles(world: World, seed: number): Obstacles {
  const rng = makeRng(seed * 31 + 5);
  const cannons: Cannon[] = [];
  const geysers: Geyser[] = [];
  const kickers = world.islands.flatMap((o) => o.kickers);

  for (let i = 1; i < world.islands.length; i++) {
    const isl = world.islands[i];
    const ra = isl.r * isl.stretch;

    for (let c = 0; c < FLOOD.cannonsPerRun; c++) {
      const bank = c % 2 === 0 ? 1 : -1;
      let spot: Spot | null = null;
      for (let t = 0; t < 12 && !spot; t++) {
        const al = (-0.5 + 1.1 * rng()) * ra;
        const sd = bank * (0.62 + 0.18 * rng()) * isl.r;
        spot = spotAt(world, isl, al, sd);
      }
      if (!spot) continue;
      // Aim at the run's centre line, a little downhill.
      const tx = isl.cx + isl.dx * (spot.al + 10);
      const tz = isl.cz + isl.dz * (spot.al + 10);
      const period = FLOOD.cannonPeriodMin + (FLOOD.cannonPeriodMax - FLOOD.cannonPeriodMin) * rng();
      const phase = rng() * period;
      cannons.push({
        id: cannons.length,
        island: i,
        x: spot.x,
        y: spot.y + 1.4,
        z: spot.z,
        yaw: Math.atan2(tx - spot.x, tz - spot.z),
        period,
        phase,
      });
    }

    for (let g = 0; g < FLOOD.geysersPerRun; g++) {
      const avoid: { x: number; z: number }[] = [...world.hazards, ...kickers, ...cannons];
      let spot: Spot | null = null;
      for (let t = 0; t < 12 && !spot; t++) {
        const al = (-0.6 + 1.3 * rng()) * ra;
        const sd = (rng() - 0.5) * isl.r;
        const cand = spotAt(world, isl, al, sd);
        if (cand && avoid.every((p) => Math.hypot(p.x - cand.x, p.z - cand.z) >= 12)) spot = cand;
      }
      if (!spot) continue;
      const period = FLOOD.geyserPeriodMin + (FLOOD.geyserPeriodMax - FLOOD.geyserPeriodMin) * rng();
      const phase = rng() * period;
      geysers.push({ id: geysers.length, island: i, x: spot.x, y: spot.y, z: spot.z, period, phase });
    }
  }
  return { cannons, geysers };
}

/**
 * Shared cycle: idle, then windup (telegraph), then fire (burst), ending the period. A period too short for the
 * windup and burst is stretched to windup + burst + 1.
 */
export function cycleOf(t: number, period: number, phase: number, windup: number, burst: number): CycleState {
  const p = Math.max(period, windup + burst + 1);
  const s = (((t + phase) % p) + p) % p;
  const start = p - windup - burst;
  if (s < start) return { phase: 'idle', k: 0 };
  if (s < start + windup) return { phase: 'windup', k: (s - start) / windup };
  return { phase: 'fire', k: (s - start - windup) / burst };
}

export function cannonState(c: Cannon, t: number): CycleState {
  return cycleOf(t, c.period, c.phase, FLOOD.cannonWindup, FLOOD.cannonBurst);
}

export function geyserState(g: Geyser, t: number): CycleState {
  return cycleOf(t, g.period, g.phase, FLOOD.geyserWindup, FLOOD.geyserBurst);
}

/** Geometry only: is (x, y, z) inside the cannon's jet capsule (muzzle, along yaw, FLOOD.cannonRange, FLOOD.cannonRadius)? */
export function inJet(c: Cannon, x: number, y: number, z: number): boolean {
  const dxh = Math.sin(c.yaw);
  const dzh = Math.cos(c.yaw);
  const dot = (x - c.x) * dxh + (z - c.z) * dzh;
  if (dot < -1) return false;
  const u = Math.min(FLOOD.cannonRange, Math.max(0, dot));
  const px = c.x + dxh * u;
  const pz = c.z + dzh * u;
  const reach = FLOOD.cannonRadius * (1 + (0.5 * u) / FLOOD.cannonRange);
  if (Math.hypot(x - px, z - pz) > reach) return false;
  return y >= c.y - 2 && y <= c.y + 3.5;
}

/** Geometry only: horizontally within FLOOD.geyserRadius and no higher than 14 m above the vent. */
export function inGeyser(g: Geyser, x: number, y: number, z: number): boolean {
  if (Math.hypot(x - g.x, z - g.z) > FLOOD.geyserRadius) return false;
  return y >= g.y - 2 && y <= g.y + 14;
}
