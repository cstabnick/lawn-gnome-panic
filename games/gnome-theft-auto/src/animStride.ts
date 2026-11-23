// Animation level of detail: a far character's pose is stepped every few frames instead of every frame, with the time it
// missed added up, so it moves at the same pace, only in coarser steps that nobody can see at that distance.
//
//   const clock = newAnimClock(id);                 // one per character, kept with it
//   const step = stepAnimClock(clock, dt, animStride(distToCamera));
//   if (step > 0) model.update(state, step);         // 0 = not this frame
//
// Pure (tested in animStride.test.ts); used by traffic.ts (NPC riders) and npcs.ts (pedestrians).

/** Distances (m, from the player or camera) where the stride grows. */
export const ANIM_LOD = {
  /** Closer than this: every frame. */
  near: 40,
  /** Closer than this: every 2nd frame. */
  mid: 80,
  /** Closer than this: every 4th frame; beyond it, not at all (the culler hides gnomes from about 100 m on phones). */
  far: 160,
};

/** The most time one step makes up for (s): a character coming back into range does not leap through a long pose. */
export const ANIM_MAX_STEP = 0.25;

/** Frames between pose steps at distance d: 1, 2 or 4, or 0 for none. */
export function animStride(d: number): 0 | 1 | 2 | 4 {
  if (d < ANIM_LOD.near) return 1;
  if (d < ANIM_LOD.mid) return 2;
  if (d < ANIM_LOD.far) return 4;
  return 0;
}

export interface AnimClock {
  /** Time not stepped yet (s). */
  acc: number;
  /** Frames counted. */
  tick: number;
  /** Spreads characters over frames so they do not all step on the same one. */
  phase: number;
}

export function newAnimClock(seed = 0): AnimClock {
  return { acc: 0, tick: 0, phase: Math.abs(Math.floor(seed)) % 4 };
}

/**
 * Adds this frame's dt and returns the dt to step the pose with now: the time gathered since the last step (at most
 * ANIM_MAX_STEP) on a frame this character steps, else 0. Stride 0 steps nothing and forgets the gathered time.
 */
export function stepAnimClock(c: AnimClock, dt: number, stride: number): number {
  c.tick++;
  if (stride <= 0) {
    c.acc = 0;
    return 0;
  }
  c.acc += dt;
  if (stride > 1 && (c.tick + c.phase) % stride !== 0) return 0;
  const step = Math.min(c.acc, ANIM_MAX_STEP);
  c.acc = 0;
  return step;
}
