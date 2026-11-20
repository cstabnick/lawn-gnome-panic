// VehicleController: one rigid body, four raycast wheels, a fixed-step execution order (see README).
// Frame: right-handed, y up, local +z forward, +x LEFT. Steer +1 = right. yaw `a` faces (sin a, 0, cos a).
import { counterSteer, escTorque, steerLimit, targetYawRate, tcsCap } from './assists';
import type { VehicleConfig } from './config';
import { createDrivetrain, type DrivetrainOut } from './drivetrain';
import { flatGround, type GroundProbe } from './ground';
import { createInputConditioner, type InputConditioner, type InputTelemetry, type VehicleInput } from './input';
import {
  add, addScaled, clamp, cross, deg2rad, dot, lerp, len, moveTowards, norm, qFromAxisAngle, qIdentity, qIntegrate, qMul,
  qRotate, qRotateInv, qSlerp, scale, smoothstep, sub, v3, type Quat, type Vec3,
} from './math';
import { combinedMu, peakLongMu, relaxSlip, type SlipState } from './tire';

export const GRAVITY = 9.81;
export const FIXED_DT = 1 / 60;
const MAX_CATCHUP = 0.1;
const AIR_DENSITY = 1.225;

export interface WheelTelemetry {
  grounded: boolean;
  /** Metres of spring compression, 0 .. travel. */
  compression: number;
  steerRad: number;
  /** Wheel spin, rad/s, forward positive. */
  omega: number;
  slipRatio: number;
  slipAngleRad: number;
  /** Tyre forces, N: along the wheel, across it (left positive), and normal load. */
  fx: number;
  fy: number;
  fz: number;
  /** Local mount position (x left, y up, z forward), for drawing wheels. */
  mount: Vec3;
}

export interface VehicleTelemetry {
  speed: number;
  forwardSpeed: number;
  /** m/s², positive when turning right. */
  latAccelRight: number;
  /** rad/s, positive when turning right. */
  yawRateRight: number;
  /** Body sideslip, rad, left-positive velocity sense. */
  sideslip: number;
  rearSlipAngle: number;
  /** Nose-up positive, and left-side-up positive, radians. */
  pitch: number;
  roll: number;
  normRpm: number;
  gear: number;
  groundedWheels: number;
  /** Front steer angle actually used (centre), rad, right positive. */
  steerRad: number;
  /** Fraction of the front-slip budget the assists spent (0 = none). */
  assistActivity: number;
  wheels: WheelTelemetry[];
}

interface Wheel {
  front: boolean;
  /** +1 left, -1 right. */
  side: number;
  mount: Vec3;
  steer: number;
  omega: number;
  slip: SlipState;
  grounded: boolean;
  compression: number;
  fz: number;
  fx: number;
  fy: number;
  staticLoad: number;
}

export interface BodyState { pos: Vec3; quat: Quat; vel: Vec3; angVel: Vec3 }

export interface ControllerOptions {
  ground?: GroundProbe;
  gravity?: number;
}

export class VehicleController {
  readonly cfg: VehicleConfig;
  readonly body: BodyState = { pos: v3(), quat: qIdentity(), vel: v3(), angVel: v3() };
  readonly telemetry: VehicleTelemetry;
  ground: GroundProbe;
  /** Conditioned input of the last tick. */
  input: VehicleInput = { steer: 0, throttle: 0, brake: 0, handbrake: 0, source: 'keyboard' };
  readonly conditioner: InputConditioner;

  private wheels: Wheel[] = [];
  private drivetrain;
  private drive: DrivetrainOut = { torque: 0, reflectedInertia: 0, normRpm: 0, gear: 1 };
  private gravity: number;
  private groundVel: Vec3 = v3();
  private reverseLatch = false;
  private accumulator = 0;
  private prev: { pos: Vec3; quat: Quat };
  private inertia: Vec3; // local x (pitch), y (yaw), z (roll)
  private restHeight = 0;
  private assistActivity = 0;

