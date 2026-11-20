// The door problems the Analyze report lists: exits whose destination is not a known zone, and outdoor destinations whose arrival
// point a walker cannot reach. Pure: the caller decides what 'reachable' means (Analyze answers it from the destination's own flood
// fill). Indoor destinations are never reported as unreachable: their arrival point is inside a building the editor does not load.
import type { DoorLink } from '../doorLinks';

/** The problems of the exits standing in `zone`, one line each, in exit order. Empty when there are none. */
export function doorProblems(
  links: readonly DoorLink[],
  zone: string,
  reachable: (x: number, z: number) => boolean,
): string[] {
  const out: string[] = [];
  for (const l of links) {
    if (l.zone !== zone || l.kind !== 'exit') continue;
    if (!l.destKnown) {
      out.push(`exit "${l.label}" goes to unknown zone "${l.to}"`);
      continue;
    }
    if (!l.destIndoor && !reachable(l.arrive.x, l.arrive.z)) {
      out.push(`exit "${l.label}" arrives at ${l.arrive.x.toFixed(1)}, ${l.arrive.z.toFixed(1)} (${l.toName}), which is blocked or unreachable`);
    }
  }
  return out;
}
