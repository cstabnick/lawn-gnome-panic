// Gnome Theft Auto (E14): dirt-track, rally and Capwood achievement rewards (gear for head, neck, back and hand).
import type { PrefabDef } from '../types';

export const GTA_DIRT_RALLY_GEAR: readonly PrefabDef[] = [
  {
    id: 'rutbottom-mud-bandana', name: 'Mud Bandana', category: 'armor', uses: ['wear-neck'],
    wear: { at: [0, -0.05, 0.04] },
    tags: ['bandana', 'scarf', 'neck', 'red', 'mud', 'dirt', 'rutbottom', 'reward'], emoji: [],
    about: 'Gnome Theft Auto (E14): a red-and-white bandana knotted at the throat, splattered with brown mud dots. Plain colours, no tint.',
    examine: [
      'A red-and-white bandana knotted at the throat, splattered with brown mud dots that were never fully washed off.',
      'Saying from the Dirt Bowl: mind the berm. The berm remembers, and so does the bandana.',
      'Tip: knot it loose. A tight knot pulls on the throat, and the Rutbottom marshal will not let you race with your breath wrong.',
      'Joke: the mud dots were added after the race, by the marshal, as a sort of receipt.',
      'The white stripe on the bandana is the only clean part left, and gnomes disagree about whether it is the stripe or the gnome.',
    ],
    parts: [
      { s: 'ring', d: [0.21, 0.012], at: [0, 0.012, -0.05], rot: [90, 0, 0], c: 'red', seg: 12 },      // throat band (min.y = 0)
      { s: 'box', d: [0.12, 0.012, 0.012], at: [0, 0.03, 0.2], c: 'white' },                          // white stripe on the knot
      { s: 'ball', d: [0.045], at: [0, 0.03, 0.19], scale: [1, 0.9, 0.7], c: 'red', seg: 8 },         // knot
      { s: 'box', d: [0.03, 0.09, 0.008], at: [-0.03, 0.045, 0.2], rot: [0, 0, -10], c: 'red' },      // left tail (min.y = 0)
      { s: 'box', d: [0.03, 0.08, 0.008], at: [0.035, 0.04, 0.21], rot: [0, 0, 12], c: 'red' },       // right tail
      { s: 'ball', d: [0.01], at: [0.1, 0.02, 0.17], c: 'dirt', seg: 6 },                              // mud dot
      { s: 'ball', d: [0.008], at: [-0.12, 0.02, 0.14], c: 'dirt', seg: 6 },                           // mud dot
      { s: 'ball', d: [0.012], at: [0.04, 0.02, 0.22], c: 'bark', seg: 6 },                       // mud dot
    ],
  },
  {
    id: 'rutbottom-knobbly-helmet', name: 'Knobbly Helmet', category: 'armor', uses: ['wear-head'],
    tags: ['helmet', 'dirt', 'goggles', 'peak', 'head', 'red', 'white', 'rutbottom', 'reward'], emoji: [],
    about: 'Gnome Theft Auto (E14): an open-face dirt helmet, white with a red stripe, a short peak, goggles pushed up on the front. Plain colours, no tint.',
    examine: [
      'An open-face dirt helmet, white with a red stripe over the crown, and goggles pushed up on the brow like an afterthought.',
      'Saying from Clary Mudguard: three, two, go on then, and the helmet goes on first, because the berm does not wait for gnomes who are still fastening straps.',
      'Tip: keep the goggles up until the flag drops. Down in the first corner they fog, and you cannot see the berm, which is the only thing you need to see.',
      'Joke: the knobbles on the crown are not decoration. They are where the last three marshals keep their pencils.',
      'The helmet has a dent shaped exactly like a Two-Ton Teasel elbow, which he insists was a compliment.',
    ],
    parts: [
      { s: 'cyl', d: [0.15, 0.15, 0.1], at: [0, 0.05, 0], c: 'white', seg: 10 },                         // shell (min.y = 0)
      { s: 'box', d: [0.03, 0.02, 0.3], at: [0, 0.1, 0], c: 'red' },                                    // red stripe over the crown
      { s: 'ball', d: [0.02], at: [0.0, 0.12, -0.1], c: 'white', seg: 6 },                              // rear knobble
      { s: 'ball', d: [0.02], at: [0.09, 0.09, 0.07], c: 'white', seg: 6 },                             // side knobble
      { s: 'ball', d: [0.02], at: [-0.09, 0.09, 0.07], c: 'white', seg: 6 },                            // side knobble
      { s: 'box', d: [0.2, 0.014, 0.12], at: [0, 0.007, 0.13], c: 'white' },                           // short peak (min.y = 0)
      { s: 'cyl', d: [0.035, 0.035, 0.02], at: [0.05, 0.11, 0.14], rot: [90, 0, 0], c: 'black', seg: 8 }, // goggle lens, pushed up
      { s: 'cyl', d: [0.035, 0.035, 0.02], at: [-0.05, 0.11, 0.14], rot: [90, 0, 0], c: 'black', seg: 8 }, // goggle lens, pushed up
      { s: 'box', d: [0.03, 0.012, 0.012], at: [0, 0.11, 0.14], c: 'iron' },                            // goggle strap
    ],
  },
  {
    id: 'capwood-rally-pennant', name: 'Rally Pennant', category: 'armor', uses: ['wear-back'],
    tags: ['pennant', 'flag', 'rally', 'capwood', 'orange', 'back', 'reward'], emoji: [],
    about: 'Gnome Theft Auto (E14): a small orange pennant flag on a short pole worn across the back, with a CR in white boxes. Plain colours, no tint.',
    examine: [
      'A small orange pennant on a short pole, worn across the back, with CR picked out in white boxes on the flag.',
      'Saying from the Carburettors: the Capwood Run starts with a flag and ends with a fine, and the pennant is for the middle bit.',
      'Tip: keep the pole upright. A leaning pole reads as a warning to the gnome behind, and the gnome behind is usually Lulu.',
      'Joke: the CR stands for Capwood Rally. It also stands for Crumpled Ribbon, which is what the pennant looks like after the Fells.',
      'The pole has a notch near the top where a gnome once tied a lunch. Nobody has come back for the lunch.',
    ],
    parts: [
      { s: 'box', d: [0.012, 0.34, 0.012], at: [0.05, 0.2, -0.1], c: 'wood-dark' },                     // pole
      { s: 'box', d: [0.16, 0.1, 0.006], at: [0.13, 0.33, -0.1], c: 'orange' },                         // pennant
      { s: 'box', d: [0.04, 0.05, 0.008], at: [0.1, 0.33, -0.097], c: 'white' },                        // C box
      { s: 'box', d: [0.04, 0.05, 0.008], at: [0.16, 0.33, -0.097], c: 'white' },                       // R box
      { s: 'ball', d: [0.018], at: [0.05, 0.38, -0.1], c: 'brass', seg: 6 },                            // pole finial
    ],
  },
  {
    id: 'capwood-cap-hat', name: 'Capwood Cap', category: 'armor', uses: ['wear-head'],
    tags: ['cap', 'toadstool', 'mushroom', 'hat', 'red', 'spotted', 'capwood', 'head', 'reward'], emoji: [],
    about: 'Gnome Theft Auto (E14): a red domed toadstool cap with white spots, worn as a hat, with a pale gill ring under the brim. Plain colours, no tint.',
    examine: [
      'A red domed toadstool cap with white spots, sized for a gnome head, with a pale gill ring under the brim.',
      'Saying from Warden Chanterelle Stook: a cap is a cap, a hat is a hat, and a toadstool is a matter for Section nine.',
      'Tip: sit it square on the head. Tilted, the spots run down one side and you look like the sort of mushroom that gets reported.',
      'Joke: the cap has been counted four times by the warden, and each time it was one cap taller than the last count.',
      'The gill ring smells faintly of rain, which the warden says is correct, and which the Yard says is a fine.',
    ],
    parts: [
      { s: 'ball', d: [0.14], at: [0, 0.084, 0], scale: [1, 0.6, 1], c: 'mushroom-cap', seg: 10 },   // dome (min.y = 0)
      { s: 'ball', d: [0.022], at: [0, 0.165, 0], c: 'white', seg: 6 },                              // spot, top
      { s: 'ball', d: [0.02], at: [0.09, 0.14, 0.04], c: 'white', seg: 6 },                           // spot
      { s: 'ball', d: [0.02], at: [-0.08, 0.13, -0.07], c: 'white', seg: 6 },                          // spot
      { s: 'ring', d: [0.15, 0.012], at: [0, 0.03, 0], rot: [90, 0, 0], c: 'mushroom-stem', seg: 12 }, // gill ring (min.y = 0.018)
    ],
  },
  {
    id: 'spore-cloak', name: 'Spore Cloak', category: 'armor', uses: ['wear-back'],
    tags: ['cloak', 'cape', 'moss', 'hood', 'glow', 'spore', 'capwood', 'back', 'reward'], emoji: [],
    about: 'Gnome Theft Auto (E14): a short mossy-green cloak with the hood down, dusted with tiny glowing spore dots. Plain colours, no tint.',
    examine: [
      'A short mossy-green cloak with the hood down, dusted all over with tiny pale dots that give off a faint glow.',
      'Saying from Capwood: the spores go where the warden goes, and the warden goes to the ring after dark.',
      'Tip: keep the hood down in daylight. Up at night it hides the glow, and the glow is the only way to find your own ring.',
      'Joke: the dots are not spores. The warden has checked. They are very small stickers from a sweet shop, and the shop is still owed.',
      'The moss on the cloak has been growing since the last Capwood Run, and it has opinions about the finish line.',
    ],
    parts: [
      { s: 'box', d: [0.3, 0.5, 0.04], at: [0, 0.25, -0.12], c: 'moss' },                              // cloak body (min.y = 0)
      { s: 'ball', d: [0.11], at: [0, 0.82, -0.12], scale: [1, 1.1, 0.8], c: 'moss', seg: 8 },          // hood
      { s: 'ball', d: [0.012], at: [-0.08, 0.2, -0.145], c: 'spark', glow: true, seg: 6 },              // spore dot
      { s: 'ball', d: [0.012], at: [0.1, 0.35, -0.145], c: 'spark', glow: true, seg: 6 },               // spore dot
      { s: 'ball', d: [0.012], at: [-0.05, 0.45, -0.145], c: 'spark', glow: true, seg: 6 },             // spore dot
      { s: 'ball', d: [0.012], at: [0.07, 0.12, -0.145], c: 'spark', glow: true, seg: 6 },              // spore dot
      { s: 'ball', d: [0.012], at: [0.0, 0.6, -0.145], c: 'spark', glow: true, seg: 6 },                // spore dot
    ],
  },
  {
    id: 'warden-ticket-book', name: 'Ticket Book', category: 'document', uses: ['hold'], grip: [0, 0.06, 0],
    tags: ['ticket', 'book', 'notebook', 'pen', 'green', 'warden', 'capwood', 'hand', 'reward'], emoji: [],
    about: 'Gnome Theft Auto (E14): a small green ticket book with a pen clipped to it, held upright by the spine. Plain colours, no tint.',
    examine: [
      'A small green ticket book, its cover worn soft at the corners, with a pen clipped to the spine.',
      'Saying from Warden Stook: a ticket is a promise, and a promise is written in ink, in the correct section.',
      'Tip: hold it by the spine, upright. Open, the pages blow about in the Capwood wind and you lose the count.',
      'Joke: every ticket in the book is for a cap, and every cap has already been fined, which is how the warden keeps her hat.',
      'The pen has never run out. Gnomes say it is because the warden only writes in section nine.',
    ],
    parts: [
      { s: 'box', d: [0.1, 0.13, 0.02], at: [0, 0.065, 0], c: 'moss' },                                 // cover (min.y = 0)
      { s: 'box', d: [0.088, 0.118, 0.006], at: [0.004, 0.065, 0.013], c: 'paper' },                    // page block
      { s: 'box', d: [0.035, 0.02, 0.004], at: [-0.02, 0.09, 0.018], c: 'red' },                        // ticket stub
      { s: 'box', d: [0.006, 0.006, 0.13], at: [0.055, 0.1, 0.016], c: 'ink' },                         // pen, clipped to the spine
    ],
  },
];
