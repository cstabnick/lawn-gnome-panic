// Audio settings: per device, in localStorage (dayg.audio.v1). Never in the cloud or room save: turning the music down
// must not change the world. Every read and write is guarded, and bad values fall back to the defaults.

export interface AudioSettings {
  master: number; music: number; sfx: number; voices: number; ui: number;   // 0..100
  muted: boolean;
}

export const AUDIO_KEY = 'dayg.audio.v1';
export const AUDIO_DEFAULTS: AudioSettings = { master: 80, music: 70, sfx: 90, voices: 90, ui: 80, muted: false };

export interface KeyValueStore { getItem(key: string): string | null; setItem(key: string, value: string): void }

export function clampSettings(raw: unknown): AudioSettings {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const pct = (v: unknown, fallback: number): number =>
    typeof v === 'number' && Number.isFinite(v) ? Math.min(100, Math.max(0, Math.round(v))) : fallback;
  return {
    master: pct(src.master, AUDIO_DEFAULTS.master),
    music: pct(src.music, AUDIO_DEFAULTS.music),
    sfx: pct(src.sfx, AUDIO_DEFAULTS.sfx),
    voices: pct(src.voices, AUDIO_DEFAULTS.voices),
    ui: pct(src.ui, AUDIO_DEFAULTS.ui),
    muted: typeof src.muted === 'boolean' ? src.muted : AUDIO_DEFAULTS.muted,
  };
}

function localStore(): KeyValueStore | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

export function loadSettings(store: KeyValueStore | null = localStore()): AudioSettings {
  try {
    const text = store?.getItem(AUDIO_KEY);
    return clampSettings(text ? JSON.parse(text) : {});
  } catch {
    return { ...AUDIO_DEFAULTS };
  }
}

export function saveSettings(settings: AudioSettings, store: KeyValueStore | null = localStore()): void {
  try { store?.setItem(AUDIO_KEY, JSON.stringify(clampSettings(settings))); } catch { /* private mode or blocked storage */ }
}
