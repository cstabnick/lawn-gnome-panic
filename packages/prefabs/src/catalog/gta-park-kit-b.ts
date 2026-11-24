// Gnome Theft Auto: park kit B (garden, pond, allotment) (docs/roadmaps/gta-parks-and-fringe.md). Life-size metres, standing on
// y = 0, centred on x and z, front on +z. Used by the Gnome Theft Auto park layouts (parks/layoutA.ts, parks/layoutB.ts).
import type { PrefabDef } from '../types';

export const GTA_PARK_KIT_B: readonly PrefabDef[] = [
  {
    id: 'park-pavilion', name: 'Park Pavilion', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'park'], emoji: [],
    tint: 0x8a3b2a,
    footprint: { r: 3, h: 3.5 },
    about: 'Gnome Theft Auto: the Park Pavilion. A timber shelter 6 x 4 x 3.5 m with a pitched roof, a long table and two benches underneath. Tint = roof.',
    examine: [
      'A pitched roof rests on four timber legs, with a long slatted table underneath and a bench on either side of it.',
      'Saying: a roof is only a hat for a house that has lost its house, and this one is very generous with its hat.',
      'Tip: sit under the roof when it rains. The rain has been told to stay outside, and mostly it does.',
      'Joke: the benches are so close together that the gnomes sitting on them have never once agreed which end is the front.',
      'Each timber post has a notch cut near the top, one for every Tall One who was seen walking past this roof and never came back.',
    ],
    parts: [
      { s: 'box', d: [0.2, 2.2, 0.2], at: [2.7, 1.1, 1.7], c: 'wood' },
      { s: 'box', d: [0.2, 2.2, 0.2], at: [-2.7, 1.1, 1.7], c: 'wood' },
      { s: 'box', d: [0.2, 2.2, 0.2], at: [2.7, 1.1, -1.7], c: 'wood' },
      { s: 'box', d: [0.2, 2.2, 0.2], at: [-2.7, 1.1, -1.7], c: 'wood' },
      { s: 'box', d: [6.0, 0.15, 2.33], at: [0, 2.8, -1], rot: [-31, 0, 0], c: 'tint' },   // roof slopes
      { s: 'box', d: [6.0, 0.15, 2.33], at: [0, 2.8, 1], rot: [31, 0, 0], c: 'tint' },
      { s: 'box', d: [3.0, 0.1, 0.8], at: [0, 0.75, 0], c: 'wood-light' },                // long table
      { s: 'box', d: [0.1, 0.7, 0.7], at: [-1.2, 0.35, 0], c: 'wood-dark' },              // table trestles
      { s: 'box', d: [0.1, 0.7, 0.7], at: [1.2, 0.35, 0], c: 'wood-dark' },
      { s: 'box', d: [2.6, 0.08, 0.35], at: [0, 0.42, -0.9], c: 'wood' },                 // benches
      { s: 'box', d: [2.6, 0.08, 0.35], at: [0, 0.42, 0.9], c: 'wood' },
      { s: 'box', d: [0.1, 0.38, 0.3], at: [-1.2, 0.19, -0.9], c: 'wood-dark' },           // bench legs
      { s: 'box', d: [0.1, 0.38, 0.3], at: [1.2, 0.19, -0.9], c: 'wood-dark' },
      { s: 'box', d: [0.1, 0.38, 0.3], at: [-1.2, 0.19, 0.9], c: 'wood-dark' },
      { s: 'box', d: [0.1, 0.38, 0.3], at: [1.2, 0.19, 0.9], c: 'wood-dark' },
    ],
  },
  {
    id: 'rose-arch', name: 'Rose Arch', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'rose'], emoji: [],
    tint: 'red',
    footprint: { r: 1, h: 2.6 },
    about: 'Gnome Theft Auto: the Rose Arch. A 2 x 0.8 x 2.6 m lattice arch with rose blooms and leaves along the curve. Tint = blooms.',
    examine: [
      'Two lattice panels hold up a round-topped arch, with rose blooms in clusters along the curve and leaves tucked in between.',
      'Saying: a rose on the arch is worth two in the bush, and the arch has been arguing with the bush about it for years.',
      'Tip: walk under the arch slowly. The blooms drop petals on anyone in a hurry, and the petals always land on the head.',
      'Joke: the roses smell so sweet that the bees have started booking the arch for weddings, and the arch cannot say no.',
      'One rose on the left side of the arch is always slightly redder than the rest, as if it was pinched by someone who regrets it.',
    ],
    parts: [
      { s: 'box', d: [0.08, 1.6, 0.8], at: [-0.95, 0.8, 0], c: 'wood' },                 // side panels
      { s: 'box', d: [0.08, 1.6, 0.8], at: [0.95, 0.8, 0], c: 'wood' },
      { s: 'box', d: [0.1, 0.05, 0.82], at: [-0.95, 0.5, 0], c: 'wood-dark' },           // lattice rails
      { s: 'box', d: [0.1, 0.05, 0.82], at: [-0.95, 1.1, 0], c: 'wood-dark' },
      { s: 'box', d: [0.1, 0.05, 0.82], at: [0.95, 0.5, 0], c: 'wood-dark' },
      { s: 'box', d: [0.1, 0.05, 0.82], at: [0.95, 1.1, 0], c: 'wood-dark' },
      { s: 'box', d: [0.1, 1.6, 0.04], at: [-0.95, 0.8, -0.38], c: 'wood-dark' },         // lattice uprights
      { s: 'box', d: [0.1, 1.6, 0.04], at: [-0.95, 0.8, 0.38], c: 'wood-dark' },
      { s: 'box', d: [0.1, 1.6, 0.04], at: [0.95, 0.8, -0.38], c: 'wood-dark' },
      { s: 'box', d: [0.1, 1.6, 0.04], at: [0.95, 0.8, 0.38], c: 'wood-dark' },
      { s: 'box', d: [0.53, 0.1, 0.8], at: [0.918, 1.846, 0], rot: [0, 0, 105], c: 'wood' },   // arch, six segments
      { s: 'box', d: [0.53, 0.1, 0.8], at: [0.672, 2.272, 0], rot: [0, 0, 135], c: 'wood' },
      { s: 'box', d: [0.53, 0.1, 0.8], at: [0.246, 2.518, 0], rot: [0, 0, 165], c: 'wood' },
      { s: 'box', d: [0.53, 0.1, 0.8], at: [-0.246, 2.518, 0], rot: [0, 0, 195], c: 'wood' },
      { s: 'box', d: [0.53, 0.1, 0.8], at: [-0.672, 2.272, 0], rot: [0, 0, 225], c: 'wood' },
      { s: 'box', d: [0.53, 0.1, 0.8], at: [-0.918, 1.846, 0], rot: [0, 0, 255], c: 'wood' },
      { s: 'ball', d: [0.07], at: [0.866, 2.1, 0], c: 'tint', seg: 6 },                     // rose blooms
      { s: 'ball', d: [0.07], at: [0.5, 2.466, 0], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.07], at: [0, 2.6, 0], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.07], at: [-0.5, 2.466, 0], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.07], at: [-0.866, 2.1, 0], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.09], at: [0.757, 2.357, 0], c: 'leaf', seg: 6 },                  // leaves
      { s: 'ball', d: [0.09], at: [0.277, 2.633, 0], c: 'leaf', seg: 6 },
      { s: 'ball', d: [0.09], at: [-0.277, 2.633, 0], c: 'leaf', seg: 6 },
      { s: 'ball', d: [0.09], at: [-0.757, 2.357, 0], c: 'leaf', seg: 6 },
    ],
  },
  {
    id: 'rose-bush', name: 'Rose Bush', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'rose'], emoji: [],
    tint: 'red',
    footprint: { r: 0.5, h: 0.9 },
    about: 'Gnome Theft Auto: the Rose Bush. A leafy mound 1 x 1 x 0.9 m with seven blooms. Tint = blooms.',
    examine: [
      'A mound of dark leaves with seven red blooms poking through, each one about the size of a thumb and smelling of wet clay.',
      'Saying: a rose has thorns for the same reason a gnome has a temper, which is that it was not expecting to be stood next to.',
      'Tip: cut the dead blooms off in the morning, not the evening. The evening blooms are shy and will go back into the leaves.',
      'Joke: the bush has grown so thick that a bee once got lost inside it for three days and came out a little bit redder.',
      'Under the lowest leaves is a small clay tag, half buried, with a name written on it in letters that only roses can read.',
    ],
    parts: [
      { s: 'ball', d: [0.42], at: [0, 0.37, 0], scale: [1, 0.85, 1], c: 'leaf', seg: 8 },        // leafy mound
      { s: 'ball', d: [0.26], at: [-0.2, 0.24, 0.15], scale: [1, 0.75, 1], c: 'leaf-dark', seg: 8 },
      { s: 'ball', d: [0.26], at: [0.22, 0.24, -0.12], scale: [1, 0.75, 1], c: 'leaf', seg: 8 },
      { s: 'ball', d: [0.3], at: [0, 0.6, 0], c: 'leaf-dark', seg: 8 },
      { s: 'ball', d: [0.07], at: [0.22, 0.5, 0.25], c: 'tint', seg: 6 },                       // blooms
      { s: 'ball', d: [0.07], at: [-0.25, 0.46, 0.2], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.07], at: [0.12, 0.8, 0.1], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.07], at: [-0.1, 0.84, -0.1], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.07], at: [0.3, 0.38, -0.2], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.07], at: [-0.3, 0.4, -0.2], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.07], at: [0.05, 0.38, 0.4], c: 'tint', seg: 6 },
    ],
  },
  {
    id: 'allotment-bed', name: 'Allotment Bed', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'allotment'], emoji: [],
    footprint: { r: 1.5, h: 0.6 },
    about: 'Gnome Theft Auto: the Allotment Bed. A timber-edged bed 3 x 1.4 x 0.6 m of dark soil with rows of cabbages, carrot tops and bean canes.',
    examine: [
      'A timber-edged bed of dark soil, with cabbages in the front row, carrot tops in the middle and bean canes standing at the back.',
      'Saying: a bed that is weeded on Monday will be weeded again on Tuesday, and the weeds know this better than the gnome does.',
      'Tip: water the soil in the evening. The cabbages drink slowly, and the carrots take the water as a personal insult.',
      'Joke: the cabbages are so round that the gnomes have started rolling them down the lane to see which one gets to the bottom first.',
      'Pressed into the soil at one corner is the print of a boot far too large for any gnome, and nobody has dug it up to see.',
    ],
    parts: [
      { s: 'box', d: [3.0, 0.6, 0.12], at: [0, 0.3, -0.64], c: 'wood' },                      // timber edging
      { s: 'box', d: [3.0, 0.6, 0.12], at: [0, 0.3, 0.64], c: 'wood' },
      { s: 'box', d: [0.12, 0.6, 1.16], at: [-1.44, 0.3, 0], c: 'wood' },
      { s: 'box', d: [0.12, 0.6, 1.16], at: [1.44, 0.3, 0], c: 'wood' },
      { s: 'box', d: [2.76, 0.34, 1.16], at: [0, 0.25, 0], c: 'dirt' },                       // soil
      { s: 'ball', d: [0.13], at: [-1.1, 0.52, -0.4], scale: [1, 0.8, 1], c: 'leaf', seg: 8 }, // cabbages
      { s: 'ball', d: [0.13], at: [-0.55, 0.52, -0.4], scale: [1, 0.8, 1], c: 'leaf', seg: 8 },
      { s: 'ball', d: [0.13], at: [0, 0.52, -0.4], scale: [1, 0.8, 1], c: 'leaf', seg: 8 },
      { s: 'ball', d: [0.13], at: [0.55, 0.52, -0.4], scale: [1, 0.8, 1], c: 'leaf', seg: 8 },
      { s: 'ball', d: [0.13], at: [1.1, 0.52, -0.4], scale: [1, 0.8, 1], c: 'leaf', seg: 8 },
      { s: 'cone', d: [0.05, 0.12], at: [-1.1, 0.48, 0], c: 'leaf-dark', seg: 5 },             // carrot tops
      { s: 'cone', d: [0.05, 0.12], at: [-0.55, 0.48, 0], c: 'leaf-dark', seg: 5 },
      { s: 'cone', d: [0.05, 0.12], at: [0, 0.48, 0], c: 'leaf-dark', seg: 5 },
      { s: 'cone', d: [0.05, 0.12], at: [0.55, 0.48, 0], c: 'leaf-dark', seg: 5 },
      { s: 'cone', d: [0.05, 0.12], at: [1.1, 0.48, 0], c: 'leaf-dark', seg: 5 },
      { s: 'cyl', d: [0.012, 0.012, 0.16], at: [-1.1, 0.5, 0.4], c: 'wood-light', seg: 4 },      // bean canes
      { s: 'cyl', d: [0.012, 0.012, 0.16], at: [-0.55, 0.5, 0.4], c: 'wood-light', seg: 4 },
      { s: 'cyl', d: [0.012, 0.012, 0.16], at: [0, 0.5, 0.4], c: 'wood-light', seg: 4 },
      { s: 'cyl', d: [0.012, 0.012, 0.16], at: [0.55, 0.5, 0.4], c: 'wood-light', seg: 4 },
      { s: 'cyl', d: [0.012, 0.012, 0.16], at: [1.1, 0.5, 0.4], c: 'wood-light', seg: 4 },
    ],
  },
  {
    id: 'cold-frame', name: 'Cold Frame', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'cold'], emoji: [],
    footprint: { r: 0.7, h: 0.6 },
    about: 'Gnome Theft Auto: the Cold Frame. A low timber box 1.4 x 0.8 x 0.6 m with a sloped pale glass lid, slightly open, and seedlings inside.',
    examine: [
      'A low timber box with a tilted glass lid, propped slightly open, and four seedlings standing in the soil like tiny green hats.',
      'Saying: glass keeps the warm in and the cold out, and a seedling learns from both sides of the lid before it ever sees the sun.',
      'Tip: lift the lid a finger width on sunny days. A seedling shut in too long grows pale and suspicious of everyone.',
      'Joke: the seedlings were told they were growing for a great prize, and they have been growing sideways ever since, out of spite.',
      'The glass has a faint crack across one corner, and through the crack at dusk a face seems to press back at you.',
    ],
    parts: [
      { s: 'box', d: [1.4, 0.3, 0.06], at: [0, 0.15, 0.37], c: 'wood' },                       // walls
      { s: 'box', d: [1.4, 0.3, 0.06], at: [0, 0.15, -0.37], c: 'wood' },
      { s: 'box', d: [0.06, 0.3, 0.68], at: [-0.67, 0.15, 0], c: 'wood' },
      { s: 'box', d: [0.06, 0.3, 0.68], at: [0.67, 0.15, 0], c: 'wood' },
      { s: 'box', d: [1.26, 0.2, 0.68], at: [0, 0.1, 0], c: 'dirt' },                          // soil
      { s: 'box', d: [1.36, 0.02, 0.86], at: [0, 0.45, 0], rot: [20.6, 0, 0], c: 'glass' },   // sloped lid
      { s: 'cone', d: [0.05, 0.12], at: [-0.45, 0.26, 0], c: 'leaf', seg: 5 },                 // seedlings
      { s: 'cone', d: [0.05, 0.12], at: [-0.15, 0.26, 0], c: 'leaf', seg: 5 },
      { s: 'cone', d: [0.05, 0.12], at: [0.15, 0.26, 0], c: 'leaf', seg: 5 },
      { s: 'cone', d: [0.05, 0.12], at: [0.45, 0.26, 0], c: 'leaf', seg: 5 },
    ],
  },
  {
    id: 'park-monument', name: 'Park Monument', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'park'], emoji: [],
    tint: 0xf08a24,
    footprint: { r: 1.2, h: 4.5 },
    about: 'Gnome Theft Auto: the Park Monument. A stepped stone plinth with a bronze gnome figure 4.5 m tall. Tint = the traffic cone on his hat.',
    examine: [
      'A stepped stone plinth carries a bronze gnome with one arm raised, a pointed hat, and a traffic cone set on the very top.',
      'Saying: the bronze never forgets a face, but the face forgets to take its hat off, so the hat is left to stand in for it.',
      'Tip: read the inscription in the morning, before the pigeons arrive and start correcting it in their own handwriting.',
      'Joke: the traffic cone has been on the statue so long that the council has stopped asking for it back and started asking for rent.',
      'Somebody has polished the bronze hand very bright, and a row of small fingerprints runs up the arm, too low to be a gnome.',
    ],
    parts: [
      { s: 'box', d: [2.4, 0.8, 2.4], at: [0, 0.4, 0], c: 'stone' },                         // plinth, two steps
      { s: 'box', d: [1.8, 0.8, 1.8], at: [0, 1.2, 0], c: 'stone-dark' },
      { s: 'box', d: [1.4, 0.4, 0.05], at: [0, 0.4, 1.225], c: 'chalk' },                    // inscription panel
      { s: 'cyl', d: [0.3, 0.4, 1.2], at: [0, 2.2, 0], c: 0x8a6a3a, seg: 8 },                // bronze figure
      { s: 'ball', d: [0.25], at: [0, 3.0, 0], c: 0x8a6a3a, seg: 8 },
      { s: 'ball', d: [0.2], at: [0, 2.85, 0.15], scale: [1, 1.2, 0.8], c: 0x8a6a3a, seg: 8 },
      { s: 'cyl', d: [0.08, 0.08, 0.9], at: [0.5, 3.0, 0], rot: [0, 0, -20], c: 0x8a6a3a, seg: 6 },
      { s: 'ball', d: [0.1], at: [0.65, 3.45, 0], c: 0x8a6a3a, seg: 6 },
      { s: 'cone', d: [0.3, 0.8], at: [0, 3.6, 0], c: 0x8a6a3a, seg: 8 },                     // pointed hat
      { s: 'cone', d: [0.12, 0.5], at: [0, 4.25, 0], c: 'tint', seg: 6 },                    // traffic cone
    ],
  },
  {
    id: 'park-noticeboard', name: 'Park Noticeboard', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'park'], emoji: [],
    tint: 'leaf-dark',
    footprint: { r: 0.8, h: 2 },
    about: 'Gnome Theft Auto: the Park Noticeboard. A 1.6 x 0.3 x 2 m board on two posts with a little roof and papers pinned to it. Tint = frame.',
    examine: [
      'A framed board on two posts, under a little roof, with three papers pinned to the cork: a notice, a note and a list of something.',
      'Saying: a board is only as honest as the last paper pinned to it, and the last paper is nearly always about a lost cat.',
      'Tip: read the notices from the top down. The important ones are always at the top and the rude ones always at the bottom.',
      'Joke: the frame has been painted so often that it has grown a second, greener layer and now complains about the first.',
      'Under the roof someone has pinned a tiny drawing of a gnome with its arms out, and a note beneath it that reads, simply, come back.',
    ],
    parts: [
      { s: 'box', d: [0.09, 1.5, 0.09], at: [-0.7, 0.75, 0], c: 'wood-dark' },               // posts
      { s: 'box', d: [0.09, 1.5, 0.09], at: [0.7, 0.75, 0], c: 'wood-dark' },
      { s: 'box', d: [1.6, 1.1, 0.06], at: [0, 1.05, 0], c: 'tint' },                       // frame
      { s: 'box', d: [1.44, 0.9, 0.03], at: [0, 1.05, 0.045], c: 'wood-light' },            // cork
      { s: 'box', d: [1.6, 0.1, 0.32], at: [0, 1.94, 0], c: 'tint' },                       // little roof
      { s: 'box', d: [0.3, 0.34, 0.01], at: [-0.38, 1.3, 0.07], c: 'paper' },               // pinned papers
      { s: 'box', d: [0.28, 0.3, 0.01], at: [0.12, 1.25, 0.07], rot: [0, 0, 4], c: 'paper' },
      { s: 'box', d: [0.26, 0.3, 0.01], at: [0.38, 0.85, 0.07], rot: [0, 0, -6], c: 'parchment' },
    ],
  },
  {
    id: 'duck-house', name: 'Duck House', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'duck'], emoji: [],
    footprint: { r: 0.6, h: 1.4 },
    about: 'Gnome Theft Auto: the Duck House. A wooden platform 1.2 m square with a little slate-roofed duck house and a ramp up to it.',
    examine: [
      'A small wooden house with a slate roof stands on a flat platform, with a sloping plank up to it and a dark door on the front.',
      'Saying: a duck will live anywhere with a roof and a plank, and will not thank you for either, but it will come back for the bread.',
      'Tip: put the ramp on the side facing the water. Ducks take the shortest route to a dry floor and never look where they are going.',
      'Joke: the duck house has a better view of the pond than the ducks do, and the ducks have never once been asked to vote on it.',
      'A little white duck always sits on the platform, carved from a single piece of bone, and it has never once been seen to move.',
    ],
    parts: [
      { s: 'box', d: [1.2, 0.2, 0.8], at: [0, 0.1, -0.2], c: 'wood' },                       // platform
      { s: 'wedge', d: [0.3, 0.2, 0.4], at: [0, 0.1, 0.4], rot: [0, 180, 0], c: 'wood-light' }, // ramp
      { s: 'box', d: [0.7, 0.7, 0.6], at: [0, 0.55, -0.15], c: 'wood-light' },              // house walls
      { s: 'box', d: [0.6, 0.06, 0.7], at: [-0.2, 1.1, -0.15], rot: [0, 0, 45], c: 'slate' }, // roof slopes
      { s: 'box', d: [0.6, 0.06, 0.7], at: [0.2, 1.1, -0.15], rot: [0, 0, -45], c: 'slate' },
      { s: 'box', d: [0.2, 0.3, 0.02], at: [0, 0.5, 0.16], c: 'black' },                    // door
      { s: 'ball', d: [0.08], at: [-0.47, 0.28, -0.4], c: 'white', seg: 6 },                // duck
    ],
  },
  {
    id: 'water-butt', name: 'Water Butt', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'water'], emoji: [],
    footprint: { r: 0.35, h: 1 },
    about: 'Gnome Theft Auto: the Water Butt. A green rain barrel 0.7 m across and 1 m tall with a lid, hoops and a brass tap, on a brick stand.',
    examine: [
      'A green barrel with a wooden lid and a brass tap on its front, standing on a low brick stand, with two iron hoops round its middle.',
      'Saying: rain comes down for everyone, but only the barrel gets to keep it, which is why the barrel is always a little smug.',
      'Tip: turn the tap slowly. Water that comes out fast is cold, and a gnome who gets it down the collar will say things about the weather.',
      'Joke: the barrel has been so full of rain that a frog once moved in, paid the rent in lily pads, and was never seen to leave.',
      'Inside the lid, scratched into the wood, is a list of every gnome who has ever stood in the rain to fill it, and most of them crossed out.',
    ],
    parts: [
      { s: 'box', d: [0.6, 0.2, 0.6], at: [0, 0.1, 0], c: 'clay' },                          // brick stand
      { s: 'cyl', d: [0.33, 0.35, 0.72], at: [0, 0.56, 0], c: 'green', seg: 10 },           // barrel
      { s: 'cyl', d: [0.36, 0.36, 0.08], at: [0, 0.96, 0], c: 'wood-dark', seg: 10 },        // lid
      { s: 'ring', d: [0.345, 0.02], at: [0, 0.3, 0], rot: [90, 0, 0], c: 'iron-dark', seg: 10 }, // hoops
      { s: 'ring', d: [0.345, 0.02], at: [0, 0.78, 0], rot: [90, 0, 0], c: 'iron-dark', seg: 10 },
      { s: 'cyl', d: [0.025, 0.025, 0.03], at: [0, 0.35, 0.345], rot: [90, 0, 0], c: 'brass', seg: 6 }, // tap
    ],
  },
];
