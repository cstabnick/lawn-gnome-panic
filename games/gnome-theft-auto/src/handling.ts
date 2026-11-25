// Vehicle handling for the ground vehicles the player drives: driving modes, per-vehicle profiles, and the config builder.
// Pure data and maths (no DOM, no three.js) so it can be tested headless and a tuning garage can edit it later.
//
//   config = mode (a preset family, "how real") -> scaled to the vehicle's size -> tuned by the vehicle's setup ("how this one drives")
//
// A VEHICLE PROFILE is a vehicle's character: its stock setup (11 knobs from @lawn/vehicle `tuning.ts`, neutral = 1) and the
// RANGES a garage may move each knob within. The same knobs make a push-bike twitchy and a combine a barge.
import {
  PRESETS, TUNING_PARAMS, clampTuning, retuneDirectDrive, scaleConfig, tuneVehicle, withOverrides,
  type DeepPartial, type TuningParamId, type TuningRanges, type TuningValues, type VehicleConfig,
} from '@lawn/vehicle';
import type { VehicleKind, VehicleSpec } from './types';

// ---- Driving modes ("realism"): which physics family every ground vehicle uses ----------------------------------------
/** A named driving mode: a preset family plus a few overrides. `arcade` is the original non-physical model (no chassis). */
export interface Tune {
  id: string; name: string; blurb: string;
  base: keyof typeof PRESETS;
  over?: DeepPartial<VehicleConfig>;
  /** The classic arcade model, kept as the lowest-realism cheat. `base` is unused. */
  arcade?: boolean;
  /** Options shows `silly` modes under their own heading: they are for fun, not for driving well. */
  group: 'realism' | 'silly';
}

export const DEFAULT_MODE_ID = 'casual';

export const TUNES: Tune[] = [
  { id: 'arcade', name: 'Arcade', blurb: 'The original flat model: no weight, no sliding.', base: 'casual', arcade: true, group: 'realism' },
  { id: 'casual', name: 'Casual', blurb: 'Grippy and forgiving. Full assists. The default.', base: 'casual', group: 'realism' },
  { id: 'hybrid', name: 'Open World', blurb: 'Action-game balance: some slide, some help.', base: 'hybrid', group: 'realism' },
  { id: 'simcade', name: 'Simcade', blurb: 'Real weight transfer, light assists. Easy to spin.', base: 'simcade', group: 'realism' },
  {
    id: 'drift', name: 'Drift Mower', blurb: 'Loose rear, keeps the slide going. Hold the handbrake.', base: 'hybrid', group: 'silly',
    over: {
      tires: { latPacejkaRear: { D: 1.0 } },
      drivetrain: { handbrakeTorqueRearNm: 7000, limitedSlipRear: 0.9 },
      steeringAndAssists: { tractionControlStrength: 0, speedCurvatureLimitStrength: 0.25, counterSteerAssist: 0.8, escYawDampingGain: 300 },
    },
  },
  {
    id: 'dew', name: 'Dewy Lawn', blurb: 'Slippery everywhere. Brake early.', base: 'casual', group: 'silly',
    over: {
      tires: { longPacejka: { D: 0.7 }, latPacejkaFront: { D: 0.75 }, latPacejkaRear: { D: 0.75 } },
      steeringAndAssists: { absEnabled: true, tractionControlStrength: 0.5 },
    },
  },
];
export const tuneById = (id: string | null | undefined): Tune | undefined => TUNES.find((t) => t.id === id);

// ---- Vehicle profiles ------------------------------------------------------------------------------------------------
export interface VehicleProfile {
  /** The vehicle's stock setup: what it drives like out of the shed. Missing knobs are neutral. */
  stock: Partial<TuningValues>;
  /** What a garage may set each knob to (inside the global limits). Missing = the global limits. */
  ranges: TuningRanges;
  /** How far the rider leans into weight shift: 1 is the default gnome, 0 is a statue. Not physics. */
  lean: number;
}

