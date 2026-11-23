// Pay 'n' Glaze prefabs (tyres). One owner: the issue that fills this file. Starts empty.
import type { Part, PrefabDef, Vec3 } from '../types';

// Tread and sidewall only: axle along x, hub at [0, 0.5, 0], diameter 1, width up to 1. The rim prefab goes inside.
const HUB: Vec3 = [0, 0.5, 0];
const ROLL: Vec3 = [0, 0, 90]; // a cylinder lying along x
const RUBBER = 0x1d1d22;
const RUBBER_LIGHT = 0x2e2e33;
const PALE = 0x9a9a9a;
const WHITE = 0xf2f2f2;
const IRON_DARK = 0x50565c;
const WOOD = 0x9a6b3f;
const SILVER_GREY = 0xb8bec7;
const BALLOON_RED = 0xe0202a;
const GLOW_GREEN = 0x7dff6a; // Glow-Worm Green (the shop's underglow swatch)
const FACE: Vec3 = [0, 90, 0]; // a ring (hoop) turned to face x

const rad = (deg: number): number => (deg * Math.PI) / 180;
/** A point on a circle of radius r around the hub, in the y-z plane, at angle a degrees (0 = up, +z = 90). */
const onRing = (r: number, a: number): Vec3 => [0, 0.5 + r * Math.cos(rad(a)), r * Math.sin(rad(a))];

/** Knobbly tread: 12 blocks around the core, radially outward at 30 degree steps. */
const treadBlocks: readonly Part[] = Array.from({ length: 12 }, (_, i): Part => {
  const a = i * 30;
  const r = 0.44; // block centre radius: the block's outer face lands on the 0.5 radius so the tyre stays y 0..1
  return {
    s: 'box', d: [0.9, 0.12, 0.09],
    at: [0, 0.5 + r * Math.cos(rad(a)), r * Math.sin(rad(a))],
    rot: [a, 0, 0], c: 0x26262b,
  };
});

/** Wagon spokes: 8 spokes through the hub, stepped 22.5 degrees, covering 180 degrees. */
const cartSpokes: readonly Part[] = Array.from({ length: 8 }, (_, i): Part => ({
  s: 'box', d: [0.1, 0.9, 0.06], at: HUB, rot: [i * 22.5, 0, 0], c: WOOD,
}));

