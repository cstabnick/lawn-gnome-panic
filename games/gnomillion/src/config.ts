// Tuning and storage keys. Change numbers here, not in the logic.
export const GAME_ID = 'gnomillion' as const;
/** How long a round stays open, in ms. The host picks one in the lobby. */
export const WINDOW_CHOICES_MS = [10 * 60_000, 60 * 60_000, 8 * 3_600_000, 24 * 3_600_000] as const;
export const DEFAULT_WINDOW_MS = WINDOW_CHOICES_MS[2];
export const MAX_ANSWER_LEN = 40;
export const MAX_PLAYERS = 12;
export const MIN_PLAYERS_TO_SCORE = 2;
/** Rounds in one room's game. */
export const ROUNDS_PER_GAME = 10;
export const KEY_ROOM = (code: string) => `gnomillion.room.${code}`;
export const KEY_ME = 'gnomillion.me';            // { pid, name }
export const KEY_PENDING = 'gnomillion.pending';  // PendingAnswer[]
export const KEY_LAST_ROOM = 'gnomillion.lastRoom';
