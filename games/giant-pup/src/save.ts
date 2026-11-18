import { SAVE_KEY } from './config';
import { catchUp, newPet, sanitize, type PetState } from './sim';

/** Load the pet (with time-away decay applied), or a fresh one. Second value: true if this is a brand-new pet. */
export function loadPet(now = Date.now()): [PetState, boolean] {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const s = sanitize(JSON.parse(raw), now);
      if (s) {
        catchUp(s, now);
        return [s, false];
      }
    }
  } catch {
    // storage blocked or corrupt: start fresh
  }
  return [newPet(now), true];
}

export function savePet(s: PetState, now = Date.now()): void {
  s.lastSeen = now;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    // storage blocked: the pet lives for this visit only
  }
}
