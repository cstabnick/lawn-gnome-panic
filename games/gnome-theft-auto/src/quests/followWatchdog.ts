// Stall watchdog for the chase-follow leader. Pure (no THREE): progress means the distance to the aim point shrinking,
// not raw speed, so a leader that is legitimately slow (corner, waiting for the player to catch up) is never "stuck".

export type FollowAction = 'none' | 'nudge' | 'snap-road' | 'skip-waypoint';

export interface FollowSample {
  leaderX: number;
  leaderZ: number;
  aimX: number;
  aimZ: number;
  playerDist: number;
  maxDist: number;
  /** The leader is deliberately waiting for the player: the stall clock does not run. */
  waiting: boolean;
}

export interface FollowWatchdogOpts {
  nudgeAt?: number;
  snapAt?: number;
  skipAt?: number;
  /** Metres the aim distance must shrink by to count as progress. */
  progress?: number;
}

export interface FollowWatchdog {
  step(dt: number, s: FollowSample): FollowAction;
  /** Seconds without progress right now. */
  stalledFor(): number;
  /** Longest stall seen so far. */
  maxStall(): number;
}

export function createFollowWatchdog(opts: FollowWatchdogOpts = {}): FollowWatchdog {
  const nudgeAt = opts.nudgeAt ?? 4;
  const snapAt = opts.snapAt ?? 8;
  const skipAt = opts.skipAt ?? 15;
  const progress = opts.progress ?? 0.5;
  let best = Infinity;
  let aimX = NaN;
  let aimZ = NaN;
  let stall = 0;
  let maxStall = 0;
  let level = 0; // 0 none fired, 1 nudge, 2 snap

  const reset = (): void => {
    stall = 0;
    level = 0;
  };

  return {
    step(dt, s) {
      if (!(Math.hypot(s.aimX - aimX, s.aimZ - aimZ) <= 1)) {
        // A new aim point (waypoint reached or skipped): start over.
        aimX = s.aimX;
        aimZ = s.aimZ;
        best = Infinity;
        reset();
      }
      const d = Math.hypot(s.leaderX - s.aimX, s.leaderZ - s.aimZ);
      if (d < best - progress) {
        best = d;
        reset();
        return 'none';
      }
      if (s.waiting) {
        reset();
        return 'none';
      }
      stall += dt;
      if (stall > maxStall) maxStall = stall;
      if (stall >= skipAt) {
        reset();
        best = Infinity;
        return 'skip-waypoint';
      }
      if (stall >= snapAt && level < 2) {
        level = 2;
        return 'snap-road';
      }
      if (stall >= nudgeAt && level < 1) {
        level = 1;
        return 'nudge';
      }
      return 'none';
    },
    stalledFor: () => stall,
    maxStall: () => maxStall,
  };
}

/** Debug registry: the latest follow run's stats, for the quest sim (which has no handle on the Run). */
let latestStats: (() => { maxStall: number; waited: number }) | null = null;
export function setFollowStats(f: (() => { maxStall: number; waited: number }) | null): void {
  latestStats = f;
}
export function followStats(): { maxStall: number; waited: number } | null {
  return latestStats ? latestStats() : null;
}
