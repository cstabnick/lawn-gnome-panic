// src/config.ts: every shared constant, tuning number and type in Gnome Front.
// Scale: a gnome is ~1.4 units tall, the same as in Lawn Gnome Panic.
import type * as THREE from 'three';
import type { GnomeModel, MowerModel } from './models/config';

// =====================================================================
// World
// =====================================================================

/** The battlefield spans -ARENA_HALF..ARENA_HALF on x and z. Fences on all four sides. */
export const ARENA_HALF = 150;

export const SKY_COLOR = 0x9ad7ff;
export const GRASS_COLOR = 0x4f9a35;

/** A round piece of cover (hedge, stone, flower pot, stump). Soldiers and vehicles cannot pass through it. Bullets that pass within r of (x, z) below height h are stopped. */
export interface Obstacle {
  x: number;
  z: number;
  r: number;
  h: number; // top, measured from the ground at (x, z)
}

// =====================================================================
// Teams
// =====================================================================

export type Team = 0 | 1;
export const TEAM_NAMES: readonly [string, string] = ['RED CAPS', 'BLUE CAPS'];
/** Hat colour of each team's gnomes (also the flag cloth colour). */
export const TEAM_COLORS: readonly [number, number] = [0xd93636, 0x2f64c9];
export const TEAM_CSS: readonly [string, string] = ['#ff5a4f', '#5a9bff'];
export const NEUTRAL_COLOR = 0xdddddd;
export const NEUTRAL_CSS = '#dddddd';

/** The local player is always on this team. */
export const PLAYER_TEAM: Team = 0;

/** Each team's headquarters: always a spawn point for that team, never capturable. Team 0 is south (+z), team 1 north (-z). */
export const BASES: readonly [{ x: number; z: number; yaw: number }, { x: number; z: number; yaw: number }] = [
  { x: 0, z: 130, yaw: Math.PI }, // faces -z, towards the middle
  { x: 0, z: -130, yaw: 0 },      // faces +z
];

// =====================================================================
// Conquest flags
// =====================================================================

export interface FlagDef {
  id: 'A' | 'B' | 'C' | 'D' | 'E';
  name: string;
  x: number;
  z: number;
}

export const FLAGS: readonly FlagDef[] = [
  { id: 'A', name: 'Birdbath', x: -75, z: 65 },
  { id: 'B', name: 'Veggie Patch', x: 70, z: 55 },
  { id: 'C', name: 'Fountain', x: 0, z: 0 },
  { id: 'D', name: 'Shed', x: -70, z: -55 },
  { id: 'E', name: 'Compost Heap', x: 75, z: -65 },
];

/** Live state of one flag. progress runs -1..1: +1 = fully team 0, -1 = fully team 1, 0 = neutral. */
export interface FlagState {
  def: FlagDef;
  owner: Team | null;  // set when progress reaches +-1, cleared when it crosses back through 0
  progress: number;
  contested: boolean;  // both teams have living soldiers on foot or in vehicles inside the radius
}

// =====================================================================
// Tuning
// =====================================================================

