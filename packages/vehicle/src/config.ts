// VehicleConfig: the engine-agnostic schema from the research doc. SI units throughout (m, kg, s, rad, N, N·m).
// Presets are full configs; `withOverrides` layers a partial one on top, so a new car type is a handful of fields.

export interface PacejkaParams { B: number; C: number; D: number; E: number }
export interface LongTire extends PacejkaParams { peakSlip: number }
export interface LatTire extends PacejkaParams { peakAngleDeg: number }

export interface ChassisConfig {
  massKg: number;
  yawInertiaKgM2: number;
  wheelbaseM: number;
  /** CoM to front axle (+) and rear axle (-), along the car. */
  frontAxleOffsetM: number;
  rearAxleOffsetM: number;
  trackWidthM: number;
  comHeightM: number;
  /** 0 = tyre forces act at the road (full roll torque), 1 = at the CoM (no roll torque). */
  forceAppHeightBlend: number;
  aeroCdA: number;
  aeroClA: number;
  /** Anti-flip cone: past this tilt from upright a restoring torque kicks in. 180 = off. */
  maxPitchRollDeg: number;
}

export interface SuspensionConfig {
  wheelRadiusM: number;
  wheelMassKg: number;
  travelM: number;
  springRateNPerM: number;
  bumpDamperNsPerM: number;
  reboundDamperNsPerM: number;
  antiRollBarNPerM: number;
  /** 0..1: blend of static corner load (0) and live suspension load (1) fed to the tyre. */
  wheelLoadRatio: number;
}

export interface TireConfig {
  longPacejka: LongTire;
  latPacejkaFront: LatTire;
  latPacejkaRear: LatTire;
  relaxationLongM: number;
  relaxationLatM: number;
  rollingResistanceCrr: number;
}

export interface CombustionConfig {
  peakTorqueNm: number;
  gears: number[];
  finalDrive: number;
  efficiency: number;
  idleRpm: number;
  redlineRpm: number;
  shiftUpRpm: number;
  shiftDownRpm: number;
}

export interface DirectDriveConfig {
  maxTorqueNm: number;
  maxPowerW: number;
  fixedGearRatio: number;
  maxRpm: number;
  regenBrakeTorqueNm: number;
}

export interface DrivetrainConfig {
  mode: 'CombustionMultiGear' | 'DirectDrive';
  /** Share of drive torque to the front axle (0 = RWD, 1 = FWD). */
  driveBiasFront: number;
  limitedSlipRear: number;
  limitedSlipFront: number;
  combustion: CombustionConfig;
  directDrive: DirectDriveConfig;
  maxBrakeTorqueTotalNm: number;
  brakeBiasFront: number;
  handbrakeTorqueRearNm: number;
}

export interface AssistConfig {
  maxSteerAngleDeg: number;
  /** 0..1: how far the physical curvature limit overrides the raw steer command. */
  speedCurvatureLimitStrength: number;
  counterSteerAssist: number;
  tractionControlStrength: number;
  absEnabled: boolean;
  /** N·m·s/rad of yaw damping torque against yaw-rate error. 0 = ESC off. */
  escYawDampingGain: number;
  /** Understeer gradient term of the target yaw rate, s²/m². */
  escStabilityFactorKstab: number;
  driftAssistMode: 'None' | 'EmergentIntentControl';
  /** 0..1 airborne self-levelling. */
  airborneStabilization: number;
}

export interface MobileInputConfig {
  defaultScheme: 'SplitJoystick' | 'SingleJoystick' | 'Buttons' | 'Tilt' | 'Wheel';
  autoAccelerate: boolean;
  binarySteerOutRate: number;
  binarySteerInRate: number;
  analogDeadzone: number;
  analogGamma: number;
  tiltFullLockDeg: number;
  tiltDeadzoneDeg: number;
}

export interface VehicleConfig {
  presetName: string;
  chassis: ChassisConfig;
  suspension: SuspensionConfig;
  tires: TireConfig;
  drivetrain: DrivetrainConfig;
  steeringAndAssists: AssistConfig;
  mobileInput: MobileInputConfig;
}

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends unknown[] ? T[K] : T[K] extends object ? DeepPartial<T[K]> : T[K] };

export function withOverrides(base: VehicleConfig, over: DeepPartial<VehicleConfig>): VehicleConfig {
  const merge = (a: unknown, b: unknown): unknown => {
    if (b === undefined) return a;
    if (Array.isArray(b) || typeof b !== 'object' || b === null) return b;
    const out: Record<string, unknown> = { ...(a as Record<string, unknown>) };
    for (const k of Object.keys(b)) out[k] = merge(out[k], (b as Record<string, unknown>)[k]);
    return out;
  };
  return structuredClone(merge(base, over)) as VehicleConfig;
}

