// Gnome Theft Auto: European kit (E29, docs/roadmaps/gta-batch-3/E29/). Three wearable achievement rewards.
import type { PrefabDef } from '../types';

export const GTA_EURO_GEAR: readonly PrefabDef[] = [
  // ---- Tour Beret (head) ---------------------------------------------------------------------------------------------
  {
    id: 'tour-beret', name: 'Tour Beret', category: 'armor', uses: ['wear-head'],
    tags: ['beret', 'hat', 'cap', 'navy', 'felt', 'badge', 'acorn', 'tour', 'gta', 'euro'], emoji: [],
    tint: 0x1f2a44,
    about: 'Gnome Theft Auto: the Tour Beret. A squashed navy felt beret (the tint), tilted, with a stalk on top and a tiny enamel acorn badge on the front. Head slot.',
    examine: [
      'A navy felt beret, squashed flat and tilted to one side, with a short stalk on top and a tiny acorn badge.',
      'Saying: a beret worn level is a beret worn by someone who has not been anywhere yet.',
      'Tip: tilt it to the left on a bad day. People will assume you meant to and leave you alone.',
      'Joke: it keeps off the rain for about a third of a drizzle, which is a very good rate for a hat.',
      'Inside the band is stitched a small number and the words not for the lunch break, and nobody has ever asked why.',
    ],
    parts: [
      { s: 'cyl', d: [0.115, 0.115, 0.03], at: [0, 0.015, 0], c: 0x151c30, seg: 10, name: 'band' },
      { s: 'ball', d: [0.15], at: [0, 0.075, 0], rot: [0, 0, 8], scale: [1, 0.45, 1], c: 'tint', seg: 10, name: 'crown' },
      { s: 'cyl', d: [0.012, 0.014, 0.04], at: [0.012, 0.148, 0], c: 'tint', seg: 6, name: 'stalk' },
      { s: 'ball', d: [0.022], at: [0, 0.07, 0.13], scale: [1, 1, 0.5], c: 'gold', seg: 6, name: 'badge' },
    ],
  },

  // ---- Baguette Quiver (back) ----------------------------------------------------------------------------------------
  {
    id: 'baguette-quiver', name: 'Baguette Quiver', category: 'armor', uses: ['wear-back'],
    wear: { at: [0, 0, 0.03] },
    tags: ['quiver', 'baguette', 'bread', 'canvas', 'tube', 'strap', 'back', 'gta', 'euro'], emoji: [],
    tint: 0xc9b48a,
    about: 'Gnome Theft Auto: the Baguette Quiver. A tall canvas tube (the tint) with a strap and a leather rim, and four baguettes poking out of the top. Back slot.',
    examine: [
      'A tall canvas tube with a leather strap and four baguettes poking out the top at their own angles.',
      'Saying: a gnome with bread on the back is never the first one turned away from the door.',
      'Tip: keep the baguettes dry and the tube shut. The pigeons are watching and they know what a quiver is.',
      'Joke: it is a quiver in name only. The only thing it has ever fired at is lunch.',
      'The bottom of the tube has a small door that opens, and what comes out is always crumbs and a very old receipt.',
    ],
    parts: [
      { s: 'cyl', d: [0.09, 0.09, 0.36], at: [0, 0.18, 0], c: 'tint', seg: 10, name: 'tube' },
      { s: 'ring', d: [0.09, 0.015], rot: [90, 0, 0], at: [0, 0.36, 0], c: 'leather', seg: 10, name: 'rim' },
      { s: 'cyl', d: [0.098, 0.098, 0.04], at: [0, 0.12, 0], c: 'leather', seg: 10, name: 'band' },
      { s: 'box', d: [0.03, 0.3, 0.03], at: [0, 0.2, 0.1], rot: [0, 0, 6], c: 'leather-dark', name: 'strap' },
      { s: 'pill', d: [0.02, 0.12], at: [-0.035, 0.4, 0], rot: [0, 0, 12], c: 0xd9a441, seg: 6, name: 'baguette-a' },
      { s: 'pill', d: [0.02, 0.12], at: [0.035, 0.4, 0], rot: [0, 0, -12], c: 0xd9a441, seg: 6, name: 'baguette-b' },
      { s: 'pill', d: [0.02, 0.12], at: [0, 0.4, 0.035], rot: [14, 0, 0], c: 0xd9a441, seg: 6, name: 'baguette-c' },
      { s: 'pill', d: [0.02, 0.12], at: [0, 0.4, -0.035], rot: [-14, 0, 0], c: 0xd9a441, seg: 6, name: 'baguette-d' },
    ],
  },

  // ---- Riviera Scarf (neck) ------------------------------------------------------------------------------------------
  {
    id: 'riviera-scarf', name: 'Riviera Scarf', category: 'armor', uses: ['wear-neck'],
    wear: { at: [0, -0.15, 0] },
    tags: ['scarf', 'neck', 'blue', 'stripes', 'knot', 'silk', 'riviera', 'gta', 'euro'], emoji: [],
    tint: 0x2f6bb0, trim: 0xf4f4f0,
    about: 'Gnome Theft Auto: the Riviera Scarf. A knotted blue neck scarf (the tint) with a white stripe wrap (the trim) and two short tails at the front. Neck slot.',
    examine: [
      'A blue silk scarf knotted at the front, with a white stripe wrapped round it and two short tails.',
      'Saying: the knot is for the wind, and the wind is for the one who forgot to tie it.',
      'Tip: wear it even when it is warm. A scarf is not for warmth, it is for being seen to have one.',
      'Joke: the stripes are said to be a famous coastline. It is a very short coast and a very long lunch.',
      'One tail has a tiny stitched initial, in a hand nobody in the yard can place.',
    ],
    parts: [
      { s: 'ring', d: [0.13, 0.04], rot: [90, 0, 0], at: [0, 0.04, 0], c: 'tint', seg: 10, name: 'wrap' },
      { s: 'ring', d: [0.12, 0.03], rot: [90, 0, 0], at: [0, 0.09, 0], c: 'trim', seg: 10, name: 'stripe' },
      { s: 'ball', d: [0.05], at: [0, 0.07, 0.15], c: 'tint', seg: 6, name: 'knot' },
      { s: 'box', d: [0.05, 0.14, 0.02], at: [-0.03, 0.07, 0.19], rot: [0, 0, 6], c: 'tint', name: 'tail-a' },
      { s: 'box', d: [0.05, 0.1, 0.02], at: [0.035, 0.05, 0.19], rot: [0, 0, -8], c: 'tint', name: 'tail-b' },
      { s: 'box', d: [0.05, 0.015, 0.03], at: [-0.03, 0.05, 0.19], rot: [0, 0, 6], c: 'trim', name: 'tail-stripe' },
    ],
  },
];
