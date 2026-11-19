import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, LocalAchievementStore, emoteCatalog, type StorageLike } from '@lawn/achievements';
import { createGnomeModel, GNORMAN_LOOK } from '@lawn/gnome';
import * as THREE from 'three';
import {
  DEFAULT_LOADOUT,
  EMOTES,
  EMOTE_LOADOUT_KEY,
  MAX_EQUIPPED,
  createEmotePlayer,
  getEmote,
  isEmoteId,
  loadLoadout,
  loadMyEmotes,
  sampleEmote,
  saveLoadout,
  unlockedEmotes,
} from './index';

function fakeStorage(): StorageLike {
  const map = new Map<string, string>();
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v) };
}

describe('emote catalog', () => {
  it('has unique kebab-case ids and finite poses', () => {
    const ids = new Set<string>();
    for (const e of EMOTES) {
      expect(e.id).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(ids.has(e.id), `duplicate ${e.id}`).toBe(false);
      ids.add(e.id);
      expect(e.duration).toBeGreaterThan(0);
      for (let t = 0; t <= e.duration * 2; t += 0.05) {
        const p = sampleEmote(e, t);
        const values = [p.armL.x, p.armL.z, p.armR.x, p.armR.z, p.legL.x, p.legL.z, p.legR.x, p.legR.z, p.lift, p.shift, p.yaw, p.lean, p.tip];
        for (const v of values) expect(Number.isFinite(v), `${e.id} at ${t}`).toBe(true);
      }
    }
  });

  it('one-shots start and end at rest', () => {
    for (const e of EMOTES.filter((x) => !x.loop)) {
      for (const t of [0, e.duration]) {
        const p = sampleEmote(e, t);
        const values = [p.armL.x, p.armL.z, p.armR.x, p.armR.z, p.legL.x, p.legL.z, p.legR.x, p.legR.z, p.lift, p.shift, p.lean, p.tip];
        for (const v of values) expect(Math.abs(v), `${e.id} at ${t}`).toBeLessThan(0.02);
        // A spin may end on a whole turn.
        expect(Math.abs(Math.sin(p.yaw)), `${e.id} yaw at ${t}`).toBeLessThan(0.02);
      }
    }
  });

  it('every achievement emote exists, and every non-free emote has exactly one achievement', () => {
    for (const def of emoteCatalog()) {
      const e = getEmote(def.emote!.emoteId);
      expect(e, `${def.id} -> ${def.emote!.emoteId}`).toBeDefined();
      expect(e!.free, `${e!.id} is free but also an achievement reward`).toBeFalsy();
      expect(def.emote!.label).toBe(e!.label);
      expect(def.emote!.icon).toBe(e!.icon);
    }
    for (const e of EMOTES.filter((x) => !x.free)) {
      expect(ACHIEVEMENTS.filter((a) => a.emote?.emoteId === e.id), e.id).toHaveLength(1);
    }
    expect(emoteCatalog().length).toBeGreaterThanOrEqual(10);
    expect(new Set(emoteCatalog().map((a) => a.game)).size).toBeGreaterThanOrEqual(5);
  });

  it('validates ids', () => {
    expect(isEmoteId('battle-bop')).toBe(true);
    expect(isEmoteId('toString')).toBe(false);
    expect(isEmoteId(3)).toBe(false);
  });
});

describe('loadout', () => {
  it('defaults to the free emotes and round-trips up to 4', () => {
    const s = fakeStorage();
    expect(loadLoadout(s)).toEqual([...DEFAULT_LOADOUT]);
    const saved = saveLoadout(['floss', 'floss', 'nope', 'wave', 'cheer', 'worm', 'salute'], s);
    expect(saved).toEqual(['floss', 'wave', 'cheer', 'worm']);
    expect(saved.length).toBe(MAX_EQUIPPED);
    expect(loadLoadout(s)).toEqual(saved);
    expect(saveLoadout([], s)).toEqual([]);
    expect(loadLoadout(s)).toEqual([]);
  });

  it('survives junk and blocked storage', () => {
    const s = fakeStorage();
    s.setItem(EMOTE_LOADOUT_KEY, '{oops');
    expect(loadLoadout(s)).toEqual([...DEFAULT_LOADOUT]);
    expect(loadLoadout(null)).toEqual([...DEFAULT_LOADOUT]);
    expect(saveLoadout(['wave'], null)).toEqual(['wave']);
  });

  it('unlocks emotes through achievements', async () => {
    expect(unlockedEmotes([])).toEqual([...DEFAULT_LOADOUT]);
    expect(unlockedEmotes(['front-battle-bop'])).toContain('battle-bop');
    const store = new LocalAchievementStore(fakeStorage());
    const loadout = fakeStorage();
    saveLoadout(['battle-bop', 'wave'], loadout);
    expect((await loadMyEmotes(store, loadout)).map((e) => e.id)).toEqual(['wave']);
    await store.unlock('front-battle-bop');
    expect((await loadMyEmotes(store, loadout)).map((e) => e.id)).toEqual(['battle-bop', 'wave']);
  });
});

describe('emote player', () => {
  const state = () => ({ position: new THREE.Vector3(), velocity: new THREE.Vector3(), facing: 0, grounded: true, jumpsUsed: 0 });

  it('poses the model and returns it to rest', () => {
    const model = createGnomeModel(GNORMAN_LOOK);
    const player = createEmotePlayer(model);
    const s = state();
    expect(player.play('wave')).toBe(true);
    expect(player.play('nope')).toBe(false);
    expect(player.current).toBe('wave');
    for (let i = 0; i < 30; i++) {
      model.update(s, 1 / 30);
      player.update(1 / 30);
    }
    expect(model.arms.right.rotation.z).toBeLessThan(-1);
    for (let i = 0; i < 60; i++) {
      model.update(s, 1 / 30);
      player.update(1 / 30);
    }
    expect(player.current).toBeNull();
    expect(model.arms.right.rotation.z).toBe(0);
    expect(model.rig.rotation.y).toBe(0);
  });

  it('stops a looping dance when the gnome walks', () => {
    const model = createGnomeModel(GNORMAN_LOOK);
    const player = createEmotePlayer(model);
    const s = state();
    player.play('battle-bop');
    for (let i = 0; i < 300; i++) {
      model.update(s, 1 / 60);
      player.update(1 / 60);
    }
    expect(player.current).toBe('battle-bop');
    for (let i = 0; i < 20; i++) {
      model.update(s, 1 / 60);
      player.update(1 / 60, true);
    }
    expect(player.current).toBeNull();
    expect(model.rig.position.x).toBe(0);
  });
});
