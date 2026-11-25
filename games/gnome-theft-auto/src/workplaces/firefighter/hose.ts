// E25 firefighter: the hose stream as ballistics, the tank, and the ladder. Pure (no three.js, no DOM).
// STUB: issue 12 fills it in.

export interface HoseAim {
  /** World yaw of the stream (0 = +z, like vehicle yaw: direction (sin yaw, cos yaw)). */
  yaw: number;
  /** Radians above level, HOSE.minPitch..HOSE.maxPitch. */
  pitch: number;
}

export const HOSE = {
  /** Muzzle speed, m/s. */
  speed: 15,
  gravity: 9.8,
  minPitch: 0.05,
  maxPitch: 0.95,
  /** Aim turn rates at full stick, rad/s. */
  yawRate: 1.2,
  pitchRate: 0.6,
  /** Radius of the wet patch where the stream lands. */
  sprayRadius: 1.6,
} as const;

/** Where the stream from `nozzle` along `aim` comes down to height `groundY` (t = seconds of flight). */
export function hoseLanding(nozzle: { x: number; y: number; z: number }, aim: HoseAim, groundY: number): { x: number; y: number; z: number; t: number } {
  void aim;
  return { x: nozzle.x, y: groundY, z: nozzle.z, t: 0 };
}

/** n points along the arc from the nozzle to the landing, written into out (x, y, z each). Returns how many. */
export function hoseArc(nozzle: { x: number; y: number; z: number }, aim: HoseAim, groundY: number, n: number, out: Float32Array): number {
  void nozzle; void aim; void groundY; void n; void out;
  return 0;
}

export interface Tank {
  /** Litres left. */
  level: number;
  cap: number;
}

/** Spray for dt seconds at `litresPerS`: returns the litres actually sprayed (less when the tank runs dry). */
export function drainTank(t: Tank, dt: number, litresPerS: number): number {
  const l = Math.min(t.level, dt * litresPerS);
  t.level -= l;
  return l;
}

/** Refill for dt seconds at `rate` litres a second, up to cap. */
export function refillTank(t: Tank, dt: number, rate: number): void {
  t.level = Math.min(t.cap, t.level + dt * rate);
}

/** Ladder extension: rises while held, stops when let go. 'rescue' = let go inside `band`; 'bonk' = ran past 1 (resets to 0). */
export interface LadderStep {
  ext: number;
  event: 'rescue' | 'bonk' | null;
}

export const LADDER = { rate: 0.32 } as const;

export function stepLadder(ext: number, hold: boolean, wasHeld: boolean, dt: number, band: [number, number]): LadderStep {
  void hold; void wasHeld; void dt; void band;
  return { ext, event: null };
}
