// Pay 'n' Glaze prefabs (gear). One owner: the issue that fills this file. Starts empty.
import type { PrefabDef } from '../types';

// Pay 'n' Glaze: hot-pink-and-chrome custom paint. Achievement cosmetics for the head, neck, back and hand slots.
const GLAZE_PINK = 0xff7eb6;
const GLAZE_TEAL = 0x2fb5a8;

export const GTA_GLAZE_GEAR: readonly PrefabDef[] = [
  {
    id: 'glaze-pit-crew-cap', name: 'Pit-Crew Cap', category: 'armor', uses: ['wear-head'],
    tags: ['cap', 'hat', 'pit', 'crew', 'pink', 'glaze', 'chrome', 'badge', 'head', 'reward'], emoji: [],
    about: 'Pay \'n\' Glaze: a flat pink cap with a stiff peak toward +z, a chrome button on the crown and a small oil-stained white badge on the front. No tint.',
    examine: [
      'A flat pink cap with a stiff peak, a chrome button on the crown and a small white badge on the front, gone grey with oil.',
      'Saying from the Planting: a clean peak is for waiting, and an oily badge is for getting there first.',
      'Tip: wipe the chrome button before a pit stop. A bright button tells the other gnomes you have done this before.',
      'Joke: the badge says CREW, although the gnome who wears it is the only one in the crew.',
      'The oil stain is older than the cap. Gnomes say it was there when the cloth was still a sheep.',
    ],
    parts: [
      { s: 'cyl', d: [0.16, 0.16, 0.03], at: [0, 0.015, 0], c: GLAZE_PINK, seg: 10 },                  // band (min.y = 0)
      { s: 'ball', d: [0.16], at: [0, 0.1, 0], scale: [1, 0.55, 1.02], c: GLAZE_PINK, seg: 10 },        // crown dome
      { s: 'ball', d: [0.015], at: [0, 0.195, 0], c: 'silver', seg: 6 },                              // chrome button
      { s: 'box', d: [0.2, 0.012, 0.08], at: [0, 0.035, 0.18], c: GLAZE_PINK },                       // stiff peak (+z)
      { s: 'box', d: [0.05, 0.04, 0.012], at: [0, 0.11, 0.17], c: 'white' },                          // front badge
      { s: 'box', d: [0.012, 0.012, 0.004], at: [0.015, 0.1, 0.177], c: 'black' },                    // oil stain
    ],
  },
  {
    id: 'glaze-chequered-scarf', name: 'Chequered Scarf', category: 'trinket', uses: ['wear-neck'],
    tags: ['scarf', 'chequered', 'checkered', 'black', 'white', 'squares', 'neck', 'glaze', 'reward'], emoji: [],
    about: 'Pay \'n\' Glaze: a black-and-white chequered scarf, a ring of small alternating boxes round the neck with a short tail hanging on the chest. No tint.',
    examine: [
      'A scarf of black and white squares, ringed round the neck in a row of little blocks, with a short tail hanging on the chest.',
      'Saying: black for the mud, white for the washing, and the squares for the gnome who has to tell them apart.',
      'Tip: knot the tail on the left, so the squares run the right way up when you turn to face the Fence.',
      'Joke: the Hat Watch once checked a chequered scarf for a race flag, and it has been walking very carefully ever since.',
      'Some of the squares are a little wrong in colour. The weaver says it is a pattern, and nobody has yet asked her which.',
    ],
    // Ring of 12 blocks, radius 0.2, centred on the neck (rig z 0). Even blocks black, odd blocks white.
    parts: [
      { s: 'box', d: [0.05, 0.04, 0.05], at: [0, 0.02, 0.15], c: 'black' },
      { s: 'box', d: [0.05, 0.04, 0.05], at: [0.1, 0.02, 0.123], c: 'white' },
      { s: 'box', d: [0.05, 0.04, 0.05], at: [0.173, 0.02, 0.05], c: 'black' },
      { s: 'box', d: [0.05, 0.04, 0.05], at: [0.2, 0.02, -0.05], c: 'white' },
      { s: 'box', d: [0.05, 0.04, 0.05], at: [0.173, 0.02, -0.15], c: 'black' },
      { s: 'box', d: [0.05, 0.04, 0.05], at: [0.1, 0.02, -0.223], c: 'white' },
      { s: 'box', d: [0.05, 0.04, 0.05], at: [0, 0.02, -0.25], c: 'black' },
      { s: 'box', d: [0.05, 0.04, 0.05], at: [-0.1, 0.02, -0.223], c: 'white' },
      { s: 'box', d: [0.05, 0.04, 0.05], at: [-0.173, 0.02, -0.15], c: 'black' },
      { s: 'box', d: [0.05, 0.04, 0.05], at: [-0.2, 0.02, -0.05], c: 'white' },
      { s: 'box', d: [0.05, 0.04, 0.05], at: [-0.173, 0.02, 0.05], c: 'black' },
      { s: 'box', d: [0.05, 0.04, 0.05], at: [-0.1, 0.02, 0.123], c: 'white' },
      // hanging tail on the chest (min.y = 0)
      { s: 'box', d: [0.07, 0.08, 0.012], at: [0, 0.04, 0.17], c: 'black' },
      { s: 'box', d: [0.07, 0.02, 0.014], at: [0, 0.07, 0.171], c: 'white' },
    ],
  },
  {
    id: 'glaze-spray-bandolier', name: 'Spray-Can Bandolier', category: 'armor', uses: ['wear-back'],
    tags: ['bandolier', 'strap', 'spray', 'cans', 'paint', 'leather', 'back', 'glaze', 'reward'], emoji: [],
    about: 'Pay \'n\' Glaze: a leather strap across the back holding four little spray cans (pink, teal, yellow, violet) with silver caps. No tint.',
    examine: [
      'A leather strap worn across the back, with four little spray cans in a row, pink, teal, yellow and violet, each with a silver cap.',
      'Saying from the Rockery: a gnome with four colours never needs to ask for a fifth.',
      'Tip: keep the caps on while you walk, or the paint dries in the nozzle and the gnome has to hope for rain.',
      'Joke: the strap has room for six cans. The two empty loops are kept for later, which the gnome has been saying for years.',
      'The violet can has been shaken so often that its label has worn through, and only the colour is left.',
    ],
    parts: [
      { s: 'box', d: [0.26, 0.03, 0.012], at: [0, 0.14, 0.02], rot: [0, 0, -30], c: 'leather' },   // diagonal strap
      { s: 'cyl', d: [0.025, 0.025, 0.1], at: [-0.09, 0.05, 0.03], c: GLAZE_PINK, seg: 8 },
      { s: 'cyl', d: [0.025, 0.025, 0.1], at: [-0.03, 0.05, 0.03], c: GLAZE_TEAL, seg: 8 },
      { s: 'cyl', d: [0.025, 0.025, 0.1], at: [0.03, 0.05, 0.03], c: 'yellow', seg: 8 },
      { s: 'cyl', d: [0.025, 0.025, 0.1], at: [0.09, 0.05, 0.03], c: 'purple', seg: 8 },
      { s: 'cyl', d: [0.022, 0.022, 0.012], at: [-0.09, 0.106, 0.03], c: 'silver', seg: 8 },  // caps
      { s: 'cyl', d: [0.022, 0.022, 0.012], at: [-0.03, 0.106, 0.03], c: 'silver', seg: 8 },
      { s: 'cyl', d: [0.022, 0.022, 0.012], at: [0.03, 0.106, 0.03], c: 'silver', seg: 8 },
      { s: 'cyl', d: [0.022, 0.022, 0.012], at: [0.09, 0.106, 0.03], c: 'silver', seg: 8 },
    ],
  },
  {
    id: 'glaze-spray-can', name: 'Spray Can', category: 'tool', uses: ['hold'],
    tags: ['spray', 'can', 'paint', 'aerosol', 'pink', 'chrome', 'glaze', 'tool', 'reward'], emoji: [],
    about: 'Pay \'n\' Glaze: a pink aerosol can with a silver dome top, a white nozzle button and a pink and chrome label band. Held at the middle of the body. No tint.',
    examine: [
      'A pink aerosol can with a silver dome top, a white nozzle button and a chrome band of label round the middle.',
      'Saying: the spray is pink, the cap is chrome, and the gnome holding it is in a hurry to mark the wall.',
      'Tip: point the nozzle away from the face. Pink paint stays on the cheeks for a week, and the cheeks never forgive it.',
      'Joke: the can says it contains glaze, which is true, and that the glaze is pink, which nobody ordered.',
      'A dent in the dome was made on the first day, and the owner refuses to say whether it was the can or the wall that won.',
    ],
    parts: [
      { s: 'cyl', d: [0.04, 0.04, 0.2], at: [0, 0.1, 0], c: GLAZE_PINK, seg: 8 },               // body (min.y = 0)
      { s: 'cyl', d: [0.042, 0.042, 0.03], at: [0, 0.12, 0], c: 'silver', seg: 8 },               // chrome label band
      { s: 'ball', d: [0.04], at: [0, 0.2, 0], scale: [1, 0.25, 1], c: 'silver', seg: 8 },       // silver dome top
      { s: 'cyl', d: [0.007, 0.007, 0.02], at: [0, 0.21, 0], c: 'white', seg: 6 },              // nozzle
      { s: 'ball', d: [0.01], at: [0, 0.222, 0], c: 'white', seg: 6 },                          // nozzle button
    ],
    grip: [0, 0.1, 0],
  },
  {
    id: 'glaze-gold-spray-can', name: 'Gold Spray Can', category: 'tool', uses: ['hold'],
    tags: ['spray', 'can', 'paint', 'aerosol', 'gold', 'gem', 'glaze', 'tool', 'reward'], emoji: [],
    about: 'Pay \'n\' Glaze: the spray can in gold, with a gem-like ball cap that glows. Held at the middle of the body. No tint.',
    examine: [
      'The same can as the pink one, but painted gold, with a faceted Tall-eye cap that catches the light like a wet marble.',
      'Saying: gold is for the lucky gnome and the rich one. Nobody remembers which of the two the first owner was.',
      'Tip: do not polish the Tall-eye cap with a sleeve. Sleeves are rough, and a scratched Tall-eye looks like an ordinary marble.',
      'Joke: the paint is gold, the nozzle is brass and the gnome is poor. Two of those three are going to change.',
      'Someone has scratched a tiny glaze crack into the label and mended it with gold. Nobody has admitted to it.',
    ],
    parts: [
      { s: 'cyl', d: [0.04, 0.04, 0.2], at: [0, 0.1, 0], c: 0xe0b030, seg: 8 },                 // gold body (min.y = 0)
      { s: 'cyl', d: [0.042, 0.042, 0.03], at: [0, 0.12, 0], c: 'silver', seg: 8 },               // chrome label band
      { s: 'ball', d: [0.025], at: [0, 0.225, 0], c: 'ruby', glow: true, seg: 8 },               // gem-like cap
      { s: 'cyl', d: [0.007, 0.007, 0.02], at: [0, 0.21, 0], c: 'white', seg: 6 },              // nozzle
    ],
    grip: [0, 0.1, 0],
  },
];
