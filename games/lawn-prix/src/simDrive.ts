// Experimental handling ('sim' physics): every kart driven by @lawn/vehicle (raycast chassis, Pacejka tyres, assists).
// Adapted from Gnome Theft Auto's ?drive=sim. The race still runs on plain KartState: the controller lives in a side
// table keyed by kart, and after each step its pose and velocity are written back into the kart, so bumps, hazards,
// items, ghosts, the view and the party slice see the same fields as before.
//
// Tuning: HANDLING (per vehicle: a preset plus overrides) and SIM / DRIFT in config.ts. Time trials stay arcade.
import { PRESETS, VehicleController, qRotate, qYaw, retuneDirectDrive, scaleConfig, v3, withOverrides, type DeepPartial, type VehicleConfig } from '@lawn/vehicle';
import { DRIFT, DRIVE, SIM, SPIN, VEHICLES, type KartInput, type KartState, type VehicleId } from './config';
import { isOnTrack, projectOnTrack, type Track } from './track';

/** The chassis presets are sized for a reference car this long (m). A kart's collision radius scales the family from it. */
const REFERENCE_RADIUS = 2.3;

/** Steer lock as a multiple of the arcade-equivalent lock (see karConfig). */
const LOCK_GAIN = 1.5;

/**
 * Per-vehicle handling: a preset plus overrides. Both start from `casual`, the steadiest preset at kart size: `hybrid` and
 * `simcade` are tuned for a 1450 kg car and spin out once shrunk (sideslip goes past 0.9 at steady steer).
 * Cart: heavy and planted, slides when you hold drift. Bike: light, quick off the line, rear lets go easier.
 */
export const HANDLING: Record<VehicleId, { base: keyof typeof PRESETS; over: DeepPartial<VehicleConfig> }> = {
  cart: {
    base: 'casual',
    over: {
      drivetrain: { handbrakeTorqueRearNm: 1000, limitedSlipRear: 0.6 },
      tires: { latPacejkaFront: { D: 1.6 }, latPacejkaRear: { D: 1.6 } },
    },
  },
  bike: {
    base: 'casual',
    over: {
      tires: { longPacejka: { D: 1.4 }, latPacejkaFront: { D: 1.6 }, latPacejkaRear: { D: 1.44 } },
      drivetrain: { handbrakeTorqueRearNm: 1000, limitedSlipRear: 0.8 },
    },
  },
};

/**
 * Makes a scaled-down chassis behave like a kart, not a shrunk car. Three things do not scale on their own:
 * - Static sag: the spring rate falls with s³ like the mass, so a small kart sits on its bump stops (the bike sank through
 *   the road). Each corner's rate comes from a target sag (30% of travel); dampers scale by the same factor (same damping ratio).
 * - Tyre relaxation lengths are absolute metres. On a 9 cm wheel they make force build for ages at low speed (the bike's launch).
 */
export function fitKart(cfg: VehicleConfig, s: number, sagFraction = 0.3): VehicleConfig {
  const c = structuredClone(cfg);
  const sus = c.suspension;
  const sag = sagFraction * sus.travelM;
  const newRate = (c.chassis.massKg * 9.81) / (4 * sag);
  const f = Math.sqrt(newRate / sus.springRateNPerM);
  sus.springRateNPerM = newRate;
  sus.bumpDamperNsPerM *= f;
  sus.reboundDamperNsPerM *= f;
  c.tires.relaxationLongM *= s;
  c.tires.relaxationLatM *= s;
  return c;
}

