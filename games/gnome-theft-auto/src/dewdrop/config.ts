// The Dewdrop (E18, L54): a clear hamster ball the gnome rolls around in, built by Hogweed Sprocket under the Unfinished
// Span. Unlocked by Hogweed's three-quest series (quests/dewdropQuests.ts), sold only at his workshop afterwards.
// Design: docs/design/gnome-theft-auto/side-quest-schedule.md section 3. Pure constants, no three.js.
import { UNDERSPAN } from '../societies/config';
import type { QuestSave } from '../quests/types';

/** The vehicle kind (types.ts VehicleKind). */
export const DEWDROP_KIND = 'bubble-mobile' as const;
/** Its prefab (packages/prefabs, gta-odd-rides.ts). */
export const DEWDROP_PREFAB = 'gta-dewdrop';
/** Shown name. */
export const DEWDROP_NAME = 'The Dewdrop';

/** The three quests, in order (each needs the one before as `prereq`). */
export const DEWDROP_QUESTS_IDS = {
  prototype: 'sq-dewdrop-1',
  rollsOut: 'sq-dewdrop-2',
  dewdrop: 'sq-dewdrop-3',
} as const;

/** Achievements (packages/achievements catalog). */
export const DEWDROP_ACH = {
  /** Finish sq-dewdrop-3. Reward: the 'gta-bubble-visor' head item. */
  rollWithIt: 'gta-roll-with-it',
  /** Spend 60 s in a row inside the Dewdrop. No reward. */
  hamsterHour: 'gta-hamster-hour',
} as const;

/** Seconds in a row inside the ball for Hamster Hour. */
export const HAMSTER_HOUR_SECONDS = 60;

/** Where the player's Dewdrop is parked when sq-dewdrop-3 ends, and where a replacement is bought: by the workshop door. */
export const DEWDROP_BAY = { x: UNDERSPAN.workshopDoor.x - 6, z: UNDERSPAN.workshopDoor.z + 6, yaw: Math.PI } as const;
/** A replacement Dewdrop at Hogweed's workshop (the only place to buy one), Acorns. */
export const DEWDROP_PRICE = 400;

/** The quest save key (quests/quests.ts SAVE_KEY), read here so this module does not import the engine. */
const QUEST_SAVE_KEY = 'gta-quests-v1';

/** Has this save finished the Dewdrop series (the ball is the player's)? Reads the quest save when `saves` is omitted. */
export function bubbleUnlocked(saves?: Record<string, QuestSave>): boolean {
  let s = saves;
  if (!s) {
    try {
      s = JSON.parse(localStorage.getItem(QUEST_SAVE_KEY) ?? '{}') as Record<string, QuestSave>;
    } catch {
      return false;
    }
  }
  return s?.[DEWDROP_QUESTS_IDS.dewdrop]?.state === 'done';
}
