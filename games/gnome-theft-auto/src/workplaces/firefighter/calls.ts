// E25 firefighter: fire calls (what is burning, where, who called, whether someone is stuck up high) and how a call is
// scored. Pure. STUB: issue 11 fills it in.
import type { CallOutcome, CallPlace, CallScore, FireCall } from './types';

/** Mossy Wood clearings for toadstool calls (world x, z; the runtime finds clear ground near each). */
export const FOREST_PLACES: readonly CallPlace[] = [
  { id: 'mossy-clearing-1', name: 'a Mossy Wood clearing', x: -380, z: -20, area: 'forest' },
];

/** A call for `level` (1..6) at one of `places`, picked by `seed`. */
export function makeCall(level: number, seed: number, places: readonly CallPlace[], id = 1): FireCall {
  void level;
  const place = places[0] ?? FOREST_PLACES[0];
  return {
    id, kind: 'bin', title: `Bin fire: ${place.name}`, place,
    props: [{ prefab: 'gta-wheelie-bin', dx: 0, dz: 0, yaw: 0 }],
    fires: [{ dx: 0, y: 0.9, dz: 0, r: 0.5, fuel: 90 }], spread: [], rescue: null,
    caller: 'A neighbour', line: 'It was like that when I got here.', seed,
  };
}

export function scoreCall(call: FireCall, o: CallOutcome): CallScore {
  void call; void o;
  return { stars: 3, lines: [], quote: 'Chief Pumpwell: "Damp. Good."' };
}
