// E24 mechanic: client briefs and how a finished car is scored against one. Pure.
// Pay 'n' Glaze's slogan: "New Coat. Who Dis?"
import { sameLoadout, type Loadout } from '@lawn/glaze';
import { starsForScore } from '../../jobs/workDefs';
import type { Brief, BriefScore, BriefWant, HueFamily, PartSlot, Want } from './types';

const w = (want: Want, says: string, weight = 1): BriefWant => ({ want, weight, says });

export const BRIEFS: readonly Brief[] = [
  {
    id: 'brief-pink-loud', client: 'Bramble Fennick', look: { hat: 0xe0589a, shirt: 0xf7d6e6, beard: 0xffffff },
    vehicle: 'ride-on', start: { paint: 0x8a8a8a, finish: 'primer' },
    text: 'Make it pink and loud. I want the whole cul-de-sac to know I have arrived, and also that I am pink.',
    wants: [w({ kind: 'paint', hue: 'pink' }, 'pink', 2), w({ kind: 'loud' }, 'loud', 2)],
    budget: 150, minLevel: 1,
    good: 'The neighbours have called the Hat Watch. In admiration. I think.',
    bad: 'This is beige with ambitions. I asked for LOUD.',
  },
  {
    id: 'brief-racing-cheap', client: 'Dot Pennywort-Smythe', look: { hat: 0xd8342c, shirt: 0x1f6feb, beard: 0x6b4a2f },
    vehicle: 'push-bike', start: { paint: 0x4a5d7a, finish: 'matte' },
    text: 'Racing look, cheap. A wing, some fast wheels, a stripe. I have exactly one acorn jar to spend.',
    wants: [
      w({ kind: 'part', slot: 'spoiler' }, 'a wing', 2),
      w({ kind: 'part', slot: 'rim', any: ['fivespoke', 'mesh', 'turbine', 'spinner'] }, 'racing rims'),
      w({ kind: 'part', slot: 'decal', any: ['stripes', 'checker', 'flames', 'lightning', 'number'] }, 'a racing stripe'),
    ],
    budget: 160, minLevel: 1,
    good: 'It looks fast standing still. That is the best kind of fast.',
    bad: 'A bike with no wing is just a bike. I wanted a lie I could be proud of.',
  },
  {
    id: 'brief-farmer', client: 'Hobb Turnipseed', look: { hat: 0xc9a227, shirt: 0x2e7d32, beard: 0xb0a090 },
    vehicle: 'ride-on', start: { paint: 0x2e7d32, extras: ['mudflaps'] },
    text: 'Big wheels, and the mudflaps stay. My Nan bolted those on and she is watching.',
    wants: [
      w({ kind: 'bigWheels' }, 'big wheels', 2),
      w({ kind: 'keep', slot: 'extras' }, 'mudflaps left alone', 2),
      w({ kind: 'part', slot: 'tyre', any: ['knobbly', 'fat', 'cart'] }, 'proper tyres'),
    ],
    budget: 130, minLevel: 1,
    good: 'Fine work. Nan nodded. She does not nod.',
    bad: 'Where are my mudflaps? Or the wheels? Or the point?',
  },
  {
    id: 'brief-invisible', client: 'Pip Wimblewick', look: { hat: 0x777777, shirt: 0x999999, beard: 0xcccccc },
    vehicle: 'push-bike', start: { paint: 0xf2c230, horn: 'kazoo', exhaust: 'twin' },
    text: 'Quiet. Please. Invisible to the Hat Watch. Grey, no noise, nothing that glows. I was never here.',
    wants: [
      w({ kind: 'quiet' }, 'quiet', 2),
      w({ kind: 'paint', hue: 'grey' }, 'grey', 2),
      w({ kind: 'keep', slot: 'underglow' }, 'no glow'),
    ],
    budget: 90, minLevel: 1,
    good: 'I cannot see it. Perfect. Do not tell anyone you did this.',
    bad: 'It is yellow. It has a kazoo. They will find me.',
  },
  {
    id: 'brief-sunday', client: 'Edna Clodworth', look: { hat: 0xf1f1ee, shirt: 0x8e44ad, beard: 0xeeeeee },
    vehicle: 'ride-on', start: { paint: 0x6b4a2f, finish: 'patina' },
    text: 'I only drive to chapel, dear. White paint, whitewall tyres, and nothing that would embarrass my sister.',
    wants: [
      w({ kind: 'paint', hue: 'white' }, 'white', 2),
      w({ kind: 'part', slot: 'tyre', any: ['whitewall'] }, 'whitewalls', 2),
      w({ kind: 'noPart', slot: 'spoiler' }, 'no spoiler, I am not a teenager'),
    ],
    budget: 120, minLevel: 1,
    good: 'Immaculate. My sister will be livid.',
    bad: 'Brown. On a Sunday. I shall pray for you.',
  },
  {
    id: 'brief-birthday', client: 'Tilly Buttonbright', look: { hat: 0xf2c230, shirt: 0xff7eb6, beard: 0xff9933 },
    vehicle: 'push-bike', start: { paint: 0x4a5d7a, finish: 'matte' },
    text: 'It is my nephew\'s birthday and he is nine. Yellow. Bunting. A bell. More bell than you think.',
    wants: [
      w({ kind: 'paint', hue: 'yellow' }, 'yellow', 2),
      w({ kind: 'extra', any: ['bunting'] }, 'bunting'),
      w({ kind: 'extra', any: ['bell', 'flag'] }, 'a bell or a flag'),
    ],
    budget: 140, minLevel: 1,
    good: 'He cried. Happy cried. Mostly.',
    bad: 'This is a bike. It has no party in it.',
  },
  {
    id: 'brief-funeral', client: 'Mortimer Gravelly', look: { hat: 0x1c1c22, shirt: 0x1c1c22, beard: 0xdddddd },
    vehicle: 'snail-coach', start: { paint: 0xf1f1ee },
    text: 'Respectful but fun. Black, naturally, with one little something. The dearly departed liked a flag.',
    wants: [
      w({ kind: 'paint', hue: 'black' }, 'black', 2),
      w({ kind: 'extra', any: ['flag', 'bunting', 'bell', 'fairylights', 'windsock'] }, 'one fun extra', 2),
      w({ kind: 'quiet' }, 'dignified, not loud'),
    ],
    budget: 100, minLevel: 2,
    good: 'Solemn. Tasteful. Slightly jaunty. He would have loved it.',
    bad: 'This is neither respectful nor fun. It is a hedge on wheels.',
  },
  {
    id: 'brief-better', client: 'Wilf Dunnock', look: { hat: 0x4a5d7a, shirt: 0xc8b6e2, beard: 0x999999 },
    vehicle: 'ride-on', start: { paint: 0x1f6feb, finish: 'gloss', tyre: 'slim', horn: 'squeak' },
    text: 'Exactly the same, but better. Keep the paint. I love the paint. Change everything else, I trust you.',
    wants: [w({ kind: 'keep', slot: 'paint' }, 'same paint', 2), w({ kind: 'changed', n: 3 }, 'better (three changes, at least)', 2)],
    budget: 200, minLevel: 2,
    good: 'Same car. Better car. I cannot explain it. Wonderful.',
    bad: 'You changed nothing. Or the paint. Or both. I am confused.',
  },
  {
    id: 'brief-bee', client: 'Nettle Honeyfoot', look: { hat: 0xf2c230, shirt: 0x1c1c22, beard: 0xf2c230 },
    vehicle: 'push-bike', start: { paint: 0x2e7d32, finish: 'matte' },
    text: 'The bees want a bike. They did not say that, but I can tell. Yellow, daisies, and a bee up front.',
    wants: [
      w({ kind: 'paint', hue: 'yellow' }, 'yellow', 2),
      w({ kind: 'part', slot: 'decal', any: ['daisies'] }, 'daisies'),
      w({ kind: 'part', slot: 'ornament', any: ['bee'] }, 'a bee'),
    ],
    budget: 150, minLevel: 2,
    good: 'The bees are pleased. They are circling.',
    bad: 'The bees have left. They took the good flowers.',
  },
  {
    id: 'brief-lowrider', client: 'Rico Marigold', look: { hat: 0xd8342c, shirt: 0xf2c230, beard: 0x1c1c22 },
    vehicle: 'lowrider', start: { paint: 0x777777, finish: 'primer' },
    text: 'Low, glowing, gold rims. Slow is a lifestyle. The Hat Watch can wave as I pass.',
    wants: [
      w({ kind: 'low' }, 'low', 2),
      w({ kind: 'glow' }, 'glowing', 2),
      w({ kind: 'paint', hue: 'yellow' }, 'gold'),
      w({ kind: 'part', slot: 'rim' }, 'rims'),
    ],
    budget: 320, minLevel: 3,
    good: 'It does not drive. It glides. Respect.',
    bad: 'It is not low. It is not glowing. It is just a car, mi amigo.',
  },
  {
    id: 'brief-wedding', client: 'Posy Larkspur-Quince', look: { hat: 0xf1f1ee, shirt: 0xf1f1ee, beard: 0xffffff },
    vehicle: 'snail-coach', start: { paint: 0x6b4a2f, finish: 'patina' },
    text: 'My daughter is marrying a hedgehog. White coach, a canopy over the happy couple, and bunting. Lots of bunting.',
    wants: [
      w({ kind: 'paint', hue: 'white' }, 'white', 2),
      w({ kind: 'part', slot: 'canopy' }, 'a canopy'),
      w({ kind: 'extra', any: ['bunting', 'fairylights'] }, 'bunting or fairy lights'),
    ],
    budget: 260, minLevel: 3,
    good: 'The hedgehog wept. Tears in his quills. Lovely.',
    bad: 'The coach looks like it has been through a divorce already.',
  },
  {
    id: 'brief-disco', client: 'Fennel Glitterbottom', look: { hat: 0x8e44ad, shirt: 0xff4fb0, beard: 0x5ef2ff },
    vehicle: 'ride-on', start: { paint: 0x4a5d7a, finish: 'matte' },
    text: 'Disco. Shiny finish, underglow, and a horn that announces me. I will be fashionably unsubtle.',
    wants: [
      w({ kind: 'finish', any: ['holo', 'glitter', 'chameleon', 'chrome'] }, 'a shiny finish', 2),
      w({ kind: 'glow' }, 'underglow', 2),
      w({ kind: 'loud' }, 'loud'),
    ],
    budget: 340, minLevel: 3,
    good: 'The dance floor parted. The lawn sprinklers synchronised.',
    bad: 'I do not see a disco. I see a Tuesday.',
  },
  {
    id: 'brief-mulch', client: 'Baron Humus Dredge', look: { hat: 0x6b4a2f, shirt: 0x2e7d32, beard: 0x3a2a1c },
    vehicle: 'mulch-spreader', start: { paint: 0xf05a24, finish: 'gloss', spoiler: 'ducktail' },
    text: 'Mulch brown. Big wheels, cowcatcher in front. The spoiler goes, a mulch spreader is not a hatchback.',
    wants: [
      w({ kind: 'paint', hue: 'brown' }, 'brown', 2),
      w({ kind: 'bigWheels' }, 'big wheels'),
      w({ kind: 'part', slot: 'bumper', any: ['cowcatcher'] }, 'a cowcatcher'),
      w({ kind: 'noPart', slot: 'spoiler' }, 'no spoiler'),
    ],
    budget: 250, minLevel: 4,
    good: 'A beast. I own two things now and it is both.',
    bad: 'It is still orange. I am considering a different mechanic.',
  },
  {
    id: 'brief-retired', client: 'Gilbert Tallyho', look: { hat: 0x1f6feb, shirt: 0xf1f1ee, beard: 0xdddddd },
    vehicle: 'zero-turn', start: { paint: 0x2e7d32, finish: 'gloss', steer: 'ship' },
    text: 'I raced in the Dirt Bowl in my day. Blue, a racing wheel, a spoiler, and low. Lower. Lower than that.',
    wants: [
      w({ kind: 'paint', hue: 'blue' }, 'blue', 2),
      w({ kind: 'part', slot: 'steer', any: ['racing'] }, 'a racing wheel'),
      w({ kind: 'part', slot: 'spoiler' }, 'a spoiler'),
      w({ kind: 'low' }, 'low'),
    ],
    budget: 220, minLevel: 4,
    good: 'The knees still hurt but the car does not. Bravo.',
    bad: 'This is a garden tractor in a hat. I raced better than this.',
  },
  {
    id: 'brief-mayor', client: 'Olive Cragsworth', look: { hat: 0x1c1c22, shirt: 0xd8342c, beard: 0x9e2a2b },
    vehicle: 'zero-turn', start: { paint: 0x6b4a2f, finish: 'primer' },
    text: 'A third coat, for the Mayor\'s other mower: candy red, with bunting. Official. Receipts will not be kept.',
    wants: [
      w({ kind: 'paint', hue: 'red' }, 'red', 2),
      w({ kind: 'finish', any: ['candy'] }, 'candy finish', 2),
      w({ kind: 'extra', any: ['bunting'] }, 'bunting'),
    ],
    budget: 220, minLevel: 5,
    good: 'The Mayor will not remember commissioning this. Fully deniable.',
    bad: 'This will not look good in the newsletter.',
  },
  {
    id: 'brief-high', client: 'Tobias Stiltwalker', look: { hat: 0x1d6b63, shirt: 0xf05a24, beard: 0x7dff6a },
    vehicle: 'ride-on', start: { paint: 0x777777, finish: 'primer' },
    text: 'High. Taller than the neighbours\' hedge. Big wheels, a spotlight, teal. I want to see over things.',
    wants: [
      w({ kind: 'high' }, 'high', 2),
      w({ kind: 'bigWheels' }, 'big wheels', 2),
      w({ kind: 'paint', hue: 'teal' }, 'teal'),
      w({ kind: 'part', slot: 'lamp', any: ['spotlight', 'bar'] }, 'a spotlight'),
    ],
    budget: 300, minLevel: 5,
    good: 'I can see Hat Watch HQ from here. They cannot see me. Marvellous.',
    bad: 'I am at ground level. I hate it here.',
  },
];