/** The vehicle config for one kind of kart: the handling preset scaled to the kart's size, then set to its top speed and launch. */
export function karConfig(vehicle: VehicleId): VehicleConfig {
  const spec = VEHICLES[vehicle];
  const h = HANDLING[vehicle];
  const s = spec.radius / REFERENCE_RADIUS;
  let cfg = fitKart(scaleConfig(withOverrides(PRESETS[h.base], h.over), s), s);
  cfg = retuneDirectDrive(cfg, spec.maxSpeed, spec.accel);
  // Steer lock from the wheelbase: at top speed the kart yaws at its arcade turn rate (config.ts turnRate). A touch more
  // lock than that (LOCK_GAIN) stops the kart understeering wide at top speed.
  const lockDeg = LOCK_GAIN * (Math.atan((cfg.chassis.wheelbaseM * spec.turnRate) / spec.maxSpeed) * 180) / Math.PI;
  cfg = withOverrides(cfg, { steeringAndAssists: { maxSteerAngleDeg: Math.min(32, Math.max(8, lockDeg)) } });
  // Karts have no gearbox, and the throttle is held by the player or the CPU, never by the car's own automatic.
  return withOverrides(cfg, { drivetrain: { mode: 'DirectDrive' }, mobileInput: { autoAccelerate: false } });
}

interface SimBody {
  ctrl: VehicleController;
  /** Ground position and velocity as last written into the kart: a difference means something outside moved it. */
  gx: number; gz: number; vx: number; vz: number;
}

/** The side table. A kart with no entry (new race, or a copied state) gets a controller placed from its KartState. */
const bodies = new WeakMap<KartState, SimBody>();

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Wraps an angle into -PI..PI. */
function wrapAngle(a: number): number {
  let r = (a + Math.PI) % (2 * Math.PI);
  if (r < 0) r += 2 * Math.PI;
  return r - Math.PI;
}

/** Ground-level (road under the centre of mass) position of the chassis. */
function groundOf(ctrl: VehicleController): { x: number; z: number } {
  const b = ctrl.body;
  const up = qRotate(b.quat, v3(0, 1, 0));
  return { x: b.pos.x - up.x * ctrl.rideHeight, z: b.pos.z - up.z * ctrl.rideHeight };
}

function bodyFor(k: KartState): SimBody {
  const found = bodies.get(k);
  if (found) return found;
  const ctrl = new VehicleController(karConfig(k.vehicle));
  ctrl.place(v3(k.x, 0, k.z), k.h);
  ctrl.body.vel.x = k.vx;
  ctrl.body.vel.z = k.vz;
  const made: SimBody = { ctrl, gx: k.x, gz: k.z, vx: k.vx, vz: k.vz };
  bodies.set(k, made);
  return made;
}

/** Carry anything the race did to the kart since last step (a bump, a hazard shove, a slow-down) into the chassis. */
function syncFromRace(k: KartState, s: SimBody): void {
  const b = s.ctrl.body;
  const dx = k.x - s.gx;
  const dz = k.z - s.gz;
  if (Math.abs(dx) + Math.abs(dz) > 1e-6) {
    b.pos.x += dx;
    b.pos.z += dz;
  }
  if (k.vx !== s.vx || k.vz !== s.vz) {
    b.vel.x = k.vx;
    b.vel.z = k.vz;
  }
}

