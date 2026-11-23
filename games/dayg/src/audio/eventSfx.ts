// Bus events to short world sounds (music-ui-and-tech.md 4, phase 3). A table, so the mapping and the cooldowns are
// data: the audio controller plays what it finds here. Pure.
import type { GameEvents } from '../game/bus';

export type EventSound = 'fall' | 'crack' | 'loot' | 'eat' | 'drink' | 'build' | 'break' | 'trap' | 'harvest' | 'mow';

export interface EventRule { sound: EventSound; cooldown: number }

export const EVENT_SOUNDS: Partial<Record<keyof GameEvents, EventRule>> = {
  fell: { sound: 'fall', cooldown: 0.5 },
  cracked: { sound: 'crack', cooldown: 1 },
  'container-opened': { sound: 'loot', cooldown: 0.5 },
  'item-taken': { sound: 'loot', cooldown: 0.3 },
  ate: { sound: 'eat', cooldown: 0.5 },
  drank: { sound: 'drink', cooldown: 0.5 },
  'piece-placed': { sound: 'build', cooldown: 0.3 },
  'piece-broken': { sound: 'break', cooldown: 0.5 },
  'trap-sprung': { sound: 'trap', cooldown: 1 },
  harvested: { sound: 'harvest', cooldown: 1 },
  mowing: { sound: 'mow', cooldown: 3 },
};
