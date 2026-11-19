// Background music: the soft "garden lullaby" from @lawn/music. Follows the game's one mute button.
import { buildGardenLullaby, playSong, setMuteKey, setMuted } from '@lawn/music';

let started = false;

/** Starts the loop once. Call from a user gesture (the title tap) so the browser lets it play. */
export function startMusic(muted: boolean): void {
  if (started) return;
  started = true;
  try {
    setMuteKey('gnome-sweet-gnome.music-muted');
    setMuted(muted);
    const seed = Math.floor(Math.random() * 0x7fffffff);
    playSong((T, keep, out) => buildGardenLullaby(T, keep, out, seed));
  } catch {
    // Music must never break the game.
  }
}

export function setMusicMuted(m: boolean): void {
  try {
    setMuted(m);
  } catch {
    // ignore
  }
}