export const TUNING = {
  // Soldiers on foot
  walkSpeed: 6,
  sprintSpeed: 9.5,
  accel: 50,              // units/s^2 towards the wished velocity on the ground
  airControl: 0.3,        // fraction of accel while airborne
  jumpSpeed: 7.5,
  gravity: 20,
  eyeHeight: 1.15,        // camera height above the feet in first person
  soldierRadius: 0.4,     // collision and hit cylinder radius
  soldierHeight: 1.4,     // hit cylinder height
  maxHp: 100,
  regenDelayS: 5,         // seconds after the last damage before health regenerates
  regenPerS: 15,
  respawnS: 5,
  mouseSens: 0.0022,      // radians per pixel at the hip FOV (scaled down by fov / hipFov while aiming)
  hipFov: 75,             // camera vertical FOV when not aiming
  adsTimeS: 0.18,         // seconds to go fully into or out of aiming
  maxPitch: 1.45,         // radians, up and down

  // Teams and conquest
  botsPerTeam: 12,        // team 0 gets botsPerTeam - 1 bots plus the player
  tickets: 150,
  captureRadius: 9,
  captureRatePerS: 0.2,   // progress per second per soldier of advantage
  maxCaptureAdvantage: 3, // more soldiers than this capture no faster
  bleedIntervalS: 3,      // a team holding fewer flags than the other loses 1 ticket this often
  deathTicketCost: 1,

  // Vehicles
  enterRange: 3.5,        // a soldier's feet within this of a vehicle's centre (plus its radius) can get in
  chaseCamDistance: 7,    // third-person camera distance behind a driven vehicle
  chaseCamHeight: 3,

  // Bots
  botViewRange: 70,
  botAimError: 0.06,      // radians of random aim error per shot
  botReactionS: 0.5,      // seconds after first seeing a target before firing
  botVehicleChance: 0.35, // chance a freshly spawned bot near an empty vehicle takes it
} as const;

// =====================================================================
// Weapons
// =====================================================================

export type WeaponId = 'acornRifle' | 'seedSprayer' | 'peaShooter' | 'blunderbuss';

/** A hitscan gun. Damage is per pellet; spreads are cone half-angles in radians. */
export interface WeaponDef {
  id: WeaponId;
  name: string;
  damage: number;            // per pellet, before falloff and headshot
  pellets: number;           // rays per shot (shotgun > 1)
  headshotMult: number;      // hit above 1.05 units over the feet
  fireIntervalS: number;
  auto: boolean;             // true: fires while held; false: one shot per click (InputState.firePressed)
  magSize: number;
  reserveAmmo: number;       // refilled on respawn
  reloadS: number;
  hipSpreadRad: number;      // standing still, not aiming
  adsSpreadRad: number;      // fully aimed down sights
  moveSpreadMult: number;    // spread multiplier while moving on foot (sprinting doubles it again)
  range: number;             // beyond this a ray hits nothing
  falloffStart: number;      // full damage up to here...
  falloffEnd: number;        // ...then linear down to minDamageMult at falloffEnd and beyond
  minDamageMult: number;
  vehicleDamageMult: number; // multiplies damage against vehicles
  recoilPitch: number;       // radians the view kicks up per shot (halved while aiming)
  adsFov: number;            // camera vertical FOV when fully aimed (hip FOV is TUNING.hipFov)
  adsMoveMult: number;       // walk speed multiplier when fully aimed
  scope: boolean;            // true: the HUD shows a scope overlay and the gun model hides when aimed
  tracerColor: number;
  botRange: readonly [number, number]; // bots prefer to fight between these distances
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  acornRifle: {
    id: 'acornRifle', name: 'Acorn Rifle', damage: 22, pellets: 1, headshotMult: 2, fireIntervalS: 0.11, auto: true,
    magSize: 30, reserveAmmo: 150, reloadS: 1.8, hipSpreadRad: 0.014, adsSpreadRad: 0.003, moveSpreadMult: 1.6,
    range: 220, falloffStart: 40, falloffEnd: 90, minDamageMult: 0.6, vehicleDamageMult: 0.25,
    recoilPitch: 0.004, adsFov: 52, adsMoveMult: 0.6, scope: false, tracerColor: 0xffe08a, botRange: [8, 55],
  },
  seedSprayer: {
    id: 'seedSprayer', name: 'Seed Sprayer', damage: 17, pellets: 1, headshotMult: 1.7, fireIntervalS: 0.075, auto: true,
    magSize: 80, reserveAmmo: 240, reloadS: 3.4, hipSpreadRad: 0.03, adsSpreadRad: 0.009, moveSpreadMult: 2,
    range: 200, falloffStart: 30, falloffEnd: 80, minDamageMult: 0.55, vehicleDamageMult: 0.4,
    recoilPitch: 0.003, adsFov: 58, adsMoveMult: 0.45, scope: false, tracerColor: 0xc8ff7a, botRange: [10, 50],
  },
  peaShooter: {
    id: 'peaShooter', name: 'Pea Shooter (sniper)', damage: 80, pellets: 1, headshotMult: 2.5, fireIntervalS: 1.1, auto: false,
    magSize: 5, reserveAmmo: 30, reloadS: 2.6, hipSpreadRad: 0.06, adsSpreadRad: 0, moveSpreadMult: 2,
    range: 400, falloffStart: 400, falloffEnd: 400, minDamageMult: 1, vehicleDamageMult: 0.3,
    recoilPitch: 0.03, adsFov: 16, adsMoveMult: 0.35, scope: true, tracerColor: 0x8fff8f, botRange: [35, 120],
  },
  blunderbuss: {
    id: 'blunderbuss', name: 'Pinecone Blunderbuss', damage: 13, pellets: 9, headshotMult: 1.5, fireIntervalS: 0.8, auto: false,
    magSize: 6, reserveAmmo: 36, reloadS: 2.4, hipSpreadRad: 0.07, adsSpreadRad: 0.05, moveSpreadMult: 1.2,
    range: 60, falloffStart: 8, falloffEnd: 28, minDamageMult: 0.15, vehicleDamageMult: 0.5,
    recoilPitch: 0.05, adsFov: 64, adsMoveMult: 0.8, scope: false, tracerColor: 0xffb070, botRange: [0, 14],
  },
};

