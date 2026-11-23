// The Ammu-Gnation shop sheet: pick a weapon, browse its mod slots, see the stats change, test-fire, then Buy & Fit.
// Full-screen like the Pay 'n' Glaze sheet (reuses its CSS and widgets from glazeUi.ts). Reads and writes gunModStore.ts.
// STUB: the shop-UI issue fills createGunShop in; the shape is final. gunStore.ts creates it and calls open/close.
import type { GunLoadout } from './gunMods';
import type { GunKind, Hud, Sfx } from './types';

export interface GunFit {
  gun: GunKind;
  /** Mod ids bought by this order (empty when only re-fitting owned mods). */
  bought: string[];
  /** Acorns this order cost. */
  spent: number;
  /** What is fitted on the gun now. */
  loadout: GunLoadout;
}

export interface GunShopDeps {
  acorns(): number;
  /** Take Acorns from the wallet; false when the player cannot pay. */
  spend(amount: number, reason: string): boolean;
  play(sfx: Sfx): void;
  /** Show this gun wearing these mods on the display (called on open and after every change in the sheet). */
  preview(gun: GunKind, loadout: GunLoadout): void;
  /** Play one shot of this gun as these mods would make it sound. */
  testFire(gun: GunKind, loadout: GunLoadout): void;
  /** An order went through: the wallet was charged and gunModStore saved (buyMods + fitLoadout). */
  onFit(info: GunFit): void;
  /** The sheet closed (Done, the close button or Escape). */
  onClose(): void;
}

export interface GunShop {
  /** Open on a weapon (its tab selected, its fitted loadout as the draft). */
  open(gun: GunKind): void;
  /** Close without buying: the draft is dropped. Calls deps.onClose. */
  close(): void;
  isOpen(): boolean;
}

export function createGunShop(ui: HTMLElement, hud: Hud, deps: GunShopDeps): GunShop {
  void ui; void hud;
  let open = false;
  return {
    open(gun) { open = true; deps.preview(gun, {}); },
    close() { if (!open) return; open = false; deps.onClose(); },
    isOpen: () => open,
  };
}
