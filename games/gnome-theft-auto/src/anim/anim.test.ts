import { describe, expect, it } from 'vitest';
import { createGnomeModel, GNORMAN_LOOK } from '@lawn/gnome';
import { getPrefab } from '@lawn/prefabs';
import { DANCE_ANIMS } from './dances';
import { EMOTE_ANIMS } from './emotes';
import { IDLE_ANIMS } from './idles';
import { REACT_ANIMS } from './reacts';
import { WORK_ANIMS } from './work';
import { EMOTE_B_ANIMS } from './emotesB';
import { REACT_B_ANIMS } from './reactsB';
import { ROLE_ANIMS } from './roles';
import { HUNT_ANIMS } from './hunt';
import { RIDE_ANIMS } from './ride';
import { ANIMS, animById, listAnims, pickFor, upperBodyOnly } from './index';
import { createAnimator, BLEND } from './animator';
import { createPlayerEmote } from './playerEmote';
import {
  DANCE_IDS, EMOTE_B_IDS, EMOTE_IDS, HUNT_IDS, IDLE_IDS, REACT_B_IDS, REACT_IDS, RIDE_IDS, ROLE_IDS, WORK_IDS,
  type AnimDef, type AnimPart,
} from './types';

const PARTS: readonly AnimPart[] = ['armL', 'armR', 'legL', 'legR', 'body'];

/** Shared row checks for one category file. */
function checkRows(name: string, rows: readonly AnimDef[], ids: readonly string[], category: string): void {
  describe(`${name} rows`, () => {
    it('has one row per id, in order', () => {
      expect(rows.map((r) => r.id)).toEqual([...ids]);
    });
    for (const r of rows) {
      it(`${r.id}: well-formed`, () => {
        expect(r.category).toBe(category);
        expect(r.label.length).toBeGreaterThan(0);
        expect(r.label.length).toBeLessThanOrEqual(12);
        expect(r.icon.length).toBeGreaterThan(0);
        expect(r.duration).toBeGreaterThan(0);
        expect(r.parts.length).toBeGreaterThan(0);
        for (const p of r.parts) expect(PARTS).toContain(p);
        if (r.prop) expect(getPrefab(r.prop), `${r.id} prop ${r.prop}`).toBeTruthy();
      });
      it(`${r.id}: poses exactly its parts with finite, sane angles`, () => {
        for (let i = 0; i < 24; i++) {
          const pose = r.pose((r.duration * i) / 24);
          const keys = Object.keys(pose).filter((k) => k !== 'lift').sort();
          expect(keys).toEqual([...r.parts].sort());
          for (const p of r.parts) {
            const v = pose[p]!;
            expect(v).toHaveLength(3);
            for (const n of v) {
              expect(Number.isFinite(n)).toBe(true);
              expect(Math.abs(n)).toBeLessThanOrEqual(Math.PI + 0.01);
            }
          }
          if (pose.lift !== undefined) {
            expect(Number.isFinite(pose.lift)).toBe(true);
            expect(Math.abs(pose.lift)).toBeLessThanOrEqual(0.6);
          }
        }
      });
      if (r.loop) {
        it(`${r.id}: loop ends where it starts`, () => {
          const a = r.pose(0);
          const b = r.pose(r.duration - 1e-4);
          for (const p of r.parts) for (let k = 0; k < 3; k++) expect(b[p]![k]).toBeCloseTo(a[p]![k], 1);
        });
      }
    }
  });
}

checkRows('emote', EMOTE_ANIMS, EMOTE_IDS, 'emote');
checkRows('dance', DANCE_ANIMS, DANCE_IDS, 'dance');
checkRows('idle', IDLE_ANIMS, IDLE_IDS, 'idle');
checkRows('react', REACT_ANIMS, REACT_IDS, 'react');
checkRows('work', WORK_ANIMS, WORK_IDS, 'work');
checkRows('emoteB', EMOTE_B_ANIMS, EMOTE_B_IDS, 'emote');
checkRows('reactB', REACT_B_ANIMS, REACT_B_IDS, 'react');
checkRows('role', ROLE_ANIMS, ROLE_IDS, 'role');
checkRows('hunt', HUNT_ANIMS, HUNT_IDS, 'hunt');
checkRows('ride', RIDE_ANIMS, RIDE_IDS, 'ride');

