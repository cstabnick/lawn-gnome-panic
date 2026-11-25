// E25 fire system: reusable fires any module can light, spread and put out with water. Pure data here; the simulation
// is fire/sim.ts (pure functions, no three.js) and the look is fire/view.ts. Contract: docs/roadmaps/gta-batch-3/E25/contracts.md.
//
//   const field = createFireField();
//   ignite(field, x, y, z, { r: 0.8, kind: 'bin', fuel: 120 });
//   const view = createFireView(scene, fx);
//   each frame: const events = stepFires(field, dt, fuel); view.update(dt, field, camX, camZ);
//   a hose: douse(field, landX, landZ, 1.6, litres) -> heat taken off; view.steam(x, y, z) for the hiss.

export type FireKind = 'bin' | 'shed' | 'bbq' | 'toadstool' | 'hedge' | 'generic';

/** burning: on fire. out: put out (smoulders, then is gone). burnt: burned through its fuel unchecked. */
export type FireState = 'burning' | 'out' | 'burnt';

export interface Fire {
  id: number;
  x: number;
  /** Base of the flames (ground or the top of what burns). */
  y: number;
  z: number;
  /** Radius of the burning patch, metres (0.3..3). */
  r: number;
  /** 0..1: how hard it burns. Grows toward 1 by FIRE.growPerS while burning; water takes it down; <= FIRE.outHeat = out. */
  heat: number;
  /** Seconds of burning left at full heat; burns at `heat` per second. 0 = burnt (state 'burnt'). */
  fuel: number;
  kind: FireKind;
  state: FireState;
  /** Seconds since it went out or burnt (smoke and scorch fade on this clock). */
  since: number;
  /** 0..1 how wet it is: water raises it, it dries at FIRE.dryPerS; a wet fire grows slower (growth x (1 - wet)). */
  wet: number;
  /** Who lit it (a fire call id, 'story-ch3', ...): clear and count by group. */
  group: string | null;
}

/** Something that can catch: a fire near it at heat >= FIRE.spreadHeat for FIRE.spreadAfterS seconds lights it. */
export interface FuelPoint {
  x: number;
  y: number;
  z: number;
  r: number;
  kind: FireKind;
  /** Seconds of fuel the new fire gets. */
  fuel: number;
  group: string | null;
  /** Seconds of exposure so far (the sim writes it). */
  exposure: number;
  /** True once it has caught (it never catches twice). */
  lit: boolean;
}

export interface FireField {
  fires: Fire[];
  nextId: number;
}

export type FireEvent =
  | { t: 'ignite'; id: number }
  | { t: 'spread'; id: number }
  | { t: 'out'; id: number }
  | { t: 'burnt'; id: number }
  | { t: 'gone'; id: number };

/** Tuning (tweak here). */
export const FIRE = {
  /** Heat gained per second while burning (times 1 - wet). */
  growPerS: 0.06,
  /** Heat removed per litre of water landing on a fire. */
  douseHeatPerLitre: 0.09,
  /** Wetness added per litre. */
  wetPerLitre: 0.12,
  /** Wetness lost per second. */
  dryPerS: 0.05,
  /** At or below this heat a fire is out. */
  outHeat: 0.04,
  /** Heat at which a fire can light a fuel point in range. */
  spreadHeat: 0.7,
  /** Seconds of exposure before a fuel point catches. */
  spreadAfterS: 7,
  /** A fuel point catches from a fire within this distance (centre to centre, metres) plus both radii. */
  spreadRange: 2.5,
  /** Seconds an 'out' or 'burnt' fire smokes before it is removed ('gone' event). */
  smokeS: 14,
  /** At most this many fires in a field (ignite returns the oldest fire's slot reused beyond it). */
  maxFires: 32,
  /** Heat a new fire starts at, unless given. */
  startHeat: 0.5,
} as const;

export interface IgniteOpts {
  r?: number;
  kind?: FireKind;
  heat?: number;
  /** Default 120 s. */
  fuel?: number;
  group?: string | null;
}