  constructor(cfg: VehicleConfig, opts: ControllerOptions = {}) {
    this.cfg = cfg;
    this.ground = opts.ground ?? flatGround();
    this.gravity = opts.gravity ?? GRAVITY;
    this.drivetrain = createDrivetrain(cfg.drivetrain);
    this.conditioner = createInputConditioner(cfg.mobileInput);
    const c = cfg.chassis;
    this.inertia = v3(0.85 * c.yawInertiaKgM2, c.yawInertiaKgM2, 0.22 * c.yawInertiaKgM2);
    this.buildWheels();
    this.prev = { pos: v3(), quat: qIdentity() };
    this.telemetry = this.makeTelemetry();
    this.place(v3(), 0);
  }

  /** CoM height above the road when sitting at rest. */
  get rideHeight(): number { return this.restHeight; }

  private buildWheels(): void {
    const c = this.cfg.chassis;
    const s = this.cfg.suspension;
    const L = c.frontAxleOffsetM - c.rearAxleOffsetM;
    const frontShare = -c.rearAxleOffsetM / L;
    const weight = c.massKg * this.gravity;
    // Static sag decides the mount height: spring length at rest + wheel radius = mount-to-road distance.
    const frontLoad = (weight * frontShare) / 2;
    const rearLoad = (weight * (1 - frontShare)) / 2;
    const restLen = (load: number): number => s.travelM - load / s.springRateNPerM;
    // One shared mount height keeps the chassis level: use the mean of the two axles' rest distances.
    const dRest = 0.5 * (restLen(frontLoad) + restLen(rearLoad)) + s.wheelRadiusM;
    const mountY = dRest - c.comHeightM;
    this.restHeight = c.comHeightM;
    const make = (front: boolean, side: number): Wheel => ({
      front, side,
      mount: v3(side * c.trackWidthM / 2, mountY, front ? c.frontAxleOffsetM : c.rearAxleOffsetM),
      steer: 0, omega: 0, slip: { kappa: 0, sy: 0 }, grounded: false, compression: 0, fz: 0, fx: 0, fy: 0,
      staticLoad: front ? frontLoad : rearLoad,
    });
    // Order: FL, FR, RL, RR.
    this.wheels = [make(true, 1), make(true, -1), make(false, 1), make(false, -1)];
  }

  /** Put the car at rest on the ground under (x, z) facing `yaw` (and, optionally, already moving forward). */
  place(position: Vec3, yaw: number, forwardSpeed = 0): void {
    const q = qFromAxisAngle(v3(0, 1, 0), yaw);
    // Find the road under the spot and sit at the rest height above it, tilted onto it.
    const hit = this.ground.cast(v3(position.x, position.y + 50, position.z), v3(0, -1, 0), 100);
    const roadY = hit ? hit.point.y : position.y;
    const up = hit ? hit.normal : v3(0, 1, 0);
    let quat = q;
    if (hit) {
      // Rotate the upright pose so its up matches the road normal.
      const axis = cross(v3(0, 1, 0), up);
      const sin = len(axis);
      if (sin > 1e-6) quat = qMul(qFromAxisAngle(axis, Math.asin(Math.min(1, sin))), q);
    }
    this.body.quat = quat;
    this.body.pos = addScaled(v3(position.x, roadY, position.z), up, this.restHeight);
    const fwd = qRotate(quat, v3(0, 0, 1));
    this.body.vel = scale(fwd, forwardSpeed);
    this.body.angVel = v3();
    for (const w of this.wheels) {
      w.omega = forwardSpeed / this.cfg.suspension.wheelRadiusM;
      w.slip = { kappa: 0, sy: 0 };
      w.steer = 0;
      w.fx = 0; w.fy = 0; w.fz = w.staticLoad; w.grounded = true;
      w.compression = this.cfg.suspension.travelM * 0.4;
    }
    this.groundVel = v3();
    this.reverseLatch = false;
    this.drivetrain.reset();
    this.conditioner.reset();
    this.prev = { pos: { ...this.body.pos }, quat: { ...this.body.quat } };
    this.updateTelemetry(0);
  }

