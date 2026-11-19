// New prefabs for sample-3d. One owner (the sample-3d adoption issue): add entries here and nowhere else.
import type { PrefabDef } from '../types';

export const SAMPLE_3D_WEAPONS: readonly PrefabDef[] = [
  {
    id: 'pitchfork', name: 'Pitchfork', category: 'weapon', uses: ['hold', 'swing', 'dig'],
    tags: ['pitchfork', 'fork', 'tines', 'prong', 'hay', 'garden', 'wood', 'steel'], emoji: [],
    grip: [0, 0.7, 0],
    pivots: { 'tine-left': [-0.9, 1.475, 0.25], 'tine-mid': [0, 1.475, 0.25], 'tine-right': [0.9, 1.475, 0.25] },
    about: 'A long wood shaft with a gold collar and three steel tines. The tines are pivots: move them along x to set the width.',
    examine: [
      'A long wooden shaft, a gold collar at the top, and three steel tines ending in points.',
      'Old saying: a fork for hay, and three more for whatever was hiding in the hay.',
      'Hold it by the middle of the shaft. Gnomes who hold it by the tines learn about the tines.',
      'The gold collar is for show. The steel is for business. Both are polished on Sundays.',
      'It was once a hay fork in a barn that nobody remembers. Gnomes like to think it still is.',
    ],
    parts: [
      { s: 'cyl', d: [0.03, 0.03, 1.4], at: [0, 0.7, 0], c: 'wood' },
      { s: 'cyl', d: [0.12, 0.1, 0.06], at: [0, 1.43, 0], c: 'gold', seg: 8 },
      { s: 'box', d: [0.03, 0.03, 0.5], at: [-0.9, 1.475, 0.25], group: 'tine-left', c: 'steel' },
      { s: 'box', d: [0.03, 0.03, 0.5], at: [0, 1.475, 0.25], group: 'tine-mid', c: 'steel' },
      { s: 'box', d: [0.03, 0.03, 0.5], at: [0.9, 1.475, 0.25], group: 'tine-right', c: 'steel' },
    ],
  },
  {
    id: 'leaf-blower', name: 'Leaf Blower', category: 'weapon', uses: ['hold'],
    tags: ['blower', 'leaf', 'leaves', 'fan', 'garden', 'puff', 'iron'], emoji: [],
    grip: [0, 0.05, 0],
    about: 'A short iron body with a flared nozzle at the front and a black grip on top. Lies along +z.',
    examine: [
      'A short iron tube with a flared mouth at the front and a black grip on top.',
      'Gnome saying: point it at the leaves, and the leaves will go where they are told.',
      'Hold it low and steady. A blower that wobbles blows the gnome, not the leaves.',
      'It hums when it is working and sulks when it is not. Gnomes have decided this is normal.',
      'The grip is worn smooth in two places. Two gnomes must have had very strong opinions.',
    ],
    parts: [
      { s: 'box', d: [0.1, 0.1, 0.5], at: [0, 0.05, 0], c: 'iron-dark' },
      { s: 'cone', d: [0.05, 0.16], at: [0, 0.05, 0.33], rot: [90, 0, 0], c: 'iron', seg: 8 },
      { s: 'box', d: [0.04, 0.05, 0.12], at: [0, 0.125, -0.12], c: 'black' },
    ],
  },
  {
    id: 'sling-pebble', name: 'Sling Pebble', category: 'weapon', uses: ['throw', 'shoot'],
    tags: ['pebble', 'stone', 'sling', 'shot', 'ammo', 'grey'], emoji: [],
    about: 'A round grey pebble, the ammunition for a sling. Stands on its base; the game centres it.',
    examine: [
      'A round grey pebble, smooth on every side, because the gravel it came from was very polite.',
      'Gnome saying: a stone in the pouch is worth two in the hand, and one on the foot.',
      'Pick a pebble that fits the pouch. A large one will go nowhere, and a small one will go everywhere.',
      'It has been thrown at many things. Most of them were gnomes who should have stayed still.',
      'Some pebbles are lucky. This one is not, but it is round, which the Planting considers a virtue.',
    ],
    parts: [
      { s: 'ball', d: [0.12], at: [0, 0.12, 0], c: 'stone' },
    ],
  },
  {
    id: 'wind-chime', name: 'Wind Chime', category: 'prop', uses: ['place'],
    tags: ['chime', 'wind', 'brass', 'tubes', 'bell', 'lullaby'], emoji: [],
    pivots: { 'tube-0': [-0.15, 0.5, 0], 'tube-1': [-0.05, 0.5, 0], 'tube-2': [0.05, 0.5, 0], 'tube-3': [0.15, 0.5, 0] },
    about: 'A brass bar with four tubes hanging from it. Each tube hangs from a pivot named tube-0 to tube-3 and sways from there.',
    examine: [
      'A brass bar with four thin tubes hanging from it, each tuned a little differently to the others.',
      'Gnome saying: a chime that rings in still air has a secret, and the secret is probably a gnome.',
      'Hang it where the wind can find it. Wind is free, and gnomes do not like to pay for things.',
      'The tubes are hollow and the bar is solid. The Charters say this is the correct way round.',
      'It sounds sad in the morning and cheerful in the evening. Gnomes who disagree are asked to sleep outside.',
    ],
    parts: [
      { s: 'box', d: [0.4, 0.02, 0.02], at: [0, 0.5, 0], c: 'brass' },
      { s: 'cyl', d: [0.015, 0.015, 0.5], at: [-0.15, 0.25, 0], group: 'tube-0', c: 'brass', seg: 6 },
      { s: 'cyl', d: [0.015, 0.015, 0.5], at: [-0.05, 0.25, 0], group: 'tube-1', c: 'brass', seg: 6 },
      { s: 'cyl', d: [0.015, 0.015, 0.5], at: [0.05, 0.25, 0], group: 'tube-2', c: 'brass', seg: 6 },
      { s: 'cyl', d: [0.015, 0.015, 0.5], at: [0.15, 0.25, 0], group: 'tube-3', c: 'brass', seg: 6 },
    ],
  },
  {
    id: 'saguaro-spine', name: 'Saguaro Spine', category: 'weapon', uses: ['throw', 'shoot'],
    tags: ['spine', 'needle', 'saguaro', 'cactus', 'spike', 'pale'], emoji: [],
    about: 'A short, pale, five-sided cone: a spine off a saguaro. Stands on its base; the game centres it.',
    examine: [
      'A short pale cone with five sides, sharp at one end and firmly attached to nothing at the other.',
      'Saguaro spines grow on the old cactus of the Rockery. The cactus does not seem to mind.',
      'Gnome saying: a spine that is thrown does not come back. Neither does the cactus, for that matter.',
      'Light enough to carry a dozen, heavy enough to remember where they were put.',
      'Picked up carefully, it stays sharp for a season. Picked up carelessly, it stays in the gnome.',
    ],
    parts: [
      { s: 'cone', d: [0.05, 0.5], at: [0, 0.25, 0], c: 'sand', seg: 5 },
    ],
  },
];
