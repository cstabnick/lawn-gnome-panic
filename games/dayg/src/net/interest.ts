// Who hears what: interest sets for poses, bubbles and news (roadmap 8.6). Step 0 stub: empty sets.
import type { PlayerKey, RegionId, WorldState } from '../sim/types';

export function interestedPlayers(w: WorldState, me: PlayerKey): PlayerKey[] { return []; }
export function bubbleViewers(w: WorldState, owner: PlayerKey): PlayerKey[] { return []; }
export function newsSince(w: WorldState, tick: number): string[] { return []; }
export function regionSummary(w: WorldState, r: RegionId): { region: RegionId; hatless: number; npcs: number; danger: 0 | 1 | 2 | 3 } {
  return { region: r, hatless: 0, npcs: 0, danger: 0 };
}
