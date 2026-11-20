// The race simulation: pure functions of plain data. No three.js, no DOM, no Math.random, no Date.
import type { CourseId, KartInput, KartState, Physics, RaceState, VehicleId } from './config';
import { DRIFT, DRIVE, HOP, ITEMS, RACE, SIM, SPIN, VEHICLES } from './config';
import { hazardHits } from './hazards';
import { boxSpots, cpuItemUse, stepItems, type ItemEvents } from './items';
import { getTrack, gridSlot, headingOf, isOnTrack, pointAt, projectOnTrack, type Track } from './track';
import { stepSimKart } from './simDrive';

const COAST: KartInput = { steer: 0, throttle: 0, drift: false, item: false };

/** What happened in one stepRace, for sounds and the HUD. */
export interface RaceEvents extends ItemEvents {
  /** Kart indices that bumped another kart. */
  bumped: number[];
  /** Kart indices that hit a background vehicle (spun out). */
  hazard: number[];
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Wraps an angle into -PI..PI. */
function wrapAngle(a: number): number {
  let r = (a + Math.PI) % (2 * Math.PI);
  if (r < 0) r += 2 * Math.PI;
  return r - Math.PI;
}

/** A new race: one kart per entry, on grid slots 0..n-1, at rest. skill: 1 for humans, RACE.cpuSkill[i] for CPUs. */
export function createRace(entries: readonly { vehicle: VehicleId; skill: number }[], course: CourseId, laps: number = RACE.laps, physics: Physics = 'arcade'): RaceState {
  const track = getTrack(course);
  const karts: KartState[] = entries.map((e, i) => {
    const g = gridSlot(track, i);
    return { vehicle: e.vehicle, x: g.x, z: g.z, h: g.h, vx: 0, vz: 0, st: 0, s: g.s, dist: g.dist, lap: 0,
      drift: 0, charge: 0, boost: 0, off: false, skill: e.skill, fin: null, hop: 0, spin: 0, item: null, dh: false, ih: false };
  });
  void ITEMS;
  return { course, t: 0, laps, karts, firstFin: null, over: false, boxes: boxSpots(track).map(() => 0), acorns: [], physics };
}

/** Advance one kart by dt (driving physics, hop and drift, spin-outs, off-track, progress and laps). Does not touch race.t. */
export function stepKart(k: KartState, input: KartInput | null, dt: number, raceT: number, laps: number, track: Track): void {
  const inp: KartInput = k.fin !== null || input === null ? COAST : input;
  const spec = VEHICLES[k.vehicle];
  // A fresh press of the drift button: down now, up on the last step.
  const press = inp.drift && !k.dh;
  const steer = clamp(inp.steer, -1, 1);

  // 1. Forward and sideways speed in the kart's frame.
  const fwdX = Math.sin(k.h), fwdZ = Math.cos(k.h);
  const leftX = Math.cos(k.h), leftZ = -Math.sin(k.h);
  let vF = k.vx * fwdX + k.vz * fwdZ;
  let vL = k.vx * leftX + k.vz * leftZ;

  // 2. Surface and top speed.
  const hit = projectOnTrack(track, k.x, k.z);
  k.off = !isOnTrack(track, hit);
  const boosting = k.boost > 0;
  const top = spec.maxSpeed * k.skill * (k.off ? DRIVE.offTrackSpeedMul : 1) * (boosting ? DRIFT.boostSpeedMul : 1);

  if (k.spin > 0) {
    // 2b. Spun out: no throttle, no hop, no steering. The kart slides to a halt along its heading.
    k.spin = Math.max(0, k.spin - dt);
    k.drift = 0;
    k.charge = 0;
    k.hop = 0;
    k.st = 0;
    const damp = Math.exp(-SPIN.drag * dt);
    vF *= damp;
    vL *= damp;
  } else {
    // 3. Throttle, brakes, reverse, coasting.
    const th = clamp(inp.throttle, -1, 1);
    if (th > 0) {
      if (vF < top) {
        vF += spec.accel * th * dt + (boosting ? DRIFT.boostAccel * dt : 0);
        if (vF > top) vF = top;
      } else if (vF > top) {
        const down = k.off ? DRIVE.offTrackDrag * vF * dt : 2 * dt * vF;
        vF = Math.max(top, vF - down);
      }
    } else if (th < 0) {
      if (vF > 0) vF = Math.max(0, vF - spec.brake * -th * dt);
      else vF = Math.max(-DRIVE.reverseMax, vF - spec.accel * 0.5 * -th * dt);
    } else {
      vF -= vF * DRIVE.coastDrag * dt;
      if (k.off) vF -= vF * DRIVE.offTrackDrag * dt;
    }

    // 4. Hop: a fresh press hops; landing while steering starts a drift.
    if (press && k.hop <= 0 && k.drift === 0) k.hop = HOP.duration;
    if (k.hop > 0) {
      k.hop -= dt;
      if (k.hop <= 0) {
        k.hop = 0;
        if (inp.drift && Math.abs(steer) > HOP.minSteer && vF > DRIFT.minSpeed && !k.off) {
          k.drift = steer > 0 ? 1 : -1;
        }
      }
    }

    // 5. Steering and drift. Drift only starts on landing (above); release rule as before.
    k.st = steer;
    const speedF = Math.min(1, Math.abs(vF) / DRIVE.turnSpeedRef);
    const dir = vF >= 0 ? 1 : -1;
    if (k.drift !== 0 && (!inp.drift || vF < DRIFT.minSpeed * 0.6)) {
      if (k.charge >= DRIFT.chargeForBoost) k.boost = DRIFT.boostS;
      k.drift = 0;
      k.charge = 0;
    }
    let steerEff = steer;
    let grip = spec.grip;
    if (k.drift !== 0) {
      k.charge += dt;
      steerEff = clamp(k.drift * DRIFT.bias + steer * DRIFT.steerShare, -1, 1) * DRIFT.turnMul;
      grip = spec.grip * DRIFT.gripMul;
    } else if (k.hop > 0) {
      // A hop lets you pivot: less sideways grip while airborne.
      grip = spec.grip * 0.5;
    }
    k.h -= steerEff * spec.turnRate * speedF * dir * dt;

    // 6. Sideways slide dies off.
    vL *= Math.exp(-grip * dt);
  }

  // 7. Rebuild world velocity from the new heading, move, keep inside the hedges.
  const nFwdX = Math.sin(k.h), nFwdZ = Math.cos(k.h);
  const nLeftX = Math.cos(k.h), nLeftZ = -Math.sin(k.h);
  k.vx = nFwdX * vF + nLeftX * vL;
  k.vz = nFwdZ * vF + nLeftZ * vL;
  k.x += k.vx * dt;
  k.z += k.vz * dt;
  const minX = track.course.bounds.minX + spec.radius, maxX = track.course.bounds.maxX - spec.radius;
  const minZ = track.course.bounds.minZ + spec.radius, maxZ = track.course.bounds.maxZ - spec.radius;
  if (k.x < minX) { k.x = minX; k.vx = 0; }
  else if (k.x > maxX) { k.x = maxX; k.vx = 0; }
  if (k.z < minZ) { k.z = minZ; k.vz = 0; }
  else if (k.z > maxZ) { k.z = maxZ; k.vz = 0; }

  // 8. Boost runs down.
  k.boost = Math.max(0, k.boost - dt);

  advanceKart(k, raceT, laps, track);
  k.dh = inp.drift;
}

/** Progress, laps and the finish line, from the kart's position. Shared by both driving models. */
export function advanceKart(k: KartState, raceT: number, laps: number, track: Track): void {
  const hit = projectOnTrack(track, k.x, k.z);
  let d = hit.s - k.s;
  if (d > track.length / 2) d -= track.length;
  if (d < -track.length / 2) d += track.length;
  d = clamp(d, -5, 5);
  k.dist += d;
  k.s = hit.s;
  k.lap = clamp(Math.floor(k.dist / track.length), 0, laps);
  if (k.fin === null && k.dist >= laps * track.length) {
    k.fin = raceT;
    k.lap = laps;
  }
}

/** One kart for one step under the race's driving model. */
function stepOne(race: RaceState, k: KartState, input: KartInput | null, dt: number, track: Track): void {
  if (race.physics === 'sim') {
    // Finished karts coast (null input); the sim model reads the input and handles progress itself.
    const inp: KartInput = k.fin !== null || input === null ? COAST : input;
    stepSimKart(k, inp, dt, track);
    advanceKart(k, race.t, race.laps, track);
    k.dh = inp.drift;
  } else {
    stepKart(k, input, dt, race.t, race.laps, track);
  }
}

/** Push overlapping karts apart and bounce them (mass-weighted). Returns the indices of karts that bumped this step. */
export function resolveBumps(karts: KartState[]): number[] {
  const bumped: number[] = [];
  const mark = (i: number): void => {
    if (!bumped.includes(i)) bumped.push(i);
  };
  for (let i = 0; i < karts.length; i++) {
    for (let j = i + 1; j < karts.length; j++) {
      const a = karts[i], b = karts[j];
      const sa = VEHICLES[a.vehicle], sb = VEHICLES[b.vehicle];
      const r = sa.radius + sb.radius;
      const dx = b.x - a.x, dz = b.z - a.z;
      const d = Math.hypot(dx, dz);
      if (d >= r) continue;
      if (d <= 1e-6) {
        a.x -= r / 2;
        b.x += r / 2;
        mark(i);
        mark(j);
        continue;
      }
      const nx = dx / d, nz = dz / d;
      const overlap = r - d;
      const ma = sa.mass, mb = sb.mass;
      const sum = ma + mb;
      a.x -= nx * overlap * mb / sum;
      a.z -= nz * overlap * mb / sum;
      b.x += nx * overlap * ma / sum;
      b.z += nz * overlap * ma / sum;
      const vn = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
      if (vn < 0) {
        const jimp = -(1 + DRIVE.bumpRestitution) * vn / (1 / ma + 1 / mb);
        a.vx -= nx * jimp / ma;
        a.vz -= nz * jimp / ma;
        b.vx += nx * jimp / mb;
        b.vz += nz * jimp / mb;
      }
      mark(i);
      mark(j);
    }
  }
  return bumped;
}

/** One fixed step of the whole race: every kart, then bumps, then finish bookkeeping. inputs[i] may be null (coast). */
export function stepRace(race: RaceState, inputs: readonly (KartInput | null)[], dt: number): RaceEvents {
  const track = getTrack(race.course);
  race.t += dt;
  if (race.over) {
    for (const k of race.karts) stepOne(race, k, null, dt, track);
    return { bumped: [], hazard: [], picked: [], used: [], hits: [] };
  }
  race.karts.forEach((k, i) => stepOne(race, k, inputs[i] ?? null, dt, track));
  const bumped = resolveBumps(race.karts);
  const hazard = hazardHits(race, track);
  const items = stepItems(race, track, inputs, dt);
  if (race.firstFin === null) {
    for (const k of race.karts) {
      if (k.fin !== null && (race.firstFin === null || k.fin < race.firstFin)) race.firstFin = k.fin;
    }
  }
  const allDone = race.karts.every((k) => k.fin !== null);
  race.over = allDone || (race.firstFin !== null && race.t - race.firstFin >= RACE.finishGraceS);
  return { bumped, hazard, ...items };
}

/** True when kart b is strictly ahead of kart a. */
function aheadOf(b: KartState, a: KartState): boolean {
  if (b.fin !== null && a.fin !== null) return b.fin < a.fin;
  if (b.fin !== null) return true;
  if (a.fin !== null) return false;
  return b.dist > a.dist;
}

/** Places by index: 0 = 1st. Finished karts by fin time, then the rest by dist (further = better). Ties share. */
export function racePlaces(race: RaceState): number[] {
  return race.karts.map((a) => race.karts.filter((b) => aheadOf(b, a)).length);
}

/** A CPU driver: follow the racing line a little ahead, full throttle, drift in long corners. Pure, deterministic. */
export function cpuInput(race: RaceState, index: number): KartInput {
  const track = getTrack(race.course);
  const k = race.karts[index];
  if (k.fin !== null) return { steer: 0, throttle: 0, drift: false, item: false };
  const lane = ((index % 4) - 1.5) * 1.2;
  const speed = Math.hypot(k.vx, k.vz);
  const look = 6 + Math.max(0, speed) * 0.45;
  const p = pointAt(track, k.s + look);
  // Left of tangent (tx, tz) is (tz, -tx).
  const tx = p.x + p.tz * lane;
  const tz = p.z - p.tx * lane;
  const hd = Math.atan2(tx - k.x, tz - k.z);
  const err = wrapAngle(hd - k.h);
  const steer = clamp(-err * (race.physics === 'sim' ? SIM.cpuSteerGain : 2.2), -1, 1);
  const a0 = pointAt(track, k.s), a1 = pointAt(track, k.s + 18);
  const c = Math.abs(wrapAngle(headingOf(a1.tx, a1.tz) - headingOf(a0.tx, a0.tz)));
  let drift = c > 0.9 && speed > DRIFT.minSpeed + 2 && Math.abs(steer) > 0.35;
  if (k.drift !== 0 && (k.charge >= DRIFT.chargeForBoost + 0.1 || c < 0.4)) drift = false;
  // Drifts start on a fresh press. A CPU still holding the button after a missed landing lets go for one step.
  if (drift && k.drift === 0 && k.hop === 0 && k.dh) drift = false;
  let throttle = c > 1.6 && speed > 14 ? 0.6 : 1;
  if (race.physics === 'sim') {
    // A real chassis can't hold its top speed through a corner: brake to the speed the corner's radius allows at SIM.cpuLatG.
    const radius = c > 1e-3 ? 18 / c : Infinity;
    const target = Math.min(VEHICLES[k.vehicle].maxSpeed * k.skill, Math.sqrt(SIM.cpuLatG * 9.81 * radius));
    throttle = clamp((target - speed) * 0.6, -0.6, 1);
  }
  return { steer, throttle, drift, item: cpuItemUse(race, track, index) };
}
