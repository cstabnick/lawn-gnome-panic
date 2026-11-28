// The three dealerships at runtime (E08, L29): Burl's Forecourt (ground), Driftwood's Boat Yard (boats) and Wally's
// Wing Lot (aircraft). A sign at each site; on foot within range, E (or the action button) opens the showroom sheet.
// A bought vehicle goes into its garage (Lock-Up, Hangar Two, Mossbank Boathouse) and the Sling-Lift brings it at once.
import type * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import type { Economy } from '../economy';
import type { Lockup } from '../lockup/runtime';
import type { SpotProbe, StorageKind, VehicleSnapshot } from '../lockup/types';
import { findSafeSpot } from '../lockup/safeSpot';
import type { Ownership } from '../ownership';
import type { Blip, Sfx, Vehicle } from '../types';
import { MOWER_TINTS, VEHICLES } from '../config';
import { fleetEntry } from '../fleet';
import { ECON_ACH } from '../econAchievements';
import { PLACE_STYLE, type PlaceKind } from '../mapIcons';
import { DEALERS, DEALER_IDS, DEALER_SITES, type DealerDef, type DealerId, type DealerStock } from './config';
import { createDealerUi, type DealerCard, type DealerUi } from './ui';

export interface DealersDeps {
  scene: THREE.Scene;
  /** The shared #ui element. */
  ui: HTMLElement;
  hud: { toast(text: string, ms?: number): void; banner(text: string, ms?: number): void };
  economy: Pick<Economy, 'spend' | 'state'>;
  ownership: Ownership;
  lockup: Pick<Lockup, 'owns' | 'free' | 'list' | 'addSnapshot' | 'callDelivery'>;
  play(sfx: Sfx): void;
  achievements: { unlock(id: string): unknown };
  player(): { x: number; z: number; vehicle: Vehicle | null };
  /** World probes (the same the Sling-Lift uses) to settle each site on clear dry ground. */
  probe: SpotProbe;
}

export interface Dealers {
  update(dt: number): void;
  /** On foot at a dealership: "Browse Burl's Forecourt"; else null. */
  prompt(): string | null;
  /** E on foot at a dealership: open its showroom. */
  interact(): void;
  isOpen(): boolean;
  /** One map blip per dealership (kind 'dealer-car' | 'dealer-boat' | 'dealer-air', label = its name). */
  blips(): Blip[];
}

interface Site {
  def: DealerDef;
  x: number;
  y: number;
  z: number;
  yaw: number;
}

const BLIP_KIND: Record<DealerId, PlaceKind> = {
  forecourt: 'dealer-car',
  boatyard: 'dealer-boat',
  winglot: 'dealer-air',
};

const GARAGE_FULL: Record<StorageKind, string> = {
  ground: 'Your Lock-Up is full',
  air: 'Hangar Two is full',
  water: 'The Boathouse is full',
};

const GARAGE_FULL_BUY: Record<StorageKind, string> = {
  ground: 'Your Lock-Up is full. Scrap or sell one first.',
  air: 'Hangar Two is full. Scrap or sell one first.',
  water: 'The Boathouse is full. Scrap or sell one first.',
};

const GARAGE_NEEDED: Partial<Record<StorageKind, string>> = {
  air: 'Buy Hangar Two first',
  water: 'Buy the Mossbank Boathouse first',
};

const GARAGE_NEEDED_BUY: Partial<Record<StorageKind, string>> = {
  air: 'You need Hangar Two at the Desert Airfield first.',
  water: 'You need the Mossbank Boathouse first.',
};

const ALL_KINDS: readonly StorageKind[] = ['ground', 'water', 'air'];

