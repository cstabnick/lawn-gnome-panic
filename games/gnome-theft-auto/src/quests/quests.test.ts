import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import type { PlatformApi } from '@lawn/cloudsave';

vi.mock('../audio', () => ({
  play: vi.fn(),
  setEngine: vi.fn(),
  setSkid: vi.fn(),
  unlockAudio: vi.fn(),
}));
import { TESSIE, WORLD_HALF } from '../config';
import { pushOutOfBoxes } from '../collide';
import { EVENT_BULLETINS } from '../radio/content';
import { buildWorld } from '../world';
import { GIVERS, QUESTS, questById } from './defs';
import { SCENES } from '../cutscene/scenes';
import type { SceneScript } from '../cutscene/script';

/** A quest's scripted scenes: its intro, outro and arrival scenes. */
function questScenes(q: QuestDef): SceneScript[] {
  const ids: (string | SceneScript)[] = [];
  for (const spec of [q.cutscene, q.outro]) if (spec?.kind === 'script') ids.push(spec.script);
  for (const o of q.objectives) if (o.kind === 'visit' && o.scene) ids.push(o.scene);
  return ids.map((x) => (typeof x === 'string' ? SCENES[x] : x)).filter((x): x is SceneScript => !!x);
}
/** Every line of dialogue in a step list, parallel tracks included. */
function sayTexts(steps: SceneScript['steps']): string[] {
  return steps.flatMap((st) => (st.do === 'say' ? [st.text] : st.do === 'parallel' ? st.tracks.flatMap(sayTexts) : []));
}
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

  it('enforces one active quest at a time and supports restartActive / abandonActive / getJournal', () => {
    const givers: Record<string, GiverDef> = {
      g1: { id: 'g1', name: 'Giver 1', label: 'Talk 1', x: 0, z: 0, exit: { x: 0, z: 0, yaw: 0 }, room: 'street', letter: '1' },
      g2: { id: 'g2', name: 'Giver 2', label: 'Talk 2', x: 30, z: 0, exit: { x: 30, z: 0, yaw: 0 }, room: 'street', letter: '2' },
    };
    const quests: QuestDef[] = [
      { id: 'qa', title: 'Quest A', giver: 'g1', doneText: 'Done A', objectives: [{ kind: 'visit', text: 'Go A', at: [100, 0], radius: 3, hint: 'A' }] },
      { id: 'qb', title: 'Quest B', giver: 'g2', doneText: 'Done B', objectives: [{ kind: 'visit', text: 'Go B', at: [200, 0], radius: 3, hint: 'B' }] },
    ];
    const deps: QuestDeps = {
      scene: new THREE.Scene(),
      world: { walkPoints: [{ x: 0, z: 0 }] } as QuestDeps['world'],
      npcs: { list: [], spawnNamed: vi.fn(), scare: vi.fn() } as unknown as QuestDeps['npcs'],
      hud: { setWorld: vi.fn(), set: vi.fn(), toast: vi.fn(), banner: vi.fn(), setObjective: vi.fn(), setVisible: vi.fn() },
      cutscene: { active: false, play: (_req, onDone) => onDone(), update: vi.fn(), skip: vi.fn() },
      placePlayer: vi.fn(),
      unlock: vi.fn(),
      play: vi.fn(),
    };

    const engine = createQuests(deps, quests, givers);
    expect(engine.interact(0, 0)).toBe(true);
    expect(engine.getJournal().activeId).toBe('qa');
    // Second giver cannot start qb while qa is active.
    expect(engine.prompt(30, 0)).toBeNull();
    expect(engine.interact(30, 0)).toBe(true);
    expect(engine.getJournal().activeId).toBe('qa');

    expect(engine.restartActive()).toBe(true);
    expect(engine.getJournal().activeId).toBe('qa');

    expect(engine.abandonActive()).toBe(true);
    expect(engine.getJournal().activeId).toBeNull();
    // Now g2 is available again.
    expect(engine.prompt(30, 0)).toBe('Talk 2');
    expect(engine.interact(30, 0)).toBe(true);
    expect(engine.getJournal().activeId).toBe('qb');
  });
});

