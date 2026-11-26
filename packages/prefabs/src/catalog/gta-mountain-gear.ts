// Gnome Theft Auto (E33): mountain-route achievement rewards (gear for head, neck, back and hand).
import type { PrefabDef } from '../types';

export const GTA_MOUNTAIN_GEAR: readonly PrefabDef[] = [
  {
    id: 'pass-driving-goggles', name: 'Pass Goggles', category: 'armor', uses: ['wear-head'],
    tags: ['goggles', 'goggle', 'driving', 'lens', 'leather', 'strap', 'head', 'brim', 'amber', 'reward', 'gta'], emoji: [],
    about: 'Gnome Theft Auto (E33): round leather driving goggles with amber lenses and a brown strap, worn pushed up on the hat brim. Plain colours, no tint.',
    examine: [
      'Round leather driving goggles with amber lenses, worn up on the hat brim where they can be pulled down in a hurry.',
      'Saying from the Hatbrim: the Gap is only a road when you can see it, and the lenses are for seeing it in a hurry.',
      'Tip: pull them down on the switchbacks, not in the middle of a bend. Amber makes the grey road look kinder than it is.',
      'Joke: the goggles were made for a gnome with much bigger eyes, and they still fog up at the first hint of weather.',
      'The strap has been stretched over more hats than the Bobble has bobbles, and it still holds a tidy shape.',
    ],
    parts: [
      { s: 'ring', d: [0.16, 0.012], at: [0, 0.012, 0], rot: [90, 0, 0], c: 'leather', seg: 12 },     // headband (min.y = 0)
      { s: 'box', d: [0.3, 0.018, 0.012], at: [0, 0.06, 0.16], c: 'leather' },                      // strap across the front
      { s: 'cyl', d: [0.04, 0.04, 0.02], at: [0.05, 0.05, 0.17], rot: [90, 0, 0], c: 'honey', seg: 10 }, // amber lens (min.y = 0.03)
      { s: 'cyl', d: [0.04, 0.04, 0.02], at: [-0.05, 0.05, 0.17], rot: [90, 0, 0], c: 'honey', seg: 10 }, // amber lens
      { s: 'box', d: [0.02, 0.012, 0.02], at: [0, 0.05, 0.17], c: 'iron' },                           // bridge
    ],
  },
  {
    id: 'keyhole-pennant', name: 'Keyhole Pennant', category: 'armor', uses: ['wear-back'],
    tags: ['pennant', 'flag', 'keyhole', 'slate', 'felt', 'pole', 'back', 'reward', 'gta'], emoji: [],
    about: 'Gnome Theft Auto (E33): a small slate-grey felt pennant on a short pole stuck in a back strap, with a cream keyhole shape. Plain colours, no tint.',
    examine: [
      'A small slate-grey pennant on a short pole stuck in a back strap, with a cream keyhole picked out on the cloth.',
      'Saying from the Spine: the Keyhole opens for the gnome who comes up with the pennant still on, and not for the one who came up by mistake.',
      'Tip: keep the pole straight. A leaning pole tells the gnome behind you that you have stopped to look at the view.',
      'Joke: the keyhole is not a real keyhole. Nobody has ever found the door, which the Yard says is the point of a keyhole.',
      'The felt is grey because it was once green, and a long wet climb took the green into the slate.',
    ],
    parts: [
      { s: 'box', d: [0.012, 0.34, 0.012], at: [0.05, 0.17, 0], c: 'wood-dark' },                    // pole (min.y = 0)
      { s: 'box', d: [0.16, 0.1, 0.006], at: [0.13, 0.3, 0], c: 'slate' },                           // pennant cloth
      { s: 'ball', d: [0.022], at: [0.12, 0.31, 0.004], c: 'parchment', seg: 6 },                    // keyhole, round part
      { s: 'box', d: [0.012, 0.04, 0.008], at: [0.12, 0.27, 0.004], c: 'parchment' },                // keyhole, slot
      { s: 'ball', d: [0.018], at: [0.05, 0.35, 0], c: 'iron', seg: 6 },                             // pole finial
    ],
  },
  {
    id: 'goat-bell', name: 'Goat Bell', category: 'armor', uses: ['wear-neck'],
    tags: ['bell', 'goat', 'brass', 'collar', 'leather', 'neck', 'red', 'reward', 'gta'], emoji: [],
    about: 'Gnome Theft Auto (E33): a dented brass bell on a red leather collar, hanging at the throat. Plain colours, no tint.',
    examine: [
      'A dented brass bell on a red leather collar, hanging at the throat where it can be heard coming up the path.',
      'Saying from the High Tarn: a bell on the goat means the goat has been seen, and a bell on the gnome means the goat has been followed.',
      'Tip: hold the bell still on the steep bits. It rings on every step, and on the Brim Walk there is nothing to listen to but your own bell.',
      'Joke: the goat was never found. The bell was, which the goat has not forgiven.',
      'The dent in the bell is shaped like the first tread of the Hatbrim, and gnomes say it rings a little flatter because of it.',
    ],
    parts: [
      { s: 'ring', d: [0.2, 0.014], at: [0, 0.014, 0], rot: [90, 0, 0], c: 'red', seg: 12 },         // collar (min.y = 0)
      { s: 'ball', d: [0.045], at: [0, 0.03, 0.2], scale: [1, 0.9, 1], c: 'brass', seg: 8 },          // bell body, dented (min.y = -0.015 cleared by collar at 0)
      { s: 'box', d: [0.03, 0.012, 0.03], at: [0.01, 0.075, 0.2], c: 'brass' },                       // bell crown
      { s: 'ball', d: [0.012], at: [0, 0.0, 0.2], c: 'iron', seg: 6 },                                // clapper
    ],
  },
  {
    id: 'mountain-bobble-beanie', name: 'Bobble Beanie', category: 'armor', uses: ['wear-head'],
    tags: ['beanie', 'bobble', 'hat', 'knit', 'stripes', 'hatbrim', 'bobble', 'head', 'summit', 'reward', 'gta'], emoji: [],
    about: 'Gnome Theft Auto (E33): a ribbed knitted beanie in white and sky-blue stripes with a big round bobble on top, the summit reward. Plain colours, no tint.',
    examine: [
      'A ribbed knitted beanie in white and sky-blue stripes, with a big round bobble on top that wobbles on every step.',
      'Saying from the Bobble: the top of the Hatbrim is round, and so is the bobble, and a gnome who wears one will reach the other.',
      'Tip: pull the beanie down before the wind comes over the crest. The bobble is the first thing the wind wants.',
      'Joke: the bobble has been up the Bobble, which makes it the only hat on the Hatbrim that is not impressed by the Bobble.',
      'The sky-blue stripe was knitted from the sky, the knitter says, and the knitter has not been down for a cup of tea since.',
    ],
    parts: [
      { s: 'cyl', d: [0.15, 0.15, 0.05], at: [0, 0.025, 0], c: 'white', seg: 10 },                   // folded brim (min.y = 0)
      { s: 'cyl', d: [0.148, 0.148, 0.05], at: [0, 0.075, 0], c: 'glass', seg: 10 },                  // stripe, sky blue
      { s: 'cyl', d: [0.147, 0.147, 0.04], at: [0, 0.12, 0], c: 'white', seg: 10 },                  // stripe, white
      { s: 'cyl', d: [0.146, 0.14, 0.05], at: [0, 0.165, 0], c: 'glass', seg: 10 },                  // stripe, sky blue
      { s: 'ball', d: [0.14], at: [0, 0.19, 0], scale: [1, 0.5, 1], c: 'white', seg: 8 },            // crown
      { s: 'ball', d: [0.06], at: [0, 0.3, 0], c: 'white', seg: 8 },                                 // bobble
    ],
  },
  {
    id: 'alpenstock', name: 'Alpenstock', category: 'tool', uses: ['hold'], grip: [0, 0.5, 0],
    tags: ['staff', 'stick', 'alpenstock', 'walking', 'pole', 'ash', 'spike', 'summit', 'hand', 'reward', 'gta'], emoji: [],
    about: 'Gnome Theft Auto (E33): a tall ash walking staff with an iron spike at the foot and a small brass summit badge nailed near the top. Held by the shaft. Plain colours, no tint.',
    examine: [
      'A tall ash walking staff with an iron spike at the foot and a little brass badge nailed near the top, for the summit.',
      'Saying from the Hatbrim: a staff goes up with you and comes down with you, and a gnome who forgets it comes down alone.',
      'Tip: plant the spike on the uphill side. On the Bobble, the downhill side is where the gravel has its opinions.',
      'Joke: the badge says the gnome has been to the top, and the wind has been trying to take it off ever since.',
      'Someone once used the staff to knock on the cairn, and the cairn knocked back, and nobody has since agreed what it said.',
    ],
    parts: [
      { s: 'box', d: [0.025, 0.8, 0.025], at: [0, 0.4, 0], c: 'wood-light' },                       // ash shaft (min.y = 0)
      { s: 'cone', d: [0.02, 0.08], at: [0, 0.04, 0], rot: [180, 0, 0], c: 'iron', seg: 6 },          // iron spike, tip down (min.y = 0)
      { s: 'ball', d: [0.016], at: [0, 0.7, 0], scale: [1, 1.4, 1], c: 'brass', seg: 6 },             // grip knob (below the hand line)
      { s: 'box', d: [0.03, 0.03, 0.006], at: [0.016, 0.72, 0.0], rot: [0, 0, 45], c: 'brass' },      // summit badge
    ],
  },
];
