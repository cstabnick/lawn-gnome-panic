import { describe, expect, it } from 'vitest';
import { createCloudSlot, type PlatformApi } from '@lawn/cloudsave';
import { CLOUD_OPTIONS, summarize } from './cloud';
import { SAVE_KEY, normalizeSave } from './save';
import { defaultCustomGnome } from './teams';

describe('summarize', () => {
  it('describes custom gnome name, record and trophies', () => {
    const g = defaultCustomGnome();
    g.name = 'Swishy';
    g.progression.gamesPlayed = 6;
    g.progression.wins = 4;
    g.progression.tournamentWins = 1;
    const text = JSON.stringify({ version: 1, updatedAt: 1, seasonUpdatedAt: 0, custom: g, season: null });
    expect(summarize(text)).toBe('Swishy · 6 GP (4 W) · 1 🏆');
  });

  it('falls back on unreadable text', () => {
    expect(summarize('not json')).toBe('GBA GJAM Save');
    expect(summarize('null')).toBe('GBA GJAM Save');
  });
});

describe('GBA GJAM cloud backup (merge mode, fake service)', () => {
  it('merges local and remote saves and pushes the merged result', async () => {
    const m = new Map<string, string>();
    const storage = {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, v),
      removeItem: (k: string) => void m.delete(k),
    };

    const localGnome = defaultCustomGnome();
    localGnome.name = 'LocalHero';
    localGnome.progression.wins = 5;
    localGnome.progression.gamesPlayed = 6;
    m.set(SAVE_KEY, JSON.stringify({ version: 1, updatedAt: 100, seasonUpdatedAt: 0, custom: localGnome, season: null }));

    const remoteGnome = defaultCustomGnome();
    remoteGnome.name = 'RemoteHero';
    remoteGnome.progression.wins = 2;
    remoteGnome.progression.gamesPlayed = 9;
    remoteGnome.progression.tournamentWins = 1;
    let remote = {
      data: JSON.stringify({ version: 1, updatedAt: 50, seasonUpdatedAt: 0, custom: remoteGnome, season: null }),
      revision: 3n,
      summary: '',
      updatedAt: undefined,
    };

    class ConnectError extends Error {
      constructor(public code: number) {
        super('err');
      }
    }

    const api = {
      getAccessToken: async () => 'tok',
      saveClient: () => ({
        getSave: async () => ({ save: remote }),
        putSave: async (req: { data: string; baseRevision: bigint; summary: string }) => {
          remote = { data: req.data, revision: req.baseRevision + 1n, summary: req.summary, updatedAt: undefined };
          return { save: remote };
        },
      }),
      ConnectError,
      Code: { NotFound: 5, Aborted: 10 },
      Game: { GNOME_JAM: 11 },
    };

    const slot = createCloudSlot({
      ...CLOUD_OPTIONS,
      deps: { storage, signedIn: () => true, load: async () => api as unknown as PlatformApi, now: () => 0 },
    });

    const res = await slot.syncAtStartup();
    expect(res.kind).toBe('ok');

    const local = normalizeSave(JSON.parse(m.get(SAVE_KEY)!));
    const pushed = normalizeSave(JSON.parse(remote.data));
    expect(local.custom.name).toBe('LocalHero');
    expect(local.custom.progression.wins).toBe(5);
    expect(local.custom.progression.gamesPlayed).toBe(9);
    expect(local.custom.progression.tournamentWins).toBe(1);
    expect(pushed.custom.progression.gamesPlayed).toBe(9);
    expect(pushed.custom.progression.wins).toBe(5);
  });
});
