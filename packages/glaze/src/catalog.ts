// The Pay 'n' Glaze catalogue: every shelf, every product, its lore name and its price in Acorns. Pure data.
// Prefab ids follow `glaze-<slot>-<id>`; `prefab` is absent where the product is drawn in code (finishes, sprays) or is "stock" (leave the vehicle alone).
// A product's prefab is built by packages/prefabs/src/catalog/gta-glaze-*.ts; catalog.test.ts checks every `prefab` exists.
import type { ModDef, SlotId } from './types';

const m = (slot: SlotId, id: string, name: string, blurb: string, price: number, withPrefab = true): ModDef => ({
  id, slot, name, blurb, price, ...(withPrefab ? { prefab: `glaze-${slot}-${id}` } : {}),
});

export const FINISHES: readonly ModDef[] = [
  m('finish', 'gloss', 'Kiln Gloss', 'The factory shine. Fired twice, polished once.', 0, false),
  m('finish', 'matte', 'Dust-Bowl Matte', 'No shine at all. Draws no attention, which is the point.', 30, false),
  m('finish', 'metallic', 'Mica-Flake Metallic', 'Flecks of crushed mica that wink at the sun.', 60, false),
  m('finish', 'pearl', 'Snail-Trail Pearl', 'A slow, pearly sheen, harvested at dawn.', 80, false),
  m('finish', 'candy', 'Candy-Apple Lacquer', 'Deep, wet colour. Looks edible. Do not lick it.', 90, false),
  m('finish', 'chameleon', 'Chameleon Beetle-Shift', 'Changes colour as you walk round it. Gnomes have lost bets over the real colour.', 150, false),
  m('finish', 'primer', 'Primer Grey, VIN Off', 'Flat undercoat. Nobody can say what the number was.', 10, false),
];

export const DECALS: readonly ModDef[] = [
  m('decal', 'flames', 'Flame-Job Aerosol', 'Licking flames along both flanks and across the hood.', 60, false),
  m('decal', 'stripes', 'Twin Racing Stripes', 'Two bold bars from nose to tail. Adds a little speed to the look.', 40, false),
  m('decal', 'checker', 'Chequered Chaser', 'A band of black-and-white squares. Hat Watch dislike it on principle.', 50, false),
  m('decal', 'stars', 'Starry Mulch', 'A scatter of stars, like a very small night sky.', 45, false),
  m('decal', 'camo', 'Mulch Camo', 'Blotches of bark and leaf. Vanish into any hedge.', 55, false),
  m('decal', 'lightning', 'Thunder-Bolt Stencil', 'A jagged bolt down each side. Smells of rain.', 55, false),
  m('decal', 'number', 'Lucky Number', 'A big racing number on each flank. Pick your own.', 35, false),
  m('decal', 'hats', 'Hat Repeat', 'Rows of little pointed hats, all the way round.', 50, false),
  m('decal', 'daisies', 'Daisy Chain', 'A cheerful chain of daisies. Entirely harmless-looking.', 40, false),
  m('decal', 'drip', 'Glaze Drip', 'Paint that appears to be sliding down the doors. It is not. Probably.', 45, false),
];

export const TYRES: readonly ModDef[] = [
  m('tyre', 'stock', 'Stock Rubber', 'The tyres it left the shed on.', 0),
  m('tyre', 'fat', 'Pudgy Puffers', 'Wide, round and squishy. Float over anything.', 70),
  m('tyre', 'slim', 'Skinny Sprinters', 'Thin as a ribbon. Built for show-offs and downhills.', 50),
  m('tyre', 'whitewall', 'Whitewall Wafers', 'A neat white ring round each tyre. Very Sunday.', 60),
  m('tyre', 'knobbly', 'Mud-Grub Knobbies', 'Chunky tread, ready for any flowerbed.', 65),
  m('tyre', 'cart', 'Wagon-Spoke Hoops', 'Old wooden cart wheels with iron hoops. Bumpy and proud.', 85),
  m('tyre', 'saucer', 'Flying Saucers', 'Flat, wide discs. Nobody can say how they grip.', 95),
];

export const RIMS: readonly ModDef[] = [
  m('rim', 'stock', 'Stock Steel', 'Plain pressed-steel rims.', 0),
  m('rim', 'fivespoke', 'Five-Spoke Stars', 'Five clean spokes. A classic.', 60),
  m('rim', 'mesh', 'Chicken-Wire Mesh', 'A fine criss-cross web. Looks busy even when parked.', 75),
  m('rim', 'deepdish', 'Deep-Dish Buckets', 'The rim dips in like a soup bowl.', 80),
  m('rim', 'spinner', 'Spinner Spinners', 'Blades that keep spinning after you stop. Distracting.', 110),
  m('rim', 'daisy', 'Flower-Power Rims', 'Petal-shaped spokes round a yellow centre.', 70),
  m('rim', 'acorn', 'Acorn-Cap Hubcaps', 'A hubcap shaped like an acorn cap on every wheel.', 55),
  m('rim', 'turbine', 'Turbofan Rims', 'Slanted blades like a little jet engine.', 100),
];

