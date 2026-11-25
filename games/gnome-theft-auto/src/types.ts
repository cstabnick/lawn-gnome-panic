// Shared types for Gnome Theft Auto. Every module imports its contracts from here.
// Coordinates: y is up, 1 unit = one gnome's height. Yaw 0 faces +z; forward = (sin yaw, 0, cos yaw).
// Turning right (clockwise seen from above) DECREASES yaw. The camera sits behind, so screen-right is the gnome's right.
import type * as THREE from 'three';
import type { GnomeLook, GnomeModel } from '@lawn/gnome';
import type { SimDrive } from './simdrive';
import type { MountPose } from './mount';
import type { GlazeRig, Loadout } from '@lawn/glaze';
import type { GunLoadout, ModdedGun } from './gunMods';
import type { AirSpec, AirState } from './craft/model';
import type { SkimState } from './skim';

export type VehicleKind =
  | 'push-bike'
  | 'ride-on'
  | 'zero-turn'
  | 'combine'
  | 'whirligig'
  | 'plane'
  | 'lowrider'
  | 'boot-float'
  | 'snail-coach'
  | 'mulch-spreader'
  | 'hoa-van'
  // Boats (Epic 4): spec.boat is true; boats.ts drives them.
  | 'walnut-dinghy'
  | 'gravy-boat'
  | 'clog-cruiser'
  | 'watering-can-steamer'
  | 'hoa-patrol-boat'
  // Tessie (Wild World Epic 7): the loch's giant turtle, ridden like a boat (spec.boat). Spawned only by the Tessie quest and world event.
  | 'tessie'
  // The Turfton Taxi (taxi.ts): summoned by the player, drives them back to the Central Bus Stop. Never parked or in traffic.
  | 'taxi'
  // Odd rides: slow, impractical garden-scale vehicles that turn up in ambient traffic (config.ts VEHICLES).
  | 'pot-rod'
  | 'lawn-roller'
  | 'teacup-trundler'
  | 'barrow-buggy'
  // The Putting-Green Cart (fleet.ts): the Country Club's golf cart, parked now and then in place of a ride-on.
  | 'golf-cart'
  // Air and sea (craft/, docs/roadmaps/gta-air-and-sea.md): spec.air set, craft/flight.ts stepAir flies them.
  | 'hedge-hopper'
  | 'sycamore-copter'
  | 'dandelion-drifter'
  // Tubing (tubing/, docs/roadmaps/gta-sim-jobs-and-tubing.md): an inflatable tube towed behind a boat, or paddled.
  | 'tow-tube'
  // E11 coast (tubing/ ski mode, coast/spokewheel.ts): water-skis towed behind a boat; a Spokewheel gondola the player
  // rides as a passenger (the coast runtime moves it, nothing to steer).
  | 'tow-ski'
  | 'spoke-gondola'
  // European rides (E29, euroRides.ts; prefabs in packages/prefabs/src/catalog/gta-euro-fleet*.ts): small city vehicles of the
  // European yard. In town traffic now and then, mostly European inside the zone E28/E30 register with setEuroZone.
  | 'euro-hatch'
  | 'deux-pots'
  | 'wespa'
  | 'baguette-trike'
  | 'crepe-van'
  // Winter sports (E12, winter/): a tea-tray sled and a pair of skis on Snowdrop Slope; winter/runtime.ts steps them (slideRider.ts).
  | 'tea-tray-sled'
  | 'snow-skis'
  // Dirt country (E14): the Knobbly Dirt-Mower.
  | 'dirt-bike';
export type GunKind =
  | 'pistol'
  | 'smg'
  | 'shotgun'
  | 'rifle'
  | 'leaf-blower'
  | 'acorn-mortar'
  | 'tow-whip'
  | 'dandelion-grenade'
  | 'trip-mine';
/** loch = Loch Moss (north-west corner), parkland = Tallgrass Commons (south-west corner). Same strings as levels.ts RegionBiome. */
export type BiomeId = 'city' | 'desert' | 'forest' | 'tundra' | 'farmland' | 'loch' | 'parkland' | 'highland' | 'coast' | 'campus' | 'estate'
  | 'continental' | 'preserve';

