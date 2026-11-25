// What a driver holds in each vehicle, and how it turns: the steering wheel, handlebars, tiller, lap bars, yoke or basket rim per
// vehicle kind, as data. driverHands.ts puts the hands on `grips`; vehicles.ts turns the control's pivot with poseControl.
// Vehicles whose prefab has no turning control get one through a body variant (@lawn/glaze registerSteerVariant: an existing
// wheel part joins a 'steer' pivot, or a yoke / helm / handlebar is added), so the hands always hold something that is drawn.
// Numbers are prefab-local (before the vehicle's root scale). A gnome's shoulder reaches 0.32 world units (ARM_LENGTH):
// every grip sits 0.6..1.6 arm lengths from the seated shoulder at every steering angle (driveGrips.test.ts checks it).
import * as THREE from 'three';
import { registerSteerVariant, type SteerVariant } from '@lawn/glaze';
import type { Part, Vec3 } from '@lawn/prefabs';
import { PUSH_BIKE_GRIPS, RIDE_ON_GRIPS, ZERO_TURN_GRIPS, registerGlazeMounts } from './glazeMounts';
import { VEHICLES } from './config';
import type { VehicleKind } from './types';

/** What the hands hold (for the docs and tests; the maths is the same for all of them). */
export type ControlKind = 'wheel' | 'handlebar' | 'tiller' | 'lap-bars' | 'yoke' | 'rim';

export interface DriveControl {
  control: ControlKind;
  /** The body pivot that turns with the steering ('steer' or 'handle'). null: the control does not turn (a basket rim). */
  pivot: 'steer' | 'handle' | null;
  /** Left (+x) and right (-x) hand, prefab-local, at steer 0. They turn with the pivot. */
  grips: readonly [Vec3, Vec3];
  /** Turn axis, prefab-local unit vector: a positive angle about it is a RIGHT turn. Default [0, -1, 0] (a flat wheel turned clockwise from above). */
  axis?: Vec3;
  /** Angle at full lock, radians. Default 0.45 (what the pivot always turned by). */
  lock?: number;
  /** The body variant that makes this control, keyed by its base prefab (see registerDriveControls). */
  variant?: SteerVariant;
}

const DOWN: Vec3 = [0, -1, 0];
/** A wheel or yoke that faces the driver: a right turn is clockwise as the driver sees it, a positive turn about +z. */
const FACING: Vec3 = [0, 0, 1];
/** A ring tilted by `rx` degrees about x (the prefab part's rot[0]): its face normal, the axis it spins about. */
const ringAxis = (rx: number): Vec3 => {
  const r = (rx * Math.PI) / 180;
  return [0, -Math.sin(r), Math.cos(r)];
};

// ---- Added controls: parts in the variant's pivot group (absolute prefab-local `at`). ----
/** A yoke: a bar across at `at`, `w` wide, with a dark grip on each end. `t` is the bar's thickness. */
const yoke = (at: Vec3, w: number, t: number): Part[] => [
  { s: 'box', d: [w, t, t], at, c: 'iron-dark' },
  { s: 'cyl', d: [t * 0.9, t * 0.9, t * 3], at: [at[0] + w / 2, at[1], at[2]], c: 'black', seg: 6 },
  { s: 'cyl', d: [t * 0.9, t * 0.9, t * 3], at: [at[0] - w / 2, at[1], at[2]], c: 'black', seg: 6 },
];
/** A ship's helm: an upright ring of radius r facing the driver, with a hub. */
const helm = (at: Vec3, r: number, t: number): Part[] => [
  { s: 'ring', d: [r, t], at, c: 'wood-dark', seg: 10 },
  { s: 'box', d: [r * 2, t, t], at, c: 'wood-dark' },
  { s: 'ball', d: [t * 1.6], at, c: 'brass', seg: 6 },
];
/** Bike handlebars: a stem from `stemBase` up to the bar at `at`, `w` wide. Both turn about the stem. */
const bars = (at: Vec3, w: number, stemBase: Vec3, t: number): Part[] => [
  { s: 'cyl', d: [t, t, w], rot: [0, 0, 90], at, c: 'iron-dark', seg: 6 },
  { s: 'cyl', d: [t, t, at[1] - stemBase[1]], at: [at[0], (at[1] + stemBase[1]) / 2, at[2]], c: 'iron-dark', seg: 6 },
  { s: 'cyl', d: [t * 1.4, t * 1.4, t * 4], rot: [0, 0, 90], at: [at[0] + w / 2, at[1], at[2]], c: 'black', seg: 6 },
  { s: 'cyl', d: [t * 1.4, t * 1.4, t * 4], rot: [0, 0, 90], at: [at[0] - w / 2, at[1], at[2]], c: 'black', seg: 6 },
];
/** A spoke across a ring of radius r tilted by rx degrees: a ring turning about its own face looks still, the spoke shows it turn. */
const spoke = (at: Vec3, r: number, rx: number, t: number, c: Part['c'] = 'iron-dark'): Part => ({ s: 'box', d: [r * 2, t, t], rot: [rx, 0, 0], at, c });
const pair = (c: Vec3, half: number): [Vec3, Vec3] => [[c[0] + half, c[1], c[2]], [c[0] - half, c[1], c[2]]];