/** A reference car is about this long (m); a vehicle's collision radius scales the whole family from it. */
export const REFERENCE_RADIUS = 2.3;

export const PROFILES: Partial<Record<VehicleKind, VehicleProfile>> = {
  // Light and twitchy: quick to turn, a livelier tail, soft and tall so the rider really rocks about.
  'push-bike': {
    stock: { acceleration: 1.1, grip: 0.95, balance: -0.1, steering: 1.15, assists: 0.85, handbrake: 1.2, stiffness: 0.9, comHeight: 1.15 },
    ranges: { grip: [0.7, 1.3], balance: [-0.5, 0.4], steering: [0.8, 1.4], assists: [0, 1.6], mass: [0.8, 1.3], comHeight: [0.9, 1.4] },
    lean: 1.4,
  },
  // Knobbly Dirt-Mower: lighter and quicker than the push-bike, soft long-travel suspension for landings, a loose tail on tarmac
  // (surfaces.ts scales grip per surface for every kind, so the bite on loose ground comes from quick steering and the assists).
  'dirt-bike': {
    stock: { acceleration: 1.1, grip: 0.9, balance: -0.15, steering: 1.25, assists: 1.0, handbrake: 1.3, stiffness: 0.75, comHeight: 1.05 },
    ranges: { grip: [0.65, 1.3], balance: [-0.5, 0.4], steering: [0.8, 1.5], assists: [0, 1.6], mass: [0.8, 1.3], comHeight: [0.9, 1.4], stiffness: [0.6, 1.1] },
    lean: 1.5,
  },
  // The reference mower: balanced, a touch of understeer, forgiving.
  'ride-on': {
    stock: { balance: 0.1 },
    ranges: { balance: [-0.4, 0.6], steering: [0.7, 1.4], assists: [0.2, 1.8] },
    lean: 1,
  },
  // A racer: grips, pivots on a dime, and the tail comes round on the handbrake.
  'zero-turn': {
    stock: { grip: 1.1, balance: -0.1, steering: 1.3, assists: 0.85, brakes: 1.1, handbrake: 1.3, stiffness: 1.1, comHeight: 0.9 },
    ranges: { grip: [0.8, 1.4], balance: [-0.5, 0.5], steering: [0.9, 1.5], assists: [0, 1.6], topSpeed: [0.7, 1.4], acceleration: [0.7, 1.6] },
    lean: 1.15,
  },
  // A barge: pushes wide, rolls on its soft suspension, slow to change its mind. Not a drift car.
  combine: {
    stock: { grip: 1.05, balance: 0.35, steering: 0.8, assists: 1.25, brakes: 0.8, handbrake: 0.6, stiffness: 0.75, comHeight: 1.15 },
    ranges: { grip: [0.8, 1.3], balance: [0.1, 0.9], steering: [0.6, 1.1], assists: [0.8, 2], handbrake: [0.3, 1], mass: [0.9, 1.5], topSpeed: [0.8, 1.2] },
    lean: 0.4,
  },
  // Ride-On Lowrider: nimble hydraulic cruiser with soft bounce and plush steering.
  lowrider: {
    stock: { grip: 1.05, balance: 0.05, steering: 1.15, assists: 1.0, stiffness: 0.95, comHeight: 0.95 },
    ranges: { grip: [0.8, 1.3], balance: [-0.4, 0.5], steering: [0.8, 1.4], assists: [0.2, 1.6], stiffness: [0.75, 1.3] },
    lean: 1.1,
  },
  // Gnorwin's Boot Parade Float: massive ramming tractor; stiff suspension & low CoM so 30ft of boot doesn't tip.
  'boot-float': {
    stock: { grip: 1.1, balance: 0.3, steering: 0.85, assists: 1.3, brakes: 0.85, handbrake: 0.6, stiffness: 1.1, comHeight: 0.85 },
    ranges: { grip: [0.9, 1.3], balance: [0.1, 0.8], steering: [0.6, 1.1], assists: [0.8, 1.8], mass: [0.9, 1.5] },
    lean: 0.35,
  },
  // Snail-Coach: boxy transit bus with a loose, tail-happy drift profile.
  'snail-coach': {
    stock: { grip: 0.95, balance: -0.15, steering: 1.0, assists: 0.75, handbrake: 1.3, stiffness: 1.0, comHeight: 0.85 },
    ranges: { grip: [0.7, 1.2], balance: [-0.5, 0.4], steering: [0.7, 1.3], assists: [0.2, 1.5], handbrake: [0.8, 1.6] },
    lean: 0.6,
  },
  // Pressurized Mulch-Spreader: utility Ride-On carrying a rear compost hopper.
  'mulch-spreader': {
    stock: { grip: 1.0, balance: 0.15, steering: 1.05, assists: 1.0, stiffness: 0.95, comHeight: 1.0 },
    ranges: { grip: [0.8, 1.3], balance: [-0.3, 0.6], steering: [0.7, 1.3], assists: [0.3, 1.6] },
    lean: 0.9,
  },
  // HOA Code-Enforcement Van: armored, planted municipal interceptor.
  'hoa-van': {
    stock: { grip: 1.1, balance: 0.1, steering: 1.05, assists: 1.15, brakes: 1.1, stiffness: 1.1, comHeight: 0.88 },
    ranges: { grip: [0.85, 1.35], balance: [-0.3, 0.5], steering: [0.75, 1.3], assists: [0.5, 1.7] },
    lean: 0.6,
  },
  // Pot-Rod: a light, tail-happy scrap of a car that leans hard and twitches on every bump.
  'pot-rod': {
    stock: { grip: 0.9, balance: -0.2, steering: 1.2, assists: 0.8, stiffness: 0.85, comHeight: 1.1 },
    ranges: { grip: [0.7, 1.2], balance: [-0.5, 0.3], steering: [0.8, 1.4], assists: [0, 1.5], stiffness: [0.7, 1.2] },
    lean: 1.2,
  },
  // Lawn-Roller: a slow, planted brick. Heavy, low, and it takes its time to turn.
  'lawn-roller': {
    stock: { grip: 1.2, balance: 0.4, steering: 0.75, assists: 1.4, brakes: 1.2, stiffness: 1.2, comHeight: 0.8 },
    ranges: { grip: [0.8, 1.3], balance: [0.1, 0.9], steering: [0.6, 1.1], assists: [0.8, 2], mass: [0.9, 1.5], topSpeed: [0.8, 1.2] },
    lean: 0.3,
  },
  // Teacup-Trundler: pivots on the spot and wobbles about on its tiny wheels.
  'teacup-trundler': {
    stock: { grip: 0.85, balance: 0, steering: 1.4, assists: 0.9, stiffness: 0.8, comHeight: 1.2 },
    ranges: { grip: [0.7, 1.2], balance: [-0.4, 0.4], steering: [0.8, 1.4], assists: [0.2, 1.6], mass: [0.8, 1.3], comHeight: [0.9, 1.4] },
    lean: 1.5,
  },
  // Barrow-Buggy: nose-heavy and wanders off line unless you keep it honest.
  'barrow-buggy': {
    stock: { grip: 0.95, balance: 0.3, steering: 0.95, assists: 1.0, stiffness: 0.9, comHeight: 1.1 },
    ranges: { grip: [0.8, 1.3], balance: [-0.3, 0.6], steering: [0.7, 1.3], assists: [0.3, 1.6] },
    lean: 1.1,
  },
  // European rides. Euro-Hatch: nippy and planted city car.
  'euro-hatch': {
    stock: { grip: 1.1, balance: 0.05, steering: 1.25, assists: 1.1, stiffness: 1.05, comHeight: 0.95 },
    ranges: { grip: [0.8, 1.4], balance: [-0.4, 0.5], steering: [0.9, 1.5], assists: [0.3, 1.8], stiffness: [0.8, 1.3], comHeight: [0.85, 1.3] },
    lean: 0.7,
  },
  // Deux-Pots: soft, leans hugely, never quite rolls.
  'deux-pots': {
    stock: { grip: 0.95, balance: 0, steering: 1.0, assists: 1.1, stiffness: 0.7, comHeight: 1.15 },
    ranges: { grip: [0.75, 1.2], balance: [-0.3, 0.4], steering: [0.7, 1.3], assists: [0.3, 1.8], stiffness: [0.6, 1.0], comHeight: [0.9, 1.4] },
    lean: 1.8,
  },
  // Wespa: light and twitchy scooter.
  wespa: {
    stock: { grip: 0.9, balance: -0.1, steering: 1.35, assists: 0.9, stiffness: 0.9, comHeight: 1.1 },
    ranges: { grip: [0.7, 1.2], balance: [-0.5, 0.3], steering: [0.9, 1.5], assists: [0.2, 1.6], stiffness: [0.7, 1.2], comHeight: [0.9, 1.4] },
    lean: 1.4,
  },
  // Baguette-Trike: tippy three-wheeler.
  'baguette-trike': {
    stock: { grip: 0.9, balance: 0.25, steering: 1.0, assists: 1.2, stiffness: 0.85, comHeight: 1.2 },
    ranges: { grip: [0.7, 1.2], balance: [-0.2, 0.6], steering: [0.7, 1.3], assists: [0.5, 1.8], stiffness: [0.7, 1.2], comHeight: [0.9, 1.4] },
    lean: 1.3,
  },
  // Crepe-Van: tall and wallowy.
  'crepe-van': {
    stock: { grip: 1.0, balance: 0.2, steering: 0.9, assists: 1.3, brakes: 1.1, stiffness: 0.9, comHeight: 1.15 },
    ranges: { grip: [0.8, 1.3], balance: [-0.2, 0.6], steering: [0.7, 1.2], assists: [0.7, 2], brakes: [0.8, 1.4], stiffness: [0.7, 1.2], comHeight: [0.9, 1.4] },
    lean: 0.9,
  },
  // E31 rides. Ranger Buggy: grippy and planted off-road.
  'ranger-buggy': {
    stock: { grip: 1.15, balance: 0.05, steering: 1.1, assists: 1.1, stiffness: 1.1, comHeight: 0.95 },
    ranges: { grip: [0.8, 1.5], balance: [-0.4, 0.5], steering: [0.8, 1.4], assists: [0.3, 1.8], stiffness: [0.8, 1.4], comHeight: [0.85, 1.3] },
    lean: 0.9,
  },
  // Snail-Shell Camper: heavy, slow to turn, top-heavy with a shell on the back.
  'shell-camper': {
    stock: { grip: 0.95, balance: 0.3, steering: 0.75, assists: 1.4, brakes: 0.95, stiffness: 0.85, comHeight: 1.25 },
    ranges: { grip: [0.75, 1.25], balance: [-0.1, 0.7], steering: [0.55, 1.1], assists: [0.7, 2], brakes: [0.7, 1.3], stiffness: [0.6, 1.1], comHeight: [1.0, 1.5] },
    lean: 1.2,
  },
};
const FALLBACK: VehicleProfile = { stock: {}, ranges: {}, lean: 1 };
export const profileFor = (kind: VehicleKind): VehicleProfile => PROFILES[kind] ?? FALLBACK;