/** Static collider: an axis-aligned box on the ground, h tall. Flyers above h pass over it. */
/**
 * A collider: an axis-aligned box from minX..maxX, minZ..maxZ, up to height h. With `shape: 'round'` it is a vertical
 * cylinder instead, centred on the box centre with radius min(width, depth) / 2 (make one with `roundBox` in collide.ts):
 * round prefabs (trunks, silos, towers, fountains) then do not snag a vehicle on a square corner padded to the diagonal.
 * Code that reads the min/max fields directly still sees the bounding square, which is the conservative answer.
 */
export interface Box { minX: number; maxX: number; minZ: number; maxZ: number; h: number; shape?: 'round' }

/** One placed vending machine. `object` is the prefab group (origin on the ground, rotation.y = yaw, front/chute on its local +z); `box` is its collider in world.boxes. */
export interface VendingSpot {
  x: number;
  z: number;
  yaw: number;
  /** What it sells: 'cola' = Acorn-Cola (prefab gta-vending-cola), 'fizz' = Dandelion Fizz (gta-vending-fizz). */
  brand: 'cola' | 'fizz';
  object: THREE.Group;
  box: Box;
}

export interface RoadNode {
  id: number; x: number; z: number; links: number[];
  /** Set on a node on an elevated deck: that skyway's id (highways/roads.ts). Unset = a ground node. Its height is
   *  nodeY(n) (deck top or land); use nearestRoadNode / roadY there rather than a 2D search and heightAt. */
  deck?: string;
  /** Set on a node on a roundabout ring (roundabouts.ts): the ring's road path id. */
  ring?: string;
  /** Neighbour ids this node may not be driven to (a one-way ring link the wrong way; roundabouts.ts canDrive). The
   *  link itself stays in `links` both ways (drawing, segment lists); only driving and route search skip it. */
  noDrive?: number[];
}
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

export interface DewBarrel {
  x: number;
  y: number;
  z: number;
  mesh?: THREE.Object3D;
  blown: boolean;
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
  /** Shootable Black Dew barrels placed in biomes. */
  dewBarrels?: DewBarrel[];
  /** Downtown vending machines (world.ts scatterVendingMachines); vending.ts wobbles them and spills cans when a vehicle hits one. */
  vending?: VendingSpot[];
  /** Lighting refs for dynamic day/night atmosphere. */
  sun?: THREE.DirectionalLight;
  hemi?: THREE.HemisphereLight;
  /** Animate scenery (flags, sprinklers) and keep the sun's shadow box centred on (focusX, focusZ), the player. */
  update(dt: number, focusX: number, focusZ: number, nightFactor?: number): void;
  /** Step roadside mushroom streetlamp ragdolls & check vehicle collisions. */
  updateLamps?(dt: number, vehicles: Vehicle[], playerX: number, playerZ: number, fx?: Fx, play?: (sfx: Sfx) => void): void;
  /** Test a projectile hit against roadside mushroom streetlamps. */
  hitLamp?(x: number, y: number, z: number, fx?: Fx, play?: (sfx: Sfx) => void): boolean;
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
  /** Passenger seats for online riders (seat 1 is [0]), same space as `seat`. Absent: the driver rides alone. */
  passengerSeats?: [number, number, number][];
  flies: boolean;
  /** Heavier pushes lighter in vehicle-vehicle bumps. */
  mass: number;
  /** Fixed-wing (a plane): needs forward speed to fly, stalls below stallSpeed, cannot hover. flies is true too. */
  fixedWing?: boolean;
  /** Fixed-wing: minimum airspeed to climb and stay up, units/s. */
  stallSpeed?: number;
  /** Highest altitude; FLY.ceiling when absent. */
  ceiling?: number;
  /** Open to the sky (a mower, plane or float): a gnome climbs in over the rim from any side. Default true. */
  openTop?: boolean;
  /** Closed vehicles (openTop false): the doors a gnome gets in and out through. Each door's `at` is its centre in root space (scaled). */
  doors?: readonly MountDoor[];
  /** How a gnome gets in and out (mount.ts MOUNT_STYLES). Default: 'vault' for open-top, 'door' for closed. */
  mountStyle?: MountStyle;
  /** A boat (boats.ts stepBoat drives it, it floats on waterAt). */
  boat?: boolean;
  /** The rider stands instead of sitting (skis, E12): player.ts draws the gnome upright at the seat. */
  stand?: boolean;
  /** Boats: how deep the hull sits below the water surface, metres (the prefab's y = 0 is the keel). */
  draft?: number;
  /** Aircraft on the air-and-sea handling model (craft/flight.ts stepAir): its regime and numbers. flies is true too. The
   *  older Crop Duster ('plane') and Whirligig keep their own code paths and have no `air`. */
  air?: AirSpec;
}

