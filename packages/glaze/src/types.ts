// @lawn/glaze types. Everything a game stores or sends is the plain-data `Loadout`; everything three.js is behind `GlazeRig`.
//
// Conventions (same as the prefab library): prefab-local coordinates are in the prefab's own units BEFORE any root scale; the front is +z;
// +x is the vehicle's LEFT (three.js), so a "left" thing sits at +x and a "right" thing at -x; rotations in a data table are DEGREES.
import type * as THREE from 'three';
import type { Part, Vec3 } from '@lawn/prefabs';
import type {
  BEAM_IDS, BUMPER_IDS, CANOPY_IDS, DECAL_IDS, EXHAUST_IDS, EXTRA_IDS, FINISH_IDS, GRILLE_IDS, HORN_IDS, LAMP_IDS, MIRROR_IDS,
  ORNAMENT_IDS, RIM_IDS, SEAT_IDS, SPOILER_IDS, STEER_IDS, TYRE_IDS,
} from './ids';

export type FinishId = (typeof FINISH_IDS)[number];
export type DecalId = (typeof DECAL_IDS)[number];
export type TyreId = (typeof TYRE_IDS)[number];
export type RimId = (typeof RIM_IDS)[number];
export type SteerId = (typeof STEER_IDS)[number];
export type LampId = (typeof LAMP_IDS)[number];
export type BeamId = (typeof BEAM_IDS)[number];
export type SpoilerId = (typeof SPOILER_IDS)[number];
export type SeatId = (typeof SEAT_IDS)[number];
export type OrnamentId = (typeof ORNAMENT_IDS)[number];
export type ExtraId = (typeof EXTRA_IDS)[number];
export type GrilleId = (typeof GRILLE_IDS)[number];
export type BumperId = (typeof BUMPER_IDS)[number];
export type CanopyId = (typeof CANOPY_IDS)[number];
export type MirrorId = (typeof MIRROR_IDS)[number];
export type ExhaustId = (typeof EXHAUST_IDS)[number];
export type HornId = (typeof HORN_IDS)[number];

/** Which shop shelf a catalogue entry is on. */
export type SlotId =
  | 'finish' | 'decal' | 'tyre' | 'rim' | 'steer' | 'lamp' | 'beam' | 'spoiler' | 'seat' | 'ornament' | 'extra'
  | 'grille' | 'bumper' | 'canopy' | 'mirror' | 'exhaust' | 'horn';

/** One thing the shop sells. `prefab` is the @lawn/prefabs id that draws it (absent: drawn in code, or "stock" = leave the vehicle alone). */
export interface ModDef {
  id: string;
  slot: SlotId;
  /** Shop name, lore-flavoured. */
  name: string;
  /** One short sentence for the shop card. */
  blurb: string;
  /** Acorns. 0 = free / stock. */
  price: number;
  prefab?: string;
}

/**
 * Everything a customised vehicle is, as plain JSON-safe data. A loadout is a value: copy it, compare it, save it, send `encodeLoadout(l)` over the network.
 * `defaultLoadout(paint)` is the stock vehicle: applying it changes nothing about the base prefab except paint.
 */
