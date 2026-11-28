// E17 achievements (issue A1): watches the societies save and events and unlocks SOCIETY_ACH. Also records DJ
// Moleman's visit once the Under-Chorus quest is done. Reads what the player already does; changes nothing in the world.
import { currentInterior, interiorToWorld, refreshInterior } from '../interiors';
import { parseSavesJson } from '../quests/questSave';
import {
  LOAMDEEP, MOLE_JOB_IDS, SOCIETY_ACH, SOCIETY_EVENTS, SOCIETY_INTERIORS, SOCIETY_QUESTS,
  type SocietyDeps, type SocietyPart,
} from './config';
import { loadSocietySave, updateSocietySave } from './save';

const QUEST_SAVE_KEY = 'gta-quests-v1';

function questDone(id: string): boolean {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(QUEST_SAVE_KEY) : null;
    return parseSavesJson(raw)[id]?.state === 'done';
  } catch {
    return false;
  }
}

/** True when the world point (x, z) is inside Loamdeep's Under-Chorus Hall (local = world minus the room origin). */
function inUnderChorus(x: number, z: number): boolean {
  try {
    const [ox, oz] = interiorToWorld(SOCIETY_INTERIORS.loamdeep, 0, 0);
    const r = LOAMDEEP.halls.underChorus;
    const lx = x - ox;
    const lz = z - oz;
    return lx >= r.minX && lx <= r.maxX && lz >= r.minZ && lz <= r.maxZ;
  } catch {
    return false;
  }
}

export function installSocietyAchievements(deps: SocietyDeps): SocietyPart {
  // Catch up from the save (unlocking is idempotent).
  const start = loadSocietySave();
  if (MOLE_JOB_IDS.some((id) => start.moleJobs[id] > 0)) deps.unlock(SOCIETY_ACH.honestDirt);
  if (MOLE_JOB_IDS.every((id) => start.moleJobs[id] > 0)) deps.unlock(SOCIETY_ACH.everyHall);
  if (start.updraftRides > 0) deps.unlock(SOCIETY_ACH.verticality);

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener(SOCIETY_EVENTS.moleJobDone, ((e: Event) => {
      const job = (e as CustomEvent<{ job?: string }>).detail?.job;
      if (!job || !(MOLE_JOB_IDS as readonly string[]).includes(job)) return;
      deps.unlock(SOCIETY_ACH.honestDirt);
      const id = job as (typeof MOLE_JOB_IDS)[number];
      if (loadSocietySave().moleJobs[id] === 1) deps.increment(SOCIETY_ACH.everyHall);
    }) as EventListener);
    window.addEventListener(SOCIETY_EVENTS.updraft, (() => {
      deps.unlock(SOCIETY_ACH.verticality);
    }) as EventListener);
  }

  let acc = 0;
  return {
    update(dt: number): void {
      acc += dt;
      if (acc < 1) return;
      acc = 0;

      const save = loadSocietySave();
      if (!save.molemanVisits && questDone(SOCIETY_QUESTS.underChorus)) {
        updateSocietySave((s) => { s.molemanVisits = true; });
        if (currentInterior() === SOCIETY_INTERIORS.loamdeep) refreshInterior();
      }

      if (save.molemanVisits && currentInterior() === SOCIETY_INTERIORS.loamdeep
        && inUnderChorus(deps.player.x, deps.player.z)) {
        deps.unlock(SOCIETY_ACH.seat);
      }
    },
  };
}