export type MountStyle = 'vault' | 'hop' | 'clamber' | 'door';

export interface MountDoor {
  /** Which side of the vehicle (left = +x in root space, right = -x). */
  side: 'left' | 'right';
  /** Named pivot in the prefab that hinges the door (the door panel is a part of this group). */
  pivot: string;
  /** Centre of the door opening, in root space (after scaling). */
  at: [number, number, number];
}

export type Driver = 'none' | 'player' | 'npc' | 'remote' | 'police';

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
  /** Set while the player drives this ground vehicle with the physics model (any driving mode but Arcade): the @lawn/vehicle chassis. Cleared on exit. */
  sim?: SimDrive;
  /** Hit points 0..1 (1 = new). Crashes take them off; the prefab's damage level follows (see vehicles.ts). */
  hp: number;
  /** Applied prefab damage level, 0 = new. */
  damage: number;
  /** True once shot to pieces: charred black, burning, undrivable. */
  exploded?: boolean;
  /** performance.now() of the last vehicle-vehicle hit, so one bump is not charged every frame. */
  lastHit: number;
  /** Slide and turn from a bump (vehicles.ts collideVehicles), decaying; set only while a vehicle is still moving from one. */
  knock?: { x: number; z: number; spin: number };
  /** Lowrider hydraulic hop cooldown, seconds. */
  hopT?: number;
  /** Lowrider shock-absorption flag for porcelain escort quests. */
  shockAbsorb?: boolean;
  /** Mulch-spreader slick drop cooldown, seconds. */
  slickCooldown?: number;
  /** Boot-float confetti horn cooldown, seconds. */
  hornCooldown?: number;
  /** True for quest/event-controlled NPC vehicles so ambient traffic.ts never hijacks or recycles them. */
  questOwned?: boolean;
  /**
   * E23 L101: the player's quest ride (quests/questPins.ts setRide): traffic cleanup never removes it while the quest
   * runs. Unlike questOwned it does not make the vehicle "spoken for" (the player can still store it in the Lock-Up).
   */
  questPinned?: boolean;
  /** Nitro boost meter (0..100) and active state. */
  boost?: number;
  boostActive?: boolean;
  /** Lateral slide velocity from drifting/slicks. */
  slideX?: number;
  slideZ?: number;
  /** Headlight group toggled at dusk/night. */
  headlights?: THREE.Object3D;
  /** Boats only: the hull's float state (boats.ts). */
  boat?: BoatState;
  /** A ground vehicle that drove into deep water: conked out, on the bed, undrivable until it comes back (swim.ts / vehicles.ts). */
  sunk?: boolean;
  /** Seconds since it sank. */
  sunkT?: number;
  /** Where it was created (a sunk mower comes back here). */
  home?: { x: number; z: number; yaw: number };
  /** Pay 'n' Glaze: what this vehicle is dressed in (paint, wheels, lamps...). Always set on a ground vehicle; `look.paint` is `tint`. See vehicles.ts setVehicleLook. */
  look?: Loadout;
  /** The @lawn/glaze rig dressing `object`'s body. Ground vehicles only; replaced when the body is rebuilt. */
  rig?: GlazeRig;
  /** Engine pitch multiplier (1 = the model's stock note). Every mower gets a slightly different one; fleet.ts variants a bigger spread. */
  enginePitch?: number;
  /** fleet.ts variant id this vehicle was spawned as (absent: a plain stock vehicle). */
  variant?: string;
  /** How much water the engine has taken on, 0 (dry) .. 1 (flooded). waterlog.ts soaks and dries it. */
  waterlog?: number;
  /** True while flooded: the engine has stalled and gives no drive until it dries below WATERLOG.restartAt. */
  waterlogStalled?: boolean;
  /** Skimming across deep water at speed (skim.ts, E27 L114). Absent, or active: false, when not skimming. */
  skim?: SkimState;
  /** Aircraft with spec.air: attitude and flight state (craft/flight.ts). Created by createVehicle. */
  air?: AirState;
}