export type ClassId = 'rifleman' | 'gunner' | 'sniper' | 'brawler';

export interface ClassDef {
  id: ClassId;
  name: string;
  blurb: string;       // one line for the class picker
  weapon: WeaponId;
  grenades: number;    // pinecones per life
  speedMult: number;   // on-foot walk and sprint speed multiplier
}

export const CLASSES: Record<ClassId, ClassDef> = {
  rifleman: { id: 'rifleman', name: 'Rifleman', blurb: 'All-rounder. Accurate full-auto acorns.', weapon: 'acornRifle', grenades: 2, speedMult: 1 },
  gunner: { id: 'gunner', name: 'Gunner', blurb: 'Huge magazine, chews through mowers. Slow to move and reload.', weapon: 'seedSprayer', grenades: 1, speedMult: 0.9 },
  sniper: { id: 'sniper', name: 'Sniper', blurb: 'One pea to the hat drops a gnome. Scope in with right click.', weapon: 'peaShooter', grenades: 1, speedMult: 1.05 },
  brawler: { id: 'brawler', name: 'Brawler', blurb: 'Close range blunderbuss and three pinecones. Fast on foot.', weapon: 'blunderbuss', grenades: 3, speedMult: 1.1 },
};

/** Picker order; keys 1-4 select these. */
export const CLASS_ORDER: readonly ClassId[] = ['rifleman', 'gunner', 'sniper', 'brawler'];

export function weaponOf(s: Soldier): WeaponDef {
  return WEAPONS[CLASSES[s.classId].weapon];
}

/** Thrown pinecone grenade. */
export const GRENADE = {
  name: 'Pinecone',
  throwSpeed: 18,
  fuseS: 2.2,
  radius: 7,
  damage: 130,            // at the centre, falls off linearly to 0 at the radius
  vehicleDamage: 220,     // at the centre, same falloff
} as const;

/** 'gun' = any WeaponDef; the kill event says which. */
export type DamageCause = 'gun' | 'grenade' | 'roadkill' | 'wreck';

// =====================================================================
// Vehicles: the mowers and the combine from Lawn Gnome Panic
// =====================================================================

export type VehicleKind = 'green' | 'yellow' | 'red' | 'combine';

