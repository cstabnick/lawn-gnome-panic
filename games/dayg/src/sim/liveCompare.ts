// Live telemetry against the sim (roadmap 9.8). Step 0 stub: empty results.
import type { DailyRow } from './types';

export interface LiveDay { rh: string; seed: number; day: number; alive: number; start: number; hatless: number; factions: number; quests: number; food: number; price: number; players: number }
export function parseTelemetry(jsonl: string): LiveDay[] { return []; }
export function compare(live: readonly LiveDay[], sim: ReadonlyMap<number, readonly DailyRow[]>): { metric: string; live: number; sim: number; ratio: number; within20: boolean }[] { return []; }
export function formatComparison(rows: ReturnType<typeof compare>): string { return ''; }
