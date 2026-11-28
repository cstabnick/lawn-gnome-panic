// Tuft hunting (docs/roadmaps/gta-hunting.md): the quarry table, where each species lives, the lodge and the tuning.
// Pure data. Animals never die or bleed in Turfton (R-021, R-049): a shot knocks the quarry over in a puff, and while it
// lies there a gnome with a Tuft License combs a tuft of fur or feather from it (sometimes a rarer keepsake); then it
// gets up and runs off. Tufts and keepsakes sell at the Tuft & Tally Lodge in Mossy Wood (ruling R-141).
// A debug trainer can spawn any species by id: hunting.spawn(id, x, z) (src/hunting/hunting.ts).
import type { RegionId } from '../levels';

export type SpeciesId =
  | 'hedgehog'
  | 'fox'
  | 'old-grizzle'
  | 'armadillo'
  | 'snow-hare'
  | 'mallard'
  | 'harvest-mouse'
  | 'pheasant'
  | 'deer';

/**
 * What a species does once fully alarmed:
 * - run: runs straight away from the gnome.
 * - zigzag: runs away, weaving left and right.
 * - roll: curls into a ball where it stands; shots bounce off until it uncurls.
 * - flush: flies up (to flyHeight) and away, then lands; can be shot in the air and drops.
 * - burrow: dives into the ground or grass; cannot be seen or hit until it pops up again.
 */
export type FleeStyle = 'run' | 'zigzag' | 'roll' | 'flush' | 'burrow';
/** Footprint shape drawn by the tracks (trackView.ts). */
export type PrintKind = 'paw' | 'bird' | 'drag';
/** When the species is out: 'night' ones hide (mode 'hidden') while night < 0.35, 'day' ones while night > 0.65. */
export type ActiveTime = 'day' | 'night' | 'always';

export interface HuntItem {
  /** Bag item id, unique across every species' tufts and keepsakes. */
  id: string;
  name: string;
  /** Acorns paid by the lodge for one. */
  price: number;
}

export interface HuntSpecies {
  id: SpeciesId;
  name: string;
  plural: string;
  region: RegionId;
  /** @lawn/prefabs id of the body. Pivots animated when present: body, head, tail, leg-0..leg-3, wing-0, wing-1. */
  prefab: string;
  scale: number;
  tint?: number;
  /** Hit and collision radius, world units (1 = a gnome's height). */
  radius: number;
  /** Hit height above its feet. */
  height: number;
  /** Speeds, units/s, and turn rate, radians/s. */
  walk: number;
  run: number;
  turn: number;
  /** Hears a running gnome (noise 1) within this many units; quieter gnomes must come closer (range = hear * noise). */
  hear: number;
  /** Sees a gnome within this many units, however quiet. */
  sight: number;
  style: FleeStyle;
  /** Seconds a flee (or roll, flight, burrow) lasts. */
  fleeSeconds: number;
  /** Seconds it lies knocked over after a shot: the window to comb it. */
  downTime: number;
  /** Colour of the puff when knocked over. */
  puff: number;
  /** Sound id (sounds.ts) of its call, played now and then near the player: a tracking cue. */
  call: string;
  /** Seconds between calls, [min, max]. */
  callEvery: readonly [number, number];
  /** Units walked between two footprints. */
  stride: number;
  print: PrintKind;
  printColor: number;
  active: ActiveTime;
  /** 'flush' species fly this high above the ground while fleeing. */
  flyHeight?: number;
  /** The common thing combed from it. */
  tuft: HuntItem & { color: number };
  /** The rare thing: a comb also yields this with probability `chance`. */
  keepsake: HuntItem & { chance: number; color: number };
  /** The one-of-a-kind quarry (Old Grizzle): its own achievement. */
  legendary?: boolean;
  /** Journal line before the first comb (where to look, how it behaves). */
  hint: string;
  /** Journal line after the first comb. */
  blurb: string;
}

