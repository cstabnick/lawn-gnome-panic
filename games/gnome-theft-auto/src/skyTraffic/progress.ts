// Sky-traffic achievements and the saved list of ads read (docs/roadmaps/gta-npc-planes.md). The saved list holds the
// ad ids the player has read plus three flags ('#spotted', '#torn', '#downed'). Storage is localStorage when it works,
// memory otherwise; every write tells the cloud save through notifySaveChanged().
import { notifySaveChanged } from '../saveHook';
import type { AdDef } from './types';

export const SKY_SAVE_KEY = 'gta-sky-v1';
export const SKY_ACH = {
  spotted: 'gta-sky-look-up',
  reader: 'gta-sky-captive-audience',
  torn: 'gta-sky-ad-blocker',
  downed: 'gta-sky-clear-skies',
  egg: 'gta-sky-small-print',
} as const;

export interface SkyStorage { getItem(k: string): string | null; setItem(k: string, v: string): void }
export interface SkyAchievements { unlock(id: string): unknown; increment(id: string): unknown }

export interface SkyProgress {
  markSpotted(): boolean;
  markRead(ad: AdDef): boolean;
  markTorn(): void;
  markDowned(): void;
  readCount(): number;
}

const FLAG_SPOTTED = '#spotted';
const FLAG_TORN = '#torn';
const FLAG_DOWNED = '#downed';

function defaultStorage(): SkyStorage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

function loadSeen(s: SkyStorage | null): Set<string> {
  if (!s) return new Set();
  try {
    const raw: unknown = JSON.parse(s.getItem(SKY_SAVE_KEY) ?? '[]');
    return new Set(Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

export function createSkyProgress(ach: SkyAchievements, storage: SkyStorage | null = defaultStorage()): SkyProgress {
  const seen = loadSeen(storage);

  function save(): void {
    if (storage) {
      try { storage.setItem(SKY_SAVE_KEY, JSON.stringify([...seen])); } catch {
        // keep going in memory
      }
    }
    notifySaveChanged();
  }

  function addFlag(flag: string): void {
    if (seen.has(flag)) return;
    seen.add(flag);
    save();
  }

  return {
    markSpotted(): boolean {
      if (seen.has(FLAG_SPOTTED)) return false;
      addFlag(FLAG_SPOTTED);
      ach.unlock(SKY_ACH.spotted);
      return true;
    },
    markRead(ad: AdDef): boolean {
      if (seen.has(ad.id)) return false;
      seen.add(ad.id);
      save();
      if (ad.egg) ach.unlock(SKY_ACH.egg);
      else ach.increment(SKY_ACH.reader);
      return true;
    },
    markTorn(): void {
      ach.unlock(SKY_ACH.torn);
      addFlag(FLAG_TORN);
    },
    markDowned(): void {
      ach.unlock(SKY_ACH.downed);
      addFlag(FLAG_DOWNED);
    },
    readCount(): number {
      let n = 0;
      for (const id of seen) if (!id.startsWith('#') && !id.startsWith('egg-')) n++;
      return n;
    },
  };
}
