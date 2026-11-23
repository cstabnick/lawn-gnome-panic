// Ammu-Gnation achievements: which ones a fitting, a shot or a long aimed crack earns (pure; the app passes the tracker in).
import { slotsFor, type GunLoadout, type GunSoundId } from './gunMods';
import type { GunKind } from './types';

export interface AchievementSink { unlock(id: string): unknown; increment(id: string, by?: number): unknown }

export const GUN_ACHIEVEMENT_IDS: readonly string[] = [
  'gta-bolt-on', 'gta-hush-hush', 'gta-party-piece', 'gta-fully-kitted', 'gta-gilded', 'gta-long-look',
  'gta-pocket-armourer',
];

export interface ModFit {
  gun: GunKind;
  bought: readonly string[];
  spent: number;
  loadout: GunLoadout;
  /** true when fitted with the Pocket Kit out in the world */
  field?: boolean;
}

/** A zoom at or past this, from a distance at or past CRACK_FAR, is a long aimed crack. */
const LONG_LOOK_ZOOM = 2;
const CRACK_FAR = 60;

/** A fitting went through at Ammu-Gnation. */
export function modFitAchievements(info: ModFit, sink: AchievementSink): void {
  if (info.spent > 0) {
    sink.unlock('gta-bolt-on');
    sink.increment('gta-gilded', info.spent);
  }

  if (info.loadout.muzzle === 'suppressor') sink.unlock('gta-hush-hush');

  if (slotsFor(info.gun).every((slot) => !!info.loadout[slot])) sink.unlock('gta-fully-kitted');

  // Any Pocket Kit fit, paid or free refit.
  if (info.field) sink.unlock('gta-pocket-armourer');
}

/** The player fired one shot with this sound. */
export function shotAchievements(sound: GunSoundId, sink: AchievementSink): void {
  if (sound === 'kazoo' || sound === 'squeak') sink.unlock('gta-party-piece');
}

/** The player cracked a gnome: `distance` in units from the player, `zoom` the aim zoom at the time (1 = not aiming). */
export function crackAchievements(info: { distance: number; zoom: number }, sink: AchievementSink): void {
  if (info.zoom >= LONG_LOOK_ZOOM && info.distance >= CRACK_FAR) sink.unlock('gta-long-look');
}
