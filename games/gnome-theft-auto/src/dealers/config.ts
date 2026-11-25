// The three dealerships (E08, L29): what they sell, for how much, and where they stand. Data only: dealers/runtime.ts
// builds them, dealers/ui.ts draws the showroom sheet. A story epic adds stock by pushing to a DealerDef's stock.
// Prices: rebalanced with the money pass (economyCurve.test.ts pins how long a job player needs to afford them).
import { SIDE_VALVE } from '../config';
import type { StorageKind } from '../lockup/types';
import type { VehicleKind } from '../types';

export type DealerId = 'forecourt' | 'boatyard' | 'winglot';

/** One thing a dealership sells: a stock VehicleKind or a fleet.ts variant (FleetEntry.id) of one. */
export interface DealerStock {
  /** fleet.ts FleetEntry.id, or a VehicleKind for the stock model. */
  id: string;
  kind: VehicleKind;
  /** Acorns. */
  price: number;
  /** One line for the showroom card. */
  blurb: string;
}

export interface DealerDef {
  id: DealerId;
  name: string;
  /** Who sells (a lore character). */
  keeper: string;
  /** Which garage a bought vehicle goes to (the player must own it: the Lock-Up always, Hangar Two / the Boathouse bought). */
  storageKind: StorageKind;
  stock: DealerStock[];
  /** The on-foot prompt reaches this far (m) from the site. */
  radius: number;
  /** The sign prefab (@lawn/prefabs) put at the site. */
  sign: string;
}

/**
 * Where the dealerships stand: ONE constant so the merge can move them onto E01's reserved dealership sites.
 * Nominal points beside Side-Valve Salvage, Wally's charter desk (500, -80) and the Loch Moss dock; dealers/runtime.ts
 * searches outward from each for clear dry ground (like the job depots), so they are safe to move.
 */
export const DEALER_SITES: Record<DealerId, { x: number; z: number }> = {
  forecourt: { x: SIDE_VALVE.bay.x + 32, z: SIDE_VALVE.bay.z },
  winglot: { x: 515, z: -96 },
  boatyard: { x: -742, z: -546 },
};

export const DEALERS: Record<DealerId, DealerDef> = {
  forecourt: {
    id: 'forecourt', name: "Burl's Forecourt", keeper: 'Honest Burl', storageKind: 'ground', radius: 6, sign: 'dealer-sign-forecourt',
    stock: [
      { id: 'push-bike', kind: 'push-bike', price: 150, blurb: 'Two wheels, one blade, no shame.' },
      { id: 'push-bike-bumblebuzz', kind: 'push-bike', price: 220, blurb: 'Yellow and black, and it buzzes like it means it.' },
      { id: 'ride-on', kind: 'ride-on', price: 450, blurb: 'The family ride-on. Seats one family member.' },
      { id: 'ride-on-grumbler', kind: 'ride-on', price: 550, blurb: 'Low revs, lots of shove, complains the whole way.' },
      { id: 'ride-on-whine-twin', kind: 'ride-on', price: 550, blurb: 'Twin engines that whine in harmony. Quick off the line.' },
      { id: 'barrow-buggy', kind: 'barrow-buggy', price: 500, blurb: 'A wheelbarrow that went to night school.' },
      { id: 'teacup-trundler', kind: 'teacup-trundler', price: 600, blurb: 'Bone china on wheels. Do not spill.' },
      { id: 'lawn-roller', kind: 'lawn-roller', price: 650, blurb: 'Flattens lawns, kerbs and arguments.' },
      { id: 'golf-cart', kind: 'golf-cart', price: 750, blurb: 'Quiet, polite, and faster than it lets on.' },
      { id: 'zero-turn', kind: 'zero-turn', price: 900, blurb: 'Turns on an acorn. Corners like a rumour.' },
      { id: 'zero-turn-howler', kind: 'zero-turn', price: 1100, blurb: 'A zero-turn that screams. A little faster, a lot louder.' },
      { id: 'zero-turn-thumper', kind: 'zero-turn', price: 1100, blurb: 'Deep thump, hard launch.' },
      { id: 'mulch-spreader', kind: 'mulch-spreader', price: 1400, blurb: 'Leaves a trail. Everybody knows it was you.' },
      { id: 'pot-rod', kind: 'pot-rod', price: 1800, blurb: 'A flowerpot with a hot engine and no regrets.' },
      { id: 'lowrider', kind: 'lowrider', price: 2000, blurb: 'Low, slow on purpose, and very shiny.' },
      { id: 'snail-coach', kind: 'snail-coach', price: 2400, blurb: 'Seats for the whole crew and a shell to hide in.' },
      { id: 'combine', kind: 'combine', price: 3500, blurb: 'The biggest thing on the lot. Parking is your problem.' },
    ],
  },
  boatyard: {
    id: 'boatyard', name: "Driftwood's Boat Yard", keeper: 'Driftwood', storageKind: 'water', radius: 7, sign: 'dealer-sign-boatyard',
    stock: [
      { id: 'walnut-dinghy', kind: 'walnut-dinghy', price: 350, blurb: 'Half a walnut shell and an oar-motor. Floats, mostly.' },
      { id: 'gravy-boat', kind: 'gravy-boat', price: 1100, blurb: 'Pours forward at a good clip.' },
      { id: 'clog-cruiser', kind: 'clog-cruiser', price: 2000, blurb: 'A wooden clog with a cabin. Very Dutch, very stable.' },
      { id: 'watering-can-steamer', kind: 'watering-can-steamer', price: 3000, blurb: 'Steam up the spout, paddles out the side.' },
    ],
  },
  winglot: {
    id: 'winglot', name: "Wally's Wing Lot", keeper: 'Wind-Sock Wally', storageKind: 'air', radius: 8, sign: 'dealer-sign-winglot',
    stock: [
      { id: 'dandelion-drifter', kind: 'dandelion-drifter', price: 2000, blurb: 'A balloon on a seed head. Goes where the wind says.' },
      { id: 'hedge-hopper', kind: 'hedge-hopper', price: 3000, blurb: 'A small, eager plane that clears hedges on purpose.' },
      { id: 'plane', kind: 'plane', price: 4000, blurb: 'The Crop Duster. Sprays, loops and never quite lands level.' },
      { id: 'sycamore-copter', kind: 'sycamore-copter', price: 5000, blurb: 'A spinning seed with a seat. Hovers, if you are gentle.' },
    ],
  },
};

export const DEALER_IDS: readonly DealerId[] = ['forecourt', 'boatyard', 'winglot'];

/** The dealer price of a stored vehicle's model: its fleet variant's price, else the stock kind's, else null (not sold). */
export function dealerPrice(kind: VehicleKind, variant: string | null): number | null {
  for (const id of DEALER_IDS) {
    for (const s of DEALERS[id].stock) {
      if (variant !== null && s.id === variant) return s.price;
    }
  }
  for (const id of DEALER_IDS) {
    for (const s of DEALERS[id].stock) {
      if (s.id === kind) return s.price;
    }
  }
  return null;
}

/** The insurance value of a vehicle the player never bought (taken from the street): its dealer price, or this. */
export const UNLISTED_VALUE = 400;
