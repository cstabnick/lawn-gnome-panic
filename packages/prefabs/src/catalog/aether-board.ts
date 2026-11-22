// New prefabs for aether-board. One owner (the aether-board adoption issue): add entries here and nowhere else.
import type { PrefabDef } from '../types';

// Metro car at a quarter of its real size (11 m long becomes 2.75). The game builds it at scale 4.
// Window and wheel rows are generated from short lists so the file stays readable.
const CAR_WINDOW_Z = [-0.95, -0.475, 0, 0.475, 0.95];
const CAR_WHEEL_Z = [-1, -0.725, 0.725, 1];
const CAR_SIDES = [-1, 1];

const carWindows = CAR_SIDES.flatMap((side) => CAR_WINDOW_Z.map((z) => (
  { s: 'box' as const, d: [0.015, 0.17, 0.2625], at: [side * 0.3175, 0.44, z] as const, c: 0xffe14d, glow: true }
)));
const carDoors = CAR_SIDES.flatMap((side) => [-0.7125, 0.7125].map((z) => (
  { s: 'box' as const, d: [0.01, 0.42, 0.015], at: [side * 0.316, 0.335, z] as const, c: 0x17072e }
)));
const carWheels = CAR_SIDES.flatMap((side) => CAR_WHEEL_Z.map((z) => (
  { s: 'cyl' as const, d: [0.06, 0.06, 0.045], rot: [0, 0, 90] as const, at: [side * 0.23, 0.06, z] as const, c: 0x8d99ae, seg: 14 }
)));

