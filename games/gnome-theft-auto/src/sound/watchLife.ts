// Watches living things each frame: the player's and nearby gnomes' footsteps by surface, splashes, critter calls,
// world event stingers. (Stub: filled in by Epic 2.)
import type { Critter } from '../critters';
import type { Npc, World } from '../types';

export interface LifeSoundFrame {
  dt: number;
  /** Seconds since start. */
  time: number;
  player: { x: number; y: number; z: number; onFoot: boolean; grounded: boolean; airborne: boolean };
  world: World;
  critters: readonly Critter[];
  npcs: readonly Npc[];
  /** 0 day .. 1 night. */
  night: number;
  /** worldEvents.activeEvent()?.kind ?? null. */
  eventKind: string | null;
}

export interface LifeSounds {
  update(f: LifeSoundFrame): void;
}

export function createLifeSounds(): LifeSounds {
  return { update() {} };
}
