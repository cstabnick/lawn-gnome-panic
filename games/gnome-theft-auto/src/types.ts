// Shared types for Gnome Theft Auto. Every module imports its contracts from here.
// Coordinates: y is up, 1 unit = one gnome's height. Yaw 0 faces +z; forward = (sin yaw, 0, cos yaw).
// Turning right (clockwise seen from above) DECREASES yaw. The camera sits behind, so screen-right is the gnome's right.
import type * as THREE from 'three';
import type { GnomeLook, GnomeModel } from '@lawn/gnome';
import type { SimDrive } from './simdrive';

export type VehicleKind = 'push-bike' | 'ride-on' | 'zero-turn' | 'combine' | 'whirligig' | 'plane';
export type GunKind = 'pistol' | 'smg' | 'shotgun' | 'rifle';
export type BiomeId = 'city' | 'desert' | 'forest' | 'tundra' | 'farmland';

/** Static collider: an axis-aligned box on the ground, h tall. Flyers above h pass over it. */
export interface Box { minX: number; maxX: number; minZ: number; maxZ: number; h: number }

export interface RoadNode { id: number; x: number; z: number; links: number[] }
export interface RoadGraph {
  nodes: RoadNode[];
  /** Traffic drives this far to the right of a road's centre line. */
  laneOffset: number;
}

export interface FortSandpit {
  /** Fence rectangle of the base (in the desert). Being inside it is trespassing. */
  minX: number; maxX: number; minZ: number; maxZ: number;
  /** Where the Whirligig is parked. */
  padX: number; padZ: number;
  /** Gate gap in the fence (centre). */
  gateX: number; gateZ: number;
  /** Where Spade Guard sentries stand. */
  guardPosts: { x: number; z: number }[];
}

export interface ParkedSpot { x: number; z: number; yaw: number; kind: VehicleKind }

/** The desert airfield (see AIRFIELD in config.ts). The runway runs along `yaw` (forward = (sin yaw, cos yaw)). */
export interface Airfield {
  x: number; z: number; yaw: number; length: number; width: number;
  /** Where the planes are parked (kind 'plane'). */
  planeSpots: ParkedSpot[];
}

export interface World {
  /** Every static collider: buildings, walls, fences, big props. */
  boxes: Box[];
  roads: RoadGraph;
  /** Points on sidewalks and plazas that pedestrians wander between. */
  walkPoints: { x: number; z: number }[];
  /** Player start (on a sidewalk). */
  spawn: { x: number; z: number; yaw: number };
  /** Where a cracked player wakes up: on the pavement outside the Glaze Clinic Hospital. */
  hospital: { x: number; z: number; yaw: number };
  /** Parked, empty mowers to steal (not including the Whirligig, which main parks on base.pad). */
  parked: ParkedSpot[];
  base: FortSandpit;
  /** The playable area is x, z in [-half, half]. */
  half: number;
  /** Which biome a point is in (the pure function `biomeAt` from config.ts). */
  biomeAt(x: number, z: number): BiomeId;
  airfield: Airfield;
  /** Animate scenery (flags, sprinklers) and keep the sun's shadow box centred on (focusX, focusZ), the player. */
  update(dt: number, focusX: number, focusZ: number): void;
}

export interface VehicleSpec {
  kind: VehicleKind;
  name: string;
  /** @lawn/prefabs id built for the body. */
  prefab: string;
  /** Scale applied to the prefab model (the root stays unscaled). */
  scale: number;
  /** Forward top speed, units/s. Reverse is 40% of it. */
  maxSpeed: number;
  accel: number;
  /** Turn rate at full steer, radians/s (ground vehicles scale it down at very low speed). */
  turnRate: number;
  /** Collision circle radius. */
  radius: number;
  /** Where the rider's feet go, in the vehicle root's local space (after scaling). */
  seat: [number, number, number];
  flies: boolean;
  /** Heavier pushes lighter in vehicle-vehicle bumps. */
  mass: number;
  /** Fixed-wing (a plane): needs forward speed to fly, stalls below stallSpeed, cannot hover. flies is true too. */
  fixedWing?: boolean;
  /** Fixed-wing: minimum airspeed to climb and stay up, units/s. */
  stallSpeed?: number;
  /** Highest altitude; FLY.ceiling when absent. */
  ceiling?: number;
}

export type Driver = 'none' | 'player' | 'npc' | 'remote';

