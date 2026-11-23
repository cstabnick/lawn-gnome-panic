// The air-and-sea handling model: plain data shared by the pure steppers (flight.ts, hull.ts), the tuning maths (tuning.ts)
// and the game glue (aircraft.ts, boats.ts). No three.js, no DOM. Design: docs/roadmaps/gta-air-and-sea.md.
//
// Three regimes, each a pure step over plain data with a per-vehicle spec:
//   ground  -> handling.ts profiles + @lawn/vehicle (unchanged)
//   hull    -> hull.ts stepHull(HullSpec)   (boats.ts stepBoat delegates to it)
//   air     -> flight.ts stepAir(AirSpec)   ('fixed-wing' | 'rotor' | 'buoyant')

/** How an aircraft makes lift. fixed-wing needs airspeed; rotor hovers; buoyant (a balloon) floats and drifts slowly. */
export type AirRegime = 'fixed-wing' | 'rotor' | 'buoyant';

/** One aircraft's flight numbers (config.ts VEHICLES[kind].air). Speeds m/s, rates 1/s, angles radians. */
export interface AirSpec {
  regime: AirRegime;
  /** Top forward airspeed. Rotor and buoyant: the speed full forward stick asks for. */
  maxSpeed: number;
  /** Forward acceleration at full throttle, m/s^2. */
  thrust: number;
  /** Fraction of forward speed kept per second with no throttle (0..1). */
  drag: number;
  /** Yaw rate at full steer, rad/s. */
  turnRate: number;
  /** Vertical speed at full lift input (pitch / collective / burner), m/s. */
  climbRate: number;
  /** How fast the vertical speed follows its target, 1/s. */
  climbResponse: number;
  /** Highest world y it can reach (never lower than the floor + 5). */
  ceiling: number;
  /** Fall speed with no lift (unpowered, stalled, wrecked), m/s (positive number). */
  sinkRate: number;
  /** Largest bank (roll) and pitch the model shows, radians. */
  bankMax: number;
  pitchMax: number;
  /** A touchdown faster than this (m/s down) damages it ... */
  safeTouchdown: number;
  /** ... by this many hit points (0..1 scale) per m/s over safeTouchdown. */
  touchdownDamage: number;
  /** fixed-wing: airspeed to lift off and stay up (default 0.4 x maxSpeed). */
  stallSpeed?: number;
  /** rotor / buoyant: reverse speed limit as a fraction of maxSpeed (default 0.3). */
  reverseFrac?: number;
}

/** An aircraft's flight state (Vehicle.air). pitch + = nose up, roll + = right wing down (the mesh uses rotation.x = -pitch). */
export interface AirState {
  pitch: number;
  roll: number;
  /** More than 0.05 above the floor after the last step. */
  airborne: boolean;
  /** fixed-wing in the air below stall speed. */
  stalled: boolean;
}

/** The part of a Vehicle the air step moves (a Vehicle satisfies it). yaw 0 faces +z; forward = (sin yaw, cos yaw). */
export interface AirBody { x: number; y: number; z: number; yaw: number; speed: number; vy: number }

/** Pilot input. throttle -1..1, steer -1..1 (+1 = right = yaw decreases), lift -1..1 (pitch up / collective / burner).
 *  powered false = nobody flying it, or the engine is wrecked: no thrust, no lift, it sinks. */
export interface AirControls { throttle: number; steer: number; lift: number; powered: boolean }

/** What is under the aircraft: the floor is the highest of ground, bridge or skyway deck and water surface. */
export interface AirEnv { floorY: number; water: boolean }

/** What happened this step (all zero / false on a quiet frame). */
export interface AirStepResult {
  /** Down speed (m/s, positive) on the frame it touched the floor, else 0. */
  touchdownSpeed: number;
  /** Hit points to take off (0..1 scale) for a hard touchdown. */
  damage: number;
  liftedOff: boolean;
  /** True on the frame a fixed-wing first drops below stall speed in the air. */
  stallStarted: boolean;
}

/** A boat hull's numbers (hull.ts). Built from the VehicleSpec and WATER.boat by hullSpecOf; tuning.ts scales some of them. */
export interface HullSpec {
  maxSpeed: number;
  accel: number;
  turnRate: number;
  /** Keel depth under the surface, m. */
  draft: number;
  /** Half length / half beam where the four float points sit, m. */
  halfLength: number;
  halfBeam: number;
  /** Reverse speed limit as a fraction of maxSpeed. */
  reverseFrac: number;
  /** Fraction of speed kept per second coasting. */
  drag: number;
  /** Sideways slip decay, 1/s. */
  sideGrip: number;
  /** Speed for full rudder authority, m/s. */
  rudderSpeed: number;
  /** Heave spring (1/s^2) and damping (1/s). */
  buoyancy: number;
  heaveDamp: number;
  /** Shallower than this under the keel the hull is beached. */
  beachDepth: number;
  /** Bow lift at full speed and heel at full rudder, radians. */
  planePitch: number;
  heelRoll: number;
  /** How much a turn throws the hull sideways. */
  slipGain: number;
}

/** What hull.ts reads the water through (terrain.ts waterAt / bedAt in the game, a fake in tests). */
export interface WaterSampler {
  water(x: number, z: number): { surface: number; depth: number } | null;
  bed(x: number, z: number): number;
}

/** The stats a boat or aircraft can be tuned in (tuning.ts). */
export type CraftStat = 'engine' | 'topSpeed' | 'handling' | 'lift';

/** Bought upgrade levels per stat, each an integer 0..3 (0 = stock). */
export type CraftTune = Record<CraftStat, number>;
