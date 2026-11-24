// Vehicles a player brings into the world for everyone (online/parkSync.ts): a Sling-Lift delivery, a Lock-Up take-out,
// a trainer spawn. No imports, so any module can mark one without pulling in the net code.
import type { Vehicle } from '../types';

const shared = new WeakSet<Vehicle>();

/** Mark v as brought in by this player: online, the parked-vehicle ledger publishes it on its next scan. */
export function shareVehicle(v: Vehicle): void {
  shared.add(v);
}

/** parkSync: take the mark off (true when it was there). */
export function takeShared(v: Vehicle): boolean {
  return shared.delete(v);
}
