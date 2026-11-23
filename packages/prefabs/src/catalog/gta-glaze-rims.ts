// Pay 'n' Glaze prefabs (rims). One owner: the issue that fills this file. Starts empty.
import type { Part, PrefabDef, Vec3 } from '../types';

// Disc and spokes only: axle along x, hub at [0, 0.5, 0], diameter 1. The outer face points to +x; depth goes toward -x.
const HUB: Vec3 = [0, 0.5, 0];
const ROLL: Vec3 = [0, 0, 90]; // a cylinder lying along x
const FACE: Vec3 = [0, 90, 0]; // a ring (hoop) turned to face x
const TINT = 0xc8ccd2; // the player's rim colour
const IRON_DARK = 0x50565c;
const IRON = 0x8a9097;
const STEEL = 0xc3cbd3;
const WOOD_DARK = 0x5e3d22;
const YELLOW = 0xf2c230;

const rad = (deg: number): number => (deg * Math.PI) / 180;
/** A point on a circle of radius r around the hub, in the y-z plane, at angle a degrees (0 = up, +z = 90). */
const onRing = (r: number, a: number): Vec3 => [0, 0.5 + r * Math.cos(rad(a)), r * Math.sin(rad(a))];

export const GTA_GLAZE_RIMS: readonly PrefabDef[] = [
  {
    id: 'glaze-rim-stock', name: 'Stock Steel', category: 'prop', uses: ['place'],
    tint: TINT,
    tags: ['glaze', 'rim', 'wheel', 'chrome', 'steel', 'stock', 'plain'], emoji: [],
    about: "Pay 'n' Glaze rim, stock: a flat pressed-steel disc with four round lightening holes and an iron hub cap. The disc takes the rim tint (tint); the holes and cap do not.",
    examine: [
      'A flat grey disc with four round holes punched through it, like a biscuit that has been very carefully thought about.',
      'Gnome saying: a wheel with holes goes lighter, and a gnome with holes goes nowhere at all.',
      'Tip: the holes are not for breathing. The gnomes who believe otherwise have tried it and are not talking.',
      'Joke: pressed steel, which is a fancy way of saying it was sat on until it was flat enough.',
      'The hub cap is the only part that has ever been polished, and it was done by a gnome who was bored.',
    ],
    parts: [
      { s: 'cyl', d: [0.5, 0.5, 0.1], rot: ROLL, at: HUB, c: 'tint', seg: 16 },
      ...[0, 90, 180, 270].map((a): Part => ({ s: 'cyl', d: [0.07, 0.07, 0.12], rot: ROLL, at: onRing(0.28, a), c: 0x2a2e33, seg: 8 })),
      { s: 'cyl', d: [0.12, 0.12, 0.16], rot: ROLL, at: HUB, c: IRON, seg: 12 },
    ],
  },
  {
    id: 'glaze-rim-fivespoke', name: 'Five-Spoke Stars', category: 'prop', uses: ['place'],
    tint: TINT,
    tags: ['glaze', 'rim', 'wheel', 'chrome', 'spoke', 'five', 'star', 'classic'], emoji: [],
    about: "Pay 'n' Glaze rim, five-spoke: a thin outer ring, a dark centre and five radiating spokes round a hub. The ring and spokes take the rim tint; the dark centre and hub do not.",
    examine: [
      'Five clean spokes radiate out from the middle like the arms of a very determined starfish.',
      'Gnome saying: five spokes for the five corners of the Yard, and none for the Shed, which has never needed one.',
      'Tip: count the spokes before buying. Four is a cheap rim, six is a boast, and five is the honest choice.',
      'Joke: a star is a spoke that got lucky, and this rim has five of them, so you can guess how lucky it is.',
      'Each spoke was cut by hand from a single sheet, which is why no two of them are quite the same width.',
    ],
    parts: [
      { s: 'cyl', d: [0.5, 0.5, 0.08], rot: ROLL, at: HUB, c: 'tint', seg: 16 },
      { s: 'cyl', d: [0.4, 0.4, 0.1], rot: ROLL, at: HUB, c: 0x2a2e33, seg: 16 },
      ...[0, 72, 144, 216, 288].map((a): Part => ({ s: 'box', d: [0.1, 0.4, 0.07], rot: [a, 0, 0], at: onRing(0.22, a), c: 'tint' })),
      { s: 'cyl', d: [0.1, 0.1, 0.12], rot: ROLL, at: HUB, c: STEEL, seg: 10 },
    ],
  },
  {
    id: 'glaze-rim-mesh', name: 'Chicken-Wire Mesh', category: 'prop', uses: ['place'],
    tint: TINT,
    tags: ['glaze', 'rim', 'wheel', 'chrome', 'mesh', 'wire', 'web', 'busy'], emoji: [],
    about: "Pay 'n' Glaze rim, chicken-wire mesh: a ring with two layers of thin spokes criss-crossing to a hub. The ring and spokes take the rim tint; the hub does not.",
    examine: [
      'A fine web of thin spokes, crossing and recrossing, like a spider that got very ambitious about a hoop.',
      'Gnome saying: the mesh keeps the hens out and the wind in, and gnomes have never once been sure which one they want.',
      'Tip: clean the mesh with a feather, not a stick. Sticks get stuck, and then you have a hen in your wheel.',
      'Joke: it looks busy even when parked, which is the whole idea, and the reason it is parked so far away from the chickens.',
      'The lattice is hand-strung, one wire at a time, by a gnome who swore they would only do the one row.',
    ],
    parts: [
      { s: 'cyl', d: [0.5, 0.5, 0.08], rot: ROLL, at: HUB, c: 'tint', seg: 16 },
      ...Array.from({ length: 12 }, (_, i): Part => ({ s: 'box', d: [0.04, 0.46, 0.04], rot: [i * 15, 0, 0], at: HUB, c: 'tint' })),
      ...Array.from({ length: 12 }, (_, i): Part => ({ s: 'box', d: [0.04, 0.46, 0.04], rot: [i * 15 + 7.5, 0, 0], at: [0.02, 0.5, 0], c: 'tint' })),
      { s: 'cyl', d: [0.1, 0.1, 0.12], rot: ROLL, at: HUB, c: STEEL, seg: 10 },
    ],
  },
  {
    id: 'glaze-rim-deepdish', name: 'Deep-Dish Buckets', category: 'prop', uses: ['place'],
    tint: TINT,
    tags: ['glaze', 'rim', 'wheel', 'chrome', 'deep', 'dish', 'bucket', 'bowl'], emoji: [],
    about: "Pay 'n' Glaze rim, deep-dish: a tinted lip ring round a dark bowl that dips in behind it, with a bright step and a hub cap. The lip takes the rim tint; the bowl and cap do not.",
    examine: [
      'A wheel that dips in at the middle like a soup bowl, with a bright lip running all the way round.',
      'Gnome saying: a deep dish holds more than a shallow one, and the same goes for gnomes who think they are important.',
      'Tip: a deep dish catches leaves, pebbles and the odd beetle. Empty it weekly or the beetles start to complain.',
      'Joke: they call it deep-dish because the dish is deep, and the gnome who named it is still deep in thought.',
      'The bowl is painted dark so the dirt will not show, which is the only thing about it that has ever been honest.',
    ],
    parts: [
      { s: 'ring', d: [0.45, 0.05], rot: FACE, at: [0.1, 0.5, 0], c: 'tint', seg: 16 },
      { s: 'cyl', d: [0.3, 0.42, 0.3], rot: ROLL, at: [-0.2, 0.5, 0], c: IRON_DARK, seg: 16 },
      { s: 'cyl', d: [0.44, 0.44, 0.03], rot: ROLL, at: [-0.05, 0.5, 0], c: STEEL, seg: 16 },
      { s: 'cyl', d: [0.12, 0.12, 0.1], rot: ROLL, at: [-0.32, 0.5, 0], c: IRON, seg: 12 },
    ],
  },
  {
    id: 'glaze-rim-spinner', name: 'Spinner Spinners', category: 'prop', uses: ['place'],
    tint: TINT,
    tags: ['glaze', 'rim', 'wheel', 'chrome', 'spinner', 'blade', 'blades', 'spin'], emoji: [],
    about: "Pay 'n' Glaze rim, spinner: a tinted disc with four twisted blades across the face, a chrome hub and a thin ring. The disc and blades take the rim tint; hub and ring are chrome.",
    examine: [
      'Four blades stand across the face of the disc, each one twisted a little, as if still turning after the wheel has stopped.',
      'Gnome saying: a thing that keeps spinning after you stop is either magic or badly fitted, and the Spinner has never been caught.',
      'Tip: do not look straight at the blades for long. Gnomes who did have been seen following their own shadows home.',
      'Joke: the blades are distracting, which is the point, and also the reason the gnome driving keeps forgetting the hedge.',
      'Someone once tried to stop the blades with a stick, and the stick was not found, and neither was the stick-holder for a week.',
    ],
    parts: [
      { s: 'cyl', d: [0.48, 0.48, 0.06], rot: ROLL, at: HUB, c: 'tint', seg: 16 },
      { s: 'ring', d: [0.47, 0.03], rot: FACE, at: HUB, c: STEEL, seg: 16 },
      ...[0, 45, 90, 135].map((a): Part => ({ s: 'box', d: [0.1, 0.42, 0.06], rot: [a + 14, 0, 0], at: HUB, c: 'tint' })),
      { s: 'cyl', d: [0.14, 0.14, 0.14], rot: ROLL, at: HUB, c: STEEL, seg: 12 },
    ],
  },
  {
    id: 'glaze-rim-daisy', name: 'Flower-Power Rims', category: 'prop', uses: ['place'],
    tint: TINT,
    tags: ['glaze', 'rim', 'wheel', 'chrome', 'daisy', 'flower', 'petal', 'petals'], emoji: [],
    about: "Pay 'n' Glaze rim, flower-power: eight petal-shaped spokes round a yellow hub. The petals take the rim tint; the centre is always yellow.",
    examine: [
      'Eight petal-shaped spokes stand round a yellow centre, so the whole wheel looks like it is about to bloom.',
      'Gnome saying: the daisy opens at dawn and shuts at dusk, and the wheel does the same, though only on a good day.',
      'Tip: petals wear down on gravel. Keep them on the grass, where the flowers have fewer complaints.',
      'Joke: flower power is a very good name for a wheel that is currently stuck in a flowerbed.',
      'The yellow centre is painted on by a gnome who was told to use buttercup and used the whole tin.',
    ],
    parts: [
      ...[0, 45, 90, 135, 180, 225, 270, 315].map((a): Part => ({
        s: 'ball', d: [0.14], scale: [0.4, 1.5, 1], rot: [a, 0, 0], at: onRing(0.28, a), c: 'tint', seg: 8,
      })),
      { s: 'cyl', d: [0.12, 0.12, 0.14], rot: ROLL, at: HUB, c: YELLOW, seg: 12 },
    ],
  },
  {
    id: 'glaze-rim-acorn', name: 'Acorn-Cap Hubcaps', category: 'prop', uses: ['place'],
    tint: TINT,
    tags: ['glaze', 'rim', 'wheel', 'chrome', 'acorn', 'hubcap', 'cap', 'oak'], emoji: [],
    about: "Pay 'n' Glaze rim, acorn-cap: a plain tinted disc with a big brown acorn-cap hubcap and a small stalk. The disc takes the rim tint; the cap is brown wood.",
    examine: [
      'A plain disc with a big brown cap in the middle, and a little stalk poking out of it, like a wheel that has been acorned.',
      'Gnome saying: an acorn that falls on the lawn is a tree in waiting, and a wheel with an acorn is a car in waiting.',
      'Tip: the cap does not come off. Do not try. The last gnome who tried is still in the oak.',
      'Joke: it is the only hubcap in the shop that is also a snack, and the only one that has been bitten.',
      'The stalk is carved from a real twig, and gnomes have been known to water it when no one is looking.',
    ],
    parts: [
      { s: 'cyl', d: [0.5, 0.5, 0.1], rot: ROLL, at: HUB, c: 'tint', seg: 16 },
      { s: 'ball', d: [0.3], scale: [0.55, 1, 1], at: [0.12, 0.5, 0], c: WOOD_DARK, seg: 10 },
      { s: 'cyl', d: [0.03, 0.03, 0.1], rot: ROLL, at: [0.33, 0.5, 0], c: WOOD_DARK, seg: 6 },
    ],
  },
  {
    id: 'glaze-rim-turbine', name: 'Turbofan Rims', category: 'prop', uses: ['place'],
    tint: TINT,
    tags: ['glaze', 'rim', 'wheel', 'chrome', 'turbine', 'turbofan', 'blade', 'blades', 'jet'], emoji: [],
    about: "Pay 'n' Glaze rim, turbofan: ten slanted blades on a dark inner disc, with a ring and a steel hub. The blades take the rim tint; the disc, ring and hub do not.",
    examine: [
      'Ten slanted blades ring a dark centre, like a tiny jet engine that has been left out in the flowerbed to dry.',
      'Gnome saying: the blades turn the air, the air turns the wheel, and the wheel turns the gnome into a fan.',
      'Tip: the blades are sharp on the leading edge. Lead with the other one.',
      'Joke: it is called a turbofan, but it has never once had a fan, or a turbo, or a single idea about what either is.',
      'The little whine it makes at speed is said to be a Tall One whistling, and nobody has yet asked it to stop.',
    ],
    parts: [
      { s: 'cyl', d: [0.36, 0.36, 0.04], rot: ROLL, at: HUB, c: 0x2a2e33, seg: 16 },
      { s: 'ring', d: [0.46, 0.03], rot: FACE, at: HUB, c: STEEL, seg: 16 },
      ...Array.from({ length: 10 }, (_, i): Part => ({ s: 'box', d: [0.07, 0.4, 0.05], rot: [i * 36, 25, 0], at: HUB, c: 'tint' })),
      { s: 'cyl', d: [0.08, 0.08, 0.12], rot: ROLL, at: HUB, c: STEEL, seg: 10 },
    ],
  },
];
