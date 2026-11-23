// DayG materials and food (phases 4-8): prefabs for the new items. The `nails` item is not here: it is already the
// `nails` prefab in dayg-base-items.ts (ids must be unique).
import type { PrefabDef } from '../types';

export const DAYG_MATERIALS: readonly PrefabDef[] = [
  {
    id: 'cord', name: 'Cord', category: 'material', uses: ['hold', 'craft'],
    tags: ['cord', 'string', 'rope', 'twine', 'thread', 'coil', 'dayg'], emoji: ['🪢'],
    about: 'A small coil of thin cord, two turns, lying on the ground. Crafting input.',
    examine: [
      'A small coil of thin cord, wound twice and tucked under itself so it will not unwind.',
      'Hearth saying: a knot is only a promise that somebody remembered to tie it.',
      'Good for tying a bundle, a gate or a loose sleeve. Not good for a fence that is already falling.',
      'It was tied tight by someone who expected it to be needed again.',
      'Pull one end and the whole coil sighs and comes loose. Gnomes call this the cord being honest.',
    ],
    grip: [0, 0.02, 0],
    parts: [
      { s: 'ring', d: [0.05, 0.012], at: [0, 0.012, 0], rot: [90, 0, 0], c: 'burlap', seg: 6 },
      { s: 'ring', d: [0.04, 0.011], at: [0, 0.03, 0], rot: [90, 0, 0], c: 'burlap', seg: 6 },
    ],
  },
  {
    id: 'rag', name: 'Rag', category: 'material', uses: ['hold', 'craft'],
    tags: ['rag', 'cloth', 'cloths', 'scrap', 'fabric', 'bandage', 'dayg'], emoji: [],
    about: 'A crumpled cloth square, a little grubby, lying in a heap. Crafting input.',
    examine: [
      'A square of cloth that has been folded, used, then crumpled into something almost shapeless.',
      'Gnomes say a clean rag is a hopeful rag. This one has given up on hope.',
      'Good for wiping hands, wrapping a handle or stopping a leak for a while.',
      'Its original colour is a matter of local opinion.',
      'It has been washed so many times that it has learned to fold itself.',
    ],
    grip: [0, 0.03, 0],
    parts: [
      { s: 'box', d: [0.16, 0.02, 0.16], at: [0, 0.01, 0], rot: [0, 12, 0], c: 'cloth' },
      { s: 'ball', d: [0.045], at: [0.03, 0.04, -0.02], scale: [1.2, 0.7, 1], c: 'cloth', seg: 6 },
      { s: 'box', d: [0.05, 0.015, 0.05], at: [-0.04, 0.05, 0.03], rot: [10, 40, 0], c: 'burlap' },
    ],
  },
  {
    id: 'stick', name: 'Stick', category: 'material', uses: ['hold', 'craft'],
    tags: ['stick', 'twig', 'branch', 'straight', 'wood', 'staff', 'dayg'], emoji: [],
    about: 'A straight twig about 0.6 long, lying along x, bark still on. Crafting input.',
    examine: [
      'A straight twig, bark still on, long enough to be a handle and short enough to be a joke.',
      'Gnome saying: a stick in the hand is worth two in the hedge, and one in the eye of the next gnome.',
      'Good for a splint, a tent peg or pointing at things that are not behaving.',
      'It is straighter than most gnomes and has never once complained about it.',
      'Snap it across a knee and it will tell you how old it is.',
    ],
    grip: [0, 0.012, 0],
    parts: [
      { s: 'cyl', d: [0.012, 0.012, 0.6], at: [0, 0.012, 0], rot: [0, 0, 90], c: 'wood-light', seg: 6 },
      { s: 'cyl', d: [0.013, 0.013, 0.03], at: [-0.25, 0.012, 0], rot: [0, 0, 90], c: 'bark', seg: 6 },
    ],
  },
  {
    id: 'glass-shard', name: 'Glass Shard', category: 'material', uses: ['hold', 'craft'],
    wear: { rot: [90, 0, 0] },
    tags: ['glass', 'shard', 'sharp', 'pane', 'broken', 'crafting', 'dayg'], emoji: [],
    about: 'A pale green shard of old glass, sharp on one edge, leaning on its own corner. Crafting input.',
    examine: [
      'A pale green shard of old glass, one edge bright and the other edge worn smooth by someone else\'s thumb.',
      'Hearth saying: a window is only a hole that agreed to be looked through.',
      'Good for a scraper or a small light. Keep it away from the bread.',
      'It came out of a window in the Yard. The window has not forgiven anyone since.',
      'Hold it up to the sun and the light goes green, then greener, then a bit guilty.',
    ],
    grip: [0, 0.05, 0],
    parts: [
      { s: 'box', d: [0.05, 0.1, 0.012], at: [0, 0.05, 0], rot: [0, 0, 18], c: 0xa8dcc0 },
      { s: 'box', d: [0.02, 0.05, 0.01], at: [0.02, 0.02, 0], rot: [0, 0, -30], c: 0xa8dcc0 },
    ],
  },
  {
    id: 'charcoal', name: 'Charcoal', category: 'material', uses: ['hold', 'craft'],
    tags: ['charcoal', 'coal', 'black', 'fuel', 'burnt', 'drawing', 'dayg'], emoji: ['⚫'],
    about: 'Two black lumps of charcoal, light and crumbly, lying together. Crafting input.',
    examine: [
      'Two black lumps of charcoal that leave a mark on anything they touch, including you.',
      'Gnome saying: burnt wood is still wood, only with better manners.',
      'Good for drawing on walls, lighting a fire slowly or blacking a boot.',
      'It is lighter than it looks and dirtier than it should be.',
      'A gnome who holds it too long will find a grey thumb later, like a receipt.',
    ],
    grip: [0, 0.03, 0],
    parts: [
      { s: 'ball', d: [0.045], at: [-0.03, 0.035, 0], scale: [1.2, 0.8, 1], c: 'black' },
      { s: 'ball', d: [0.038], at: [0.035, 0.03, 0.02], scale: [1.1, 0.8, 1], c: 'black' },
    ],
  },
  {
    id: 'soil-sack', name: 'Soil Sack', category: 'material', uses: ['hold', 'craft'],
    tags: ['soil', 'sack', 'dirt', 'earth', 'bag', 'compost', 'dayg'], emoji: [],
    about: 'A small tied sack of dark soil, its neck knotted shut. Crafting input.',
    examine: [
      'A small sack of dark soil, tied at the neck with a knot that has seen a few seasons.',
      'Gnome saying: the earth keeps everything, and returns most of it at the wrong time.',
      'Good for planting, patching a wall or stuffing a boot that is too large.',
      'The soil smells of rain that has not happened yet.',
      'Shake it gently and a worm will complain from somewhere deep inside.',
    ],
    grip: [0, 0.07, 0],
    parts: [
      { s: 'ball', d: [0.07], at: [0, 0.063, 0], scale: [1, 0.9, 1], c: 'dirt', seg: 8 },
      { s: 'cyl', d: [0.026, 0.034, 0.04], at: [0, 0.14, 0], c: 'burlap', seg: 8 },
      { s: 'ball', d: [0.018], at: [0, 0.165, 0], c: 'burlap', seg: 6 },
    ],
  },
  {
    id: 'thorn', name: 'Thorn', category: 'material', uses: ['hold', 'craft'],
    tags: ['thorn', 'spike', 'needle', 'briar', 'hedge', 'sharp', 'dayg'], emoji: [],
    about: 'A curved thorn about 0.15 long, pale at the tip and dark at the root. Crafting input.',
    examine: [
      'A curved thorn, pale at the tip and dark at the root, sharp enough to make a point of it.',
      'Hedge saying: the rose asks for nothing, and takes a finger for it.',
      'Good for pinning a sleeve, a crude needle or a very small argument.',
      'It came out of a hedge that no one was allowed to trim this year.',
      'Gnomes keep them in a jar, away from the children and the mayor.',
    ],
    grip: [0.04, 0.012, 0],
    parts: [
      { s: 'cone', d: [0.012, 0.15], at: [0.02, 0.012, 0], rot: [0, 0, -90], c: 'bone', seg: 5 },
      { s: 'cone', d: [0.008, 0.05], at: [-0.01, 0.03, 0], rot: [0, 0, 25], c: 'bone', seg: 5 },
    ],
  },
  {
    id: 'fish', name: 'Fish', category: 'food', uses: ['hold', 'craft', 'eat'],
    tags: ['fish', 'minnow', 'silver', 'raw', 'food', 'catch', 'dayg'], emoji: ['🐟'],
    about: 'A silver minnow about 0.35 long, raw and still a little damp. Food and crafting input.',
    examine: [
      'A silver minnow, raw and a little damp, with a look that says it has seen better days in the pond.',
      'Gnome saying: the fish that gets away is always the largest, and always smells of the lake.',
      'Eat it raw if you must, or keep it for the smoke house, where it will improve.',
      'Its tail is still trying to swim, which is a poor sign for anyone who wanted lunch.',
      'Gnomes have a long history of holding fish up to the light and making a face.',
    ],
    grip: [0, 0.05, 0],
    parts: [
      { s: 'ball', d: [0.05], at: [0, 0.05, 0], scale: [3.5, 1, 0.7], c: 'silver', seg: 6 },
      { s: 'box', d: [0.05, 0.05, 0.01], at: [-0.2, 0.05, 0], rot: [0, 0, 45], c: 'silver' },
      { s: 'ball', d: [0.008], at: [0.13, 0.058, 0.03], c: 'black', seg: 4 },
    ],
  },
  {
    id: 'smoked-fish', name: 'Smoked Fish', category: 'food', uses: ['hold', 'craft', 'eat'],
    tags: ['smoked', 'fish', 'smoke', 'brown', 'food', 'cured', 'dayg'], emoji: [],
    about: 'A smoked minnow, brown and dry, threaded on a short twig. Food.',
    examine: [
      'A brown, dry minnow threaded on a twig, smelling of a hearth that was lit with care.',
      'Gnome saying: fish is only fish until it has been smoked. Then it is provisions.',
      'Keeps for a week in a dry jar, or until someone finds it under the bench.',
      'Its smell wanders off down the lane and brings back company.',
      'The twig is the only part that was never meant to be eaten. Gnomes argue about this every winter.',
    ],
    grip: [0, 0.06, 0],
    parts: [
      { s: 'cyl', d: [0.008, 0.008, 0.36], at: [0, 0.03, 0], rot: [0, 0, 90], c: 'wood-dark', seg: 5 },
      { s: 'ball', d: [0.05], at: [0, 0.07, 0], scale: [3.5, 1, 0.7], c: 'leather', seg: 6 },
      { s: 'ball', d: [0.008], at: [0.13, 0.078, 0.03], c: 'black', seg: 4 },
    ],
  },
];
