// E25 Gnomazon: the stock, orders, the right box, scoring a parcel, the quota and Kippy's lines. Pure.
import { starsForScore } from '../../jobs/workDefs';
import { BOX_CAP, BOX_SIZES, GNOMAZON } from './types';
import type { BoxSize, Order, PackedParcel, ParcelScore, StockItem } from './types';

// Every prefab id below is in packages/prefabs/src/catalog.
export const STOCK: readonly StockItem[] = [
  { id: 'trowel', name: 'Trowel', prefab: 'old-trowel', emoji: '🪛', size: 1 },
  { id: 'can', name: 'Watering Can', prefab: 'watering-can', emoji: '🚿', size: 4 },
  { id: 'pot', name: 'Flower Pot', prefab: 'flower-pot', emoji: '🪴', size: 2 },
  { id: 'duck', name: 'Rubber Duck', prefab: 'rubber-duck', emoji: '🦆', size: 1 },
  { id: 'spade', name: 'Bucket and Spade', prefab: 'bucket-and-spade', emoji: '🪣', size: 3 },
  { id: 'gloves', name: 'Work Gloves', prefab: 'work-gloves', emoji: '🧤', size: 1 },
  { id: 'candle', name: 'Candle', prefab: 'candle', emoji: '🕯️', size: 1 },
  { id: 'flour', name: 'Acorn Flour', prefab: 'acorn-flour-sack', emoji: '🌰', size: 3 },
  { id: 'doormat', name: 'Doormat', prefab: 'rolled-doormat-pack', emoji: '🧺', size: 4 },
  { id: 'hose', name: 'Hose Reel', prefab: 'hose-reel', emoji: '🧵', size: 5 },
  { id: 'bin-bags', name: 'Bin Bags (roll)', prefab: 'bin-bag', emoji: '🗑️', size: 2 },
  { id: 'ladder', name: 'Step Ladder', prefab: 'ladder', emoji: '🪜', size: 5 },
];

// Kippy's specific lines for each mistake (also listed under KIPPY_LINES.bad).
export const MISTAKE_LINES = {
  items: 'Wrong items. The customer ordered the items. Not the vibe of the items.',
  bigBox: 'That box has room for feelings. We do not ship feelings.',
  smallBox: 'That box is full. Full is not a box size. Please try a bigger box.',
  label: 'That label points somewhere lovely. It is not the customer.',
  taped: 'Untaped parcel detected. The tape is not optional. The tape is a KPI.',
} as const;