describe('story campaign registry', () => {
  it('registers all 17 story quests, 11 side quests, the Tessie quest and the 4 Speedway races with unique IDs, valid givers, acyclic prereqs, and in-bounds coordinates', () => {
    expect(QUESTS.length).toBe(33);
    const ids = new Set<string>();
    for (const q of QUESTS) {
      expect(ids.has(q.id)).toBe(false);
      ids.add(q.id);
      expect(GIVERS[q.giver]).toBeDefined();
      expect(q.objectives.length).toBeGreaterThan(0);
      expect(q.doneText.length).toBeGreaterThan(0);
      // The Tessie quest's prereq is its unlock entry in the save (tessieUnlock.ts), not a quest.
      if (q.prereq && q.prereq !== TESSIE.unlockKey) expect(questById(q.prereq)).toBeDefined();

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
      // Scripted scenes: John Bodega on stage.
      if (questScenes(q).some((sc) => (sc.actors ?? []).some((a) => a.preset === 'bodega'))) {
        if (q.chapter) cameoChapters.add(q.chapter);
      }
    }
    expect(cameoChapters.has(1)).toBe(true);
    expect(cameoChapters.has(3)).toBe(true);
    expect(cameoChapters.has(5)).toBe(true);
  });

  it('wires every quest radioBulletin to EVENT_BULLETINS and obeys R-021 no-wet/no-gore canon', () => {
    const banned = /\b(wet|wetter|wetness|soak\w*|blood\w*|gore|bleed\w*)\b/i;
    for (const q of QUESTS) {
      if (q.radioBulletin) {
        expect(EVENT_BULLETINS[q.radioBulletin]?.length ?? 0, q.radioBulletin).toBeGreaterThanOrEqual(2);
      }
      expect(q.title, q.id).not.toMatch(banned);
      expect(q.doneText, q.id).not.toMatch(banned);
      if (q.cutscene?.kind === 'dialogue') {
        for (const l of q.cutscene.lines) expect(l.text, q.id).not.toMatch(banned);
      }
      for (const sc of questScenes(q)) for (const t of sayTexts(sc.steps)) expect(t, sc.id).not.toMatch(banned);
      for (const obj of q.objectives) {
        expect(obj.text, q.id).not.toMatch(banned);
        if (obj.kind === 'choice') {
          expect(obj.optionA.endingText, q.id).not.toMatch(banned);
          expect(obj.optionB.endingText, q.id).not.toMatch(banned);
        }
      }
    }
  });

  it('keeps Pip Potsworth prologue chase-follow on paved road waypoints without U-turns', () => {
    const prologue = questById('prologue-fresh-kiln');
    expect(prologue).toBeDefined();
    const chase = prologue!.objectives[0];
    expect(chase.kind).toBe('chase-follow');
    if (chase.kind === 'chase-follow') {
      expect(chase.waypoints[0]).toEqual([0, 18]);
      // Consecutive waypoints must advance without doubling back to an earlier point
      for (let i = 2; i < chase.waypoints.length; i++) {
        const [ax, az] = chase.waypoints[i - 2];
        const [cx, cz] = chase.waypoints[i];
        expect(Math.hypot(cx - ax, cz - az)).toBeGreaterThan(10);
      }
    }
  });

  it('no quest giver, vehicle spawn, drop-off, or visit spot is trapped inside a building', () => {
    const noop = () => undefined;
    const fakeCtx = {
      fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '', textBaseline: '', globalAlpha: 1,
      fillRect: noop, strokeRect: noop, clearRect: noop, beginPath: noop, closePath: noop,
      arc: noop, moveTo: noop, lineTo: noop, quadraticCurveTo: noop, bezierCurveTo: noop,
      fill: noop, stroke: noop, fillText: noop, strokeText: noop, drawImage: noop,
      save: noop, restore: noop, translate: noop, rotate: noop, scale: noop,
      createLinearGradient: () => ({ addColorStop: noop }),
      createRadialGradient: () => ({ addColorStop: noop }),
      measureText: () => ({ width: 0 }),
      getImageData: (_x: number, _y: number, w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
      putImageData: noop,
    };
    const fakeCanvas = { width: 64, height: 64, getContext: () => fakeCtx, toDataURL: () => '' };
    const hadDoc = 'document' in globalThis;
    const prevDoc = (globalThis as { document?: unknown }).document;
    if (!hadDoc) {
      (globalThis as { document: unknown }).document = { createElement: () => ({ ...fakeCanvas }) };
    }
    let world: ReturnType<typeof buildWorld>;
    try {
      world = buildWorld(new THREE.Scene(), undefined as unknown as THREE.WebGLRenderer);
    } finally {
      if (!hadDoc) delete (globalThis as { document?: unknown }).document;
      else (globalThis as { document?: unknown }).document = prevDoc;
    }
    const failures: string[] = [];
    const check = (label: string, x: number, z: number, r: number) => {
      const p = pushOutOfBoxes(x, z, r, world.boxes, 0);
      if (p.hit) {
        failures.push(`${label} at [${x}, ${z}] (r=${r}) hits box -> pushed [${p.x.toFixed(1)}, ${p.z.toFixed(1)}]`);
      }
    };
    for (const g of Object.values(GIVERS)) {
      check(`giver:${g.id}`, g.x, g.z, 0.8);
    }
    for (const q of QUESTS) {
      q.objectives.forEach((o, i) => {
        const tag = `${q.id}[${i}](${o.kind})`;
        if (o.kind === 'steal-deliver') {
          check(`${tag}.spawnAt`, o.spawnAt[0], o.spawnAt[1], 1.8);
          check(`${tag}.dropAt`, o.dropAt[0], o.dropAt[1], 2.0);
        } else if (o.kind === 'visit') {
          check(`${tag}.at`, o.at[0], o.at[1], 1.0);
        } else if (o.kind === 'choice') {
          check(`${tag}.optionA`, o.optionA.at[0], o.optionA.at[1], 1.0);
          check(`${tag}.optionB`, o.optionB.at[0], o.optionB.at[1], 1.0);
        }
      });
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });
});