  /** Feed render-frame time; runs whole fixed ticks and returns how many. Use `renderPose` to draw between ticks. */
  update(frameDt: number, raw: VehicleInput): number {
    this.accumulator = Math.min(this.accumulator + frameDt, MAX_CATCHUP);
    let steps = 0;
    while (this.accumulator >= FIXED_DT) {
      this.prev = { pos: { ...this.body.pos }, quat: { ...this.body.quat } };
      this.step(FIXED_DT, raw);
      this.accumulator -= FIXED_DT;
      steps++;
    }
    return steps;
  }

  /** Pose interpolated between the last two ticks, for rendering at any frame rate. */
  renderPose(): { pos: Vec3; quat: Quat } {
    const a = clamp(this.accumulator / FIXED_DT, 0, 1);
    return {
      pos: v3(lerp(this.prev.pos.x, this.body.pos.x, a), lerp(this.prev.pos.y, this.body.pos.y, a), lerp(this.prev.pos.z, this.body.pos.z, a)),
      quat: qSlerp(this.prev.quat, this.body.quat, a),
    };
  }

  /** One fixed physics tick. The order matters; see the README. */
  step(dt: number, raw: VehicleInput): void {
    const cfg = this.cfg;
    const ch = cfg.chassis;
    const sus = cfg.suspension;
    const tire = cfg.tires;
    const dtn = cfg.drivetrain;
    const asst = cfg.steeringAndAssists;
    const m = ch.massKg;
    const R = sus.wheelRadiusM;

    // 1. Snapshot.
    const b = this.body;
    const q = b.quat;
    const up = qRotate(q, v3(0, 1, 0));
    const fwd = qRotate(q, v3(0, 0, 1));
    const left = qRotate(q, v3(1, 0, 0));
    const vrel = sub(b.vel, this.groundVel);

    // 3. Local kinematics (the conditioner wants them first, so it runs after this).
    const vlong = dot(vrel, fwd);
    const vlat = dot(vrel, left);
    const yawUp = dot(b.angVel, up);
    const speed = len(vrel);
    const vlatRear = vlat + yawUp * ch.rearAxleOffsetM;
    const rearSlip = Math.atan2(vlatRear, Math.max(Math.abs(vlong), 0.5));
    const beta = Math.atan2(vlat, Math.max(Math.abs(vlong), 0.5));
    const latAccelRight = -dot(this.lastAccel, left);

    // 2. Condition the input.
    const tel: InputTelemetry = { speed, latAccelRight, yawRateRight: -yawUp };
    const inp = this.conditioner.step(raw, tel, dt);
    this.input = inp;

    // Pedals: brake while moving against the pedal, reverse from rest on a fresh brake press, light hold when parked.
    let driveCmd = 0;
    let brakeCmd = 0;
    if (inp.throttle > 0.01) {
      if (vlong > -0.5) driveCmd = inp.throttle; else brakeCmd = inp.throttle;
      this.reverseLatch = false;
    }
    if (inp.brake > 0.01) {
      if (vlong > 0.5 || inp.throttle > 0.01) { brakeCmd = Math.max(brakeCmd, inp.brake); this.reverseLatch = true; }
      else if (this.reverseLatch) brakeCmd = Math.max(brakeCmd, inp.brake);
      else driveCmd = -inp.brake;
    } else if (inp.throttle <= 0.01) this.reverseLatch = false;
    const parked = driveCmd === 0 && brakeCmd === 0 && Math.abs(vlong) < 0.6;
    if (parked) brakeCmd = Math.max(brakeCmd, 0.25);

    // 4. Assists on the steering command.
    const limit = steerLimit(cfg, speed, Math.abs(rearSlip) / deg2rad(tire.latPacejkaRear.peakAngleDeg));
    const reach = lerp(1, limit, asst.speedCurvatureLimitStrength);
    let steer = clamp(inp.steer, -reach, reach);
    const cs = vlong > 0.5 ? counterSteer(cfg, beta, speed) : 0;
    steer = clamp(steer + cs, -1, 1);
    this.assistActivity = Math.abs(steer - inp.steer);
    const delta = steer * deg2rad(asst.maxSteerAngleDeg);

    // 5. Ackermann geometry, singularity-free: right wheel L t/(L - T/2 t), left wheel L t/(L + T/2 t), t = tan(delta).
    const L = ch.wheelbaseM;
    const T = ch.trackWidthM;
    const t = Math.tan(delta);
    const steerRight = Math.atan((L * t) / (L - (T / 2) * t));
    const steerLeft = Math.atan((L * t) / (L + (T / 2) * t));
    for (const w of this.wheels) w.steer = w.front ? (w.side > 0 ? steerLeft : steerRight) : 0;

    // 6. Ground probes. Rays start inside the hull and point along the body's own down, so ramps and banks work.
    const down = scale(up, -1);
    const reachLen = sus.travelM + R;
    const hits: ({ n: Vec3; p: Vec3; gv: Vec3; tilt: number; d: number } | null)[] = [];
    const mountsWorld: Vec3[] = [];
    let gvSum = v3();
    let gCount = 0;
    for (const w of this.wheels) {
      const origin = add(b.pos, qRotate(q, w.mount));
      mountsWorld.push(origin);
      const h = this.ground.cast(origin, down, reachLen);
      if (!h) { w.grounded = false; w.compression = 0; hits.push(null); continue; }
      const nDotUp = Math.max(dot(h.normal, up), 0.05);
      const d = h.distance;
      const springLen = clamp(d - R, 0, sus.travelM);
      w.grounded = true;
      w.compression = sus.travelM - springLen;
      const gv = h.velocity ?? v3();
      gvSum = add(gvSum, gv);
      gCount++;
      hits.push({ n: h.normal, p: h.point, gv, tilt: Math.acos(Math.min(1, nDotUp)), d });
    }

    // 7. Suspension: asymmetric spring-damper with a progressive bump stop, then anti-roll bars, then tyre load.
    const force = v3();
    const torque = v3();
    const applyAt = (f: Vec3, p: Vec3): void => {
      force.x += f.x; force.y += f.y; force.z += f.z;
      const r = sub(p, b.pos);
      const tq = cross(r, f);
      torque.x += tq.x; torque.y += tq.y; torque.z += tq.z;
    };
    const springF: number[] = [0, 0, 0, 0];
    this.wheels.forEach((w, i) => {
      const h = hits[i];
      if (!h) return;
      const r = sub(mountsWorld[i], b.pos);
      const vm = sub(add(b.vel, cross(b.angVel, r)), h.gv);
      const rateStrut = -dot(vm, up);
      const rateNormal = -dot(vm, h.n) / Math.max(dot(up, h.n), 0.05);
      const blend = smoothstep(deg2rad(3), deg2rad(10), h.tilt);
      const rate = lerp(rateStrut, rateNormal, blend);
      const x = w.compression;
      let fs = sus.springRateNPerM * x;
      const stop = 0.85 * sus.travelM;
      if (x > stop) fs += (sus.springRateNPerM * 8 * (x - stop) ** 2) / sus.travelM;
      const c = rate > 0 ? sus.bumpDamperNsPerM : sus.reboundDamperNsPerM;
      springF[i] = Math.max(0, fs + c * rate);
    });
    for (const [a, c] of [[0, 1], [2, 3]] as const) {
      if (hits[a] && hits[c]) {
        const arb = sus.antiRollBarNPerM * (this.wheels[a].compression - this.wheels[c].compression);
        springF[a] = Math.max(0, springF[a] + arb);
        springF[c] = Math.max(0, springF[c] - arb);
      }
    }
    this.wheels.forEach((w, i) => {
      const h = hits[i];
      if (!h) { w.fz = 0; return; }
      // wheelLoadRatio blends the static corner load with the live suspension load before the tyre sees it.
      w.fz = lerp(w.staticLoad, springF[i], sus.wheelLoadRatio);
      applyAt(scale(h.n, springF[i]), h.p);
    });

    // 8. Drivetrain from last tick's driven wheel speeds.
    const drivenIdx = dtn.driveBiasFront >= 1 ? [0, 1] : dtn.driveBiasFront <= 0 ? [2, 3] : [0, 1, 2, 3];
    const avgOmega = drivenIdx.reduce((s, i) => s + this.wheels[i].omega, 0) / drivenIdx.length;
    const drivenGrounded = drivenIdx.some((i) => this.wheels[i].grounded);
    this.drive = this.drivetrain.step(dt, driveCmd, avgOmega, drivenGrounded);

    // 9. Axle split, limited-slip differential and friction-circle traction control.
    const wheelTorque: number[] = [0, 0, 0, 0];
    const axleTorque = [this.drive.torque * dtn.driveBiasFront, this.drive.torque * (1 - dtn.driveBiasFront)];
    const muPeak = peakLongMu(tire.longPacejka);
    [[0, 1], [2, 3]].forEach(([l, r], axle) => {
      const tq = axleTorque[axle];
      if (tq === 0) return;
      const lsd = axle === 0 ? dtn.limitedSlipFront : dtn.limitedSlipRear;
      const half = tq / 2;
      const cap = (i: number): number => {
        const w = this.wheels[i];
        return w.grounded ? muPeak * w.fz * R * 1.05 : 0;
      };
      // Open diff: both wheels get what the weaker one can hold. Locked: an even split. LSD blends the two.
      const openT = Math.sign(half) * Math.min(Math.abs(half), cap(l), cap(r));
      const t0 = lerp(openT, half, lsd);
      wheelTorque[l] = t0;
      wheelTorque[r] = t0;
    });
    for (const i of drivenIdx) {
      const w = this.wheels[i];
      if (!w.grounded || wheelTorque[i] === 0) continue;
      const cap = tcsCap(muPeak, w.fz, w.fy, R);
      const limited = Math.sign(wheelTorque[i]) * Math.min(Math.abs(wheelTorque[i]), cap);
      wheelTorque[i] = lerp(wheelTorque[i], limited, asst.tractionControlStrength);
    }

    // 10. Tyres, per wheel, then wheel spin. Brakes are applied last so they stop a wheel at exactly zero.
    const wheelI = 0.5 * sus.wheelMassKg * R * R;
    const reflected = this.drive.reflectedInertia / drivenIdx.length;
    const brakeTotal = dtn.maxBrakeTorqueTotalNm * brakeCmd;
    this.wheels.forEach((w, i) => {
      const h = hits[i];
      const I = wheelI + (drivenIdx.includes(i) ? reflected : 0);
      let brake = (brakeTotal * (w.front ? dtn.brakeBiasFront : 1 - dtn.brakeBiasFront)) / 2;
      let fx = 0;
      let fy = 0;
      if (h && w.fz > 0) {
        // Wheel axes: heading is the chassis forward turned by the steer angle, flattened onto the road.
        const heading = qRotate(qFromAxisAngle(up, -w.steer), fwd);
        const f = norm(sub(heading, scale(h.n, dot(heading, h.n))));
        const l = cross(h.n, f);
        const r = sub(h.p, b.pos);
        const vc = sub(add(b.vel, cross(b.angVel, r)), h.gv);
        const vl = dot(vc, f);
        const vt = dot(vc, l);
        relaxSlip(w.slip, vl, vt, w.omega * R, tire.relaxationLongM, tire.relaxationLatM, dt);
        const lat = w.front ? tire.latPacejkaFront : tire.latPacejkaRear;
        const { mux, muy } = combinedMu(w.slip.kappa, Math.atan(w.slip.sy), tire.longPacejka, lat);
        fx = mux * w.fz;
        fy = -muy * w.fz;
        // ABS: never ask the brake for more than the tyre can give (the handbrake is exempt, so it can still slide the rear).
        if (asst.absEnabled) {
          brake = Math.min(brake, muPeak * w.fz * R * 0.93);
          // Release when the wheel slips past the tyre peak, so it never falls onto the locked-wheel branch of the curve.
          brake *= 1 - 0.9 * smoothstep(1.0, 1.4, Math.abs(w.slip.kappa) / tire.longPacejka.peakSlip);
        }
        // Low-speed sidewall damping settles the standstill wobble; capped so one tick cannot overshoot.
        const lowSpeed = 1 - clamp(Math.hypot(vl, vt) / 1.5, 0, 1);
        if (lowSpeed > 0) {
          const cornerM = m / 4;
          // Force = -c v with c = 45 corner-masses per second, never more than the momentum the wheel has left (no overshoot in a tick).
          const damp = (v: number): number => {
            const f = -cornerM * 45 * v * lowSpeed;
            const maxF = (0.9 * cornerM * Math.abs(v)) / dt;
            return clamp(f, -maxF, maxF);
          };
          if (driveCmd === 0) fx += damp(vl);
          fy += damp(vt);
        }
        const rolling = -tire.rollingResistanceCrr * w.fz * Math.tanh(vl / 0.5);
        const total = add(scale(f, fx + rolling), scale(l, fy));
        // Tangential forces act between the road (blend 0) and the CoM height (blend 1).
        const hAbove = dot(sub(b.pos, h.p), up);
        applyAt(total, addScaled(h.p, up, ch.forceAppHeightBlend * hAbove));
        w.fx = fx;
        w.fy = fy;
        // Wheel spin: drive, then tyre reaction (never crossing road speed in one tick), then brakes last.
        const free = w.omega + (dt * wheelTorque[i]) / I;
        let next = free - (dt * R * fx) / I;
        const target = vl / R;
        if ((free - target) * (next - target) < 0) next = target;
        w.omega = next;
      } else {
        w.fx = 0;
        w.fy = 0;
        w.omega += (dt * wheelTorque[i]) / I;
      }
      // Brakes: foot brake split by bias, handbrake on the rear pair.
      const hb = !w.front ? (dtn.handbrakeTorqueRearNm * inp.handbrake) / 2 : 0;
      w.omega = moveTowards(w.omega, 0, ((brake + hb) * dt) / I);
    });

    // 11. Aero, ESC, safeguards.
    const vAir = b.vel;
    const vAirLen = len(vAir);
    if (vAirLen > 0.01) {
      const drag = scale(vAir, -0.5 * AIR_DENSITY * ch.aeroCdA * vAirLen);
      applyAt(drag, b.pos);
      const downF = 0.5 * AIR_DENSITY * ch.aeroClA * dot(vAir, vAir);
      applyAt(scale(up, -downF), b.pos);
    }
    const steerForTarget = delta;
    const target = targetYawRate(cfg, steerForTarget, vlong);
    const esc = vlong > 0.5 ? escTorque(cfg, -yawUp, target, vlong) : 0;
    if (esc !== 0) { torque.x += up.x * esc; torque.y += up.y * esc; torque.z += up.z * esc; }

    // Anti-flip cone and airborne self-levelling: a restoring torque about the axis that turns the car's up toward world up.
    const tilt = Math.acos(clamp(up.y, -1, 1));
    const axis = cross(up, v3(0, 1, 0));
    const grounded = hits.some((h) => h !== null);
    let level = 0;
    if (!grounded) level = asst.airborneStabilization * 0.5 * m;
    const maxTilt = deg2rad(ch.maxPitchRollDeg);
    if (ch.maxPitchRollDeg < 180 && tilt > maxTilt) level = Math.max(level, m * 2 * (tilt - maxTilt) / (Math.PI - maxTilt) + m * 0.3);
    if (level > 0) {
      const a = norm(axis);
      const tq = level * Math.min(tilt, 1);
      torque.x += a.x * tq * 20; torque.y += a.y * tq * 20; torque.z += a.z * tq * 20;
      // Damp spin while levelling so it settles instead of ringing.
      const k = level * 8;
      torque.x -= b.angVel.x * k; torque.y -= b.angVel.y * k; torque.z -= b.angVel.z * k;
    }

    // Integrate the body (semi-implicit Euler): gravity, linear, then angular with gyroscopic term.
    const accel = v3(force.x / m, force.y / m - this.gravity, force.z / m);
    this.lastAccel = v3(accel.x, accel.y + this.gravity, accel.z);
    b.vel = addScaled(b.vel, accel, dt);
    b.pos = addScaled(b.pos, b.vel, dt);
    const wl = qRotateInv(q, b.angVel);
    const tl = qRotateInv(q, torque);
    const I = this.inertia;
    const Iw = v3(I.x * wl.x, I.y * wl.y, I.z * wl.z);
    const gyro = cross(wl, Iw);
    const dwl = v3((tl.x - gyro.x) / I.x, (tl.y - gyro.y) / I.y, (tl.z - gyro.z) / I.z);
    b.angVel = addScaled(b.angVel, qRotate(q, dwl), dt);
    b.quat = qIntegrate(q, b.angVel, dt);

    this.groundVel = gCount > 0 ? scale(gvSum, 1 / gCount) : v3();
    this.updateTelemetry(delta);
  }