export const STEERS: readonly ModDef[] = [
  m('steer', 'stock', 'Stock Wheel', 'The wheel it came with.', 0, false),
  m('steer', 'racing', 'Racing Dish', 'A small, flat-bottomed wheel with a leather rim.', 55),
  m('steer', 'banjo', 'Banjo Sprig', 'Three thin spokes and a wooden rim. Very old money.', 65),
  m('steer', 'donut', 'Chunky Donut', 'A fat, squashy rim. Gnomes can hold it with their whole arm.', 40),
  m('steer', 'daisy', 'Daisy Wheel', 'A wheel with petals. It steers just the same.', 50),
  m('steer', 'pretzel', 'Pretzel Wheel', 'Twisted into a knot. Nobody knows which way is up.', 45),
];

export const LAMPS: readonly ModDef[] = [
  m('lamp', 'stock', 'Stock Bulbs', 'The two plain bulbs it came with.', 0, false),
  m('lamp', 'round', 'Bug-Eye Rounds', 'Big round lamps that look permanently surprised.', 60),
  m('lamp', 'square', 'Square Dealers', 'Boxy lamps with a stern look.', 55),
  m('lamp', 'halo', 'Halo Rings', 'A glowing ring around each lamp. Very angelic.', 90),
  m('lamp', 'popup', 'Pop-Up Peepers', 'Lamps that sit in little hoods, peeking out.', 80),
  m('lamp', 'lantern', 'Barn Lanterns', 'Glass lanterns on little brackets. Warm and old-fashioned.', 65),
  m('lamp', 'bar', 'Light-Bar Blaster', 'One long bar of light across the nose.', 100),
  m('lamp', 'acorn', 'Acorn Lamps', 'Lamps shaped like acorns. Nobody asked for these.', 70),
];

/** Beam colour: the shop's bulb-colour swatches. `color` is the glow/beam 0xRRGGBB. */
export const BEAMS: readonly (ModDef & { color: number })[] = [
  { ...m('beam', 'warm', 'Candle Yellow', 'The usual warm glow.', 0, false), color: 0xfff1b0 },
  { ...m('beam', 'xenon', 'Ice-Blue Xenon', 'Cold, hard white-blue. Oncoming gnomes squint.', 25, false), color: 0xb8d8ff },
  { ...m('beam', 'amber', 'Fog Amber', 'Warm orange, for the foggiest mornings.', 15, false), color: 0xffb347 },
  { ...m('beam', 'rose', 'Rose Blush', 'A soft pink glow. Surprisingly intimidating.', 25, false), color: 0xff9ec7 },
  { ...m('beam', 'firefly', 'Firefly Green', 'The green of a summer evening.', 25, false), color: 0xb6ff7a },
  { ...m('beam', 'violet', 'Dusk Violet', 'A purple beam for the dramatic.', 30, false), color: 0xc9a2ff },
];

export const SPOILERS: readonly ModDef[] = [
  m('spoiler', 'ducktail', 'Duck-Tail', 'A little upturned lip on the tail. Understated.', 45),
  m('spoiler', 'picket', 'Picket Wing', 'A section of white picket fence, bolted on as a wing.', 70),
  m('spoiler', 'barndoor', 'Barn-Door Wing', 'A big flat door on two posts. Holds you down, or up.', 85),
  m('spoiler', 'trellis', 'Trellis GT', 'A lattice wing for the sweet peas to climb.', 95),
  m('spoiler', 'biplane', 'Biplane Wing', 'Two wings, stacked. Because one is not enough.', 120),
  m('spoiler', 'fin', 'Dorsal Fin', 'A single tall fin. Makes everything feel faster, and a bit shark.', 75),
  m('spoiler', 'leaf', 'Giant Leaf Lip', 'A broad green leaf. Smells fresh in the rain.', 60),
];

export const SEATS: readonly ModDef[] = [
  m('seat', 'bench', 'Quilted Bench', 'A patchwork cushion stitched from three old aprons.', 40),
  m('seat', 'bucket', 'Racing Bucket', 'A deep bucket that hugs the gnome tight.', 75),
  m('seat', 'saddle', 'Cowhide Saddle', 'Stitched leather with a high back. Yeehaw.', 70),
  m('seat', 'beanbag', 'Bean-Bag Lounger', 'A squashy lounger. Lovely, if you do not steer hard.', 50),
  m('seat', 'throne', 'Garden Throne', 'Carved back, gold knobs. Fit for an unelected mayor.', 130),
  m('seat', 'springer', 'Tractor Springer', 'A metal pan seat on a big coil spring. It bounces.', 55),
  m('seat', 'cosy', 'Tea-Cosy Cushion', 'Woolly, bobbled and warm.', 35),
];

