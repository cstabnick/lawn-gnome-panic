// Rootwell achievements (E13 issue A19): Dean's Leap, the campus tour (saved), the telescope at night, landing on Rootwell
// Field, flying through Pinwheel Ridge. Everything is read from what the player already does; nothing here changes the world.
import type { JobsDeps } from '../jobs/types';
import { onStuntLanded } from '../stunts';
import { aboveGround } from '../terrain';
import { notifySaveChanged } from '../saveHook';
import { CAMPUS, CAMPUS_BUILDINGS, OBSERVATORY, PINWHEEL_SIZE, ROOTWELL_ACH, ROOTWELL_FIELD, ROOTWELL_SAVE_KEY, TELESCOPE_EVENT, WIND_FARM } from './types';
import type { RootwellPart } from './types';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'> | null;

const TOUR = CAMPUS_BUILDINGS.filter((b) => b.tour);
const DOOR_RANGE2 = 4 * 4;
const TOUR_EVERY = 0.25;
const NEAR_RANGE = 1500;
const LAND_HEIGHT = 0.5;
const AIR_HEIGHT = 3;
const TOUCH_WINDOW = 30;
const BAND_LOST = 4;
const BAND_COUNT = 4;

/** True when (x, z) is on Rootwell Field's runway (yaw 0: long along z). */
export function onRootwellRunway(x: number, z: number): boolean {
  const r = ROOTWELL_FIELD.runway;
  return Math.abs(x - r.x) <= r.width / 2 && Math.abs(z - r.z) <= r.length / 2;
}

/** The index of the pinwheel an aircraft is flying through at `above` metres (4..33), or -1. */
export function windfallBand(x: number, z: number, above: number): number {
  if (above < 4 || above > PINWHEEL_SIZE.hub + PINWHEEL_SIZE.rotorR) return -1;
  const ps = WIND_FARM.pinwheels;
  for (let i = 0; i < ps.length; i++) {
    if (Math.abs(x - ps[i].x) <= 15 && Math.abs(z - ps[i].z) <= 22) return i;
  }
  return -1;
}

function resolveStorage(): StorageLike {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** The campus doors visited so far. Missing, broken or unreadable storage is an empty tour. */
export function loadTour(storage: StorageLike): Set<string> {
  try {
    const raw = storage?.getItem(ROOTWELL_SAVE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { doors?: unknown }).doors)) {
        const doors = (parsed as { doors: unknown[] }).doors;
        return new Set(doors.filter((d): d is string => typeof d === 'string'));
      }
    }
  } catch {
    // broken save: start the tour again
  }
  return new Set();
}

/** Write the doors visited; never throws. */
export function saveTour(storage: StorageLike, doors: Set<string>): void {
  try {
    storage?.setItem(ROOTWELL_SAVE_KEY, JSON.stringify({ v: 1, doors: [...doors] }));
    notifySaveChanged();
  } catch {
    // storage full or blocked: the tour still counts for this session
  }
}

/** Rootwell places as rectangles; the update loop idles when the player is far from all of them. */
const PLACE_RECTS = [
  CAMPUS.site,
  OBSERVATORY.site,
  {
    minX: ROOTWELL_FIELD.runway.x - ROOTWELL_FIELD.runway.width / 2,
    maxX: ROOTWELL_FIELD.runway.x + ROOTWELL_FIELD.runway.width / 2,
    minZ: ROOTWELL_FIELD.runway.z - ROOTWELL_FIELD.runway.length / 2,
    maxZ: ROOTWELL_FIELD.runway.z + ROOTWELL_FIELD.runway.length / 2,
  },
  WIND_FARM.site,
];

function nearRootwell(x: number, z: number): boolean {
  for (const r of PLACE_RECTS) {
    const dx = Math.max(r.minX - x, 0, x - r.maxX);
    const dz = Math.max(r.minZ - z, 0, z - r.maxZ);
    if (dx * dx + dz * dz <= NEAR_RANGE * NEAR_RANGE) return true;
  }
  return false;
}

/** Tracks Dean's Leap, the campus tour, the telescope at night, landing on Rootwell Field, flying through Pinwheel Ridge. */
export function installRootwellAchievements(deps: JobsDeps): RootwellPart {
  const storage = resolveStorage();
  const visited = loadTour(storage);

  onStuntLanded((rampId) => {
    if (rampId === OBSERVATORY.rampId) deps.unlock(ROOTWELL_ACH.deansLeap);
  });

  if (typeof window !== 'undefined') {
    window.addEventListener(TELESCOPE_EVENT, (e: Event) => {
      const detail = (e as CustomEvent<{ night?: boolean }>).detail;
      if (detail?.night) deps.unlock(ROOTWELL_ACH.stargazer);
    });
  }

  let tourTimer = 0;
  let lastAirborne = -Infinity;
  const pinwheelsRun = new Set<number>();
  let lostFor = 0;

  return {
    update(dt, t) {
      const p = deps.player;
      const v = p.vehicle;
      // Vehicle position when driving, otherwise the player's.
      const x = v ? v.x : p.x;
      const z = v ? v.z : p.z;
      if (!nearRootwell(x, z)) {
        pinwheelsRun.clear();
        lostFor = 0;
        return;
      }

      tourTimer += dt;
      if (tourTimer >= TOUR_EVERY) {
        tourTimer = 0;
        for (const b of TOUR) {
          if (visited.has(b.id)) continue;
          const dx = x - b.door.x;
          const dz = z - b.door.z;
          if (dx * dx + dz * dz > DOOR_RANGE2) continue;
          visited.add(b.id);
          saveTour(storage, visited);
          deps.increment(ROOTWELL_ACH.honours);
          const n = TOUR.filter((d) => visited.has(d.id)).length;
          deps.hud.toast(`First Class Honours: ${n}/${TOUR.length} — ${b.name}`);
        }
      }

      if (!v || !v.spec.flies) {
        pinwheelsRun.clear();
        lostFor = 0;
        return;
      }

      const above = aboveGround(v.x, v.y, v.z);
      if (above > AIR_HEIGHT) lastAirborne = t;
      if (onRootwellRunway(v.x, v.z) && above < LAND_HEIGHT && Math.abs(v.speed) < 20 && t - lastAirborne <= TOUCH_WINDOW) {
        deps.unlock(ROOTWELL_ACH.touchAndGo);
      }

      const band = windfallBand(v.x, v.z, above);
      if (band >= 0) {
        lostFor = 0;
        pinwheelsRun.add(band);
        if (pinwheelsRun.size >= BAND_COUNT) deps.unlock(ROOTWELL_ACH.windfall);
      } else {
        lostFor += dt;
        if (lostFor > BAND_LOST) pinwheelsRun.clear();
      }
    },
  };
}
