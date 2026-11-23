// Pay 'n' Glaze prefabs (lamps). One owner: the issue that fills this file. Starts empty.
import type { PrefabDef } from '../types';

const LENS = 0xfff3b8; // pale yellow lens

export const GTA_GLAZE_LAMPS: readonly PrefabDef[] = [
  {
    id: 'glaze-lamp-round', name: 'Bug-Eye Rounds', category: 'prop', uses: ['place'],
    tags: ['glaze', 'lamp', 'headlight', 'round', 'bezel', 'chrome'], emoji: [],
    about: 'Pay \'n\' Glaze headlamp, the Bug-Eye Rounds: two chrome bezels with big round glass lenses on a black bracket. The bezel is fixed chrome; the lens is pale yellow.',
    examine: [
      'Two chrome bezels with big round glass lenses that give the front a look of permanent surprise.',
      'Old saying: a lamp that stares is a lamp that sees you coming.',
      'Tip: a round lens is easy to polish, which is the only real reason anybody buys them.',
      'Joke: the wearer has never once been caught off guard, only off balance.',
      'A black clay bracket sits behind each bezel, out of sight, and nobody asks what it holds.',
    ],
    parts: [
      { s: 'box', d: [0.14, 0.14, 0.1], at: [0, 0.1, -0.05], c: 'black' },                          // bracket
      { s: 'cyl', d: [0.11, 0.11, 0.1], rot: [90, 0, 0], at: [0, 0.1, 0.03], c: 'silver', seg: 10 },  // chrome bezel
      { s: 'cyl', d: [0.09, 0.09, 0.03], rot: [90, 0, 0], at: [0, 0.1, 0.095], c: LENS, glow: true, seg: 10 }, // lens
    ],
  },
  {
    id: 'glaze-lamp-square', name: 'Square Dealers', category: 'prop', uses: ['place'],
    tags: ['glaze', 'lamp', 'headlight', 'square', 'boxy', 'chrome'], emoji: [],
    about: 'Pay \'n\' Glaze headlamp, the Square Dealers: boxy black housings with a square lens and a chrome strip across the top. The housing is fixed black; the lens is pale yellow.',
    examine: [
      'Boxy black housings with a square lens and a chrome strip along the top, built to look stern before anyone speaks.',
      'Gnome saying: a square face does not need a smile to be trusted.',
      'Tip: wipe the lens with a damp moss rag, never a dry one, or it will scratch and look sad.',
      'Joke: the stern look is a bit of an act. Inside, they are very sensitive about their corners.',
      'The chrome strip has a dent at one end that every gnome has agreed to call a battle scar.',
    ],
    parts: [
      { s: 'box', d: [0.2, 0.16, 0.18], at: [0, 0.1, -0.01], c: 'black' },                          // housing
      { s: 'box', d: [0.2, 0.02, 0.19], at: [0, 0.19, -0.01], c: 'silver' },                        // chrome strip
      { s: 'box', d: [0.17, 0.13, 0.03], at: [0, 0.1, 0.095], c: LENS, glow: true },                // lens
    ],
  },
  {
    id: 'glaze-lamp-halo', name: 'Halo Rings', category: 'prop', uses: ['place'],
    tags: ['glaze', 'lamp', 'headlight', 'halo', 'ring', 'glow'], emoji: [],
    about: 'Pay \'n\' Glaze headlamp, the Halo Rings: chrome bezels, each with a glass lens and a thin glowing ring around it. The bezel is fixed chrome; the lens and ring glow.',
    examine: [
      'Chrome bezels with a thin glowing ring around each lens, a pale blue halo on the front of the nose.',
      'Halo rings are said to be blessed by the Sun, who has never once confirmed it.',
      'Tip: the glow is brightest after the bloom, so polish the rings when the sun comes out.',
      'Joke: a lamp with a halo has never been accused of anything, which is also its problem.',
      'The rings hum faintly if you stand very close. Gnomes say that is the rings praying.',
    ],
    parts: [
      { s: 'box', d: [0.14, 0.14, 0.1], at: [0, 0.1, -0.05], c: 'black' },                          // bracket
      { s: 'cyl', d: [0.11, 0.11, 0.1], rot: [90, 0, 0], at: [0, 0.1, 0.03], c: 'silver', seg: 10 },  // chrome bezel
      { s: 'cyl', d: [0.09, 0.09, 0.03], rot: [90, 0, 0], at: [0, 0.1, 0.095], c: LENS, glow: true, seg: 10 }, // lens
      { s: 'ring', d: [0.115, 0.012], at: [0, 0.1, 0.095], c: 0xbfe8ff, glow: true },              // halo ring
    ],
  },
  {
    id: 'glaze-lamp-popup', name: 'Pop-Up Peepers', category: 'prop', uses: ['place'],
    tags: ['glaze', 'lamp', 'headlight', 'popup', 'hood', 'peeper'], emoji: [],
    about: 'Pay \'n\' Glaze headlamp, the Pop-Up Peepers: a lens tucked under a black half-dome hood that peeks out above it. The hood is fixed black; the lens is pale yellow.',
    examine: [
      'Lenses tucked under black domed hoods, peeking out of the front like a pair of cautious gnomes.',
      'Saying: the one who hides the light is the one who sees the most.',
      'Tip: lift the hood a finger\'s width before a fast turn. It stays up by the grace of the clay.',
      'Joke: they are shy until the wind changes, and then they are very loud about it.',
      'A little bump on each hood catches the morning sun, which the gnomes find deeply suspicious.',
    ],
    parts: [
      { s: 'cyl', d: [0.08, 0.08, 0.05], rot: [90, 0, 0], at: [0, 0.1, 0.09], c: 'silver', seg: 10 }, // lens housing
      { s: 'cyl', d: [0.065, 0.065, 0.02], rot: [90, 0, 0], at: [0, 0.1, 0.125], c: LENS, glow: true, seg: 10 }, // lens
      { s: 'ball', d: [0.12], scale: [1, 0.7, 1], at: [0, 0.125, -0.02], c: 'black', seg: 10 },      // hood
    ],
  },
  {
    id: 'glaze-lamp-lantern', name: 'Barn Lanterns', category: 'prop', uses: ['place'],
    tags: ['glaze', 'lamp', 'headlight', 'lantern', 'barn', 'glass'], emoji: [],
    about: 'Pay \'n\' Glaze headlamp, the Barn Lanterns: a small glass lantern on four brass posts with a brass cap and bracket. The posts and cap are fixed brass; the glass is see-through.',
    examine: [
      'A glass box on four thin brass posts, with a warm glowing heart and a brass cap, hung on a short bracket.',
      'Old saying: a light in a jar is a friend that does not need feeding.',
      'Tip: keep the glass clean and the glow will last all the way to Thatchford and back.',
      'Joke: the glass is see-through, so every gnome can tell exactly how much light is left.',
      'Inside, a tiny bead of warm light flickers when the wind passes. Nobody has ever found the match.',
    ],
    parts: [
      { s: 'cyl', d: [0.075, 0.075, 0.03], at: [0, 0.015, 0], c: 'brass', seg: 8 },                 // base
      { s: 'box', d: [0.012, 0.16, 0.012], at: [0.063, 0.1, 0.093], c: 'brass' },                    // post
      { s: 'box', d: [0.012, 0.16, 0.012], at: [-0.063, 0.1, 0.093], c: 'brass' },                  // post
      { s: 'box', d: [0.012, 0.16, 0.012], at: [0.063, 0.1, -0.033], c: 'brass' },                  // post
      { s: 'box', d: [0.012, 0.16, 0.012], at: [-0.063, 0.1, -0.033], c: 'brass' },                 // post
      { s: 'box', d: [0.14, 0.16, 0.14], at: [0, 0.1, 0.03], c: 'glass', alpha: 0.5 },              // glass
      { s: 'ball', d: [0.05], at: [0, 0.1, 0.03], c: LENS, glow: true, seg: 8 },                    // inner glow
      { s: 'cone', d: [0.11, 0.05], at: [0, 0.205, 0.03], c: 'brass', seg: 8 },                     // cap
      { s: 'box', d: [0.03, 0.03, 0.1], at: [0, 0.15, -0.09], c: 'iron-dark' },                     // bracket arm
    ],
  },
  {
    id: 'glaze-lamp-bar', name: 'Light-Bar Blaster', category: 'prop', uses: ['place'],
    tags: ['glaze', 'lamp', 'headlight', 'bar', 'light', 'blaster'], emoji: [],
    about: 'Pay \'n\' Glaze light bar, the Light-Bar Blaster: one long black bar across the nose with six round glow lenses and an end cap at each end. The bar is fixed black; the lenses are pale yellow.',
    examine: [
      'One long black bar with six round glass lenses in a row across the front and a cap at each end.',
      'Gnome saying: a line of six is better than one, and a bar of six is better than a line.',
      'Tip: keep the lenses clear of leaves, or the bar will look like a broken row of teeth.',
      'Joke: it is the brightest thing in the Shed, which is also why it is never allowed in the Shed.',
      'Each end cap has a little nub on top. Gnomes hang their hats on them when it rains.',
    ],
    parts: [
      { s: 'box', d: [1.1, 0.12, 0.1], at: [0, 0.06, 0], c: 'black' },                             // bar
      { s: 'cyl', d: [0.04, 0.04, 0.03], rot: [90, 0, 0], at: [-0.4, 0.06, 0.07], c: LENS, glow: true, seg: 8 },
      { s: 'cyl', d: [0.04, 0.04, 0.03], rot: [90, 0, 0], at: [-0.24, 0.06, 0.07], c: LENS, glow: true, seg: 8 },
      { s: 'cyl', d: [0.04, 0.04, 0.03], rot: [90, 0, 0], at: [-0.08, 0.06, 0.07], c: LENS, glow: true, seg: 8 },
      { s: 'cyl', d: [0.04, 0.04, 0.03], rot: [90, 0, 0], at: [0.08, 0.06, 0.07], c: LENS, glow: true, seg: 8 },
      { s: 'cyl', d: [0.04, 0.04, 0.03], rot: [90, 0, 0], at: [0.24, 0.06, 0.07], c: LENS, glow: true, seg: 8 },
      { s: 'cyl', d: [0.04, 0.04, 0.03], rot: [90, 0, 0], at: [0.4, 0.06, 0.07], c: LENS, glow: true, seg: 8 },
      { s: 'box', d: [0.04, 0.13, 0.12], at: [-0.56, 0.065, 0], c: 'iron-dark' },                   // end cap
      { s: 'box', d: [0.04, 0.13, 0.12], at: [0.56, 0.065, 0], c: 'iron-dark' },                    // end cap
    ],
  },
  {
    id: 'glaze-lamp-acorn', name: 'Acorn Lamps', category: 'prop', uses: ['place'],
    tags: ['glaze', 'lamp', 'headlight', 'acorn', 'nut', 'wood'], emoji: [],
    about: 'Pay \'n\' Glaze headlamp, the Acorn Lamps: a wood-brown acorn with a bright lens on its front, a dark wooden cap and a tiny stalk. The acorn is fixed wood; the lens is pale yellow.',
    examine: [
      'A warm wood-brown nut with a bright lens on the front and a dark wooden cap on top, with a stalk on the crown.',
      'Gnome saying: the acorn that falls farthest from the tree is the one that gets the lamp.',
      'Tip: the cap comes off if you twist it, though nobody has tested this on purpose.',
      'Joke: nobody asked for these, which is why they are the most popular lamp in the Compost Heap.',
      'They shine most in autumn, when the nuts are fresh and everyone is looking for something to hold.',
    ],
    parts: [
      { s: 'ball', d: [0.1], scale: [1, 1.2, 1], at: [0, 0.12, 0], c: 'wood', seg: 8 },              // nut
      { s: 'ball', d: [0.06], at: [0, 0.12, 0.08], c: LENS, glow: true, seg: 8 },                    // lens
      { s: 'ball', d: [0.11], scale: [1, 0.5, 1], at: [0, 0.23, 0], c: 'wood-dark', seg: 8 },       // cap
      { s: 'cyl', d: [0.012, 0.012, 0.04], at: [0, 0.3, 0], c: 'wood-dark', seg: 6 },               // stalk
    ],
  },
];
