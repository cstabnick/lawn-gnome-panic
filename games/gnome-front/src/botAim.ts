// src/botAim.ts: how a bot picks targets, aims and pulls the trigger. STUB: filled in by epic 2.
import type { Game, Soldier } from './config';

export interface BotCombatInfo {
  /** The enemy being engaged (seen this think), or null. */
  target: Soldier | null;
  /** Horizontal distance to target; Infinity when none. */
  targetDist: number;
  /** World xz the latest danger came from (damage taken or enemy shots nearby), kept for 4 s; null if none. */
  threat: { x: number; z: number } | null;
  /** Took damage in the last 2 s. */
  underFire: boolean;
}

/**
 * For one alive bot (on foot or driving): chooses a target, turns s.yaw / s.pitch towards it while it has one,
 * sets s.ads, and fires, reloads and throws grenades. Leaves s.yaw alone when there is no target.
 * Call once per bot per frame, before moving it.
 */
export function botCombat(game: Game, s: Soldier, dt: number): BotCombatInfo {
  void game; void s; void dt;
  return { target: null, targetDist: Infinity, threat: null, underFire: false };
}

/** Forgets a bot's aim memory. Call when the bot respawns. */
export function resetBotCombat(s: Soldier): void {
  void s;
}
