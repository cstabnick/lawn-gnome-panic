// Gnome Theft Auto (E16): Windfall Croft crops: cabbage and pumpkin stages, their produce, and the croft's oak stages.
import type { PrefabDef } from '../types';

export const GTA_COUNTRY_CROPS_B: readonly PrefabDef[] = [
  {
    id: 'crop-cabbage-0', name: 'Cabbage Sprout', category: 'prop', uses: ['place'],
    tags: ['crop', 'cabbage', 'sprout', 'seedling', 'farm', 'croft', 'gta', 'green'], emoji: [],
    about: 'Gnome Theft Auto: a cabbage sprout on a soil mound, one plant per bed cell. Two seed leaves.',
    examine: [
      'Two round seed leaves on a small mound of dirt, looking very sure of themselves.',
      'Old saying: the cabbage is planted in the dark and judged in the light.',
      'Tip: water the mound, not the leaves. The leaves are still deciding whether they like you.',
      'Joke: the first leaf to come up is always the one that wants to be the head.',
      'A slug has already found this one. The slug was not invited and sends no thanks.',
    ],
    parts: [
      { s: 'ball', d: [0.15], at: [0, 0.045, 0], scale: [1, 0.3, 1], c: 'dirt', seg: 8 },                 // soil mound
      { s: 'cyl', d: [0.006, 0.006, 0.07], at: [0, 0.085, 0], c: 'leaf-dark', seg: 4 },                  // stem
      { s: 'ball', d: [0.045], at: [0.03, 0.12, 0], scale: [1, 0.3, 1.2], c: 'leaf', seg: 8, mirror: true }, // seed leaves
    ],
  },
  {
    id: 'crop-cabbage-1', name: 'Growing Cabbage', category: 'prop', uses: ['place'],
    tags: ['crop', 'cabbage', 'growing', 'farm', 'croft', 'gta', 'green'], emoji: [],
    about: 'Gnome Theft Auto: a growing cabbage, a rosette of broad blue-green leaves round a pale heart.',
    examine: [
      'A loose rosette of broad blue-green leaves, each one bigger than the last and very proud of it.',
      'Saying: a cabbage that grows in the rain grows the quickest, and the sulkiest.',
      'Tip: space them a gnome\'s stride apart, or they will sort out the sunlight between them at night.',
      'Joke: it is the only vegetable in the Croft with a bigger personality than the farmer.',
      'Under the outer leaves a pale heart is forming, in no hurry at all.',
    ],
    parts: [
      { s: 'ball', d: [0.15], at: [0, 0.045, 0], scale: [1, 0.3, 1], c: 'dirt', seg: 8 },                 // soil mound
      { s: 'ball', d: [0.18], at: [0, 0.162, 0.14], scale: [1, 0.9, 0.7], c: 0x6f9f6a, seg: 8 },          // outer leaves
      { s: 'ball', d: [0.18], at: [0.133, 0.162, 0.043], scale: [1, 0.9, 0.7], rot: [0, 72, 0], c: 0x6f9f6a, seg: 8 },
      { s: 'ball', d: [0.18], at: [0.082, 0.162, -0.113], scale: [1, 0.9, 0.7], rot: [0, 144, 0], c: 0x6f9f6a, seg: 8 },
      { s: 'ball', d: [0.18], at: [-0.082, 0.162, -0.113], scale: [1, 0.9, 0.7], rot: [0, -144, 0], c: 0x6f9f6a, seg: 8 },
      { s: 'ball', d: [0.18], at: [-0.133, 0.162, 0.043], scale: [1, 0.9, 0.7], rot: [0, -72, 0], c: 0x6f9f6a, seg: 8 },
      { s: 'ball', d: [0.1], at: [0, 0.2, 0], scale: [1, 0.9, 1], c: 0x8db57f, seg: 8 },                 // heart
    ],
  },
  {
    id: 'crop-cabbage-2', name: 'Ripe Cabbage', category: 'prop', uses: ['place'],
    tags: ['crop', 'cabbage', 'ripe', 'head', 'farm', 'croft', 'gta', 'green'], emoji: [],
    about: 'Gnome Theft Auto: a ripe cabbage, a big pale-green head wrapped in broad outer leaves. Ready to pick.',
    examine: [
      'A big round pale-green head wrapped in broad outer leaves, like a parcel that has been wrapped twice.',
      'Old rhyme: the head that is tight is ready, and the head that is loose is still thinking.',
      'Tip: cut it at the base with a clean blade and leave the outer leaves for the compost.',
      'Joke: it weighs about as much as a gnome\'s grudge and tastes a lot better.',
      'Something has eaten a hole in the third leaf. The hole has a worm in it, which is the worm\'s business.',
    ],
    parts: [
      { s: 'ball', d: [0.15], at: [0, 0.045, 0], scale: [1, 0.3, 1], c: 'dirt', seg: 8 },                 // soil mound
      { s: 'ball', d: [0.28], at: [0, 0.266, 0], scale: [1, 0.95, 1], c: 0xa9cf8c, seg: 8 },              // head
      { s: 'ball', d: [0.11], at: [0, 0.143, 0.28], scale: [1, 1.3, 0.4], c: 0x6f9f6a, seg: 8 },          // outer leaves
      { s: 'ball', d: [0.11], at: [0.242, 0.143, 0.14], scale: [1, 1.3, 0.4], rot: [0, 60, 0], c: 0x6f9f6a, seg: 8 },
      { s: 'ball', d: [0.11], at: [0.242, 0.143, -0.14], scale: [1, 1.3, 0.4], rot: [0, 120, 0], c: 0x6f9f6a, seg: 8 },
      { s: 'ball', d: [0.11], at: [0, 0.143, -0.28], scale: [1, 1.3, 0.4], rot: [0, 180, 0], c: 0x6f9f6a, seg: 8 },
      { s: 'ball', d: [0.11], at: [-0.242, 0.143, -0.14], scale: [1, 1.3, 0.4], rot: [0, 240, 0], c: 0x6f9f6a, seg: 8 },
      { s: 'ball', d: [0.11], at: [-0.242, 0.143, 0.14], scale: [1, 1.3, 0.4], rot: [0, 300, 0], c: 0x6f9f6a, seg: 8 },
    ],
  },
  {
    id: 'crop-pumpkin-0', name: 'Pumpkin Sprout', category: 'prop', uses: ['place'],
    tags: ['crop', 'pumpkin', 'sprout', 'seedling', 'farm', 'croft', 'gta', 'orange'], emoji: [],
    about: 'Gnome Theft Auto: a pumpkin sprout on a soil mound, two seed leaves and a curly tendril.',
    examine: [
      'Two seed leaves on a soil mound, with one curly tendril already reaching for the nearest fence.',
      'Saying: a pumpkin is planted in spring and judged at Harvest, which is a long time to wait for a joke.',
      'Tip: give it a stake to climb, or it will climb the nearest gnome.',
      'Joke: it has a tendril for every decision and has made none of them.',
      'The soil under it is warm. Somebody has been sitting on this mound on purpose.',
    ],
    parts: [
      { s: 'ball', d: [0.15], at: [0, 0.045, 0], scale: [1, 0.3, 1], c: 'dirt', seg: 8 },                 // soil mound
      { s: 'cyl', d: [0.006, 0.006, 0.07], at: [0, 0.085, 0], c: 'leaf-dark', seg: 4 },                  // stem
      { s: 'ball', d: [0.05], at: [0.035, 0.12, 0], scale: [1, 0.3, 1.2], c: 'leaf', seg: 8, mirror: true }, // seed leaves
      { s: 'ring', d: [0.035, 0.006], at: [0.05, 0.15, 0], c: 'leaf-dark', seg: 6 },                    // curly tendril
    ],
  },
  {
    id: 'crop-pumpkin-1', name: 'Growing Pumpkin', category: 'prop', uses: ['place'],
    tags: ['crop', 'pumpkin', 'vine', 'growing', 'farm', 'croft', 'gta', 'orange'], emoji: [],
    about: 'Gnome Theft Auto: a growing pumpkin, a sprawling vine of big flat leaves and one yellow flower.',
    examine: [
      'A sprawling vine of big flat leaves and one yellow flower, like a plate that wants to be a meadow.',
      'Old myth: the vine runs all the way to the Shed, and no gnome has walked it end to end.',
      'Tip: pin the vine down with stones, or it will wander off to the neighbour\'s wall.',
      'Joke: the flower opens for a single day, which is about how long it spends on anything.',
      'A bee lives in the flower. The bee has a plan and is not telling anyone.',
    ],
    parts: [
      { s: 'ball', d: [0.15], at: [0, 0.045, 0], scale: [1, 0.3, 1], c: 'dirt', seg: 8 },                 // soil mound
      { s: 'ball', d: [0.2], at: [0, 0.03, 0.4], scale: [1, 0.12, 0.8], rot: [0, 0, 0], c: 0x4f8a3a, seg: 8 },    // flat leaves
      { s: 'ball', d: [0.2], at: [0.38, 0.03, 0.124], scale: [1, 0.12, 0.8], rot: [0, 72, 0], c: 0x4f8a3a, seg: 8 },
      { s: 'ball', d: [0.2], at: [0.235, 0.03, -0.324], scale: [1, 0.12, 0.8], rot: [0, 144, 0], c: 0x4f8a3a, seg: 8 },
      { s: 'ball', d: [0.2], at: [-0.235, 0.03, -0.324], scale: [1, 0.12, 0.8], rot: [0, -144, 0], c: 0x4f8a3a, seg: 8 },
      { s: 'ball', d: [0.2], at: [-0.38, 0.03, 0.124], scale: [1, 0.12, 0.8], rot: [0, -72, 0], c: 0x4f8a3a, seg: 8 },
      { s: 'cyl', d: [0.008, 0.008, 0.3], at: [0, 0.15, 0], c: 'leaf-dark', seg: 4 },                   // flower stalk
      { s: 'ball', d: [0.05], at: [0, 0.32, 0], scale: [1, 0.6, 1], c: 'yellow', seg: 8 },              // flower
    ],
  },
  {
    id: 'crop-pumpkin-2', name: 'Ripe Pumpkin', category: 'prop', uses: ['place'],
    tags: ['crop', 'pumpkin', 'ripe', 'farm', 'croft', 'gta', 'orange'], emoji: [],
    about: 'Gnome Theft Auto: a ripe pumpkin, fat and ribbed, on a short stalk among three leaves. Ready to pick.',
    examine: [
      'A fat ribbed orange pumpkin on a short stalk, sitting among three leaves like a king among courtiers.',
      'Saying: a pumpkin that is heavy is ripe, and one that is heavier is for the Harvest Fair.',
      'Tip: lift it with your knees, not your back, and do not drop it on the path.',
      'Joke: it is the only thing in the Croft rounder than the farmer\'s opinions.',
      'A small hollow on one side is where the last gnome sat to think about it.',
    ],
    parts: [
      { s: 'ball', d: [0.15], at: [0, 0.045, 0], scale: [1, 0.3, 1], c: 'dirt', seg: 8 },                 // soil mound
      { s: 'ball', d: [0.36], at: [0, 0.252, 0], rot: [0, 0, 0], scale: [0.55, 0.7, 1], c: 0xe07b1f, seg: 8 },   // ribs
      { s: 'ball', d: [0.36], at: [0, 0.252, 0], rot: [0, 45, 0], scale: [0.55, 0.7, 1], c: 0xc9661a, seg: 8 },
      { s: 'ball', d: [0.36], at: [0, 0.252, 0], rot: [0, 90, 0], scale: [0.55, 0.7, 1], c: 0xe07b1f, seg: 8 },
      { s: 'ball', d: [0.36], at: [0, 0.252, 0], rot: [0, 135, 0], scale: [0.55, 0.7, 1], c: 0xc9661a, seg: 8 },
      { s: 'cyl', d: [0.02, 0.03, 0.12], at: [0, 0.56, 0], c: 'wood-dark', seg: 6 },                  // stalk
      { s: 'ball', d: [0.14], at: [0, 0.021, 0.45], scale: [1, 0.15, 0.6], c: 0x4f8a3a, seg: 8 },      // leaves
      { s: 'ball', d: [0.14], at: [0.39, 0.021, -0.225], scale: [1, 0.15, 0.6], rot: [0, 120, 0], c: 0x4f8a3a, seg: 8 },
      { s: 'ball', d: [0.14], at: [-0.39, 0.021, -0.225], scale: [1, 0.15, 0.6], rot: [0, -120, 0], c: 0x4f8a3a, seg: 8 },
    ],
  },
  {
    id: 'produce-cabbage', name: 'Cabbage', category: 'food', uses: ['eat', 'collect'],
    tags: ['cabbage', 'vegetable', 'food', 'green', 'croft', 'farm', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a picked cabbage, a round head with a few loose outer leaves.',
    examine: [
      'A round head of cabbage with a few loose leaves pulled off to show how tight it is underneath.',
      'Old saying: an honest cabbage is heavy for its size, and so is an honest gnome.',
      'Tip: store it cool and dry, or it will spend the winter sulking in the larder.',
      'Joke: it is the only ingredient in Turfton\'s kitchens nobody has ever argued about.',
      'The outer leaves go first, which the head considers a fair trade.',
    ],
    parts: [
      { s: 'ball', d: [0.13], at: [0, 0.13, 0], scale: [1, 0.95, 1], c: 0xa9cf8c, seg: 8 },              // head
      { s: 'ball', d: [0.08], at: [0, 0.016, 0.12], scale: [1, 0.2, 0.6], c: 0x6f9f6a, seg: 8 },          // loose leaves
      { s: 'ball', d: [0.08], at: [0.104, 0.016, -0.06], scale: [1, 0.2, 0.6], rot: [0, 120, 0], c: 0x6f9f6a, seg: 8 },
      { s: 'ball', d: [0.08], at: [-0.104, 0.016, -0.06], scale: [1, 0.2, 0.6], rot: [0, -120, 0], c: 0x6f9f6a, seg: 8 },
    ],
  },
  {
    id: 'produce-pumpkin', name: 'Pumpkin', category: 'food', uses: ['eat', 'collect'],
    tags: ['pumpkin', 'vegetable', 'food', 'orange', 'croft', 'farm', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a picked pumpkin, small and ribbed, with a curly stalk.',
    examine: [
      'A small orange pumpkin with ribs down its sides and a curly stalk on top, like a question mark that ripened.',
      'Saying: a pumpkin on the porch means the Harvest has started and the lanterns will follow.',
      'Tip: scoop it out before you carve it, or the lantern will be quite dim.',
      'Joke: it weighs less than the excuse you will give for losing it.',
      'Someone has cut a grin in one side. The grin was made by a gnome who was very pleased with himself.',
    ],
    parts: [
      { s: 'ball', d: [0.2], at: [0, 0.15, 0], rot: [0, 0, 0], scale: [0.55, 0.75, 1], c: 0xe07b1f, seg: 8 },      // ribs
      { s: 'ball', d: [0.2], at: [0, 0.15, 0], rot: [0, 60, 0], scale: [0.55, 0.75, 1], c: 0xc9661a, seg: 8 },
      { s: 'ball', d: [0.2], at: [0, 0.15, 0], rot: [0, 120, 0], scale: [0.55, 0.75, 1], c: 0xe07b1f, seg: 8 },
      { s: 'cyl', d: [0.01, 0.012, 0.12], at: [0, 0.36, 0], c: 'wood-dark', seg: 6 },                       // stalk
      { s: 'ring', d: [0.04, 0.006], at: [0.04, 0.4, 0], c: 'leaf-dark', seg: 6 },                          // curl
    ],
  },
  {
    id: 'croft-oak-0', name: 'Oak Sapling', category: 'prop', uses: ['place'],
    tags: ['oak', 'sapling', 'tree', 'young', 'croft', 'farm', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the croft oak as a sapling, a thin trunk tied to a stake, a ring of fresh soil at its foot. Built at life size.',
    examine: [
      'A thin young oak no taller than a gnome and a bit, tied to a stake with a strip of cloth.',
      'Saying: an oak takes a hundred years to become a tree and one afternoon to be sat under.',
      'Tip: water it on dry days and keep the goats off the bark.',
      'Joke: it is a very patient bank, and it has not yet paid anybody back.',
      'The soil ring at its foot was dug by someone who wanted to be sure it would be fine.',
    ],
    parts: [
      { s: 'ball', d: [0.3], at: [0, 0.026, 0], scale: [1, 0.085, 1], c: 'dirt', seg: 8 },                     // soil ring
      { s: 'cyl', d: [0.02, 0.025, 1.2], at: [0, 0.6, 0], c: 'bark', seg: 6 },                              // trunk
      { s: 'cyl', d: [0.012, 0.012, 1.0], at: [0.07, 0.5, 0], c: 'wood', seg: 6 },                         // stake
      { s: 'box', d: [0.04, 0.1, 0.02], at: [0.045, 0.7, 0], c: 'cloth' },                                  // cloth tie
      { s: 'ball', d: [0.09], at: [0.05, 1.25, 0.02], c: 'leaf', seg: 6 },                                  // leaf clumps
      { s: 'ball', d: [0.08], at: [-0.06, 1.1, 0.05], c: 'leaf-dark', seg: 6 },
      { s: 'ball', d: [0.07], at: [0.1, 1.05, -0.03], c: 'leaf', seg: 6 },
      { s: 'ball', d: [0.08], at: [-0.08, 0.95, -0.04], c: 'leaf-dark', seg: 6 },
      { s: 'ball', d: [0.07], at: [0.02, 0.85, 0.09], c: 'leaf', seg: 6 },
      { s: 'ball', d: [0.07], at: [-0.03, 1.3, -0.06], c: 'leaf-dark', seg: 6 },
      { s: 'ball', d: [0.07], at: [-0.1, 0.7, 0.02], c: 'leaf', seg: 6 },
    ],
  },
  {
    id: 'croft-oak-1', name: 'Young Oak', category: 'prop', uses: ['place'],
    tags: ['oak', 'young', 'tree', 'croft', 'farm', 'gta'], emoji: [],
    footprint: { r: 0.13, h: 2.5 },
    about: 'Gnome Theft Auto: the croft oak as a young tree, a straight trunk under a round canopy about 2.5 m across. Built at life size.',
    examine: [
      'A tall young oak with a straight trunk and a round canopy, still too thin to be trusted with a swing.',
      'Old rhyme: the oak grows up, the gnome grows old, and the acorn pays no rent.',
      'Tip: do not climb it until the lower branches are as thick as your arm.',
      'Joke: the oak has been meaning to branch out for years, and now it has.',
      'A squirrel is burying something at the foot. It has been told the ground is not a bank.',
    ],
    parts: [
      { s: 'cyl', d: [0.12, 0.14, 2.5], at: [0, 1.25, 0], c: 'bark', seg: 8 },                             // trunk
      { s: 'cyl', d: [0.04, 0.05, 0.9], at: [0.2, 2.05, 0], rot: [0, 0, -35], c: 'bark', seg: 6 },         // branch
      { s: 'ball', d: [1.25], at: [0, 3.2, 0], scale: [1, 0.75, 1], c: 'leaf', seg: 8 },                   // canopy
      { s: 'ball', d: [0.75], at: [0.55, 2.85, 0.25], scale: [1, 0.75, 1], c: 'leaf-dark', seg: 8 },
      { s: 'ball', d: [0.75], at: [-0.55, 2.9, -0.2], scale: [1, 0.75, 1], c: 'leaf', seg: 8 },
      { s: 'ball', d: [0.7], at: [0, 3.7, 0.1], scale: [1, 0.8, 1], c: 'leaf-dark', seg: 8 },
    ],
  },
  {
    id: 'croft-oak-2', name: 'The Croft Oak', category: 'prop', uses: ['place'],
    tags: ['oak', 'tree', 'grown', 'acorn', 'croft', 'farm', 'gta'], emoji: [],
    footprint: { r: 0.35, h: 3 },
    about: 'Gnome Theft Auto: the Croft Oak, grown. Broad trunk, three big limbs, a wide canopy with acorns hanging low and four lying at the foot. Built at life size.',
    examine: [
      'A broad old oak with three great limbs and a canopy wide enough to shade the whole croft and half the barn.',
      'Saying: every acorn is a promise, and the Croft Oak has kept every one of them, slowly.',
      'Tip: shelter under the lower branches in a storm, not the top ones, which take the lightning first.',
      'Joke: it drops acorns the way a bank drops interest: slowly, and mostly on the tenants.',
      'Four acorns lie round its foot. A gnome tried to count them and got bored at four.',
    ],
    parts: [
      { s: 'cyl', d: [0.35, 0.4, 3.0], at: [0, 1.5, 0], c: 'bark', seg: 8 },                              // trunk
      { s: 'cyl', d: [0.14, 0.18, 2.4], at: [0.9, 3.9, 0], rot: [0, 0, -40], c: 'bark', seg: 6 },           // limbs
      { s: 'cyl', d: [0.14, 0.18, 2.4], at: [-0.8, 3.8, 0.2], rot: [0, 0, 40], c: 'bark', seg: 6 },
      { s: 'cyl', d: [0.14, 0.18, 2.2], at: [0, 4.0, -0.7], rot: [-40, 0, 0], c: 'bark', seg: 6 },
      { s: 'ball', d: [2.3], at: [0, 7.0, 0], scale: [1, 0.7, 1], c: 'leaf', seg: 8 },                     // canopy
      { s: 'ball', d: [1.8], at: [2.2, 6.6, 0.6], scale: [1, 0.7, 1], c: 'leaf-dark', seg: 8 },
      { s: 'ball', d: [1.8], at: [-2.3, 6.5, -0.4], scale: [1, 0.7, 1], c: 'leaf', seg: 8 },
      { s: 'ball', d: [1.8], at: [0.4, 6.2, -2.3], scale: [1, 0.7, 1], c: 'leaf-dark', seg: 8 },
      { s: 'ball', d: [1.8], at: [-0.5, 6.4, 2.4], scale: [1, 0.7, 1], c: 'leaf', seg: 8 },
      { s: 'ball', d: [1.9], at: [0, 7.5, 0], scale: [1, 0.8, 1], c: 'leaf-dark', seg: 8 },
      { s: 'ball', d: [1.6], at: [1.5, 7.6, -1.4], scale: [1, 0.7, 1], c: 'leaf', seg: 8 },
      // acorns hanging low in the canopy (nut with a darker cap)
      { s: 'ball', d: [0.07], at: [2.6, 5.2, 0.4], scale: [1, 1.2, 1], c: 'wood', seg: 6 },
      { s: 'ball', d: [0.05], at: [2.6, 5.27, 0.4], scale: [1, 0.5, 1], c: 'wood-dark', seg: 6 },
      { s: 'ball', d: [0.07], at: [2.0, 5.0, -0.9], scale: [1, 1.2, 1], c: 'wood', seg: 6 },
      { s: 'ball', d: [0.05], at: [2.0, 5.07, -0.9], scale: [1, 0.5, 1], c: 'wood-dark', seg: 6 },
      { s: 'ball', d: [0.07], at: [-2.7, 5.1, -0.3], scale: [1, 1.2, 1], c: 'wood', seg: 6 },
      { s: 'ball', d: [0.05], at: [-2.7, 5.17, -0.3], scale: [1, 0.5, 1], c: 'wood-dark', seg: 6 },
      { s: 'ball', d: [0.07], at: [-1.9, 5.0, 0.9], scale: [1, 1.2, 1], c: 'wood', seg: 6 },
      { s: 'ball', d: [0.05], at: [-1.9, 5.07, 0.9], scale: [1, 0.5, 1], c: 'wood-dark', seg: 6 },
      { s: 'ball', d: [0.07], at: [-0.6, 5.0, 2.9], scale: [1, 1.2, 1], c: 'wood', seg: 6 },
      { s: 'ball', d: [0.05], at: [-0.6, 5.07, 2.9], scale: [1, 0.5, 1], c: 'wood-dark', seg: 6 },
      { s: 'ball', d: [0.07], at: [0.9, 5.1, -2.8], scale: [1, 1.2, 1], c: 'wood', seg: 6 },
      { s: 'ball', d: [0.05], at: [0.9, 5.17, -2.8], scale: [1, 0.5, 1], c: 'wood-dark', seg: 6 },
      { s: 'ball', d: [0.07], at: [-2.0, 5.2, -1.9], scale: [1, 1.2, 1], c: 'wood', seg: 6 },
      { s: 'ball', d: [0.05], at: [-2.0, 5.27, -1.9], scale: [1, 0.5, 1], c: 'wood-dark', seg: 6 },
      { s: 'ball', d: [0.07], at: [2.2, 5.3, 1.9], scale: [1, 1.2, 1], c: 'wood', seg: 6 },
      { s: 'ball', d: [0.05], at: [2.2, 5.37, 1.9], scale: [1, 0.5, 1], c: 'wood-dark', seg: 6 },
      { s: 'ball', d: [0.07], at: [1.0, 5.4, 1.6], scale: [1, 1.2, 1], c: 'wood', seg: 6 },
      { s: 'ball', d: [0.05], at: [1.0, 5.47, 1.6], scale: [1, 0.5, 1], c: 'wood-dark', seg: 6 },
      { s: 'ball', d: [0.07], at: [-1.2, 5.1, -2.6], scale: [1, 1.2, 1], c: 'wood', seg: 6 },
      { s: 'ball', d: [0.05], at: [-1.2, 5.17, -2.6], scale: [1, 0.5, 1], c: 'wood-dark', seg: 6 },
      // four acorns lying round the foot
      { s: 'ball', d: [0.05], at: [0.9, 0.04, 0.7], scale: [1, 0.8, 1], c: 'wood', seg: 6 },
      { s: 'ball', d: [0.03], at: [0.9, 0.075, 0.7], scale: [1, 0.5, 1], c: 'wood-dark', seg: 6 },
      { s: 'ball', d: [0.05], at: [-0.8, 0.04, 0.9], scale: [1, 0.8, 1], c: 'wood', seg: 6 },
      { s: 'ball', d: [0.03], at: [-0.8, 0.075, 0.9], scale: [1, 0.5, 1], c: 'wood-dark', seg: 6 },
      { s: 'ball', d: [0.05], at: [1.1, 0.04, -0.6], scale: [1, 0.8, 1], c: 'wood', seg: 6 },
      { s: 'ball', d: [0.03], at: [1.1, 0.075, -0.6], scale: [1, 0.5, 1], c: 'wood-dark', seg: 6 },
      { s: 'ball', d: [0.05], at: [-0.6, 0.04, -1.0], scale: [1, 0.8, 1], c: 'wood', seg: 6 },
      { s: 'ball', d: [0.03], at: [-0.6, 0.075, -1.0], scale: [1, 0.5, 1], c: 'wood-dark', seg: 6 },
    ],
  },
];