/** A boat hull's float state, kept by boats.ts stepBoat. pitch and roll are radians (pitch + = nose up, roll + = right side down). */
export interface BoatState {
  pitch: number;
  roll: number;
  /** Vertical speed, m/s. */
  vy: number;
  /** Sideways slip speed, m/s (+ = to the boat's right). */
  slip: number;
  /** True while the water under the hull is shallower than WATER.boat.beachDepth (or there is none). */
  beached: boolean;
  /** Waves (craft/hull.ts): seconds the hull has been clear of the water (0 or absent = afloat). */
  air?: number;
  /** Waves: downward speed (m/s) of the landing this step after airtime, else 0. Effects read it (splash, slam, shake). */
  slam?: number;
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
  /** Edge. Turn Turfton FM's dial one step (main.ts ignores it unless the player is driving or flying). */
  radio: boolean;
  /** Edge. Shout out the current radio banger to other online players. */
  banger?: boolean;
  /** Camera orbit deltas since the last read, radians (mouse drag / right-side touch drag). +camYaw = orbit left. */
  camYaw: number;
  camPitch: number;
  /** True when a gamepad is the device being used this frame (the sim treats its steering as analog, not as keys). */
  pad?: boolean;
  /** Held. Nitro boost while driving. */
  boost?: boolean;
  /** Edge. Sound vehicle horn. */
  horn?: boolean;
  /** Held. Aim down sights (right mouse held, the touch Aim toggle, gamepad left trigger on foot). */
  aim?: boolean;
}

export interface Input {
  /** Returns the state and clears the edge flags and camera deltas. */
  read(): InputState;
  /** Hide or show the touch controls (hidden during cutscenes). */
  setVisible(visible: boolean): void;
  /** Show the touch buttons that fit: on foot (Jump, Fire, Swap, Enter), driving (Fire, Exit), flying (Up, Down, Fire, Exit). */
  setMode(mode: CameraMode): void;
  /** Re-apply the current mode's buttons (the driving model changed, so the Handbrake button may need to appear or go). */
  refresh(): void;
  /** Change the label of the touch enter/exit button (e.g. "Steal", "Exit", hidden when null). */
  setEnterLabel(label: string | null): void;
}

/** 'chute' is free fall and parachuting (the touch controls match 'foot', without Jump). */
export type CameraMode = 'foot' | 'drive' | 'fly' | 'chute';

export interface ChaseCamera {
  /** Current orbit yaw (world). The camera looks along (sin yaw, 0, cos yaw). Walking is relative to it. */
  yaw: number;
  pitch: number;
  update(
    dt: number,
    target: { x: number; y: number; z: number },
    targetYaw: number,
    mode: CameraMode,
    input: InputState,
    world: World,
    extra?: { boost?: boolean; airborne?: boolean; eye?: { x: number; y: number; z: number } },
  ): void;
  // update: `extra.eye` is the world point of the gnome's eyes (on foot: head height; seated: the seat plus head height).
  // While firstPerson is on and eye is given, the camera sits there; without eye it falls back to the chase view.
  /** Unit vector of the camera's forward direction (the crosshair ray goes from the camera along it). */
  aimDir(out: THREE.Vector3): THREE.Vector3;
  /** Kick the view up by `pitch` radians (gun recoil); it settles back by itself within a fraction of a second. */
  kick(pitch: number): void;
  /** Add camera trauma shake (decays smoothly). Scaled inside by SHAKE_SCALE and the Options "Screen shake" level (viewPrefs.ts). */
  shake?(amount: number): void;
  /**
   * First-person view on or off (the V key, the eye touch button and the Options row drive it through app.ts). While on,
   * `update` places the camera at the gnome's eyes (or the driver's seat) instead of the chase position. Cutscenes, the
   * showroom and mount sequences call setFirstPerson(false) / restore it themselves.
   */
  setFirstPerson(on: boolean): void;
  /** True while the first-person view is on. */
  readonly firstPerson: boolean;
  /** Orbit this showroom target (the Pay 'n' Glaze shop's vehicle) while set; null returns to the normal views. */
  /** Orbit this target (the Pay 'n' Glaze showroom). `centered` keeps it mid-screen (no room made for the shop sheet); `distance` overrides the orbit distance. null leaves the showroom. */
  showroom(target: { x: number; y: number; z: number; radius: number; centered?: boolean; distance?: number } | null): void;
  /** True while a showroom target is set. */
  readonly showroomActive: boolean;
  /**
   * Aim down sights, every frame: t = aim blend 0..1 (0 = normal view), zoom = total field-of-view divisor at full aim (aimZoom at t = 1).
   * Foot view only: closer, tighter over the shoulder, narrower lens, slower look. Ignored in the other modes and in the showroom.
   */
  setAim(t: number, zoom: number): void;
}