export const SPECIES: readonly HuntSpecies[] = [
  {
    id: 'hedgehog', name: 'Bramble Hedgehog', plural: 'Bramble Hedgehogs', region: 'mossy-wood',
    prefab: 'hunt-hedgehog', scale: 1, radius: 0.35, height: 0.45, walk: 0.8, run: 3.2, turn: 3,
    hear: 14, sight: 6, style: 'roll', fleeSeconds: 6, downTime: 10, puff: 0x8a6a4a,
    call: 'hunt-hedgehog', callEvery: [5, 10], stride: 0.4, print: 'paw', printColor: 0x3b2a1a, active: 'always',
    tuft: { id: 'tuft-hedgehog', name: 'Hedgehog quill tuft', price: 10, color: 0x8a6a4a },
    keepsake: { id: 'keep-hedgehog', name: 'Shed silver quill', price: 45, chance: 0.15, color: 0xc8c8d0 },
    hint: 'Snuffles under the Mossy Wood pines. Curls into a ball when it hears you: wait for it to uncurl.',
    blurb: 'Rolls up at the first footstep and unrolls at the second thought. Its quills come away in a comb like burrs.',
  },
  {
    id: 'fox', name: 'Hedge Fox', plural: 'Hedge Foxes', region: 'mossy-wood',
    prefab: 'hunt-fox', scale: 1, radius: 0.5, height: 0.85, walk: 1.6, run: 9, turn: 4,
    hear: 30, sight: 16, style: 'run', fleeSeconds: 7, downTime: 7, puff: 0xd9661f,
    call: 'hunt-fox', callEvery: [6, 12], stride: 0.7, print: 'paw', printColor: 0x2e2016, active: 'always',
    tuft: { id: 'tuft-fox', name: 'Fox brush tuft', price: 22, color: 0xd9661f },
    keepsake: { id: 'keep-fox', name: 'White tail-tip', price: 90, chance: 0.12, color: 0xf4f1e8 },
    hint: 'Yips at the edges of the Mossy Wood clearings. Hears a running gnome a long way off: walk, then stand still.',
    blurb: 'Sharp ears, sharper opinions. A fox knocked over gets up looking as if it meant to lie down.',
  },
  {
    id: 'old-grizzle', name: 'Old Grizzle', plural: 'Old Grizzle', region: 'mossy-wood',
    prefab: 'hunt-badger', scale: 1.25, radius: 0.7, height: 0.9, walk: 1.0, run: 6, turn: 2,
    hear: 40, sight: 20, style: 'run', fleeSeconds: 10, downTime: 6, puff: 0xc8c8c8,
    call: 'hunt-badger', callEvery: [8, 16], stride: 0.8, print: 'paw', printColor: 0x1e1a16, active: 'night',
    tuft: { id: 'tuft-grizzle', name: "Grizzle's silver bristle", price: 150, color: 0xc8c8c8 },
    keepsake: { id: 'keep-grizzle', name: "Grizzle's white stripe lock", price: 400, chance: 0.35, color: 0xffffff },
    legendary: true,
    hint: 'Something big walks the far western tree-line after dark. The lodge says: go at night, go slowly.',
    blurb: 'A badger older than the Wood, grey to the tips. It grumbles when knocked over, and it remembers you.',
  },
  {
    id: 'armadillo', name: 'Dust Flats Armadillo', plural: 'Dust Flats Armadillos', region: 'dust-flats',
    prefab: 'armadillo', scale: 0.8, radius: 0.45, height: 0.55, walk: 0.9, run: 5, turn: 2.5,
    hear: 18, sight: 8, style: 'roll', fleeSeconds: 7, downTime: 8, puff: 0xa89279,
    call: 'hunt-armadillo', callEvery: [6, 12], stride: 0.5, print: 'drag', printColor: 0x8a6f4e, active: 'always',
    tuft: { id: 'tuft-armadillo', name: 'Shed shell scale', price: 14, color: 0xa89279 },
    keepsake: { id: 'keep-armadillo', name: 'Ringing band plate', price: 60, chance: 0.15, color: 0xd8c8a8 },
    hint: 'Digs in the Dust Flats sand, leaving a dragged trail. Rolls up hard when startled: shots ring off the shell.',
    blurb: 'A helm that walks about on its own. The scales it sheds ring like small bells when you tap them.',
  },
  {
    id: 'snow-hare', name: 'Fells Snow Hare', plural: 'Fells Snow Hares', region: 'frostbite-fells',
    prefab: 'hunt-snow-hare', scale: 1, radius: 0.35, height: 0.7, walk: 1.4, run: 11, turn: 7,
    hear: 26, sight: 14, style: 'zigzag', fleeSeconds: 6, downTime: 7, puff: 0xffffff,
    call: 'hunt-hare', callEvery: [7, 14], stride: 0.9, print: 'paw', printColor: 0x8fa3b8, active: 'always',
    tuft: { id: 'tuft-hare', name: 'Snow-hare fluff', price: 16, color: 0xf4f6fa },
    keepsake: { id: 'keep-hare', name: 'Lucky white tuft', price: 70, chance: 0.15, color: 0xffffff },
    hint: 'White on white in Frostbite Fells. Thumps the snow before it bolts, and never runs in a straight line.',
    blurb: 'Fast, white and contrary. The sgnowmes say a hare that zigzags is only trying to find the warm bit of the wind.',
  },
  {
    id: 'mallard', name: 'Loch Mallard', plural: 'Loch Mallards', region: 'loch-moss',
    prefab: 'hunt-mallard', scale: 1, radius: 0.35, height: 0.55, walk: 0.9, run: 7, turn: 3,
    hear: 22, sight: 12, style: 'flush', flyHeight: 5, fleeSeconds: 6, downTime: 7, puff: 0x3a7a4a,
    call: 'hunt-mallard', callEvery: [5, 10], stride: 0.35, print: 'bird', printColor: 0x4a5a3a, active: 'day',
    tuft: { id: 'tuft-mallard', name: 'Mallard down', price: 12, color: 0x9a8a6a },
    keepsake: { id: 'keep-mallard', name: 'Green speculum feather', price: 55, chance: 0.15, color: 0x2f8a5a },
    hint: 'Quacks along the Loch Moss shore by day. Flushes into the air when startled: shoot it on the wing.',
    blurb: 'A green head and a loud opinion. It lands on its feet after a knock, mostly out of pride.',
  },
  {
    id: 'harvest-mouse', name: 'Tallgrass Harvest Mouse', plural: 'Tallgrass Harvest Mice', region: 'tallgrass-commons',
    prefab: 'hunt-harvest-mouse', scale: 1, radius: 0.25, height: 0.35, walk: 1.8, run: 8, turn: 8,
    hear: 12, sight: 6, style: 'burrow', fleeSeconds: 8, downTime: 6, puff: 0xc98a4b,
    call: 'hunt-mouse', callEvery: [4, 9], stride: 0.3, print: 'paw', printColor: 0x5a4030, active: 'always',
    tuft: { id: 'tuft-mouse', name: 'Harvest-mouse whisker tuft', price: 9, color: 0xc98a4b },
    keepsake: { id: 'keep-mouse', name: 'Woven grass-ball nest', price: 50, chance: 0.15, color: 0xb8c46a },
    hint: 'Squeaks in the Tallgrass Commons. Small, quick, and gone into the grass before you see it twice.',
    blurb: 'It weaves a nest the size of a gnome\'s hat out of single blades, and it will not tell you how.',
  },
  {
    id: 'pheasant', name: 'Cloverfield Pheasant', plural: 'Cloverfield Pheasants', region: 'cloverfield-farms',
    prefab: 'hunt-pheasant', scale: 1, radius: 0.35, height: 0.65, walk: 1.1, run: 6.5, turn: 3,
    hear: 24, sight: 12, style: 'flush', flyHeight: 4, fleeSeconds: 5, downTime: 7, puff: 0xb5651d,
    call: 'hunt-pheasant', callEvery: [6, 12], stride: 0.4, print: 'bird', printColor: 0x4a3a2a, active: 'day',
    tuft: { id: 'tuft-pheasant', name: 'Pheasant tail feather', price: 18, color: 0xb5651d },
    keepsake: { id: 'keep-pheasant', name: 'Copper neck feather', price: 75, chance: 0.12, color: 0xc87533 },
    hint: 'Struts the Cloverfield hedgerows by day and calls like a creaky gate. Bursts into the air when you get close.',
    blurb: 'All tail and no patience. The farmers say a pheasant is a hen that read one book about itself.',
  },
  {
    id: 'deer', name: 'Trellisdown Red Deer', plural: 'Trellisdown Red Deer', region: 'west-estates',
    prefab: 'deer-hind', scale: 1, radius: 0.7, height: 1.6, walk: 1.1, run: 9.5, turn: 3,
    hear: 34, sight: 18, style: 'run', fleeSeconds: 9, downTime: 7, puff: 0xa8743f,
    call: 'hunt-deer', callEvery: [8, 16], stride: 0.9, print: 'paw', printColor: 0x3a2a1a, active: 'always',
    tuft: { id: 'tuft-deer', name: 'Red-deer winter tuft', price: 26, color: 0xa8743f },
    keepsake: { id: 'keep-deer', name: 'Shed antler tine', price: 110, chance: 0.12, color: 0xe8dcc0 },
    hint: 'Grazes the empty Trellisdown pasture west of the vineyard at dawn and dusk. Barks once and is gone: come up slowly, downwind, on foot.',
    blurb: 'Tall, red and polite about it. A deer knocked over stands up, looks at you as if you had trodden on a row, and leaves.',
  },
];

