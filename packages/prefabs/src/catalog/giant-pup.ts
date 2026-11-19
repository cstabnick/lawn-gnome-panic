// New prefabs for giant-pup. One owner (the giant-pup adoption issue): add entries here and nowhere else.
import type { PrefabDef } from '../types';

export const GIANT_PUP: readonly PrefabDef[] = [
  {
    id: 'doghouse',
    name: 'Doghouse',
    category: 'prop',
    uses: ['place'],
    tags: ['dog', 'doghouse', 'kennel', 'house', 'wood', 'roof', 'garden', 'pup'],
    emoji: [],
    about: 'A small wooden doghouse with a sloped roof, a gable on each end and a round-topped door on the +z face. Built at a tenth of its yard size.',
    examine: [
      'A wooden house exactly the size of a dog, with a steep roof and a door cut in the front.',
      'Gnome saying: a dog that has a house will still sleep on the step, to keep an eye on the house.',
      'Tip: the door is at the front, and so is the dog, so do not stand in front of either.',
      'It has been painted the colour of old tea, and one roof slat was put on upside down by a gnome who meant well.',
      'The roof is said to keep the rain out. The dog has never been asked, and would not agree if he were.',
    ],
    parts: [
      { s: 'box', d: [0.45, 0.2, 0.4], at: [0, 0.1, 0], c: 0xa0522d },
      { s: 'box', d: [0.3, 0.03, 0.48], at: [-0.13, 0.275, 0], rot: [0, 0, 30], c: 0x3f2a1d },
      { s: 'box', d: [0.3, 0.03, 0.48], at: [0.13, 0.275, 0], rot: [0, 0, -30], c: 0x3f2a1d },
      { s: 'wedge', d: [0.02, 0.15, 0.26], at: [-0.13, 0.275, 0.23], rot: [0, 90, 0], c: 0xa0522d },
      { s: 'wedge', d: [0.02, 0.15, 0.26], at: [0.13, 0.275, 0.23], rot: [0, -90, 0], c: 0xa0522d },
      { s: 'wedge', d: [0.02, 0.15, 0.26], at: [-0.13, 0.275, -0.23], rot: [0, 90, 0], c: 0xa0522d },
      { s: 'wedge', d: [0.02, 0.15, 0.26], at: [0.13, 0.275, -0.23], rot: [0, -90, 0], c: 0xa0522d },
      { s: 'box', d: [0.11, 0.145, 0.01], at: [0, 0.0725, 0.205], c: 0x2b1d12 },
    ],
  },
];
