// Flood Run (?mode=flood), experimental: meltwater surges race down the mountain. Ride with a surge for a speed bonus.
// Water cannons and geysers shove you about. Contracts and tuning only: every flood module takes its types and
// numbers from here. Pure (THREE math only): no DOM, no Math.random (use the seeded rng below).
import type { HillParams } from '../descent/types';

/** The hill Flood Run is played on (a snowy Descent-style mountain, long and fairly steep). */
export const FLOOD_HILL: HillParams = { hazard: 0, steep: 3, tricky: 2, runs: 8 };
export const FLOOD_SEED = 11;

export const FLOOD = {
  // ---- shallow-water sim (flood/sim.ts, virtual pipes after Mei et al. 2007)
  cell: 0.75,           // m, grid cell size
  simHz: 30,           // fixed sim rate of the water
  gravity: 9.81,
  /** Flow friction: a baseline (1/s) plus Manning's n squared (n = 0.03, wet snow). */
  friction: 0.1,
  manning2: 0.001,
  /** Sampled flow speed is clamped to this (m/s): thin edges make the raw estimate spiky. */
  maxFlowSpeed: 12,
  /** The sim covers a band of rows around the rider (metres behind and ahead); the rest is dry. */
  windowBackM: 50,
  windowAheadM: 160,
  /** Per-run source at the top of every run: a steady stream plus a surge every `period` s (m³/s). */
  /** The source spreads over this share of the run's width on each side of the middle. */
  sourceHalfWidth: 0.32,
  /** The rider's run has a spring that travels with them: this many metres uphill of the rider, this share of the width each side. */
  anchorBehind: 16,
  anchorAhead: 16,
  /** The long spring spreads over many rows, so it gets more water. */
  anchorFlowScale: 3,
  /** Share of a surge's extra flow the rider's spring carries. */
  anchorSurge: 0.3,
  anchorHalf: 0.16,
  /** Depth (m) of the wet film a run starts with everywhere. */
  film: 0.15,
  baseFlow: 160,
  surgePeak: 600,
  periodMin: 24,
  periodMax: 38,
  /** Seconds water takes to cross from one run to the next: joined, a jump, a halfpipe. */
  linkDelay: { join: 0.4, jump: 1.6, pipe: 2.5 },
  // ---- the rider in water (flood/forces.ts)
  /** Water this deep (m) counts as water under the board. */
  minDepth: 0.08,
  /** The board rides ON the water surface from this depth (m), blending in over the next floatDepth metres. */
  floatDepth: 0.35,
  /** The board sits this far below the surface (m). */
  sink: 0.1,
  /** The surface the board rides is tilted by the water's slope, capped at this rise over run. */
  maxSurfaceSlope: 0.9,
  /** Deeper than this the board floats: carving grip is reduced. */
  deepDepth: 1.1,
  /** Ride with a surge: moving within this cosine of the flow, and the flow at least minFlow m/s, adds rideAccel. */
  minAlign: 0.55,
  minFlow: 1.5,
  rideAccel: 18,       // m/s² toward the flow speed (never pushes past flow speed + bonusMax)
  bonusMax: 16,        // m/s over the flow speed that the current will still push you...
  rideSpeedCap: 55,    // ...or up to this speed, whichever is higher: a fast rider is still pushed along in the water
  /** Against the flow (cos < -0.3): extra drag (1/s). */
  againstDrag: 1.4,
  /** Sideways push from flow you are not moving with (m/s² per m/s of cross flow). */
  crossPush: 1.2,
  /** Surf points per second while riding a surge, and the delay before riding counts (s). */
  surfPoints: 120,
  surfHold: 0.25,
  // ---- cannons and geysers (flood/obstacles.ts, flood/forces.ts)
  cannonsPerRun: 2,
  geysersPerRun: 2,
  cannonRange: 34,     // m, jet length
  cannonRadius: 1.8,   // m, jet half-width
  cannonPush: 38,      // m/s² along the jet while you are in it
  cannonWindup: 1.1,   // s of telegraph (the barrel glows, then fires)
  cannonBurst: 0.9,    // s of jet
  cannonPeriodMin: 5,
  cannonPeriodMax: 8,
  geyserRadius: 3.2,
  geyserWindup: 1.0,
  geyserBurst: 0.7,
  geyserLift: 20,      // m/s upward kick
  geyserPeriodMin: 6,
  geyserPeriodMax: 10,
  /** After one blast, a second within this many seconds bails the rider. */
  blastBailWindow: 2.5,
} as const;

