// Character homes on the map (E10): a home shows as a map place once the player has stood at its front door. The
// player's own flat shows once it is owned. Visits are remembered in the save and count toward House Call.
import type { Blip } from '../types';
import { HOMES } from './data';
import { FLAT_ID } from '../home/types';
import { ownsProperty } from '../ownership';
import { PLACE_STYLE } from '../mapIcons';
import { notifySaveChanged } from '../saveHook';

export const VISITS_KEY = 'gta-homes-visited-v1';

/** Within this many metres of a front door counts as standing at it. */
const DOOR_RADIUS = 4;
/** Check the doors every this many update() calls (about half a second at 60 fps). */
const CHECK_EVERY = 30;
const HOUSE_CALL = 'gta-house-call';

export interface HomeVisitsDeps {
  increment(id: string, by: number): void;
  toast(text: string): void;
  storage?: { getItem(k: string): string | null; setItem(k: string, v: string): void };
}

export interface HomeVisits {
  /** Every frame with the player's position (on foot or driving). */
  update(px: number, pz: number): void;
  /** Map blips: visited acknowledged homes (kind 'home'), plus the player's flat when owned. */
  blips(): Blip[];
  visited(): readonly string[];
}

function defaultStorage(): HomeVisitsDeps['storage'] {
  try {
    return globalThis.localStorage ?? undefined;
  } catch {
    return undefined;
  }
}

function readVisits(storage: HomeVisitsDeps['storage']): string[] {
  try {
    const raw = storage?.getItem(VISITS_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/** 'mayor-mulch' -> 'Mayor Mulch'. */
function displayName(characterId: string): string {
  return characterId.split('-').map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
}

function capitalise(text: string): string {
  return text ? text[0].toUpperCase() + text.slice(1) : text;
}

export function createHomeVisits(deps: HomeVisitsDeps): HomeVisits {
  const storage = deps.storage ?? defaultStorage();
  const seen = new Set<string>(readVisits(storage));
  let calls = 0;

  function save(): void {
    try {
      storage?.setItem(VISITS_KEY, JSON.stringify([...seen]));
    } catch {
      // a full or blocked storage loses the visit only after this session
    }
    notifySaveChanged();
  }

  return {
    update(px, pz) {
      if (calls++ % CHECK_EVERY !== 0) return;
      for (const row of HOMES) {
        if (!row.acknowledged || !row.door || row.characterId === 'player') continue;
        if (seen.has(row.characterId)) continue;
        if (Math.hypot(px - row.door[0], pz - row.door[1]) > DOOR_RADIUS) continue;
        seen.add(row.characterId);
        save();
        deps.increment(HOUSE_CALL, 1);
        deps.toast(`${displayName(row.characterId)}'s home: ${row.name}`);
      }
    },

    blips() {
      const out: Blip[] = [];
      for (const row of HOMES) {
        if (!seen.has(row.characterId) || !row.door || !row.acknowledged) continue;
        out.push({ x: row.door[0], z: row.door[1], color: PLACE_STYLE.home.color, kind: 'home', label: capitalise(row.name) });
      }
      const flat = HOMES.find((h) => h.characterId === 'player');
      if (ownsProperty(FLAT_ID) && flat?.door) {
        out.push({ x: flat.door[0], z: flat.door[1], color: PLACE_STYLE.home.color, kind: 'home', label: 'Your flat (Saucer Court)' });
      }
      return out;
    },

    visited() {
      return [...seen];
    },
  };
}