export interface VehicleDef {
  kind: VehicleKind;
  name: string;
  maxHp: number;
  maxSpeed: number;      // forward, units/s; reverse is a third of this
  accel: number;         // units/s^2
  turnRate: number;      // rad/s at full steer
  radius: number;        // collision circle
  seatY: number;         // driver's feet height above the vehicle base
  runOverDamage: number; // damage per second-of-contact scaled by speed / maxSpeed; enough to one-shot at full speed if >= maxHp of a soldier
  respawnS: number;      // after being destroyed, at its home slot
  scale: number;         // model scale (the walk-behind mowers are scaled up to be ridden)
}

export const VEHICLES: Record<VehicleKind, VehicleDef> = {
  green: { kind: 'green', name: 'Green Mower', maxHp: 220, maxSpeed: 17, accel: 14, turnRate: 2.2, radius: 1.2, seatY: 0.9, runOverDamage: 120, respawnS: 20, scale: 1.4 },
  yellow: { kind: 'yellow', name: 'Yellow Mower', maxHp: 260, maxSpeed: 20, accel: 16, turnRate: 2.1, radius: 1.2, seatY: 0.9, runOverDamage: 130, respawnS: 25, scale: 1.4 },
  red: { kind: 'red', name: 'Red Mower (the fast one)', maxHp: 180, maxSpeed: 27, accel: 20, turnRate: 2.0, radius: 1.2, seatY: 0.9, runOverDamage: 140, respawnS: 30, scale: 1.4 },
  combine: { kind: 'combine', name: 'THE COMBINE', maxHp: 1400, maxSpeed: 10, accel: 5, turnRate: 0.8, radius: 2.8, seatY: 2.4, runOverDamage: 1000, respawnS: 60, scale: 1 },
};

/** Vehicle home slots. Each vehicle spawns and respawns here. team = which base it stands at (anyone may still steal it). */
export const VEHICLE_SLOTS: readonly { kind: VehicleKind; team: Team; x: number; z: number; yaw: number }[] = [
  { kind: 'combine', team: 0, x: 0, z: 118, yaw: Math.PI },
  { kind: 'green', team: 0, x: -10, z: 122, yaw: Math.PI },
  { kind: 'yellow', team: 0, x: 10, z: 122, yaw: Math.PI },
  { kind: 'red', team: 0, x: 18, z: 126, yaw: Math.PI },
  { kind: 'combine', team: 1, x: 0, z: -118, yaw: 0 },
  { kind: 'green', team: 1, x: 10, z: -122, yaw: 0 },
  { kind: 'yellow', team: 1, x: -10, z: -122, yaw: 0 },
  { kind: 'red', team: 1, x: -18, z: -126, yaw: 0 },
  // One neutral mower at the middle flag for whoever gets there first.
  { kind: 'red', team: 0, x: 6, z: 8, yaw: Math.PI / 2 },
];

// =====================================================================
// Entities
// =====================================================================

export interface Soldier {
  readonly id: number;
  readonly team: Team;
  readonly name: string;
  readonly isPlayer: boolean;
  classId: ClassId;         // class of the current life
  nextClassId: ClassId;     // class used at the next respawn (the player picks it in the HUD; bots in bots.ts)
  ads: boolean;             // wants to aim down sights this frame (set by player.ts / bots)
  adsT: number;             // 0 = hip .. 1 = fully aimed; eased towards ads by soldiers.ts over TUNING.adsTimeS
  pos: THREE.Vector3;       // feet
  vel: THREE.Vector3;
  yaw: number;              // facing; yaw 0 looks along +z, the forward vector is (sin yaw, 0, cos yaw)
  pitch: number;            // look up (+) / down (-), radians
  grounded: boolean;
  jumpsUsed: number;
  sprinting: boolean;
  hp: number;
  alive: boolean;
  respawnT: number;         // seconds until respawn while dead
  sinceDamageS: number;     // seconds since last damage taken
  vehicle: Vehicle | null;  // the vehicle this soldier is driving
  ammo: number;             // in the magazine
  reserve: number;
  reloadT: number;          // > 0 while reloading, counts down
  fireT: number;            // > 0 while the rifle cools down
  grenades: number;
  kills: number;
  deaths: number;
  model: GnomeModel;        // added to the scene by createSoldier
}

