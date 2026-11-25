// E24 comedy: the sets, heckles and hecklers (STUB: written by its E24 issue). Pure data.
import type { ComedySet, Heckler } from './types';

export const SETS: readonly ComedySet[] = [];
export const HECKLES: readonly string[] = ['Boo.'];
export const HECKLERS: readonly Heckler[] = [{ name: 'Someone at the back', seat: 9 }];
/** What the gnome says on a Double Down (explaining the joke, louder). */
export const DOUBLE_DOWN_LINES: readonly string[] = ['No, listen. LISTEN.'];
/** Mireille Sans-Rire's verdict after the set, by stars (index 0 = 1 star). */
export const VERDICTS: readonly string[] = ['No.', 'No.', 'No.', 'Hm.', 'I did not hate it. I will see a doctor.'];

/** The set to play at `level`, the `played`-th time (cycles through the sets open at that level, newest first). */
export function setFor(level: number, played: number): ComedySet | null {
  const open = SETS.filter((s) => s.level <= level);
  return open.length ? open[(open.length - 1 - (played % open.length) + open.length) % open.length] : null;
}
