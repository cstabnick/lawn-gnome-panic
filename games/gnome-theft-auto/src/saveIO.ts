// Pure save-bundle export/import/reset for dev testing in Options -> Experimental.
// GTA_SAVE_KEYS is every progress key: the same list is the cloud save (cloudSave.ts). Each holds JSON text.
// Settings stay out on purpose (per device): volumes, mute, radio station and text, text speed, map players, driving mode.
export const GTA_SAVE_KEYS = [
  'gta-quests-v1', // quests.ts
  'gta-economy-v1', // economy.ts: Acorns, Kiln-Debt
  'gta-collectibles-v1', // easterEggs.ts
  'gta-glaze-v1', // glazeStore.ts: Pay 'n' Glaze loadouts
  'gta-gunmods-v1', // gunModStore.ts: Ammu-Gnation mods
  'gta-garage', // simdrive.ts: Side-Valve Salvage tuning
  'gta-stunts-v1', // stunts.ts
  'gta-speedway-laps-v1', // raceTrack/lapTimer.ts: best laps
  'gta-boats-helmed-v1', // wildAchievements.ts: Captain Clay
  'gta-intro-seen-v1', // introTour.ts: '1' once the opening tour was seen
] as const;
export type GtaSaveKey = (typeof GTA_SAVE_KEYS)[number];

export interface GtaSaveBundle {
  format: 'gta-save/v1';
  exportedAt: string;
  data: Partial<Record<GtaSaveKey, unknown>>;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function defaultStorage(): StorageLike | undefined {
  return typeof localStorage !== 'undefined' ? localStorage : undefined;
}

export function exportSaveBundle(storage: StorageLike | undefined = defaultStorage()): GtaSaveBundle {
  const data: Partial<Record<GtaSaveKey, unknown>> = {};
  if (storage) {
    for (const key of GTA_SAVE_KEYS) {
      try {
        const raw = storage.getItem(key);
        if (raw === null) continue;
        data[key] = JSON.parse(raw);
      } catch {
        // Skip corrupt entries rather than failing the whole export.
      }
    }
  }
  return {
    format: 'gta-save/v1',
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function importSaveBundle(
  raw: string,
  storage: StorageLike | undefined = defaultStorage(),
): { ok: true; keys: GtaSaveKey[] } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'Invalid JSON.' };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'Save must be a JSON object.' };
  }
  const obj = parsed as Record<string, unknown>;
  if (obj.format !== 'gta-save/v1') {
    return { ok: false, error: 'Unsupported save format (expected gta-save/v1).' };
  }
  if (!obj.data || typeof obj.data !== 'object' || Array.isArray(obj.data)) {
    return { ok: false, error: 'Missing or invalid save data object.' };
  }
  const data = obj.data as Record<string, unknown>;
  const imported: GtaSaveKey[] = [];
  if (storage) {
    for (const key of GTA_SAVE_KEYS) {
      if (Object.prototype.hasOwnProperty.call(data, key) && data[key] !== undefined) {
        storage.setItem(key, JSON.stringify(data[key]));
        imported.push(key);
      } else {
        storage.removeItem(key);
      }
    }
  }
  return { ok: true, keys: imported };
}

export function resetSaveBundle(storage: StorageLike | undefined = defaultStorage()): void {
  if (!storage) return;
  for (const key of GTA_SAVE_KEYS) {
    storage.removeItem(key);
  }
}
