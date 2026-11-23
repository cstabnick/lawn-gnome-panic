// Vehicle seats. Seat 0 is the driver (spec.seat). Seat k (k >= 1) is spec.passengerSeats[k - 1]: online riders only.
// The driver's client is the one that hands seats out (its SeatBook), because the driver owns the mower it is driving.
import { MOUNT, MOUNT_STYLES } from './config';
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

/** Closed vehicle: has doors and openTop === false. */
export function isClosed(spec: VehicleSpec): boolean {
  return spec.openTop === false && (spec.doors?.length ?? 0) > 0;
}

/** The side a seat gets out on: 1 = the vehicle's left (+x), -1 = its right. A seat on the centre line (|x| <= 0.05) uses the left. */
export function exitSide(spec: VehicleSpec, seat: number): 1 | -1 {
  const x = seatPos(spec, seat)[0];
  return x < -0.05 ? -1 : 1;
}

/** Closed vehicles: index in spec.doors of the first door on exitSide's side ('left' = 1), else 0. Open-top: null. */
export function exitDoor(spec: VehicleSpec, seat: number): number | null {
  if (!isClosed(spec)) return null;
  const want = exitSide(spec, seat) === 1 ? 'left' : 'right';
  const i = (spec.doors ?? []).findIndex((d) => d.side === want);
  return i >= 0 ? i : 0;
}

/** Where a gnome stands after getting out of `seat`, vehicle-local x/z.
 *  Closed: the door's ground spot: x = side * (|door.at[0]| + MOUNT.standOff), z = door.at[2] (side from door.side).
 *  Open-top: x = exitSide * (spec.radius + 0.8), z = seatPos(spec, seat)[2]. */
export function exitLocal(spec: VehicleSpec, seat: number): { x: number; z: number } {
  const di = exitDoor(spec, seat);
  if (di !== null) {
    const door = (spec.doors ?? [])[di];
    const side = door.side === 'left' ? 1 : -1;
    return { x: side * (Math.abs(door.at[0]) + MOUNT.standOff), z: door.at[2] };
  }
  // Open-top: beside the seat, on its side. A seat whose spot would land on an earlier seat's (the Ride-On's side
  // passenger next to the driver, the combine's crew) steps back a pace until it is clear, so riders never stack.
  const x = exitSide(spec, seat) * (spec.radius + 0.8);
  let z = seatPos(spec, seat)[2];
  const taken: { x: number; z: number }[] = [];
  for (let s = 0; s < Math.max(0, seat); s++) taken.push(exitLocal(spec, s));
  while (taken.some((t) => Math.hypot(t.x - x, t.z - z) < EXIT_CLEAR)) z -= EXIT_CLEAR + 0.1;
  return { x, z };
}

/** Exit spots of one vehicle are at least this far apart. */
const EXIT_CLEAR = 0.6;

/** The climb time: MOUNT_STYLES[style].seconds + max(0, spec.seat[1]) * MOUNT.climbPerHeight, style = spec.mountStyle ?? (isClosed ? 'door' : 'vault'). */
export function climbSecondsOf(spec: VehicleSpec): number {
  const style = spec.mountStyle ?? (isClosed(spec) ? 'door' : 'vault');
  return MOUNT_STYLES[style].seconds + Math.max(0, spec.seat[1]) * MOUNT.climbPerHeight;
}

/** How long a whole exit sequence takes: closed: doorSeconds + climb + doorSeconds; open-top: climb + MOUNT.settleSeconds. */
export function exitSeconds(spec: VehicleSpec): number {
  const climb = climbSecondsOf(spec);
  return isClosed(spec) ? MOUNT.doorSeconds + climb + MOUNT.doorSeconds : climb + MOUNT.settleSeconds;
}
