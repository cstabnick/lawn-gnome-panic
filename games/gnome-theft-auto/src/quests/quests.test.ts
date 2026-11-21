import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import type { PlatformApi } from '@lawn/cloudsave';

vi.mock('../audio', () => ({
  play: vi.fn(),
  setEngine: vi.fn(),
  setSkid: vi.fn(),
  unlockAudio: vi.fn(),
}));
import {
  createQuestCloudSlot,
  createQuests,
  isQuestAvailable,
  mergeQuestSaves,
  SAVE_KEY,
  summarizeQuestSaves,
} from './quests';
import type { GiverDef, QuestDef, QuestDeps, QuestSave } from './types';

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v); },
    removeItem: (k: string) => { map.delete(k); },
    map,
  };
}

describe('quest prerequisite chains', () => {
  const qA: QuestDef = { id: 'q1', title: 'Q1', giver: 'g', objectives: [], doneText: 'd1' };
  const qB: QuestDef = { id: 'q2', title: 'Q2', giver: 'g', prereq: 'q1', objectives: [], doneText: 'd2' };
  const qC: QuestDef = { id: 'q3', title: 'Q3', giver: 'g', prereq: 'q2', objectives: [], doneText: 'd3' };

  it('unlocks quests in order as prerequisites finish', () => {
    const saves: Record<string, QuestSave> = {};
    expect(isQuestAvailable(qA, saves)).toBe(true);
    expect(isQuestAvailable(qB, saves)).toBe(false);
    expect(isQuestAvailable(qC, saves)).toBe(false);

    saves.q1 = { state: 'active', step: 0, cracked: [] };
    expect(isQuestAvailable(qA, saves)).toBe(false);
    expect(isQuestAvailable(qB, saves)).toBe(false);

    saves.q1 = { state: 'done', step: 1, cracked: [] };
    expect(isQuestAvailable(qB, saves)).toBe(true);
    expect(isQuestAvailable(qC, saves)).toBe(false);

    saves.q2 = { state: 'done', step: 1, cracked: [] };
    expect(isQuestAvailable(qC, saves)).toBe(true);
  });
});

describe('quest save merge & cloudsave', () => {
  it('merges done over active, takes max step, and unions cracked targets idempotently', () => {
    const local = JSON.stringify({
      q1: { state: 'active', step: 1, cracked: ['a'] },
      q2: { state: 'active', step: 0, cracked: ['x'] },
    });
    const remote = JSON.stringify({
      q1: { state: 'done', step: 2, cracked: ['b'] },
      q3: { state: 'done', step: 1, cracked: [] },
    });
    const merged = JSON.parse(mergeQuestSaves(local, remote)) as Record<string, QuestSave>;
    expect(merged.q1.state).toBe('done');
    expect(merged.q1.step).toBe(2);
    expect(merged.q1.cracked.sort()).toEqual(['a', 'b']);
    expect(merged.q2.state).toBe('active');
    expect(merged.q3.state).toBe('done');
    expect(mergeQuestSaves(JSON.stringify(merged), remote)).toBe(JSON.stringify(merged));
    expect(summarizeQuestSaves(JSON.stringify(merged))).toBe('2 quests done');
  });

  it('syncs and merges with a fake cloudsave platform client', async () => {
    const storage = memoryStorage();
    storage.setItem(SAVE_KEY, JSON.stringify({ q1: { state: 'done', step: 1, cracked: ['a'] } }));
    let remote = {
      data: JSON.stringify({ q2: { state: 'done', step: 1, cracked: ['b'] } }),
      revision: 1n,
      summary: '',
      updatedAt: undefined,
    };

    const fakePlatform: PlatformApi = {
      getAccessToken: async () => 'tok',
      ConnectError: class extends Error { code = 0; } as unknown as PlatformApi['ConnectError'],
      Code: { NotFound: 5, Aborted: 10 } as PlatformApi['Code'],
      Game: { ARCADE: 8 } as PlatformApi['Game'],
      saveClient: () => ({
        getSave: async () => ({ save: remote }),
        putSave: async (req: { data: string; baseRevision: bigint }) => {
          remote = { data: req.data, revision: req.baseRevision + 1n, summary: '', updatedAt: undefined };
          return { save: remote };
        },
      }) as unknown as ReturnType<PlatformApi['saveClient']>,
    };

    const slot = createQuestCloudSlot({
      storage,
      signedIn: () => true,
      load: async () => fakePlatform,
      now: () => 100_000,
    });

    const res = await slot.syncAtStartup();
    expect(res).toEqual({ kind: 'ok', pulled: true });
    const synced = JSON.parse(storage.getItem(SAVE_KEY)!) as Record<string, QuestSave>;
    expect(synced.q1.state).toBe('done');
    expect(synced.q2.state).toBe('done');
  });
});

describe('quest step transitions', () => {
  it('transitions from visit to choice and awards acorns + radio bulletin on completion', () => {
    const givers: Record<string, GiverDef> = {
      g1: { id: 'g1', name: 'Test Giver', label: 'Talk', x: 0, z: 0, exit: { x: 2, z: 0, yaw: 0 }, room: 'street', letter: 'T' },
    };
    const quests: QuestDef[] = [
      {
        id: 'test-q',
        title: 'Test Quest',
        giver: 'g1',
        chapter: 1,
        rewardAcorns: 300,
        radioBulletin: 'test-bulletin',
        doneText: 'All done!',
        objectives: [
          { kind: 'visit', text: 'Go to marker', at: [10, 0], radius: 3, hint: 'East' },
          {
            kind: 'choice',
            text: 'Pick an ending',
            optionA: { label: 'Path A', at: [20, 0], endingText: 'Chose A' },
            optionB: { label: 'Path B', at: [-20, 0], endingText: 'Chose B' },
          },
        ],
      },
    ];

    const earned: number[] = [];
    const paid: number[] = [];
    const bulletins: string[] = [];
    const deps: QuestDeps = {
      scene: new THREE.Scene(),
      world: { walkPoints: [{ x: 0, z: 0 }] } as QuestDeps['world'],
      npcs: { list: [], spawnNamed: vi.fn(), scare: vi.fn() } as unknown as QuestDeps['npcs'],
      hud: {
        setWorld: vi.fn(),
        set: vi.fn(),
        toast: vi.fn(),
        banner: vi.fn(),
        setObjective: vi.fn(),
        setVisible: vi.fn(),
      },
      cutscene: {
        active: false,
        play: (_req, onDone) => onDone(),
        update: vi.fn(),
        skip: vi.fn(),
      },
      placePlayer: vi.fn(),
      unlock: vi.fn(),
      play: vi.fn(),
      economy: {
        state: () => ({ acorns: 50, debtRemaining: 5000, debtPaidOff: false }),
        earn: (amt) => earned.push(amt),
        spend: () => true,
        payDebt: (amt) => { paid.push(amt); return amt; },
        chargeHospital: () => ({ fee: 0, receipt: '' }),
        inFraudZone: () => false,
        onPlayerRagdollImpact: () => 0,
      },
      onRadioBulletin: (id) => bulletins.push(id),
    };

    const engine = createQuests(deps, quests, givers);
    expect(engine.interact(0, 0)).toBe(true);
    // Step 0: visit (10, 0)
    engine.update(0.1, 10, 0);
    // Step 1: choice optionA at (20, 0)
    engine.update(0.1, 20, 0);

    expect(earned).toEqual([300]);
    expect(paid).toEqual([300]);
    expect(bulletins).toEqual(['test-bulletin']);
    expect(engine.hint()).toBeNull();
  });
});
