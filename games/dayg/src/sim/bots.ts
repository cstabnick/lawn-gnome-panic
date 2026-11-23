// Scripted bot players for the headless sim (roadmap 7.7). Step 0 stub: runs the world with no bots.
import { TUNING } from './tuning';
import type { ActionEnvelope, DailyRow, DeathCause, DistrictId, MapKind, PlayerKey, QuestTemplate, RegionId, Tuning, WorldState } from './types';
import type { Rng, Streams } from './rng';
import { createWorld, runDays } from './world';

export type BotKind = 'quester' | 'scavenger' | 'solo' | 'friends';
export interface BotRow {
  seed: number; bot: PlayerKey; kind: BotKind; day: number; region: RegionId | null; alive: boolean; questsNear: number;
  templatesSeen: QuestTemplate[]; questsDone: number; districts: DistrictId[]; sessionOk: boolean | null; deaths: number;
  cause: DeathCause | null;
}

export function addBots(w: WorldState, s: Streams, kinds: readonly BotKind[]): PlayerKey[] { return []; }
export function stepBots(w: WorldState, s: Streams, bots: readonly PlayerKey[]): ActionEnvelope[] { return []; }
export function botDaily(w: WorldState, bots: readonly PlayerKey[]): BotRow[] { return []; }
export function runWithBots(seed: number, days: number, kinds: readonly BotKind[], opts?: { tuning?: Tuning; map?: MapKind; perturb?: boolean }):
  { world: WorldState; rows: DailyRow[]; bots: BotRow[] } {
  const { world, streams } = createWorld(seed, opts?.tuning ?? TUNING, undefined, { map: opts?.map });
  runDays(world, streams, days);
  return { world, rows: world.daily, bots: [] };
}
export function divergence(a: WorldState, b: WorldState): number { return 0; }
export function nullPerturb(w: WorldState, rng: Rng): void { /* roadmap 7.7 */ }
