// Gnome Golf course: trees, flagstick, tee marker.
// The trees are at 1/10 of their in-game size: Gnome Golf scales each copy by 10 * s (see games/gnome-golf/src/world.ts).
import type { PrefabDef } from '../types';

export const GOLF: readonly PrefabDef[] = [
  {
    id: 'broadleaf-tree', name: 'Broadleaf Tree', category: 'prop', uses: ['place'],
    footprint: { r: 0.2, h: 3 },
    tags: ['tree', 'broadleaf', 'leafy', 'garden', 'golf'], emoji: [], tint: 0x3b8f3a,
    about: 'A round-crowned leafy tree at a tenth of its course size. The canopy takes the tint; buildPrefabInstances can colour each copy.',
    examine: [
      'A round green crown on a short brown trunk. Gnomes climb it only in summer.',
      'Every leaf is a small green promise, or so the Planting says.',
      'Shade is free, but the birds that live in it are not.',
      'Gnome law: fruit that falls on the short grass belongs to whoever is nearest.',
      'Its roots are older than the path beside it, and it knows it.',
    ],
    parts: [
      { s: 'cyl', d: [0.02, 0.02, 0.4], at: [0, 0.2, 0], c: 0x6b4a2b, seg: 6 },
      { s: 'ball', d: [0.3], at: [0, 0.45, 0], c: 'tint' },
    ],
  },
  {
    id: 'palm-tree', name: 'Palm Tree', category: 'prop', uses: ['place'],
    tags: ['tree', 'palm', 'coast', 'beach', 'golf'], emoji: [],
    about: 'A tall palm with a crown of drooping fronds, at a tenth of its course size. Fronds are a single flat cone.',
    examine: [
      'Tall and thin, with a crown of fronds like a spilled green umbrella.',
      'Gnomes say palms grow where the sea was once a friend.',
      'Sit in its shade and the wind cannot find your hat.',
      'Coconuts fall without warning. Stand well clear of anything round and heavy.',
      'Fronds rattle in a breeze, which is how the Mossbottom children know where the wind is.',
    ],
    parts: [
      { s: 'cyl', d: [0.022, 0.032, 0.7], at: [0, 0.35, 0], c: 0x8d6e4b, seg: 6 },
      { s: 'cone', d: [0.36, 0.24], at: [0, 0.7, 0], rot: [180, 0, 0], scale: [1, 0.35, 1], c: 0x2d6e2b, seg: 7 },
    ],
  },
  {
    id: 'island-oak', name: 'Island Oak', category: 'prop', uses: ['place'],
    tags: ['tree', 'oak', 'giant', 'big', 'garden', 'golf'], emoji: [], tint: 0x3f8a35,
    about: 'A giant oak with a wide crown and two side lobes, at a tenth of its course size. The crown and lobes take the tint.',
    examine: [
      'A great oak, wide as a shed, with lobes like a family of green clouds.',
      'The Charters say an oak planted at a birth outlives the gnome who planted it.',
      'Do not golf beneath it. The ball always knows where the branches are.',
      'Acorns fall like rude remarks: from above, and without warning.',
      'Older than the path, and still looking for its own edge.',
    ],
    parts: [
      { s: 'cyl', d: [0.09, 0.16, 1.2], at: [0, 0.6, 0], c: 0x5b3a22, seg: 8 },
      { s: 'ball', d: [1.1], scale: [1, 0.727, 1], at: [0, 1.5, 0], c: 'tint' },
      { s: 'ball', d: [0.7], scale: [1, 0.786, 1], at: [0.5, 1.4, 0.1], c: 'tint' },
      { s: 'ball', d: [0.7], scale: [1, 0.786, 1], at: [-0.5, 1.2, -0.1], c: 'tint' },
    ],
  },
  {
    id: 'island-pine', name: 'Island Pine', category: 'prop', uses: ['place'],
    tags: ['tree', 'pine', 'conifer', 'tall', 'golf'], emoji: [],
    about: 'A tall pine: a dark trunk with three stacked cone tiers, at a tenth of its course size.',
    examine: [
      'Three dark tiers of needles over a tall, straight trunk.',
      'Gnome saying: a pine keeps its green all winter, and so should you.',
      'Its needles are slippery underfoot. A tip for those who hurry.',
      'Good for climbing, bad for getting down.',
      'The tallest thing in the garden that is not the Fence.',
    ],
    parts: [
      { s: 'cyl', d: [0.05, 0.09, 1.8], at: [0, 0.9, 0], c: 0x4a3020, seg: 6 },
      { s: 'cone', d: [0.6, 0.9], at: [0, 1.0, 0], c: 0x1f4d2b, seg: 8 },
      { s: 'cone', d: [0.45, 0.8], at: [0, 1.5, 0], c: 0x1f4d2b, seg: 8 },
      { s: 'cone', d: [0.3, 0.6], at: [0, 2.0, 0], c: 0x1f4d2b, seg: 8 },
    ],
  },
  {
    id: 'golf-flagstick', name: 'Flagstick', category: 'prop', uses: ['place'],
    tags: ['flag', 'flagstick', 'pin', 'pole', 'golf', 'cup'], emoji: [], tint: 0xd93636,
    about: 'The white pole and red flag that mark a hole. The flag hangs from a pivot named "flag" so it can turn with the wind.',
    examine: [
      'A white pole with a red cloth, put up to say: the cup is here.',
      'Gnomes once thought the flag was the hole\'s gift to the wind.',
      'Lift it out before you putt, or the ball may bounce back off it.',
      'The flag points whichever way the wind goes, which is why gnomes never trust it.',
      'Red for the cup, white for the pole, and a gnome\'s temper in between.',
    ],
    parts: [
      { s: 'cyl', d: [0.03, 0.03, 2.6], at: [0, 1.3, 0], c: 'white', seg: 6 },
      { s: 'box', d: [0.9, 0.55, 0.01], at: [0.49, 2.3, 0], c: 'tint', name: 'flag-cloth', group: 'flag' }, // clear of the pole (no z-fighting)
    ],
    pivots: { flag: [0, 2.3, 0] },
  },
  {
    id: 'tee-marker', name: 'Tee Marker', category: 'prop', uses: ['place'],
    tags: ['marker', 'tee', 'blue', 'golf', 'start'], emoji: [],
    about: 'A blue ball set on the grass to mark the tee box. Two stand side by side on each tee.',
    examine: [
      'A blue ball set on the grass, marking where the first swing begins.',
      'The Planting says blue is for beginnings. Gnomes say blue is for rolling away.',
      'Stand behind it, not in front. Ask any gnome who tried the other way.',
      'Two of them mark each tee, four yards apart, so you know where to stand.',
      'Smooth and painted, a lovely thing to kick.',
    ],
    parts: [
      { s: 'ball', d: [0.25], at: [0, 0.25, 0], c: 0x2a6fd6 },
    ],
  },
];
