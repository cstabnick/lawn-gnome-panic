// Factions and power (society.md "Factions and power", havens.md). Step 0 stub: roadmap 7.2 fills FOUNDERS and the behaviour.
import type { DailyRow, Faction, FactionId, FounderId, HavenId, Norms, NpcId, NpcTraits, Npc, PlayerKey, Rank, RegionId, WorldState } from './types';
import type { Rng } from './rng';

export interface FounderDef { id: FounderId; name: string; faction: string; hat: number; home: RegionId; fallback: RegionId; traits: Partial<NpcTraits>; norms: Norms }
export const FOUNDERS: readonly FounderDef[] = [];

export function seedFactions(w: WorldState, rng: Rng): void { /* roadmap 7.2 */ }
export function stepFactions(w: WorldState, rng: Rng): void { /* roadmap 7.2 */ }
export function factionOf(w: WorldState, npc: Npc): Faction | null { return null; }
export function membersOf(w: WorldState, f: Faction): NpcId[] { return []; }
export function powerOf(w: WorldState, f: Faction): number { return 0; }
export function havenHolder(w: WorldState, h: HavenId): FactionId | null { return null; }
export function rankOf(w: WorldState, f: FactionId, player: PlayerKey): Rank | null { return null; }
export function joinFaction(w: WorldState, f: FactionId, player: PlayerKey): boolean { return false; }
export function leaveFaction(w: WorldState, player: PlayerKey): void { /* roadmap 7.2 */ }
export function promoteRanks(w: WorldState, player: PlayerKey): Rank | null { return null; }
export function factionDaily(w: WorldState): Pick<DailyRow, 'factions' | 'topFactions' | 'hhiNorm' | 'topShare' | 'havensUp' | 'havenHolders'> {
  return { factions: 0, topFactions: [], hhiNorm: 0, topShare: 0, havensUp: 0, havenHolders: {} };
}
