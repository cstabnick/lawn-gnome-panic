// Pure positional-audio maths (no AudioContext): distance falloff, stereo pan and distance muffling.

export interface Spatial {
  /** 0..1 linear gain after distance falloff (0 at or beyond maxDist). */
  gain: number;
  /** -1 (left) .. 1 (right). */
  pan: number;
  /** Lowpass cutoff in Hz: 20000 near, falling to about 900 at maxDist (far sounds are duller). */
  cutoff: number;
  /** Metres. */
  dist: number;
}

/**
 * Where a sound at (sx, sz) sits for a listener at (lx, lz) facing `yaw` (the chase camera yaw: forward is
 * (sin yaw, cos yaw), right is (-cos yaw, sin yaw), matching the old playSpatialSfx).
 */
export function spatial(sx: number, sz: number, lx: number, lz: number, yaw: number, maxDist: number): Spatial {
  const dx = sx - lx;
  const dz = sz - lz;
  const dist = Math.hypot(dx, dz);
  if (dist >= maxDist || maxDist <= 0) return { gain: 0, pan: 0, cutoff: 900, dist };
  const u = dist / maxDist;
  // Inverse-ish falloff that reaches exactly 0 at maxDist: loud close up, a long quiet tail.
  const gain = Math.min(1, 1 / (1 + dist * 0.08)) * (1 - u) ** 1.2;
  const rightX = -Math.cos(yaw);
  const rightZ = Math.sin(yaw);
  const pan = Math.max(-0.85, Math.min(0.85, (dx * rightX + dz * rightZ) / Math.max(4, dist)));
  const cutoff = 20000 * Math.pow(900 / 20000, Math.min(1, u * 1.15));
  return { gain, pan, cutoff, dist };
}

/**
 * Voice budget: should a new sound of loudness `loud` start while `active` voices (their loudness) play and the cap is `max`?
 * 'play', 'steal' (start it and fade out the quietest active voice) or 'drop'.
 */
export function admit(loud: number, active: readonly number[], max: number): 'play' | 'steal' | 'drop' {
  if (active.length < max) return 'play';
  let quietest = Infinity;
  for (const a of active) quietest = Math.min(quietest, a);
  return loud > quietest * 1.2 ? 'steal' : 'drop';
}

/** The deepest of several duck levels (each 0..1, 1 = no duck): the minimum, or 1 when there are none. */
export function duckLevel(levels: Iterable<number>): number {
  let m = 1;
  for (const l of levels) m = Math.min(m, Math.max(0, Math.min(1, l)));
  return m;
}
