import { describe, expect, it } from 'vitest';
import { AREA_JINGLES } from '../audio/jingles';
import { AREA_ORDER_ALL } from './cast';
import { ALL_CUTSCENES, AREA_CUTSCENES } from './cutscenes';

const CAMERA_CUES = new Set([
  'wide-orbit',
  'leader-closeup',
  'sidekicks-pan',
  'boss-stage',
  'player-hero',
  'sky-ascend',
  'dj-booth',
  'crew-lineup',
]);

describe('Gnom Set Radio cutscene data', () => {
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
