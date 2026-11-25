// The countryside (E16): Chard Levelright outside Even-Estates Plot 1, and Farmer Bramble outside Windfall Croft's west gate.
// Conventions and types: ../stages.ts and ./kit.ts. The places are built by country/ and farm/.
import { cam, mark, type Stage } from './kit';

export const COUNTRY_STAGES: readonly Stage[] = [
  {
    id: 'chard',
    name: 'Even-Estates Plot 1, outside the west gate',
    region: 'mossy-wood',
    center: [-323, -117],
    radius: 10,
    facing: -Math.PI / 2,
    time: 'dusk',
    built: 'existing',
    givers: ['chard'],
    usedBy: ['sq-levelright-night-shift'],
    look: 'Beige-and-pale-blue hoardings with a gap for the gate, a crane painted "Level Is Kind", a caravan with one lit window.',
    sounds: 'A far hammer, a mixer turning over, a spirit level tapped on a post.',
    marks: [
      mark('chard', [-323, -117], [-321, -117], 'stand', 'with a spirit level under one arm, checking something by eye'),
      mark('player', [-321, -117], [-323, -117], 'stand', 'walks up from the road'),
    ],
    cameras: [
      cam('gate', [-318, 1.6, -114], [-323, 1.2, -117], 'from the road onto Chard and the gate behind him'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'bramble',
    name: 'Windfall Croft, outside the west gate',
    region: 'cloverfield-farms',
    center: [57, 545],
    radius: 10,
    facing: Math.PI / 2,
    time: 'day',
    built: 'existing',
    givers: ['bramble'],
    usedBy: ['sq-windfall-croft-deed'],
    look: 'A leaning farm fence, a For Sale board, apples rolling over the wall, the oak beyond the barn.',
    sounds: 'Wind in the apple trees, a distant cow, nothing else.',
    marks: [
      mark('bramble', [57, 545], [59, 545], 'stand', 'in a patched hat, looking at the ground'),
      mark('player', [59, 545], [57, 545], 'stand', 'walks up the road'),
    ],
    cameras: [
      cam('fence', [63, 1.6, 548], [57, 1.2, 545], 'from inside the fence onto Bramble and the road'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];
