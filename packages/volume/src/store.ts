import { watchKey } from '@lawn/sync';

export type VolumeChannel = 'master' | 'sounds' | 'music';

export interface VolumeState {
  master: number;
  sounds: number;
  music: number;
  muted: Record<VolumeChannel, boolean>;
}

export interface VolumeStoreOptions {
  /** localStorage key for persisting settings. Omit or pass '' to disable persistence. */
  storageKey?: string;
  /** Initial channel levels (0..1) when no saved state exists. */
  defaults?: Partial<Pick<VolumeState, VolumeChannel>>;
}

export interface VolumeStore {
  getState(): VolumeState;
  get(channel: VolumeChannel): number;
  set(channel: VolumeChannel, value: number): void;
  isMuted(channel: VolumeChannel): boolean;
  setMuted(channel: VolumeChannel, muted: boolean): void;
  toggleMute(channel: VolumeChannel): boolean;
  /** Effective linear gain (0..1) for 'sounds' or 'music', factoring in master and mute states. */
  effective(channel: 'sounds' | 'music'): number;
  subscribe(listener: (state: VolumeState) => void): () => void;
  reset(): void;
}

const DEFAULT_STORAGE_KEY = 'arcade-volume';

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(1, Math.max(0, n));
}

function cloneState(s: VolumeState): VolumeState {
  return {
    master: s.master,
    sounds: s.sounds,
    music: s.music,
    muted: { ...s.muted },
  };
}

/** Converts a linear gain (0..1) to decibels relative to `maxDb`. Returns `-Infinity` when silent. */
export function gainToDb(gain: number, maxDb = 0): number {
  if (gain <= 0.0001) return -Infinity;
  return maxDb + 20 * Math.log10(gain);
}

function loadSaved(key: string, fallback: VolumeState): VolumeState {
  if (!key) return cloneState(fallback);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return cloneState(fallback);
    const parsed = JSON.parse(raw) as Partial<VolumeState>;
    return {
      master: typeof parsed.master === 'number' ? clamp01(parsed.master) : fallback.master,
      sounds: typeof parsed.sounds === 'number' ? clamp01(parsed.sounds) : fallback.sounds,
      music: typeof parsed.music === 'number' ? clamp01(parsed.music) : fallback.music,
      muted: {
        master: Boolean(parsed.muted?.master),
        sounds: Boolean(parsed.muted?.sounds),
        music: Boolean(parsed.muted?.music),
      },
    };
  } catch {
    return cloneState(fallback);
  }
}

function saveState(key: string, state: VolumeState): void {
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Ignore storage quota or private-mode errors.
  }
}

/** Creates a reactive, localStorage-backed volume store with master, sounds, and music channels. */
export function createVolumeStore(options: VolumeStoreOptions = {}): VolumeStore {
  const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
  const initial: VolumeState = {
    master: clamp01(options.defaults?.master ?? 1),
    sounds: clamp01(options.defaults?.sounds ?? 1),
    music: clamp01(options.defaults?.music ?? 1),
    muted: { master: false, sounds: false, music: false },
  };

  let state = loadSaved(storageKey, initial);
  const listeners = new Set<(state: VolumeState) => void>();

  /** Take what another tab saved before changing one field, so this tab's edit does not overwrite the other fields
   *  with stale values. The same field set in two tabs cannot merge: the latest set wins. */
  function refresh(): void {
    if (storageKey) state = loadSaved(storageKey, state);
  }

  function emit(): void {
    const snapshot = cloneState(state);
    for (const fn of listeners) fn(snapshot);
  }

  // No toast here: sliders follow live in every tab through subscribe(), which shows the change better.
  if (storageKey) {
    watchKey(storageKey, () => {
      state = loadSaved(storageKey, initial);
      emit();
    });
  }

  function notify(): void {
    saveState(storageKey, state);
    emit();
  }

  return {
    getState(): VolumeState {
      return cloneState(state);
    },
    get(channel: VolumeChannel): number {
      return state[channel];
    },
    set(channel: VolumeChannel, value: number): void {
      refresh();
      const next = clamp01(value);
      const unmute = next > 0 && state.muted[channel];
      if (state[channel] === next && !unmute) return;
      state[channel] = next;
      if (unmute) state.muted[channel] = false;
      notify();
    },
    isMuted(channel: VolumeChannel): boolean {
      return state.muted[channel] || state[channel] <= 0;
    },
    setMuted(channel: VolumeChannel, muted: boolean): void {
      refresh();
      if (state.muted[channel] === muted) return;
      state.muted[channel] = muted;
      notify();
    },
    toggleMute(channel: VolumeChannel): boolean {
      refresh();
      const next = !state.muted[channel];
      state.muted[channel] = next;
      notify();
      return next;
    },
    effective(channel: 'sounds' | 'music'): number {
      if (state.muted.master || state.muted[channel]) return 0;
      return state.master * state[channel];
    },
    subscribe(listener: (state: VolumeState) => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    reset(): void {
      state = cloneState(initial);
      notify();
    },
  };
}