const STOCK_SLOTS: readonly PartSlot[] = ['tyre', 'rim', 'steer', 'lamp', 'grille', 'bumper', 'horn'];
const PART_SLOTS: readonly PartSlot[] = [
  'decal', 'tyre', 'rim', 'steer', 'lamp', 'spoiler', 'seat', 'ornament', 'grille', 'bumper', 'canopy', 'mirror', 'exhaust', 'horn',
];

/** The colour family of 0xRRGGBB. */
export function hueFamily(hex: number): HueFamily {
  const r = ((hex >> 16) & 255) / 255;
  const g = ((hex >> 8) & 255) / 255;
  const b = (hex & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (l < 0.18) return 'black';
  if (s < 0.15) return l > 0.8 ? 'white' : 'grey';
  let h = 0;
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  if (h >= 15 && h < 45 && l < 0.4) return 'brown';
  if (h < 15 || h >= 345) return 'red';
  if (h < 45) return 'orange';
  if (h < 70) return 'yellow';
  if (h < 160) return 'green';
  if (h < 190) return 'teal';
  if (h < 250) return 'blue';
  if (h < 290) return 'purple';
  return 'pink';
}

function isEmpty(slot: PartSlot, l: Loadout): boolean {
  const v = l[slot];
  return STOCK_SLOTS.includes(slot) ? v === 'stock' : v === 'none';
}

const sameExtras = (a: readonly string[], b: readonly string[]): boolean => [...a].sort().join(',') === [...b].sort().join(',');

/** Whether `final` meets `want` (start = the car as it arrived). */
export function wantMet(want: Want, start: Loadout, final: Loadout): boolean {
  switch (want.kind) {
    case 'paint': return hueFamily(final.paint) === want.hue;
    case 'finish': return want.any.includes(final.finish);
    case 'loud':
      return ['siren', 'trumpet', 'moo', 'kazoo'].includes(final.horn) || final.exhaust === 'trumpet' || final.exhaust === 'twin';
    case 'quiet': return (final.horn === 'stock' || final.horn === 'squeak') && final.exhaust === 'none';
    case 'glow': return final.underglow !== null;
    case 'low': return final.rideHeight <= -0.4;
    case 'high': return final.rideHeight >= 0.4;
    case 'bigWheels': return final.wheelSize >= 1.2;
    case 'part': return want.any ? want.any.includes(final[want.slot]) : !isEmpty(want.slot, final);
    case 'noPart': return isEmpty(want.slot, final);
    case 'extra': return final.extras.some((e) => want.any.includes(e));
    case 'keep':
      return want.slot === 'extras' ? sameExtras(start.extras, final.extras) : start[want.slot] === final[want.slot];
    case 'changed': {
      let n = 0;
      for (const s of PART_SLOTS) if (start[s] !== final[s]) n++;
      if (start.paint !== final.paint) n++;
      if (start.finish !== final.finish) n++;
      if (start.underglow !== final.underglow) n++;
      return n >= want.n;
    }
  }
}

/** Score a finished car. */
export function scoreBrief(brief: Brief, start: Loadout, final: Loadout, partsCost: number): BriefScore {
  const total = brief.wants.reduce((n, x) => n + x.weight, 0) || 1;
  const lines: string[] = [];
  let got = 0;
  for (const x of brief.wants) {
    const ok = wantMet(x.want, start, final);
    if (ok) got += x.weight;
    lines.push((ok ? '✓ ' : '✗ ') + x.says);
  }
  let raw = (100 * got) / total;
  const unchanged = sameLoadout(start, final);
  if (unchanged) {
    raw = Math.min(raw, 10);
    lines.push('You did nothing.');
  }
  const overBudget = Math.max(0, partsCost - brief.budget);
  const penalty = Math.min(40, (50 * overBudget) / brief.budget);
  let bonus = 0;
  if (partsCost < brief.budget / 2 && raw >= 80) {
    bonus = 5;
    lines.push('Cheap AND right.');
  }
  lines.push(overBudget > 0 ? `Over budget by ${overBudget} 🌰` : `Inside budget (${partsCost} of ${brief.budget} 🌰)`);
  const score = Math.max(0, Math.min(100, Math.round(raw - penalty + bonus)));
  return { score, stars: starsForScore(score), overBudget, lines };
}

/** Briefs open at a mechanic level. */
export function briefsForLevel(level: number): Brief[] { return BRIEFS.filter((b) => b.minLevel <= level); }

/** A seeded pick from briefsForLevel(level), never `lastId` when another is open. */
export function pickBrief(level: number, seed: number, lastId: string | null): Brief | null {
  const open = briefsForLevel(level).filter((b) => b.id !== lastId);
  const list = open.length ? open : briefsForLevel(level);
  return list.length ? list[Math.abs(Math.floor(seed)) % list.length] : null;
}
