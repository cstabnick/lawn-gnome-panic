// Ammu-Gnation achievements: which ones a fitting, a shot or a long aimed crack earns (pure; the app passes the tracker in).
// STUB: the achievements issue fills it in; the ids and signatures are final.
import type { GunLoadout, GunSoundId } from './gunMods';
import type { GunKind } from './types';

export interface AchievementSink { unlock(id: string): unknown; increment(id: string, by?: number): unknown }

export const GUN_ACHIEVEMENT_IDS: readonly string[] = [
  'gta-bolt-on', 'gta-hush-hush', 'gta-party-piece', 'gta-fully-kitted', 'gta-gilded', 'gta-long-look',
];

export interface ModFit { gun: GunKind; bought: readonly string[]; spent: number; loadout: GunLoadout }

/** A fitting went through at Ammu-Gnation. */
export function modFitAchievements(info: ModFit, sink: AchievementSink): void {
  void info; void sink;
}

/** The player fired one shot with this sound. */
export function shotAchievements(sound: GunSoundId, sink: AchievementSink): void {
  void sound; void sink;
}

/** The player cracked a gnome: `distance` in units from the player, `zoom` the aim zoom at the time (1 = not aiming). */
export function crackAchievements(info: { distance: number; zoom: number }, sink: AchievementSink): void {
  void info; void sink;
}
