import * as THREE from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../audio', () => ({ play: vi.fn(), setEngine: vi.fn(), setSkid: vi.fn(), unlockAudio: vi.fn() }));
import { createQuests, SAVE_KEY } from './quests';
import type { GiverDef, QuestDef, QuestDeps, QuestSave } from './types';

const givers: Record<string, GiverDef> = {
  g1: { id: 'g1', name: 'Giver', label: 'Talk', x: 0, z: 0, exit: { x: 0, z: 0, yaw: 0 }, room: 'street', letter: 'G' },
};
const quests: QuestDef[] = [
  {
    id: 'rq', title: 'Retry Quest', giver: 'g1', doneText: 'Done', hoa: 'off',
    objectives: [
      { kind: 'visit', text: 'Go east', at: [100, 0], radius: 3, hint: 'East' },
      { kind: 'visit', text: 'Go north', at: [0, 100], radius: 3, hint: 'North' },
    ],
  },
];

function makeDeps() {
  const setCap = vi.fn();
  const clear = vi.fn();
  const placePlayer = vi.fn();
  const toast = vi.fn();
  const banner = vi.fn();
  const player = { x: 5, y: 0, z: 6, yaw: 1.5, vehicle: null, exit: vi.fn() };
  const deps: QuestDeps = {
    scene: new THREE.Scene(),
    world: { walkPoints: [{ x: 0, z: 0 }], boxes: [] } as unknown as QuestDeps['world'],
    npcs: { list: [], spawnNamed: vi.fn(), scare: vi.fn() } as unknown as QuestDeps['npcs'],
    hud: { setWorld: vi.fn(), set: vi.fn(), toast, banner, setObjective: vi.fn(), setVisible: vi.fn() },
    cutscene: { active: false, play: (_req, onDone) => onDone(), update: vi.fn(), skip: vi.fn() },
    placePlayer,
    unlock: vi.fn(),
    play: vi.fn(),
    watch: { setCap, clear } as unknown as QuestDeps['watch'],
    player: player as unknown as QuestDeps['player'],
  };
  return { deps, setCap, clear, placePlayer, toast, banner, player };
}

describe('quest checkpoint and retry', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
  });

  it('writes a checkpoint on step start and keeps it across a reload', () => {
    const a = makeDeps();
    const e1 = createQuests(a.deps, quests, givers);
    e1.interact(0, 0);
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY)!) as Record<string, QuestSave>;
    expect(saved.rq.checkpoint).toEqual({ step: 0, x: 5, z: 6, yaw: 1.5 });
    const b = makeDeps();
    b.player.x = 50;
    createQuests(b.deps, quests, givers);
    const again = JSON.parse(localStorage.getItem(SAVE_KEY)!) as Record<string, QuestSave>;
    expect(again.rq.checkpoint).toEqual({ step: 0, x: 5, z: 6, yaw: 1.5 });
  });

  it('retryActive restarts the step at the checkpoint after 1.5 s', () => {
    const d = makeDeps();
    const e = createQuests(d.deps, quests, givers);
    expect(e.retryActive!('x')).toBe(false);
    e.interact(0, 0);
    d.placePlayer.mockClear();
    d.player.x = 80;
    expect(e.retryActive!('Wrecked')).toBe(true);
    expect(d.banner).toHaveBeenCalledWith('RETRYING…', 1500);
    e.update(1, 80, 6);
    expect(d.placePlayer).not.toHaveBeenCalled();
    e.update(0.6, 80, 6);
    expect(d.placePlayer).toHaveBeenCalledWith(5, 6, 1.5);
    expect(d.clear).toHaveBeenCalled();
    expect(d.toast).toHaveBeenCalledWith('Back at the start of: Go east', 3500);
  });

  it('applies the hoa policy on start and clears it on abandon', () => {
    const d = makeDeps();
    const e = createQuests(d.deps, quests, givers);
    e.interact(0, 0);
    expect(d.setCap).toHaveBeenLastCalledWith(0);
    e.abandonActive();
    expect(d.setCap).toHaveBeenLastCalledWith(null);
  });

  it('onPlayerDown is false with no quest and retries at once with one', () => {
    const d = makeDeps();
    const e = createQuests(d.deps, quests, givers);
    expect(e.onPlayerDown!()).toBe(false);
    e.interact(0, 0);
    d.placePlayer.mockClear();
    expect(e.onPlayerDown!()).toBe(true);
    expect(d.placePlayer).toHaveBeenCalledWith(5, 6, 1.5);
    expect(d.toast).toHaveBeenCalledWith('Cracked! Retrying the step.', 3500);
  });
});
