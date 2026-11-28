// Quest sim: the passenger solver on a throwaway objective (Side-Valve Salvage to Juniper's door).
import '../globals';
import { describe, expect, it } from 'vitest';
import { SIDE_VALVE } from '../../config';
import { homeDoor } from '../../homes/data';
import { rescueLine } from '../../quests/objectivesPassenger';
import type { ObjectiveDef } from '../../quests/types';
import type { Vehicle } from '../../types';
import { buildSimWorld } from '../harness';
import { objectiveSession, TEST_QUEST } from '../testkit';
import { stepDone } from '../util';
import { passengerSolver } from './passenger';

describe('passenger solver', () => {
  const sim = buildSimWorld();

  it("picks a passenger up near Side-Valve Salvage and drops them at Juniper's door", async () => {
    const obj: Extract<ObjectiveDef, { kind: 'passenger' }> = {
      kind: 'passenger',
      text: 'Give Pip a lift.',
      who: 'pip',
      name: 'Pip',
      pickup: [SIDE_VALVE.bay.x, SIDE_VALVE.bay.z],
      dropAt: homeDoor('juniper'),
      radius: 8,
      hint: "Juniper's door",
      vehicle: { kind: 'ride-on', at: [SIDE_VALVE.bay.x + 4, SIDE_VALVE.bay.z, 0] },
      maxDamage: 0.6,
      banter: ['Mind the kerb.', 'Nice mower.'],
    };
    const s = await objectiveSession(sim, obj);
    try {
      await passengerSolver.solve(obj, s, { questId: TEST_QUEST, step: 0, budget: 600 });
      expect(stepDone(s, TEST_QUEST, 0)).toBe(true);
      expect(s.record.toasts.some((t) => t.includes('Pip climbs in.'))).toBe(true);
    } finally {
      s.dispose();
    }
  }, 60_000);

  // quest-fuzz (destroy-vehicle): the player's ride is gone before the pickup and the step sets no `vehicle`.
  it('parks a ride beside the pickup for a player who arrives on foot', async () => {
    const pickup: [number, number] = [SIDE_VALVE.bay.x, SIDE_VALVE.bay.z];
    const obj: Extract<ObjectiveDef, { kind: 'passenger' }> = {
      kind: 'passenger', text: 'Give Pip a lift.', who: 'pip', name: 'Pip', pickup, dropAt: homeDoor('juniper'), radius: 8, hint: "Juniper's door",
    };
    const s = await objectiveSession(sim, obj);
    try {
      if (s.player.vehicle) s.exit();
      const near = (v: Vehicle) => Math.hypot(v.x - pickup[0], v.z - pickup[1]) < 60;
      for (let i = s.vehicles.length - 1; i >= 0; i--) if (near(s.vehicles[i])) s.vehicles.splice(i, 1);
      s.teleport(pickup[0] + 5, pickup[1]);
      await s.step();
      await s.step();
      expect(s.record.toasts).toContain(rescueLine('Pip'));
      expect(s.vehicles.some((v) => v.questOwned && v.kind === 'ride-on' && near(v))).toBe(true);
      await passengerSolver.solve(obj, s, { questId: TEST_QUEST, step: 0, budget: 600 });
      expect(stepDone(s, TEST_QUEST, 0)).toBe(true);
    } finally {
      s.dispose();
    }
  }, 60_000);
});
