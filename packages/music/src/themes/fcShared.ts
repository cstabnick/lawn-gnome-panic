// Shared option and hook types for The Final Collectathon's three themes.
export interface FcMusicOptions {
  /** 0..1: how hard the game is collecting right now. Read it as often as you like. */
  intensity?: () => number;
}
export interface FcMusicHooks {
  /** A pickup: play one note of a climbing pickup scale in the track's key (resets after 1.2 s without a pickup). */
  pickup(): void;
}