/** Realistic Simcade: the research doc's baseline (driving-centric game). */
export const SIMCADE: VehicleConfig = {
  presetName: 'Simcade_Realistic',
  chassis: {
    massKg: 1450, yawInertiaKgM2: 2350, wheelbaseM: 2.65, frontAxleOffsetM: 1.25, rearAxleOffsetM: -1.4,
    trackWidthM: 1.55, comHeightM: 0.5, forceAppHeightBlend: 0.15, aeroCdA: 0.667, aeroClA: 0.323, maxPitchRollDeg: 180,
  },
  suspension: {
    wheelRadiusM: 0.34, wheelMassKg: 20, travelM: 0.28, springRateNPerM: 32000, bumpDamperNsPerM: 2400,
    reboundDamperNsPerM: 3600, antiRollBarNPerM: 18000, wheelLoadRatio: 1,
  },
  tires: {
    longPacejka: { B: 12, C: 1.65, D: 1.15, E: 0.3, peakSlip: 0.131 },
    latPacejkaFront: { B: 11, C: 1.5, D: 1.15, E: 0.1, peakAngleDeg: 9.4 },
    latPacejkaRear: { B: 11, C: 1.5, D: 1.18, E: 0.1, peakAngleDeg: 9.4 },
    relaxationLongM: 0.15, relaxationLatM: 0.12, rollingResistanceCrr: 0.012,
  },
  drivetrain: {
    mode: 'CombustionMultiGear', driveBiasFront: 0, limitedSlipRear: 0.5, limitedSlipFront: 0,
    combustion: {
      peakTorqueNm: 340, gears: [3.5, 2.25, 1.58, 1.2, 0.96, 0.78], finalDrive: 3.73, efficiency: 0.88,
      idleRpm: 900, redlineRpm: 7200, shiftUpRpm: 6800, shiftDownRpm: 3200,
    },
    directDrive: { maxTorqueNm: 320, maxPowerW: 185000, fixedGearRatio: 8.5, maxRpm: 14500, regenBrakeTorqueNm: 60 },
    maxBrakeTorqueTotalNm: 8500, brakeBiasFront: 0.65, handbrakeTorqueRearNm: 4000,
  },
  steeringAndAssists: {
    maxSteerAngleDeg: 32, speedCurvatureLimitStrength: 0.4, counterSteerAssist: 0.25, tractionControlStrength: 0.3,
    absEnabled: true, escYawDampingGain: 400, escStabilityFactorKstab: 0.0015, driftAssistMode: 'EmergentIntentControl',
    airborneStabilization: 0,
  },
  mobileInput: {
    defaultScheme: 'SplitJoystick', autoAccelerate: false, binarySteerOutRate: 1.8, binarySteerInRate: 3.2,
    analogDeadzone: 0.04, analogGamma: 2, tiltFullLockDeg: 40, tiltDeadzoneDeg: 4,
  },
};

/** Casual / mobile secondary-mechanic: the doc's override list applied to the Simcade baseline. */
export const CASUAL: VehicleConfig = withOverrides(SIMCADE, {
  presetName: 'Casual_Mobile_Arcade',
  chassis: {
    yawInertiaKgM2: 2100, frontAxleOffsetM: 1.325, rearAxleOffsetM: -1.325, comHeightM: 0.25, forceAppHeightBlend: 0.9,
    aeroCdA: 0.753, aeroClA: 0.968, maxPitchRollDeg: 45,
  },
  suspension: {
    travelM: 0.35, springRateNPerM: 28000, bumpDamperNsPerM: 4200, reboundDamperNsPerM: 4800, antiRollBarNPerM: 35000,
    wheelLoadRatio: 0.35,
  },
  tires: {
    longPacejka: { D: 1.55 },
    latPacejkaFront: { B: 14, C: 1.15, D: 1.65, E: -1, peakAngleDeg: 12.4 },
    latPacejkaRear: { B: 14, C: 1.15, D: 1.72, E: -1, peakAngleDeg: 12.4 },
    rollingResistanceCrr: 0.015,
  },
  drivetrain: {
    mode: 'DirectDrive', driveBiasFront: 0.5, limitedSlipRear: 0.9, limitedSlipFront: 0.9, maxBrakeTorqueTotalNm: 12000,
  },
  steeringAndAssists: {
    maxSteerAngleDeg: 35, speedCurvatureLimitStrength: 0.6, counterSteerAssist: 0.75, tractionControlStrength: 1,
    escYawDampingGain: 2800, airborneStabilization: 1,
  },
  mobileInput: { defaultScheme: 'SingleJoystick', autoAccelerate: true },
});

