// The E14 dirt quests: in QUESTS, givers exist, tracks and vehicles are real, the rally is point-to-point, the Cap Count
// walks all six spots.
import { describe, expect, it, vi } from 'vitest';

vi.mock('../audio', () => ({ play: vi.fn(), setEngine: vi.fn(), setSkid: vi.fn(), unlockAudio: vi.fn() }));
import { CAP_COUNT_SPOTS } from '../capwood/spots';
import { TRACK_IDS } from '../raceTrack/tracks';
import { VEHICLES } from '../config';
import { GIVERS, questById } from './defs';
import { DIRT_QUEST_IDS, DIRT_QUESTS } from './dirtRaces';
import { unlockRule } from './unlocks';

describe('dirt quests', () => {
  it('are all in QUESTS, each with a giver, an unlock row and a reward', () => {
    expect(DIRT_QUESTS.map((q) => q.id)).toEqual([...DIRT_QUEST_IDS]);
    for (const q of DIRT_QUESTS) {
      expect(questById(q.id), q.id).toBe(q);
      expect(GIVERS[q.giver], q.giver).toBeDefined();
      expect(unlockRule(q.id), q.id).toBeDefined();
      expect(q.achievement, q.id).toBeTruthy();
      expect(q.rewardAcorns, q.id).toBeGreaterThan(0);
    }
  });

  it('race objectives name valid tracks and vehicles; point-to-point runs are one lap with a gold time', () => {
    for (const q of DIRT_QUESTS) {
      for (const o of q.objectives) {
        if (o.kind !== 'race') continue;
        expect(TRACK_IDS as readonly string[], q.id).toContain(o.trackId);
        expect(VEHICLES[o.vehicle], q.id).toBeDefined();
        expect(o.rivals.length, q.id).toBeGreaterThanOrEqual(3);
        if (o.trackId === 'capwood-run') {
          expect(o.laps).toBe(1);
          expect(o.timeAchievement?.seconds).toBeGreaterThan(0);
        }
      }
    }
  });

  it('The Cap Count checks every cap-count spot, then returns to the warden', () => {
    const q = questById('sq-capwood-cap-count')!;
    const cp = q.objectives[0];
    expect(cp.kind).toBe('checkpoints');
    if (cp.kind !== 'checkpoints') return;
    for (const s of CAP_COUNT_SPOTS) {
      expect(cp.points.some((p) => p.at[0] === s.x && p.at[1] === s.z), s.label).toBe(true);
    }
    expect(cp.points.length).toBe(CAP_COUNT_SPOTS.length);
    expect(q.objectives[1].kind).toBe('visit');
  });
});
