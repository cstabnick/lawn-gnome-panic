// Gnome Disc flight: a gnome thrown flat and spinning, flying like a frisbee. Pure functions, deterministic.
// Lift comes from spin and speed, bank (hyzer/anhyzer tilt) turns some lift sideways, a fast gnome turns
// right and a slow one fades left. Mid-air flails are spliced in by continueThrow.
// Launch speed is calibrated at load so a perfect full-power flat throw on flat ground carries DISC.carry.
import * as THREE from 'three';
import { DISC, LIES, PHYS, type FlightEvent, type Lie, type ShotResult, type Wind } from './config';
import { heightAt, lieAt } from './course';
import { windVelocity } from './physics';
import { collide } from './obstacles';

const DEG = Math.PI / 180;
/** The flying gnome's collision radius, yards (trees and carts). */
const GNOME_RADIUS = 0.35;
/** Speed that counts as "full" for the turn/fade curve, yd/s. */
const REF_SPEED = 55;
const SIM_DT = PHYS.simDt;
const RECORD_EVERY = PHYS.recordEvery;
const SAMPLE_DT = SIM_DT * RECORD_EVERY;
const MAX_SECONDS = 25;
const STOP_SPEED = 0.3;
/** Below this vertical impact speed the gnome stops skipping and skids. */
const SKID_VY = 2.5;
const SPIN_DECAY = -Math.log(DISC.spinKeep);

interface Body {
  p: THREE.Vector3;
  v: THREE.Vector3;
  spin: number;
}

/** A gnome throw: a ShotResult (so the camera, tracer, minimap and audio work unchanged) plus what a flail needs. */
export interface DiscFlight extends ShotResult {
  vels: THREE.Vector3[];
  spins: number[];
  /** Seconds after release of the first ground contact (Infinity if it never landed, e.g. caught in the chains). */
  airborneUntil: number;
  /** Bank in radians for the whole throw. */
  bank: number;
  start: THREE.Vector3;
}

export interface ThrowInput {
  /** Ground point the gnome is thrown from (state.ball). */
  from: THREE.Vector3;
  yaw: number;
  /** 0..DISC.maxPower */
  power: number;
  tilt: number;
  lie: Lie;
  wind: Wind;
  pin: { x: number; z: number };
  noWind?: boolean;
}

function ground(x: number, z: number): number {
  return Math.max(0, heightAt(x, z));
}

/** One airborne step. bank > 0 is hyzer (left side low, curves left). */
function stepAir(b: Body, windX: number, windZ: number, bank: number, dt: number): void {
  const { p, v } = b;
  const rx = v.x - windX;
  const rz = v.z - windZ;
  const rs = Math.hypot(rx, v.y, rz);
  const vh = Math.hypot(v.x, v.z);
  const airH2 = rx * rx + rz * rz;
  const lift = DISC.lift * b.spin * airH2;
  let ax = -DISC.drag * rs * rx;
  let ay = -DISC.drag * rs * v.y - PHYS.gravity + lift * Math.cos(bank);
  let az = -DISC.drag * rs * rz;
  // A gnome is not a wing: lift never pushes harder than 85% of gravity.
  ay = Math.min(ay, -PHYS.gravity * 0.15);
  if (vh > 0.01) {
    const rel = Math.min(1.2, Math.sqrt(airH2) / REF_SPEED);
    const turnFade = DISC.turn * Math.max(0, rel - 0.7) / 0.3 - DISC.fade * Math.max(0, 0.7 - rel) / 0.7;
    const side = turnFade - lift * Math.sin(bank); // + is to the right of travel
    ax += (-v.z / vh) * side;
    az += (v.x / vh) * side;
  }
  v.x += ax * dt;
  v.y += ay * dt;
  v.z += az * dt;
  p.x += v.x * dt;
  p.y += v.y * dt;
  p.z += v.z * dt;
  b.spin *= Math.exp(-SPIN_DECAY * dt);
}

