// Ball flight, bounce and roll as pure functions. Deterministic: the same shot always gives the same result.
// Launch speeds are calibrated at load so a perfect full-power shot on flat ground with no wind carries
// exactly CLUBS[club].carry yards: the range estimates shown to the player are the real thing.
import * as THREE from 'three';
import { CLUBS, LIES, PHYS, WEDGE_SAND_POWER, type ClubId, type FlightEvent, type Lie, type Shot, type ShotResult, type Wind } from './config';
import { gradientAt, heightAt, lieAt } from './course';
import { collide } from './obstacles';

const DEG = Math.PI / 180;
/** 1 mph in yards per second. */
const MPH = 0.48889;

interface Vec { x: number; y: number; z: number }

/** One airborne integration step (semi-implicit Euler). curve = sideways accel to the right of travel, yd/s². */
function stepAir(p: Vec, v: Vec, windX: number, windZ: number, curve: number, dt: number): void {
  const rx = v.x - windX;
  const rz = v.z - windZ;
  const rs = Math.hypot(rx, v.y, rz);
  const vh = Math.hypot(v.x, v.z);
  let ax = -PHYS.drag * rs * rx;
  let ay = -PHYS.drag * rs * v.y - PHYS.gravity + PHYS.lift * vh * vh;
  let az = -PHYS.drag * rs * rz;
  if (vh > 0.01 && curve !== 0) {
    // Right of travel direction (vx, vz) is (-vz, vx) / |vh|.
    ax += (-v.z / vh) * curve;
    az += (v.x / vh) * curve;
  }
  // Lift never holds a ball up once it is falling steeply; keep it from floating.
  if (v.y < 0) ay = Math.min(ay, -PHYS.gravity * 0.35);
  v.x += ax * dt;
  v.y += ay * dt;
  v.z += az * dt;
  p.x += v.x * dt;
  p.y += v.y * dt;
  p.z += v.z * dt;
}

/** Carry over flat ground (y = 0), no wind, no curve, for a launch speed and angle. */
function flatCarry(speed: number, launchDeg: number): number {
  const p = { x: 0, y: 0, z: 0 };
  const v = { x: 0, y: speed * Math.sin(launchDeg * DEG), z: speed * Math.cos(launchDeg * DEG) };
  for (let t = 0; t < PHYS.maxSeconds; t += PHYS.simDt) {
    stepAir(p, v, 0, 0, 0, PHYS.simDt);
    if (p.y <= 0 && v.y < 0) return p.z;
  }
  return p.z;
}

const speedCache = new Map<ClubId, number>();

/** Full-power launch speed (yd/s) for a club, calibrated so the flat carry matches CLUBS[club].carry. */
export function launchSpeed(club: ClubId): number {
  const cached = speedCache.get(club);
  if (cached !== undefined) return cached;
  const def = CLUBS[club];
  let speed: number;
  if (def.launch <= 0) {
    // Putter: rolls on a flat green, d = v² / (2 a).
    speed = Math.sqrt(2 * LIES.green.roll * def.carry);
  } else {
    let lo = 1;
    let hi = 200;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (flatCarry(mid, def.launch) < def.carry) lo = mid;
      else hi = mid;
    }
    speed = (lo + hi) / 2;
  }
  speedCache.set(club, speed);
  return speed;
}

/** Power multiplier for a club from a lie (wedges dig out of sand better). */
export function liePower(club: ClubId, lie: Lie): number {
  if (lie === 'sand' && (club === 'SW' || club === 'GW')) return WEDGE_SAND_POWER;
  return LIES[lie].power;
}

/** Launch speed multiplier for a meter power. Putts scale with sqrt so roll distance is proportional to power. */
export function powerScale(club: ClubId, power: number): number {
  return CLUBS[club].launch <= 0 ? Math.sqrt(Math.max(0, power)) : power;
}

const estimateCache = new Map<string, number>();

/**
 * Estimated distance in yards for a perfect shot at this power from this lie, on flat ground with no wind:
 * carry for full swings, roll distance for the putter (on a green). This is the number the HUD shows per club.
 */
export function estimateCarry(club: ClubId, lie: Lie = 'fairway', power = 1): number {
  const key = `${club}|${lie}|${power.toFixed(3)}`;
  const cached = estimateCache.get(key);
  if (cached !== undefined) return cached;
  const def = CLUBS[club];
  const speed = launchSpeed(club) * powerScale(club, power) * liePower(club, lie);
  const rollLie = lie === 'tee' || lie === 'fairway' ? 'green' : lie;
  const result = def.launch <= 0 ? (speed * speed) / (2 * LIES[rollLie].roll) : flatCarry(speed, def.launch);
  estimateCache.set(key, result);
  return result;
}

