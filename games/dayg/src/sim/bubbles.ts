// L0 bubbles: one per region with a player in it. Step 0 stub: bubbleHatless is real; roadmap 8.5 and 7.5 do the rest.
import type { Arrival, Bubble, PlayerKey, RegionId, WorldState } from './types';

export function bubbleOf(w: WorldState, player: PlayerKey): Bubble | null { return null; }
export function bubbleIn(w: WorldState, r: RegionId): Bubble | null { return null; }
export function enterRegion(w: WorldState, player: PlayerKey, r: RegionId | null, alive: number): { promoted: number; owner: PlayerKey | null } {
  return { promoted: 0, owner: null };
}
export function absorbBubbles(w: WorldState): Arrival[] { return []; }
export function destroyInBubble(w: WorldState, r: RegionId): boolean { return false; }
export function bubbleHatless(w: WorldState): number {
  let n = 0;
  for (const b of w.bubbles) n += b.hatless;
  return n;
}
