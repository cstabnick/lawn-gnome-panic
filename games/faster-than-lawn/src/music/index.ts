/**
 * Game music: chiptune sector themes, each with an explore and a battle arrangement that play in
 * sync and crossfade (as in FTL). One theme per run, kept playing across scenes; fights fade the
 * battle arrangement in.
 *
 * The themes, arranger and engine live in @lawn/music (packages/music); this file decides what plays when.
 * M toggles mute (main.ts).
 *
 * URL flags for listening: ?theme=N (force theme 0-4 in runs), ?battle=1 / ?battle=0 (force an arrangement).
 */
import { SECTOR_THEMES, buildSectorTrack, isMuted, playSong, setMuteKey, setMuted, stopSong, themeForSeed } from '@lawn/music';

setMuteKey('ftl-music-muted');

const params = new URLSearchParams(location.search);
const FORCED_THEME = params.has('theme') ? Number(params.get('theme')) : undefined;
const FORCED_BATTLE = params.has('battle') ? params.get('battle') !== '0' : null;

/** The title plays the home-fleet theme, explore only. */
const TITLE_THEME = SECTOR_THEMES.findIndex((t) => t.name === 'Gnome Fleet');

let current: string | null = null;
let battle = false;

function play(key: string, seed: number, theme: number | undefined): void {
  if (current === key) return; // already playing: scene changes must not restart the song
  current = key;
  battle = false;
  playSong((T, keep, out) => { buildSectorTrack(T, keep, out, seed, { theme, battle: () => FORCED_BATTLE ?? battle }); });
}

/** Title screen music. */
export function playTitleMusic(): void {
  play('title', 7, FORCED_THEME ?? TITLE_THEME);
}

/** The run's theme, picked from its seed. Safe to call from every scene: it only starts once per run. */
export function playRunMusic(seed: number): void {
  play(`run:${seed}`, seed, FORCED_THEME);
}

/** Name of the theme a run seed plays. */
export function runThemeName(seed: number): string {
  return themeForSeed(seed, FORCED_THEME).name;
}

/** true while a fight is on: the battle arrangement crossfades in; false fades back to explore. */
export function setBattleMusic(on: boolean): void {
  battle = on;
}

export function stopMusic(): void {
  current = null;
  battle = false;
  stopSong();
}

export const isMusicMuted = isMuted;
export const setMusicMuted = setMuted;
