import {
  CASUAL,
  VehicleController,
  norm,
  qRotate,
  retuneDirectDrive,
  scaleConfig,
  tuneVehicle,
  v3,
  withOverrides,
  type GroundProbe,
  type VehicleConfig,
} from '@lawn/vehicle';
import { sampleSurfaceHeight } from '../levels/loader';
import type { GsrLevelDoc } from '../levels/schema';

export interface SkateChassis {
  ctrl: VehicleController;
  feetY: number;
  lastX: number;
  lastZ: number;
  baseConfig: VehicleConfig;
}

export function createLevelGroundProbe(doc: GsrLevelDoc, getFeetY: () => number): GroundProbe {
  const eps = 0.35;
  return {
    cast(origin, dir, maxDist) {
      if (dir.y >= -1e-4) return null;
      const feetY = getFeetY();
      const h = sampleSurfaceHeight(doc, origin.x, origin.z, feetY);
      const t = (h - origin.y) / dir.y;
      if (t < 0 || t > maxDist) return null;
      const hx = sampleSurfaceHeight(doc, origin.x + eps, origin.z, feetY) - sampleSurfaceHeight(doc, origin.x - eps, origin.z, feetY);
      const hz = sampleSurfaceHeight(doc, origin.x, origin.z + eps, feetY) - sampleSurfaceHeight(doc, origin.x, origin.z - eps, feetY);
      const n = norm(v3(-hx / (2 * eps), 1, -hz / (2 * eps)));
      return {
        distance: t,
        normal: n,
        point: v3(origin.x + dir.x * t, h, origin.z + dir.z * t),
      };
    },
  };
}

function makeSkateConfig(topSpeedMs: number, accelMs2: number): VehicleConfig {
  let cfg = scaleConfig(CASUAL, 0.36, { suspension: 'geometric' });
  cfg = retuneDirectDrive(cfg, topSpeedMs, accelMs2);
  cfg = tuneVehicle(
    cfg,
    {
      grip: 1.22,
      steering: 1.45,
      balance: -0.15,
      assists: 0.9,
      brakes: 1.35,
    },
    { topSpeedMs, accelMs2 },
  );
  return withOverrides(cfg, {
    mobileInput: { autoAccelerate: false },
  });
}

export function createSkateChassis(doc: GsrLevelDoc, x: number, y: number, z: number, yaw: number): SkateChassis {
  const baseConfig = makeSkateConfig(26, 26);
  const chassis: SkateChassis = {
    ctrl: new VehicleController(baseConfig),
    feetY: y,
    lastX: x,
    lastZ: z,
    baseConfig,
  };
  chassis.ctrl.ground = createLevelGroundProbe(doc, () => chassis.feetY);
  chassis.ctrl.place(v3(x, y, z), yaw, 0);
  return chassis;
}

export function syncChassisFromSkater(
  chassis: SkateChassis,
  x: number,
  y: number,
  z: number,
  vx: number,
  vz: number,
  yaw: number,
): void {
  chassis.feetY = y;
  chassis.lastX = x;
  chassis.lastZ = z;
  const spd = Math.hypot(vx, vz);
  const heading = spd > 0.5 ? Math.atan2(vx, vz) : yaw;
  chassis.ctrl.place(v3(x, y, z), heading, spd);
}

export function stepGroundChassis(
  chassis: SkateChassis,
  state: {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    yaw: number;
    lean: number;
    carveSlip: number;
    pitch: number;
    roll: number;
  },
  moveX: number,
  moveZ: number,
  boosting: boolean,
  dt: number,
): void {
  // If external code or tests teleported the skater, re-sync the rigid body
  if (Math.hypot(state.x - chassis.lastX, state.z - chassis.lastZ) > 0.5) {
    syncChassisFromSkater(chassis, state.x, state.y, state.z, state.vx, state.vz, state.yaw);
  }
  chassis.feetY = state.y;
  const moveLen = Math.hypot(moveX, moveZ);
  const nx = moveLen > 0.05 ? moveX / Math.max(1, moveLen) : 0;
  const nz = moveLen > 0.05 ? moveZ / Math.max(1, moveLen) : 0;

  const spd = Math.hypot(state.vx, state.vz);

  // Arcade pivot assist at very low speed so turning around from standstill feels instant
  if (moveLen > 0.05 && spd < 3.5) {
    const desiredYaw = Math.atan2(nx, nz);
    let diff = desiredYaw - state.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > 0.35) {
      state.yaw += diff * Math.min(1, dt * 12);
      chassis.ctrl.place(v3(state.x, state.y, state.z), state.yaw, spd);
    }
  }

  const fx = Math.sin(state.yaw);
  const fz = Math.cos(state.yaw);
  const lx = Math.cos(state.yaw);
  const lz = -Math.sin(state.yaw);

  const fwdDot = nx * fx + nz * fz;
  const leftDot = nx * lx + nz * lz;

  let throttle = 0;
  let brake = 0;
  let steer = 0;

  if (moveLen > 0.05) {
    steer = Math.max(-1, Math.min(1, -leftDot * 1.35));
    if (fwdDot >= -0.15) {
      throttle = Math.min(1, Math.max(0.35, fwdDot + Math.abs(leftDot) * 0.5) * (boosting ? 1.25 : 1));
    } else {
      // Carving hard back: brake then pivot
      brake = Math.min(1, -fwdDot);
    }
  } else {
    brake = 0.22; // gentle rolling coast friction
  }

  if (boosting && moveLen <= 0.05) {
    throttle = 1;
  }

  chassis.ctrl.update(dt, {
    steer,
    throttle,
    brake,
    handbrake: 0,
    source: 'keyboard',
  });

  const pose = chassis.ctrl.renderPose();
  const up = qRotate(pose.quat, v3(0, 1, 0));
  const h = chassis.ctrl.rideHeight;
  const fwd = qRotate(pose.quat, v3(0, 0, 1));

  state.x = pose.pos.x - up.x * h;
  state.z = pose.pos.z - up.z * h;
  chassis.lastX = state.x;
  chassis.lastZ = state.z;
  state.vx = chassis.ctrl.body.vel.x * (boosting ? 1.15 : 1);
  state.vz = chassis.ctrl.body.vel.z * (boosting ? 1.15 : 1);
  state.yaw = Math.atan2(fwd.x, fwd.z);

  const tel = chassis.ctrl.telemetry;
  state.carveSlip = tel.sideslip;
  state.pitch = tel.pitch;
  state.roll = tel.roll;
  state.lean = Math.max(-0.38, Math.min(0.38, -tel.yawRateRight * 0.14));
}