/** Carry over flat ground, no wind, flat bank, full spin. */
function flatCarry(speed: number): number {
  const b: Body = {
    p: new THREE.Vector3(0, DISC.releaseHeight, 0),
    v: new THREE.Vector3(0, speed * Math.sin(DISC.launchDeg * DEG), speed * Math.cos(DISC.launchDeg * DEG)),
    spin: 1,
  };
  for (let t = 0; t < MAX_SECONDS; t += SIM_DT) {
    stepAir(b, 0, 0, 0, SIM_DT);
    if (b.p.y <= 0 && b.v.y < 0) return Math.hypot(b.p.x, b.p.z);
  }
  return Math.hypot(b.p.x, b.p.z);
}

let fullSpeed = -1;
/** Full-power launch speed, calibrated once. */
export function discLaunchSpeed(): number {
  if (fullSpeed > 0) return fullSpeed;
  let lo = 5;
  let hi = 150;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (flatCarry(mid) < DISC.carry) lo = mid;
    else hi = mid;
  }
  fullSpeed = (lo + hi) / 2;
  return fullSpeed;
}

/** Launch speed for a whirl power from a lie. Carry grows roughly in proportion to power. */
function speedFor(power: number, lie: Lie): number {
  return discLaunchSpeed() * Math.pow(Math.max(0.02, power), 0.62) * (DISC.liePower[lie] ?? 1);
}

export function bankOf(tilt: number): number {
  return tilt * DISC.tiltStepDeg * DEG;
}

interface RunOut {
  points: THREE.Vector3[];
  vels: THREE.Vector3[];
  spins: number[];
  events: FlightEvent[];
  end: THREE.Vector3;
  endLie: Lie;
  holed: boolean;
  dropPoint: THREE.Vector3 | null;
  firstGround: number;
  t: number;
}