export interface Player {
  x: number; y: number; z: number;
  yaw: number;
  vy: number;
  grounded: boolean;
  /** 1 = dry, 0 = Washed Out. */
  health: number;
  /** Jump speed multiplier this frame (bag fun items, fizz). Absent = 1. */
  jumpMult?: number;
  vehicle: Vehicle | null;
  /** The seat in `vehicle`: 0 = driver, 1.. = a passenger seat (see seats.ts). */
  seat: number;
  model: GnomeModel;
  /** Walk relative to camYaw, jump, collide with world.boxes and bounds, animate the model. */
  updateFoot(input: InputState, camYaw: number, dt: number, world: World): void;
  /** Keep the model seated on this.vehicle (sitting pose). `lean` is the weight-shift roll in radians, + = towards the rider's right. */
  updateRiding(dt: number, lean?: number, horn?: boolean): void;
  /** Re-place the seated gnome after its vehicle moved again later in the frame (no animation step). */
  reseat?(): void;
  /** Draws the gnome for one frame of a mount sequence (see mount.ts). The vehicle is not set until the gnome is seated. `v` and
   *  `seat`: the vehicle being got into or out of, so a seated gnome holds its wheel and lets go of it smoothly (driverHands.ts). */
  drawMount(pose: MountPose, dt: number, v?: Vehicle, seat?: number): void;
  enter(v: Vehicle, seat?: number): void;
  /** Leave the vehicle; stand at its left side. */
  exit(): void;
  /** Take `amount` damage (0..1 of full health). */
  hurt(amount: number): void;
  /** Put the gnome back on its feet at (x, z), whole again, out of any vehicle. */
  respawn(x: number, z: number, yaw: number): void;
  /** True while the gnome bobs in deep water (swim.ts): paddles slowly, cannot fire. Set by updateFoot. */
  swimming?: boolean;
  /** True from bailing out of a flyer until the feet touch the ground. main calls updateAir (not updateFoot) while true. */
  airborne: boolean;
  /** True while the gnome tumbles as a ragdoll (thrown from a moving vehicle, or hit by one). main calls updateRagdoll (not updateFoot) while true. */
  ragdolling: boolean;
  /** Leave vehicle `v` while it moves: start at the seat as a ragdoll with world velocity (vx, vy, vz) m/s. The vehicle is not touched. */
  throwFrom(v: Vehicle, vx: number, vy: number, vz: number): void;
  /** On foot: go limp with world velocity (vx, vy, vz) m/s added (hit by a vehicle). Adds to the tumble when already ragdolling. */
  ragdoll(vx: number, vy: number, vz: number): void;
  /** One frame of the tumble; when the body has settled the gnome gets up (ragdolling = false, standing, upright). */
  updateRagdoll(dt: number, world: World): void;
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
  /** Swirling leaf-and-dust air cone from (x, y, z) along (dx, dz). */
  airBlast(x: number, y: number, z: number, dx: number, dz: number): void;
  /** Lingering ~5s white dandelion fluff cloud at (x, y, z). */
  dandelionCloud(x: number, y: number, z: number): void;
  /** Colourful parade confetti burst at (x, y, z). */
  confetti(x: number, y: number, z: number): void;
  /** Biome/tyre/exhaust trail puff at (x, y, z). */
  trail?(x: number, y: number, z: number, kind: 'smoke' | 'sand' | 'snow' | 'grass'): void;
  /** Spraying water jet from a broken hydrant or splash. */
  waterJet?(x: number, y: number, z: number): void;
  /** Nitro exhaust flame shooting behind a vehicle facing `yaw`. */
  boostFlame?(x: number, y: number, z: number, yaw: number): void;
  /** Prop/crate smash debris burst at (x, y, z). */
  smash?(x: number, y: number, z: number, color?: number): void;
  update(dt: number): void;
}

