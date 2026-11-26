// Gnome Theft Auto: Hedgeworth Links to nine holes (batch 3 E32): the mole that pops from the molehills.
import type { PrefabDef } from '../types';

const FUR = 0x4a4d55;
const PINK = 0xe8a0a8;

export const GTA_GOLF_NINE_CRITTERS: readonly PrefabDef[] = [
  {
    id: 'mole', name: 'Mole', category: 'prop', uses: ['place'],
    tags: ['mole', 'animal', 'critter', 'garden', 'molehill', 'hedgeworth', 'gta'], emoji: [],
    about: 'A plump velvety dark-grey mole, about 0.35 m long, with a pink star-ish nose, big pink digging paws held forward and tiny eyes. Origin at the belly bottom, front +z, so it can rise out of a molehill.',
    examine: [
      'A plump, velvety mole with big pink digging paws and eyes the size of pinheads. It looks left, looks right, and looks entirely innocent.',
      'Hedgeworth officially has no moles. The sign at the clubhouse says so, in capitals, and the mole has read it.',
      'Tip: a mole surfaces only when nobody is holding a club. Basil says this is why he never lets go of his.',
      'Joke: the mole is not digging up the ninth green. It is a surveyor, and the green is merely where it began.',
      'Thrift has seen it three times and written it down every time under "weather".',
    ],
    parts: [
      { s: 'ball', d: [0.13], at: [0, 0.12, -0.02], scale: [1, 0.9, 1.3], c: FUR, seg: 10 },
      { s: 'ball', d: [0.08], at: [0, 0.13, 0.14], scale: [0.95, 0.9, 1.1], c: FUR, seg: 8 },
      { s: 'cone', d: [0.025, 0.1], at: [0, 0.12, 0.25], rot: [90, 0, 0], c: PINK, seg: 6 },
      { s: 'ball', d: [0.022], at: [0, 0.12, 0.31], c: PINK, seg: 6 },
      { s: 'ball', d: [0.012], at: [0.05, 0.17, 0.2], c: 'black', seg: 5, mirror: true },
      { s: 'box', d: [0.07, 0.025, 0.1], at: [0.1, 0.07, 0.18], rot: [0, -15, 0], c: PINK, mirror: true },
      { s: 'box', d: [0.06, 0.02, 0.02], at: [0.1, 0.07, 0.24], c: 0xf4e4d0, mirror: true },
      { s: 'cyl', d: [0.012, 0.01, 0.1], at: [0, 0.06, -0.22], rot: [70, 0, 0], c: PINK, seg: 5 },
    ],
  },
];
