// E25 garbage: plan a bin round along Turfton's streets from the road graph. Pure (no three.js, no DOM).
// STUB: issue 05 fills it in.
import type { RoadGraph } from '../../types';
import type { BinRound } from './types';

export interface RoundOpts {
  /** Career level 1..6. */
  level: number;
  seed: number;
  /** Start the walk at the city road node nearest this point (the depot gate, or the lorry). */
  from: { x: number; z: number };
  /** False when a bin of radius r cannot stand at (x, z) (a building, water, a wall). */
  clear(x: number, z: number, r: number): boolean;
}

export function makeRound(roads: RoadGraph, opts: RoundOpts): BinRound {
  void roads;
  return { stops: [], seed: opts.seed, title: 'Bin round' };
}
