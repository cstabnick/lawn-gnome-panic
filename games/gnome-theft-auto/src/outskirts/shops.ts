// Pebblewick's three counters (COUNTERS in town.ts): Twine's General, The Dry Spoon and Ratchet's Mower & Dew, and
// their sheet. The goods live in shopItems.ts; the sheet is shopUi.ts; this file joins them to the economy, the
// player's health, the save and the vehicles.
import { play2d } from '../sound';
import type { Economy } from '../economy';
import { repairVehicle } from '../vehicles';
import type { Hud, Sfx, Vehicle } from '../types';
import type { OutskirtsStore } from './save';
import { SHOP_ITEMS, SHOP_REASON, shownPrice, type ShopItem } from './shopItems';
import { createShopSheet, type SheetRow } from './shopUi';
import { COUNTER_REACH, COUNTERS, WORKSHOP_BAY, type CounterDef, type CounterId } from './town';
import { activePerks, priceScaleFor } from '../perks';

export interface ShopsDeps {
  ui: HTMLElement;
  hud: Hud;
  economy: Economy;
  store: OutskirtsStore;
  /** The game's vehicle list (the workshop repairs the nearest one on its forecourt). */
  vehicles: readonly Vehicle[];
  play(sfx: Sfx): void;
  /** Is the counter's keeper at it right now (npcs.presentAt(keeper, 0))? */
  keeperIn(id: CounterId): boolean;
  /** Mend the player's cracks by `amount` (0..1 of full health). */
  heal(amount: number): void;
  /** After any purchase at a counter. */
  onBought(id: CounterId): void;
}

export interface TownShops {
  /** The E prompt when the player stands within COUNTER_REACH of a counter, else null. */
  prompt(px: number, pz: number): string | null;
  /** E pressed: opens the counter's sheet (or says it is closed). True when handled. */
  interact(px: number, pz: number): boolean;
  isOpen(): boolean;
  close(): void;
}

const KEEPER_NAMES: Record<CounterId, string> = {
  store: 'Thistle Twine',
  diner: 'Marigold Skillet',
  workshop: 'Burnet Ratchet',
};

const PROMPTS: Record<CounterId, string> = {
  store: "Shop at Twine's General",
  diner: 'Eat at The Dry Spoon',
  workshop: 'Talk to Burnet Ratchet (repairs)',
};

const NO_REPAIR_NOTE = 'Park a dented ride on the forecourt';

function counterAt(px: number, pz: number): CounterDef | null {
  for (const c of COUNTERS) {
    if (Math.hypot(c.x - px, c.z - pz) <= COUNTER_REACH) return c;
  }
  return null;
}

/** The nearest vehicle on the workshop forecourt that can be repaired: not wrecked, unattended or player-driven, dented. */
function repairTarget(vehicles: readonly Vehicle[]): Vehicle | null {
  let best: Vehicle | null = null;
  let bestD: number = WORKSHOP_BAY.radius;
  for (const v of vehicles) {
    if (v.exploded) continue;
    if (v.driver !== 'none' && v.driver !== 'player') continue;
    if (!(v.hp < 1)) continue;
    const d = Math.hypot(v.x - WORKSHOP_BAY.x, v.z - WORKSHOP_BAY.z);
    if (d <= bestD) {
      best = v;
      bestD = d;
    }
  }
  return best;
}

export function createTownShops(deps: ShopsDeps): TownShops {
  let current: CounterId = 'store';

  function itemsFor(id: CounterId): ShopItem[] {
    return SHOP_ITEMS.filter((i) => i.counter === id);
  }

  function rowsFor(id: CounterId): SheetRow[] {
    const scale = priceScaleFor(SHOP_REASON[id], activePerks());
    const acorns = deps.economy.state().acorns;
    return itemsFor(id).map((item) => {
      const price = shownPrice(item, scale);
      const row: SheetRow = {
        id: item.id,
        name: item.name,
        blurb: item.blurb,
        price,
        icon: item.icon,
        emoji: item.emoji,
        enabled: true,
      };
      if (item.souvenir && deps.store.hasSouvenir(item.id)) {
        row.enabled = false;
        row.note = 'Owned';
      } else if (item.repair && !repairTarget(deps.vehicles)) {
        row.enabled = false;
        row.note = NO_REPAIR_NOTE;
      } else if (acorns < price) {
        row.enabled = false;
        row.note = 'Not enough Acorns';
      }
      return row;
    });
  }

  const sheet = createShopSheet(deps.ui, {
    title: () => COUNTERS.find((c) => c.id === current)?.name ?? '',
    keeper: () => `${KEEPER_NAMES[current]} is behind the counter.`,
    rows: () => rowsFor(current),
    buy: (itemId) => buy(itemId),
    onClose: () => {},
  });

  function buy(itemId: string): void {
    const item = SHOP_ITEMS.find((i) => i.id === itemId && i.counter === current);
    if (!item) return;
    // The repair target is checked before any Acorns leave the purse.
    const target = item.repair ? repairTarget(deps.vehicles) : null;
    if (item.repair && !target) return;
    // The base price: the perk wrapper in perkEffects.ts applies the discount itself.
    if (!deps.economy.spend(item.price, SHOP_REASON[current])) return;

    if (item.heal !== undefined) {
      deps.heal(item.heal);
      deps.hud.toast(
        item.heal >= 1 ? `${item.name}. Good as new.` : `${item.name}. Cracks mended a little.`,
        3000,
      );
    }
    if (item.souvenir) {
      deps.store.addSouvenir(item.id);
      deps.hud.toast(`${item.name}: yours.`, 3000);
    }
    if (item.repair && target) {
      repairVehicle(target);
      deps.hud.toast(`Burnet Ratchet fixes the ${target.spec.name}.`, 3000);
    }

    play2d('pw-till');
    deps.play('shutter');
    deps.onBought(current);
    sheet.refresh();
  }

  return {
    prompt(px, pz) {
      const c = counterAt(px, pz);
      return c ? PROMPTS[c.id] : null;
    },
    interact(px, pz) {
      const c = counterAt(px, pz);
      if (!c) return false;
      if (!deps.keeperIn(c.id)) {
        deps.hud.toast(`${c.name} is shut. ${KEEPER_NAMES[c.id]} is out.`, 3000);
        return true;
      }
      current = c.id;
      sheet.open();
      return true;
    },
    isOpen: () => sheet.isOpen(),
    close: () => sheet.close(),
  };
}
