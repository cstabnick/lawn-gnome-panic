// Unified local save & backup store for GBA GJAM (custom gnome + progression + active season).
// Migrates legacy separate keys (gnome-jam.custom.v1, gnome-jam.season.v1) on first read.
import {
  CUSTOM_STAT_BUDGET,
  STAT_MAX,
  STAT_MIN,
  defaultCustomGnome,
  normalizeCustomGnome,
} from './teams';
import type { CareerStats, CustomGnomeData, SeasonState } from './types';

export const SAVE_KEY = 'gnome-jam.save.v1';
export const LEGACY_CUSTOM_KEY = 'gnome-jam.custom.v1';
export const LEGACY_SEASON_KEY = 'gnome-jam.season.v1';

export type SaveStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface JamSave {
  version: 1;
  updatedAt: number;
  seasonUpdatedAt: number;
  custom: CustomGnomeData;
  season: SeasonState | null;
}

const listeners = new Set<() => void>();

/** Registers a callback fired whenever the unified save is written locally. Returns an unsubscribe fn. */
export function onSaveWritten(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function defaultStorage(): SaveStorage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

function isValidSeason(raw: unknown): raw is SeasonState {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
  const s = raw as Partial<SeasonState>;
  return (
    typeof s.playerTeamId === 'string' &&
    Array.isArray(s.schedule) &&
    typeof s.standings === 'object' &&
    s.standings !== null &&
    (s.phase === 'regular' || s.phase === 'playoffs' || s.phase === 'complete')
  );
}

function numNonNeg(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v) : 0;
}

/** Normalizes any parsed save JSON into a valid JamSave. */
export function normalizeSave(raw: unknown): JamSave {
  const obj = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const custom = normalizeCustomGnome(obj.custom ?? (typeof obj.stats === 'object' ? obj : null));
  const season = isValidSeason(obj.season) ? obj.season : null;
  return {
    version: 1,
    updatedAt: numNonNeg(obj.updatedAt),
    seasonUpdatedAt: numNonNeg(obj.seasonUpdatedAt),
    custom,
    season,
  };
}

