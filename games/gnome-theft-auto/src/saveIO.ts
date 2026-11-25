// Pure save-bundle export/import/reset for dev testing in Options -> Experimental.
// GTA_SAVE_KEYS is every progress key: the same list is the cloud save (cloudSave.ts). Each holds JSON text.
// Settings stay out on purpose (per device): volumes, mute, radio station and text, text speed, map players, driving mode.
// Also out: gta-perks-v1 (perks.ts: trainer grants/revokes and the "already announced" list; earned perks come from the
// quest save, gta-quests-v1, which is in), gta-trainer-backup-v1 and cloud bookkeeping (cloudSave.ts), sessionStorage
// (party code, quest sim runs) and dev-tool keys (gta-questsim-cheats).
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
  'gta-lockup-v1', // lockup/store.ts: the Lock-Up's stored vehicles
  'gta-estates-v1', // lockup/deeds.ts: Hangar Two and the Mossbank Boathouse bought
  'gta-hunting-v1', // hunting/huntSave.ts: Tuft License, game bag, hunting journal
  'gta-craft-tune-v1', // craft/craftTuneStore.ts: boat and aircraft tuning (Wingwright's Slipway)
  'gta-air-flown-v1', // craft/craftRuntime.ts: new aircraft taken off in (Three Ways Up)
  'gta-birding-v1', // birding/birdSave.ts: life list, heard, photos, milestones, optics
  'gta-trainer-v1', // trainer/mark.ts: set once the Save Trainer changed this save
  'gta-sky-v1', // skyTraffic/progress.ts: sky-banner ads read, banner spotted / torn, aircraft downed
  'gta-fishing-v1', // fishing/fishSave.ts: rods, bait, fishing journal, catch cards
  'gta-jobs-v1', // jobs/career.ts: sim-job levels, XP, counters, tubing bests
  'gta-outskirts-v1', // outskirts/save.ts: Pebblewick (visited, counters, souvenirs, wishing well, the night knock)
  'gta-mowing-v1', // flora/rewards.ts: plants mowed (total, Lawn Service cuts, per kind)
  'gta-odd-rides-v1', // oddRides.ts: odd rides driven (Sunday Driver)
  'gta-inventory-v1', // inventory.ts: the bag (snacks and fun items, counts)
  'gta-ownership-v1', // ownership.ts: properties bought, Kiln-Shield policies, written-off insured vehicles
  'gta-position-v1', // positionSave.ts: where the player last stood (restored on the next start, E07 L70)
  'gta-gnomeybird-v1', // gnomlet/apps/gnomeyBird.ts: Gnomey Bird best score
  'gta-home-v1', // home/layout.ts: Flat 3B furniture layout, stored pieces, wall and floor colours (E10)
  'gta-homes-visited-v1', // homes/visits.ts: character homes the player has stood at (E10 House Call)
  'gta-winter-v1', // winter/save.ts: Snowdrop Slope best times, runs, sled owned, ice catches, bears hugged (E12)
  'gta-golf-v1', // golf/save.ts: Hedgeworth Links board, holes, rounds, bests, aces, lost balls, molehills (E15)
  'gta-sports-v1', // sports/save.ts: Founders' Green sports, pickup games, shootarounds, the skateboard, combo and line bests (E19)
  'gta-rootwell-v1', // campus/achievements.ts: Rootwell University doors visited (E13 First Class Honours)
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
