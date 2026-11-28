// Physics achievements (E27): a skim across deep water, and a burst of big shrubs flattened in a short window.
// Pure: the game calls skimEnded / plantFlattened from its own events and passes an unlock callback (the achievement
// tracker's unlock). Each unlock fires at most once per tracker.

export const PHYSICS_ACH = {
  skippingStone: 'gta-skipping-stone',
  skimMetres: 35,
  shrubBowling: 'gta-shrub-bowling',
  shrubs: 6,
  shrubWindowS: 10,
} as const;

export interface PhysicsAchievements {
  /** The player's vehicle finished a skim of `dist` horizontal metres. */
  skimEnded(dist: number): void;
  /** The player's vehicle flattened a plant of flora size class `size` at game time `t` (seconds). */
  plantFlattened(size: 'tiny' | 'small' | 'big', t: number): void;
}

export function createPhysicsAchievements(deps: { unlock(id: string): void }): PhysicsAchievements {
  let skipped = false;
  let bowled = false;
  // Times of the most recent big shrubs, oldest first, at most PHYSICS_ACH.shrubs long.
  const bigTimes: number[] = [];

  return {
    skimEnded(dist: number) {
      if (skipped || dist < PHYSICS_ACH.skimMetres) return;
      skipped = true;
      deps.unlock(PHYSICS_ACH.skippingStone);
    },
    plantFlattened(size, t) {
      if (size !== 'big' || bowled) return;
      bigTimes.push(t);
      if (bigTimes.length > PHYSICS_ACH.shrubs) bigTimes.shift();
      if (bigTimes.length < PHYSICS_ACH.shrubs) return;
      const span = bigTimes[bigTimes.length - 1] - bigTimes[0];
      if (span <= PHYSICS_ACH.shrubWindowS) {
        bowled = true;
        deps.unlock(PHYSICS_ACH.shrubBowling);
      }
    },
  };
}