/** Kippy (KPI-9), the manager-bot. Encouraging. Numerically. */
export const KIPPY_LINES: Record<'start' | 'good' | 'bad' | 'idle' | 'quota' | 'end', readonly string[]> = {
  start: [
    'Welcome back, Associate.',
    'Good morning, Associate. Your productivity is pending.',
    'Clock-in logged. Enthusiasm logged. Hydration pending.',
    "Today is a fresh opportunity to exceed yesterday's you.",
    'Your shift has begun. Your smile has been logged.',
    'Parcels await. Parcels always await. It is their nature.',
    'Remember: a box is only as good as its label.',
    'Let us make today a 4% improvement on today.',
  ],
  good: [
    "Great job! You are 4% faster than yesterday's you.",
    'Parcel sent. Kippy has logged a small celebration.',
    'Five stars. Kippy is almost emotional. Almost.',
    'Excellent packing. The customer will never know your name, and that is fine.',
    'Perfect parcel. Your metrics are sparkling.',
    'On target and on time. Kippy respects that.',
    'Sent clean. Taped clean. Labelled clean. Clean is a KPI.',
    'That one went out like a rocket with a tiny label on it.',
  ],
  bad: [
    MISTAKE_LINES.items,
    MISTAKE_LINES.bigBox,
    MISTAKE_LINES.smallBox,
    MISTAKE_LINES.label,
    MISTAKE_LINES.taped,
    'Not quite on target. Target is still there. Target is patient.',
    'That parcel is now a learning opportunity. Learning is a KPI.',
    'Kippy has flagged this parcel. Kippy flags many things. Kippy is kind about it.',
    'Score noted. Score is not a verdict. Score is a number.',
  ],
  idle: [
    'I see you are standing still. I respect it. I am timing it.',
    'Break room: coming soon. Morale: coming sooner.',
    'Hydration is a KPI. Please drink water at your earliest efficiency.',
    'Your station is open. Your station is lonely.',
    'Idle time logged. Idle time is also a time.',
    'Stillness is a skill. We would like it sooner, in a box.',
    'Kippy is not worried. Kippy is only watching the clock with love.',
    'Take a moment. Then take a parcel. In that order, ideally.',
  ],
  quota: [
    'Quota met.',
    'Quota met. Kippy is so proud of this number.',
    'Quota beaten. Please enjoy the feeling of a number going up.',
    'The quota is a floor, Associate. You have found the ceiling.',
    'Quota hit. The bonus is in your acorn pouch, numerically.',
    'You beat the quota. Kippy has added you to the wall of numbers.',
    'Target achieved. The next target is already here, and it is excited.',
    'The quota is met. The next quota is one higher, as a treat.',
  ],
  end: [
    'Shift complete.',
    'Shift complete. Thank you for your time, which we tracked.',
    'Clocked out. Kippy wants you to know it was a good shift.',
    'End of shift. Please leave the station tidier than you found it, and happier.',
    'Shift complete. Your metrics have been filed under Wins.',
    'Thank you for packing. The parcels thank you. The parcels cannot speak, so Kippy speaks for them.',
    'Your shift has ended. Your hydration is still pending.',
    'Go home, Associate. Tomorrow has a quota too, and it is excited to meet you.',
  ],
};

// Each order's real address, then two decoys that look alike (same street, another number, or a near-miss name).
const ADDRESSES: readonly (readonly [string, string, string])[] = [
  ['12 Fern Row, Turfton', '21 Fern Row, Turfton', '12 Fern Rowe, Turfton'],
  ["The Mayor's Residence", "The Mayor's Residence, Annexe", "The Mayoress's Residence"],
  ['Flat 3B, Saucer Court', 'Flat 3A, Saucer Court', 'Flat 3B, Saucer Courtyard'],
  ['Pebblewick Post Office', 'Pebblewick Post Box 9', 'Pebblewick Pot Office'],
  ['Fort Sandpit (Gate 2)', 'Fort Sandpit (Gate 12)', 'Fort Sandbit (Gate 2)'],
  ['A tent, Mossy Wood', 'A tent, Mossy Would', 'A tent, Mossy Wood Edge'],
  ['4 Hedge Hollow, Turfton', '40 Hedge Hollow, Turfton', '4 Hedge Hallow, Turfton'],
  ['The Hollow Stump, Mossy Wood', 'The Hollow Stump, Dust Flats', 'The Hollow Stomp, Mossy Wood'],
  ['Bin Lid Bungalow, Compost Lane', 'Bin Lid Bungalow, Compost Land', 'Bin Lid Bungalow, Compost Lane Rear'],
  ['Mower Shed 2, Pardonlin Road', 'Mower Shed 12, Pardonlin Road', 'Mower Shed 2, Pardonlin Rd Yard'],
  ['The Duck Pond Cottage, Puddle Point', 'The Duck Pond Cottage, Puddle Pint', 'The Duck Pond Cottages, Puddle Point'],
  ['Acorn Villa, Oak Crescent', 'Acorn Vila, Oak Crescent', 'Acorn Villa, Oak Cresent'],
  ['6 Toadstool Terrace, Turfton', '9 Toadstool Terrace, Turfton', '6 Toadstool Terrace, Turfton Heights'],
  ['Greenhouse 3, Sprout Yard', 'Greenhouse 8, Sprout Yard', 'Greenhouse 3, Sprout Yards'],
  ['The Gazebo, Fescue Park', 'The Gazebo, Fescue Parks', 'The Gazebo, Fescue Park North'],
  ['Parcel Locker 14, Dust Flats', 'Parcel Locker 41, Dust Flats', 'Parcel Locker 14, Dust Flat'],
];

