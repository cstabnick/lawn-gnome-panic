// Pay 'n' Glaze seat covers lift the rider: a hay bale or a throne cushion is higher than the stock seat. Covers sit on the driver's seat.
import { seatPos } from './seats';
import type { Vehicle } from './types';

/** Height of a seated gnome's seat of the pants above its feet origin (the lowest point of the sitting legs), measured from @lawn/gnome's sitting pose. */
export const RIDER_SEAT_HEIGHT = 0.22;

/** Horizontal distance (vehicle-root units) beyond which a cover is not under the seat it belongs to. */
const COVER_REACH = 0.5;

/** How far (vehicle-root units, >= 0) a rider in `seat` sits higher because of the fitted seat cover. 0 without one. */
export function coverLift(v: Vehicle, seat: number): number {
  const cover = v.rig?.seatCover;
  if (!cover || seat !== 0) return 0;
  const [, sy, sz] = seatPos(v.spec, 0);
  if (Math.abs(cover[2] - sz) > COVER_REACH) return 0;
  return Math.max(0, cover[1] - (sy + RIDER_SEAT_HEIGHT));
}
