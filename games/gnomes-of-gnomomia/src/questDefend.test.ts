import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { QUESTS } from './content';
import { allEntities, encounterOf, removeEntity } from './entities';
import { player } from './player';
import { startQuest, updateQuests } from './quests';
import { state } from './state';
import { encounterKey, type DefendObjective } from './questRules';

const QID = 'c2-trial-warden';
const o = QUESTS[QID].stages[0].objective as DefendObjective;
const tick = (s: number) => {
  for (let t = 0; t < s; t += 0.25) updateQuests(0.25);
};
const waves = () =>
  allEntities().filter((e) => encounterOf(e.id) === encounterKey(QID, 0) && !e.dead);
const firstWave = o.waves.filter((w) => w.at === 0).reduce((n, w) => n + w.count, 0);

function resetQuest(): void {
  state.zone = 'thatchford';
  delete state.quests[QID];
  player.dead = false;
}

describe('defend stages arm in the circle and clean up their waves', () => {
  beforeEach(resetQuest);
  afterEach(() => {
    resetQuest();
    for (const e of allEntities()) removeEntity(e.id);
  });

  it('starts only inside the circle, clears its waves on reset, and does not double', () => {
    // 1. Outside the circle nothing spawns.
    player.position.set(o.x + 30, 0, o.z);
    startQuest(QID);
    tick(20);
    expect(waves().length).toBe(0);

    // 2. Stepping into the circle fires the first wave.
    player.position.set(o.x, 0, o.z);
    tick(0.5);
    expect(waves().length).toBe(firstWave);

    // 3. Walking away for 6 s resets the run and removes its waves.
    player.position.set(o.x + 30, 0, o.z);
    tick(6);
    expect(waves().length).toBe(0);

    // 4. Returning starts a fresh run with one first wave, not two.
    player.position.set(o.x, 0, o.z);
    tick(0.5);
    expect(waves().length).toBe(firstWave);

    // 5. Holding the circle to the end advances the stage and clears what is left.
    tick(o.seconds + 1);
    expect(state.quests[QID].stage).toBe(1);
    expect(waves().length).toBe(0);
  });
});