/** Open-world action hybrid (GTA V style): the middle column of the doc's adaptation matrix. */
export const HYBRID: VehicleConfig = withOverrides(SIMCADE, {
  presetName: 'OpenWorld_Hybrid',
  chassis: { comHeightM: 0.35, forceAppHeightBlend: 0.5, maxPitchRollDeg: 70 },
  suspension: {
    springRateNPerM: 30000, bumpDamperNsPerM: 3200, reboundDamperNsPerM: 4100, antiRollBarNPerM: 26000, wheelLoadRatio: 0.65,
  },
  tires: {
    latPacejkaFront: { B: 12.5, C: 1.32, D: 1.38, E: -0.45, peakAngleDeg: 10.5 },
    latPacejkaRear: { B: 12.5, C: 1.32, D: 1.42, E: -0.45, peakAngleDeg: 10.5 },
  },
  drivetrain: { mode: 'DirectDrive', driveBiasFront: 0.3, limitedSlipRear: 0.6, limitedSlipFront: 0.6 },
  steeringAndAssists: {
    speedCurvatureLimitStrength: 0.7, counterSteerAssist: 0.5, tractionControlStrength: 0.6, escYawDampingGain: 1400,
    airborneStabilization: 0.5,
  },
});

export const PRESETS: Record<string, VehicleConfig> = { simcade: SIMCADE, hybrid: HYBRID, casual: CASUAL };

/**
 * Scale a config to a smaller or bigger vehicle of the same family. `s` multiplies lengths; mass goes as s³,
 * yaw inertia as s⁵, torques as s⁴. Top speed and acceleration are then re-set with `retuneDirectDrive`.
 *
 * Suspension rates: by default springs, dampers and anti-roll bars go as s³ (same natural frequencies), which keeps the static sag
 * the same in metres, so a small car sits on its bump stop. `suspension: 'geometric'` scales them so sag, travel and body roll angle
 * scale with the car (springs and bars s², dampers s^2.5, same damping ratio); use it for cars that are not kart-sized.
 * (Lawn Prix keeps the default and refits sag itself, see `fitKart`.)
 */
export function scaleConfig(cfg: VehicleConfig, s: number, opts: { suspension?: 'frequency' | 'geometric' } = {}): VehicleConfig {
  const c = structuredClone(cfg);
  const s3 = s * s * s;
  c.chassis.massKg *= s3;
  c.chassis.yawInertiaKgM2 *= s3 * s * s;
  c.chassis.wheelbaseM *= s;
  c.chassis.frontAxleOffsetM *= s;
  c.chassis.rearAxleOffsetM *= s;
  c.chassis.trackWidthM *= s;
  c.chassis.comHeightM *= s;
  c.chassis.aeroCdA *= s * s;
  c.chassis.aeroClA *= s * s;
  c.suspension.wheelRadiusM *= s;
  c.suspension.wheelMassKg *= s3;
  c.suspension.travelM *= s;
  const geometric = opts.suspension === 'geometric';
  const kRate = geometric ? s * s : s3;
  const kDamp = geometric ? s ** 2.5 : s3;
  c.suspension.springRateNPerM *= kRate;
  c.suspension.bumpDamperNsPerM *= kDamp;
  c.suspension.reboundDamperNsPerM *= kDamp;
  c.suspension.antiRollBarNPerM *= kRate;
  const d = c.drivetrain;
  d.maxBrakeTorqueTotalNm *= s3 * s;
  d.handbrakeTorqueRearNm *= s3 * s;
  d.combustion.peakTorqueNm *= s3 * s;
  d.directDrive.maxTorqueNm *= s3 * s;
  d.directDrive.maxPowerW *= s3 * s;
  d.directDrive.regenBrakeTorqueNm *= s3 * s;
  c.steeringAndAssists.escYawDampingGain *= s3 * s;
  return c;
}

/** Re-set a direct-drive car's top speed and launch acceleration (m/s, m/s²) by choosing gear ratio, torque and power. */
export function retuneDirectDrive(cfg: VehicleConfig, topSpeedMs: number, accelMs2: number): VehicleConfig {
  const c = structuredClone(cfg);
  const dd = c.drivetrain.directDrive;
  const r = c.suspension.wheelRadiusM;
  // The motor reaches maxRpm a little above topSpeed, so aero and rolling drag set the real limit.
  dd.fixedGearRatio = (((dd.maxRpm * Math.PI) / 30) * r) / (topSpeedMs * 1.04);
  const force = c.chassis.massKg * accelMs2;
  dd.maxTorqueNm = (force * r) / dd.fixedGearRatio / 0.92;
  dd.maxPowerW = force * topSpeedMs * 0.55;
  dd.regenBrakeTorqueNm = dd.maxTorqueNm * 0.2;
  return c;
}
