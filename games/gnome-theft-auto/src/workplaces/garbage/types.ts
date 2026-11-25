// E25 garbage job (the Turfton bin round): shared contracts for round.ts, lift.ts, liftUi.ts, bins.ts, depot.ts and
// runtime.ts. Pure types and tuning, no imports of game systems at runtime. Plan: docs/roadmaps/gta-batch-3/E25/roadmap.md.

/** Tuning for the round (tweak here). */
export const GARBAGE = {
  /** Bins in a round: 6 + level (level 1..6), plus 0..2 by seed, clamped to binsMax. */
  binsMin: 6,
  binsMax: 14,
  /** Metres between bins along a street (at least). */
  binGap: 22,
  /** The bin stands this far from the road's centre line, on the right-hand (kerb) side of the travel direction. */
  kerbOffset: 5.6,
  /** Round streets stay inside |x|, |z| <= this (Turfton's grid). */
  cityHalf: 200,
  /** Stopped (|speed| < stopSpeed) with the bin within stopRadius of the lorry centre: "Lift bin". */
  stopRadius: 5,
  stopSpeed: 1.2,
  /** Out of the lorry and this far from it for abandonS seconds: the round is abandoned (paid for what was done). */
  abandonDist: 60,
  abandonS: 45,
  /** Within this of the depot tip anchor in the lorry: "Tip the load" ends the round. */
  tipRadius: 9,
} as const;

/** One kerbside bin of a round. */
export interface BinStop {
  /** 0..n-1, the order of the round. */
  id: number;
  x: number;
  z: number;
  /** The way the bin faces: toward the road (its handle side away from the road). */
  yaw: number;
  /** Street label shown on the HUD ("Kerb Row"). */
  street: string;
  /** Bin body colour (prefab tint), one of BIN_TINTS. */
  tint: number;
  /** A heavy bin (garden waste): the swing is faster and the lift slower. */
  heavy: boolean;
  /** full -> done (emptied and set down) or spilled (emptied, but litter went everywhere). */
  state: 'full' | 'done' | 'spilled';
}

export interface BinRound {
  stops: BinStop[];
  seed: number;
  /** "Bin round: Kerb Row and Fern Row". */
  title: string;
}

/** Wheelie-bin body colours (green garden, black general, blue recycling, brown compost). */
export const BIN_TINTS: readonly number[] = [0x3f8f3a, 0x2b2b2b, 0x2f64c9, 0x7a5230];

// ---- The lift-arm minigame (lift.ts is pure; liftUi.ts draws it and reads the button) ----

/**
 * grab: the claw swings across the bin; press when the swing is near the middle (|swing| <= LIFT.grabWindow).
 * lift: hold to raise; let go with tilt inside [tipMin, tipMax] to tip it clean; holding past spillAt spills.
 * lower: hold to lower; the bin sways as it comes down and is set down when tilt reaches 0: neat = 1 - |swing| there.
 * done: finished (liftResult gives the score).
 */
export type LiftPhase = 'grab' | 'lift' | 'lower' | 'done';

export interface LiftState {
  phase: LiftPhase;
  /** Seconds since the minigame opened. */
  t: number;
  /** Seconds in the current phase (the swing clock). */
  phaseT: number;
  /** The claw / bin sway, -1..1 (0 = centred on the bin or on the kerb mark). */
  swing: number;
  /** Grab presses that missed. */
  misses: number;
  /** 0..1: arm lift (0 = bin on the ground, 1 = fully over the hopper). */
  tilt: number;
  /** The button was held on the previous step (for release edges). */
  wasHeld: boolean;
  /** Set once the bin was over-tipped. */
  spilled: boolean;
  /** Set once emptied (clean tip or spill). */
  emptied: boolean;
  /** 0..1 how neat the set-down was (written when phase becomes 'done'). */
  neat: number;
  heavy: boolean;
}

export type LiftEvent = 'grab-miss' | 'grabbed' | 'tipped' | 'spill' | 'set-down';

export interface LiftInput {
  /** The button went down this step (edge). */
  press: boolean;
  /** The button is held now. */
  hold: boolean;
}

export interface LiftResult {
  stars: 1 | 2 | 3 | 4 | 5;
  /** 0..1. >= LIFT.neatBar counts for Kerb Appeal and the tip. */
  neat: number;
  spilled: boolean;
  misses: number;
  seconds: number;
}

export const LIFT = {
  /** Swing frequency in the grab and lower phases, Hz (heavy bins x heavySwing). */
  swingHz: 0.8,
  heavySwing: 1.35,
  /** |swing| at or under this on a grab press = grabbed. */
  grabWindow: 0.22,
  /** After this many misses the claw grabs anyway (clumsily). */
  maxMisses: 3,
  /** Tilt per second while holding in the lift phase (heavy x heavyLift). */
  liftRate: 0.42,
  heavyLift: 0.75,
  /** Let go between these to tip clean. */
  tipMin: 0.82,
  tipMax: 0.96,
  /** Holding to here spills. */
  spillAt: 1,
  /** Tilt lost per second while holding in the lower phase. */
  lowerRate: 0.55,
  /** Swing amplitude while lowering (a full swing is 1). */
  lowerSwing: 1,
  /** neat >= this counts as a neat set-down. */
  neatBar: 0.85,
} as const;

/**
 * The Bin Lorry prefab's lift arm (gta-bin-lorry): pivot 'arm' on the kerb (-x) side. At rotation.z = 0 the arm hangs
 * straight down; rotation.z = ARM.max * tilt swings it up and over the hopper toward +x. The claw is at `tip` in the
 * arm pivot's local space (prefab units, before the vehicle's scale).
 */
export const ARM = { pivot: 'arm', tip: [0, -0.5, 0] as const, max: 2.4 } as const;

/** Window event the depot's "Start a bin round" spot dispatches; garbage/runtime.ts listens. */
export const GARBAGE_START_EVENT = 'gta:garbage-start';