export function createDealers(deps: DealersDeps): Dealers {
  const { lockup, ownership, economy } = deps;

  // Settle each site on clear dry ground near its nominal point, and put its sign there.
  const sites: Site[] = DEALER_IDS.map((id) => {
    const def = DEALERS[id];
    const nominal = DEALER_SITES[id];
    const spot = findSafeSpot(nominal.x, nominal.z, deps.probe, {
      radius: 2.5, minDist: 0, maxDist: 30, maxSlope: 0.3, maxWater: 0.05,
    });
    const site: Site = spot
      ? { def, x: spot.x, y: spot.y, z: spot.z, yaw: spot.yaw }
      : { def, x: nominal.x, y: deps.probe.ground(nominal.x, nominal.z), z: nominal.z, yaw: 0 };
    if (getPrefab(def.sign)) {
      const sign = buildPrefab(def.sign);
      sign.position.set(site.x, site.y, site.z);
      sign.rotation.y = site.yaw;
      deps.scene.add(sign);
    }
    return site;
  });

  const blipList: Blip[] = sites.map((s) => ({
    x: s.x,
    z: s.z,
    color: PLACE_STYLE[BLIP_KIND[s.def.id]].color,
    kind: BLIP_KIND[s.def.id],
    label: s.def.name,
  }));

  /** The site whose sheet is open, or null. */
  let openSite: Site | null = null;
  let uiTimer = 0;

  /** The site the player stands within its prompt radius of, on foot; else null. */
  function nearSite(): Site | null {
    const p = deps.player();
    if (p.vehicle !== null) return null;
    for (const s of sites) {
      if (Math.hypot(p.x - s.x, p.z - s.z) <= s.def.radius) return s;
    }
    return null;
  }

  function acorns(): number {
    return economy.state().acorns;
  }

  /** Why a stock row cannot be bought now (the card note), or null. */
  function noteFor(dealer: DealerDef, s: DealerStock): string | null {
    const need = GARAGE_NEEDED[dealer.storageKind];
    if (need && !lockup.owns(dealer.storageKind)) return need;
    if (lockup.free(dealer.storageKind) === 0) return GARAGE_FULL[dealer.storageKind];
    if (acorns() < s.price) return 'Not enough Acorns';
    return null;
  }

  function cards(dealer: DealerDef): DealerCard[] {
    return dealer.stock.map((s) => ({
      id: s.id,
      name: fleetEntry(s.id)?.name ?? VEHICLES[s.kind].name,
      prefab: VEHICLES[s.kind].prefab,
      price: s.price,
      blurb: s.blurb,
      note: noteFor(dealer, s),
    }));
  }

  function buy(dealer: DealerDef, stockId: string, insure: boolean): string | null {
    const s = dealer.stock.find((row) => row.id === stockId);
    if (!s) return 'Not for sale.';
    const need = GARAGE_NEEDED_BUY[dealer.storageKind];
    if (need && !lockup.owns(dealer.storageKind)) return need;
    if (lockup.free(dealer.storageKind) === 0) return GARAGE_FULL_BUY[dealer.storageKind];
    const total = s.price + (insure ? ownership.feeFor(s.price) : 0);
    if (acorns() < total) return `That comes to ${total} Acorns. You have ${acorns()}.`;

    const entry = fleetEntry(s.id);
    const name = entry?.name ?? VEHICLES[s.kind].name;
    const snap: VehicleSnapshot = {
      kind: s.kind,
      variant: entry ? s.id : null,
      name,
      tint: entry?.tints?.[0] ?? MOWER_TINTS[Math.floor(Math.random() * MOWER_TINTS.length)],
      look: null,
      hp: 1,
      enginePitch: null,
    };
    const rec = lockup.addSnapshot(snap);
    if (!rec) return 'No room.';

    economy.spend(s.price, dealer.name);
    ownership.setBought(rec.uid, s.price);
    if (insure) ownership.insure(rec.uid, s.price);
    const err = lockup.callDelivery(rec.uid, true);

    deps.hud.banner(`${name} is yours`);
    deps.hud.toast(err ? `It is waiting in your garage: ${err}` : `${dealer.keeper}: the Sling-Lift is bringing it round.`);
    deps.play('door');

    deps.achievements.unlock(ECON_ACH.firstPurchase);
    if (lockup.list().filter((r) => r.kind === s.kind).length >= 3) deps.achievements.unlock(ECON_ACH.threeOfAKind);
    const everyGarage = ALL_KINDS.every((kind) =>
      lockup.list(kind).some((r) => ownership.boughtFor(r.uid) !== null));
    if (everyGarage) deps.achievements.unlock(ECON_ACH.allDealers);
    return null;
  }

  const ui: DealerUi = createDealerUi(deps.ui, { cards, acorns, insuranceFee: (p) => ownership.feeFor(p), buy });

  return {
    update(dt: number): void {
      if (!openSite) return;
      if (!ui.isOpen()) {
        openSite = null;
        return;
      }
      const p = deps.player();
      if (p.vehicle !== null || Math.hypot(p.x - openSite.x, p.z - openSite.z) > openSite.def.radius + 4) {
        ui.close();
        openSite = null;
        return;
      }
      uiTimer += dt;
      if (uiTimer >= 1) {
        uiTimer -= 1;
        ui.refresh();
      }
    },

    prompt(): string | null {
      const s = nearSite();
      return s ? `Browse ${s.def.name}` : null;
    },

    interact(): void {
      const s = nearSite();
      if (!s) return;
      openSite = s;
      uiTimer = 0;
      ui.open(s.def);
    },

    isOpen: () => ui.isOpen(),

    blips: () => blipList,
  };
}