describe('the table', () => {
  it('has every id exactly once', () => {
    const all = [
      ...EMOTE_IDS, ...DANCE_IDS, ...IDLE_IDS, ...REACT_IDS, ...WORK_IDS,
      ...EMOTE_B_IDS, ...REACT_B_IDS, ...ROLE_IDS, ...HUNT_IDS, ...RIDE_IDS,
    ];
    expect(new Set(all).size).toBe(all.length);
    expect(ANIMS.map((a) => a.id).sort()).toEqual([...all].sort());
  });
  it('looks up and filters', () => {
    expect(animById('no-such-anim')).toBeUndefined();
    for (const a of listAnims({ category: 'dance' })) expect(a.category).toBe('dance');
    for (const a of listAnims({ emote: true })) expect(a.emote).toBe(true);
  });
  it('dances and work all loop; work rows hold a prop', () => {
    for (const a of DANCE_ANIMS) expect(a.loop).toBe(true);
    for (const a of [...ROLE_ANIMS, ...RIDE_ANIMS]) expect(a.loop).toBe(true);
    for (const a of RIDE_ANIMS) expect(a.parts).toEqual(expect.arrayContaining(['legL', 'legR']));
    for (const a of WORK_ANIMS) {
      expect(a.loop).toBe(true);
      expect(a.prop).toBeTruthy();
    }
  });
  it('picks the same entry for the same key', () => {
    expect(pickFor('Polly', IDLE_IDS)).toBe(pickFor('Polly', IDLE_IDS));
  });
});

describe('animator', () => {
  const fake: AnimDef = animById('wave') ?? ANIMS[0];
  it('blends in, ends by itself and puts the arms back', () => {
    if (!fake) return; // table still empty mid-epic
    const model = createGnomeModel(GNORMAN_LOOK);
    const an = createAnimator();
    let ended = 0;
    expect(an.play(fake.id, { loop: false, onEnd: () => { ended++; } })).toBe(true);
    expect(an.play('no-such-anim')).toBe(false);
    an.apply(model, BLEND / 2);
    expect(an.weight).toBeCloseTo(0.5, 5);
    for (let i = 0; i < 600 && an.active; i++) an.apply(model, 1 / 60);
    expect(an.active).toBe(false);
    expect(ended).toBe(1);
    expect(model.arms.right.rotation.z).toBe(0);
    expect(model.rig.rotation.x).toBe(0);
  });
  it('holds a work prop while playing and drops it after', () => {
    const work = WORK_ANIMS[0];
    if (!work) return;
    const model = createGnomeModel(GNORMAN_LOOK);
    const an = createAnimator();
    const before = model.arms.right.children.length;
    an.play(work.id);
    for (let i = 0; i < 30; i++) an.apply(model, 1 / 60);
    expect(model.arms.right.children.length).toBe(before + 1);
    an.cancel(model);
    expect(model.arms.right.children.length).toBe(before);
  });
});

describe('player emote', () => {
  it('a full-body emote stops on walking, and anything blocking cuts it', () => {
    const full = ANIMS.find((a) => !upperBodyOnly(a));
    if (!full) return;
    const model = createGnomeModel(GNORMAN_LOOK);
    const e = createPlayerEmote();
    e.play(full.id);
    e.update(model, 1 / 60, { moving: false, blocked: false });
    expect(e.active).toBe(true);
    e.update(model, 1 / 60, { moving: false, blocked: true });
    expect(e.active).toBe(false);
    e.play(full.id);
    e.update(model, 1 / 60, { moving: false, blocked: false });
    for (let i = 0; i < 30; i++) e.update(model, 1 / 60, { moving: true, blocked: false });
    expect(e.active).toBe(false);
  });
});
