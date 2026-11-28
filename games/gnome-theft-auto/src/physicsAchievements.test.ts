import { describe, it, expect, vi } from 'vitest';
import { createPhysicsAchievements, PHYSICS_ACH } from './physicsAchievements';

function tracker() {
  const unlock = vi.fn();
  return { unlock, ach: createPhysicsAchievements({ unlock }) };
}

describe('skipping stone', () => {
  it('unlocks once a skim of 35 m or more ends, not before', () => {
    const { unlock, ach } = tracker();
    ach.skimEnded(20);
    expect(unlock).not.toHaveBeenCalled();
    ach.skimEnded(36);
    expect(unlock).toHaveBeenCalledTimes(1);
    expect(unlock).toHaveBeenCalledWith(PHYSICS_ACH.skippingStone);
    ach.skimEnded(60);
    expect(unlock).toHaveBeenCalledTimes(1);
  });
});

describe('shrub bowling', () => {
  it('unlocks on 6 big shrubs within 10 seconds', () => {
    const { unlock, ach } = tracker();
    for (let t = 0; t < 6; t++) ach.plantFlattened('big', t);
    expect(unlock).toHaveBeenCalledTimes(1);
    expect(unlock).toHaveBeenCalledWith(PHYSICS_ACH.shrubBowling);
  });

  it('does not unlock when 6 big shrubs are spread over 20 seconds', () => {
    const { unlock, ach } = tracker();
    for (let i = 0; i < 6; i++) ach.plantFlattened('big', i * 4);
    expect(unlock).not.toHaveBeenCalled();
  });

  it('ignores small and tiny plants', () => {
    const { unlock, ach } = tracker();
    for (let t = 0; t < 10; t++) {
      ach.plantFlattened('small', t * 0.1);
      ach.plantFlattened('tiny', t * 0.1);
    }
    ach.plantFlattened('big', 0);
    ach.plantFlattened('big', 1);
    expect(unlock).not.toHaveBeenCalled();
  });

  it('does not unlock again on a second qualifying run', () => {
    const { unlock, ach } = tracker();
    for (let t = 0; t < 6; t++) ach.plantFlattened('big', t);
    for (let t = 100; t < 106; t++) ach.plantFlattened('big', t);
    expect(unlock).toHaveBeenCalledTimes(1);
  });
});
