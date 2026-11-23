// Pay 'n' Glaze achievements: which ones a purchase unlocks (pure; the app passes the tracker in).
// STUB: the achievements issue fills it; the exported names and shapes are final.
import type { Loadout } from '@lawn/glaze';
import type { VehicleKind } from './types';

export interface GlazePurchase { kind: VehicleKind; before: Loadout; after: Loadout; spent: number }
export interface AchievementSink { unlock(id: string): unknown; increment(id: string, by?: number): unknown }

export const GLAZE_ACHIEVEMENT_IDS: readonly string[] = [];

export function glazeAchievements(_p: GlazePurchase, _sink: AchievementSink): void {
  /* stub */
}