export interface Vehicle {
  id: number;
  kind: VehicleKind;
  spec: VehicleSpec;
  x: number; y: number; z: number;
  yaw: number;
  /** Signed forward speed, units/s. */
  speed: number;
  /** Vertical speed (flyers). */
  vy: number;
  driver: Driver;
  tint: number;
  /** Unscaled root; the scaled prefab model is a child. syncVehicleMesh positions it. */
  object: THREE.Group;
  /** Seated gnome model shown on the vehicle (NPC driver), or null. Added to `object` at spec.seat. */
  rider: GnomeModel | null;
  riderLook: GnomeLook | null;
  /** Animation accumulators. */
  wheelSpin: number;
  steerVis: number;
  /** Set while the player drives this vehicle under ?drive=sim: the @lawn/vehicle chassis. Cleared on exit. */
  sim?: SimDrive;
  /** Hit points 0..1 (1 = new). Crashes take them off; the prefab's damage level follows (see vehicles.ts). */
  hp: number;
  /** Applied prefab damage level, 0 = new. */
  damage: number;
  /** True once shot to pieces: charred black, burning, undrivable. */
  exploded?: boolean;
  /** performance.now() of the last vehicle-vehicle hit, so one bump is not charged every frame. */
  lastHit: number;
}

/** Per-frame driving controls. throttle -1..1 (back..forward), steer -1..1 (+1 = right), lift -1..1 (flyers: down..up). */
export interface DriveControls { throttle: number; steer: number; lift: number }

export interface InputState {
  /** -1 left .. +1 right (walk strafe / steer). */
  moveX: number;
  /** -1 back .. +1 forward (walk / throttle). */
  moveY: number;
  /** -1 down .. +1 up (flyers). */
  lift: number;
  /** Edge: pressed since the last read. */
  jump: boolean;
  /** Held. */
  fire: boolean;
  /** Edge. Enter or leave a vehicle. */
  enterExit: boolean;
  /** Edge. Next gun. */
  switchGun: boolean;
  /** Edge. Reload now (a gun also reloads by itself when its magazine is empty). */
  reload: boolean;
  /** Camera orbit deltas since the last read, radians (mouse drag / right-side touch drag). +camYaw = orbit left. */
  camYaw: number;
  camPitch: number;
  /** True when a gamepad is the device being used this frame (the sim treats its steering as analog, not as keys). */
  pad?: boolean;
}

export interface Input {
  /** Returns the state and clears the edge flags and camera deltas. */
  read(): InputState;
  /** Show the touch buttons that fit: on foot (Jump, Fire, Swap, Enter), driving (Fire, Exit), flying (Up, Down, Fire, Exit). */
  setMode(mode: CameraMode): void;
  /** Change the label of the touch enter/exit button (e.g. "Steal", "Exit", hidden when null). */
  setEnterLabel(label: string | null): void;
}

/** 'chute' is free fall and parachuting (the touch controls match 'foot', without Jump). */
export type CameraMode = 'foot' | 'drive' | 'fly' | 'chute';

export interface ChaseCamera {
  /** Current orbit yaw (world). The camera looks along (sin yaw, 0, cos yaw). Walking is relative to it. */
  yaw: number;
  pitch: number;
  update(dt: number, target: { x: number; y: number; z: number }, targetYaw: number, mode: CameraMode, input: InputState, world: World): void;
  /** Unit vector of the camera's forward direction (the crosshair ray goes from the camera along it). */
  aimDir(out: THREE.Vector3): THREE.Vector3;
  /** Kick the view up by `pitch` radians (gun recoil); it settles back by itself within a fraction of a second. */
  kick(pitch: number): void;
}

