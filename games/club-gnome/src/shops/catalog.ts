// What Club Gnome's shops sell, as plain data. A cosmetic is unlocked by buying it: the shop records the purchase in
// the Oakcount (buyItem(id, price, currency)) and unlocks its achievement (`achievementId`, whose reward is the item),
// so the Gnome Creator, the dressing room and every game can equip it with no further code.
import type { EquipSlot, HairStyle } from '@lawn/gnome';

export interface ShopItem {
  /** Oakcount item id (the prefab id). */
  id: string;
  /** @lawn/prefabs id, drawn as the icon (prefabIconElement) and worn on the gnome. */
  prefabId: string;
  name: string;
  slot: EquipSlot;
  price: number;
  /** One short line shown under the name. */
  blurb: string;
  /** The achievement in packages/achievements/src/catalog.ts that grants this item. */
  achievementId: string;
}

/** A prize that is not made yet: the Prize Counter shows it on a "Coming soon" placard, not for sale. */
export interface ComingSoonItem {
  name: string;
  slot: EquipSlot;
  /** One short line for the placard. */
  blurb: string;
  /** The emoji shown on the placard instead of a model. */
  icon: string;
}

/** The Gnomecino Prize Counter (prices in chips). Cheapest first. */
export const PRIZE_ITEMS: readonly ShopItem[] = [
  { id: 'card-fan', prefabId: 'card-fan', name: 'Fan of Aces', slot: 'hand', price: 800, blurb: 'Five aces. Nobody asks where the deck went.', achievementId: 'club-buy-card-fan' },
  { id: 'chip-stack-tower', prefabId: 'chip-stack-tower', name: 'Fistful of Chips', slot: 'hand', price: 1200, blurb: 'A tower of chips, carried everywhere, spent nowhere.', achievementId: 'club-buy-chip-stack-tower' },
  { id: 'jackpot-chip-medallion', prefabId: 'jackpot-chip-medallion', name: 'Jackpot Chip Medallion', slot: 'neck', price: 1800, blurb: 'One giant gold chip on a chain. Too big to bet.', achievementId: 'club-buy-jackpot-chip-medallion' },
  { id: 'high-roller-top-hat', prefabId: 'high-roller-top-hat', name: 'High Roller Top Hat', slot: 'head', price: 2500, blurb: 'Tall, black, gold band, an ace tucked in it.', achievementId: 'club-buy-high-roller-top-hat' },
  { id: 'cherry-jackpot-crown', prefabId: 'cherry-jackpot-crown', name: 'Triple Cherry Crown', slot: 'head', price: 4000, blurb: 'Three cherries in a row, worn where everyone can see.', achievementId: 'club-buy-cherry-jackpot-crown' },
  { id: 'overflowing-acorn-sack', prefabId: 'overflowing-acorn-sack', name: 'Overflowing Acorn Sack', slot: 'back', price: 6000, blurb: 'So full of golden acorns it leaks.', achievementId: 'club-buy-overflowing-acorn-sack' },
];

/** The six Prize Counter items still in the workshop: shown as "Coming soon" placards. */
export const PRIZE_COMING_SOON: readonly ComingSoonItem[] = [
  { name: "Croupier's Rake", slot: 'hand', blurb: 'For pulling in other gnomes\' chips. Politely.', icon: '🧹' },
  { name: 'Roulette Wheel Shield', slot: 'back', blurb: 'Red, black, and spinning on your back.', icon: '🎡' },
  { name: 'Bow Tie of Fortune', slot: 'neck', blurb: 'Gold silk, pinned with a lucky die.', icon: '🎀' },
  { name: 'Lucky Horseshoe Pendant', slot: 'neck', blurb: 'Hung points up, so the luck stays in.', icon: '🧲' },
  { name: 'Velvet Cape of the House', slot: 'back', blurb: 'The house always wins. Now it dresses the part.', icon: '🦹' },
  { name: 'Golden Acorn Monocle', slot: 'head', blurb: 'For counting your acorns with one eye.', icon: '🧐' },
];

/** The Gnome Market (prices in acorns). Cheapest first. */
export const MARKET_ITEMS: readonly ShopItem[] = [
  { id: 'honeydew-flask', prefabId: 'honeydew-flask', name: 'Honeydew Flask', slot: 'hand', price: 60, blurb: 'Sweet, sticky, and good for a long walk.', achievementId: 'club-buy-honeydew-flask' },
  { id: 'torch', prefabId: 'torch', name: 'Torch', slot: 'hand', price: 90, blurb: 'For the far end of Links Park after dark.', achievementId: 'club-buy-torch' },
  { id: 'hazel-staff', prefabId: 'hazel-staff', name: 'Hazel Staff', slot: 'hand', price: 120, blurb: 'A good stick. Every gnome needs one.', achievementId: 'club-buy-hazel-staff' },
  { id: 'fishing-rod', prefabId: 'fishing-rod', name: 'Fishing Rod', slot: 'hand', price: 180, blurb: 'The dock in Links Park is waiting.', achievementId: 'club-buy-fishing-rod' },
  { id: 'porcelain-lantern', prefabId: 'porcelain-lantern', name: 'Porcelain Lantern', slot: 'hand', price: 220, blurb: 'Thin as an eggshell, warm as a kiln.', achievementId: 'club-buy-porcelain-lantern' },
  { id: 'guitar', prefabId: 'guitar', name: 'Garden Guitar', slot: 'hand', price: 300, blurb: 'Bring it to the Music Hall. Or the fountain.', achievementId: 'club-buy-guitar' },
];

/** Gnome Salon prices (acorns) for every hair style except the free pigtails. */
export const HAIR_PRICES: Partial<Record<HairStyle, number>> = {
  ponytail: 80,
  bun: 100,
  long: 150,
  braid: 150,
  mullet: 200,
  curls: 250,
};
