// Fishing: every species, the hot spots, and what a catch card is worth. Data only (docs/roadmaps/gta-fishing.md).
// Fish are never hurt: each is landed on a nibble-clip, measured, carded and let go.
import type { FishSpecies, FishSpot } from './types';

/** Hot spots (checked in water by fishing tests). Mythic fish live at one each. */
export const FISH_SPOTS: readonly FishSpot[] = [
  { id: 'loch-reeds', name: 'Reedwatch Shallows', x: -700, z: -585, water: 'loch' },
  { id: 'loch-deep', name: 'The Loch Deeps', x: -700, z: -690, water: 'loch' },
  { id: 'loch-east', name: 'Steamer Bay', x: -580, z: -700, water: 'loch' },
  { id: 'canal-lock', name: 'Lock Pool', x: -60, z: 230, water: 'canal' },
  { id: 'canal-east', name: 'Industrial Reach', x: 100, z: 230, water: 'canal' },
  { id: 'ravine-pool', name: 'Ravine Pool', x: -550, z: -260, water: 'river' },
  { id: 'fells-run', name: 'Frostfin Run', x: -260, z: -500, water: 'river' },
  { id: 'farm-bend', name: 'Sluice Bend', x: 330, z: 460, water: 'river' },
  { id: 'sea-shallows', name: 'Puddle Shallows', x: 600, z: 785, water: 'sea' },
  { id: 'sea-deep', name: 'Far Puddle', x: 690, z: 840, water: 'sea' },
];