export const GTA_GLAZE_TYRES: readonly PrefabDef[] = [
  {
    id: 'glaze-tyre-stock', name: 'Stock Rubber', category: 'prop', uses: ['place'],
    tags: ['glaze', 'tyre', 'wheel', 'rubber', 'stock', 'plain'], emoji: [],
    about: "Pay 'n' Glaze tyre, stock: a plain black tread with a lighter shoulder ring. The axle runs along x; the rim goes inside. Rubber does not take the tint.",
    examine: [
      'A plain black ring of rubber, with a paler shoulder where the tread meets the side.',
      'Gnome saying: round is the only shape that never complains about the road.',
      'Tip: check the tread before a long trip. Nobody checks it, and the trip checks you.',
      'Joke: the cheapest wheel in the shop, and the only one that has never once asked to be admired.',
      'Old rubber like this turns up in the Shed, stiff and smelling faintly of the Tall Ones road.',
    ],
    parts: [
      { s: 'cyl', d: [0.5, 0.5, 0.8], rot: ROLL, at: HUB, c: RUBBER, seg: 16 },
      { s: 'cyl', d: [0.46, 0.46, 0.86], rot: ROLL, at: HUB, c: RUBBER_LIGHT, seg: 16 },
    ],
  },
  {
    id: 'glaze-tyre-fat', name: 'Pudgy Puffers', category: 'prop', uses: ['place'],
    tags: ['glaze', 'tyre', 'wheel', 'rubber', 'fat', 'wide', 'round'], emoji: [],
    about: "Pay 'n' Glaze tyre, fat: full width with chamfered shoulders, so it reads round and squishy. Axle along x; the rim goes inside. Rubber does not take the tint.",
    examine: [
      'A wide black tyre with rounded shoulders, looking like it has been left out in the rain to puff up.',
      'Gnome rhyme: round and fat, the stone will not matter, the stone will not matter at all.',
      'Tip: a fat tyre floats over soft ground, which is why gnomes buy it for the bogs.',
      'Joke: it is not that the tyre is fat, it is that the gnome driving it has finally stopped pretending otherwise.',
      'Each shoulder has a little lip, as if something once sat on it and was not sorry.',
    ],
    parts: [
      { s: 'cyl', d: [0.5, 0.5, 1.0], rot: ROLL, at: HUB, c: RUBBER, seg: 16 },
      { s: 'cyl', d: [0.45, 0.5, 0.08], rot: ROLL, at: [-0.46, 0.5, 0], c: RUBBER_LIGHT, seg: 16 },
      { s: 'cyl', d: [0.45, 0.5, 0.08], rot: ROLL, at: [0.46, 0.5, 0], c: RUBBER_LIGHT, seg: 16 },
    ],
  },
  {
    id: 'glaze-tyre-slim', name: 'Skinny Sprinters', category: 'prop', uses: ['place'],
    tags: ['glaze', 'tyre', 'wheel', 'rubber', 'slim', 'narrow', 'thin'], emoji: [],
    about: "Pay 'n' Glaze tyre, slim: a narrow black tread with a thin pale sidewall stripe at each face. Axle along x; the rim goes inside. Rubber does not take the tint.",
    examine: [
      'A narrow black tyre with a thin pale line at each face, like a ribbon tied round a stick.',
      'Gnome saying: the thinner the wheel, the faster the gnome believes it is going.',
      'Tip: a skinny tyre cuts through wet grass cleanly, but it will not forgive a pothole.',
      'Joke: it is the only tyre in the shop that a gnome can see through, if they squint and want to.',
      'The pale stripes are painted on by hand, one flick per side, by a gnome who has never been asked to stop.',
    ],
    parts: [
      { s: 'cyl', d: [0.49, 0.49, 0.36], rot: ROLL, at: HUB, c: PALE, seg: 16 },
      { s: 'cyl', d: [0.5, 0.5, 0.3], rot: ROLL, at: HUB, c: RUBBER, seg: 16 },
    ],
  },
  {
    id: 'glaze-tyre-whitewall', name: 'Whitewall Wafers', category: 'prop', uses: ['place'],
    tags: ['glaze', 'tyre', 'wheel', 'rubber', 'whitewall', 'white', 'ring'], emoji: [],
    about: "Pay 'n' Glaze tyre, whitewall: a black tread with a white ring on each face. Axle along x; the rim goes inside. Rubber does not take the tint.",
    examine: [
      'A black tyre with a neat white ring on each face, like a cup of tea with cream round the rim.',
      'Gnome saying: a white wall is a clean wall, and a clean wall is a wall that has not met the hedge.',
      'Tip: whitewalls show dirt first, so polish them on a Sunday and hope the rain stays away.',
      'Joke: they are called whitewalls because nobody has ever once got them white.',
      'The white rings are glazed on in a single dip, which is why every one of them is slightly lopsided.',
    ],
    parts: [
      { s: 'cyl', d: [0.5, 0.5, 0.6], rot: ROLL, at: HUB, c: RUBBER, seg: 16 },
      { s: 'cyl', d: [0.4, 0.4, 0.72], rot: ROLL, at: HUB, c: RUBBER, seg: 16 },
      { s: 'cyl', d: [0.47, 0.47, 0.04], rot: ROLL, at: [-0.32, 0.5, 0], c: WHITE, seg: 16 },
      { s: 'cyl', d: [0.47, 0.47, 0.04], rot: ROLL, at: [0.32, 0.5, 0], c: WHITE, seg: 16 },
    ],
  },
  {
    id: 'glaze-tyre-knobbly', name: 'Mud-Grub Knobbies', category: 'prop', uses: ['place'],
    tags: ['glaze', 'tyre', 'wheel', 'rubber', 'knobbly', 'mud', 'tread', 'chunky'], emoji: [],
    about: "Pay 'n' Glaze tyre, knobbly: a black core with twelve chunky tread blocks round the rim. Axle along x; the rim goes inside. Rubber does not take the tint.",
    examine: [
      'A black tyre bristling with chunky blocks of tread, like a caterpillar that has decided to go somewhere.',
      'Gnome saying: the mud keeps no secrets from a knobbly tread, and the mud says very little about it.',
      'Tip: the blocks bite into soft beds and throw the soil back at whoever is following.',
      'Joke: the tread was designed for mud, and mud has since been designed for the tread.',
      'Someone once found a whole family of mud-grubs living in the spaces between the blocks, and they were not impressed.',
    ],
    parts: [
      { s: 'cyl', d: [0.46, 0.46, 0.9], rot: ROLL, at: HUB, c: 0x1d1d22, seg: 14 },
      ...treadBlocks,
    ],
  },
  {
    id: 'glaze-tyre-cart', name: 'Wagon-Spoke Hoops', category: 'prop', uses: ['place'],
    tags: ['glaze', 'tyre', 'wheel', 'wood', 'wooden', 'cart', 'spoke', 'hoop', 'iron'], emoji: [],
    about: "Pay 'n' Glaze tyre, wagon-spoke: an iron hoop round a wooden disc, with eight spokes through a hub. Axle along x; the rim goes inside. Does not take the tint.",
    examine: [
      'An old wooden cart wheel with an iron hoop round the outside, each spoke worn smooth by many hands.',
      'Gnome saying: a wheel of wood and iron goes round for a hundred years and only stops when the road does.',
      'Tip: keep the hoop tight with a wedge of clay, and the spokes will not rattle when you take a bump.',
      'Joke: the wagon is slow, but the wheel has been going round longer than the gnome has been arguing about it.',
      'Carved into the hub, in letters nobody can read, is a little picture of a Tall One boot.',
    ],
    parts: [
      { s: 'ring', d: [0.47, 0.03], rot: [0, 90, 0], at: HUB, c: IRON_DARK, seg: 16 },
      { s: 'cyl', d: [0.44, 0.44, 0.06], rot: ROLL, at: HUB, c: WOOD, seg: 16 },
      ...cartSpokes,
      { s: 'cyl', d: [0.09, 0.09, 0.3], rot: ROLL, at: HUB, c: 0x5e3d22, seg: 10 },
    ],
  },
  {
    id: 'glaze-tyre-saucer', name: 'Flying Saucers', category: 'prop', uses: ['place'],
    tags: ['glaze', 'tyre', 'wheel', 'rubber', 'saucer', 'disc', 'flat', 'wide'], emoji: [],
    about: "Pay 'n' Glaze tyre, flying saucer: a flat silver-grey disc with a black rubber rim and a small dome at the hub. Axle along x; the rim goes inside. Does not take the tint.",
    examine: [
      'A flat silver disc with a black rubber edge and a small dome in the middle, like a plate that wants to leave.',
      'Gnome saying: the sky is only a very high lawn, and a saucer is the only thing that gets there without a ladder.',
      'Tip: go easy on the corners. A saucer has no grip, so it has no way of telling you when it is leaving.',
      'Joke: nobody knows how they grip, and the gnome who asked that question is still looking for the edge.',
      'The dome in the middle is warm to the touch, and nobody remembers the last time it was switched on.',
    ],
    parts: [
      { s: 'cyl', d: [0.47, 0.47, 0.16], rot: ROLL, at: HUB, c: SILVER_GREY, seg: 16 },
      { s: 'cyl', d: [0.5, 0.5, 0.1], rot: ROLL, at: HUB, c: RUBBER, seg: 16 },
      { s: 'ball', d: [0.18], scale: [0.6, 1, 1], at: HUB, c: 0xdfe6ec, seg: 10 },
    ],
  },
  {
    id: 'glaze-tyre-spiked', name: 'Burr-Stud Spikes', category: 'prop', uses: ['place'],
    tags: ['glaze', 'tyre', 'wheel', 'rubber', 'spiked', 'spikes', 'stud', 'studs', 'burr'], emoji: [],
    about: "Pay 'n' Glaze tyre, burr-stud: a black tread with twelve steel studs round it. Axle along x; the rim goes inside. Rubber does not take the tint.",
    examine: [
      'A black tyre ringed with twelve little steel studs, each one sharp enough to make a neighbour step back.',
      'Gnome saying: the lawn is soft, but the spikes are not, and the spikes always get the last word.',
      'Tip: the studs bite into soft earth and throw it back. Keep your hands clear of the tread while it turns.',
      'Joke: they call it grip, the neighbour calls it something else, and the neighbour has a point.',
      'Each stud was pressed into the rubber by hand, one at a time, by a gnome who said it would only take a minute.',
    ],
    parts: [
      { s: 'cyl', d: [0.44, 0.44, 0.8], rot: ROLL, at: HUB, c: RUBBER, seg: 14 },
      ...Array.from({ length: 12 }, (_, i): Part => ({
        s: 'cone', d: [0.035, 0.08], at: onRing(0.46, i * 30), rot: [i * 30, 0, 0], c: SILVER_GREY, seg: 6,
      })),
    ],
  },
  {
    id: 'glaze-tyre-balloon', name: 'Balloon Bouncers', category: 'prop', uses: ['place'],
    tags: ['glaze', 'tyre', 'wheel', 'rubber', 'balloon', 'bouncy', 'party', 'fat', 'round'], emoji: [],
    about: "Pay 'n' Glaze tyre, balloon: a fat bright-red party-balloon tyre with a white shine spot and a knotted tie at the top. Axle along x; the rim goes inside. Does not take the tint.",
    examine: [
      'A fat red tyre, shiny as a party balloon, with a white spot of light on one side and a knot at the top.',
      'Gnome rhyme: bounce, bounce, over the kerb, and never mind the tall grass or the hedge.',
      'Tip: the balloon rides high over bumps, but do not blow it up any further. The knot will not hold twice.',
      'Joke: the only tyre in the shop that has been called a party, and the only one that has ever been popped.',
      'The knot was tied by a gnome who was told to hold on tight, and is still holding on.',
    ],
    parts: [
      { s: 'ball', d: [0.5], scale: [0.9, 1, 1], at: HUB, c: BALLOON_RED, seg: 10 },
      { s: 'ball', d: [0.07], at: [0.32, 0.8, 0.22], c: WHITE, seg: 6 },
      { s: 'ball', d: [0.06], at: [0, 1.02, 0], c: BALLOON_RED, seg: 6 },
    ],
  },
  {
    id: 'glaze-tyre-cogs', name: 'Cog Cleats', category: 'prop', uses: ['place'],
    tags: ['glaze', 'tyre', 'wheel', 'rubber', 'cog', 'cogs', 'gear', 'cleat', 'cleats', 'teeth'], emoji: [],
    about: "Pay 'n' Glaze tyre, cog: a black core with ten chunky gear-tooth cleats round the tread. Axle along x; the rim goes inside. Rubber does not take the tint.",
    examine: [
      'A black core with ten chunky cleats round the tread, spaced like the teeth of a clock that has lost its hands.',
      'Gnome saying: the road turns the cog, the cog turns the road, and the gnome is somewhere in the middle, waving.',
      'Tip: the cleats click on paving, which is handy for signals and terrible for a quiet nap.',
      'Joke: it grips like a gear and talks like a gear, and it has never once been asked to mesh with anything.',
      'Someone counted the cleats in the dark and got eleven, and nobody has been brave enough to count again.',
    ],
    parts: [
      { s: 'cyl', d: [0.42, 0.42, 0.9], rot: ROLL, at: HUB, c: RUBBER, seg: 14 },
      ...Array.from({ length: 10 }, (_, i): Part => ({
        s: 'box', d: [0.8, 0.12, 0.12], at: onRing(0.44, i * 36), rot: [i * 36, 0, 0], c: 0x26262b,
      })),
    ],
  },
  {
    id: 'glaze-tyre-glow', name: 'Glow-Worm Hoops', category: 'prop', uses: ['place'],
    tags: ['glaze', 'tyre', 'wheel', 'rubber', 'glow', 'glowing', 'hoop', 'hoops', 'thin', 'light'], emoji: [],
    about: "Pay 'n' Glaze tyre, glow-worm: a thin black tyre with a glowing green hoop on each face. Axle along x; the rim goes inside. Rubber does not take the tint.",
    examine: [
      'A thin black tyre with a bright green hoop on each face, glowing like a worm that has found its way out of the soil.',
      'Gnome saying: a green light on the wheel is a way home, though nobody has agreed yet on which home.',
      'Tip: the hoops are bright enough to see by at dusk, which is when the hedge hides the most.',
      'Joke: they say the glow lights the way, but only as far as the next puddle, and that is a long way at night.',
      'The green paint came from glow-worms who were asked very politely, and they still have not realised it was a request.',
    ],
    parts: [
      { s: 'cyl', d: [0.5, 0.5, 0.5], rot: ROLL, at: HUB, c: RUBBER, seg: 16 },
      { s: 'ring', d: [0.47, 0.03], rot: FACE, at: [0.25, 0.5, 0], c: GLOW_GREEN, glow: true, seg: 16 },
      { s: 'ring', d: [0.47, 0.03], rot: FACE, at: [-0.25, 0.5, 0], c: GLOW_GREEN, glow: true, seg: 16 },
    ],
  },
];