export interface WeaponContext {
  npcs: Npcs;
  vehicles: Vehicle[];
  traffic: Traffic;
  watch: Watch;
  onBlowUp?: (v: Vehicle) => void;
  onToast?: (text: string) => void;
  onPlay?: (sfx: Sfx) => void;
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
  /** Pose the holder's arms and the held gun (gunHold.ts). Call every frame after the player's model update, on foot only. */
  poseArms(model: GnomeModel, aiming: boolean, pitch: number): void;
  /** Put the arms and gun back to the plain hand placement; does something only on the first call after poseArms. */
  relaxArms(model: GnomeModel): void;
  /** The held gun's muzzle in world space into `out`; false (out untouched) when no gun is held. */
  muzzleWorld(out: THREE.Vector3): boolean;
  setVisible(v: boolean): void;
  switchGun(): void;
  unlock(kind: GunKind): void;
  selectGun(kind: GunKind): void;
  /** Start a reload (no-op if full or already reloading). */
  reload(): void;
  /** The current gun with its fitted mods (rate, spread, range, mag, reload, recoil, damage, zoom, sound). */
  spec(): ModdedGun;
  /** Fit mods on a gun (any gun, held or not): recomputes its numbers, and rebuilds the held model when it is the current gun. */
  setLoadout(kind: GunKind, mods: GunLoadout): void;
  /** The mods fitted on a gun now. */
  loadoutOf(kind: GunKind): GunLoadout;
  /** Show `mods` on the held gun model only (no stats change; the Mod Kit's live preview); null puts the fitted mods back. Selects `kind` first. */
  previewLoadout?(kind: GunKind, mods: GunLoadout | null): void;
  /** Rounds left in that gun's magazine (each gun keeps its own), for the weapon wheel. */
  ammoOf?(kind: GunKind): number;
  /** Aim blend 0..1 this frame: the spread shrinks toward AIM.spreadMul of the hip-fire spread at 1. */
  setAim(t: number): void;
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
    hitTest: HitTest, world: World, ctx?: WeaponContext,
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
  /** Set on a quest target (its target id): it is never recycled or trimmed, and cracking it removes it for good. */
  quest?: string;
}

export interface Npcs {
  list: Npc[];
  update(dt: number, world: World, playerX: number, playerZ: number, vehicles: Vehicle[]): void;
  /** Nearest pedestrian whose body (radius 0.45, y 0..1.1) contains the point, or null. */
  hitTest(x: number, y: number, z: number): Npc | null;
  /** Crack a shot pedestrian apart (shards fly) and send a fresh townsgnome wandering in near (playerX, playerZ). */
  crack(npc: Npc, playerX: number, playerZ: number): void;
  /** A named pedestrian that stays where the game put it (a quest target): never recycled, never trimmed. */
  spawnNamed(name: string, x: number, z: number, look: GnomeLook, questTarget: string): Npc;
  /** Make a pedestrian run away from (fromX, fromZ). */
  scare(npc: Npc, fromX: number, fromZ: number): void;
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
  /** Nearby pedestrians react to a vehicle horn; returns a grumpy/cheeky line if one yelled. */
  reactToHorn?(x: number, z: number): string | null;
  /** Nearby spectator gnomes cheer when the player lands a stunt or hops a lowrider. Returns count cheering. */
  cheerAt?(x: number, z: number): number;
  /**
   * A live-world cutscene's clear zones, or null when it ends: calm pedestrians inside are moved out at once, and none
   * walk into one while it is set.
   */
  setKeepOut?(zones: readonly { x: number; z: number; r: number }[] | null): void;
}

/** Where the camera is and the way it looks on the ground plane (unit dirX, dirZ), so traffic never appears in view. */
export interface TrafficView { x: number; z: number; dirX: number; dirZ: number }

