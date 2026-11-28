// E03 L09: when a quest starts in play, make sure the player has a ride close by. Pure: app.ts passes the world in.
import type { Vehicle } from '../types';
import type { Lockup } from '../lockup/runtime';
import type { QuestDef } from './types';

export interface RideDeps {
  player: { x: number; z: number; vehicle: Vehicle | null };
  vehicles: readonly Vehicle[];
  lockup: Pick<Lockup, 'callDelivery' | 'instanceOf' | 'list'>;
  /** Park a loaner (stock ride-on) at a free spot near (x, z); returns it or null. */
  spawnLoaner: (x: number, z: number) => Vehicle | null;
  toast: (text: string) => void;
}

/** A usable vehicle this close (m) counts as a ride already. */
export const RIDE_NEAR = 60;

/** Objective kinds that bring their own vehicle, or are done on foot / by other means: no ride needed. */
const NO_RIDE_KINDS: ReadonlySet<string> = new Set([
  'crack', 'choice', 'steal-deliver', 'air-drop', 'boss-combine', 'race', 'checkpoints',
  'tessie-sightings', 'tessie-buoys', 'tessie-escort', 'tessie-ride',
]);

/** False when the first objective supplies or forbids a vehicle (spawnAt, race, boat, on-foot kinds). */
export function questNeedsRide(q: QuestDef): boolean {
  const o = q.objectives[0];
  if (!o) return false;
  return !NO_RIDE_KINDS.has(o.kind);
}

function isGround(v: Vehicle): boolean {
  return v.spec.boat !== true && !v.spec.flies && !v.spec.air;
}

export function ensureRideNear(
  x: number,
  z: number,
  q: QuestDef,
  deps: RideDeps,
): 'none-needed' | 'near' | 'delivered' | 'loaner' | 'failed' {
  if (deps.player.vehicle || !questNeedsRide(q)) return 'none-needed';
  for (const v of deps.vehicles) {
    if (v.driver !== 'none' || v.questOwned || v.exploded || !isGround(v)) continue;
    if (Math.hypot(v.x - x, v.z - z) <= RIDE_NEAR) return 'near';
  }
  const stored = [...deps.lockup.list('ground')].sort((a, b) => b.storedAt - a.storedAt);
  for (const rec of stored) {
    const inst = deps.lockup.instanceOf(rec.uid);
    if (inst && Math.hypot(inst.x - x, inst.z - z) <= RIDE_NEAR) return 'near';
    if (deps.lockup.callDelivery(rec.uid, true) === null) {
      deps.toast(`Your ${rec.name} is on its way.`);
      return 'delivered';
    }
    break; // a failed call (flight busy, no spot) will fail for the others too: fall back to a loaner
  }
  if (deps.spawnLoaner(x, z)) {
    deps.toast('A loaner ride-on is parked nearby.');
    return 'loaner';
  }
  return 'failed';
}