/** Reads the unified save, migrating legacy keys once if needed. */
export function readSave(storage: SaveStorage | null = defaultStorage()): JamSave {
  if (!storage) {
    return { version: 1, updatedAt: 0, seasonUpdatedAt: 0, custom: defaultCustomGnome(), season: null };
  }
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (raw) {
      return normalizeSave(JSON.parse(raw));
    }
    const legacyCustomRaw = storage.getItem(LEGACY_CUSTOM_KEY);
    const legacySeasonRaw = storage.getItem(LEGACY_SEASON_KEY);
    if (legacyCustomRaw || legacySeasonRaw) {
      const custom = legacyCustomRaw ? normalizeCustomGnome(JSON.parse(legacyCustomRaw)) : defaultCustomGnome();
      const parsedSeason: unknown = legacySeasonRaw ? JSON.parse(legacySeasonRaw) : null;
      const season = isValidSeason(parsedSeason) ? parsedSeason : null;
      const migrated: JamSave = {
        version: 1,
        updatedAt: Date.now(),
        seasonUpdatedAt: season ? Date.now() : 0,
        custom,
        season,
      };
      storage.setItem(SAVE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {
    // ignore corrupted storage
  }
  return { version: 1, updatedAt: 0, seasonUpdatedAt: 0, custom: defaultCustomGnome(), season: null };
}

/** Writes the unified save to storage and notifies listeners (e.g. cloud sync). */
export function writeSave(save: JamSave, storage: SaveStorage | null = defaultStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    return;
  }
  for (const fn of listeners) fn();
}

function clampStat(v: number): number {
  return Math.max(STAT_MIN, Math.min(STAT_MAX, Math.round(v)));
}

function mergeCareer(a: CareerStats, b: CareerStats): CareerStats {
  return {
    pts: Math.max(a.pts, b.pts),
    fgm: Math.max(a.fgm, b.fgm),
    fga: Math.max(a.fga, b.fga),
    tpm: Math.max(a.tpm, b.tpm),
    tpa: Math.max(a.tpa, b.tpa),
    dunks: Math.max(a.dunks, b.dunks),
    steals: Math.max(a.steals, b.steals),
    blocks: Math.max(a.blocks, b.blocks),
    rebounds: Math.max(a.rebounds, b.rebounds),
  };
}

/**
 * Deterministic, idempotent merge for @lawn/cloudsave ('merge' mode).
 * Career stats & progression take the max of each counter; identity/stats/season follow the newer timestamp.
 */
export function mergeSaveTexts(localText: string | null, remoteText: string): string {
  const remote = normalizeSave(JSON.parse(remoteText));
  if (localText === null) return JSON.stringify(remote);

  let local: JamSave;
  try {
    local = normalizeSave(JSON.parse(localText));
  } catch {
    return JSON.stringify(remote);
  }

  const pickRemoteCustom = remote.updatedAt > local.updatedAt;
  const baseCustom = pickRemoteCustom ? remote.custom : local.custom;

  const bonusPoints = Math.max(local.custom.progression.bonusPoints, remote.custom.progression.bonusPoints);
  const progression = {
    gamesPlayed: Math.max(local.custom.progression.gamesPlayed, remote.custom.progression.gamesPlayed),
    wins: Math.max(local.custom.progression.wins, remote.custom.progression.wins),
    tournamentWins: Math.max(local.custom.progression.tournamentWins, remote.custom.progression.tournamentWins),
    bonusPoints,
    career: mergeCareer(local.custom.progression.career, remote.custom.progression.career),
  };

  const stats = { ...baseCustom.stats };
  const maxBudget = CUSTOM_STAT_BUDGET + bonusPoints;
  const used = stats.speed + stats.threePt + stats.dunk + stats.defense;
  if (used > maxBudget && used > 0) {
    const ratio = maxBudget / used;
    stats.speed = clampStat(stats.speed * ratio);
    stats.threePt = clampStat(stats.threePt * ratio);
    stats.dunk = clampStat(stats.dunk * ratio);
    stats.defense = clampStat(stats.defense * ratio);
  }

  const season = remote.seasonUpdatedAt > local.seasonUpdatedAt ? remote.season : local.season;

  const merged: JamSave = {
    version: 1,
    updatedAt: Math.max(local.updatedAt, remote.updatedAt),
    seasonUpdatedAt: Math.max(local.seasonUpdatedAt, remote.seasonUpdatedAt),
    custom: {
      ...baseCustom,
      stats,
      progression,
    },
    season,
  };
  return JSON.stringify(merged);
}

/** Returns a formatted JSON backup string of the current save. */
export function exportSaveJson(storage: SaveStorage | null = defaultStorage()): string {
  return JSON.stringify(readSave(storage), null, 2);
}

/** Validates and restores a JSON backup string, writing it to storage and triggering cloud sync. */
export function importSaveJson(rawText: string, storage: SaveStorage | null = defaultStorage()): JamSave {
  const parsed: unknown = JSON.parse(rawText);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Invalid backup file: expected a JSON object.');
  }
  const obj = parsed as Record<string, unknown>;
  const hasCustom = obj.custom && typeof obj.custom === 'object';
  const hasStats = obj.stats && typeof obj.stats === 'object';
  const hasSeason = 'season' in obj;
  if (!hasCustom && !hasStats && !hasSeason) {
    throw new Error('Unrecognized GBA GJAM backup format.');
  }
  const normalized = normalizeSave(parsed);
  const now = Date.now();
  const restored: JamSave = {
    ...normalized,
    updatedAt: Math.max(now, normalized.updatedAt),
    seasonUpdatedAt: normalized.season ? Math.max(now, normalized.seasonUpdatedAt) : normalized.seasonUpdatedAt,
  };
  writeSave(restored, storage);
  return restored;
}
