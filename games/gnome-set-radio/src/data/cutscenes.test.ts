import { describe, expect, it } from 'vitest';
import { AREA_JINGLES } from '../audio/jingles';
import { AREA_ORDER_ALL } from './cast';
import { ALL_CUTSCENES, AREA_CUTSCENES, GAME_INTRO_CUTSCENE } from './cutscenes';

const CAMERA_CUES = new Set([
  'wide-orbit',
  'leader-closeup',
  'sidekicks-pan',
  'boss-stage',
  'boss-dramatic-low',
  'boss-spiral-reveal',
  'player-hero',
  'sky-ascend',
  'dj-booth',
  'crew-lineup',
]);

describe('Gnom Set Radio cutscene data', () => {
  it('opens with a 5-to-6 beat game intro establishing world, Woken, gangs, crew, and controls', () => {
    expect(GAME_INTRO_CUTSCENE.beats.length).toBeGreaterThanOrEqual(5);
    expect(GAME_INTRO_CUTSCENE.beats.length).toBeLessThanOrEqual(6);
  });

  it('gives every area rich multi-beat levelIntro (>=4), bossIntro (>=4), and bossDefeat (>=3) cutscenes', () => {
    for (const id of AREA_ORDER_ALL) {
      const bundle = AREA_CUTSCENES[id];
      expect(bundle.levelIntro.beats.length, `${id} levelIntro`).toBeGreaterThanOrEqual(4);
      expect(bundle.bossIntro.beats.length, `${id} bossIntro`).toBeGreaterThanOrEqual(4);
      expect(bundle.bossDefeat.beats.length, `${id} bossDefeat`).toBeGreaterThanOrEqual(3);
    }
  });

  it('gives every cutscene a unique id so ?cutscene=<id> and the lore theater find the right one', () => {
    const ids = ALL_CUTSCENES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ties each area level intro, boss intro and boss defeat to its own area', () => {
    for (const id of AREA_ORDER_ALL) {
      const bundle = AREA_CUTSCENES[id];
      expect(bundle.levelIntro.areaId, bundle.levelIntro.id).toBe(id);
      expect(bundle.bossIntro.areaId, bundle.bossIntro.id).toBe(id);
      expect(bundle.bossDefeat.areaId, bundle.bossDefeat.id).toBe(id);
    }
  });

  it('includes every area questIntros handoff in ALL_CUTSCENES with valid areaId, unique ids, cues, jingles, and dialogue', () => {
    const allIds = new Set(ALL_CUTSCENES.map((c) => c.id));
    for (const id of AREA_ORDER_ALL) {
      const questIntros = AREA_CUTSCENES[id].questIntros;
      expect(questIntros, `${id} missing questIntros`).toBeDefined();
      const entries = Object.entries(questIntros!);
      expect(entries.length, `${id} questIntros count`).toBeGreaterThanOrEqual(2);
      for (const [eventId, def] of entries) {
        expect(def.areaId, `${id}/${eventId}`).toBe(id);
        expect(allIds.has(def.id), `${def.id} missing from ALL_CUTSCENES`).toBe(true);
        expect(def.beats.length, def.id).toBeGreaterThan(0);
        for (const beat of def.beats) {
          expect(beat.speaker.length, def.id).toBeGreaterThan(0);
          expect(beat.text.length, def.id).toBeGreaterThan(0);
          expect(CAMERA_CUES.has(beat.camera), `${def.id}: camera ${beat.camera}`).toBe(true);
          if (beat.playJingle) {
            expect(AREA_JINGLES[beat.playJingle], `${def.id}: jingle ${beat.playJingle}`).toBeDefined();
          }
        }
      }
    }
  });

  it('only uses beats the player can play: known camera cues, known jingles, text and a speaker', () => {
    for (const def of ALL_CUTSCENES) {
      expect(def.beats.length, def.id).toBeGreaterThan(0);
      for (const beat of def.beats) {
        expect(beat.speaker.length, def.id).toBeGreaterThan(0);
        expect(beat.text.length, def.id).toBeGreaterThan(0);
        expect(CAMERA_CUES.has(beat.camera), `${def.id}: camera ${beat.camera}`).toBe(true);
        if (beat.playJingle) {
          expect(AREA_JINGLES[beat.playJingle], `${def.id}: jingle ${beat.playJingle}`).toBeDefined();
        }
        if (beat.titleCard) {
          expect(beat.titleCard.accentColor, def.id).toMatch(/^#[0-9a-f]{6}$/i);
        }
      }
    }
  });
});
