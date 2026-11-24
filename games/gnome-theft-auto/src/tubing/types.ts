// Tubing (docs/roadmaps/gta-sim-jobs-and-tubing.md): a boat driver tows 1-3 riders on inflatable tubes on ropes.
// Riders are other online players (each simulates its own tube from the driver's relayed boat pose, and its own pose
// relays the tube to everyone as a 'tow-tube' vehicle) or NPC gnomes (the driver simulates them and publishes them in
// the SYS.tow record). Pure types and tuning; tow.ts is the deterministic physics, course.ts the buoy run.
import type { Blip, InputState, Vehicle } from '../types';

/** The towing boat, as the tube sees it. */
export interface BoatPose {
  x: number;
  z: number;
  yaw: number;
  /** Forward speed, m/s (>= 0 when moving ahead). */
  speed: number;
  /** Hull radius (spec.radius): the rope hooks on at the stern, this far behind the centre. */
  radius: number;
}

/** The water as the tube sees it: surface height (waves included) and its slope. */
export interface Sea {
  surface(x: number, z: number): number;
  slope(x: number, z: number, out: { x: number; z: number }): void;
}

export interface TubeInput {
  /** -1 (lean left) .. 1 (lean right). */
  lean: number;
  /** Hop (handbrake / jump): a small kick up, only when on the water. */
  hop: boolean;
}

export interface TubeState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  /** Faces the rope's hook point. */
  yaw: number;
  /** Shown lean, eased towards the input (-1..1). */
  lean: number;
  /** Seconds in the air this hop (0 on the water). */
  air: number;
  /** Fall risk 0..1; at 1 the rider is thrown. */
  risk: number;
  /** Tow slot 0..2. */
  slot: number;
  /** The rider is off (thrown); the tube still trails on its rope. */
  fallen: boolean;
  /** Seconds until the next hop is allowed. */
  hopT: number;
}

/** What stepTube reports for one step. */
export type TubeEvent =
  | { t: 'landed'; air: number }
  | { t: 'fell'; vx: number; vy: number; vz: number }
  | null;

/** Running score of one rider's run. */
export interface TubeScore {
  /** Total seconds airborne (hops counted from 0.25 s). */
  air: number;
  /** Metres towed while hooked and not fallen. */
  dist: number;
  topSpeed: number;
  falls: number;
  /** round(dist * 1 + air * 40 + bigAirs * 100), bigAir = one hop >= 0.8 s. */
  points: number;
  bigAirs: number;
}

/** Tow physics tuning. tow.ts implements exactly these rules. */
export const TOW = {
  /** Per slot: rope length (m) and side offset of the hook point (m, + = boat's left/+x local). */
  slots: [
    { rope: 9, side: 0 },
    { rope: 11, side: 0.6 },
    { rope: 11, side: -0.6 },
  ],
  /** Rope spring (per m stretch, m/s^2) and damping (per m/s along the rope), only while taut (dist > rope). */
  k: 14,
  c: 3.2,
  /** Water drag: velocity *= exp(-drag * dt) while on the water (0.15 of it in the air). */
  drag: 0.6,
  /** Lean pushes the tube sideways across the rope, m/s^2 at lean 1, only while the rope is taut. */
  leanForce: 9,
  /** Lean eases towards the input at this rate, per second. */
  leanRate: 4,
  gravity: 18,
  /** Hop: vy kick, m/s (only on the water, at most every 0.6 s). */
  hopV: 3.4,
  hopCooldown: 0.6,
  /** Wave launch: vy += max(0, slope . velocity) * launch when the tube crosses a rising face on the water. */
  launch: 0.9,
  /** Rides this far above the surface on the water. */
  floatY: 0.15,
  /** Fall risk rules (risk goes 0..1, at >= 1 the rider falls; it drains at riskDrain per second otherwise):
   *  sideways speed across the rope above sideFast (m/s) while |lean| > 0.6 adds (side - sideFast) * sideRisk per s;
   *  total speed above tooFast adds (speed - tooFast) * fastRisk per s;
   *  landing from >= 0.5 s in the air with |lean| > 0.8 adds 0.6 at once. */
  sideFast: 9,
  sideRisk: 0.25,
  tooFast: 24,
  fastRisk: 0.12,
  riskDrain: 0.35,
  hardLanding: 0.6,
  /** The thrown rider's ragdoll: the tube's velocity plus this much up. */
  throwUp: 4,
  /** Score. */
  airPoints: 40,
  bigAirS: 0.8,
  bigAirPoints: 100,
  /** NPC riders: seconds before an NPC who fell is back on its tube. */
  npcReboard: 4,
  /** Riders may hook on within this distance of the boat (m). */
  hookRange: 30,
  /** A towed tube more than this from its hook point is let go (the boat warped, the rope snapped). */
  snapDist: 40,
} as const;

/** What app.ts calls on the tubing runtime (tubing/runtime.ts installTubing). */
export interface Tubing {
  /** True when `v` is a tube this client tows as its rider: app.ts must not step it (stepRider does). */
  drives(v: Vehicle): boolean;
  /** app.ts calls this in the vehicle-step slot for a towed tube the player rides. */
  stepRider(v: Vehicle, inp: InputState, dt: number): void;
  /** Every frame: ropes, NPC riders, the driver's tow line, HUD, rack. */
  update(dt: number): void;
  blips(): Blip[];
  /** At the Mossbank tube rack: the E prompt, else null. */
  prompt(x: number, z: number): string | null;
  /** E at the rack: true when handled. */
  interact(x: number, z: number): boolean;
  // Trainer / debug (?debug __gta.tubing):
  /** Driving a boat: tow line out or in. Null or the reason it cannot. */
  setTow(on: boolean): string | null;
  /** Tow line out: add an NPC rider in the next free slot. */
  addNpcRider(): string | null;
  /** On foot or in water near a remote boat with its tow line out: spawn a tube behind it, sit on it, ask to hook on. */
  hopOn(): string | null;
  /** Spawn a free-floating tube by the player (rental). */
  spawnTube(): string | null;
  debug(): TubingDebug;
}

export interface TubingDebug {
  /** As a driver: tow line out, slots (player id / 'npc' / null), shared score, gates. */
  tow: { on: boolean; slots: (number | 'npc' | null)[]; score: number; gates: number } | null;
  /** As a rider: who tows me, my slot, my points, fallen. */
  ride: { host: number | null; slot: number; points: number; fallen: boolean; air: number } | null;
  /** Ropes drawn this frame. */
  ropes: number;
}
