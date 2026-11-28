// Traffic-director hats (GTA batch 3, E28): at a few busy junctions an HOA traffic gnome in a tall striped hat stands on
// a podium in the middle of the crossing and waves one road through while holding the other. Pure: no three.js, no DOM.
//
// Phases come from one clock (directorSignal(d, nowSeconds()): wall time at load plus game time), so every client and
// the drivers agree without any sync: GO along axis A for `period` seconds, a short all-stop CLEAR, GO along axis B, CLEAR, repeat. Axis A is the road
// whose direction is `yaw` (radians, 0 = along +z); axis B is everything else. A car heading into the junction on the
// held axis stops at STOP_LINE metres from the centre (traffic.ts and trafficSim.ts); a car already past the line goes on.
// The view (trafficDirectorsView.ts) turns the gnome to face the held road with its paddle up.

export interface Director {
  id: string;
  /** Who the lore says is on duty (shown nowhere yet; E30/E09 may give them a line). */
  label: string;
  /** The junction centre (a road-graph node), world coordinates. */
  x: number;
  z: number;
  /** Direction of axis A, radians (0 = along z, PI/2 = along x). */
  yaw: number;
  /** Seconds each axis gets the go. */
  period: number;
  /** Seconds of all-stop between the two goes (the junction clears). */
  clear: number;
  /** Phase offset, seconds, so neighbouring directors are not in step. */
  offset: number;
}

/** Cars on the held road stop with their front this far before the junction centre (metres, along their lane). */
export const STOP_LINE = 9;

/** Directors only act within this distance of the junction centre (a car this far out ignores them). */
export const DIRECTOR_REACH = 40;

/** Every traffic director: three on Turfton's busiest crossings, one at Pardonlin's High Street crossing. */
export const DIRECTORS: readonly Director[] = [
  { id: 'turfton-hospital-cross', label: 'Warden Sedge Pennyroyal', x: 60, z: 0, yaw: 0, period: 7, clear: 1.5, offset: 0 },
  { id: 'turfton-mulch-cross', label: 'Warden Burnet Gatepost', x: -60, z: -60, yaw: 0, period: 6, clear: 1.5, offset: 3.1 },
  { id: 'turfton-south-cross', label: 'Warden Agrimony Kerb', x: 0, z: 120, yaw: Math.PI / 2, period: 6.5, clear: 1.5, offset: 5.3 },
  { id: 'pardonlin-haute-cross', label: 'Herr-Monsieur Lupin Pardoux', x: -1462, z: -30, yaw: 0, period: 8, clear: 2, offset: 1.7 },
];

/** Which road may go now. */
export type DirectorSignal = 'a' | 'b' | 'clear';

// The clock: wall time when the page loaded, then game time (traffic steps it every frame through stepGhosts), so a
// headless sim that runs minutes in seconds still sees the wardens cycle, and clients that loaded at different times
// still agree to within their pauses.
let BASE = Date.now() / 1000;
let elapsed = 0;

/** Tests: restart the game clock at `base` seconds (default 0), so a headless sim sees the same warden phases on every run
 *  and in any test order (the clock is module state that every traffic step advances). */
export function resetDirectorClock(base = 0): void {
  BASE = base;
  elapsed = 0;
}
let override: (() => number) | null = null;

/** Seconds on the shared warden clock. */
export function nowSeconds(): number {
  return override ? override() : BASE + elapsed;
}

/** Step the warden clock by dt seconds of game time (trafficSim.ts stepGhosts calls it once per traffic frame). */
export function advanceDirectorClock(dt: number): void {
  if (Number.isFinite(dt) && dt > 0) elapsed += dt;
}

/** Tests: replace the clock (seconds); call with no argument to go back to the game clock. */
export function setDirectorClock(fn?: () => number): void {
  override = fn ?? null;
}

/** The signal of director `d` at clock time `t` (seconds). */
export function directorSignal(d: Director, t: number): DirectorSignal {
  const cycle = 2 * (d.period + d.clear);
  let u = (t + d.offset) % cycle;
  if (u < 0) u += cycle;
  if (u < d.period) return 'a';
  if (u < d.period + d.clear) return 'clear';
  if (u < 2 * d.period + d.clear) return 'b';
  return 'clear';
}

