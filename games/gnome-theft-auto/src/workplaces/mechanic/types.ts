// E24 mechanic job: the shared contracts of the mechanic modules (briefs.ts briefs and scoring, lot.ts the client lot
// at Pay 'n' Glaze, runtime.ts the glue; glazeClient.ts + glazeShop.ts client mode).
import type { GnomeLook } from '@lawn/gnome';
import type { Loadout } from '@lawn/glaze';
import type { VehicleKind } from '../../types';
import type { Stars } from '../../jobs/workDefs';

/** Colour families a client can ask for (briefs.ts hueFamily maps any 0xRRGGBB to one). */
export type HueFamily = 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'purple' | 'pink' | 'brown' | 'black' | 'white' | 'grey';

/** Loadout slots a brief can name. "Empty" means 'none' (or 'stock' for tyre/rim/steer/lamp/grille/bumper/horn). */
export type PartSlot =
  | 'decal' | 'tyre' | 'rim' | 'steer' | 'lamp' | 'spoiler' | 'seat' | 'ornament' | 'grille' | 'bumper' | 'canopy'
  | 'mirror' | 'exhaust' | 'horn';

/**
 * One thing the client wants (briefs.ts wantMet decides it on the final loadout, given the start loadout):
 *   paint:  hueFamily(final.paint) === hue.
 *   finish: final.finish is one of `any`.
 *   loud:   final.horn is one of 'siren' | 'trumpet' | 'moo' | 'kazoo', or final.exhaust is 'trumpet' | 'twin'.
 *   quiet:  final.horn is 'stock' | 'squeak' and final.exhaust is 'none'.
 *   glow:   final.underglow !== null.
 *   low / high: final.rideHeight <= -0.4 / >= 0.4.
 *   bigWheels:  final.wheelSize >= 1.2.
 *   part:   final[slot] is one of `any`, or (no `any`) final[slot] is not empty.
 *   noPart: final[slot] is empty.
 *   extra:  final.extras contains one of `any`.
 *   keep:   final[slot] equals start[slot] (deep-equal for extras).
 *   changed: final differs from start in at least `n` of the PartSlot slots plus paint, finish, underglow.
 */
export type Want =
  | { kind: 'paint'; hue: HueFamily }
  | { kind: 'finish'; any: string[] }
  | { kind: 'loud' }
  | { kind: 'quiet' }
  | { kind: 'glow' }
  | { kind: 'low' }
  | { kind: 'high' }
  | { kind: 'bigWheels' }
  | { kind: 'part'; slot: PartSlot; any?: string[] }
  | { kind: 'noPart'; slot: PartSlot }
  | { kind: 'extra'; any: string[] }
  | { kind: 'keep'; slot: keyof Loadout }
  | { kind: 'changed'; n: number };

export interface BriefWant {
  want: Want;
  /** Relative weight (1 = normal, 2 = what they really care about). */
  weight: number;
  /** How the client grades it on the card: "pink", "loud", "no spoiler, I'm not a teenager". */
  says: string;
}

export interface Brief {
  id: string;
  /** The client's name: "Bramble Fennick". */
  client: string;
  /** Hat, shirt, beard colours of the client gnome. */
  look: Partial<GnomeLook>;
  /** A ground vehicle the shop dresses (glazeStore.ts GLAZE_KINDS). */
  vehicle: VehicleKind;
  /** What the car looks like when it arrives (merged over defaultLoadout(paint)). */
  start: Partial<Loadout>;
  /** The brief in the client's words: "Make it pink and loud." */
  text: string;
  wants: BriefWant[];
  /** Acorns for parts. Going over lowers the rating. */
  budget: number;
  /** Mechanic level that unlocks it (1..6). */
  minLevel: number;
  /** What they say at five stars, and at one star. */
  good: string;
  bad: string;
}

export interface BriefScore {
  /** 0..100. */
  score: number;
  stars: Stars;
  /** Acorns over budget (0 when inside). */
  overBudget: number;
  /** Card lines: "✓ pink", "✗ loud", "Over budget by 40 🌰". */
  lines: string[];
}
