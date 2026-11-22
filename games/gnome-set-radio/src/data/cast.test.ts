import { describe, expect, it } from 'vitest';
import { getPrefab } from '@lawn/prefabs';
import { AREA_JINGLES } from '../audio/jingles';
import { getLevelDoc, LEVEL_ORDER } from '../levels/loader';
import { AREA_PATROL_ROUTES } from '../view/gangCrew';
import { AREA_CAST, AREA_ORDER_ALL } from './cast';
import { ALL_CUTSCENES, AREA_CUTSCENES, GAME_INTRO_CUTSCENE } from './cutscenes';

describe('Gnom Set Radio Cast, Jingles & Cutscenes', () => {
  it('defines all 9 areas with 9 leaders, 18 sidekicks, 18 crew variations, and 9 jingles', () => {
    expect(AREA_ORDER_ALL).toHaveLength(9);
    let sidekickCount = 0;
    let crewCount = 0;
    for (const id of AREA_ORDER_ALL) {
      const cast = AREA_CAST[id];
      expect(cast).toBeDefined();
      expect(cast.leader.name.length).toBeGreaterThan(0);
      expect(cast.sidekicks).toHaveLength(2);
      expect(cast.crewVariants).toHaveLength(2);
      sidekickCount += cast.sidekicks.length;
      crewCount += cast.crewVariants.length;

      const jingle = AREA_JINGLES[id];
      expect(jingle).toBeDefined();
      expect(jingle.notes.length).toBeGreaterThanOrEqual(5);
    }
    expect(sidekickCount).toBe(18);
    expect(crewCount).toBe(18);
  });

  it('defines 1 game intro, 24 cutscenes for areas 1-8, and 5 special cutscenes for area 9 (30 total)', () => {
    expect(GAME_INTRO_CUTSCENE.beats.length).toBeGreaterThanOrEqual(3);
    for (const id of AREA_ORDER_ALL) {
      const bundle = AREA_CUTSCENES[id];
      expect(bundle.levelIntro.beats.length).toBeGreaterThan(0);
      expect(bundle.bossIntro.beats.length).toBeGreaterThan(0);
      expect(bundle.bossDefeat.beats.length).toBeGreaterThan(0);
    }
    expect(AREA_CUTSCENES['zero-hz-zenith'].extra).toHaveLength(2);
    expect(ALL_CUTSCENES).toHaveLength(30);
  });

  it('resolves every crew and gnome-sidekick equipment prefab in @lawn/prefabs', () => {
    for (const id of AREA_ORDER_ALL) {
      const cast = AREA_CAST[id];
      for (const variant of cast.crewVariants) {
        const equipIds = Object.values(variant.equips).filter((v): v is string => !!v);
        expect(equipIds.length).toBeGreaterThanOrEqual(1);
        expect(equipIds.length).toBeLessThanOrEqual(2);
        for (const pid of equipIds) {
          expect(getPrefab(pid), `Missing prefab ${pid} for ${variant.id}`).toBeDefined();
        }
        expect(variant.shoutouts.length).toBeGreaterThanOrEqual(3);
      }
      for (const sk of cast.sidekicks) {
        if (sk.kind === 'gnome' && sk.gnomeLook?.equipment) {
          for (const pid of Object.values(sk.gnomeLook.equipment)) {
            if (pid) expect(getPrefab(pid), `Missing prefab ${pid} for ${sk.id}`).toBeDefined();
          }
        } else if (sk.kind === 'woken' && sk.prefabId) {
          expect(getPrefab(sk.prefabId), `Missing prefab ${sk.prefabId} for ${sk.id}`).toBeDefined();
        }
      }
    }
  });

  it('keeps all skating patrol waypoints outside building footprints in built areas 1-4', () => {
    for (const id of LEVEL_ORDER) {
      const doc = getLevelDoc(id);
      const routes = AREA_PATROL_ROUTES[id] ?? [];
      expect(routes).toHaveLength(3);
      for (const route of routes) {
        for (const [px, pz] of route.points) {
          for (const b of doc.data.buildings) {
            const insideX = Math.abs(px - b.x) < b.w * 0.5 + 0.5;
            const insideZ = Math.abs(pz - b.z) < b.d * 0.5 + 0.5;
            expect(insideX && insideZ, `Waypoint (${px},${pz}) in ${id} overlaps ${b.id}`).toBe(false);
          }
        }
      }
    }
  });
});
