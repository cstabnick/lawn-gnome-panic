import type { Swatch } from '@lawn/prefabs';

/** Player options, kept in localStorage. Changed from the Dressing Room (src/screens/options.ts). */
export interface Settings {
  /** The gnome you stand on: coat, hat. */
  carrierCoat: Swatch;
  carrierHat: Swatch;
  /** Colour of the camera body. */
  cameraColor: Swatch;
  /** Mouse look speed multiplier (the ride's captured mouse), 0.4..2.5. */
  mouseSens: number;
  invertY: boolean;
  /** Head bob while the camera walks through the house. */
  bob: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  carrierCoat: 'terracotta',
  carrierHat: 'leaf',
  cameraColor: 'red',
  mouseSens: 1,
  invertY: false,
  bob: true,
};

const KEY = 'gnomeokemon.settings.v1';
let current: Settings | null = null;
const listeners = new Set<(s: Settings) => void>();

export function loadSettings(): Settings {
  if (current) return current;
  let stored: Partial<Settings> = {};
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) stored = JSON.parse(raw) as Partial<Settings>;
  } catch {
    // Corrupt or blocked storage: use the defaults.
  }
  const s = { ...DEFAULT_SETTINGS, ...stored };
  s.mouseSens = Math.min(2.5, Math.max(0.4, Number(s.mouseSens) || 1));
  current = s;
  return s;
}

/** Merge a change, save it and tell listeners. */
export function updateSettings(patch: Partial<Settings>): Settings {
  current = { ...loadSettings(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Private mode: the change lasts until the page closes.
  }
  for (const fn of listeners) fn(current);
  return current;
}

export function onSettingsChanged(fn: (s: Settings) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