/** Integrates from body b at time t0 until rest, water, or the basket. Samples start with b itself at t0. */
function run(b: Body, t0: number, bank: number, windX: number, windZ: number, pin: { x: number; z: number }, stopAtLanding = false): RunOut {
  const points: THREE.Vector3[] = [];
  const vels: THREE.Vector3[] = [];
  const spins: number[] = [];
  const events: FlightEvent[] = [];
  const record = (): void => {
    points.push(b.p.clone());
    vels.push(b.v.clone());
    spins.push(b.spin);
  };
  record();
  const pinGround = ground(pin.x, pin.z);
  let t = t0;
  let step = 0;
  let skidding = false;
  let firstGround = Infinity;
  let chainedOut = false;
  let holed = false;
  let endLie: Lie = 'fairway';
  let dropPoint: THREE.Vector3 | null = null;
  let lastDry = b.p.clone();
  let done = false;

  while (!done && t - t0 < MAX_SECONDS) {
    if (skidding) {
      const vh = Math.hypot(b.v.x, b.v.z);
      const lie = lieAt(b.p.x, b.p.z);
      const decel = DISC.skidDecel + LIES[lie].roll * 0.5;
      const nv = Math.max(0, vh - decel * SIM_DT);
      if (vh > 0) {
        b.v.x *= nv / vh;
        b.v.z *= nv / vh;
      }
      b.v.y = 0;
      b.p.x += b.v.x * SIM_DT;
      b.p.z += b.v.z * SIM_DT;
      b.p.y = ground(b.p.x, b.p.z);
      const skidSpeed = Math.hypot(b.v.x, b.v.z);
      const skidHit = collide(b.p, b.v, GNOME_RADIUS);
      if (skidHit === 'trunk' || skidHit === 'cart') {
        events.push({ t, kind: 'bounce', lie: lieAt(b.p.x, b.p.z), speed: skidSpeed });
        b.p.y = ground(b.p.x, b.p.z);
      }
      const nl = lieAt(b.p.x, b.p.z);
      if (nl === 'water') {
        events.push({ t, kind: 'water', lie: 'water', speed: nv });
        endLie = 'water';
        dropPoint = lastDry.clone();
        done = true;
      } else {
        lastDry.copy(b.p);
        if (nv < STOP_SPEED) {
          endLie = nl;
          events.push({ t, kind: 'rest', lie: nl, speed: 0 });
          done = true;
        }
      }
    } else {
      stepAir(b, windX, windZ, bank, SIM_DT);
      const flySpeed = b.v.length();
      const flyHit = collide(b.p, b.v, GNOME_RADIUS);
      if (flyHit === 'trunk' || flyHit === 'cart') events.push({ t, kind: 'bounce', lie: lieAt(b.p.x, b.p.z), speed: flySpeed });
      const g = ground(b.p.x, b.p.z);
      // The basket: in the chain zone, slow enough = caught; too fast = chain-out (bounces back off).
      const dh = Math.hypot(b.p.x - pin.x, b.p.z - pin.z);
      const hy = b.p.y - pinGround;
      const inZone = dh < DISC.basketRadius && hy > DISC.basketLow && hy < DISC.basketHigh;
      if (inZone && !chainedOut) {
        const speed = b.v.length();
        if (speed <= DISC.catchSpeed) {
          holed = true;
          b.p.set(pin.x, pinGround + 0.95, pin.z);
          b.v.set(0, 0, 0);
          events.push({ t, kind: 'cup', lie: 'green', speed });
          endLie = 'green';
          done = true;
        } else {
          chainedOut = true;
          b.v.x *= -0.22;
          b.v.z *= -0.22;
          b.v.y = Math.abs(b.v.y) * 0.3 + 1;
          b.spin *= 0.2;
          events.push({ t, kind: 'chains', lie: 'green', speed });
        }
      } else if (!inZone) {
        chainedOut = false;
      }
      if (!done && b.p.y <= g && b.v.y < 0) {
        const lie = lieAt(b.p.x, b.p.z);
        if (firstGround === Infinity) firstGround = t + SIM_DT;
        b.p.y = g;
        b.spin = 0;
        if (lie === 'water') {
          events.push({ t, kind: 'water', lie, speed: b.v.length() });
          endLie = 'water';
          dropPoint = lastDry.clone();
          done = true;
        } else if (stopAtLanding) {
          endLie = lie;
          done = true;
        } else if (lie === 'sand') {
          events.push({ t, kind: 'bounce', lie, speed: b.v.length() });
          endLie = lie;
          b.v.set(0, 0, 0);
          done = true;
        } else {
          const vy = -b.v.y;
          events.push({ t, kind: 'bounce', lie, speed: Math.hypot(vy, b.v.x, b.v.z) });
          if (vy > SKID_VY) {
            b.v.y = vy * DISC.bounce;
            b.v.x *= DISC.keep;
            b.v.z *= DISC.keep;
          } else {
            skidding = true;
            b.v.x *= DISC.keep;
            b.v.z *= DISC.keep;
            b.v.y = 0;
            events.push({ t, kind: 'roll', lie, speed: Math.hypot(b.v.x, b.v.z) });
          }
        }
      } else if (lieAt(b.p.x, b.p.z) !== 'water') {
        lastDry.set(b.p.x, ground(b.p.x, b.p.z), b.p.z);
      }
    }
    t += SIM_DT;
    step++;
    if (done || step % RECORD_EVERY === 0) record();
  }
  if (!done) endLie = lieAt(b.p.x, b.p.z);
  return { points, vels, spins, events, end: b.p.clone(), endLie, holed, dropPoint, firstGround, t };
}