export interface Traffic {
  /**
   * Keep the ambient population (trafficSim.ts: off-screen cars out to TRAFFIC.simRadius, real vehicles near the player in
   * `vehicles`), drive every driver==='npc' vehicle along the roads. `view` is the camera; without it, new cars only appear
   * beyond TRAFFIC.hideDistance.
   */
  update(dt: number, vehicles: Vehicle[], world: World, playerX: number, playerZ: number, view?: TrafficView): void;
  /** Tests and ?debug: every ambient car, near (live) or off-screen. */
  debugGhosts?(): readonly { id: number; kind: VehicleKind; x: number; z: number; live: boolean; from: number; to: number }[];
  /** The NPC driver leaves v (rider model removed, v.driver = 'none'). Returns where they stand, their look and where they were headed (an errand, "to the park for a picnic"), or null if none. */
  ejectDriver(v: Vehicle): { x: number; z: number; look: GnomeLook; reason: string | null } | null;
  /**
   * The NPC driver whose head is hit by a bullet at (x, y, z): a sphere of radius 0.45 at the rider's head (seat + head
   * height). Returns the vehicle, or null. Cops are not traffic drivers and never match.
   */
  driverAt?(x: number, y: number, z: number): Vehicle | null;
  /**
   * Crack v's NPC driver: like ejectDriver (rider removed, v.driver = 'none', the car leaves the population) but the car
   * rolls to a stop where it is. Returns where the cracked gnome falls and its look, or null when v has no NPC driver.
   */
  crackDriver?(v: Vehicle): { x: number; z: number; look: GnomeLook } | null;
  /** Dispatch a multi-vehicle convoy along a sequence of road node IDs. */
  spawnConvoy(routeNodes: number[], kinds: VehicleKind[], vehicles: Vehicle[]): Vehicle[];
  /**
   * A live-world cutscene's clear zones (cutscene/liveArea.ts), or null when it ends: drivers inside are moved out at
   * once, none spawn near them, and drivers about to enter one wait at its edge.
   */
  setKeepOut?(zones: readonly { x: number; z: number; r: number }[] | null): void;
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
  /** Spawn mission-specific enemy faction squads (HOA Enforcers, Porcelain Guards, Spade Guards). */
  spawnSquad(kind: 'hoa' | 'porcelain' | 'spade', points: [number, number][]): Npc[];
  /** Remove mission-spawned squad NPCs when an objective ends or is cleaned up. */
  despawnSquad?(npcs: Npc[]): void;
  /** Make nearby Hat Watch officers sneeze (hands up / drop aggro for 6s). Returns count affected. */
  onSneeze(x: number, z: number, radius: number): number;
  /** Fling nearby Hat Watch / HOA / Guard units into ragdolls. Returns count affected. */
  knockArea?(x: number, z: number, radius: number, force: number, up: number, fromX: number, fromZ: number): number;
  /** Eject the officer driver when the player steals a pursuit mower or HOA van. */
  ejectPursuitDriver?(v: Vehicle): void;
  /**
   * E23 L103: cap heat at `cap` (0 = no Hat Watch at all: heat held at 0, officers and pursuits leave) until called with
   * null. addHeat never goes past the cap while it is set. Quests set it per step (quests/hoaPolicy.ts).
   */
  setCap?(cap: number | null): void;
  /** E23 L103: the search area and evade progress the HUD draws, or null at heat < 1. */
  search?(): WatchSearch | null;
}

/** E23 L103: where the Hat Watch is looking for the player, and how close they are to losing a level. */
export interface WatchSearch {
  /** Centre of the search area (the player's last seen point), world x/z. */
  x: number;
  z: number;
  /** Radius, m (WATCH.searchRadius + WATCH.searchRadiusPerLevel * (level - 1)). */
  r: number;
  /** A unit has line of sight to the player right now. */
  seen: boolean;
  /** The player is inside the search circle. */
  inside: boolean;
  /** 0..1: progress to losing the current level (0 while seen; fills with unseen time, then with cooled heat). */
  evade: number;
  /** Current level (Math.floor(heat)). */
  level: number;
  /** Seconds until dispatched units arrive (0 = they are here). */
  dispatchIn: number;
}

/**
 * A map dot. `quest` makes it a big gold-ringed marker that sticks to the minimap edge when far away, labelled on the big map.
 * `player` is another online player: pinned to the minimap's edge when far away, and `label` (their name) shows on the big map.
 */
