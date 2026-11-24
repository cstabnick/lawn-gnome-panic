// Pebblewick's counter goods (data only, no DOM): what Twine's General, The Dry Spoon and Ratchet's Mower & Dew sell
// for Acorns. shops.ts turns these into the sheet's rows; shopUi.ts draws the sheet.
import type { CounterId } from './town';

export interface ShopItem {
  id: string;
  counter: CounterId;
  name: string;
  blurb: string;
  /** Base Acorn price (perk discounts are applied by shownPrice / the economy wrapper). */
  price: number;
  /** Prefab id for the row's icon (prefabIconElement). */
  icon: string;
  /** Fallback emoji when the prefab is missing. */
  emoji: string;
  /** Food: mends this much of full health (0..1). */
  heal?: number;
  /** A keepsake: one per player. */
  souvenir?: boolean;
  /** The full vehicle repair at the workshop. */
  repair?: boolean;
}

/** The perk-discount reason for each counter (perks.ts PRICE_PERKS matches on these). */
export const SHOP_REASON: Record<CounterId, string> = {
  store: 'Pebblewick',
  diner: 'Pebblewick',
  workshop: 'Ratchet Repairs',
};

export const SHOP_ITEMS: readonly ShopItem[] = [
  // Twine's General
  {
    id: 'dust-biscuits', counter: 'store', name: 'Dust Biscuits', price: 4, heal: 0.25,
    blurb: 'Shortbread that tastes of the Flats. The crumbs get everywhere, which is how you know it worked.',
    icon: 'seed-cake', emoji: '🍪',
  },
  {
    id: 'cactus-water', counter: 'store', name: 'Cactus Water', price: 8, heal: 0.5,
    blurb: 'Faintly prickly and cold enough. It does the job and says so.',
    icon: 'honeydew-flask', emoji: '🥤',
  },
  {
    id: 'postcard', counter: 'store', name: 'Pebblewick Postcard', price: 5, souvenir: true,
    blurb: 'A picture of the town from the highway. The sky is bigger in person.',
    icon: 'sealed-letter', emoji: '✉',
  },
  {
    id: 'tower-globe', counter: 'store', name: 'Water Tower Globe', price: 15, souvenir: true,
    blurb: 'Shake it. It is full of sand, not snow, and that is the whole joke.',
    icon: 'spinning-globe', emoji: '🔮',
  },
  {
    id: 'pop-mug', counter: 'store', name: '"Pop. 31" Mug', price: 10, souvenir: true,
    blurb: 'The sign says 31. The mug has never been told it is out of date.',
    icon: 'espresso-cup', emoji: '☕',
  },
  // The Dry Spoon
  {
    id: 'dust-coffee', counter: 'diner', name: 'Bottomless Dust Coffee', price: 3, heal: 0.15,
    blurb: 'Bottomless, which is the only accurate word for it.',
    icon: 'espresso-cup', emoji: '☕',
  },
  {
    id: 'pear-pie', counter: 'diner', name: 'Prickly Pear Pie', price: 9, heal: 0.5,
    blurb: 'Spiny on the outside, sweet on the inside, like most of the town.',
    icon: 'acorn-cake', emoji: '🥧',
  },
  {
    id: 'spoon-special', counter: 'diner', name: 'The Spoon Special', price: 18, heal: 1,
    blurb: 'Whatever the kitchen had left, in a bowl. Best not to ask what it was.',
    icon: 'toadstool-stew', emoji: '🍲',
  },
  // Ratchet's Mower & Dew
  {
    id: 'repair', counter: 'workshop', name: 'Full Repair', price: 35, repair: true,
    blurb: 'Dents out, bolts in, windscreen wiped. Ratchet does not do paint.',
    icon: 'brass-wrench', emoji: '🔧',
  },
];

/** The price the player is shown: the base price after the perk scale, rounded to whole Acorns. */
export function shownPrice(item: ShopItem, scale: number): number {
  return Math.round(item.price * scale);
}
