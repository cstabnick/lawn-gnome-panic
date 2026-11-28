// Gnome Theft Auto (E16): Brassknock Manor and its grounds. The house is authored at HALF size: the game places it with
// scale 2 (46 x 18 m body). Pale stone walls, a slate roof, dark sash windows (0.03 proud), brass fittings, nothing coplanar.
import type { PrefabDef } from '../types';

const STONE = 0xe8e0cc;   // pale Brassknock stone
const SLATE = 0x4a4f57;
const DOOR = 0x2f5a3a;    // dark green front door
const PANE = 0x2b3a4a;    // dark window glass

export const GTA_COUNTRY_MANOR: readonly PrefabDef[] = [
  {
    id: 'brassknock-manor', name: 'Brassknock Manor', category: 'prop', uses: ['place'],
    tags: ['manor', 'house', 'mansion', 'brassknock', 'stone', 'slate', 'terrace', 'knocker', 'trellisdown', 'gta'],
    emoji: [],
    footprint: { r: 12.5, h: 8.2 },
    about: 'Gnome Theft Auto: Brassknock Manor. Half-size (game scale 2): 23 x 9 m pale stone body, walls 5 tall, a hipped slate roof to y 8, seven chimneys, a projecting centre bay with a green door and a brass knocker, a front terrace with balustrade and three steps. Front on +z.',
    examine: [
      'A long pale house with seven chimneys and a slate roof, and a dark green door under a brass knocker the size of a cart wheel.',
      'Saying: the knocker was hung when the charter was signed, and nobody has used it since. Everyone goes round the back.',
      'Tip: use the back door. The front one opens only for the charter, and the charter was signed a very long time ago.',
      'Joke: seven chimneys, and the Countess lights one of them. Asked why, she says the others are for the look of the thing.',
      'Most of the rooms are shut. A ledger room at the back holds the family accounts, cheques to the HOA included.',
    ],
    parts: [
      { s: 'box', d: [23, 5, 9], at: [0, 2.5, 0], c: STONE },                                              // walls
      { s: 'box', d: [23.1, 0.4, 9.1], at: [0, 0.2, 0], c: 'stone-dark' },                                  // plinth
      { s: 'box', d: [23.2, 0.3, 5.41], at: [0, 6.5, 2.25], rot: [33.69, 0, 0], c: SLATE },                // roof, front slope
      { s: 'box', d: [23.2, 0.3, 5.41], at: [0, 6.5, -2.25], rot: [-33.69, 0, 0], c: SLATE },              // roof, back slope
      { s: 'box', d: [6, 4.5, 0.5], at: [0, 2.75, 4.75], c: STONE },                                       // centre bay
      { s: 'wedge', d: [6, 1, 0.5], at: [0, 5.5, 4.75], rot: [0, 180, 0], c: SLATE },                      // bay pediment
      { s: 'box', d: [1.4, 2.4, 0.04], at: [0, 1.8, 5.02], c: DOOR },                                      // front door
      { s: 'ring', d: [0.42, 0.03], at: [0, 2.0, 5.08], c: 'brass' },                                      // brass knocker
      { s: 'box', d: [11, 0.6, 1.5], at: [0, 0.3, 5.25], c: 'stone' },                                     // front terrace
      { s: 'box', d: [4.5, 0.08, 0.12], at: [-3.25, 0.95, 5.94], c: 'stone', mirror: true },               // balustrade rail
      { s: 'box', d: [0.12, 0.35, 0.12], at: [-5.4, 0.775, 5.94], c: 'stone', mirror: true },              // balustrade posts
      { s: 'box', d: [0.12, 0.35, 0.12], at: [-4.0, 0.775, 5.94], c: 'stone', mirror: true },
      { s: 'box', d: [0.12, 0.35, 0.12], at: [-2.6, 0.775, 5.94], c: 'stone', mirror: true },
      { s: 'box', d: [2, 0.45, 0.25], at: [0, 0.225, 6.125], c: 'stone' },                                 // step 1
      { s: 'box', d: [2, 0.3, 0.25], at: [0, 0.15, 6.375], c: 'stone' },                                   // step 2
      { s: 'box', d: [2, 0.15, 0.25], at: [0, 0.075, 6.625], c: 'stone' },                                 // step 3
      { s: 'box', d: [0.9, 1.4, 0.06], at: [4, 2.0, 4.53], c: PANE, mirror: true },                        // lower front windows
      { s: 'box', d: [0.9, 1.4, 0.06], at: [6, 2.0, 4.53], c: PANE, mirror: true },
      { s: 'box', d: [0.9, 1.4, 0.06], at: [8, 2.0, 4.53], c: PANE, mirror: true },
      { s: 'box', d: [0.9, 1.4, 0.06], at: [10, 2.0, 4.53], c: PANE, mirror: true },
      { s: 'box', d: [0.9, 1.4, 0.06], at: [4, 3.9, 4.53], c: PANE, mirror: true },                        // upper front windows
      { s: 'box', d: [0.9, 1.4, 0.06], at: [6, 3.9, 4.53], c: PANE, mirror: true },
      { s: 'box', d: [0.9, 1.4, 0.06], at: [8, 3.9, 4.53], c: PANE, mirror: true },
      { s: 'box', d: [0.9, 1.4, 0.06], at: [10, 3.9, 4.53], c: PANE, mirror: true },
      { s: 'box', d: [0.06, 1.4, 0.9], at: [11.53, 2.0, -2.5], c: PANE, mirror: true },                    // side windows, three a side
      { s: 'box', d: [0.06, 1.4, 0.9], at: [11.53, 2.0, 0], c: PANE, mirror: true },
      { s: 'box', d: [0.06, 1.4, 0.9], at: [11.53, 2.0, 2.5], c: PANE, mirror: true },
      { s: 'box', d: [0.7, 2, 0.7], at: [-10, 8.6, 0], c: 'stone' },                                       // seven chimney stacks
      { s: 'box', d: [0.7, 2, 0.7], at: [-6.6, 8.6, 0], c: 'stone' },
      { s: 'box', d: [0.7, 2, 0.7], at: [-3.3, 8.6, 0], c: 'stone' },
      { s: 'box', d: [0.7, 2, 0.7], at: [0, 8.6, 0], c: 'stone' },
      { s: 'box', d: [0.7, 2, 0.7], at: [3.3, 8.6, 0], c: 'stone' },
      { s: 'box', d: [0.7, 2, 0.7], at: [6.6, 8.6, 0], c: 'stone' },
      { s: 'box', d: [0.7, 2, 0.7], at: [10, 8.6, 0], c: 'stone' },
      { s: 'ball', d: [0.28], at: [0, 10.1, 0], c: 'stone', scale: [1, 0.8, 1] },                          // smoke puff, middle chimney
    ],
  },
  {
    id: 'manor-gate', name: 'Brassknock gate', category: 'prop', uses: ['place'],
    tags: ['gate', 'gates', 'iron', 'stone', 'pier', 'manor', 'brassknock', 'trellisdown', 'gta'],
    emoji: [],
    about: 'Gnome Theft Auto: the Brassknock gate. Two stone piers 3 tall at x +-4.4 with stone balls on top, two black iron gate leaves standing open at about 80 degrees, and a brass B plate on the left pier. The 8 m gap between the piers is clear. Pivots mark the two hinges.',
    pivots: { 'hinge-left': [-4, 0, 0], 'hinge-right': [4, 0, 0] },
    examine: [
      'Two stone piers topped with stone balls, and a pair of black iron gates standing open, as if they expect visitors who never come.',
      'Saying: a gate left open is an invitation. A gate left open for a century is a policy.',
      'Tip: the gap is eight metres wide, which is exactly enough for a cart and a disagreement, so do not argue in the middle.',
      'A small brass plate on the left pier has a letter B on it, polished bright by a great many hands that never knocked.',
      'The gates have never been shut. The gardener says the bolt went missing in the charter year, and nobody has looked for it.',
    ],
    parts: [
      { s: 'box', d: [0.8, 3, 0.8], at: [-4.4, 1.5, 0], c: 'stone', mirror: true },                        // piers
      { s: 'ball', d: [0.3], at: [-4.4, 3.3, 0], c: 'stone', mirror: true },                                // stone balls
      { s: 'box', d: [0.4, 0.5, 0.03], at: [-4.4, 1.6, 0.415], c: 'brass' },                              // brass B plate
      // left gate leaf, hinged at x -4.0 and swung open 80 degrees; the right leaf is its mirror image
      { s: 'box', d: [3.8, 0.06, 0.06], at: [-3.67, 0.1, -1.87], rot: [0, 80, 0], c: 'black', mirror: true },   // bottom rail
      { s: 'box', d: [3.8, 0.06, 0.06], at: [-3.67, 2.15, -1.87], rot: [0, 80, 0], c: 'black', mirror: true },  // top rail
      { s: 'box', d: [0.05, 2.2, 0.05], at: [-3.957, 1.1, -0.246], rot: [0, 80, 0], c: 'black', mirror: true }, // bars
      { s: 'box', d: [0.05, 2.2, 0.05], at: [-3.8, 1.1, -1.132], rot: [0, 80, 0], c: 'black', mirror: true },
      { s: 'box', d: [0.05, 2.2, 0.05], at: [-3.644, 1.1, -2.018], rot: [0, 80, 0], c: 'black', mirror: true },
      { s: 'box', d: [0.05, 2.2, 0.05], at: [-3.488, 1.1, -2.905], rot: [0, 80, 0], c: 'black', mirror: true },
    ],
  },
  {
    id: 'manor-wall', name: 'Manor wall', category: 'prop', uses: ['place'],
    tags: ['wall', 'stone', 'coping', 'ivy', 'manor', 'brassknock', 'garden', 'gta'],
    emoji: [],
    footprint: { r: 3, h: 2 },
    about: 'Gnome Theft Auto: a 6 m run of pale Brassknock garden wall along x, 2 tall and 0.5 thick, with a coping slab on top and three ivy clumps on the front face. Front on +z.',
    examine: [
      'Six metres of pale stone wall with a coping along the top, and ivy climbing the front as if it has been told to.',
      'Saying: a wall is only a suggestion to a vine, and the coping is the vine\'s way of saying thank you.',
      'Tip: the top of the wall is a fine place to sit and watch the vines, provided you do not walk along it.',
      'Joke: the wall was built to keep the neighbours out. The neighbours were not consulted, and have climbed it twice since.',
      'Every spring someone cuts a neat notch in the coping, one for each year the ivy has got over the top. The notches are very old.',
    ],
    parts: [
      { s: 'box', d: [6, 2, 0.5], at: [0, 1.0, 0], c: STONE },                                            // wall
      { s: 'box', d: [5.9, 0.12, 0.65], at: [0, 2.06, 0], c: 'stone' },                                   // coping
      { s: 'ball', d: [0.25], at: [-2.2, 1.6, 0.3], c: 'leaf-dark', scale: [1, 0.7, 0.4] },              // ivy clumps
      { s: 'ball', d: [0.25], at: [0.4, 1.3, 0.3], c: 'leaf-dark', scale: [1, 0.7, 0.4] },
      { s: 'ball', d: [0.25], at: [2.1, 1.7, 0.3], c: 'leaf', scale: [1, 0.7, 0.4] },
    ],
  },
  {
    id: 'manor-urn', name: 'Stone urn', category: 'prop', uses: ['place'],
    tags: ['urn', 'stone', 'plinth', 'flowers', 'garden', 'manor', 'brassknock', 'gta'],
    emoji: [],
    footprint: { r: 0.4, h: 1.55 },
    about: 'Gnome Theft Auto: a stone urn on a square plinth, about 1.55 tall, with trailing red flowers spilling over the rim. Stands alone on the manor grounds.',
    examine: [
      'A stone urn on a square plinth, its rim spilling red flowers down one side like a hat left out in the rain.',
      'Saying: the urn holds the rain for the flowers, and the flowers hold the urn up in the wind.',
      'Tip: the flowers come up every year whether you water them or not, which is the whole trick of Brassknock gardening.',
      'Joke: the urn has been empty for thirty years, and the flowers have never once mentioned it.',
      'Someone pressed a thumb-sized mark into the plinth, long before the urn was placed. It could be a fingerprint, or a claw.',
    ],
    parts: [
      { s: 'box', d: [0.6, 0.7, 0.6], at: [0, 0.35, 0], c: 'stone' },                                     // plinth
      { s: 'box', d: [0.7, 0.1, 0.7], at: [0, 0.75, 0], c: 'stone-dark' },                                 // plinth cap
      { s: 'ball', d: [0.36], at: [0, 1.12, 0], c: 'stone', scale: [1, 0.9, 1] },                         // urn bowl
      { s: 'cyl', d: [0.26, 0.26, 0.1], at: [0, 1.5, 0], c: 'stone-dark', seg: 8 },                        // urn rim
      { s: 'ball', d: [0.08], at: [0.26, 1.25, 0.22], c: 'red', mirror: true },                           // red flowers
      { s: 'ball', d: [0.08], at: [0.18, 1.12, 0.33], c: 'red', mirror: true },
      { s: 'ball', d: [0.1], at: [0, 0.9, 0.38], c: 'leaf' },                                              // trailing leaves
    ],
  },
  {
    id: 'manor-sundial', name: 'Sundial', category: 'prop', uses: ['place'],
    tags: ['sundial', 'dial', 'brass', 'stone', 'pedestal', 'garden', 'manor', 'brassknock', 'gta'],
    emoji: [],
    footprint: { r: 0.4, h: 1.15 },
    about: 'Gnome Theft Auto: a stone sundial on the manor lawn, about 1.1 tall: a stone pedestal, a brass dial and a thin gnomon standing up from the middle.',
    examine: [
      'A stone pedestal with a brass dial on top and a thin blade standing up from its middle, pointing at a sun that is not always there.',
      'Saying: the shadow tells the hour, but only when someone remembers to look at it.',
      'Tip: stand with your back to the sun and the shadow is always exactly where you expected it, which is suspicious.',
      'Joke: the sundial is never wrong, only late, and it is always late by about the length of a lunch.',
      'The dial has twelve marks and a small, uncertain thirteenth one, which the Countess says is for guests.',
    ],
    parts: [
      { s: 'cyl', d: [0.38, 0.38, 0.1], at: [0, 0.05, 0], c: 'stone-dark', seg: 8 },                        // base
      { s: 'cyl', d: [0.2, 0.28, 0.8], at: [0, 0.5, 0], c: 'stone', seg: 8 },                                // pedestal
      { s: 'cyl', d: [0.42, 0.42, 0.04], at: [0, 0.92, 0], c: 'brass', seg: 12 },                          // brass dial
      { s: 'wedge', d: [0.04, 0.2, 0.2], at: [0, 1.04, 0], c: 'brass' },                                     // gnomon
    ],
  },
  {
    id: 'tasting-table', name: 'Tasting table', category: 'prop', uses: ['place'],
    tags: ['table', 'tasting', 'cloth', 'bottles', 'glasses', 'grapes', 'wine', 'manor', 'trellisdown', 'brassknock', 'gta'],
    emoji: [],
    footprint: { r: 1.6, h: 0.8 },
    about: 'Gnome Theft Auto: the tasting table in the Trellisdown hall. About 3 x 0.9 m, 0.7 tall, a white cloth over the top, two brass-capped green bottles, eight tiny glasses in a row and a bowl of grapes.',
    examine: [
      'A long table under a white cloth, with two brass-capped green bottles and a row of tiny glasses set out for the tasting.',
      'Saying: a grape is a small sweet argument that always ends well for whoever drinks it.',
      'Tip: take one glass at a time. Grape-dew is sweet, pours slowly, and goes to the head at the speed of a snail.',
      'Joke: the brass caps are for show. The bottles are not, but nobody has ever asked the bottles what they think.',
      'The cloth was white on the day it was laid. It has been white every day since, which the staff find suspicious.',
    ],
    parts: [
      { s: 'box', d: [3, 0.08, 0.9], at: [0, 0.66, 0], c: 'wood' },                                      // table top
      { s: 'box', d: [3.06, 0.03, 0.96], at: [0, 0.71, 0], c: 'cloth' },                                   // white cloth
      { s: 'box', d: [0.08, 0.62, 0.08], at: [1.4, 0.31, 0.35], c: 'wood-dark', mirror: true },            // legs
      { s: 'box', d: [0.08, 0.62, 0.08], at: [1.4, 0.31, -0.35], c: 'wood-dark', mirror: true },
      { s: 'cyl', d: [0.07, 0.07, 0.3], at: [0.6, 0.875, -0.15], c: 'glaze-green', seg: 8, mirror: true },  // bottles
      { s: 'cyl', d: [0.025, 0.025, 0.1], at: [0.6, 1.075, -0.15], c: 'glaze-green', seg: 6, mirror: true },
      { s: 'cyl', d: [0.03, 0.03, 0.03], at: [0.6, 1.14, -0.15], c: 'brass', seg: 6, mirror: true },       // brass caps
      { s: 'cyl', d: [0.04, 0.035, 0.06], at: [1.26, 0.755, 0.25], c: 'glass', seg: 6, mirror: true },     // tiny glasses
      { s: 'cyl', d: [0.04, 0.035, 0.06], at: [0.9, 0.755, 0.25], c: 'glass', seg: 6, mirror: true },
      { s: 'cyl', d: [0.04, 0.035, 0.06], at: [0.54, 0.755, 0.25], c: 'glass', seg: 6, mirror: true },
      { s: 'cyl', d: [0.04, 0.035, 0.06], at: [0.18, 0.755, 0.25], c: 'glass', seg: 6, mirror: true },
      { s: 'cyl', d: [0.14, 0.08, 0.06], at: [0, 0.755, -0.18], c: 'white', seg: 10 },                      // grape bowl
      { s: 'ball', d: [0.035], at: [0.03, 0.82, -0.2], c: 'purple', mirror: true },                        // grapes
      { s: 'ball', d: [0.035], at: [0, 0.85, -0.16], c: 'purple' },
    ],
  },
];