// Positions of the added and moved controls (prefab-local), named so the grips and the parts cannot drift apart.
const COMBINE_WHEEL: Vec3 = [0, 1.37, 0.25];
const PLANE_YOKE: Vec3 = [0, 0.4, 0.15];
const WHIRLIGIG_YOKE: Vec3 = [0, 0.62, 0.04];
const BOOT_WHEEL: Vec3 = [0, 0.66, 0.93];
const MULCH_WHEEL: Vec3 = [0, 0.89, 0.27];
const CLOG_WHEEL: Vec3 = [0, 0.95, -1.1];
const STEAMER_HELM: Vec3 = [0, 1.38, -2.25];
const PATROL_HELM: Vec3 = [0, 0.88, -0.3];
const POT_ROD_WHEEL: Vec3 = [0, 0.5, 0.12];
const TEACUP_WHEEL: Vec3 = [0, 0.56, 0.12];
const BARROW_BARS: Vec3 = [0, 0.6, 0.12];
const GOLF_WHEEL: Vec3 = [0.32, 1.07, 0.04];
const HOPPER_YOKE: Vec3 = [0, 1.15, 0.08];
const SYCAMORE_YOKE: Vec3 = [0.35, 1.0, 0.5];
const DEUX_POTS_WHEEL: Vec3 = [0.16, 0.6, -0.02];
const WESPA_BARS: Vec3 = [0, 0.62, 0];
const TRIKE_BARS: Vec3 = [0, 0.66, 0.2];
const DIRT_BARS: Vec3 = [0, 0.62, 0.05];

/**
 * Every vehicle kind's control. A kind left out keeps its hands in the lap, for a reason:
 * - walnut-dinghy, gravy-boat: rowed and paddled (anim/rideAuto.ts plays boat-row / boat-paddle), nothing to steer by hand;
 * - snail-coach, hoa-van, taxi, euro-hatch, crepe-van: closed cabs, the driver's hands are not seen;
 * - tessie: a turtle, ridden.
 */
