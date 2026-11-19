// What the water, cannons and geysers do to the rider, once per physics step. Pure: no DOM, no Math.random.
import { TUNE, type PhysEvent, type Player } from '../config';
import type { ExternalForces } from '../physics';
import type { World } from '../world';
import { cannonState, geyserState, inGeyser, inJet } from './obstacles';
import { FLOOD, type Flood, type FlowSample, type FloodStats, type Obstacles } from './types';

const UP_Y = 1;

/** Wrap an angle to [-PI, PI]. */
function wrapPi(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

/** Leave the ground the way a takeoff does (see physics.ts goAir + resetAir). stepAir then sends the takeoff event. */
function leaveGround(p: Player, ev: PhysEvent[]): void {
  if (p.manual) {
    ev.push({ e: 'manualEnd', kind: p.manual.kind, t: p.manual.t, fell: false });
    p.manual = null;
    p.manualHoldT = 0;
  }
  p.mode = 'air';
  p.airT = 0;
  p.spin = 0;
  p.spinVel = 0;
  p.flip = 0;
  p.flipVel = 0;
  p.trick = null;
  p.tricksThisAir = 0;
  p.grab = 0;
  p.grabT = 0;
  p.normal.set(0, UP_Y, 0);
}

/** Knocked out of control: the same bail as a bad landing (physics.ts spikeBail), with the given reason. */
function bailRider(p: Player, ev: PhysEvent[], reason: string): void {
  if (p.grab) ev.push({ e: 'grabEnd', kind: p.grab, t: p.grabT, name: p.grabKind });
  if (p.manual) {
    ev.push({ e: 'manualEnd', kind: p.manual.kind, t: p.manual.t, fell: true });
    p.manual = null;
    p.manualHoldT = 0;
  }
  p.mode = 'bail';
  p.bailT = TUNE.bailTime;
  p.vel.multiplyScalar(TUNE.bailKeep);
  p.trick = null;
  p.grab = 0;
  p.grabT = 0;
  ev.push({ e: 'bail', reason });
}

/** `stats` is mutated in place every step (the HUD and the app read it). `now` is the sim clock in seconds. */
export function createFloodForces(flood: Flood, obstacles: Obstacles, stats: FloodStats, now: () => number): ExternalForces {
  // One closure per rider: this is per-rider state.
  const sample: FlowSample = { depth: 0, vx: 0, vz: 0, bedY: 0, surfaceY: 0 };
  let riddenFor = 0;               // seconds riding continuously
  let lastHit = -Infinity;         // last sim time a cannon jet touched the rider (any cannon)
  const geyserHit = new Map<number, number>(); // geyser id -> last sim time the rider was in its column

  return (p: Player, _w: World, dt: number, ev: PhysEvent[]): void => {
    flood.focus(p.island);
    stats.sinceBlast += dt;
    const t = now();

    // ---- the water under the rider
    const ok = flood.sample(p.pos.x, p.pos.z, p.island, sample);
    const wet = ok && sample.depth >= FLOOD.minDepth && p.pos.y <= sample.surfaceY + 0.6;
    stats.depth = wet ? sample.depth : 0;
    stats.bonus = 0;
    // how much of the board is on water: the ground modifier lifts it onto the surface over floatDepth..2*floatDepth
    p.wet = wet ? Math.min(1, Math.max(0, (sample.depth - FLOOD.floatDepth * 0.5) / FLOOD.floatDepth)) : 0;

    let riding = false;
    if (wet && p.mode !== 'grind') {
      const vx = sample.vx;
      const vz = sample.vz;
      const fs = Math.hypot(vx, vz);
      const hs = Math.hypot(p.vel.x, p.vel.z);
      const fdx = fs > 1e-6 ? vx / fs : 0;
      const fdz = fs > 1e-6 ? vz / fs : 0;
      const cosA = hs < 0.5 ? 0 : (p.vel.x * fdx + p.vel.z * fdz) / hs;

      riding = p.mode === 'ground' && fs >= FLOOD.minFlow && (cosA >= FLOOD.minAlign || hs < 3);
      if (riding) {
        const factor = Math.min(1, sample.depth / (FLOOD.minDepth * 4));
        const along = p.vel.x * fdx + p.vel.z * fdz;
        const cap = Math.max(fs + FLOOD.bonusMax, FLOOD.rideSpeedCap);
        if (along < cap) {
          p.vel.x += fdx * FLOOD.rideAccel * factor * dt;
          p.vel.z += fdz * FLOOD.rideAccel * factor * dt;
        }
        stats.bonus = factor * Math.min(1, Math.max(0, 1 - along / cap));
      } else if (cosA < -0.3) {
        // Against the flow: drag on the horizontal velocity.
        const k = Math.exp(-FLOOD.againstDrag * dt);
        p.vel.x *= k;
        p.vel.z *= k;
      }

      if (!riding && fs > 1e-6) {
        // Cross flow: the part of the flow off the rider's travel pushes sideways (the whole flow when nearly stopped).
        let cx: number;
        let cz: number;
        if (hs < 0.5) {
          cx = vx;
          cz = vz;
        } else {
          const tx = p.vel.x / hs;
          const tz = p.vel.z / hs;
          const a = vx * tx + vz * tz;
          cx = vx - tx * a;
          cz = vz - tz * a;
        }
        const cm = Math.hypot(cx, cz);
        if (cm > 1e-6) {
          const push = FLOOD.crossPush * cm * dt;
          p.vel.x += (cx / cm) * push;
          p.vel.z += (cz / cm) * push;
        }
      }

      if (sample.depth > FLOOD.deepDepth && p.mode === 'ground') {
        const k = 1 - 0.35 * dt;
        p.vel.multiplyScalar(k);
      }
    }

    // ---- surfing: riding held long enough counts as surfing
    riddenFor = riding ? riddenFor + dt : 0;
    const surfing = riddenFor >= FLOOD.surfHold;
    if (surfing !== stats.surfing) {
      stats.surfing = surfing;
      ev.push({ e: 'surf', on: surfing });
    }
    if (surfing) {
      stats.surfT += dt;
      stats.surfPoints += FLOOD.surfPoints * dt;
    }

    // ---- water cannons
    for (const c of obstacles.cannons) {
      if (Math.abs(c.island - p.island) > 1) continue;
      if (cannonState(c, t).phase !== 'fire' || !inJet(c, p.pos.x, p.pos.y, p.pos.z)) continue;
      p.vel.x += Math.sin(c.yaw) * FLOOD.cannonPush * dt;
      p.vel.z += Math.cos(c.yaw) * FLOOD.cannonPush * dt;
      p.flow = Math.max(0, p.flow - 0.5 * dt);
      const newHit = t - lastHit > 0.3;
      lastHit = t;
      if (newHit) {
        stats.blasts++;
        ev.push({ e: 'blast', by: 'cannon' });
        if (stats.sinceBlast < FLOOD.blastBailWindow && (p.mode === 'ground' || p.mode === 'air')) {
          bailRider(p, ev, 'Washed out');
        }
        stats.sinceBlast = 0;
      }
    }

    // ---- geysers
    for (const g of obstacles.geysers) {
      if (Math.abs(g.island - p.island) > 1) continue;
      if (geyserState(g, t).phase !== 'fire' || !inGeyser(g, p.pos.x, p.pos.y, p.pos.z)) continue;
      const last = geyserHit.get(g.id) ?? -Infinity;
      const newHit = t - last > 0.5;
      geyserHit.set(g.id, t);
      p.vel.y = Math.max(p.vel.y, FLOOD.geyserLift);
      if (!newHit) continue;
      if (p.mode === 'ground') leaveGround(p, ev);
      ev.push({ e: 'blast', by: 'geyser' });
      stats.blasts++;
      stats.sinceBlast = 0; // a geyser launch never bails by itself
      // Sideways shove away from the vent centre.
      const dx = p.pos.x - g.x;
      const dz = p.pos.z - g.z;
      const d = Math.hypot(dx, dz);
      if (d > 1e-6) {
        p.vel.x += (dx / d) * 6;
        p.vel.z += (dz / d) * 6;
      }
    }

    // ---- warning for the nearest cannon or geyser winding up or firing
    let warn: FloodStats['warn'] = null;
    const WARN_M = 70;
    const consider = (kind: 'cannon' | 'geyser', x: number, z: number, phase: string): void => {
      const dx = x - p.pos.x;
      const dz = z - p.pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist > WARN_M || (warn && dist >= warn.dist)) return;
      warn = {
        kind,
        dist,
        bearing: wrapPi(Math.atan2(dx, dz) - p.heading),
        fire: phase === 'fire',
      };
    };
    for (const c of obstacles.cannons) {
      const st = cannonState(c, t);
      if (st.phase !== 'idle') consider('cannon', c.x, c.z, st.phase);
    }
    for (const g of obstacles.geysers) {
      const st = geyserState(g, t);
      if (st.phase !== 'idle') consider('geyser', g.x, g.z, st.phase);
    }
    stats.warn = warn;
  };
}