export interface Player {
  x: number; y: number; z: number;
  yaw: number;
  vy: number;
  grounded: boolean;
  /** 1 = dry, 0 = Washed Out. */
  health: number;
  vehicle: Vehicle | null;
  model: GnomeModel;
  /** Walk relative to camYaw, jump, collide with world.boxes and bounds, animate the model. */
  updateFoot(input: InputState, camYaw: number, dt: number, world: World): void;
  /** Keep the model seated on this.vehicle (sitting pose). */
  updateRiding(dt: number): void;
  enter(v: Vehicle): void;
  /** Leave the vehicle; stand at its left side. */
  exit(): void;
  /** Take `amount` damage (0..1 of full health). */
  hurt(amount: number): void;
  /** Put the gnome back on its feet at (x, z), whole again, out of any vehicle. */
  respawn(x: number, z: number, yaw: number): void;
  /** True from bailing out of a flyer until the feet touch the ground. main calls updateAir (not updateFoot) while true. */
  airborne: boolean;
  /** Canopy openness 0 (stowed) .. 1 (open). Free fall is airborne with chute 0. */
  chute: number;
  /** Leave a flyer v in mid-air (v.y > BAIL_MIN_ALTITUDE): start at the seat, falling, vehicle left empty. */
  bail(v: Vehicle): void;
  /**
   * Free fall and parachute (CHUTE in config.ts): gravity to terminalFall, the chute opens by itself after deployDelay
   * if y > minDeployAltitude, then descend at CHUTE.descend and glide with the stick (camera-relative). Collide with
   * world.boxes like updateFoot. Landing ends it (airborne = false, chute = 0); a hard landing without a canopy
   * hurts the gnome by CHUTE.hardLandingDamage. Animates the model (arms up on the canopy, a canopy prefab above the head).
   */
  updateAir(input: InputState, camYaw: number, dt: number, world: World): void;
  /** The right arm group; the held gun is attached here. */
  hand(): THREE.Object3D;
  /** World position of the gun muzzle (or the gnome's chest when no gun is visible). */
  muzzle(out: THREE.Vector3): THREE.Vector3;
}

/** Returns true when something absorbed the bullet at (x, y, z) (the bullet is removed). */
export type HitTest = (x: number, y: number, z: number) => boolean;

export interface Fx {
  /** A gnome cracks apart at (x, y, z): a burst of clay shards that tumble and settle, then fade. `color` tints some of them. */
  crack(x: number, y: number, z: number, color?: number): void;
  /** One frame's worth of flame and smoke rising from (x, y, z); call it every frame (or two) for a burning wreck. */
  fire(x: number, y: number, z: number, spread?: number): void;
  /** A vehicle blows up: flashes, a ball of fire and smoke, sparks and charred shards. */
  explode(x: number, y: number, z: number): void;
  /** A bullet tracer line from a to b that fades in BULLET.tracerLife seconds. */
  tracer(ax: number, ay: number, az: number, bx: number, by: number, bz: number): void;
  /** A short muzzle flash at (x, y, z). */
  flash(x: number, y: number, z: number): void;
  /** A bullet impact: sparks and a puff at (x, y, z). */
  spark(x: number, y: number, z: number): void;
  update(dt: number): void;
}

export interface Weapons {
  gun: GunKind;
  /** Rounds left in the magazine. */
  ammo: number;
  /** Magazine size of the current gun (GUNS[gun].mag). */
  mag: number;
  /** True while a reload is running (the gun cannot fire). */
  reloading: boolean;
  /** Show the held gun on this hand object. */
  attachTo(hand: THREE.Object3D): void;
  setVisible(v: boolean): void;
  switchGun(): void;
  /** Start a reload (no-op if full or already reloading). */
  reload(): void;
  /**
   * Fire if `trigger` is held (auto guns) or was pressed this frame (semi guns: the caller passes the held state; the
   * weapon detects the rising edge itself), the magazine has rounds and no reload runs; reload by itself when empty.
   * A bullet is a hitscan ray from the CROSSHAIR: it starts at `camOrigin` advanced to the muzzle's depth and goes along
   * `camDir` (with the gun's spread), stepping BULLET.stepLength through `hitTest` and the world's boxes and the ground
   * up to GUNS[gun].range. The tracer is drawn from `muzzle` to the hit point. Returns the number of bullets that hit
   * something hittable (hitTest returned true) this frame.
   */
  update(
    dt: number, trigger: boolean, muzzle: THREE.Vector3, camOrigin: THREE.Vector3, camDir: THREE.Vector3,
    hitTest: HitTest, world: World,
  ): number;
}

export type NpcState = 'walk' | 'idle' | 'flee' | 'ragdoll';

export interface Npc {
  id: number;
  name: string;
  x: number; z: number;
  yaw: number;
  state: NpcState;
  /** Seconds of fleeing left. */
  fleeTime: number;
  /** Where the scare came from (flee away from it). */
  fromX: number; fromZ: number;
  targetX: number; targetZ: number;
  look: GnomeLook;
  model: GnomeModel;
  /** Ignores the scare of a speeding vehicle (the ragdoll demo's crowd stands its ground). */
  calm?: boolean;
}

