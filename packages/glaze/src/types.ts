// @lawn/glaze types. Everything a game stores or sends is the plain-data `Loadout`; everything three.js is behind `GlazeRig`.
//
// Conventions (same as the prefab library): prefab-local coordinates are in the prefab's own units BEFORE any root scale; the front is +z;
// +x is the vehicle's LEFT (three.js), so a "left" thing sits at +x and a "right" thing at -x; rotations in a data table are DEGREES.
import type * as THREE from 'three';
import type { Vec3 } from '@lawn/prefabs';
import type {
  BEAM_IDS, DECAL_IDS, EXTRA_IDS, FINISH_IDS, LAMP_IDS, ORNAMENT_IDS, RIM_IDS, SEAT_IDS, SPOILER_IDS, STEER_IDS, TYRE_IDS,
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

/** Which shop shelf a catalogue entry is on. */
export type SlotId = 'finish' | 'decal' | 'tyre' | 'rim' | 'steer' | 'lamp' | 'beam' | 'spoiler' | 'seat' | 'ornament' | 'extra';

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
}

export interface GlazeBodyOptions {
  /** Root scale (the game's VehicleSpec.scale). */
  scale?: number;
  /** Prefab damage level to build at. */
  damage?: number;
}

export interface GlazeRig {
  readonly prefabId: string;
  /** The loadout currently applied (a copy; change it through `set`). */
  readonly loadout: Loadout;
  /** Replace the loadout and re-apply. */
  set(next: Loadout): void;
  /** Re-apply the current loadout to the body's current children. Idempotent. Call after anything that rebuilt the body (setPrefabDamage). */
  apply(): void;
  /** Camber in RADIANS for wheel index 0..3 (the front pair is 2 and 3). Feed it to setWheelPose. */
  camberOf(wheel: number): number;
  /**
   * How far the body shell, the seat and the steering wheel sit above (+) or below (-) stock, in the body root's PARENT space
   * (prefab units x the root's scale): add it to a seat position's y. 0 when stock.
   */
  readonly seatLift: number;
  /** Stable group holding the lamp beams and glow; hidden until setLightsOn(true). Its identity never changes (it is re-attached by apply()). */
  readonly lights: THREE.Group;
  setLightsOn(on: boolean): void;
  /** Two markers under the steering pivot (left hand, right hand) that turn with the wheel; null when the vehicle has no steering mount. They are replaced by apply(): read this getter each frame. */
  readonly grips: { left: THREE.Object3D; right: THREE.Object3D } | null;
  /** Per-frame animation (underglow pulse, spinner rims). */
  update(dt: number): void;
  /** Remove everything the rig added. Shared geometry and materials are never disposed. */
  dispose(): void;
}