export const ORNAMENTS: readonly ModDef[] = [
  m('ornament', 'hat', 'Mini Gnome Hat', 'A tiny pointed hat on the bonnet. A hat for the hat.', 40),
  m('ornament', 'acorn', 'Golden Acorn', 'A solid gold acorn. Very hard to steal, very easy to lose.', 90),
  m('ornament', 'snail', 'Chrome Snail', 'A shiny snail, forever on its way somewhere.', 65),
  m('ornament', 'flamingo', 'Lawn Flamingo', 'A pink flamingo on one leg. Dignified.', 55),
  m('ornament', 'dragonfly', 'Dragonfly Pilot', 'A dragonfly with a goggled head, leaning into the wind.', 80),
  m('ornament', 'trowel', 'Trowel Standard', 'A little trowel, pointing the way.', 45),
  m('ornament', 'rooster', 'Weathervane Rooster', 'A rooster that points where the wind came from.', 75),
  m('ornament', 'mushroom', 'Fly-Agaric Knob', 'A red, white-spotted toadstool. Do not eat.', 50),
  m('ornament', 'gnomelet', 'Tiny Hood Gnome', 'A little gnome riding the bonnet with both fists in the air.', 100),
];

export const EXTRAS: readonly ModDef[] = [
  m('extra', 'dice', 'Fuzzy Dice', 'Two huge fluffy dice swinging by the seat.', 35),
  m('extra', 'flag', 'Whip-Antenna Flag', 'A tall whippy aerial with a little pennant.', 30),
  m('extra', 'pipes', 'Stovepipe Exhausts', 'Two shiny chimneys that pop and crackle.', 80),
  m('extra', 'mudflaps', 'Mudflap Gnomes', 'A shiny flap behind each rear wheel, each with a gnome silhouette.', 40),
  m('extra', 'bunting', 'Parade Bunting', 'A string of little triangle flags across the top.', 45),
  m('extra', 'plate', 'Vanity Plate', 'A plate that reads GNOME 1. Obviously.', 25),
  m('extra', 'roobar', 'Hedge-Bar Bumper', 'A tough bar to plough through hedges.', 85),
  m('extra', 'bell', 'Bicycle Bell', 'Ring ring! Mounted on the handlebar or dash.', 20),
];

/** Every product, shelf by shelf. */
export const CATALOG: readonly ModDef[] = [
  ...FINISHES, ...DECALS, ...TYRES, ...RIMS, ...STEERS, ...LAMPS, ...BEAMS, ...SPOILERS, ...SEATS, ...ORNAMENTS, ...EXTRAS,
];

export const modsIn = (slot: SlotId): readonly ModDef[] => CATALOG.filter((d) => d.slot === slot);
export const modById = (slot: SlotId, id: string): ModDef | undefined => CATALOG.find((d) => d.slot === slot && d.id === id);
/** The colour of a beam id, or the warm default. */
export const beamColor = (id: string): number => BEAMS.find((b) => b.id === id)?.color ?? 0xfff1b0;

/** Body colours on the shop's swatch rack (the shop also offers a free colour picker). */
export const PAINT_SWATCHES: readonly { name: string; hex: number }[] = [
  { name: 'Buck-Iron Green', hex: 0x2e7d32 },
  { name: 'Razor-Back Orange', hex: 0xf05a24 },
  { name: 'Husky-Blade Blue', hex: 0x1f6feb },
  { name: 'Thorne Obsidian', hex: 0x1c1c22 },
  { name: 'Sea-Foam', hex: 0x38b2ac },
  { name: 'Poppy Red', hex: 0xd8342c },
  { name: 'Buttercup', hex: 0xf2c230 },
  { name: 'Lilac Hush', hex: 0x8e44ad },
  { name: 'Bubblegum Pink', hex: 0xff7eb6 },
  { name: 'Cloud White', hex: 0xf1f1ee },
  { name: 'Mulch Brown', hex: 0x6b4a2f },
  { name: 'Moss Teal', hex: 0x1d6b63 },
];

/** Neon underglow choices. */
export const UNDERGLOW_COLORS: readonly { name: string; hex: number }[] = [
  { name: 'Glow-Worm Green', hex: 0x7dff6a },
  { name: 'Moth Blue', hex: 0x4fb7ff },
  { name: 'Bramble Pink', hex: 0xff4fb0 },
  { name: 'Marigold', hex: 0xffc83a },
  { name: 'Violet Hour', hex: 0xb26bff },
  { name: 'Ember Red', hex: 0xff4a3a },
];

/** Acorns for things that are not a catalogue product. Prices of products are on their ModDef. */
export const PRICES = {
  /** Repainting the body to a new colour. */
  paint: 20,
  /** Changing the spray colour or the lucky number. */
  decalColor: 10,
  rimColor: 10,
  /** Moving the wheel-size slider off the owned value. */
  wheelSize: 25,
  /** Changing either camber. */
  camber: 15,
  /** Changing ride height. */
  rideHeight: 15,
  underglow: 120,
} as const;