/** Stock setup of a vehicle (all 11 knobs, clamped to its ranges). */
export const stockSetup = (kind: VehicleKind): TuningValues => {
  const p = profileFor(kind);
  return clampTuning(p.stock, p.ranges);
};
/** Clamp any setup (a saved garage entry, a slider move) to what this vehicle allows. */
export const clampSetup = (kind: VehicleKind, setup: Partial<TuningValues>): TuningValues => clampTuning(setup, profileFor(kind).ranges);
/** The range a garage slider for this knob may span on this vehicle. */
export function rangeFor(kind: VehicleKind, id: TuningParamId): readonly [number, number] {
  const r = clampTuning({ [id]: -1e9 } as Partial<TuningValues>, profileFor(kind).ranges)[id];
  const hi = clampTuning({ [id]: 1e9 } as Partial<TuningValues>, profileFor(kind).ranges)[id];
  return [r, hi];
}

// ---- Building a chassis ----------------------------------------------------------------------------------------------
/** The garage knobs: every tuning knob except `comHeight`, which Pay 'n' Glaze's ride height now drives (see comHeightFor). */
export const HANDLING_KNOBS = TUNING_PARAMS.filter((p) => p.id !== 'comHeight');

/** Ride height (-1..1, from the loadout) -> the centre-of-mass multiplier fed to tuning: -1 lowers it 45%, +1 raises it 45%. Global limits only. */
export function comHeightFor(kind: VehicleKind, rideHeight: number): number {
  const p = TUNING_PARAMS.find((t) => t.id === 'comHeight')!;
  const stock = profileFor(kind).stock.comHeight ?? 1;
  const h = stock * (1 + 0.45 * rideHeight);
  return Math.min(p.max, Math.max(p.min, h));
}

