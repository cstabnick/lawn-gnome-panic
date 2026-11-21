import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import type { PlatformApi } from '@lawn/cloudsave';

vi.mock('../audio', () => ({
  play: vi.fn(),
  setEngine: vi.fn(),
  setSkid: vi.fn(),
  unlockAudio: vi.fn(),
}));
import { WORLD_HALF } from '../config';
import { GIVERS, QUESTS, questById } from './defs';
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

describe('story campaign registry', () => {
  it('registers all 17 story quests with unique IDs, valid givers, acyclic prereqs, and in-bounds coordinates', () => {
    expect(QUESTS.length).toBe(17);
    const ids = new Set<string>();
    for (const q of QUESTS) {
      expect(ids.has(q.id)).toBe(false);
      ids.add(q.id);
      expect(GIVERS[q.giver]).toBeDefined();
      expect(q.objectives.length).toBeGreaterThan(0);
      expect(q.doneText.length).toBeGreaterThan(0);
      if (q.prereq) expect(questById(q.prereq)).toBeDefined();

      // Verify all coordinates stay within [-WORLD_HALF, WORLD_HALF].
      const inBounds = (x: number, z: number) =>
        Math.abs(x) <= WORLD_HALF && Math.abs(z) <= WORLD_HALF;

      for (const obj of q.objectives) {
        if (obj.kind === 'crack') {
          for (const t of obj.targets) expect(inBounds(t.near[0], t.near[1])).toBe(true);
        } else if (obj.kind === 'visit') {
          expect(inBounds(obj.at[0], obj.at[1])).toBe(true);
        } else if (obj.kind === 'steal-deliver') {
          expect(inBounds(obj.spawnAt[0], obj.spawnAt[1])).toBe(true);
          expect(inBounds(obj.dropAt[0], obj.dropAt[1])).toBe(true);
        } else if (obj.kind === 'chase-follow') {
          for (const wp of obj.waypoints) expect(inBounds(wp[0], wp[1])).toBe(true);
        } else if (obj.kind === 'convoy-ambush') {
          for (const wp of obj.route) expect(inBounds(wp[0], wp[1])).toBe(true);
          expect(inBounds(obj.dropAt[0], obj.dropAt[1])).toBe(true);
        } else if (obj.kind === 'air-drop') {
          if (obj.planeAt) expect(inBounds(obj.planeAt[0], obj.planeAt[1])).toBe(true);
          expect(inBounds(obj.dropZone[0], obj.dropZone[2])).toBe(true);
        } else if (obj.kind === 'survive-derby') {
          expect(inBounds(obj.arena[0], obj.arena[1])).toBe(true);
        } else if (obj.kind === 'boss-combine') {
          expect(Math.abs(obj.startZ)).toBeLessThanOrEqual(WORLD_HALF);
          expect(Math.abs(obj.endZ)).toBeLessThanOrEqual(WORLD_HALF);
        } else if (obj.kind === 'choice') {
          expect(inBounds(obj.optionA.at[0], obj.optionA.at[1])).toBe(true);
          expect(inBounds(obj.optionB.at[0], obj.optionB.at[1])).toBe(true);
        }
      }
    }

    // Check acyclic prereq chain from ch5-even-cut back to prologue-fresh-kiln.
    const chain: string[] = [];
    let cur = questById('ch5-even-cut');
    while (cur) {
      expect(chain.includes(cur.id)).toBe(false);
      chain.push(cur.id);
      cur = cur.prereq ? questById(cur.prereq) : undefined;
    }
    expect(chain[chain.length - 1]).toBe('prologue-fresh-kiln');
    expect(chain.length).toBe(16);
  });

  it('preserves first-contract compatibility and includes John Bodega & Asphalt cameos in chapters 1, 3, and 5', () => {
    const fc = questById('first-contract');
    expect(fc).toBeDefined();
    expect(fc!.giver).toBe('mulch-club');
    expect(fc!.prereq).toBeUndefined();
    const crack = fc!.objectives[0];
    expect(crack.kind).toBe('crack');
    if (crack.kind === 'crack') {
      expect(crack.targets.map((t) => t.id)).toEqual(['dibbler', 'gravelbottom', 'spadewell']);
    }

    const cameoChapters = new Set<number>();
    for (const q of QUESTS) {
      if (q.cutscene?.kind === 'dialogue' && q.cutscene.lines.some((l) => l.bodegaCameo)) {
        if (q.chapter) cameoChapters.add(q.chapter);
      }
    }
    expect(cameoChapters.has(1)).toBe(true);
    expect(cameoChapters.has(3)).toBe(true);
    expect(cameoChapters.has(5)).toBe(true);
  });
});
