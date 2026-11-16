// Persistent user settings (minimap, audio, graphics, camera), stored in localStorage.
export interface Settings {
  showMinimap: boolean;
  minimapRotate: boolean;
  minimapZoom: number;
  muted: boolean;
  volume: number;
  shadows: boolean;
  highDpi: boolean;
  cameraSpeed: number;
  invertY: boolean;
  showPlates: boolean;
}

const SETTINGS_KEY = 'gnomomia.settings.v1';
const LEGACY_MUTE_KEY = 'gnomomia.muted';

export const DEFAULT_SETTINGS: Readonly<Settings> = {
  showMinimap: true,
  minimapRotate: false,
  minimapZoom: 1,
  muted: false,
  volume: 0.5,
  shadows: true,
  highDpi: true,
  cameraSpeed: 1,
  invertY: false,
  showPlates: true,
};

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

function readInitial(): Settings {
  const out: Settings = { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Settings>;
      if (typeof parsed.showMinimap === 'boolean') out.showMinimap = parsed.showMinimap;
      if (typeof parsed.minimapRotate === 'boolean') out.minimapRotate = parsed.minimapRotate;
      if (typeof parsed.minimapZoom === 'number' && Number.isFinite(parsed.minimapZoom)) {
        out.minimapZoom = clamp(parsed.minimapZoom, 0.6, 2.0);
      }
      if (typeof parsed.muted === 'boolean') out.muted = parsed.muted;
      if (typeof parsed.volume === 'number' && Number.isFinite(parsed.volume)) {
        out.volume = clamp(parsed.volume, 0, 1);
      }
      if (typeof parsed.shadows === 'boolean') out.shadows = parsed.shadows;
      if (typeof parsed.highDpi === 'boolean') out.highDpi = parsed.highDpi;
      if (typeof parsed.cameraSpeed === 'number' && Number.isFinite(parsed.cameraSpeed)) {
        out.cameraSpeed = clamp(parsed.cameraSpeed, 0.5, 2.0);
      }
      if (typeof parsed.invertY === 'boolean') out.invertY = parsed.invertY;
      if (typeof parsed.showPlates === 'boolean') out.showPlates = parsed.showPlates;
    } else if (localStorage.getItem(LEGACY_MUTE_KEY) === '1') {
      out.muted = true;
    }
  } catch {
    // Storage blocked or corrupt: fall back to defaults.
  }
  return out;
}

function writeSettings(s: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    localStorage.setItem(LEGACY_MUTE_KEY, s.muted ? '1' : '0');
  } catch {
    // Storage blocked: settings still apply for this session.
  }
}

export const settings: Settings = readInitial();

type Listener = (s: Settings) => void;
const listeners = new Set<Listener>();

export function onSettingsChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function updateSettings(patch: Partial<Settings>): void {
  Object.assign(settings, patch);
  settings.minimapZoom = clamp(settings.minimapZoom, 0.6, 2.0);
  settings.volume = clamp(settings.volume, 0, 1);
  settings.cameraSpeed = clamp(settings.cameraSpeed, 0.5, 2.0);
  writeSettings(settings);
  for (const fn of listeners) fn(settings);
}

export function resetSettings(): void {
  updateSettings({ ...DEFAULT_SETTINGS });
}