/** One fixed step of one kart under @lawn/vehicle. Progress and laps are the caller's job (sim.ts advanceKart). */
export function stepSimKart(k: KartState, inp: KartInput, dt: number, track: Track): void {
  const s = bodyFor(k);
  syncFromRace(k, s);
  const prevH = k.h;
  const ctrl = s.ctrl;
  const b = ctrl.body;
  const spec = VEHICLES[k.vehicle];

  k.off = !isOnTrack(track, projectOnTrack(track, k.x, k.z));
  const spinning = k.spin > 0;
  if (spinning) k.spin = Math.max(0, k.spin - dt);

  // 1. The driver's controls, through the vehicle's input conditioning. Spun out: no steering, throttle or handbrake.
  const steer = spinning ? 0 : clamp(inp.steer, -1, 1);
  const th = spinning ? 0 : clamp(inp.throttle, -1, 1);
  const handbrake = !spinning && inp.drift;
  ctrl.update(dt, {
    steer,
    throttle: Math.max(0, th),
    brake: Math.max(0, -th),
    handbrake: handbrake ? 1 : 0,
    source: steer === 0 || Math.abs(steer) === 1 ? 'keyboard' : 'stick',
  });

  // 2. Sideways speed and the heading (forward is (sin h, cos h), left is (cos h, -sin h)).
  const yaw = qYaw(b.quat);
  const fx = Math.sin(yaw), fz = Math.cos(yaw);
  const lx = Math.cos(yaw), lz = -Math.sin(yaw);
  const vL = b.vel.x * lx + b.vel.z * lz;
  const speed = Math.hypot(b.vel.x, b.vel.z);

  // 3. Spin-out bleeds speed; long grass drags; a boost pushes forward; the arcade top speed (skill, grass, boost) caps the rest.
  if (spinning) {
    const damp = Math.exp(-SPIN.drag * dt);
    b.vel.x *= damp;
    b.vel.z *= damp;
  }
  // Long grass drags only when coasting, as in the arcade model (under throttle the top-speed cap below does the work).
  if (k.off && th === 0) {
    const damp = Math.exp(-DRIVE.offTrackDrag * dt);
    b.vel.x *= damp;
    b.vel.z *= damp;
  }
  const boosting = k.boost > 0 && !spinning;
  if (boosting) {
    b.vel.x += fx * DRIFT.boostAccel * dt;
    b.vel.z += fz * DRIFT.boostAccel * dt;
  }
  const cap = spec.maxSpeed * k.skill * (k.off ? DRIVE.offTrackSpeedMul : 1) * (boosting ? DRIFT.boostSpeedMul : 1);
  if (speed > cap) {
    const f = 1 + (cap / speed - 1) * Math.min(1, 4 * dt);
    b.vel.x *= f;
    b.vel.z *= f;
  }

  // 4. Drift: handbrake while moving and sliding builds charge; letting go with enough charge gives a boost (longer for more charge).
  if (spinning) {
    k.drift = 0;
    k.charge = 0;
  } else if (handbrake && speed > DRIFT.minSpeed && Math.abs(vL) > SIM.slideMin) {
    k.drift = vL > 0 ? -1 : 1;
    k.charge += dt;
  } else if (k.drift !== 0) {
    if (k.charge >= SIM.chargeForBigBoost) k.boost = SIM.bigBoostS;
    else if (k.charge >= DRIFT.chargeForBoost) k.boost = DRIFT.boostS;
    k.drift = 0;
    k.charge = 0;
  }

  // 5. Hedges: the chassis can't leave the course bounds (ground position, as in the arcade model).
  const g0 = groundOf(ctrl);
  let gx = g0.x;
  let gz = g0.z;
  const r = spec.radius;
  const bd = track.course.bounds;
  if (gx < bd.minX + r) { b.pos.x += bd.minX + r - gx; gx = bd.minX + r; b.vel.x = 0; }
  else if (gx > bd.maxX - r) { b.pos.x += bd.maxX - r - gx; gx = bd.maxX - r; b.vel.x = 0; }
  if (gz < bd.minZ + r) { b.pos.z += bd.minZ + r - gz; gz = bd.minZ + r; b.vel.z = 0; }
  else if (gz > bd.maxZ - r) { b.pos.z += bd.maxZ - r - gz; gz = bd.maxZ - r; b.vel.z = 0; }

  // 6. Write back. Hop and item state are arcade-only: the sim has no hop.
  k.x = gx;
  k.z = gz;
  // Heading stays continuous (unwrapped, like the arcade kart), so nothing that tracks it sees a jump at ±PI.
  k.h = prevH + wrapAngle(qYaw(b.quat) - prevH);
  k.vx = b.vel.x;
  k.vz = b.vel.z;
  k.st = steer;
  k.hop = 0;
  k.boost = Math.max(0, k.boost - dt);
  s.gx = gx;
  s.gz = gz;
  s.vx = b.vel.x;
  s.vz = b.vel.z;
}
