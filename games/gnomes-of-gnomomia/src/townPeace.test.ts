// The Bound-Peace (src/towns.ts): enemies do not fight a gnome inside a town, except in a called fight. These tests keep
// the data honest: ambient spawns stay clear of towns, and every fight that a quest starts inside a town is listed.
import { describe, expect, it } from 'vitest';
import { QUESTS, SPAWNS } from './content';
import { TOWNS, TOWN_SPAWN_MARGIN, enemyMayEngage, spawnCircleClearOfTowns, townAt } from './towns';

/** Every fight a quest starts on purpose inside a town. A new one fails the test below until it is listed here. */
export const CALLED_FIGHTS: { spawns: Record<string, string>; defends: Record<string, string> } = {
  spawns: {
    's04-spawn-1': 'Keep pikemen march into Sodbury during Pikemen on the Road; the town is the battlefield.',
    's14-spawn-1': 'Muck sprites boil up in the Thatchford square during The Smith\'s Road; the quest calls them there.',
  },
  defends: {
    'c2-trial-warden': 'Hold the Ford: Stoutpot\'s trial is fought at the ford in Thatchford on purpose.',
    's01-clock-let-in': 'The Clock Runs Down: ferals come up the path for the Idol at the Mossbottom well.',
    's03-hold-the-cellar-hatch': 'The Tipsy Toadstool hatch is in the square; holding it is the quest.',
  },
};

const groupName = (g: (typeof SPAWNS)[number], i: number): string => g.id ?? `SPAWNS[${i}] (${g.zone} ${g.enemy})`;

/** The first town the circle (x, z, spread) comes within TOWN_SPAWN_MARGIN of, for the failure message. */
function nearTown(x: number, z: number, spread: number): string {
  const t = TOWNS.find((t) => Math.hypot(x - t.x, z - t.z) - spread < t.r + TOWN_SPAWN_MARGIN);
  return t ? t.name : '?';
}

describe('the Bound-Peace', () => {
  it('keeps every ambient spawn group clear of the towns', () => {
    const bad: string[] = [];
    SPAWNS.forEach((g, i) => {
      if (g.townFight) return;
      if (!spawnCircleClearOfTowns(g.x, g.z, g.spread)) {
        bad.push(`${groupName(g, i)} at (${g.x.toFixed(1)}, ${g.z.toFixed(1)}) r${g.spread} is in or near ${nearTown(g.x, g.z, g.spread)}`);
      }
    });
    expect(bad).toEqual([]);
  });

  it('only lets a quest call a town fight', () => {
    const bad = SPAWNS.map((g, i) => ({ g, i }))
      .filter(({ g }) => g.townFight && !(g.when?.quest || g.when?.questStage))
      .map(({ g, i }) => groupName(g, i));
    expect(bad).toEqual([]);
  });

  it('lists every called fight inside a town', () => {
    const spawnsInTown = SPAWNS.map((g, i) => ({ g, i }))
      .filter(({ g }) => g.townFight && !spawnCircleClearOfTowns(g.x, g.z, g.spread))
      .map(({ g, i }) => groupName(g, i))
      .sort();
    expect(spawnsInTown).toEqual(Object.keys(CALLED_FIGHTS.spawns).sort());
    expect(spawnsInTown).toEqual(['s04-spawn-1', 's14-spawn-1']);

    const defendsInTown = Object.values(QUESTS)
      .filter((q) => q.stages.some((s) => s.objective.type === 'defend' && townAt(s.objective.x, s.objective.z) !== null))
      .map((q) => q.id)
      .sort();
    expect(defendsInTown).toEqual(Object.keys(CALLED_FIGHTS.defends).sort());
    expect(defendsInTown).toEqual(['c2-trial-warden', 's01-clock-let-in', 's03-hold-the-cellar-hatch']);
    for (const reason of [...Object.values(CALLED_FIGHTS.spawns), ...Object.values(CALLED_FIGHTS.defends)]) {
      expect(reason.length).toBeGreaterThan(0);
    }
  });

  it('enemyMayEngage holds the peace in town and nowhere else', () => {
    expect(TOWNS.length).toBeGreaterThan(0);
    for (const t of TOWNS) {
      expect(enemyMayEngage(t.x, t.z, false), t.id).toBe(false);
      expect(enemyMayEngage(t.x, t.z, true), t.id).toBe(true);
    }
    expect(enemyMayEngage(1e6, 1e6, false)).toBe(true);
  });
});