export const AETHER_BOARD: readonly PrefabDef[] = [
  {
    id: 'aether-train-car', name: 'Metro Train Car', category: 'prop', uses: ['place'],
    tags: ['train', 'metro', 'tram', 'car', 'vehicle', 'rail', 'aether', 'board'], emoji: [],
    about: 'A steel metro car at a quarter size: lit windows, roof air units, a cyan destination sign and headlights at the front. Build it at scale 4 for the full 11 m.',
    examine: [
      'A steel metro car with a row of lit windows down each side and a cyan sign over the front.',
      'The gnomes call it the long box. The Charters call it a train, and will not say why.',
      'The air units on the roof are for cooling the riders. Nobody has ever found a way to cool the roof.',
      'Stand on the roof only if you can hold your hat with one hand and your dignity with the other.',
      'The two red lights at the back are the only honest part of it. It is always leaving.',
    ],
    parts: [
      { s: 'box', d: [0.625, 0.4875, 2.75], at: [0, 0.355, 0], c: 0xe8eef5 },
      { s: 'box', d: [0.55, 0.065, 2.67], at: [0, 0.63, 0], c: 0xcfd9e6 },
      { s: 'box', d: [0.645, 0.085, 0.035], at: [0, 0.18, 1.375], c: 0xff3fa4, glow: true },
      { s: 'box', d: [0.645, 0.085, 0.035], at: [0, 0.18, -1.375], c: 0xff3fa4, glow: true },
      ...carWindows,
      ...carDoors,
      { s: 'box', d: [0.4875, 0.19, 0.015], at: [0, 0.44, 1.379], c: 0x1b1035 },
      { s: 'box', d: [0.4875, 0.19, 0.015], at: [0, 0.44, -1.379], c: 0x1b1035 },
      { s: 'box', d: [0.2875, 0.05, 0.015], at: [0, 0.565, 1.38], c: 0x2de2e6, glow: true },
      { s: 'box', d: [0.2875, 0.05, 0.015], at: [0, 0.565, -1.38], c: 0x2de2e6, glow: true },
      { s: 'cyl', d: [0.035, 0.035, 0.02], rot: [90, 0, 0], at: [-0.19, 0.28, 1.381], c: 0xfff5b8, glow: true, seg: 12 },
      { s: 'cyl', d: [0.035, 0.035, 0.02], rot: [90, 0, 0], at: [0.19, 0.28, 1.381], c: 0xfff5b8, glow: true, seg: 12 },
      { s: 'cyl', d: [0.035, 0.035, 0.02], rot: [90, 0, 0], at: [-0.19, 0.28, -1.381], c: 0xff2d4b, glow: true, seg: 12 },
      { s: 'cyl', d: [0.035, 0.035, 0.02], rot: [90, 0, 0], at: [0.19, 0.28, -1.381], c: 0xff2d4b, glow: true, seg: 12 },
      { s: 'box', d: [0.375, 0.07, 0.325], at: [0, 0.695, 0.85], c: 0x98a6b8 },
      { s: 'box', d: [0.375, 0.07, 0.325], at: [0, 0.695, -0.85], c: 0x98a6b8 },
      { s: 'box', d: [0.575, 0.055, 2.64], at: [0, 0.09, 0], c: 0x261844 },
      ...carWheels,
    ],
  },
  {
    id: 'giant-spotted-toadstool', name: 'Giant Spotted Toadstool', category: 'prop', uses: ['place'],
    tags: ['toadstool', 'mushroom', 'giant', 'spotted', 'island', 'aether', 'board'], emoji: [],
    tint: 0xff3f5a,
    about: 'A giant toadstool, about two gnomes tall, with a white stem and a domed cap in the tint colour, dotted with white spots. Build copies with buildPrefabInstances; each copy takes its own cap colour.',
    examine: [
      'A toadstool as tall as two gnomes stacked, with a domed cap and a scatter of white spots.',
      'Gnome saying: the spots are where the rain landed and decided to stay.',
      'Do not sit on it. It is not a seat, whatever the lawn-chair gnomes say.',
      'The cap colour changes with the weather and with what the gnome beneath it ate.',
      'Gnomes have tried to climb them. They reach the stem, then stop, out of respect.',
    ],
    parts: [
      { s: 'cyl', d: [0.28, 0.4, 1.6], at: [0, 0.8, 0], c: 0xfff4e0, seg: 12 },
      { s: 'ball', d: [1.1], at: [0, 1.75, 0], scale: [1, 0.55, 1], c: 'tint', seg: 16 },
      { s: 'ball', d: [0.16], at: [0.65, 2.02, 0], scale: [1, 0.35, 1], c: 'white', seg: 6 },
      { s: 'ball', d: [0.16], at: [-0.65, 2.02, 0], scale: [1, 0.35, 1], c: 'white', seg: 6 },
      { s: 'ball', d: [0.16], at: [0, 2.02, 0.65], scale: [1, 0.35, 1], c: 'white', seg: 6 },
      { s: 'ball', d: [0.16], at: [0, 2.02, -0.65], scale: [1, 0.35, 1], c: 'white', seg: 6 },
      { s: 'ball', d: [0.16], at: [0, 2.32, 0], scale: [1, 0.35, 1], c: 'white', seg: 6 },
    ],
  },
  {
    id: 'aether-crystal', name: 'Aether Crystal', category: 'prop', uses: ['place'],
    tags: ['crystal', 'aether', 'gem', 'shard', 'glow', 'board'], emoji: [],
    tint: 0xff3fa4,
    about: 'A two-ended glowing crystal, a point up and a point down, two units tall with its base at the middle. Tint sets the glow colour.',
    examine: [
      'A glowing crystal, pointed at both ends, that hangs in the air as if it has forgotten where it came from.',
      'The crystals hum a little when a gnome is near. Gnomes hum back, which is unhelpful.',
      'Sold as a lamp, a compass and a paperweight. Works poorly as all three.',
      'The pink ones are said to be warm. The cyan ones are said to be cold. Both are said by the same gnome.',
      'It is not a good idea to lick it, though a few have tried and reported only a faint taste of rain.',
    ],
    parts: [
      { s: 'cone', d: [0.4, 1], at: [0, 1.5, 0], c: 'tint', glow: true, seg: 5 },
      { s: 'cone', d: [0.4, 1], rot: [180, 0, 0], at: [0, 0.5, 0], c: 'tint', glow: true, seg: 5 },
    ],
  },
  {
    id: 'flood-cannon', name: 'Sprinkler Cannon', category: 'prop', uses: ['place'],
    tags: ['cannon', 'sprinkler', 'water', 'hose', 'flood', 'turret', 'aether', 'board'], emoji: [],
    about: 'A brass garden-sprinkler cannon on a swivel base, barrel along +z with a glowing blue nozzle. About one gnome tall and long; Flood Run builds it at scale 2.5 and turns it to aim.',
    examine: [
      'A brass sprinkler on a swivel, built for lawns, aimed at gnomes. The barrel is warm and the nozzle glows blue before it fires.',
      'The Sprinkler Guild insists the cannons only water the slopes. The slopes, they say, do not mind being knocked down.',
      'Stand beside it and nothing happens. Stand in front of it and a great deal happens, briefly.',
      'The glow means it is about to go off. Gnomes who learn this are said to be the ones still riding.',
    ],
    parts: [
      { s: 'cyl', d: [0.5, 0.58, 0.2], at: [0, 0.1, 0], c: 0x6b7280, seg: 10 },
      { s: 'cyl', d: [0.28, 0.34, 0.5], at: [0, 0.45, 0], c: 0xc9a227, seg: 10 },
      { s: 'ball', d: [0.36], at: [0, 0.75, 0], c: 0xb8860b, seg: 8 },
      { s: 'cyl', d: [0.16, 0.2, 1.1], rot: [90, 0, 0], at: [0, 0.78, 0.55], c: 0xd4af37, seg: 10 },
      { s: 'ring', d: [0.2, 0.05], at: [0, 0.78, 0.95], c: 0x8d6b0a },
      { s: 'cyl', d: [0.14, 0.14, 0.08], rot: [90, 0, 0], at: [0, 0.78, 1.12], c: 0x38bdf8, glow: true, seg: 10 },
      { s: 'box', d: [0.12, 0.5, 0.12], at: [0.34, 0.3, -0.1], rot: [0, 0, -20], c: 0x4b5563 },
      { s: 'box', d: [0.12, 0.5, 0.12], at: [-0.34, 0.3, -0.1], rot: [0, 0, 20], c: 0x4b5563 },
    ],
  },
  {
    id: 'flood-geyser-vent', name: 'Geyser Vent', category: 'prop', uses: ['place'],
    tags: ['geyser', 'vent', 'water', 'spout', 'flood', 'aether', 'board'], emoji: [],
    about: 'A ring of rough stones round a dark hole with a faint blue glow, flat on the ground, about 1.2 units across. Flood Run scales it to the geyser radius.',
    examine: [
      'A ring of stones round a hole that gurgles. Something under the mountain is thinking about the sky.',
      'The blue glow brightens a moment before the water arrives. The moment is shorter than you would like.',
      'Gnomes call them kettles. They are never boiling when you look and always boiling when you are above one.',
      'If the stones are wet, it is too late to read this.',
    ],
    parts: [
      { s: 'cyl', d: [0.5, 0.55, 0.12], at: [0, 0.06, 0], c: 0x5b6573, seg: 9 },
      { s: 'cyl', d: [0.36, 0.36, 0.02], at: [0, 0.125, 0], c: 0x0b3a5c, seg: 12 },
      { s: 'cyl', d: [0.22, 0.22, 0.02], at: [0, 0.135, 0], c: 0x38bdf8, glow: true, seg: 12 },
      { s: 'ball', d: [0.1], at: [0.42, 0.13, 0.1], c: 0x7a8696, seg: 5 },
      { s: 'ball', d: [0.09], at: [-0.38, 0.12, -0.22], c: 0x7a8696, seg: 5 },
      { s: 'ball', d: [0.08], at: [0.05, 0.12, -0.47], c: 0x7a8696, seg: 5 },
      { s: 'ball', d: [0.09], at: [-0.1, 0.12, 0.45], c: 0x7a8696, seg: 5 },
    ],
  },
];
