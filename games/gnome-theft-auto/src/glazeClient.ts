// E24 mechanic job: client work orders in the Pay 'n' Glaze shop. The mechanic runtime (workplaces/mechanic/) registers
// the client cars it spawns here; the shop (glazeShop.ts) asks clientOrderFor(v) when it opens and, for a client car,
// opens in client mode (the client's look is the start, no Buy: "Hand back the keys" scores it against the brief).
// app.ts takeWheel skips the player's per-model loadout for client cars (isClientVehicle).
import type { Loadout } from '@lawn/glaze';
import type { Vehicle } from './types';

export interface ClientOrder {
  /** "Bramble Fennick's Ride-On". */
  title: string;
  /** The brief in the client's words: "Make it pink and loud." */
  brief: string;
  /** Acorns the client will pay for parts at most (shown beside the running parts price). */
  budget: number;
  /** The client's look when they dropped it off (the shop starts from it and prices changes against it). */
  start: Loadout;
  /** "Hand back the keys": the final look and the parts price (loadoutCost(start, look)). The shop then closes. */
  finish(look: Loadout, partsCost: number): void;
  /** The shop was closed without handing back (the job stays open). */
  cancel?(): void;
}

const orders = new Map<Vehicle, ClientOrder>();

/** Mark `v` as a client car with this order (replaces any earlier one). */
export function setClientOrder(v: Vehicle, order: ClientOrder): void { orders.set(v, order); }
/** Forget `v` (handed back, or the job was dropped). */
export function clearClientOrder(v: Vehicle): void { orders.delete(v); }
export function clientOrderFor(v: Vehicle): ClientOrder | null { return orders.get(v) ?? null; }
export function isClientVehicle(v: Vehicle): boolean { return orders.has(v); }