export interface Vehicle {
  readonly id: number;
  readonly def: VehicleDef;
  readonly home: { x: number; z: number; yaw: number };
  team: Team;               // the base it belongs to, or its current driver's team
  pos: THREE.Vector3;       // base centre on the ground
  yaw: number;              // forward vector is (sin yaw, 0, cos yaw), the same as the mower models (+z at yaw 0)
  speed: number;            // signed, along the forward vector
  hp: number;
  alive: boolean;
  respawnT: number;
  driver: Soldier | null;
  model: MowerModel;        // added to the scene by createVehicles
}

/** What a driver asks of a vehicle this frame. */
export interface VehicleControl {
  throttle: number; // -1 (reverse/brake) .. 1 (forward)
  steer: number;    // -1 (left) .. 1 (right)
}

// =====================================================================
// Events
// =====================================================================

export type GameEvent =
  | { type: 'shot'; shooter: Soldier; weapon: WeaponId; from: THREE.Vector3; to: THREE.Vector3 } // one per pellet
  | { type: 'hit'; shooter: Soldier | null; victim: Soldier; damage: number; headshot: boolean }
  | { type: 'vehicleHit'; shooter: Soldier | null; vehicle: Vehicle; damage: number }
  | { type: 'kill'; killer: Soldier | null; victim: Soldier; cause: DamageCause; weapon: WeaponId | null; headshot: boolean } // weapon set when cause is 'gun'
  | { type: 'grenadeThrown'; thrower: Soldier }
  | { type: 'explosion'; pos: THREE.Vector3; radius: number }
  | { type: 'vehicleDestroyed'; vehicle: Vehicle; by: Soldier | null }
  | { type: 'enterVehicle'; soldier: Soldier; vehicle: Vehicle }
  | { type: 'exitVehicle'; soldier: Soldier; vehicle: Vehicle }
  | { type: 'flagCaptured'; flag: FlagState; team: Team }
  | { type: 'flagLost'; flag: FlagState; team: Team } // team = the previous owner
  | { type: 'reload'; soldier: Soldier }
  | { type: 'jump'; soldier: Soldier }
  | { type: 'spawn'; soldier: Soldier }
  | { type: 'gameOver'; winner: Team };

// =====================================================================
// Input
// =====================================================================

export interface InputState {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;    // Shift
  fire: boolean;      // left mouse held
  firePressed: boolean;    // left mouse went down this frame (semi-auto weapons fire on this)
  aim: boolean;       // right mouse held (touch: the AIM toggle)
  jumpPressed: boolean;    // Space, true for one frame
  reloadPressed: boolean;  // R
  usePressed: boolean;     // E: enter or leave a vehicle
  grenadePressed: boolean; // G
  scoreboard: boolean;     // Tab held
  mouseDx: number;    // pixels moved since the last frame (pointer lock only)
  mouseDy: number;
  locked: boolean;    // pointer lock is active
}

export interface Input {
  readonly state: InputState;
  /** Clears the one-frame "Pressed" flags and the mouse deltas. Call at the end of every frame. */
  endFrame(): void;
}

// =====================================================================
// The game
// =====================================================================

export interface Game {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera; // already added to the scene
  readonly soldiers: Soldier[];
  readonly vehicles: Vehicle[];
  readonly flags: FlagState[];
  readonly obstacles: readonly Obstacle[];
  readonly player: Soldier;
  tickets: [number, number];
  time: number;              // seconds since the match started
  over: boolean;
  winner: Team | null;
  emit(e: GameEvent): void;
  on(fn: (e: GameEvent) => void): void;
}

/** DOM ids that must exist once the game has loaded (checked by tools/smoke.sh). */
export const DOM_IDS = {
  hud: 'gf-hud',
  title: 'gf-title',
  play: 'gf-play',
} as const;