function assemble(
  start: THREE.Vector3,
  bank: number,
  pre: { points: THREE.Vector3[]; vels: THREE.Vector3[]; spins: number[] },
  r: RunOut,
  priorFirstGround: number,
): DiscFlight {
  const points = pre.points.concat(r.points);
  const vels = pre.vels.concat(r.vels);
  const spins = pre.spins.concat(r.spins);
  const firstGround = Math.min(priorFirstGround, r.firstGround);
  let apex = 0;
  for (const p of points) apex = Math.max(apex, p.y - start.y);
  let carry = 0;
  if (firstGround < Infinity) {
    const i = Math.min(points.length - 1, Math.round(firstGround / SAMPLE_DT));
    carry = Math.hypot(points[i].x - start.x, points[i].z - start.z);
  }
  return {
    points,
    vels,
    spins,
    sampleDt: SAMPLE_DT,
    duration: (points.length - 1) * SAMPLE_DT,
    events: r.events,
    end: r.end,
    endLie: r.endLie,
    holed: r.holed,
    carry,
    apex,
    total: Math.hypot(r.end.x - start.x, r.end.z - start.z),
    dropPoint: r.dropPoint,
    airborneUntil: firstGround,
    bank,
    start: start.clone(),
  };
}

/** The whole throw from release to rest. */
export function simulateThrow(input: ThrowInput): DiscFlight {
  const speed = speedFor(input.power, input.lie);
  const la = DISC.launchDeg * DEG;
  const bank = bankOf(input.tilt);
  const from = input.from;
  const b: Body = {
    p: new THREE.Vector3(from.x, from.y + DISC.releaseHeight, from.z),
    v: new THREE.Vector3(Math.sin(input.yaw) * Math.cos(la) * speed, Math.sin(la) * speed, Math.cos(input.yaw) * Math.cos(la) * speed),
    spin: 1,
  };
  const w = input.noWind ? { x: 0, z: 0 } : windVelocity(input.wind);
  const r = run(b, 0, bank, w.x, w.z, input.pin);
  return assemble(from, bank, { points: [], vels: [], spins: [] }, r, Infinity);
}

/** True while a flail can still change the throw at time t (the gnome has not touched the ground yet). */
export function canFlail(f: DiscFlight, t: number): boolean {
  return t < f.airborneUntil - SAMPLE_DT && t < f.duration - SAMPLE_DT;
}

/**
 * A mid-air flail at time t: the gnome flaps, gaining upward speed and a little spin, losing a little forward speed.
 * Returns a new flight with the same samples up to t and a fresh simulation after.
 */
export function continueThrow(f: DiscFlight, t: number, wind: Wind, pin: { x: number; z: number }): DiscFlight {
  const i = Math.max(0, Math.min(f.points.length - 2, Math.floor(t / SAMPLE_DT) + 1));
  const b: Body = { p: f.points[i].clone(), v: f.vels[i].clone(), spin: f.spins[i] };
  b.v.x *= DISC.flailKeep;
  b.v.z *= DISC.flailKeep;
  b.v.y = Math.max(b.v.y, 0) + DISC.flailUp;
  b.spin = Math.min(1, b.spin + DISC.flailSpin);
  const w = windVelocity(wind);
  const r = run(b, i * SAMPLE_DT, f.bank, w.x, w.z, pin);
  // r.points[0] is the (bumped) sample i itself, so keep samples 0..i-1 from the old flight.
  return assemble(f.start, f.bank, { points: f.points.slice(0, i), vels: f.vels.slice(0, i), spins: f.spins.slice(0, i) }, r, Infinity);
}

/** Preview path for the aim: no wind, perfect release, stops at the first landing. */
export function previewThrow(from: THREE.Vector3, yaw: number, power: number, tilt: number, lie: Lie, pin: { x: number; z: number }): THREE.Vector3[] {
  const speed = speedFor(power, lie);
  const la = DISC.launchDeg * DEG;
  const b: Body = {
    p: new THREE.Vector3(from.x, from.y + DISC.releaseHeight, from.z),
    v: new THREE.Vector3(Math.sin(yaw) * Math.cos(la) * speed, Math.sin(la) * speed, Math.cos(yaw) * Math.cos(la) * speed),
    spin: 1,
  };
  return run(b, 0, bankOf(tilt), 0, 0, pin, true).points;
}