/** One config per vehicle: the mode's family scaled to the vehicle's size, tuned by the vehicle's setup. `setup` defaults to stock. `rideHeight` (-1..1) sets the centre of mass. */
export function vehicleConfig(
  spec: VehicleSpec, tune: Tune, setup: Partial<TuningValues> = stockSetup(spec.kind), rideHeight = 0,
): VehicleConfig {
  // 'geometric': sag and roll scale with the car, so the bike does not sit on its bump stop (see scaleConfig).
  let cfg = scaleConfig(withOverrides(PRESETS[tune.base], tune.over ?? {}), spec.radius / REFERENCE_RADIUS, { suspension: 'geometric' });
  // Ground vehicles always use the direct drive (no gearbox), and the player holds the throttle.
  cfg = withOverrides(cfg, { drivetrain: { mode: 'DirectDrive' }, mobileInput: { autoAccelerate: false } });
  cfg = retuneDirectDrive(cfg, spec.maxSpeed, spec.accel);
  // The override goes AFTER clamping: the ride height has its own limits, not the profile's comHeight range.
  const values: TuningValues = { ...clampSetup(spec.kind, setup), comHeight: comHeightFor(spec.kind, rideHeight) };
  return tuneVehicle(cfg, values, { topSpeedMs: spec.maxSpeed, accelMs2: spec.accel });
}

// ---- Rider weight shift ----------------------------------------------------------------------------------------------
/** Sideways acceleration (m/s²) that gives the full lean. A hard turn at town speed is about this much. */
export const LEAN_FULL_ACCEL = 14;
/** Largest lean at profile.lean 1, radians (about 9 degrees: weight shift you can see from the chase camera, not a sway). */
export const LEAN_MAX = 0.16;
/** Hard cap after the profile multiplier, radians. */
export const LEAN_CAP = 0.26;

/**
 * Roll angle for the seated rider, radians, + = towards the rider's right. `accelRight` is sideways acceleration, + = towards
 * the vehicle's right. The body is thrown to the OUTSIDE of a turn, so a left turn (negative) leans the rider right.
 */
export function riderLean(accelRight: number, profile: VehicleProfile): number {
  const k = Math.max(-1, Math.min(1, accelRight / LEAN_FULL_ACCEL));
  return Math.max(-LEAN_CAP, Math.min(LEAN_CAP, -k * LEAN_MAX * profile.lean));
}