/** Wind as a velocity in yd/s. */
export function windVelocity(wind: Wind): { x: number; z: number } {
  return { x: Math.sin(wind.yaw) * wind.mph * MPH, z: Math.cos(wind.yaw) * wind.mph * MPH };
}

/** The total accuracy error a shot ends up with (lie wobble and overswing included). */
function totalError(shot: Shot, lie: Lie): number {
  let e = shot.accuracy * LIES[lie].wobble;
  if (shot.power > 1) e += (e >= 0 ? 1 : -1) * (shot.power - 1) * PHYS.overswingError;
  return Math.max(-1.6, Math.min(1.6, e));
}

/**
 * Plays a shot from `start` (ground position of the ball) and returns the whole trajectory.
 * pin: the cup position on the current green. Rolling over it slowly enough holes out.
 */
export function simulateShot(start: THREE.Vector3, shot: Shot, lie: Lie, wind: Wind, pin: { x: number; z: number }, opts: { noWind?: boolean; stopAtLanding?: boolean } = {}): ShotResult {
  const def = CLUBS[shot.club];
  const err = totalError(shot, lie);
  const yaw = shot.yaw - err * PHYS.startLineDeg * DEG; // positive error starts right
  const speed = launchSpeed(shot.club) * powerScale(shot.club, shot.power) * liePower(shot.club, lie);
  const launch = def.launch * DEG;
  const curve = def.launch > 0 ? err * def.curve * PHYS.curveAccel : 0;
  const w = opts.noWind ? { x: 0, z: 0 } : windVelocity(wind);

  const p = { x: start.x, y: heightAt(start.x, start.z) + (lie === 'tee' ? 0.03 : 0), z: start.z };
  const v = {
    x: Math.sin(yaw) * Math.cos(launch) * speed,
    y: Math.sin(launch) * speed,
    z: Math.cos(yaw) * Math.cos(launch) * speed,
  };

  const points: THREE.Vector3[] = [new THREE.Vector3(p.x, p.y, p.z)];
  const events: FlightEvent[] = [];
  const dt = PHYS.simDt;
  let airborne = def.launch > 0;
  let bounces = 0;
  let carry = 0;
  let apex = 0;
  let holed = false;
  let endLie: Lie = lie;
  let dropPoint: THREE.Vector3 | null = null;
  const lastDry = new THREE.Vector3(start.x, heightAt(start.x, start.z), start.z);
  let t = 0;
  let step = 0;
  let rolledEvent = !airborne;
  if (!airborne) events.push({ t: 0, kind: 'roll', lie, speed });

  const finishWater = (): void => {
    endLie = 'water';
    dropPoint = lastDry.clone();
    events.push({ t, kind: 'water', lie: 'water', speed: Math.hypot(v.x, v.y, v.z) });
  };

  while (t < PHYS.maxSeconds) {
    t += dt;
    step++;
    if (airborne) {
      stepAir(p, v, w.x, w.z, curve, dt);
      const airSpeed = Math.hypot(v.x, v.y, v.z);
      const airHit = collide(p, v, PHYS.ballRadius);
      if (airHit === 'trunk' || airHit === 'cart') events.push({ t, kind: 'bounce', lie: lieAt(p.x, p.z), speed: airSpeed });
      apex = Math.max(apex, p.y - start.y);
      const ground = heightAt(p.x, p.z);
      if (ground > 0.3 && step % PHYS.recordEvery === 0) lastDry.set(p.x, ground, p.z);
      if (p.y <= ground && v.y < 0) {
        const here = lieAt(p.x, p.z);
        const impact = Math.hypot(v.x, v.y, v.z);
        if (bounces === 0) carry = Math.hypot(p.x - start.x, p.z - start.z);
        if (opts.stopAtLanding) {
          p.y = Math.max(ground, 0);
          endLie = here;
          break;
        }
        if (here === 'water') {
          p.y = 0;
          finishWater();
          break;
        }
        events.push({ t, kind: 'bounce', lie: here, speed: impact });
        // Reflect off the ground plane: normal from the slope.
        const g = gradientAt(p.x, p.z);
        const nl = Math.hypot(g.gx, 1, g.gz);
        const nx = -g.gx / nl;
        const ny = 1 / nl;
        const nz = -g.gz / nl;
        const vn = v.x * nx + v.y * ny + v.z * nz;
        const L = LIES[here];
        const spinKeep = bounces === 0 ? 1 - def.spin * 0.9 : 1;
        const tx = (v.x - vn * nx) * L.keep * spinKeep;
        const ty = (v.y - vn * ny) * L.keep * spinKeep;
        const tz = (v.z - vn * nz) * L.keep * spinKeep;
        const out = -vn * L.bounce;
        v.x = tx + nx * out;
        v.y = ty + ny * out;
        v.z = tz + nz * out;
        p.y = ground;
        bounces++;
        if (out < 1.2) {
          airborne = false;
          v.y = 0;
        }
      }
    } else {
      if (!rolledEvent) {
        rolledEvent = true;
        events.push({ t, kind: 'roll', lie: lieAt(p.x, p.z), speed: Math.hypot(v.x, v.z) });
      }
      const here = lieAt(p.x, p.z);
      if (here === 'water') {
        p.y = 0;
        finishWater();
        break;
      }
      lastDry.set(p.x, heightAt(p.x, p.z), p.z);
      const decel = LIES[here].roll;
      const g = gradientAt(p.x, p.z);
      const sx = -PHYS.gravity * g.gx;
      const sz = -PHYS.gravity * g.gz;
      let speedH = Math.hypot(v.x, v.z);
      if (speedH < PHYS.stopSpeed && Math.hypot(sx, sz) < decel * 0.6) {
        endLie = here;
        break;
      }
      v.x += sx * dt;
      v.z += sz * dt;
      speedH = Math.hypot(v.x, v.z);
      const slow = decel * dt;
      if (speedH <= slow) {
        v.x = 0;
        v.z = 0;
      } else {
        v.x *= (speedH - slow) / speedH;
        v.z *= (speedH - slow) / speedH;
      }
      p.x += v.x * dt;
      p.z += v.z * dt;
      p.y = heightAt(p.x, p.z);
      const rollSpeed = Math.hypot(v.x, v.z);
      const rollHit = collide(p, v, PHYS.ballRadius);
      if (rollHit === 'trunk' || rollHit === 'cart') {
        events.push({ t, kind: 'bounce', lie: lieAt(p.x, p.z), speed: rollSpeed });
        p.y = heightAt(p.x, p.z);
      }
      if (Math.hypot(p.x - pin.x, p.z - pin.z) < PHYS.cupRadius && speedH < PHYS.cupMaxSpeed) {
        holed = true;
        p.x = pin.x;
        p.z = pin.z;
        p.y = heightAt(pin.x, pin.z) - 0.12;
        endLie = 'green';
        events.push({ t, kind: 'cup', lie: 'green', speed: speedH });
        break;
      }
    }
    if (step % PHYS.recordEvery === 0) points.push(new THREE.Vector3(p.x, p.y, p.z));
  }

  const end = new THREE.Vector3(p.x, p.y, p.z);
  points.push(end.clone());
  if (!holed && endLie !== 'water' && !opts.stopAtLanding) events.push({ t, kind: 'rest', lie: endLie, speed: 0 });
  return {
    points,
    sampleDt: PHYS.simDt * PHYS.recordEvery,
    duration: (points.length - 1) * PHYS.simDt * PHYS.recordEvery,
    events,
    end,
    endLie,
    holed,
    carry: def.launch > 0 ? carry : 0,
    apex,
    total: Math.hypot(end.x - start.x, end.z - start.z),
    dropPoint,
  };
}

/**
 * The path of a perfect full-power shot with this club (no wind), for the aim preview: the flight up to its
 * first landing for full swings, the whole roll for the putter (so the green's break shows).
 */
export function previewShot(start: THREE.Vector3, club: ClubId, lie: Lie, yaw: number, pin: { x: number; z: number }): ShotResult {
  const shot: Shot = { club, power: 1, accuracy: 0, yaw };
  const calm: Wind = { yaw: 0, mph: 0 };
  const isPutt = CLUBS[club].launch <= 0;
  return simulateShot(start, shot, lie, calm, isPutt ? { x: 1e9, z: 1e9 } : pin, { noWind: true, stopAtLanding: !isPutt });
}

/**
 * Where a perfect full-power shot with this club would first land (no wind), for the aim marker.
 * Returns the landing point on the ground. For the putter: where the putt would stop on this line.
 */
export function previewLanding(start: THREE.Vector3, club: ClubId, lie: Lie, yaw: number, pin: { x: number; z: number }): THREE.Vector3 {
  return previewShot(start, club, lie, yaw, pin).end;
}
