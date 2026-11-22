// Vehicle seats. Seat 0 is the driver (spec.seat). Seat k (k >= 1) is spec.passengerSeats[k - 1]: online riders only.
// The driver's client is the one that hands seats out (its SeatBook), because the driver owns the mower it is driving.
import type { VehicleSpec } from './types';

export type SeatPos = [number, number, number];

/** Where seat `seat` sits, in the vehicle root's local space. An unknown index falls back to the driver's seat. */
export function seatPos(spec: VehicleSpec, seat: number): SeatPos {
  if (seat <= 0) return spec.seat;
  return spec.passengerSeats?.[seat - 1] ?? spec.seat;
}

/** How many passenger seats (not counting the driver's) a vehicle has. */
export function passengerCount(spec: VehicleSpec): number {
  return spec.passengerSeats?.length ?? 0;
}

/**
 * The driver's list of who rides, for the vehicle they are driving. Seats go out first come first served; a rider who
 * already has one keeps it. -1 means the vehicle is full.
 */
export class SeatBook {
  private capacity = 0;
  private seats = new Map<number, number>();

  /** Start a new list for a vehicle with `capacity` passenger seats. Everyone on the old list is dropped. */
  reset(capacity: number): void {
    this.capacity = capacity;
    this.seats.clear();
  }

  take(id: number): number {
    const have = this.seats.get(id);
    if (have !== undefined) return have;
    const taken = new Set(this.seats.values());
    for (let s = 1; s <= this.capacity; s++) {
      if (!taken.has(s)) {
        this.seats.set(id, s);
        return s;
      }
    }
    return -1;
  }

  free(id: number): void {
    this.seats.delete(id);
  }

  /** Who is on the list, by player id. */
  riders(): number[] {
    return [...this.seats.keys()];
  }
}
