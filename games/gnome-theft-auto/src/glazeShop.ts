// The Pay 'n' Glaze shop: a full-screen showroom UI (tabs of panels, live price, Buy / Reset / Done) that dresses the player's vehicle as they browse.
// STUB: the shop issue fills createGlazeShop; the shape is final. garages.ts creates it and calls open/close.
import type { Loadout } from '@lawn/glaze';
import type { Hud, Sfx, Vehicle, VehicleKind } from './types';

export interface GlazeShopDeps {
  /** Dress a vehicle in a loadout live (vehicles.ts setVehicleLook). */
  setLook(v: Vehicle, look: Loadout): void;
  /** Take Acorns from the wallet; false when the player cannot pay. */
  spend(amount: number, reason: string): boolean;
  acorns(): number;
  play(sfx: Sfx): void;
  /** The shop opened on `v` or closed (null). */
  showroom(v: Vehicle | null): void;
  /** The old Pay 'n' Glaze bay service, now a button in the shop: repair, clear heat, a fresh coat (garages.ts keeps the logic and the 50 acorn price). */
  quickRespray(v: Vehicle): void;
  /** A purchase went through (after the wallet was charged and the loadout saved): lets the game unlock achievements and refresh the driving model. `spent` is this order's price. */
  onPurchase(info: { kind: VehicleKind; before: Loadout; after: Loadout; spent: number }): void;
  /** Open the old handling modal (garages.ts) for this vehicle's model, from the shop's Handling tab. */
  openHandling(v: Vehicle): void;
}

export interface GlazeShop {
  /** Open on a ground vehicle (the one the player drives in the bay). Previews the owned loadout, or the vehicle's current look. */
  open(v: Vehicle): void;
  /** Close without buying: restore the owned loadout on the vehicle. */
  close(): void;
  isOpen(): boolean;
}

export function createGlazeShop(_ui: HTMLElement, _hud: Hud, _deps: GlazeShopDeps): GlazeShop {
  let opened = false;
  return {
    open() { opened = true; },
    close() { opened = false; },
    isOpen: () => opened,
  };
}