export const SPECIES_BY_ID: Readonly<Record<SpeciesId, HuntSpecies>> = Object.fromEntries(
  SPECIES.map((s) => [s.id, s]),
) as Record<SpeciesId, HuntSpecies>;

/** The species with this id, or undefined (for the debug trainer and saves, which pass plain strings). */
export function speciesById(id: string): HuntSpecies | undefined {
  return (SPECIES_BY_ID as Record<string, HuntSpecies | undefined>)[id];
}

/** Where quarry lives. (x, z) is nudged to the nearest open spot in the species' region (critters.ts openSpot). */
export interface HuntSpot {
  species: SpeciesId;
  x: number;
  z: number;
  count: number;
  /** Members start within this radius of the spot. */
  spread: number;
  /** Members wander up to this far from the spot. */
  leash: number;
}

export const HUNT_SPOTS: readonly HuntSpot[] = [
  { species: 'hedgehog', x: -470, z: 80, count: 4, spread: 10, leash: 35 },
  { species: 'hedgehog', x: -300, z: -130, count: 3, spread: 10, leash: 35 },
  { species: 'fox', x: -640, z: 60, count: 2, spread: 8, leash: 60 },
  { species: 'fox', x: -420, z: -160, count: 2, spread: 8, leash: 60 },
  { species: 'old-grizzle', x: -835, z: 10, count: 1, spread: 0, leash: 40 },
  { species: 'armadillo', x: 430, z: 140, count: 4, spread: 12, leash: 40 },
  { species: 'armadillo', x: 560, z: -160, count: 3, spread: 12, leash: 40 },
  { species: 'snow-hare', x: -90, z: -500, count: 4, spread: 12, leash: 50 },
  { species: 'snow-hare', x: 130, z: -640, count: 3, spread: 12, leash: 50 },
  { species: 'mallard', x: -520, z: -520, count: 5, spread: 10, leash: 30 },
  { species: 'harvest-mouse', x: -560, z: 560, count: 5, spread: 10, leash: 30 },
  { species: 'harvest-mouse', x: -700, z: 700, count: 3, spread: 10, leash: 30 },
  { species: 'pheasant', x: 170, z: 520, count: 4, spread: 10, leash: 40 },
  { species: 'pheasant', x: -120, z: 640, count: 3, spread: 10, leash: 40 },
  { species: 'deer', x: -1290, z: -440, count: 3, spread: 12, leash: 60 },
  { species: 'deer', x: -1240, z: -840, count: 3, spread: 12, leash: 60 },
];