export interface Loadout {
  /** Body colour, 0xRRGGBB. */
  paint: number;
  finish: FinishId;
  /** 'none' or a spray (decal) painted on the flanks, hood and tail. */
  decal: DecalId | 'none';
  /** The spray's colour, 0xRRGGBB. */
  decalColor: number;
  /** For the 'number' spray: 0..99. */
  decalNumber: number;
  tyre: TyreId;
  rim: RimId;
  /** Rim colour, 0xRRGGBB. */
  rimColor: number;
  /** Wheel radius multiplier, WHEEL_SIZE_MIN..WHEEL_SIZE_MAX (1 = stock). Bigger wheels lift the body by the extra radius. */
  wheelSize: number;
  /** Camber in DEGREES, CAMBER_MIN..CAMBER_MAX. Negative = tops of the wheels lean in. Front wheels and rear wheels are set apart. */
  camberFront: number;
  camberRear: number;
  /** -1 (slammed on the tyres) .. +1 (lifted); 0 = stock. Moves the body shell (and the rider) relative to the wheels, and is mapped to the handling model's centre-of-mass height by the game. */
  rideHeight: number;
  steer: SteerId;
  lamp: LampId;
  beam: BeamId;
  spoiler: SpoilerId | 'none';
  seat: SeatId | 'none';
  ornament: OrnamentId | 'none';
  /** At most MAX_EXTRAS, no duplicates. */
  extras: ExtraId[];
  /** Neon glow under the chassis, 0xRRGGBB, or null for none. */
  underglow: number | null;
  /** Front grille. 'stock' = leave the vehicle alone (no change to the model). */
  grille: GrilleId;
  /** Front bumper. 'stock' = leave the vehicle alone (no change to the model). */
  bumper: BumperId;
  /** Roof canopy over the seat, or 'none'. */
  canopy: CanopyId | 'none';
  /** Wing or stalk mirrors, or 'none'. */
  mirror: MirrorId | 'none';
  /** Tailpipe or exhaust stack, or 'none'. */
  exhaust: ExhaustId | 'none';
  /** The horn: a sound only, no model. 'stock' = the vehicle's own honk. */
  horn: HornId;
}

export const WHEEL_SIZE_MIN = 0.8;
export const WHEEL_SIZE_MAX = 1.5;
export const CAMBER_MIN = -25;
export const CAMBER_MAX = 8;
export const MAX_EXTRAS = 4;

/** Named places on a vehicle where a fitting can go. All Vec3 in prefab-local space. A missing point means "this vehicle cannot take that". */
export type MountPointId = 'hood' | 'front' | 'rear' | 'seat' | 'top' | 'side' | 'dash';

export interface DecalPanel {
  id: 'left' | 'right' | 'hood' | 'rear';
  /** Centre of the panel, prefab-local. */
  at: Vec3;
  /** Width, height in prefab units. */
  size: readonly [number, number];
  /** DEGREES, x then y then z, applied to a plane that faces +z. A left flank faces +x: rot [0, 90, 0]; a hood faces up: rot [-90, 0, 0]. */
  rot: Vec3;
}

export interface SteerMount {
  /** Name of the prefab pivot the game turns (rotation.y = steer). */
  pivot: string;
  /** Where the left (+x) and right (-x) hands hold the wheel, prefab-local, at steer angle 0. The rig parents two Object3D markers under `pivot` so they turn with it. */
  grips: readonly [Vec3, Vec3];
}

/**
 * Where things go on one prefab. A game gives hand-tuned values with `defineMounts`; any prefab without them gets
 * `deriveMounts(body)`, a guess from its bounding box and its `wheel-0`..`wheel-3` / `steer` pivots, so a new game gets working mods for free.
 */
export interface VehicleMounts {
  /** Body width (x) in prefab units. A mod prefab is authored for a 1.2-wide vehicle and is scaled by width / 1.2. */
  width: number;
  /** Body length (z) and height (y), prefab units. */
  length: number;
  height: number;
  points: Partial<Record<MountPointId, Vec3>>;
  /** Left (+x) and right (-x) lamp positions where a lamp housing and its beam sit, facing +z. null: no lamps. */
  lamps: readonly [Vec3, Vec3] | null;
  steer: SteerMount | null;
  panels: readonly DecalPanel[];
  /** Pivots named 'wheel-0'..'wheel-3' that exist; wheel-2 and wheel-3 are the steered front pair. `index` = the wheel's number, `at` = the hub, prefab-local (the pivot's position), `side` = sign of at.x (+1 left). */
  wheels: readonly { index: number; pivot: string; front: boolean; side: 1 | -1; at: Vec3 }[];
  /**
   * Body travel for the ride-height slider, prefab units: rideHeight -1 sinks the body `down`, +1 lifts it `up`, in between is a straight
   * lerp. Optional: when missing, `down` comes from the stock wheel size (see maxDrop) and `up` is RIDE_TRAVEL.up.
   */
  ride?: { down: number; up: number };
}

export type GlazeMountsDef = Partial<VehicleMounts>;

