// Gnome Theft Auto (E26): street-racing achievement rewards (gear for neck, head, back and hand).
import type { PrefabDef } from '../types';

export const GTA_STREET_RACE_GEAR: readonly PrefabDef[] = [
  {
    id: 'street-flag-bandana', name: 'Chequered Bandana', category: 'armor', uses: ['wear-neck'],
    wear: { at: [0, -0.05, 0.04] },
    tags: ['bandana', 'scarf', 'neck', 'chequer', 'checkered', 'black', 'white', 'kerb', 'street', 'reward'], emoji: [],
    about: 'Gnome Theft Auto (E26): a black-and-white chequered bandana knotted at the throat. Plain colours, no tint.',
    examine: [
      'A black-and-white chequered bandana knotted at the throat, the sort a flag marshal wears when he has run out of flags.',
      'Saying from the Kerb Row starter: the chequer is for the finish, and the finish is for whoever is still upright.',
      'Tip: tie it before the lights go green. A knot tied at the kerb comes undone at the first bend.',
      'Joke: the squares are so small that a gnome can count them, and so many gnomes have tried that the bandana is now mostly counting.',
      'The white squares have been washed grey by the Skyway, which the bookies say is a sponsor and the Yard says is weather.',
    ],
    parts: [
      { s: 'ring', d: [0.21, 0.012], at: [0, 0.012, -0.05], rot: [90, 0, 0], c: 'black', seg: 12 },   // throat band (min.y = 0)
      { s: 'box', d: [0.07, 0.03, 0.008], at: [-0.05, 0.02, -0.2], c: 'white' },                    // chequer square
      { s: 'box', d: [0.07, 0.03, 0.008], at: [0.05, 0.02, -0.2], c: 'black' },                    // chequer square
      { s: 'box', d: [0.12, 0.012, 0.012], at: [0, 0.03, 0.2], c: 'white' },                       // knot stripe
      { s: 'ball', d: [0.045], at: [0, 0.03, 0.19], scale: [1, 0.9, 0.7], c: 'black', seg: 8 },     // knot
      { s: 'box', d: [0.03, 0.09, 0.008], at: [-0.03, 0.045, 0.21], rot: [0, 0, -10], c: 'black' }, // left tail (min.y = 0)
      { s: 'box', d: [0.03, 0.08, 0.008], at: [0.035, 0.04, 0.22], rot: [0, 0, 12], c: 'white' },   // right tail
    ],
  },
  {
    id: 'skyway-night-goggles', name: 'Skyway Night Goggles', category: 'armor', uses: ['wear-head'],
    tags: ['goggles', 'night', 'amber', 'strap', 'head', 'skyway', 'street', 'reward'], emoji: [],
    about: 'Gnome Theft Auto (E26): goggles with amber lenses on a leather strap round the hat brim. Plain colours, no tint.',
    examine: [
      'Goggles with amber lenses on a leather strap, worn round the brim of a hat that has no business being that tall.',
      'Saying from the Skyway starter: the amber makes the dark bright, and the bright is where the lamp posts are.',
      'Tip: pull them down only after the last lamp. Down under the bridge they make everything look like toffee, and toffee is slow.',
      'Joke: the lenses were ground from a broken bottle of Gnomecino. The bottle was not supposed to be broken, and the Gnomecino was not supposed to be drunk.',
      'The strap has a buckle shaped like a question mark, which is the only question the Skyway has ever answered.',
    ],
    parts: [
      { s: 'cyl', d: [0.035, 0.035, 0.02], at: [0.05, 0.11, 0.14], rot: [90, 0, 0], c: 'honey', seg: 8 },   // amber lens
      { s: 'cyl', d: [0.035, 0.035, 0.02], at: [-0.05, 0.11, 0.14], rot: [90, 0, 0], c: 'honey', seg: 8 },  // amber lens
      { s: 'box', d: [0.03, 0.012, 0.012], at: [0, 0.11, 0.14], c: 'black' },                              // bridge
      { s: 'box', d: [0.24, 0.016, 0.016], at: [0, 0.1, 0.0], c: 'leather' },                              // strap round the brim
      { s: 'box', d: [0.02, 0.02, 0.012], at: [0.12, 0.1, 0.0], c: 'brass' },                              // buckle
      { s: 'box', d: [0.2, 0.014, 0.12], at: [0, 0.007, 0.13], c: 'black' },                              // short peak (min.y = 0)
    ],
  },
  {
    id: 'kerb-king-cape', name: "Kerb King's Cape", category: 'armor', uses: ['wear-back'],
    tags: ['cape', 'cloak', 'crown', 'chequer', 'checkered', 'back', 'kerb', 'street', 'reward'], emoji: [],
    about: "Gnome Theft Auto (E26): a short chequered cape with a tiny crown sewn on. Plain colours, no tint.",
    examine: [
      'A short chequered cape with a tiny brass crown sewn on at the collar, which is very small for a crown and very large for a gnome.',
      'Saying from the Kerb Row bookies: a king is only a king until the next race, and the next race is always on Kerb Row.',
      'Tip: keep the crown straight. A crown on a tilt tells every other racer that you have been knocked off something.',
      'Joke: the crown was made from a bottle cap, and the bottle cap was the only thing left after the last king lost the title.',
      'The hem is frayed in exactly the shape of a kerb. Nobody has measured it, and nobody wants to.',
    ],
    parts: [
      { s: 'box', d: [0.3, 0.34, 0.03], at: [0, 0.17, -0.02], c: 'white' },                                 // cape body (min.y = 0)
      { s: 'box', d: [0.06, 0.06, 0.008], at: [-0.075, 0.07, -0.038], c: 'black' },                        // chequer square
      { s: 'box', d: [0.06, 0.06, 0.008], at: [0.075, 0.07, -0.038], c: 'black' },                         // chequer square
      { s: 'box', d: [0.06, 0.06, 0.008], at: [0, 0.14, -0.038], c: 'black' },                             // chequer square
      { s: 'box', d: [0.06, 0.06, 0.008], at: [-0.075, 0.21, -0.038], c: 'black' },                        // chequer square
      { s: 'box', d: [0.06, 0.06, 0.008], at: [0.075, 0.21, -0.038], c: 'black' },                         // chequer square
      { s: 'box', d: [0.1, 0.035, 0.012], at: [0, 0.345, -0.02], c: 'gold' },                             // crown band
      { s: 'box', d: [0.02, 0.03, 0.012], at: [0, 0.38, -0.02], c: 'gold' },                              // crown point
    ],
  },
  {
    id: 'bookie-chalk-slate', name: "Bookie's Slate", category: 'tool', uses: ['hold'], grip: [0, 0.06, 0],
    tags: ['slate', 'chalk', 'odds', 'bookie', 'board', 'wood', 'hand', 'street', 'reward'], emoji: [],
    about: "Gnome Theft Auto (E26): a small wooden-framed slate with chalk odds on it, held upright by the frame. Plain colours, no tint.",
    examine: [
      'A small wooden-framed slate with chalk odds scrawled on it, and a few of the numbers already rubbed out by a thumb.',
      'Saying from the bookies on Kerb Row: odds are a promise with a smudge on it, and the smudge is where the money went.',
      'Tip: hold it by the frame, upright. Chalk runs when a gnome is sweating, and on Kerb Row everybody is sweating.',
      'Joke: every number on the slate is a guess. The one number that is not a guess is the bookie\'s cut, and it is written in pencil.',
      'The chalk squeaks when it is used, which the bookies say is the sound of confidence. The racers say it is the sound of a slate being wrong.',
    ],
    parts: [
      { s: 'box', d: [0.12, 0.1, 0.015], at: [0, 0.065, 0], c: 'wood' },                                 // frame (min.y = 0.015)
      { s: 'box', d: [0.096, 0.076, 0.006], at: [0, 0.065, 0.01], c: 'slate' },                           // slate face
      { s: 'box', d: [0.07, 0.008, 0.004], at: [-0.01, 0.08, 0.014], c: 'chalk' },                       // chalk odds, top line
      { s: 'box', d: [0.05, 0.008, 0.004], at: [-0.02, 0.055, 0.014], c: 'chalk' },                      // chalk odds, middle line
      { s: 'box', d: [0.03, 0.008, 0.004], at: [-0.03, 0.035, 0.014], c: 'chalk' },                      // chalk odds, bottom line
      { s: 'cyl', d: [0.004, 0.004, 0.04], at: [0.035, 0.035, 0.014], rot: [0, 0, 90], c: 'chalk', seg: 6 }, // chalk stick
    ],
  },
  {
    id: 'stopwatch-cap', name: 'Stopwatch Cap', category: 'armor', uses: ['wear-head'],
    tags: ['cap', 'hat', 'stopwatch', 'timer', 'green', 'head', 'time', 'street', 'reward'], emoji: [],
    about: 'Gnome Theft Auto (E26): a flat green cap with a stopwatch pinned to the front. Plain colours, no tint.',
    examine: [
      'A flat green cap with a stopwatch pinned to the front, the crown button polished by a thumb that has pressed it a great many times.',
      'Saying from the Skyway timekeeper: the clock does not care who you are, and neither does the cap.',
      'Tip: start the watch as you cross the line, not before. A watch started at the kerb records the kerb, and the kerb is slow.',
      'Joke: the stopwatch has never once been right, but it has always been very confident about being wrong.',
      'The cap sits square on the head, which is more than can be said for the timekeeper.',
    ],
    parts: [
      { s: 'ball', d: [0.14], at: [0, 0.084, 0], scale: [1, 0.6, 1], c: 'green', seg: 10 },                // crown (min.y = 0)
      { s: 'box', d: [0.2, 0.014, 0.12], at: [0, 0.007, 0.13], c: 'green' },                                // flat peak (min.y = 0)
      { s: 'cyl', d: [0.045, 0.045, 0.02], at: [0, 0.1, 0.15], rot: [90, 0, 0], c: 'silver', seg: 10 },     // watch face
      { s: 'cyl', d: [0.03, 0.03, 0.008], at: [0, 0.1, 0.16], rot: [90, 0, 0], c: 'white', seg: 10 },       // dial
      { s: 'box', d: [0.008, 0.018, 0.008], at: [0, 0.135, 0.15], c: 'brass' },                              // crown button
    ],
  },
  {
    id: 'lap-of-honour-laurel', name: 'Lap of Honour Laurel', category: 'armor', uses: ['wear-neck'],
    wear: { at: [0, -0.05, 0.04] },
    tags: ['laurel', 'wreath', 'leaf', 'neck', 'gold', 'honour', 'street', 'online', 'reward'], emoji: [],
    about: 'Gnome Theft Auto (E26): a leafy laurel ring worn round the neck, tied with a gold ribbon. Plain colours, no tint.',
    examine: [
      'A leafy laurel ring worn round the neck, tied at the back with a gold ribbon that has seen better laps.',
      'Saying from the Kerb Row announcer: the lap of honour is the slow one, so everybody can see who won.',
      'Tip: wear it on the slow lap only. On the fast lap the leaves fly off and land in the face of the gnome behind.',
      'Joke: the laurel was grown on Kerb Row from a hedge that was supposed to be a fence, and it has been winning ever since.',
      'Some of the leaves are plastic. The gnomes who wear them know which, and they are not telling.',
    ],
    parts: [
      { s: 'ring', d: [0.2, 0.02], at: [0, 0.02, -0.05], rot: [90, 0, 0], c: 'leaf', seg: 12 },       // laurel ring (min.y = 0)
      { s: 'ball', d: [0.03], at: [0.18, 0.02, -0.05], scale: [1, 0.6, 1], c: 'leaf-dark', seg: 6 },    // leaf cluster
      { s: 'ball', d: [0.03], at: [-0.18, 0.02, -0.05], scale: [1, 0.6, 1], c: 'leaf-dark', seg: 6 },   // leaf cluster
      { s: 'ball', d: [0.03], at: [0.0, 0.02, -0.23], scale: [1, 0.6, 1], c: 'leaf-dark', seg: 6 },     // leaf cluster
      { s: 'ball', d: [0.03], at: [0.12, 0.03, -0.17], scale: [1, 0.6, 1], c: 'leaf', seg: 6 },          // leaf cluster
      { s: 'ball', d: [0.03], at: [-0.12, 0.03, -0.17], scale: [1, 0.6, 1], c: 'leaf', seg: 6 },         // leaf cluster
      { s: 'box', d: [0.05, 0.03, 0.008], at: [0, 0.02, 0.2], c: 'gold' },                                // gold ribbon
      { s: 'box', d: [0.03, 0.07, 0.008], at: [-0.02, 0.035, 0.21], rot: [0, 0, -10], c: 'gold' },           // ribbon tail (min.y = 0)
    ],
  },
];