export const DRIVE_CONTROLS: Readonly<Partial<Record<VehicleKind, DriveControl>>> = {
  // Pay 'n' Glaze steer mounts (glazeMounts.ts): the rig's grip markers follow the styled wheels; these are the stock grips.
  'push-bike': { control: 'handlebar', pivot: 'handle', grips: PUSH_BIKE_GRIPS },
  'ride-on': { control: 'wheel', pivot: 'steer', grips: RIDE_ON_GRIPS },
  lowrider: { control: 'wheel', pivot: 'steer', grips: RIDE_ON_GRIPS },
  'zero-turn': { control: 'lap-bars', pivot: 'steer', grips: ZERO_TURN_GRIPS, lock: 0.35 },

  // A small wheel in the glass cab (the prefab has none).
  combine: {
    control: 'wheel', pivot: 'steer', grips: pair(COMBINE_WHEEL, 0.055), axis: [0, -0.866, -0.5], lock: 0.7,
    variant: {
      dropParts: [], wheelAt: COMBINE_WHEEL, columnBase: [0, 1.2, 0.33],
      addParts: [{ s: 'ring', d: [0.055, 0.008], rot: [-60, 0, 0], at: COMBINE_WHEEL, c: 'black', seg: 10 }, spoke(COMBINE_WHEEL, 0.053, -60, 0.008)],
    },
  },
  // Crop duster: a yoke under the bubble, on a column from the nose.
  plane: {
    control: 'yoke', pivot: 'steer', grips: pair(PLANE_YOKE, 0.045), axis: FACING, lock: 0.6,
    variant: { dropParts: [], wheelAt: PLANE_YOKE, columnBase: [0, 0.35, 0.3], addParts: yoke(PLANE_YOKE, 0.09, 0.01) },
  },
  // The Whirligig: a yoke on a short column from the windscreen's foot.
  whirligig: {
    control: 'yoke', pivot: 'steer', grips: pair(WHIRLIGIG_YOKE, 0.12), axis: FACING, lock: 0.6,
    variant: { dropParts: [], wheelAt: WHIRLIGIG_YOKE, columnBase: [0, 0.5, 0.09], addParts: yoke(WHIRLIGIG_YOKE, 0.24, 0.02) },
  },
  // Boot Float: the tractor wheel (part 5) comes back to the driver and turns; its old post (part 4) would pass through the lap,
  // so a new column comes from the front instead.
  'boot-float': {
    control: 'wheel', pivot: 'steer', grips: pair(BOOT_WHEEL, 0.1125), axis: ringAxis(-25), lock: 0.9,
    variant: {
      dropParts: [4], groupParts: [5], from: [0, 0.6875, 1.0375], wheelAt: BOOT_WHEEL, columnBase: [0, 0.5, 1.06],
      addParts: [spoke(BOOT_WHEEL, 0.11, -25, 0.012)],
    },
  },
  // Mulch-Spreader: its own ring (part 6) turns where it is.
  'mulch-spreader': {
    control: 'wheel', pivot: 'steer', grips: pair(MULCH_WHEEL, 0.13), axis: ringAxis(-22), lock: 0.9,
    variant: { dropParts: [], groupParts: [6], wheelAt: MULCH_WHEEL, addParts: [spoke(MULCH_WHEEL, 0.125, -22, 0.015)] },
  },
  // Clog Cruiser: the little wheel (part 9) and its post (part 8) come 0.25 back towards the seat; the wheel turns.
  'clog-cruiser': {
    control: 'wheel', pivot: 'steer', grips: pair(CLOG_WHEEL, 0.2), axis: FACING, lock: 0.9,
    variant: {
      dropParts: [], groupParts: [9], moveParts: [8], from: [0, 0.95, -0.85], wheelAt: CLOG_WHEEL,
      addParts: [spoke(CLOG_WHEEL, 0.19, 0, 0.02, 'wood-dark')],
    },
  },
  // Watering-Can Steamer: a ship's helm on a post in front of the driver's seat.
  'watering-can-steamer': {
    control: 'wheel', pivot: 'steer', grips: pair(STEAMER_HELM, 0.15), axis: FACING, lock: 1.2,
    variant: { dropParts: [], wheelAt: STEAMER_HELM, columnBase: [0, 0.8, -2.2], addParts: helm(STEAMER_HELM, 0.15, 0.025) },
  },
  // HOA Patrol Boat: a helm on a short column out of the back of the centre console.
  'hoa-patrol-boat': {
    control: 'wheel', pivot: 'steer', grips: pair(PATROL_HELM, 0.12), axis: FACING, lock: 1.2,
    variant: { dropParts: [], wheelAt: PATROL_HELM, columnBase: [0, 0.8, -0.2], addParts: helm(PATROL_HELM, 0.12, 0.02) },
  },
  // Pot Rod: the wheel (group steer) comes back from the nose into the pot, where the driver can reach it.
  'pot-rod': {
    control: 'wheel', pivot: 'steer', grips: pair(POT_ROD_WHEEL, 0.09),
    variant: { dropParts: [], wheelAt: POT_ROD_WHEEL },
  },
  // Lawn Roller: its own tiller bar (group steer), held at both ends.
  'lawn-roller': { control: 'tiller', pivot: 'steer', grips: [[0.18, 0.625, -0.2], [-0.18, 0.625, -0.2]] },
  // Teacup Trundler: the brass wheel rises out of the tea (it was under the surface, out of reach).
  'teacup-trundler': {
    control: 'wheel', pivot: 'steer', grips: pair(TEACUP_WHEEL, 0.07),
    variant: { dropParts: [], wheelAt: TEACUP_WHEEL },
  },
  // Barrow Buggy: handlebars on the engine box.
  'barrow-buggy': {
    control: 'handlebar', pivot: 'steer', grips: pair(BARROW_BARS, 0.15),
    variant: { dropParts: [], wheelAt: BARROW_BARS, addParts: bars(BARROW_BARS, 0.34, [0, 0.48, 0.12], 0.015) },
  },
  // Golf cart: its own tilted ring (part 7) turns about its face; ring and column (part 6) come 0.08 back so full lock stays in reach.
  'golf-cart': {
    control: 'wheel', pivot: 'steer', grips: pair(GOLF_WHEEL, 0.16), axis: ringAxis(-25.78), lock: 0.9,
    variant: { dropParts: [], groupParts: [7], moveParts: [6], from: [0.32, 1.1, 0.12], wheelAt: GOLF_WHEEL, addParts: [spoke(GOLF_WHEEL, 0.155, -25.78, 0.018, 0x222222)] },
  },
  // Hedge-Hopper: a yoke on a column from under the windscreen.
  'hedge-hopper': {
    control: 'yoke', pivot: 'steer', grips: pair(HOPPER_YOKE, 0.15), axis: FACING, lock: 0.6,
    variant: { dropParts: [], wheelAt: HOPPER_YOKE, columnBase: [0, 1.0, 0.8], addParts: yoke(HOPPER_YOKE, 0.3, 0.03) },
  },
  // Sycamore Copter: a yoke in front of the pilot's (left-hand, +x) bench.
  'sycamore-copter': {
    control: 'yoke', pivot: 'steer', grips: pair(SYCAMORE_YOKE, 0.15), axis: FACING, lock: 0.6,
    variant: { dropParts: [], wheelAt: SYCAMORE_YOKE, columnBase: [0.35, 0.85, 0.85], addParts: yoke(SYCAMORE_YOKE, 0.3, 0.03) },
  },
  // Deux-Pots: the steering ring (group steer) comes back over the bench, where the driver's hands reach it.
  'deux-pots': {
    control: 'wheel', pivot: 'steer', grips: pair(DEUX_POTS_WHEEL, 0.08), axis: ringAxis(120),
    variant: { dropParts: [], wheelAt: DEUX_POTS_WHEEL },
  },
  // Wespa: the handlebar (group steer) comes back 0.16 towards the saddle.
  wespa: {
    control: 'handlebar', pivot: 'steer', grips: pair(WESPA_BARS, 0.2),
    variant: { dropParts: [], wheelAt: WESPA_BARS },
  },
  // Knobbly Dirt-Mower: the bar is drawn where the rider holds it (group steer), so no variant.
  'dirt-bike': { control: 'handlebar', pivot: 'steer', grips: pair(DIRT_BARS, 0.2) },
  // Baguette Trike: its handlebar (group steer) comes back towards the saddle, held at both ends.
  'baguette-trike': {
    control: 'handlebar', pivot: 'steer', grips: pair(TRIKE_BARS, 0.21),
    variant: { dropParts: [], wheelAt: TRIKE_BARS },
  },
  // Dandelion Drifter: a balloon does not steer; the pilot holds the front of the basket rim (r 0.7, y 0.85).
  'dandelion-drifter': { control: 'rim', pivot: null, grips: [[0.25, 0.85, 0.654], [-0.25, 0.85, 0.654]] },
};

