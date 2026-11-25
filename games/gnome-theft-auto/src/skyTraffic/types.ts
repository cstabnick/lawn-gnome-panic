// Sky traffic (docs/roadmaps/gta-npc-planes.md): the shared data shapes. Plain data, no three.js, no DOM.
//
// NPC aircraft are ordinary Vehicles (createVehicle) in the shared `vehicles` list, so bullets, crashes, explosions,
// engine sound and getting in all work as for any vehicle. They are flown by a cheap kinematic waypoint follower
// (follow.ts), not by craft/flight.ts: a scripted path keeps takeoffs, landings and stunt loops believable and costs
// a few multiplications per frame.
import type { BrandId } from '../brands';
import type { VehicleKind } from '../types';

export interface Pt { x: number; z: number }

/** One point of an NPC aircraft's route. Flags describe the leg TO this point (or what happens on arrival). */
export interface SkyWaypoint {
  x: number;
  z: number;
  /** Height above the floor (ground, deck, water or building top) at this point, m. Ignored when `ground`. */
  agl: number;
  /** Speed to fly (or taxi) on the leg to this point, m/s. */
  speed: number;
  /** On the ground: taxi, takeoff roll, rollout. y snaps to the floor, no bank, no pitch. */
  ground?: boolean;
  /** Wait here this many seconds after arriving (parked, hovering). Speed eases to 0 while waiting. */
  hold?: number;
  /** Crop spray plume under the craft on the leg to this point. */
  spray?: boolean;
  /** Sky-writing smoke puffs behind the craft on the leg to this point. */
  smoke?: boolean;
  /** Drop a parcel on arriving here. */
  drop?: boolean;
  /** Fly one vertical loop of this radius (m) on arriving here (stunt), then go on. */
  loop?: number;
}

/** The kinematic body the follower moves. yaw 0 faces +z; forward = (sin yaw, cos yaw). pitch + = nose up,
 *  roll + = right wing down (the same sign as craft/model.ts AirState). */
export interface SkyBody {
  x: number; y: number; z: number;
  yaw: number;
  speed: number;
  vy: number;
  pitch: number;
  roll: number;
}

/** The follower's progress along a route. */
export interface FollowState {
  route: SkyWaypoint[];
  /** Index of the waypoint being flown to. */
  i: number;
  /** Seconds left to wait at the current waypoint (0 = not waiting). */
  holdT: number;
  /** Vertical loop progress 0..1, or -1 when not looping. */
  loopT: number;
  /** The loop's radius, entry point, entry height and heading. */
  loopR: number;
  loopX: number;
  loopY: number;
  loopZ: number;
  loopYaw: number;
  /** y and horizontal distance when the current leg started (the climb / glide is interpolated along the leg). */
  legFromY: number;
  legLen: number;
  /** True once the last waypoint was reached (and its hold / loop finished). */
  done: boolean;
}

/** How one aircraft kind moves under the follower. */
export interface FollowSpec {
  maxSpeed: number;
  /** Speed change, m/s^2. */
  accel: number;
  /** Yaw rate limit, rad/s. */
  turnRate: number;
  /** Vertical speed limit, m/s. */
  climbRate: number;
  bankMax: number;
  pitchMax: number;
  /** Rotor or buoyant: may slow to a stop and turn on the spot. Fixed-wing keeps flying. */
  hover: boolean;
  /** A waypoint counts as reached inside this horizontal distance, m. */
  arrive: number;
}

export type SkyBehaviourId =
  | 'banner-tow'
  | 'airfield-circuit'
  | 'crop-duster'
  | 'scenic-copter'
  | 'sky-writer'
  | 'news-copter'
  | 'mail-drop'
  | 'balloon'
  | 'watch-copter'
  | 'air-ambulance'
  | 'preserve-survey'
  | 'coast-patrol'
  | 'snowcap-sightseer';

/** What a behaviour may look at when it decides to fly and builds its route. */
export interface SkyContext {
  playerX: number;
  playerZ: number;
  /** Hat Watch heat, 0..3+ (fractional). */
  heat: number;
  /** A world or street event is running (events/api.ts activeWorldEvents().length > 0). */
  eventActive: boolean;
  airfield: { x: number; z: number; yaw: number; length: number };
  /** Seconds since the sky traffic started. */
  time: number;
  /** 0..1 random numbers (Math.random in the game, seeded in tests). */
  rng: () => number;
}

/** One kind of NPC flight (behaviours.ts SKY_BEHAVIOURS). */
export interface SkyBehaviourDef {
  id: SkyBehaviourId;
  /** Shown by the trainer and in toasts. */
  title: string;
  kind: VehicleKind;
  /** Engine sound id (Vehicle.variant), registered in sounds.ts. */
  sound: string;
  /** Spawned only while the player is within `radius` m of `anchor`. */
  anchor: Pt;
  radius: number;
  /** Seconds before it may fly again after it left or was released. */
  cooldown: number;
  /** L20: once it appears it stays up for onFor seconds, then leaves and is away for offFor seconds ([min, max], rolled
   *  each time). Absent: as before (back after `cooldown`). Forced spawns (trainer, ?sky=) ignore it. */
  presence?: { onFor: readonly [number, number]; offFor: readonly [number, number] };
  /** Higher spawns first when slots are short. */
  priority: number;
  /** 'loop': the route repeats from index 0. 'rebuild': route(ctx) is called again for each lap (orbits round the
   *  player). 'once': at the end it leaves and despawns. */
  repeat: 'loop' | 'rebuild' | 'once';
  /** true: appears in the air (far from the player); false: starts parked at route[0] (a ground waypoint). */
  startAirborne: boolean;
  /** Extra spawn condition; when it turns false while flying, the craft leaves. */
  when?: (c: SkyContext) => boolean;
  /** The route, built when it spawns (and again each lap for 'rebuild'). Never empty. */
  route: (c: SkyContext) => SkyWaypoint[];
  /** Tows the advert banner. */
  banner?: boolean;
  /** Colour of its spray / smoke puffs. */
  puff?: number;
  /** Toast shown when it spawns (the Watch chopper, the news copter). */
  toast?: string;
}

/** One sky-banner advert (ads.ts SKY_ADS). */
export interface AdDef {
  /** Unique, kebab-case, e.g. 'acorn-cola-1'; Easter eggs start with 'egg-'. */
  id: string;
  brand: BrandId;
  /** Big text, at most 28 characters, upper case. */
  headline: string;
  /** Small line under it, at most 48 characters. */
  tagline: string;
  /** A rare Easter-egg ad (not counted for Captive Audience). */
  egg?: boolean;
}
