// Countryside achievements (E16 issue G5): the Even-Estates gates, the hunter camps, deer seen up close, the manor door
// and the farm's harvests. Progress is saved under COUNTRY_SAVE_KEY. Everything is read from what the player already
// does; nothing here changes the world.
import type { JobsDeps } from '../jobs/types';
import { deerWithin } from '../critters/countryside';
import { onHarvest } from '../farm/events';
import { notifySaveChanged } from '../saveHook';
import { CAMPS } from './camps';
import { COUNTRY_ACH, COUNTRY_SAVE_KEY, EVEN_ESTATES, MANOR } from './types';
import type { CountryPart } from './types';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'> | null;

/** The saved visits. `deer` is the count toward Deer Me, not ids (ids are per session). */
export interface CountrySave {
  sites: string[];
  camps: string[];
  deer: number;
  mansion: boolean;
}

const CHECK_EVERY = 0.5;
const SETTLE_S = 2;
const CAMP_RANGE = 8;
const CAMP_GOAL = 10;
const DEER_RANGE = 25;
const DEER_GOAL = 12;
const DOOR_RANGE = 1.5;

function resolveStorage(): StorageLike {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function emptySave(): CountrySave {
  return { sites: [], camps: [], deer: 0, mansion: false };
}

/** The saved visits. Missing, broken or unreadable storage is a fresh start. */
export function loadCountrySave(storage: StorageLike): CountrySave {
  try {
    const raw = storage?.getItem(COUNTRY_SAVE_KEY);
    if (!raw) return emptySave();
    const p = JSON.parse(raw) as Partial<CountrySave> | null;
    if (!p || typeof p !== 'object') return emptySave();
    const strings = (a: unknown): string[] => (Array.isArray(a) ? a.filter((s): s is string => typeof s === 'string') : []);
    return {
      sites: strings(p.sites),
      camps: strings(p.camps),
      deer: typeof p.deer === 'number' && p.deer >= 0 ? Math.min(DEER_GOAL, Math.floor(p.deer)) : 0,
      mansion: p.mansion === true,
    };
  } catch {
    // broken save: start the visits again
    return emptySave();
  }
}

/** Write the visits; never throws. */
export function saveCountrySave(storage: StorageLike, s: CountrySave): void {
  try {
    storage?.setItem(COUNTRY_SAVE_KEY, JSON.stringify({ v: 1, ...s }));
    notifySaveChanged();
  } catch {
    // storage full or blocked: the visits still count for this session
  }
}

/** Tracks the Even-Estates gates, hunter camps, deer, the manor door and the farm's harvests. */
export function installCountryAchievements(deps: JobsDeps): CountryPart {
  const storage = resolveStorage();
  const saved = loadCountrySave(storage);
  const sites = new Set(saved.sites);
  const camps = new Set(saved.camps);
  let deer = saved.deer;
  let mansion = saved.mansion;
  const seenDeer = new Set<number>();

  const save = (): void => saveCountrySave(storage, { sites: [...sites], camps: [...camps], deer, mansion });

  onHarvest((e) => deps.unlock(e.crop === 'oak' ? COUNTRY_ACH.oakPatience : COUNTRY_ACH.firstSprout));

  let timer = 0;

  return {
    update(dt, t) {
      // Nothing for the first moments after install (the spawn settles).
      if (t < SETTLE_S) return;
      timer += dt;
      if (timer < CHECK_EVERY) return;
      timer = 0;

      const p = deps.player;
      const v = p.vehicle;
      // Vehicle position when driving, otherwise the player's.
      const x = v ? v.x : p.x;
      const z = v ? v.z : p.z;

      for (const est of EVEN_ESTATES) {
        const h = est.hoarding;
        if (x < h.minX || x > h.maxX || z < h.minZ || z > h.maxZ) continue;
        if (sites.has(est.id)) continue;
        sites.add(est.id);
        save();
        deps.increment(COUNTRY_ACH.levelBest);
      }

      for (const c of CAMPS) {
        if (camps.has(c.id) || Math.hypot(x - c.x, z - c.z) > CAMP_RANGE) continue;
        camps.add(c.id);
        save();
        deps.increment(COUNTRY_ACH.campCrasher);
        deps.hud.toast(`Camp found: ${c.name} (${camps.size}/${CAMP_GOAL})`);
      }

      for (const id of deerWithin(x, z, DEER_RANGE)) {
        if (seenDeer.has(id)) continue;
        seenDeer.add(id);
        if (deer >= DEER_GOAL) continue;
        deer += 1;
        save();
        deps.increment(COUNTRY_ACH.deerMe);
      }

      if (!mansion) {
        const d = MANOR.door;
        if (Math.hypot(x - d.x, z - d.z) <= DOOR_RANGE) {
          mansion = true;
          save();
          deps.unlock(COUNTRY_ACH.mansion);
        }
      }
    },
  };
}