let registered = false;

/** Register every control's body variant (and the Pay 'n' Glaze mounts first, which own the ride-on and push-bike variants). Idempotent. */
export function registerDriveControls(): void {
  if (registered) return;
  registered = true;
  registerGlazeMounts();
  for (const [kind, ctl] of Object.entries(DRIVE_CONTROLS) as [VehicleKind, DriveControl][]) {
    if (ctl.variant) registerSteerVariant(VEHICLES[kind].prefab, ctl.variant);
  }
}

/** The control a kind's driver holds, or null (hands stay in the lap). */
export function controlOf(kind: VehicleKind): DriveControl | null {
  return DRIVE_CONTROLS[kind] ?? null;
}

// Per kind: the turn axis as a THREE vector and the lock, made once (poseControl runs for every vehicle every frame).
const turnAxes = new Map<VehicleKind, { axis: THREE.Vector3; lock: number }>();
const DEFAULT_TURN = { axis: new THREE.Vector3(...DOWN), lock: 0.45 };
function turnOf(kind: VehicleKind): { axis: THREE.Vector3; lock: number } {
  let t = turnAxes.get(kind);
  if (!t) {
    const c = DRIVE_CONTROLS[kind];
    t = c ? { axis: new THREE.Vector3(...(c.axis ?? DOWN)).normalize(), lock: c.lock ?? 0.45 } : DEFAULT_TURN;
    turnAxes.set(kind, t);
  }
  return t;
}

/** The control's angle (radians about its axis) for a steering input of `steer` (-1 left .. 1 right). */
export function controlAngle(kind: VehicleKind, steer: number): number {
  return steer * turnOf(kind).lock;
}

/** Turn a vehicle's control pivot for steering `steer` (-1 left .. 1 right, the vehicle's steerVis). No allocation. */
export function poseControl(pivot: THREE.Object3D, kind: VehicleKind, steer: number): void {
  const t = turnOf(kind);
  pivot.quaternion.setFromAxisAngle(t.axis, steer * t.lock);
  // vehicles.ts records the pivot's rest rotation (a damage morph can bend it): turn on top of it.
  const rest = pivot.userData.restQ as THREE.Quaternion | undefined;
  if (rest) pivot.quaternion.premultiply(rest);
}