/** Tuning. Distances in world units (1 = a gnome's height), times in seconds. */
export const HUNT = {
  /** Acorns for a Tuft License at the lodge. */
  licensePrice: 120,
  /** Items (tufts + keepsakes) the game bag holds. */
  bagSize: 20,
  /** An on-foot gnome this close to a knocked-over quarry may comb it. */
  combRange: 2.6,
  /** A combed quarry cannot be combed again for this long. */
  recombSeconds: 150,
  /** A gunshot alarms every quarry within this distance of the shooter. */
  shotAlert: 45,
  /** Quarry farther than this from the player does not move. */
  simRadius: 260,
  /** Quarry meshes are built and shown within this distance. */
  meshRadius: 140,
  /** Legs and heads animate within this distance. */
  animRadius: 70,
  /** Footprints fade out after this many seconds. */
  trackLife: 90,
  /** Footprints are drawn within this distance of the player. */
  trackRadius: 60,
  /** Most footprints kept at once (oldest dropped first). */
  maxPrints: 500,
  /** Calls are played within this distance of the player. */
  callRadius: 90,
  /** A knock-down from at least this far is a long shot (achievement). */
  longShot: 60,
  /** Awareness at which a quarry stops and stares (mode 'wary'); 1 = alarmed. */
  wary: 0.45,
  /** A tracking hint names prints within this distance of the player. */
  hintRange: 3.5,
  /** Quarry moves only where a circle this much wider than its radius is open land (keeps it off roads and verges). */
  roadMargin: 2,
  /** Spawn spots need this much extra clearance (no quarry ever spawns on or beside a road). */
  spawnMargin: 6,
} as const;

/** The Tuft & Tally Lodge, Mossy Wood: a log cabin by the west road, front (and Hazel's counter) facing +z (yaw 0). */
export const LODGE = {
  x: -548,
  z: -52,
  yaw: 0,
  /** log-cabin prefab scale (the prefab is 2.33 x 1.67 x ~1.5 at scale 1). */
  scale: 4,
  name: 'The Tuft & Tally Lodge',
  keeper: 'Hazel Mattock',
  blip: '#7a9a3a',
} as const;

/** Achievement ids (packages/achievements/src/catalog.ts). */
export const HUNT_ACHIEVEMENTS = {
  /** Comb your first tuft. */
  firstTuft: 'gta-first-tuft',
  /** Sell 25 tufts and keepsakes at the lodge (target 25). */
  trader: 'gta-tuft-trader',
  /** Comb every species in the journal. */
  fieldGuide: 'gta-field-guide',
  /** Comb Old Grizzle. */
  oldGrizzle: 'gta-old-grizzle',
  /** Knock a quarry over from HUNT.longShot or farther. */
  longShot: 'gta-patient-eye',
} as const;
