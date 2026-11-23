// Pay 'n' Glaze achievements: which ones a purchase unlocks (pure; the app passes the tracker in).
import type { Loadout } from '@lawn/glaze';
import type { VehicleKind } from './types';

export interface GlazePurchase { kind: VehicleKind; before: Loadout; after: Loadout; spent: number }
export interface AchievementSink { unlock(id: string): unknown; increment(id: string, by?: number): unknown }

export const GLAZE_ACHIEVEMENT_IDS: readonly string[] = [
  'gta-new-coat',
  'gta-slammed',
  'gta-camber-gang',
  'gta-show-pony',
  'gta-full-glaze',
];

/** Ride height at or below this is "at the bottom of the dial". */
const SLAMMED_AT = -0.95;
/** Both axles at or past this camber (degrees, negative = leaning in) is "Camber Gang". */
const CAMBER_GANG_AT = -15;

/** Report the achievements a Pay 'n' Glaze purchase earns. A purchase that spent nothing earns nothing. */
export function glazeAchievements(p: GlazePurchase, sink: AchievementSink): void {
  if (p.spent <= 0) return;
  const { before, after } = p;

  sink.unlock('gta-new-coat');
  sink.increment('gta-full-glaze', p.spent);

  if (after.rideHeight <= SLAMMED_AT && before.rideHeight > SLAMMED_AT) sink.unlock('gta-slammed');

  if (after.camberFront <= CAMBER_GANG_AT && after.camberRear <= CAMBER_GANG_AT) sink.unlock('gta-camber-gang');

  if (
    after.spoiler !== 'none' && after.ornament !== 'none' && after.seat !== 'none' && after.decal !== 'none'
    && after.extras.length >= 2
  ) sink.unlock('gta-show-pony');
}
