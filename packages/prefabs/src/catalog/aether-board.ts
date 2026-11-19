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
      { s: 'cyl', d: [0.7, 1.1, 0.7], at: [0, 1.85, 0], c: 'tint', seg: 14 },
      { s: 'ball', d: [0.16], at: [0.6, 1.95, 0], scale: [1, 0.35, 1], c: 'white', seg: 6 },
      { s: 'ball', d: [0.16], at: [-0.6, 1.95, 0], scale: [1, 0.35, 1], c: 'white', seg: 6 },
      { s: 'ball', d: [0.16], at: [0, 1.95, 0.6], scale: [1, 0.35, 1], c: 'white', seg: 6 },
      { s: 'ball', d: [0.16], at: [0, 1.95, -0.6], scale: [1, 0.35, 1], c: 'white', seg: 6 },
      { s: 'ball', d: [0.16], at: [0, 2.18, 0], scale: [1, 0.35, 1], c: 'white', seg: 6 },
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
];
