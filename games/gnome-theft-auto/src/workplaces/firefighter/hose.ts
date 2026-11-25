// E25 firefighter: the hose stream as ballistics, the tank, and the ladder. Pure (no three.js, no DOM).
// Plan: docs/roadmaps/gta-batch-3/E25/roadmap.md.

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
function velocity(aim: HoseAim): { vx: number; vy: number; vz: number } {
  const cp = Math.cos(aim.pitch);
  return {
    vx: HOSE.speed * Math.sin(aim.yaw) * cp,
    vy: HOSE.speed * Math.sin(aim.pitch),
    vz: HOSE.speed * Math.cos(aim.yaw) * cp,
  };
}

/** Where the stream from `nozzle` along `aim` comes down to height `groundY` (t = seconds of flight). */
export function hoseLanding(nozzle: { x: number; y: number; z: number }, aim: HoseAim, groundY: number): { x: number; y: number; z: number; t: number } {
  const { vx, vy, vz } = velocity(aim);
  const g = HOSE.gravity;
  // y(t) = y0 + vy t - g t^2 / 2 = groundY; the later (positive) root is the landing.
  const disc = vy * vy + 2 * g * (nozzle.y - groundY);
  const t = disc < 0 ? 0 : (vy + Math.sqrt(disc)) / g;
  return { x: nozzle.x + vx * t, y: groundY, z: nozzle.z + vz * t, t };
}

/** n points along the arc from the nozzle to the landing, written into out (x, y, z each). Returns how many. */
export function hoseArc(nozzle: { x: number; y: number; z: number }, aim: HoseAim, groundY: number, n: number, out: Float32Array): number {
  const count = Math.min(Math.floor(n), Math.floor(out.length / 3));
  if (count < 2) return 0;
  const { vx, vy, vz } = velocity(aim);
  const land = hoseLanding(nozzle, aim, groundY);
  for (let i = 0; i < count; i++) {
    const tt = (land.t * i) / (count - 1);
    const o = i * 3;
    out[o] = nozzle.x + vx * tt;
    out[o + 1] = nozzle.y + vy * tt - (HOSE.gravity * tt * tt) / 2;
    out[o + 2] = nozzle.z + vz * tt;
  }
  // The last point is the landing exactly (float error would leave it a hair off groundY).
  const last = (count - 1) * 3;
  out[last] = land.x;
  out[last + 1] = groundY;
  out[last + 2] = land.z;
  return count;
}

export interface Tank {
  /** Litres left. */
  level: number;
  cap: number;
}

/** Spray for dt seconds at `litresPerS`: returns the litres actually sprayed (less when the tank runs dry). */
export function drainTank(t: Tank, dt: number, litresPerS: number): number {
  const l = Math.max(0, Math.min(t.level, dt * litresPerS));
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
  if (hold) {
    const next = ext + LADDER.rate * dt;
    // Ran past the top: bonk and drop back to the bottom.
    if (next > 1) return { ext: 0, event: 'bonk' };
    return { ext: next, event: null };
  }
  // Let go inside the band: rescue. Otherwise the ladder just stays where it is.
  if (wasHeld && ext >= band[0] && ext <= band[1]) return { ext, event: 'rescue' };
  return { ext, event: null };
}