/** Mulberry32, seeded: the pure modules never touch Math.random. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- water field (sim.ts provides, everything else reads)

/** What the water is doing at a point. */
export interface FlowSample {
  /** Water depth over the ground (m); 0 when dry. */
  depth: number;
  /** Horizontal flow velocity (m/s). */
  vx: number;
  vz: number;
  /** Ground height there, and the water surface height (bedY + depth). */
  bedY: number;
  surfaceY: number;
}

/** One run's water grid, exposed read-only for the view (flood/view.ts). Cell (k, j): k along the fall line (0 = top). */
export interface RunGrid {
  island: number;
  nu: number;
  nv: number;
  /** World position of cell (0, 0)'s centre, the unit vectors along k (downhill) and j (across), and the cell size. */
  ox: number;
  oz: number;
  fx: number;
  fz: number;
  sx: number;
  sz: number;
  cell: number;
  /** Ground height per cell (index j * nu + k) and water depth per cell. Both live: depth changes every step. */
  bed: Float32Array;
  depth: Float32Array;
  /** Flow speed per cell (m/s), refreshed every other sim step: for foam and colour. */
  speed: Float32Array;
  /** 1 where there is no ground (outside the island, or past its rim): water drains there. */
  hole: Uint8Array;
  /** True while this run is being simulated. Only rows lo..hi (inclusive) are: a band around the rider. */
  active: boolean;
  lo: number;
  hi: number;
}

export interface Flood {
  /** Sim time in seconds. */
  time: number;
  runs: RunGrid[];
  /** Advance by real dt (the sim steps itself at FLOOD.simHz). */
  step(dt: number): void;
  /** Restart the clock and the water: run 0's first surge starts in `firstSurgeIn` seconds (from the rider's start). */
  restart(firstSurgeIn: number): void;
  /** Where the rider is (call every frame): their run's spring moves with them instead of sitting at the top. */
  anchor(x: number, z: number, island: number): void;
  /** The rider's run: only runs inside the window around it are simulated. */
  focus(island: number): void;
  /** Sample water at (x, z), trying run `hint` first then its neighbours. False (out filled with zeros) if there is no water. */
  sample(x: number, z: number, hint: number, out: FlowSample): boolean;
  /** Total water volume (m³) currently in the grids: for tests and the HUD. */
  volume(): number;
}

// ---------------------------------------------------------------- obstacles (obstacles.ts provides)

export type Windup = 'idle' | 'windup' | 'fire';

/** A water cannon on a bank, aimed across the run. The jet is a capsule from the muzzle along (sin yaw, 0, cos yaw). */
export interface Cannon {
  id: number;
  island: number;
  /** Muzzle position. */
  x: number;
  y: number;
  z: number;
  yaw: number;
  /** Seconds per cycle, and the offset into it. Cycle: idle, then windup (telegraph), then fire (burst). */
  period: number;
  phase: number;
}

/** A geyser: a vertical burst on the run, telegraphed by a ring on the ground. */
export interface Geyser {
  id: number;
  island: number;
  x: number;
  y: number;
  z: number;
  period: number;
  phase: number;
}

export interface Obstacles {
  cannons: Cannon[];
  geysers: Geyser[];
}

/** State of a cannon or geyser at time t. k runs 0..1 through the windup or the burst; 0 when idle. */
export interface CycleState {
  phase: Windup;
  k: number;
}

// ---------------------------------------------------------------- rider stats (forces.ts provides, hud.ts shows)

export interface FloodStats {
  /** Riding a surge right now. */
  surfing: boolean;
  /** 0..1: how hard the current is pushing you right now (0 when not riding), for the HUD meter. */
  bonus: number;
  /** Seconds spent surfing in total, and the points that earned. */
  surfT: number;
  surfPoints: number;
  /** Blasts taken (cannon or geyser), and time since the last one. */
  blasts: number;
  sinceBlast: number;
  /** Water depth under the board (m). */
  depth: number;
  /** Nearest cannon that is winding up or firing within 70 m: where it is relative to the rider's heading. */
  warn: { kind: 'cannon' | 'geyser'; dist: number; bearing: number; fire: boolean } | null;
}

export function newFloodStats(): FloodStats {
  return { surfing: false, bonus: 0, surfT: 0, surfPoints: 0, blasts: 0, sinceBlast: 999, depth: 0, warn: null };
}