/** True when heading (dirX, dirZ) runs along axis A of `d` (either way, within 45 degrees). */
export function onAxisA(d: Director, dirX: number, dirZ: number): boolean {
  const ax = Math.sin(d.yaw), az = Math.cos(d.yaw);
  const l = Math.hypot(dirX, dirZ) || 1;
  return Math.abs((dirX * ax + dirZ * az) / l) >= Math.SQRT1_2;
}

/** The director standing at (x, z) (within `tol` metres), or null. */
export function directorAt(x: number, z: number, tol = 1): Director | null {
  for (const d of DIRECTORS) if (Math.hypot(d.x - x, d.z - z) <= tol) return d;
  return null;
}

/**
 * True when a car heading (dirX, dirZ) into the junction of `d` must wait at the line at time `t`: its road is not the
 * one waved through (or the junction is clearing).
 */
export function mustStop(d: Director, t: number, dirX: number, dirZ: number): boolean {
  const s = directorSignal(d, t);
  if (s === 'clear') return true;
  return onAxisA(d, dirX, dirZ) ? s !== 'a' : s !== 'b';
}

/**
 * Speed cap (m/s) for a car `remaining` metres (along its lane) from the junction centre of `d`, heading (dirX, dirZ),
 * at time `t`: Infinity when it may go (or is already past the line, or too far out), else the speed that stops it at
 * STOP_LINE braking at `decel` m/s^2.
 */
export function directorSpeedCap(d: Director, t: number, dirX: number, dirZ: number, remaining: number, decel = 4): number {
  if (remaining > DIRECTOR_REACH || remaining < STOP_LINE - 1.5) return Infinity;
  if (!mustStop(d, t, dirX, dirZ)) return Infinity;
  const gap = Math.max(0, remaining - STOP_LINE);
  return Math.sqrt(2 * decel * gap);
}

/** The heading (yaw, radians, 0 = +z) the gnome faces at time t: toward the held road (axis B while A goes). */
export function directorFacing(d: Director, t: number): number {
  const s = directorSignal(d, t);
  return s === 'b' ? d.yaw : d.yaw + Math.PI / 2;
}

/** Watches the player for the achievement gta-hat-wave: held at a warden's line (stopped there while it holds their road), then waved on. */
export interface WaveWatch {
  /** Feed the player's vehicle position, heading (yaw, 0 = +z), speed (m/s) and the clock each frame; true once waved through. */
  step(x: number, z: number, yaw: number, speed: number, t: number): boolean;
}

export function createWaveWatch(directors: readonly Director[] = DIRECTORS): WaveWatch {
  let waiting: Director | null = null;
  let waitT = 0;
  let lastT = -Infinity;
  return {
    step(x, z, yaw, speed, t) {
      const dt = Number.isFinite(lastT) ? Math.max(0, Math.min(0.5, t - lastT)) : 0;
      lastT = t;
      const dirX = Math.sin(yaw), dirZ = Math.cos(yaw);
      for (const d of directors) {
        const dx = d.x - x, dz = d.z - z;
        const dist = Math.hypot(dx, dz);
        // Near the line on an approach, facing the junction.
        if (dist < STOP_LINE - 1 || dist > STOP_LINE + 12 || (dx * dirX + dz * dirZ) / (dist || 1) < 0.7) continue;
        if (mustStop(d, t, dirX, dirZ)) {
          if (Math.abs(speed) < 1.5) {
            if (waiting !== d) { waiting = d; waitT = 0; }
            waitT += dt;
          }
          return false;
        }
        // Waved through after a real wait at this warden's line.
        if (waiting === d && waitT >= 1.5) { waiting = null; waitT = 0; return true; }
        return false;
      }
      if (waiting) {
        const dw = Math.hypot(waiting.x - x, waiting.z - z);
        if (dw > STOP_LINE + 20) { waiting = null; waitT = 0; }
      }
      return false;
    },
  };
}