export const FISH_SPECIES: readonly FishSpecies[] = [
  // ---- Loch Moss ----------------------------------------------------------------------------------------------------
  {
    id: 'fish-mossback-trout', name: 'Mossback Trout', rarity: 'common', size: [20, 45], waters: ['loch'],
    times: { Dawn: 1.5, Dusk: 1.5 }, baits: { 'sock-fly': 2 }, fight: 'steady', difficulty: 1, minRod: 0, value: 6,
    prefab: 'fish-mossback-trout', blurb: 'Grows a little green on its back from lying so still. Slow to start, quick to sulk.',
  },
  {
    id: 'fish-stripy-perch', name: 'Stripy Perch', rarity: 'common', size: [12, 35], waters: ['loch', 'canal'],
    baits: { 'glitter-spinner': 1.8, 'acorn-crumb': 1.3 }, weather: { rain: 1.5 }, fight: 'darter', difficulty: 1, minRod: 0, value: 5,
    prefab: 'fish-stripy-perch', blurb: 'Wears its stripes like a referee and argues every call.',
  },
  {
    id: 'fish-glen-char', name: 'Glen Char', rarity: 'uncommon', size: [22, 50], waters: ['loch'],
    times: { Dawn: 2, Morning: 1.4, Noon: 0.5 }, weather: { mist: 2.5 }, fight: 'steady', difficulty: 2, minRod: 0,
    value: 12, prefab: 'fish-glen-char', blurb: 'Only comes up when the mist is down, as if it hates being looked at.',
  },
  {
    id: 'fish-hedge-pike', name: 'Hedge-Toothed Pike', rarity: 'rare', size: [50, 110], waters: ['loch', 'canal'],
    baits: { 'glitter-spinner': 3, dough: 0.3 }, times: { 'Golden Hour': 1.5 }, fight: 'thrasher', difficulty: 4,
    minRod: 1, value: 30, prefab: 'fish-hedge-pike', blurb: 'A grin like a garden fork. It only grins; it has never bitten anyone.',
  },
  {
    id: 'fish-ribbon-eel', name: 'Ribbon Eel', rarity: 'uncommon', size: [40, 90], waters: ['loch', 'river'],
    times: { 'Neon Night': 3, Dusk: 1.5, Noon: 0.2 }, baits: { 'cheese-rind': 2 }, fight: 'sulker', difficulty: 3,
    minRod: 0, value: 14, prefab: 'fish-ribbon-eel', blurb: 'Ties itself in a bow when landed, then waits politely to be untied.',
  },
  {
    id: 'fish-old-mossjaw', name: 'Old Mossjaw', rarity: 'mythic', size: [180, 260], waters: ['loch'], spot: 'loch-deep',
    times: { 'Neon Night': 2, Dawn: 1.5, Noon: 0.3 }, weather: { mist: 2 }, baits: { 'moon-jig': 4, dough: 0.2 },
    fight: 'sulker', difficulty: 5, minRod: 3, value: 220, prefab: 'fish-old-mossjaw',
    blurb: 'Older than the Steamer, mossier than the hills. Tessie nods to it. It nods back.',
  },
  // ---- Rivers (the Upper River, the Ravine, the farm river) ---------------------------------------------------------
  {
    id: 'fish-rainbow-flicker', name: 'Rainbow Flicker', rarity: 'common', size: [18, 40], waters: ['river'],
    baits: { 'sock-fly': 2.2 }, times: { Morning: 1.4 }, fight: 'darter', difficulty: 2, minRod: 0, value: 6,
    prefab: 'fish-rainbow-flicker', blurb: 'Every colour of a dropped crayon box, and just as hard to keep hold of.',
  },
  {
    id: 'fish-pebble-loach', name: 'Pebble Loach', rarity: 'common', size: [6, 15], waters: ['river', 'canal'],
    baits: { dough: 1.5, 'acorn-crumb': 1.5 }, weather: { rain: 2.2 }, fight: 'steady', difficulty: 1, minRod: 0, value: 4,
    prefab: 'fish-pebble-loach', blurb: 'Looks exactly like a pebble until the pebble swims off.',
  },
  {
    id: 'fish-ravine-grayling', name: 'Lady of the Ravine', rarity: 'uncommon', size: [25, 45], waters: ['river'],
    regions: ['mossy-wood'], baits: { 'sock-fly': 2 }, fight: 'darter', difficulty: 3, minRod: 0, value: 14,
    prefab: 'fish-ravine-grayling', blurb: 'A grayling with a sail for a fin and the manners of a duchess.',
  },
  {
    id: 'fish-leaping-salmon', name: 'Leaping Salmon', rarity: 'rare', size: [45, 90], waters: ['river'],
    times: { Dawn: 2, Dusk: 2, Noon: 0.5 }, fight: 'runner', difficulty: 4, minRod: 1, value: 32,
    prefab: 'fish-leaping-salmon', blurb: 'Swims upstream on principle. Has strong opinions about weirs.',
  },
  {
    id: 'fish-frostfin', name: 'Frostfin', rarity: 'uncommon', size: [20, 40], waters: ['river'],
    regions: ['frostbite-fells'], weather: { snow: 2 }, fight: 'steady', difficulty: 2, minRod: 0, value: 13,
    prefab: 'fish-frostfin', blurb: 'Fins as clear as icicles. Feels cold even through mittens.',
  },
  {
    id: 'fish-gudgeon', name: 'Gudgeon', rarity: 'common', size: [8, 18], waters: ['river', 'canal'],
    baits: { dough: 1.4 }, weather: { rain: 1.8 }, fight: 'steady', difficulty: 1, minRod: 0, value: 4,
    prefab: 'fish-gudgeon', blurb: 'Will bite anything, twice. The first fish of every gnome who ever held a rod.',
  },
  // ---- The Southern Drainage Canal ----------------------------------------------------------------------------------
  {
    id: 'fish-redeye-roach', name: 'Redeye Roach', rarity: 'common', size: [12, 30], waters: ['canal'],
    baits: { 'acorn-crumb': 1.8 }, fight: 'darter', difficulty: 1, minRod: 0, value: 5,
    prefab: 'fish-redeye-roach', blurb: 'Red eyes from staying up late listening to Subsoil Radio.',
  },
  {
    id: 'fish-trolley-carp', name: 'Trolley Carp', rarity: 'uncommon', size: [35, 70], waters: ['canal'],
    baits: { 'cheese-rind': 2.5, dough: 1.2 }, fight: 'sulker', difficulty: 3, minRod: 0, value: 15,
    prefab: 'fish-trolley-carp', blurb: 'Lives in a sunken shopping trolley and pushes it round the canal at night.',
  },
  {
    id: 'fish-doctor-tench', name: 'Doctor Tench', rarity: 'rare', size: [30, 60], waters: ['canal'],
    times: { 'Golden Hour': 2.5, Dusk: 1.5, Noon: 0.4 }, baits: { 'cheese-rind': 1.6 }, fight: 'sulker', difficulty: 3,
    minRod: 1, value: 28, prefab: 'fish-doctor-tench', blurb: 'Old gnomes swear its slime mends chipped glaze. The Glaze Clinic says no.',
  },
  {
    id: 'fish-whiskers-mcgill', name: 'Whiskers McGill', rarity: 'rare', size: [60, 120], waters: ['canal'],
    times: { 'Neon Night': 3, Dusk: 1.3, Morning: 0.3, Noon: 0.2 }, baits: { 'cheese-rind': 2.5 }, fight: 'thrasher',
    difficulty: 4, minRod: 2, value: 35, prefab: 'fish-whiskers-mcgill', blurb: 'A catfish with a moustache to make a mayor jealous.',
  },
  {
    id: 'fish-wellington-bootfish', name: 'Wellington Bootfish', rarity: 'uncommon', size: [20, 35], waters: ['canal'],
    fight: 'steady', difficulty: 2, minRod: 0, value: 11, prefab: 'fish-wellington-bootfish',
    blurb: 'Lives in an old green boot and brings it along when caught. The boot is not for sale.',
  },
  {
    id: 'fish-gilded-koi', name: 'The Gilded Koi', rarity: 'mythic', size: [70, 110], waters: ['canal'], spot: 'canal-lock',
    times: { 'Golden Hour': 4, Noon: 0.4, 'Neon Night': 0.3 }, baits: { 'moon-jig': 3, 'glitter-spinner': 1.5 },
    fight: 'darter', difficulty: 5, minRod: 2, value: 180, prefab: 'fish-gilded-koi',
    blurb: "Escaped from Baroness Brenda's ornamental pond, or says it did. Shines like a new Acorn.",
  },
  // ---- The Puddle Sea -----------------------------------------------------------------------------------------------
  {
    id: 'fish-stripe-mackerel', name: 'Stripe Mackerel', rarity: 'common', size: [20, 40], waters: ['sea'],
    baits: { 'glitter-spinner': 2 }, times: { Morning: 1.4 }, fight: 'darter', difficulty: 2, minRod: 0, value: 6,
    prefab: 'fish-stripe-mackerel', blurb: 'Travels in a crowd and always thinks it is in front.',
  },
  {
    id: 'fish-lopsided-flounder', name: 'Lopsided Flounder', rarity: 'common', size: [18, 40], waters: ['sea'],
    baits: { dough: 1.3, 'cheese-rind': 1.3 }, fight: 'sulker', difficulty: 1, minRod: 0, value: 5,
    prefab: 'fish-lopsided-flounder', blurb: 'Both eyes on one side, so it only ever sees half the joke.',
  },
  {
    id: 'fish-grumbling-gurnard', name: 'Grumbling Gurnard', rarity: 'uncommon', size: [20, 45], waters: ['sea'],
    fight: 'thrasher', difficulty: 2, minRod: 0, value: 12, prefab: 'fish-grumbling-gurnard',
    blurb: 'Croaks like a frog when landed. It is complaining, and it is right.',
  },
  {
    id: 'fish-silver-bass', name: 'Silver Bass', rarity: 'rare', size: [40, 80], waters: ['sea'],
    times: { Dusk: 1.8, Dawn: 1.5 }, baits: { 'glitter-spinner': 2.2 }, fight: 'runner', difficulty: 4, minRod: 1,
    value: 30, prefab: 'fish-silver-bass', blurb: 'Bright as a polished spoon and twice as hard to put away.',
  },
  {
    id: 'fish-puddle-sunfish', name: 'Puddle Sunfish', rarity: 'rare', size: [60, 130], waters: ['sea'],
    times: { Noon: 3, Morning: 1.5, 'Neon Night': 0.1 }, fight: 'sulker', difficulty: 3, minRod: 2, value: 34,
    prefab: 'fish-puddle-sunfish', blurb: 'Flat as a dinner plate, round as a full moon, and asleep half the time.',
  },
  {
    id: 'fish-driftwoods-shark', name: "Driftwood's Shark", rarity: 'mythic', size: [150, 240], waters: ['sea'],
    spot: 'sea-deep', times: { 'Neon Night': 3, Dusk: 1.5, Noon: 0.3 }, baits: { 'moon-jig': 4, 'cheese-rind': 1.5 },
    fight: 'runner', difficulty: 5, minRod: 3, value: 240, prefab: 'fish-driftwoods-shark',
    blurb: 'Driftwood was right all along. It is very large, very gentle, and mostly interested in cheese.',
  },
];

const BY_ID = new Map(FISH_SPECIES.map((s) => [s.id, s]));

export function fishById(id: string): FishSpecies | undefined {
  return BY_ID.get(id);
}

export function spotById(id: string): FishSpot | undefined {
  return FISH_SPOTS.find((s) => s.id === id);
}

/** Acorns a catch card of `s` at `size` cm fetches: value * (0.6 .. 1.4) across the size range, at least 1. */
export function catchValue(s: FishSpecies, size: number): number {
  const span = Math.max(1, s.size[1] - s.size[0]);
  const f = Math.min(1, Math.max(0, (size - s.size[0]) / span));
  return Math.max(1, Math.round(s.value * (0.6 + 0.8 * f)));
}
