// The sky-banner adverts (docs/lore/entries/apocrypha/sky-sign-banner-tow.md). Two funny ads per Turfton brand (brands.ts),
// plus a few Easter eggs. Plain data, no three.js, no DOM.
import type { AdDef } from './types';
import { SKY } from './config';

/** Non-egg ads: two per BrandId (16 brands). */
const READABLE: readonly AdDef[] = [
  // Buck-Iron: green-and-gold tractors. Rival Razor-Back.
  { id: 'buck-iron-1', brand: 'buck-iron', headline: 'NOTHING RUNS LIKE A BUCK', tagline: 'Until you take the keys. Ask Razor-Back.' },
  { id: 'buck-iron-2', brand: 'buck-iron', headline: 'MOWS STRAIGHT. ALWAYS.', tagline: 'Razor-Back still turning. Buck still parked.' },
  // Razor-Back: orange zero-turns. Rival Buck-Iron.
  { id: 'razor-back-1', brand: 'razor-back', headline: 'ZERO TURNING RADIUS', tagline: 'Zero regrets. Some turning. Ask Buck-Iron.' },
  { id: 'razor-back-2', brand: 'razor-back', headline: 'STILL TURNING SINCE TUESDAY', tagline: 'Please do not ask the mower to stop.' },
  // Husky-Blade: loud two-strokes.
  { id: 'husky-blade-1', brand: 'husky-blade', headline: 'WAKE THE TALL ONES', tagline: 'Husky-Blade. Two-stroke. Zero apologies.' },
  { id: 'husky-blade-2', brand: 'husky-blade', headline: 'YOUR NEIGHBOUR HATES THIS', tagline: 'Illegal exhaust kits at Side-Valve Salvage.' },
  // Black Dew: 87 octane, 100% unlicensed.
  { id: 'black-dew-1', brand: 'black-dew', headline: '87 OCTANE. 100% UNLICENSED.', tagline: 'Keep away from sparks and from HOA patrols.' },
  { id: 'black-dew-2', brand: 'black-dew', headline: 'REFINED FROM COMPOST', tagline: 'Refined from compost. Tastes of compost.' },
  // Stink-Gro: fast growth, dubious smell. Rival Pure-Loam.
  { id: 'stink-gro-1', brand: 'stink-gro', headline: 'GROW BY THURSDAY', tagline: "Don't ask how. Don't ask Pure-Loam." },
  { id: 'stink-gro-2', brand: 'stink-gro', headline: 'EXPENSIVE MUD? NO THANKS.', tagline: 'Stink-Gro. Fast, cheap, smells like Thursday.' },
  // Pure-Loam Co-op: no chemicals, no engines.
  { id: 'pure-loam-1', brand: 'pure-loam', headline: 'NO CHEMICALS. NO ENGINES.', tagline: 'Just dirt. Organic dirt. Mossy Wood dirt.' },
  { id: 'pure-loam-2', brand: 'pure-loam', headline: 'THE MULCH IS THE MESSAGE', tagline: 'Zero Stink-Gro runoff. Mostly zero joy.' },
  // Acorn-Cola: the Hat Watch softball sponsor. Rival Dandelion Fizz.
  { id: 'acorn-cola-1', brand: 'acorn-cola', headline: 'CRACK A SMILE', tagline: "Not your hat. The Hat Watch's favourite." },
  { id: 'acorn-cola-2', brand: 'acorn-cola', headline: 'ZERO POLLEN. ALL FIZZ.', tagline: "The Hat Watch's softball sponsor. Zero pollen." },
  // Dandelion Fizz: pollen and bad decisions. Rival Acorn-Cola.
  { id: 'dandelion-fizz-1', brand: 'dandelion-fizz', headline: '110% DAILY VALUE OF POLLEN', tagline: 'And bad decisions. Both are included.' },
  { id: 'dandelion-fizz-2', brand: 'dandelion-fizz', headline: 'FUEL OF MIDNIGHT RACES', tagline: 'Midnight Zero-Turn races. Hats not included.' },
  // Chirp & Crumb: bakery, birdseed crust.
  { id: 'chirp-and-crumb-1', brand: 'chirp-and-crumb', headline: 'HARD ENOUGH TO PATCH A WALL', tagline: 'Freshly baked since 4:00 AM. Still stale.' },
  { id: 'chirp-and-crumb-2', brand: 'chirp-and-crumb', headline: '100% BIRDSEED CRUST', tagline: 'No unauthorized food trucks. Pigeons approve.' },
  // Clay-Mart: discount superstore.
  { id: 'clay-mart-1', brand: 'clay-mart', headline: 'EVERYTHING UNDER ONE ROOF', tagline: 'Plastic flamingos. Budget umbrellas. Hats.' },
  { id: 'clay-mart-2', brand: 'clay-mart', headline: 'UPSIDE-DOWN TUPPERWARE', tagline: 'Giant, bright, and somehow never on sale.' },
  // Thorne Lawn & Order: HOA enforcement.
  { id: 'thorne-lawn-1', brand: 'thorne-lawn', headline: 'UNIFORMITY IS PEACE', tagline: 'Peace is mandatory. Lawns fined on sight.' },
  { id: 'thorne-lawn-2', brand: 'thorne-lawn', headline: 'HOA COMPLIANCE, FROM ABOVE', tagline: 'Code Enforcement. We can see your hedge.' },
  // Pay 'n' Glaze: paint shop.
  { id: 'pay-n-glaze-1', brand: 'pay-n-glaze', headline: 'NEW COAT. WHO DIS?', tagline: 'Fresh glaze in 5 seconds. No questions asked.' },
  { id: 'pay-n-glaze-2', brand: 'pay-n-glaze', headline: 'FRESH GLAZE IN 5 SECONDS', tagline: 'No questions. Receipt optional.' },
  // Kiln-Shield Insurance: covers almost everything.
  { id: 'kiln-shield-1', brand: 'kiln-shield', headline: 'WE COVER CHIPS & CRACKS', tagline: "And acts of mower. Not crop dusters." },
  { id: 'kiln-shield-2', brand: 'kiln-shield', headline: 'PIP POTSWORTH NOT INCLUDED', tagline: 'Excludes Fort Sandpit, Crop Dusters and Pip.' },
  // Snail-Mail Express: slow, unionized. Rival Pigeon-Drop.
  { id: 'snail-mail-1', brand: 'snail-mail', headline: 'EVENTUALLY IS ON TIME', tagline: 'Unionized and proud. Your mailbox survives.' },
  { id: 'snail-mail-2', brand: 'snail-mail', headline: 'SLOW IS A FEATURE', tagline: 'Unlike Pigeon-Drop, your mailbox survives.' },
  // Pigeon-Drop Couriers: fast, from altitude. Rival Snail-Mail.
  { id: 'pigeon-drop-1', brand: 'pigeon-drop', headline: 'DROPPED FROM ALTITUDE', tagline: 'Good luck. Faster than Snail-Mail, probably.' },
  { id: 'pigeon-drop-2', brand: 'pigeon-drop', headline: 'FASTER THAN SNAIL-MAIL!', tagline: 'Not liable for flattened Cloverfield mailboxes.' },
  // Ammu-Gnation: gun shop.
  { id: 'ammu-gnation-1', brand: 'ammu-gnation', headline: 'THE GUN IS FREE', tagline: 'The shiny bits are not. Bolt-ons by the acorn.' },
  { id: 'ammu-gnation-2', brand: 'ammu-gnation', headline: 'BOLT-ONS BY THE ACORN', tagline: 'Not liable for kazoo-related embarrassment.' },
];

/** Easter eggs: rare, not counted for Captive Audience. */
const EGGS: readonly AdDef[] = [
  { id: 'egg-dorrie-proposal', brand: 'chirp-and-crumb', headline: 'BERNICE, MARRY ME?', tagline: 'Circle loop three. Love, Dorrie Throttle.', egg: true },
  { id: 'egg-wally-stall', brand: 'dandelion-fizz', headline: "STALL SPEED'S 22, KID", tagline: 'Wind-Sock Wally, end of the Desert Airfield.', egg: true },
];

export const SKY_ADS: readonly AdDef[] = [...READABLE, ...EGGS];
export const READABLE_AD_COUNT = 32;

/** The next ad to show: never the same as `prevId`; an egg with SKY.eggChance. */
export function nextAd(prevId: string | null, rng: () => number): AdDef {
  const pool = rng() < SKY.eggChance ? EGGS : READABLE;
  const choices = pool.filter((a) => a.id !== prevId);
  const list = choices.length > 0 ? choices : pool;
  const i = Math.min(list.length - 1, Math.floor(rng() * list.length));
  return list[i];
}