export interface Blip {
  x: number; z: number; color: string; quest?: string; player?: boolean; label?: string;
  /**
   * How a `quest` blip is drawn (hud.ts, legend on the big map). 'main' = a story giver (gold star), 'side' = a side-quest
   * giver (a diamond in its giver's colour with a "?"), 'objective' = the active quest's target (orange target rings),
   * 'taxi' = the Turfton Taxi on its way or waiting (yellow "T" square). 'shop' = a store (Ammu-Gnation: olive disc with an
   * orange crosshair), drawn where it is, with no edge arrow and no `quest` label needed. 'speedway' = the Lost & Found
   * Speedway (chequered flag) and 'glaze' = a Pay 'n' Glaze station (pink drop): places drawn like 'shop', with `label`
   * on the big map. The other place kinds (`PoiKind` in mapIcons.ts: hospital, salvage, whirligig, casino, mart, tower,
   * stage, airfield) are drawn the same way, each with its own icon. 'home' = a character's home the player has visited, or
   * the player's own flat (homes/visits.ts). Absent: the plain gold pin other systems use.
   */
  kind?: 'main' | 'side' | 'objective' | 'taxi' | 'shop' | 'speedway' | 'glaze'
    | 'hospital' | 'salvage' | 'whirligig' | 'casino' | 'mart' | 'tower' | 'stage' | 'airfield' | 'skyway' | 'hangar' | 'boathouse'
    | 'lockup' | 'lodge' | 'hide' | 'tackle' | 'onramp' | 'works' | 'exchange' | 'town' | 'park' | 'edge'
    | 'dealer-car' | 'dealer-boat' | 'dealer-air' | 'home'
    // Winter sports (E12, winter/): Snowdrop Slope + the Woolly Sock Lodge, the Bear Deck, Pail Pond ice fishing.
    | 'ski' | 'bears' | 'icefish'
    // Hedgeworth Links (E15, golf/).
    | 'golf';
}

/** The route the HUD draws to the active waypoint: a polyline in world x/z, from the player to the target. */
export interface HudRoute {
  /** level: what the stretch from this point to the next is: 'deck' = up on a skyway, 'under' = on the ground beneath a
   *  deck (an underpass); unset = ordinary ground (route.ts roadRoute). */
  points: { x: number; z: number; level?: 'deck' | 'under' }[];
  color: string;
}

export interface HudState {
  /** 0..4 watch level. */
  heat: number;
  /** E23 L103: the Hat Watch search area and evade meter (watch.search()), null / absent at heat < 1. */
  search?: WatchSearch | null;
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
  /** Acorn balance (optional until wired). */
  acorns?: number;
  /** Remaining Kiln-Debt (optional, shown when > 0). */
  debt?: number;
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
  /** Route to the active quest objective or the giver pinned in the Quest Journal (dashed line on both maps), or null. */
  route?: HudRoute | null;
  online: string | null;
  /** Current named district, if any. */
  district?: string | null;
  /** Formatted in-game clock label (e.g. "14:30"). */
  timeLabel?: string;
  /** Nitro boost level 0..1 while driving, or null. */
  boost?: number | null;
  /** Active beverage/status buff label, or null. */
  buff?: string | null;
  /** Stunt jump progress. */
  stunts?: { done: number; total: number };
}

export interface Hud {
  /** Give the minimap the world (roads, biomes, base, airfield). Call once after buildWorld. */
  setWorld(world: World): void;
  set(s: HudState): void;
  toast(text: string, ms?: number): void;
  /** A big centred banner (WASHED OUT, WHIRLIGIG STOLEN). */
  banner(text: string, ms?: number): void;
  /** The quest tracker in the top-left panel (null hides it). */
  setObjective(o: { title: string; lines: string[]; demo: boolean } | null): void;
  /** Show or hide the whole HUD (hidden during cutscenes). */
  setVisible(visible: boolean): void;
  /** District/stunt callout banner. */
  callout?(title: string, sub?: string): void;
  /** Brief camera shutter flash. */
  flash?(): void;
  /** The big map: open / close it, or open it centred on a world point at `scale` screen px per world unit (clamped). */
  bigMap?: { open(): void; close(): void; isOpen(): boolean; zoomTo(x: number, z: number, scale: number): void };
}

export type Sfx = 'squirt' | 'crack' | 'steal' | 'door' | 'alarm' | 'whistle' | 'washed' | 'bump' | 'gunshot' | 'shotgun' | 'reload' | 'chute' | 'handbrake' | 'handbrake-release' | 'boom' | 'boost' | 'stunt' | 'splash' | 'shutter' | 'smash' | 'drink' | 'hoa-shot' | 'gnome-hit' | 'player-crack';
