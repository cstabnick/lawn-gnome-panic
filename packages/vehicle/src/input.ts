// Layer 1: device-adaptive input conditioning. Every device writes one VehicleInput; this turns raw device values into
// something the physics can take. Analog sources get deadzone + gamma, binary ones (keys, arrow buttons) get asymmetric,
// speed- and lateral-G-aware smoothing so a held key never snaps the rack to full lock.
import { clamp, lerp, moveTowards, sign } from './math';
import type { MobileInputConfig } from './config';

export type InputSource = 'keyboard' | 'touch-buttons' | 'stick' | 'tilt' | 'wheel' | 'gamepad';

/** Steer -1 (left) .. +1 (right). Throttle, brake, handbrake 0..1. */
export interface VehicleInput {
  steer: number;
  throttle: number;
  brake: number;
  handbrake: number;
  source: InputSource;
}

/** What the conditioner needs to know about the car (all from the previous physics tick). */
export interface InputTelemetry {
  /** Speed over the ground, m/s, never negative. */
  speed: number;
  /** Lateral acceleration, m/s², positive when the car is turning right (the same sense as steer). */
  latAccelRight: number;
  /** Yaw rate, rad/s, positive when turning right. */
  yawRateRight: number;
}

const G = 9.81;
const BINARY: InputSource[] = ['keyboard', 'touch-buttons'];

export interface InputConditioner {
  step(raw: VehicleInput, tel: InputTelemetry, dt: number): VehicleInput;
  reset(): void;
  readonly steerFiltered: number;
}

/** Deadzone, re-normalise the active range to 0..1, then gamma shaping. Sign preserved. */
export function shapeAnalog(x: number, deadzone: number, gamma: number): number {
  const a = Math.abs(x);
  if (a <= deadzone) return 0;
  return sign(x) * Math.pow(clamp((a - deadzone) / (1 - deadzone), 0, 1), gamma);
}

export function createInputConditioner(cfg: MobileInputConfig, opts: { autoAccelerate?: boolean } = {}): InputConditioner {
  let steerFilt = 0;
  const auto = opts.autoAccelerate ?? cfg.autoAccelerate;
  return {
    get steerFiltered() { return steerFilt; },
    reset() { steerFilt = 0; },
    step(raw, tel, dt) {
      let target: number;
      if (BINARY.includes(raw.source)) {
        target = clamp(raw.steer, -1, 1);
        // Turn-in: brisk, but slower at speed and while the tyres are already loaded sideways.
        const speedFactor = lerp(1, 0.5, clamp((tel.speed - 10) / 25, 0, 1));
        const latFactor = 1 - 0.7 * clamp(Math.abs(tel.latAccelRight) / G, 0, 1);
        const out = cfg.binarySteerOutRate * speedFactor * latFactor;
        // Return to centre: faster, but parked wheels mostly hold their lock instead of snapping straight.
        let inn = cfg.binarySteerInRate * Math.max(0.3, clamp((tel.speed - 0.1) / 0.9, 0, 1));
        const opposite = target !== 0 && steerFilt !== 0 && sign(target) !== sign(steerFilt);
        if (opposite) inn *= 1.5;
        // Counter-steer reflex: input against the current turn (lateral acceleration or yaw) gets extra speed.
        const turning = Math.abs(tel.yawRateRight) > 0.15 ? tel.yawRateRight : tel.latAccelRight;
        if (target !== 0 && Math.abs(turning) > 0.5 && sign(target) !== sign(turning)) inn *= 1.8;
        const awayFromCentre = target !== 0 && (steerFilt === 0 || sign(target) === sign(steerFilt)) && Math.abs(target) > Math.abs(steerFilt);
        steerFilt = moveTowards(steerFilt, target, (awayFromCentre ? out : inn) * dt);
      } else {
        const dz = raw.source === 'wheel' ? 0 : raw.source === 'tilt' ? cfg.tiltDeadzoneDeg / cfg.tiltFullLockDeg : cfg.analogDeadzone;
        const gamma = raw.source === 'wheel' ? 1 : raw.source === 'tilt' ? 1.5 : cfg.analogGamma;
        // Analog steering maps position to angle (position control), so it is only de-noised, not rate-limited.
        steerFilt = shapeAnalog(raw.steer, dz, gamma);
      }
      let throttle = clamp(raw.throttle, 0, 1);
      const brake = clamp(raw.brake, 0, 1);
      if (auto && brake < 0.05) throttle = 1;
      return { steer: steerFilt, throttle, brake, handbrake: clamp(raw.handbrake, 0, 1), source: raw.source };
    },
  };
}