  private lastAccel: Vec3 = v3();

  private makeTelemetry(): VehicleTelemetry {
    return {
      speed: 0, forwardSpeed: 0, latAccelRight: 0, yawRateRight: 0, sideslip: 0, rearSlipAngle: 0, pitch: 0, roll: 0,
      normRpm: 0, gear: 1, groundedWheels: 0, steerRad: 0, assistActivity: 0,
      wheels: this.wheels.map((w) => ({
        grounded: false, compression: 0, steerRad: 0, omega: 0, slipRatio: 0, slipAngleRad: 0, fx: 0, fy: 0, fz: 0, mount: w.mount,
      })),
    };
  }

  private updateTelemetry(delta: number): void {
    const b = this.body;
    const tl = this.telemetry;
    const up = qRotate(b.quat, v3(0, 1, 0));
    const fwd = qRotate(b.quat, v3(0, 0, 1));
    const left = qRotate(b.quat, v3(1, 0, 0));
    const vrel = sub(b.vel, this.groundVel);
    const vlong = dot(vrel, fwd);
    const vlat = dot(vrel, left);
    const yawUp = dot(b.angVel, up);
    tl.speed = len(vrel);
    tl.forwardSpeed = vlong;
    tl.latAccelRight = -dot(this.lastAccel, left);
    tl.yawRateRight = -yawUp;
    tl.sideslip = Math.atan2(vlat, Math.max(Math.abs(vlong), 0.5));
    tl.rearSlipAngle = Math.atan2(vlat + yawUp * this.cfg.chassis.rearAxleOffsetM, Math.max(Math.abs(vlong), 0.5));
    tl.pitch = Math.asin(clamp(fwd.y, -1, 1));
    tl.roll = Math.asin(clamp(left.y, -1, 1));
    tl.normRpm = this.drive.normRpm;
    tl.gear = this.drive.gear;
    tl.groundedWheels = this.wheels.filter((w) => w.grounded).length;
    tl.steerRad = delta;
    tl.assistActivity = this.assistActivity;
    this.wheels.forEach((w, i) => {
      const t = tl.wheels[i];
      t.grounded = w.grounded;
      t.compression = w.compression;
      t.steerRad = w.steer;
      t.omega = w.omega;
      t.slipRatio = w.slip.kappa;
      t.slipAngleRad = Math.atan(w.slip.sy);
      t.fx = w.fx;
      t.fy = w.fy;
      t.fz = w.fz;
    });
  }
}
