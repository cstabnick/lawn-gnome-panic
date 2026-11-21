import { SAVE_KEY } from './config';
import { sanitize } from './sim';
import type { Household } from './types';

export function loadHousehold(): Household | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? sanitize(JSON.parse(raw)) : null;
  } catch {
    return null; // storage blocked or corrupt: start fresh
  }
}

export function saveHousehold(h: Household): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(h));
  } catch {
    // storage blocked: the household lives for this visit only
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // nothing to clear
  }
}
