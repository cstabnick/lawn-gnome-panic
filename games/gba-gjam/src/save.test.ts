import { describe, expect, it } from 'vitest';
import {
  LEGACY_CUSTOM_KEY,
  LEGACY_SEASON_KEY,
  SAVE_KEY,
  exportSaveJson,
  importSaveJson,
  mergeSaveTexts,
  normalizeSave,
  readSave,
  writeSave,
  type SaveStorage,
} from './save';
import { createSeason } from './season';
import { PRO_TEAMS, defaultCustomGnome } from './teams';

function makeStorage(initial: Record<string, string> = {}): SaveStorage & { map: Map<string, string> } {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

describe('GBA GJAM unified save & backup', () => {
  it('migrates legacy custom gnome and season keys into gnome-jam.save.v1', () => {
    const custom = defaultCustomGnome();
    custom.name = 'DunkMaster';
    custom.progression.gamesPlayed = 4;
    custom.progression.wins = 3;
    custom.progression.bonusPoints = 18;
    const season = createSeason(PRO_TEAMS[0].id, true, [0, 1], 'pro');

    const storage = makeStorage({
      [LEGACY_CUSTOM_KEY]: JSON.stringify(custom),
      [LEGACY_SEASON_KEY]: JSON.stringify(season),
    });

    const loaded = readSave(storage);
    expect(loaded.custom.name).toBe('DunkMaster');
    expect(loaded.custom.progression.gamesPlayed).toBe(4);
    expect(loaded.season?.playerTeamId).toBe(PRO_TEAMS[0].id);
    expect(storage.getItem(SAVE_KEY)).not.toBeNull();
  });

  it('exports and restores a JSON backup', () => {
    const storage = makeStorage();
    const base = readSave(storage);
    base.custom.name = 'AirGnome';
    base.custom.progression.wins = 7;
    base.updatedAt = 1000;
    writeSave(base, storage);

    const backup = exportSaveJson(storage);

    const freshStorage = makeStorage();
    const restored = importSaveJson(backup, freshStorage);
    expect(restored.custom.name).toBe('AirGnome');
    expect(restored.custom.progression.wins).toBe(7);
    expect(readSave(freshStorage).custom.name).toBe('AirGnome');
  });

  it('rejects invalid backup JSON', () => {
    const storage = makeStorage();
    expect(() => importSaveJson('not json', storage)).toThrow();
    expect(() => importSaveJson('{"foo":"bar"}', storage)).toThrow();
  });

  it('merges local and remote saves deterministically and idempotently without losing progression', () => {
    const a = normalizeSave({
      version: 1,
      updatedAt: 100,
      seasonUpdatedAt: 100,
      custom: {
        ...defaultCustomGnome(),
        name: 'LocalGnome',
        progression: {
          gamesPlayed: 5,
          wins: 4,
          tournamentWins: 1,
          bonusPoints: 43,
          career: { pts: 80, fgm: 30, fga: 50, tpm: 6, tpa: 15, dunks: 12, steals: 9, blocks: 4, rebounds: 14 },
        },
      },
      season: createSeason(PRO_TEAMS[0].id, true, [0, 1], 'pro'),
    });

    const b = normalizeSave({
      version: 1,
      updatedAt: 200,
      seasonUpdatedAt: 50,
      custom: {
        ...defaultCustomGnome(),
        name: 'RemoteGnome',
        progression: {
          gamesPlayed: 8,
          wins: 3,
          tournamentWins: 2,
          bonusPoints: 60,
          career: { pts: 110, fgm: 25, fga: 60, tpm: 10, tpa: 20, dunks: 8, steals: 11, blocks: 6, rebounds: 10 },
        },
      },
      season: null,
    });

    const mergedText = mergeSaveTexts(JSON.stringify(a), JSON.stringify(b));
    const merged = normalizeSave(JSON.parse(mergedText));

    expect(merged.custom.name).toBe('RemoteGnome'); // newer updatedAt
    expect(merged.custom.progression.gamesPlayed).toBe(8);
    expect(merged.custom.progression.wins).toBe(4);
    expect(merged.custom.progression.tournamentWins).toBe(2);
    expect(merged.custom.progression.bonusPoints).toBe(60);
    expect(merged.custom.progression.career.pts).toBe(110);
    expect(merged.custom.progression.career.dunks).toBe(12);
    expect(merged.season?.playerTeamId).toBe(PRO_TEAMS[0].id); // newer seasonUpdatedAt

    // Idempotent: merging again with remote produces identical JSON
    expect(mergeSaveTexts(mergedText, JSON.stringify(b))).toBe(mergedText);
  });
});