export interface Npcs {
  list: Npc[];
  update(dt: number, world: World, playerX: number, playerZ: number, vehicles: Vehicle[]): void;
  /** Nearest pedestrian whose body (radius 0.45, y 0..1.1) contains the point, or null. */
  hitTest(x: number, y: number, z: number): Npc | null;
  /** Crack a shot pedestrian apart (shards fly) and send a fresh townsgnome wandering in near (playerX, playerZ). */
  crack(npc: Npc, playerX: number, playerZ: number): void;
  /** A new pedestrian already fleeing with its hands up (a driver pulled off a stolen mower). */
  spawnFleeing(x: number, z: number, fromX: number, fromZ: number, look: GnomeLook | null): Npc;
  /**
   * Fling a pedestrian: it goes limp (state 'ragdoll', a verlet skeleton drives the model) with velocity (vx, vy, vz) and
   * a tumble of `spin`, and gets up and flees a couple of seconds after it stops. Hitting one that is already down
   * juggles it. Returns true when this knock put a standing gnome on the ground.
   */
  knock(npc: Npc, vx: number, vy: number, vz: number, spin: number, fromX: number, fromZ: number): boolean;
  /** Called when a fast vehicle flattens a standing pedestrian (the vehicle's driver is whoever is at its wheel). */
  onRunOver: ((npc: Npc, vehicle: Vehicle) => void) | null;
}

export interface Traffic {
  /** Spawn NPC-driven mowers into `vehicles` (up to TRAFFIC_COUNT), drive every driver==='npc' vehicle along the roads. */
  update(dt: number, vehicles: Vehicle[], world: World, playerX: number, playerZ: number): void;
  /** The NPC driver leaves v (rider model removed, v.driver = 'none'). Returns where they stand and their look, or null if none. */
  ejectDriver(v: Vehicle): { x: number; z: number; look: GnomeLook } | null;
}

export interface WatchContext {
  playerX: number; playerY: number; playerZ: number;
  playerVehicle: Vehicle | null;
}

export interface Watch {
  /** 0..MAX_HEAT, fractional. Level shown = Math.floor(heat). */
  heat: number;
  addHeat(amount: number): void;
  clear(): void;
  /** Officers chase and spray when heat >= 1; Spade Guards defend Fort Sandpit. Returns the damage to apply to the player this frame (already * dt). */
  update(dt: number, ctx: WatchContext, world: World): number;
  /** Officer or guard hit by a bullet at the point, or null. */
  hitTest(x: number, y: number, z: number): Npc | null;
  /** A bullet hits an officer/guard. Returns true when it cracked them apart (an officer is gone, a guard is back at its post). */
  crack(officer: Npc): boolean;
}

export interface Blip { x: number; z: number; color: string }

export interface HudState {
  /** 0..3 watch level. */
  heat: number;
  /** 0..1. */
  health: number;
  /** Rounds in the magazine and the magazine size. */
  ammo: number;
  mag: number;
  reloading: boolean;
  gun: string;
  /** Vehicle name while driving, else null. */
  vehicle: string | null;
  /** Gnomes cracked this session. */
  cracked: number;
  /** Prompt like "E / 🚜: Steal Ride-On Mower", or null. */
  prompt: string | null;
  player: { x: number; z: number; yaw: number };
  /** Altitude (units above the ground) while flying or falling, else null. */
  altitude: number | null;
  /** Ground speed (units/s) while driving or flying, else null. */
  speed: number | null;
  /** True under an open parachute. */
  chute: boolean;
  /** Display name of the biome the player is in. */
  biome: string;
  blips: Blip[];
  online: string | null;
}

export interface Hud {
  /** Give the minimap the world (roads, biomes, base, airfield). Call once after buildWorld. */
  setWorld(world: World): void;
  set(s: HudState): void;
  toast(text: string, ms?: number): void;
  /** A big centred banner (WASHED OUT, WHIRLIGIG STOLEN). */
  banner(text: string, ms?: number): void;
}

export type Sfx = 'squirt' | 'crack' | 'steal' | 'door' | 'alarm' | 'whistle' | 'washed' | 'bump' | 'gunshot' | 'shotgun' | 'reload' | 'chute' | 'handbrake' | 'handbrake-release' | 'boom';