/** Largest order total in volume units (the L box). */
const MAX_ORDER_SIZE = BOX_CAP.L;

export function stockItem(id: string): StockItem | undefined {
  return STOCK.find((s) => s.id === id);
}

/** Small seeded PRNG (mulberry32). Returns floats in [0, 1). */
function rng(seed: number): () => number {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(xs: readonly T[], rnd: () => number): T[] {
  const out = xs.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** The smallest box that fits `items`. */
export function rightBox(items: readonly string[]): BoxSize {
  const total = items.reduce((sum, id) => sum + (stockItem(id)?.size ?? 0), 0);
  return BOX_SIZES.find((b) => BOX_CAP[b] >= total) ?? 'L';
}

export function makeOrder(level: number, seed: number, id: number): Order {
  const l = Math.max(1, Math.floor(level));
  const rnd = rng((Math.imul(Math.floor(seed), 1000003) + Math.imul(id, 7919) + Math.imul(l, 31)) | 0);
  // 1 item at level 1, up to 2 at levels 2-3, up to 3 at level 4+.
  const want = l === 1 ? 1 : l <= 3 ? 1 + Math.floor(rnd() * 2) : 1 + Math.floor(rnd() * 3);
  const items: string[] = [];
  let total = 0;
  for (let n = 0; n < want; n++) {
    const fit = STOCK.filter((s) => total + s.size <= MAX_ORDER_SIZE);
    if (!fit.length) break;
    const pick = fit[Math.floor(rnd() * fit.length)];
    items.push(pick.id);
    total += pick.size;
  }
  const entry = ADDRESSES[Math.floor(rnd() * ADDRESSES.length)];
  return {
    id,
    items,
    dest: entry[0],
    labels: shuffle(entry, rnd),
    box: rightBox(items),
  };
}

function sameMultiset(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const x = a.slice().sort().join('|');
  const y = b.slice().sort().join('|');
  return x === y;
}

export function scoreParcel(p: PackedParcel): ParcelScore {
  const o = p.order;
  const rightItems = sameMultiset(p.picked, o.items);
  const rightBoxOk = p.box === o.box;
  const rightLabel = p.label === o.dest;
  const taped = p.taped;
  // 1 point off per second over fastS, at most 20.
  const slow = Math.min(20, Math.max(0, Math.round(p.seconds - GNOMAZON.fastS)));
  const raw = (rightItems ? 40 : 0) + (rightBoxOk ? 25 : 0) + (rightLabel ? 25 : 0) + (taped ? 10 : 0);
  const stars = starsForScore(Math.max(0, raw - slow));

  let line: string;
  if (stars >= 4) {
    line = KIPPY_LINES.good[o.id % KIPPY_LINES.good.length];
  } else if (!rightItems) {
    line = MISTAKE_LINES.items;
  } else if (!rightBoxOk) {
    line = BOX_SIZES.indexOf(p.box) > BOX_SIZES.indexOf(o.box) ? MISTAKE_LINES.bigBox : MISTAKE_LINES.smallBox;
  } else if (!rightLabel) {
    line = MISTAKE_LINES.label;
  } else if (!taped) {
    line = MISTAKE_LINES.taped;
  } else {
    line = KIPPY_LINES.bad[o.id % KIPPY_LINES.bad.length];
  }
  return { stars, rightItems, rightBox: rightBoxOk, rightLabel, taped, line };
}

export function quotaFor(level: number): number {
  return GNOMAZON.quotaBase + GNOMAZON.quotaPerLevel * (level - 1);
}