/**
 * A GAME's own variant of a catalogue prefab, for when the stock steering assembly is out of a seated gnome's reach: drop the stock
 * column parts, and move the `steer` pivot and its wheel part to `wheelAt` (prefab-local). Registered through @lawn/prefabs `registerPrefab`
 * under id `${base}+glaze`; the catalogue prefab (and every other game's use of it) is untouched.
 */
export interface SteerVariant {
  /** The pivot group that holds the wheel or handlebars. Default 'steer' (a push-mower's bars are 'handle'). */
  pivot?: string;
  /** Indices into the base def's `parts` to remove (the old column, an old backrest...). */
  dropParts: readonly number[];
  /** New position of the pivot (for a steering wheel: the wheel's centre, a flat horizontal ring), prefab-local. The pivot and every part in its group move by (wheelAt - old pivot position). */
  wheelAt: Vec3;
  /** Foot of a new column that runs from here up to the wheel, prefab-local. Omit for no column. */
  columnBase?: Vec3;
  /**
   * Indices into the base def's `parts` that join the pivot's group, so a wheel modelled as a plain part (no pivot) turns with the steering.
   * When the base has no pivot of that name they move by (wheelAt - from).
   */
  groupParts?: readonly number[];
  /** Indices into the base def's `parts` that move with the control by the same offset but stay fixed (a column). */
  moveParts?: readonly number[];
  /** Where the control was in the base def, for a pivot the base does not have (groupParts and moveParts move by wheelAt - from). Default wheelAt: they stay put. */
  from?: Vec3;
  /** New parts added to the pivot's group (a stick, a yoke, a helm), `at` absolute prefab-local like every grouped part. */
  addParts?: readonly Part[];
}

export interface GlazeBodyOptions {
  /** Root scale (the game's VehicleSpec.scale). */
  scale?: number;
  /** Prefab damage level to build at. */
  damage?: number;
}

/** Body motion on its springs, relative to the wheels: heave in prefab units (+ = body up), pitch (+ = nose up) and roll (+ = right side down) in RADIANS. All 0 = at rest. */
export interface SuspensionState { heave: number; pitch: number; roll: number }

export interface GlazeRig {
  readonly prefabId: string;
  /** The loadout currently applied (a copy; change it through `set`). */
  readonly loadout: Loadout;
  /** Replace the loadout and re-apply. A change of ride height alone only moves the body shell (no rebuild), so a slider can call it every tick. */
  set(next: Loadout): void;
  /** The body travel the ride height lerps between, prefab units: rideHeight -1 = -down, +1 = +up. */
  readonly rideRange: { down: number; up: number };
  /** Re-apply the current loadout to the body's current children. Idempotent. Call after anything that rebuilt the body (setPrefabDamage). */
  apply(): void;
  /** Camber in RADIANS for wheel index 0..3 (the front pair is 2 and 3). Feed it to setWheelPose. */
  camberOf(wheel: number): number;
  /**
   * How far the body shell, the seat and the steering wheel sit above (+) or below (-) stock, in the body root's PARENT space
   * (prefab units x the root's scale): add it to a seat position's y. 0 when stock.
   */
  readonly seatLift: number;
  /** The fitted seat cover's sitting surface: top centre in the root's parent space (scaled like seatLift, ride offset NOT included). null without a cover. */
  readonly seatCover: [number, number, number] | null;
  /** Stable group holding the lamp beams and glow; hidden until setLightsOn(true). Its identity never changes (it is re-attached by apply()). */
  readonly lights: THREE.Group;
  setLightsOn(on: boolean): void;
  /** Two markers under the steering pivot (left hand, right hand) that turn with the wheel; null when the vehicle has no steering mount. They are replaced by apply(): read this getter each frame. */
  readonly grips: { left: THREE.Object3D; right: THREE.Object3D } | null;
  /** Move the body shell on its springs (see SuspensionState); the wheels stay on the ground, so the body visibly rises and falls over them. Cheap: call it every frame. */
  setSuspension(s: SuspensionState): void;
  /** Per-frame animation (underglow pulse, spinner rims). */
  update(dt: number): void;
  /** Remove everything the rig added. Shared geometry and materials are never disposed. */
  dispose(): void;
}
