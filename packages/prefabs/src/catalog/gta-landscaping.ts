// Gnome Theft Auto: garden landscaping (issue 1C). Life-size scenery: 1 unit = 1 metre, standing on y = 0, centred on
// x and z. Each piece has a `footprint`, so the size limit for scenery is 30 m (not the 3 m of hand-held items).
// Used by games/gnome-theft-auto (landscaping.ts lays out the Turfton gardens, scenery.ts the countryside belts).
import type { PrefabDef } from '../types';

export const GTA_LANDSCAPING: readonly PrefabDef[] = [
  {
    id: 'hedgerow', name: 'Hedgerow', category: 'prop', uses: ['place'],
    tags: ['hedge', 'hedgerow', 'leaf', 'clipped', 'border', 'garden', 'landscaping', 'green'], emoji: [],
    footprint: { r: 2, h: 1.3 },
    about: 'Gnome Theft Auto: the Hedgerow. A clipped hedge 4 long, 1 deep and 1.3 tall, with a rounded leafy top. Life-size metres, for Gnome Theft Auto landscaping.',
    examine: [
      'A long clipped hedge, dark green on the body and paler where the shears have been kind to the leaves, with a rounded top like a row of sleeping cushions.',
      'Saying: a hedge is a wall that grows its own bricks, and it will complain loudly if you ask it to stop.',
      'Tip: go round the end of a hedge rather than through it. The middle is thicker than it looks and full of small, unhappy birds.',
      'Joke: the hedge has been trimmed so often that it now has a fringe, and the gardener is very proud of the fringe.',
      'Something has built a nest in the top, and the nest has been there so long that it has its own gate.',
    ],
    parts: [
      { s: 'box', d: [4.0, 0.9, 1.0], at: [0, 0.45, 0], c: 'leaf-dark' },                        // clipped body
      { s: 'ball', d: [0.3], at: [-1.6, 1.0, 0], c: 'leaf', seg: 8 },                            // leafy top bumps
      { s: 'ball', d: [0.3], at: [-0.8, 1.0, 0], c: 'leaf-dark', seg: 8 },
      { s: 'ball', d: [0.3], at: [0, 1.0, 0], c: 'leaf', seg: 8 },
      { s: 'ball', d: [0.3], at: [0.8, 1.0, 0], c: 'leaf-dark', seg: 8 },
      { s: 'ball', d: [0.3], at: [1.6, 1.0, 0], c: 'leaf', seg: 8 },
      { s: 'box', d: [0.9, 0.5, 0.04], at: [-1.2, 0.5, 0.52], c: 'leaf' },                      // lighter patches
      { s: 'box', d: [1.1, 0.45, 0.04], at: [1.0, 0.5, 0.52], c: 'leaf' },
      { s: 'box', d: [0.8, 0.4, 0.04], at: [0.3, 0.5, -0.52], c: 'leaf' },
    ],
  },
  {
    id: 'hedge-arch', name: 'Hedge Arch', category: 'prop', uses: ['place'],
    tags: ['hedge', 'arch', 'gateway', 'gate', 'entrance', 'leaf', 'garden', 'landscaping'], emoji: [],
    footprint: { r: 2, h: 2.8 },
    about: 'Gnome Theft Auto: the Hedge Arch. A hedge gateway 4 wide, 1 deep and 2.8 tall, with a walk-through opening 1.8 wide and 2.1 tall. Life-size metres, for Gnome Theft Auto landscaping.',
    examine: [
      'A hedge gateway with two thick hedge posts and a lintel across the top, so the gap through the middle is just wide enough for one gnome with a bag of seed.',
      'Saying: the gate in the hedge is always open, but it is only ever open to those who know which leaves to push.',
      'Tip: duck as you go under. The top of the arch is rounded for a reason, and the reason is the gardener who walked into it once.',
      'Joke: the arch was grown to welcome visitors, and it has welcomed a great many, most of whom then had to be let out again.',
      'Someone has tied a ribbon to the lintel long ago. It has faded to no colour at all, but the knot still holds.',
    ],
    parts: [
      { s: 'box', d: [1.1, 2.8, 1.0], at: [1.45, 1.4, 0], c: 'leaf-dark', mirror: true },       // side hedge posts
      { s: 'box', d: [1.8, 0.5, 1.0], at: [0, 2.35, 0], c: 'leaf-dark' },                       // lintel
      { s: 'ball', d: [0.5], at: [0, 2.6, 0], scale: [1, 0.4, 1], c: 'leaf', seg: 10 },          // rounded top
    ],
  },
  {
    id: 'dry-stone-wall', name: 'Dry-Stone Wall', category: 'prop', uses: ['place'],
    tags: ['wall', 'stone', 'dry', 'drystone', 'moss', 'boundary', 'garden', 'landscaping'], emoji: [],
    footprint: { r: 2, h: 1 },
    about: 'Gnome Theft Auto: the Dry-Stone Wall. A 4 m section, 0.6 thick and 1 tall, three staggered courses of grey stone with capstones and a moss patch. Life-size metres, for Gnome Theft Auto landscaping.',
    examine: [
      'Three staggered courses of grey stone with no mortar at all, held together by the patient weight of the stones and the grudging agreement of the moss.',
      'Saying: a dry wall is built by people who never once asked the wall how it felt about being built.',
      'Tip: do not lean on the capstones. They are only balanced, and a balanced stone has very little sense of humour.',
      'Joke: the wall has kept every sheep in the fell for a century, and has never once been thanked by a sheep.',
      'A stone near the middle has a hole worn right through it. Gnomes say you can see the far side if you squint, and a little luck.',
    ],
    parts: [
      { s: 'box', d: [1.0, 0.3, 0.6], at: [-1.5, 0.15, 0], c: 'stone' },                       // course 1
      { s: 'box', d: [1.0, 0.3, 0.6], at: [-0.5, 0.15, 0], c: 'stone-dark' },
      { s: 'box', d: [1.0, 0.3, 0.6], at: [0.5, 0.15, 0], c: 'stone' },
      { s: 'box', d: [1.0, 0.3, 0.6], at: [1.5, 0.15, 0], c: 'stone-dark' },
      { s: 'box', d: [1.0, 0.3, 0.56], at: [-1.0, 0.45, 0], c: 'stone-dark' },                 // course 2, staggered
      { s: 'box', d: [1.0, 0.3, 0.56], at: [0.0, 0.45, 0], c: 'stone' },
      { s: 'box', d: [1.0, 0.3, 0.56], at: [1.0, 0.45, 0], c: 'stone-dark' },
      { s: 'box', d: [1.0, 0.25, 0.6], at: [-1.5, 0.725, 0], c: 'stone' },                    // course 3
      { s: 'box', d: [1.0, 0.25, 0.6], at: [-0.5, 0.725, 0], c: 'stone-dark' },
      { s: 'box', d: [1.0, 0.25, 0.6], at: [0.5, 0.725, 0], c: 'stone' },
      { s: 'box', d: [1.0, 0.25, 0.6], at: [1.5, 0.725, 0], c: 'stone-dark' },
      { s: 'box', d: [0.22, 0.15, 0.6], at: [-1.5, 0.925, 0], c: 'stone-dark' },              // upright capstones
      { s: 'box', d: [0.22, 0.15, 0.6], at: [-0.5, 0.925, 0], c: 'stone' },
      { s: 'box', d: [0.22, 0.15, 0.6], at: [0.5, 0.925, 0], c: 'stone-dark' },
      { s: 'box', d: [0.22, 0.15, 0.6], at: [1.5, 0.925, 0], c: 'stone' },
      { s: 'box', d: [0.6, 0.04, 0.4], at: [-0.9, 0.87, 0], c: 'moss' },                       // moss patch
    ],
  },
  {
    id: 'flower-bed', name: 'Flower Bed', category: 'prop', uses: ['place'],
    tags: ['flower', 'flowers', 'bed', 'raised', 'border', 'petal', 'garden', 'landscaping'], emoji: [],
    tint: 'pink',
    footprint: { r: 1.5, h: 0.6 },
    about: 'Gnome Theft Auto: the Flower Bed. A raised clay-edged bed 3 by 1.4, three rows of flowers in the tint colour with a few white ones. Life-size metres, for Gnome Theft Auto landscaping.',
    examine: [
      'A raised bed of dark soil edged in clay bricks, with three neat rows of flowers nodding on their stems as if they have just heard a joke.',
      'Saying: a flower bed that is weeded on Sunday will be weeded again on Monday, and this is considered a happy arrangement.',
      'Tip: pick from the edge, not the middle. The middle flowers have been counted, and somebody will notice.',
      'Joke: the petals are very pretty, and they are also very good at making gnomes sneeze, which the bed finds funny.',
      'A pale white bloom has come up in the front row every spring for as long as anyone has kept a record, and nobody planted it.',
    ],
    parts: [
      { s: 'box', d: [3.0, 0.3, 0.1], at: [0, 0.15, 0.65], c: 'clay' },                          // edging, long sides
      { s: 'box', d: [3.0, 0.3, 0.1], at: [0, 0.15, -0.65], c: 'clay' },
      { s: 'box', d: [0.1, 0.3, 1.2], at: [1.45, 0.15, 0], c: 'clay' },                          // edging, short sides
      { s: 'box', d: [0.1, 0.3, 1.2], at: [-1.45, 0.15, 0], c: 'clay' },
      { s: 'box', d: [2.8, 0.06, 1.2], at: [0, 0.27, 0], c: 'dirt' },                           // soil
      { s: 'cyl', d: [0.015, 0.015, 0.2], at: [-1.05, 0.4, -0.36], c: 'leaf', seg: 6 },        // row 1 stems
      { s: 'cyl', d: [0.015, 0.015, 0.2], at: [-0.35, 0.4, -0.36], c: 'leaf', seg: 6 },
      { s: 'cyl', d: [0.015, 0.015, 0.2], at: [0.35, 0.4, -0.36], c: 'leaf', seg: 6 },
      { s: 'cyl', d: [0.015, 0.015, 0.2], at: [1.05, 0.4, -0.36], c: 'leaf', seg: 6 },
      { s: 'cyl', d: [0.015, 0.015, 0.2], at: [-1.05, 0.4, 0], c: 'leaf', seg: 6 },           // row 2 stems
      { s: 'cyl', d: [0.015, 0.015, 0.2], at: [-0.35, 0.4, 0], c: 'leaf', seg: 6 },
      { s: 'cyl', d: [0.015, 0.015, 0.2], at: [0.35, 0.4, 0], c: 'leaf', seg: 6 },
      { s: 'cyl', d: [0.015, 0.015, 0.2], at: [1.05, 0.4, 0], c: 'leaf', seg: 6 },
      { s: 'cyl', d: [0.015, 0.015, 0.2], at: [-1.05, 0.4, 0.36], c: 'leaf', seg: 6 },        // row 3 stems
      { s: 'cyl', d: [0.015, 0.015, 0.2], at: [-0.35, 0.4, 0.36], c: 'leaf', seg: 6 },
      { s: 'cyl', d: [0.015, 0.015, 0.2], at: [0.35, 0.4, 0.36], c: 'leaf', seg: 6 },
      { s: 'cyl', d: [0.015, 0.015, 0.2], at: [1.05, 0.4, 0.36], c: 'leaf', seg: 6 },
      { s: 'ball', d: [0.07], at: [-1.05, 0.52, -0.36], c: 'tint', seg: 6 },                   // flower heads
      { s: 'ball', d: [0.07], at: [-0.35, 0.52, -0.36], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.07], at: [0.35, 0.52, -0.36], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.07], at: [1.05, 0.52, -0.36], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.07], at: [-1.05, 0.52, 0], c: 'white', seg: 6 },
      { s: 'ball', d: [0.07], at: [-0.35, 0.52, 0], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.07], at: [0.35, 0.52, 0], c: 'white', seg: 6 },
      { s: 'ball', d: [0.07], at: [1.05, 0.52, 0], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.07], at: [-1.05, 0.52, 0.36], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.07], at: [-0.35, 0.52, 0.36], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.07], at: [0.35, 0.52, 0.36], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.07], at: [1.05, 0.52, 0.36], c: 'tint', seg: 6 },
    ],
  },
  {
    id: 'garden-border', name: 'Garden Border', category: 'prop', uses: ['place'],
    tags: ['border', 'edging', 'flower', 'brick', 'scallop', 'strip', 'garden', 'landscaping'], emoji: [],
    tint: 'pink',
    footprint: { r: 1.5, h: 0.45 },
    about: 'Gnome Theft Auto: the Garden Border. A 3 m strip with a scalloped brick edge and a row of low flowers and leaves behind it. Life-size metres, for Gnome Theft Auto landscaping.',
    examine: [
      'A scalloped brick edge, each bump pressed into place by a patient hand, with a row of low flowers standing behind it like a crowd at a parade.',
      'Saying: a border is the line between what you planted and what the weeds have agreed to leave alone.',
      'Tip: step over the bricks, not onto them. The bricks are much harder than your boots, and they have a long memory.',
      'Joke: the edging was laid so straight that the gardener checked it with a string, and then checked the string.',
      'Under the leaves at one end there is a small tin plate, face down, which the border will not explain.',
    ],
    parts: [
      { s: 'box', d: [3.0, 0.2, 0.16], at: [0, 0.1, 0.17], c: 'clay' },                        // brick base
      { s: 'ball', d: [0.1], at: [-1.2, 0.2, 0.22], scale: [1, 0.6, 1], c: 'clay', seg: 6 },   // scallops
      { s: 'ball', d: [0.1], at: [-0.6, 0.2, 0.22], scale: [1, 0.6, 1], c: 'clay', seg: 6 },
      { s: 'ball', d: [0.1], at: [0, 0.2, 0.22], scale: [1, 0.6, 1], c: 'clay', seg: 6 },
      { s: 'ball', d: [0.1], at: [0.6, 0.2, 0.22], scale: [1, 0.6, 1], c: 'clay', seg: 6 },
      { s: 'ball', d: [0.1], at: [1.2, 0.2, 0.22], scale: [1, 0.6, 1], c: 'clay', seg: 6 },
      { s: 'box', d: [2.9, 0.25, 0.2], at: [0, 0.125, -0.06], c: 'leaf' },                    // leaf strip
      { s: 'ball', d: [0.12], at: [-0.9, 0.2, -0.1], scale: [1, 0.7, 1], c: 'leaf-dark', seg: 6 },
      { s: 'ball', d: [0.12], at: [0, 0.2, -0.1], scale: [1, 0.7, 1], c: 'leaf-dark', seg: 6 },
      { s: 'ball', d: [0.12], at: [0.9, 0.2, -0.1], scale: [1, 0.7, 1], c: 'leaf-dark', seg: 6 },
      { s: 'ball', d: [0.08], at: [-1.2, 0.34, -0.08], c: 'tint', seg: 6 },                   // low flowers
      { s: 'ball', d: [0.08], at: [-0.6, 0.34, -0.08], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.08], at: [0, 0.34, -0.08], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.08], at: [0.6, 0.34, -0.08], c: 'tint', seg: 6 },
      { s: 'ball', d: [0.08], at: [1.2, 0.34, -0.08], c: 'tint', seg: 6 },
    ],
  },
  {
    id: 'rock-garden', name: 'Rock Garden', category: 'prop', uses: ['place'],
    tags: ['rock', 'rocks', 'boulder', 'alpine', 'gravel', 'moss', 'garden', 'landscaping'], emoji: [],
    footprint: { r: 1.5, h: 0.9 },
    about: 'Gnome Theft Auto: the Rock Garden. About 3 m across: a low gravel mound with mossy boulders, alpine tufts and two little flower clusters. Life-size metres, for Gnome Theft Auto landscaping.',
    examine: [
      'A low mound of pale gravel with grey boulders of every size sitting on it, the biggest one wearing a green cap of moss like a tiny hat.',
      'Saying: a rock is only a stone that has stopped trying to go anywhere, and a rock garden is a row of them that have agreed to stay.',
      'Tip: climb the small rocks, not the big one. The big one has been sat on by a great many gnomes and is very tired of it.',
      'Joke: the alpine tufts are very proud of how little water they need, and they say so every time it rains.',
      'Two clusters of tiny flowers grow between the stones, one yellow and one pink, and they have never once been introduced.',
    ],
    parts: [
      { s: 'ball', d: [1.4], at: [0, 0.28, 0], scale: [1, 0.2, 1], c: 0xb9b5ad, seg: 10 },     // gravel mound
      { s: 'ball', d: [0.45], at: [0.1, 0.45, -0.2], scale: [1, 1, 0.9], c: 'stone', seg: 8 }, // big boulder (0.9 tall)
      { s: 'ball', d: [0.3], at: [-0.8, 0.24, 0.3], scale: [1, 0.8, 1], c: 'stone-dark', seg: 8 },
      { s: 'ball', d: [0.25], at: [0.8, 0.2, 0.5], scale: [1, 0.8, 1], c: 'slate', seg: 8 },
      { s: 'ball', d: [0.2], at: [-0.4, 0.16, -0.7], scale: [1, 0.8, 1], c: 'stone', seg: 8 },
      { s: 'ball', d: [0.18], at: [0.9, 0.14, -0.6], scale: [1, 0.8, 1], c: 'stone-dark', seg: 8 },
      { s: 'ball', d: [0.12], at: [-1.0, 0.1, -0.1], scale: [1, 0.8, 1], c: 'slate', seg: 6 },
      { s: 'ball', d: [0.3], at: [0.1, 0.86, -0.2], scale: [1, 0.25, 1], c: 'moss', seg: 8 },  // moss cap on the big boulder
      { s: 'ball', d: [0.15], at: [-0.8, 0.5, 0.3], scale: [1, 0.4, 1], c: 'moss', seg: 6 },   // moss on a smaller one
      { s: 'cone', d: [0.12, 0.2], at: [-0.3, 0.28, 0.4], c: 'leaf-dark', seg: 6 },           // alpine tufts
      { s: 'cone', d: [0.1, 0.18], at: [0.4, 0.28, 0.8], c: 'leaf', seg: 6 },
      { s: 'ball', d: [0.05], at: [-0.6, 0.34, 0.1], c: 'pink', seg: 6 },                     // flower cluster, pink
      { s: 'ball', d: [0.05], at: [-0.5, 0.33, 0.15], c: 'pink', seg: 6 },
      { s: 'ball', d: [0.05], at: [0.5, 0.3, -0.3], c: 'yellow', seg: 6 },                    // flower cluster, yellow
      { s: 'ball', d: [0.05], at: [0.56, 0.29, -0.25], c: 'yellow', seg: 6 },
    ],
  },
  {
    id: 'boxwood-ball', name: 'Boxwood Ball', category: 'prop', uses: ['place'],
    tags: ['boxwood', 'shrub', 'ball', 'topiary', 'clipped', 'round', 'bush', 'garden', 'landscaping'], emoji: [],
    footprint: { r: 0.5, h: 1 },
    about: 'Gnome Theft Auto: the Boxwood Ball. A clipped round shrub 1 m tall, a dark green ball with a lighter cap. Life-size metres, for Gnome Theft Auto landscaping.',
    examine: [
      'A round clipped shrub, dark green and perfectly spherical, with a lighter cap on top where the new growth has been allowed to show.',
      'Saying: a ball of box is the only thing in the garden that has never once rolled away, and it is very proud of that.',
      'Tip: sit on the lighter side. The darker side is still wet from the last shower and has opinions about it.',
      'Joke: it has been clipped into a perfect sphere so many times that the gardener now calls it the Circle of Doubt.',
      'A small leaf has grown out on one side where the shears missed it. The shrub has decided to keep it, and nobody is going to argue.',
    ],
    parts: [
      { s: 'ball', d: [0.5], at: [0, 0.5, 0], c: 'leaf-dark', seg: 8 },                         // round body
      { s: 'ball', d: [0.45], at: [0, 0.78, 0], scale: [1, 0.5, 1], c: 'leaf', seg: 8 },        // lighter cap
      { s: 'ball', d: [0.15], at: [0.3, 0.5, 0.25], c: 'leaf', seg: 6 },                       // stray leaf tuft
    ],
  },
  {
    id: 'topiary-cone', name: 'Topiary Cone', category: 'prop', uses: ['place'],
    tags: ['topiary', 'cone', 'clipped', 'shrub', 'pot', 'terracotta', 'tree', 'garden', 'landscaping'], emoji: [],
    footprint: { r: 0.5, h: 2.2 },
    about: 'Gnome Theft Auto: the Topiary Cone. A clipped green cone 2.2 m tall on a short trunk in a terracotta pot. Life-size metres, for Gnome Theft Auto landscaping.',
    examine: [
      'A clipped green cone standing very straight on a short brown trunk, growing out of a terracotta pot that has seen better days and several better gardens.',
      'Saying: a cone is a tree that has been told to be neat, and neat trees are always a little bit frightened.',
      'Tip: do not hide behind it at dusk. The cone looks like a gnome from a distance, and the gnome it looks like is not friendly.',
      'Joke: the pot has a crack along one side that the gardener calls character, which is the sort of thing gardeners say.',
      'Under the rim there is a little drawing of a snail, scratched into the clay by someone with more time than sense.',
    ],
    parts: [
      { s: 'cyl', d: [0.35, 0.28, 0.4], at: [0, 0.2, 0], c: 'terracotta', seg: 10 },           // pot
      { s: 'cyl', d: [0.38, 0.38, 0.08], at: [0, 0.44, 0], c: 'clay', seg: 10 },                // rim
      { s: 'cyl', d: [0.33, 0.33, 0.05], at: [0, 0.45, 0], c: 'dirt', seg: 10 },                // soil
      { s: 'cyl', d: [0.05, 0.06, 0.5], at: [0, 0.73, 0], c: 'bark', seg: 6 },                  // trunk
      { s: 'cone', d: [0.5, 1.3], at: [0, 1.55, 0], c: 'leaf-dark', seg: 8 },                   // clipped cone
    ],
  },
  {
    id: 'ornamental-grass', name: 'Ornamental Grass', category: 'prop', uses: ['place'],
    tags: ['grass', 'ornamental', 'plume', 'clump', 'straw', 'blade', 'garden', 'landscaping'], emoji: [],
    footprint: { r: 0.5, h: 1.1 },
    about: 'Gnome Theft Auto: the Ornamental Grass. A fanned clump of thin blades about 1.1 m tall with three straw-coloured plume heads. Life-size metres, for Gnome Theft Auto landscaping.',
    examine: [
      'A fanned clump of thin green blades leaning out in every direction, with three pale plumes swaying above them like the feathers on a tired hat.',
      'Saying: grass that leans is grass that is listening, and this grass has been leaning in on the gnomes for years.',
      'Tip: part the blades from the outside. From the middle they cut, and the cut stays cut for a surprisingly long time.',
      'Joke: the plumes are very fine, very soft and very good at getting into the collar of anybody who walks past.',
      'In a windy week the whole clump rattles like a box of dried peas, and the sparrows come to see what the fuss is about.',
    ],
    parts: [
      { s: 'box', d: [0.04, 1.1, 0.03], at: [0.1, 0.52, 0], rot: [0, 0, -18], c: 'leaf', seg: 4 },
      { s: 'box', d: [0.04, 1.1, 0.03], at: [0.07, 0.52, 0.07], rot: [12.7, 0, -12.7], c: 'moss', seg: 4 },
      { s: 'box', d: [0.04, 1.1, 0.03], at: [0, 0.52, 0.1], rot: [18, 0, 0], c: 'leaf', seg: 4 },
      { s: 'box', d: [0.04, 1.1, 0.03], at: [-0.07, 0.52, 0.07], rot: [12.7, 0, 12.7], c: 'moss', seg: 4 },
      { s: 'box', d: [0.04, 1.1, 0.03], at: [-0.1, 0.52, 0], rot: [0, 0, 18], c: 'leaf', seg: 4 },
      { s: 'box', d: [0.04, 1.1, 0.03], at: [-0.07, 0.52, -0.07], rot: [-12.7, 0, 12.7], c: 'moss', seg: 4 },
      { s: 'box', d: [0.04, 1.1, 0.03], at: [0, 0.52, -0.1], rot: [-18, 0, 0], c: 'leaf', seg: 4 },
      { s: 'box', d: [0.04, 1.1, 0.03], at: [0.07, 0.52, -0.07], rot: [-12.7, 0, -12.7], c: 'moss', seg: 4 },
      { s: 'ball', d: [0.045], at: [0, 0.93, 0.25], scale: [1, 3, 1], c: 'straw', seg: 6 },    // plume heads
      { s: 'ball', d: [0.045], at: [0.13, 0.9, -0.09], scale: [1, 3, 1], c: 'straw', seg: 6 },
      { s: 'ball', d: [0.045], at: [-0.16, 0.88, -0.02], scale: [1, 3, 1], c: 'straw', seg: 6 },
    ],
  },
  {
    id: 'stone-planter', name: 'Stone Planter', category: 'prop', uses: ['place'],
    tags: ['planter', 'stone', 'tree', 'pot', 'box', 'round', 'garden', 'landscaping'], emoji: [],
    footprint: { r: 0.8, h: 2.4 },
    about: 'Gnome Theft Auto: the Stone Planter. A 1.6 m square stone box with a rim, soil and a small round-headed tree about 2.4 m tall. Life-size metres, for Gnome Theft Auto landscaping.',
    examine: [
      'A square stone planter with a neat rim, soil packed in on top, and a little round-headed tree standing in the middle as if it is waiting for a bus.',
      'Saying: a planter keeps a tree from wandering, which is the only thing a tree has ever been grateful for.',
      'Tip: sit on the rim, not the soil. The soil is for the roots, and the roots are very sensitive about their sleep.',
      'Joke: the tree has a round head because the gardener ran out of time to make it any other shape, and it has been pleased about this ever since.',
      'Carved into one side of the stone, very faintly, is a row of numbers that nobody can add up and nobody dares to rub out.',
    ],
    parts: [
      { s: 'box', d: [1.6, 0.7, 1.6], at: [0, 0.35, 0], c: 'stone' },                          // stone box
      { s: 'box', d: [1.7, 0.08, 0.1], at: [0, 0.74, 0.8], c: 'stone-dark' },                   // rim, front
      { s: 'box', d: [1.7, 0.08, 0.1], at: [0, 0.74, -0.8], c: 'stone-dark' },                  // rim, back
      { s: 'box', d: [0.1, 0.08, 1.5], at: [0.8, 0.74, 0], c: 'stone-dark' },                   // rim, right
      { s: 'box', d: [0.1, 0.08, 1.5], at: [-0.8, 0.74, 0], c: 'stone-dark' },                  // rim, left
      { s: 'box', d: [1.5, 0.04, 1.5], at: [0, 0.72, 0], c: 'dirt' },                           // soil
      { s: 'cyl', d: [0.07, 0.09, 0.9], at: [0, 1.19, 0], c: 'bark', seg: 6 },                  // trunk
      { s: 'ball', d: [0.5], at: [0, 1.9, 0], c: 'leaf', seg: 8 },                              // round head
      { s: 'ball', d: [0.36], at: [0.2, 2.1, 0.1], c: 'leaf-dark', seg: 8 },                    // round head, second lobe
    ],
  },
  {
    id: 'lavender-row', name: 'Lavender Row', category: 'prop', uses: ['place'],
    tags: ['lavender', 'row', 'herb', 'mound', 'purple', 'spike', 'hedge', 'garden', 'landscaping'], emoji: [],
    footprint: { r: 1.25, h: 0.6 },
    about: 'Gnome Theft Auto: the Lavender Row. Five soft purple-grey mounds in a row 2.5 m long, each with a purple flower spike. Life-size metres, for Gnome Theft Auto landscaping.',
    examine: [
      'Five soft grey-purple mounds in a neat line, each one topped with a tall spike of purple flowers that smell of clean linen and very old summers.',
      'Saying: lavender is the herb that calms the gnomes down, and it is the only herb that has ever been asked to.',
      'Tip: brush past a mound on your way by. The scent will follow you for the rest of the day, and you will not mind.',
      'Joke: the bees come to the row in such numbers that the gardener has had to put up a sign asking them to take turns.',
      'Someone has dried a bunch of the spikes and hung them from a nail in the wall. Nobody has taken them down since the last harvest.',
    ],
    parts: [
      { s: 'ball', d: [0.27], at: [-1.0, 0.19, 0], scale: [1, 0.7, 1], c: 0x9a8fb0, seg: 8 },   // mounds
      { s: 'ball', d: [0.27], at: [-0.5, 0.19, 0], scale: [1, 0.7, 1], c: 0x9a8fb0, seg: 8 },
      { s: 'ball', d: [0.27], at: [0, 0.19, 0], scale: [1, 0.7, 1], c: 0x9a8fb0, seg: 8 },
      { s: 'ball', d: [0.27], at: [0.5, 0.19, 0], scale: [1, 0.7, 1], c: 0x9a8fb0, seg: 8 },
      { s: 'ball', d: [0.27], at: [1.0, 0.19, 0], scale: [1, 0.7, 1], c: 0x9a8fb0, seg: 8 },
      { s: 'cyl', d: [0.02, 0.03, 0.3], at: [-1.0, 0.3, 0], c: 'purple', seg: 6 },              // flower spikes
      { s: 'cyl', d: [0.02, 0.03, 0.3], at: [-0.5, 0.3, 0], c: 'purple', seg: 6 },
      { s: 'cyl', d: [0.02, 0.03, 0.3], at: [0, 0.3, 0], c: 'purple', seg: 6 },
      { s: 'cyl', d: [0.02, 0.03, 0.3], at: [0.5, 0.3, 0], c: 'purple', seg: 6 },
      { s: 'cyl', d: [0.02, 0.03, 0.3], at: [1.0, 0.3, 0], c: 'purple', seg: 6 },
      { s: 'ball', d: [0.04], at: [-1.0, 0.47, 0], c: 'amethyst', seg: 6 },                    // spike tips
      { s: 'ball', d: [0.04], at: [-0.5, 0.47, 0], c: 'amethyst', seg: 6 },
      { s: 'ball', d: [0.04], at: [0, 0.47, 0], c: 'amethyst', seg: 6 },
      { s: 'ball', d: [0.04], at: [0.5, 0.47, 0], c: 'amethyst', seg: 6 },
      { s: 'ball', d: [0.04], at: [1.0, 0.47, 0], c: 'amethyst', seg: 6 },
    ],
  },
];
