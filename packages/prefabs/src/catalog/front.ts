// Gnome Front battlefield props.
// Each is the game object divided by a factor; the game builds it with buildPrefab(id, { scale: factor }).
import type { PrefabDef } from '../types';

export const FRONT: readonly PrefabDef[] = [
  {
    id: 'garden-shed', name: 'Garden Shed', category: 'prop', uses: ['place'],
    tags: ['shed', 'wood', 'hut', 'garden', 'storage'], emoji: [],
    about: 'A small plank shed with a two-sided roof and a door on +z. Built at scale 4 (the Shed).',
    examine: [
      'A plank hut with a two-sided roof and a door just big enough for a gnome carrying a spade.',
      'Saying: "Keep the shed door shut, and the spades will stay where you left them."',
      'Tall One tin was nailed over the roof, and nobody has been brave enough to take it down.',
      'The roof is steep on both sides so the rain runs off. Gnomes say the same of their grandmothers.',
      'On still nights something hums inside. Young gnomes say it is the wind, and they are probably right.',
    ],
    parts: [
      { s: 'box', d: [2, 0.8, 1.5], at: [0, 0.4, 0], c: 0x8b5a2b },
      { s: 'box', d: [2.1, 0.0625, 0.9], at: [0, 0.975, 0.45], rot: [25.78, 0, 0], c: 0x6b3f1f },
      { s: 'box', d: [2.1, 0.0625, 0.9], at: [0, 0.975, -0.45], rot: [-25.78, 0, 0], c: 0x6b3f1f },
      { s: 'box', d: [0.35, 0.55, 0.025], at: [0, 0.275, 0.7625], c: 0x4a3018 },
    ],
  },
  {
    id: 'stone-fountain', name: 'Stone Fountain', category: 'prop', uses: ['place'],
    tags: ['fountain', 'stone', 'water', 'basin', 'spout'], emoji: [],
    about: 'A stone basin with a spout and a ball of water on top. Built at scale 2 at the flag centre.',
    examine: [
      'A round stone basin with a slim spout, and a ball of water perched on top that never quite falls.',
      'Saying: "Water that goes into the fountain always comes back up in the spring."',
      'Gnomes make wishes in it. Most of the wishes are for dry socks.',
      'The basin is deep enough to drown a sulking gnome, which is why children are told not to try.',
      'The stone is not from the Rockery. The carving looks like the fingers of a Tall One.',
    ],
    parts: [
      { s: 'cyl', d: [1.25, 1.1, 0.6], at: [0, 0.3, 0], c: 0xbdbdbd, seg: 12 },
      { s: 'cyl', d: [1.15, 1.15, 0.01], at: [0, 0.605, 0], c: 0x5ec8f2, seg: 12 },
      { s: 'cyl', d: [0.06, 0.06, 0.7], at: [0, 0.95, 0], c: 0xbdbdbd, seg: 8 },
      { s: 'ball', d: [0.125], at: [0, 1.35, 0], c: 0x5ec8f2, seg: 8 },
    ],
  },
  {
    id: 'veggie-bed', name: 'Veggie Bed', category: 'prop', uses: ['place'],
    tags: ['veggie', 'bed', 'cabbage', 'soil', 'garden', 'patch'], emoji: [],
    about: 'A raised bed of dark soil with three cabbages in a row. Built at scale 4, rotated to run along x or z.',
    examine: [
      'A raised bed of dark soil with three fat cabbages in a row, pale green and very proud of themselves.',
      'Planting saying: "Plant the cabbage deep and the slugs will sleep."',
      'Cabbages do not run, which is why they are in the bed and not on the Verge.',
      'Pick the outer leaves first and the middle ones keep growing. Gnomes do this in every war.',
      'The soil is warm underneath, even on the coldest morning. Nobody has asked what keeps it warm.',
    ],
    parts: [
      { s: 'box', d: [0.375, 0.2, 2], at: [0, 0.1, 0], c: 0x5a3b22 },
      { s: 'ball', d: [0.1125], at: [0, 0.2375, -0.7], c: 0x7fc24a },
      { s: 'ball', d: [0.1125], at: [0, 0.2375, 0], c: 0x7fc24a },
      { s: 'ball', d: [0.1125], at: [0, 0.2375, 0.7], c: 0x7fc24a },
    ],
  },
  {
    id: 'compost-heap', name: 'Compost Heap', category: 'prop', uses: ['place'],
    tags: ['compost', 'heap', 'dirt', 'mound', 'peel', 'dung'], emoji: [],
    about: 'A flat-bottomed, low, steaming mound of peel and twigs. Built at scale 3 (the Compost Heap).',
    examine: [
      'A low heap of peel, grass cuttings and old boots, the colour of strong tea.',
      'Gnome saying: "What the Tall Ones throw away, the heap keeps warm."',
      'It smells terrible from the Verge, which is why the picnics are held upwind of it.',
      'Good cover from the front. Poor cover from the back, where the flies gather.',
      'Something in the middle has been ticking for three summers. Nobody has dug far enough to ask it why.',
    ],
    parts: [
      { s: 'cyl', d: [0.7, 1.0, 0.3], at: [0, 0.15, 0], c: 0x6b4a2a, seg: 10 },
      { s: 'ball', d: [0.7], scale: [1, 0.48, 1], at: [0, 0.336, 0], c: 0x6b4a2a, seg: 10 },
      { s: 'ball', d: [0.1], scale: [1, 0.5, 1], at: [0.3, 0.58, 0.1], c: 0xd9a441, seg: 6 },
      { s: 'ball', d: [0.08], scale: [1, 0.5, 1], at: [-0.25, 0.5, 0.25], c: 0x8a6a3e, seg: 6 },
      { s: 'ball', d: [0.09], scale: [1, 0.5, 1], at: [-0.1, 0.6, -0.3], c: 0xd9a441, seg: 6 },
      { s: 'ball', d: [0.07], scale: [1, 0.5, 1], at: [0.15, 0.62, -0.2], c: 0x7fc24a, seg: 6 },
    ],
  },
  {
    id: 'hq-tent', name: 'HQ Tent', category: 'prop', uses: ['place'],
    tags: ['tent', 'hq', 'canvas', 'camp', 'headquarters'], emoji: [],
    tint: 0x3466b8,
    about: 'A four-sided team tent with a dark door on +z. Tint is the team colour. Built at scale 4.',
    examine: [
      'A squat canvas tent in team colours, with a dark door flap on the side.',
      'Old saying: "A tent is only a hat that has been left out for the night."',
      'Tip: the door faces the middle of the garden, so the enemy has to come to you to get in.',
      'The canvas has a patch of Tall One sheet, too smooth to be natural and too white to be trusted.',
      'Inside there is a table, a map, and a bench that nobody will admit to sitting on.',
    ],
    parts: [
      { s: 'cone', d: [1.05, 1.25], at: [0, 0.625, 0], rot: [0, 45, 0], c: 'tint', seg: 4 },
      { s: 'box', d: [0.3, 0.5, 0.025], at: [0, 0.25, 0.775], c: 0x222222 },
    ],
  },
  {
    id: 'team-banner', name: 'Team Banner', category: 'prop', uses: ['place'],
    tags: ['banner', 'flag', 'pole', 'team', 'cloth'], emoji: [],
    tint: 0x3466b8,
    about: 'A wooden pole with a flag sticking out toward +x. Tint is the team colour. Built at scale 3.',
    examine: [
      'A tall wooden pole with a team-coloured flag flapping from the top.',
      'Saying: "Whoever holds the pole holds the garden, until the wind changes."',
      'Tip: a banner seen from far off tells every gnome where to fight, and where to run.',
      'The cloth is a torn tablecloth from a feast nobody remembers. The colour is the only part that matters.',
      'Gnomes salute it as they pass. It is good manners, and it is cheaper than a fight.',
    ],
    parts: [
      { s: 'cyl', d: [0.033, 0.033, 2.167], at: [0, 1.083, 0], c: 0x8b5a2b, seg: 6 },
      { s: 'box', d: [0.533, 0.367, 0.01], at: [0.267, 1.867, 0], c: 'tint' },
    ],
  },
  {
    id: 'capture-flagpole', name: 'Capture Flagpole', category: 'prop', uses: ['place'],
    tags: ['flag', 'flagpole', 'capture', 'pole', 'banner'], emoji: [],
    tint: 0xcccccc,
    about: 'A capture flag: white pole, gold ball and a cloth on the pivot "cloth" that rises with progress. Built at scale 3.',
    examine: [
      'A white pole with a gold ball on top and a cloth that stays grey until someone takes the flag.',
      'Saying: "The gold ball is for the one who looks up. The cloth is for the one who ran up."',
      'Tip: a half-raised flag means the ground is still being fought over. Stand close and count.',
      'The gold ball is thin gold leaf over clay. Gnomes say it is real, and gnomes lie about gold.',
      'The pole is a fishing rod that someone forgot to take home.',
    ],
    pivots: { cloth: [0, 0.533, 0] },
    parts: [
      { s: 'cyl', d: [0.027, 0.027, 2], at: [0, 1, 0], c: 'white', seg: 6 },
      { s: 'ball', d: [0.073], at: [0, 2.033, 0], c: 'gold', seg: 8 },
      { s: 'box', d: [0.6, 0.367, 0.01], at: [0.3, 0.533, 0], c: 'tint', name: 'flag-cloth', group: 'cloth' },
    ],
  },
  {
    id: 'round-bush', name: 'Round Bush', category: 'prop', uses: ['place'],
    tags: ['bush', 'hedge', 'shrub', 'leaves', 'cover'], emoji: [],
    about: 'A clump of three leafy balls, cover to hide behind. Built at scale 2; the game sinks it a little into the ground.',
    examine: [
      'A rounded green bush, three lumps of leaves pressed together like sleeping sheep.',
      'Saying: "A bush in the right place is worth three soldiers in the wrong one."',
      'Tip: hide behind it and keep still. Gnomes are good at keeping still; it is the one thing they practise.',
      'The leaves are full of small brown beetles, who never complain about the war.',
      'Birds nest in the middle. Nobody is allowed to look.',
    ],
    parts: [
      { s: 'ball', d: [0.5], at: [0, 0.725, 0], c: 0x2f7a2f, seg: 8 },
      { s: 'ball', d: [0.4], at: [0.45, 0.425, 0.2], c: 0x2f7a2f, seg: 8 },
      { s: 'ball', d: [0.425], at: [-0.35, 0.425, -0.25], c: 0x2f7a2f, seg: 8 },
    ],
  },
  {
    id: 'cone-pine', name: 'Cone Pine', category: 'prop', uses: ['place'],
    tags: ['pine', 'tree', 'conifer', 'cover', 'forest'], emoji: [],
    about: 'A short trunk under a pointed dark-green crown. Built at scale 5; the trunk is the obstacle.',
    examine: [
      'A dark pine with a stubby trunk and a crown shaped like a very sharp hat.',
      'Saying: "The pine keeps its needles in winter, and keeps its secrets all year."',
      'Tip: the tree blocks the view from both sides but not from the top, so keep your head down.',
      'Pinecones drop at the worst moment. Every gnome has a pinecone story and nobody wants another.',
      'Old gnomes say a Tall One planted it, and is still watching from the top.',
    ],
    parts: [
      { s: 'cyl', d: [0.09, 0.12, 1], at: [0, 0.5, 0], c: 0x6b4a2e, seg: 8 },
      { s: 'cone', d: [0.64, 1.4], at: [0, 1.7, 0], c: 0x2e8b3a, seg: 10 },
    ],
  },
];
