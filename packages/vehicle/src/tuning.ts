// Tuning layer: a handful of named, human-sized knobs on top of a VehicleConfig. It is what a tuning garage edits and what a
// vehicle's "character" is made of. Each knob is neutral at 1 (or 0 for `balance`) and moves the config in one clear way, so a
// game can say "this car has grip 0.9, steering 1.3" without knowing a single Pacejka coefficient.
//
//   cfg = tuneVehicle(base, values, { topSpeedMs, accelMs2 })
//
// `values` are validated by `clampTuning` against the global limits (`TUNING_PARAMS`) and then a vehicle's own `ranges`
// (a combine cannot be set up as a drift car; a zero-turn can). Neutral values return the base config unchanged.
import { retuneDirectDrive, type VehicleConfig } from './config';

export type TuningParamId =
  | 'topSpeed' | 'acceleration' | 'brakes' | 'grip' | 'balance' | 'steering'
  | 'assists' | 'handbrake' | 'mass' | 'stiffness' | 'comHeight';

export type TuningValues = Record<TuningParamId, number>;
export type TuningRanges = Partial<Record<TuningParamId, readonly [number, number]>>;

export interface TuningParam {
  id: TuningParamId;
  label: string;
  /** What turning it up does, in a sentence (a garage slider's tooltip). */
  blurb: string;
  /** The value that leaves the base config alone: 1, or 0 for `balance`. */
  neutral: number;
  /** Global limits; a vehicle's own ranges sit inside these. */
  min: number;
  max: number;
  step: number;
}

export const TUNING_PARAMS: readonly TuningParam[] = [
  { id: 'topSpeed', label: 'Top speed', blurb: 'Higher top speed.', neutral: 1, min: 0.5, max: 1.6, step: 0.05 },
  { id: 'acceleration', label: 'Pickup', blurb: 'Harder launch and pull out of corners.', neutral: 1, min: 0.5, max: 1.8, step: 0.05 },
  { id: 'brakes', label: 'Brakes', blurb: 'Shorter stopping distance; more chance to lock a wheel.', neutral: 1, min: 0.4, max: 1.8, step: 0.05 },
  { id: 'grip', label: 'Grip', blurb: 'More tyre grip: higher cornering speed, less sliding.', neutral: 1, min: 0.5, max: 1.5, step: 0.05 },
  { id: 'balance', label: 'Balance', blurb: 'Positive: the nose pushes wide (understeer). Negative: the tail steps out (oversteer); past about -0.6 it spins.', neutral: 0, min: -0.6, max: 1, step: 0.05 },
  { id: 'steering', label: 'Steering lock', blurb: 'Wheels turn further: tighter circle, twitchier at speed.', neutral: 1, min: 0.5, max: 1.6, step: 0.05 },
  { id: 'assists', label: 'Driver aids', blurb: 'More traction control, counter-steer and stability help. 0 is on your own.', neutral: 1, min: 0, max: 2, step: 0.05 },
  { id: 'handbrake', label: 'Handbrake', blurb: 'A stronger rear lock for slides and turn-arounds.', neutral: 1, min: 0.3, max: 2, step: 0.05 },
  { id: 'mass', label: 'Weight', blurb: 'Heavier: more momentum and body inertia, slower to change direction.', neutral: 1, min: 0.6, max: 1.6, step: 0.05 },
  { id: 'stiffness', label: 'Suspension', blurb: 'Stiffer springs and bars: less body roll and dive, a harsher ride.', neutral: 1, min: 0.5, max: 1.8, step: 0.05 },
  { id: 'comHeight', label: 'Ride height', blurb: 'Higher centre of mass: more weight transfer and body roll, easier to tip.', neutral: 1, min: 0.6, max: 1.6, step: 0.05 },
];

export const neutralTuning = (): TuningValues =>
  Object.fromEntries(TUNING_PARAMS.map((p) => [p.id, p.neutral])) as TuningValues;

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

/** Fill missing knobs with neutral and clamp each to the global limits, then to `ranges` (narrower per vehicle). Non-finite values fall back to neutral. */
export function clampTuning(values: Partial<TuningValues> = {}, ranges: TuningRanges = {}): TuningValues {
  const out = neutralTuning();
  for (const p of TUNING_PARAMS) {
    const raw = values[p.id];
    let v = typeof raw === 'number' && Number.isFinite(raw) ? raw : p.neutral;
    v = clamp(v, p.min, p.max);
    const r = ranges[p.id];
    if (r) v = clamp(v, Math.max(p.min, r[0]), Math.min(p.max, r[1]));
    out[p.id] = v;
  }
  return out;
}

/** What `topSpeed` and `acceleration` are multiples of: the vehicle's own numbers (m/s and m/s²). */
export interface DriveBase { topSpeedMs: number; accelMs2: number }

/**
 * Apply tuning to a config (the base is untouched). Order matters: weight first (so Pickup stays "m/s²"), then the
 * chassis, tyres and aids, and last the direct-drive retune to the requested top speed and pickup.
 */
export function tuneVehicle(base: VehicleConfig, values: Partial<TuningValues>, drive: DriveBase): VehicleConfig {
  const t = clampTuning(values);
  const c = structuredClone(base);

  // Weight: a heavier body keeps the same natural frequencies (springs and dampers scale with it).
  c.chassis.massKg *= t.mass;
  c.chassis.yawInertiaKgM2 *= t.mass;
  const sus = c.suspension;
  const rates = t.mass * t.stiffness;
  sus.springRateNPerM *= rates;
  sus.bumpDamperNsPerM *= rates;
  sus.reboundDamperNsPerM *= rates;
  sus.antiRollBarNPerM *= rates;
  c.chassis.comHeightM *= t.comHeight;

  // Tyres: grip scales every peak; balance moves grip between the axles (the tail more than the nose, so it reads as a feel, not a loss).
  const tires = c.tires;
  tires.longPacejka.D *= t.grip;
  tires.latPacejkaFront.D *= t.grip * (1 - 0.1 * t.balance);
  tires.latPacejkaRear.D *= t.grip * (1 + 0.25 * t.balance);

  // Steering and the aids that wrap it.
  const a = c.steeringAndAssists;
  a.maxSteerAngleDeg = Math.min(55, a.maxSteerAngleDeg * t.steering);
  a.speedCurvatureLimitStrength = Math.min(1, a.speedCurvatureLimitStrength * t.assists);
  a.counterSteerAssist = Math.min(1, a.counterSteerAssist * t.assists);
  a.tractionControlStrength = Math.min(1, a.tractionControlStrength * t.assists);
  a.escYawDampingGain *= t.assists;

  const d = c.drivetrain;
  d.maxBrakeTorqueTotalNm *= t.brakes;
  d.handbrakeTorqueRearNm *= t.handbrake;

  return c.drivetrain.mode === 'DirectDrive'
    ? retuneDirectDrive(c, drive.topSpeedMs * t.topSpeed, drive.accelMs2 * t.acceleration)
    : c;
}
