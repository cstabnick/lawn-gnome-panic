// Gnome Theft Auto: homes (E10, docs/roadmaps/gta-batch-3/E10/). Two home props and four wearable achievement rewards.
import type { PrefabDef } from '../types';

export const GTA_HOMES: readonly PrefabDef[] = [
  // ---- Courtyard Saucer (prop) ---------------------------------------------------------------------------------------
  {
    id: 'courtyard-saucer', name: 'Courtyard Saucer', category: 'prop', uses: ['place'],
    tags: ['saucer', 'dish', 'courtyard', 'china', 'plate', 'glaze', 'blue', 'court', 'gta', 'homes'], emoji: [],
    about: 'Gnome Theft Auto: a giant white china saucer set in the ground as a courtyard, with a blue rim and a hairline crack. About 15 units across. Saucer Court.',
    footprint: { r: 7.5, h: 0.4 },
    examine: [
      'A giant white china saucer set into the grass as a courtyard, with a blue rim band, and a chalky well in the middle.',
      'Saying: the Tall Ones ate off small things, and gnomes have been trying to work out what they were eating ever since.',
      'Tip: do not fill it with water to make a pond. It will not hold water, and it never has, and the crack explains why.',
      'Joke: Saucer Court was named after the saucer, and the saucer was named after a cup, which has never once been seen.',
      'A hairline crack runs from the well to the rim. The residents say it was there when they moved in, which they took as a good sign.',
    ],
    parts: [
      { s: 'cyl', d: [7.5, 7.5, 0.12], at: [0, 0.06, 0], c: 'white', seg: 12, name: 'dish' },
      { s: 'ring', d: [7.3, 0.12], at: [0, 0.23, 0], rot: [90, 0, 0], c: 'blue', seg: 12, name: 'rim' },
      { s: 'cyl', d: [4.6, 4.6, 0.22], at: [0, 0.11, 0], c: 'chalk', seg: 12, name: 'well' },
      { s: 'box', d: [0.05, 0.03, 1.6], at: [5.4, 0.14, 0], c: 'slate', name: 'crack' },
    ],
  },

  // ---- Buzzer Panel (prop) -------------------------------------------------------------------------------------------
  {
    id: 'buzzer-panel', name: 'Buzzer Panel', category: 'prop', uses: ['place'],
    tags: ['buzzer', 'panel', 'bell', 'door', 'intercom', 'brass', 'button', 'gate', 'gta', 'homes'], emoji: [],
    about: 'Gnome Theft Auto: a brass door-buzzer panel on a short post at gnome head height, six round buttons in two columns, one taped over. Flats and gates.',
    examine: [
      'A brass panel on a short post, with six round buttons in two columns, a tiny speaker grille and one button taped over.',
      'Saying: press once for a visitor, twice for a friend, and wait at the gate for the one who never answers the bell.',
      'Tip: buzz once and wait. A second buzz only annoys the flat above, and the flat above has the good cider.',
      'Joke: the card by the buttons reads 3B: the new one. Buzz twice and wait for Hyssop to answer instead.',
      'The taped button has a handwritten label under the tape. It says only not yet, and it has said that since before the gnome in 3B moved in.',
    ],
    parts: [
      { s: 'box', d: [0.06, 0.9, 0.06], at: [0, 0.45, 0], c: 'stone-dark', name: 'post' },
      { s: 'box', d: [0.25, 0.35, 0.03], at: [0, 1.07, 0.05], c: 'brass', name: 'panel' },
      { s: 'ball', d: [0.018], at: [0.06, 1.2, 0.08], scale: [1, 1, 0.5], c: 'gold', seg: 6, mirror: true, name: 'button-top' },
      { s: 'ball', d: [0.018], at: [0.06, 1.1, 0.08], scale: [1, 1, 0.5], c: 'white', seg: 6, mirror: true, name: 'button-mid' },
      { s: 'ball', d: [0.018], at: [0.06, 1.0, 0.08], scale: [1, 1, 0.5], c: 'white', seg: 6, mirror: true, name: 'button-low' },
      { s: 'box', d: [0.03, 0.015, 0.004], at: [0.06, 1.0, 0.087], c: 'cloth', name: 'tape' },
      { s: 'box', d: [0.15, 0.05, 0.01], at: [0, 0.94, 0.07], c: 'iron-dark', name: 'grille' },
    ],
  },

  // ---- House Key Necklace (neck) -------------------------------------------------------------------------------------
  {
    id: 'house-key-necklace', name: 'House Key Necklace', category: 'armor', uses: ['wear-neck'],
    tags: ['key', 'necklace', 'brass', 'string', 'tag', 'loan', 'neck', 'house', 'gta', 'homes'], emoji: [],
    about: 'Gnome Theft Auto: the House Key Necklace. A big brass flat key on a string loop with a blank paper tag. Achievement reward for Home Sweet Loan.',
    examine: [
      'A big flat brass key on a loop of string, with a paper tag hanging off it that has nothing written on it at all.',
      'Saying: a key is only a key while the door is still there. Keep it anyway. Doors are less loyal than keys.',
      'Tip: wear the key where a thief will see it first. Nobody robs a gnome who is so obviously already home.',
      'Joke: the bank gave the key to the flat, and the flat gave the key back to the bank. Nobody has seen the door yet.',
      'The paper tag is blank on both sides. Its owner says that is what a loan looks like before anybody has written it down.',
    ],
    parts: [
      { s: 'ring', d: [0.09, 0.004], at: [0, 0.28, 0], c: 'cloth', seg: 8, name: 'string' },
      { s: 'box', d: [0.018, 0.16, 0.012], at: [0, 0.08, 0.07], c: 'brass', name: 'shaft' },
      { s: 'box', d: [0.04, 0.02, 0.012], at: [0, 0.01, 0.07], c: 'brass', name: 'teeth' },
      { s: 'ring', d: [0.035, 0.009], at: [0, 0.17, 0.07], c: 'brass', seg: 8, name: 'bow' },
      { s: 'box', d: [0.06, 0.08, 0.005], at: [0, 0.06, 0.1], c: 'cloth', name: 'tag' },
    ],
  },

  // ---- Nightcap (head) -----------------------------------------------------------------------------------------------
  {
    id: 'nightcap', name: 'Nightcap', category: 'armor', uses: ['wear-head'],
    tags: ['nightcap', 'cap', 'sleep', 'bobble', 'stripe', 'hat', 'head', 'gta', 'homes'], emoji: [],
    tint: 0x6fa8dc,
    about: 'Gnome Theft Auto: the Nightcap. A long floppy sleeping cap in white with a tinted stripe band (the tint) and a bobble on the tip. Achievement reward for Forty Winks.',
    examine: [
      'A long, floppy sleeping cap in white, with a stripe round the brim and a white bobble swinging from the tip.',
      'Saying: the cap goes on before the candle goes out, and the candle always goes out first.',
      'Tip: tuck the tail in at night, or it will hang over your face and keep you up for the rest of the night.',
      'Joke: it is called a nightcap because nobody who wears one has ever got up for a drink.',
      'The bobble is stitched on with a loop of thread that runs all the way up the tail. Nobody has found the other end.',
    ],
    parts: [
      { s: 'cone', d: [0.13, 0.36], at: [0, 0.2, 0], c: 'white', seg: 10, name: 'cap' },
      { s: 'cyl', d: [0.135, 0.135, 0.05], at: [0, 0.025, 0], c: 'tint', seg: 10, name: 'brim' },
      { s: 'cyl', d: [0.116, 0.116, 0.035], at: [0, 0.08, 0], c: 'tint', seg: 10, name: 'stripe-a' },
      { s: 'cyl', d: [0.087, 0.087, 0.035], at: [0, 0.16, 0], c: 'tint', seg: 10, name: 'stripe-b' },
      { s: 'ball', d: [0.035], at: [0, 0.4, 0], c: 'white', seg: 6, name: 'bobble' },
    ],
  },

  // ---- Feather Duster (hand) -----------------------------------------------------------------------------------------
  {
    id: 'feather-duster', name: 'Feather Duster', category: 'tool', uses: ['hold'],
    tags: ['duster', 'feather', 'feathers', 'brush', 'wood', 'handle', 'clean', 'hand', 'gta', 'homes'], emoji: [],
    about: 'Gnome Theft Auto: the Feather Duster. A short wooden handle with a fat puff of feathers at the top. Held in the hand. Achievement reward for Interior Decorator.',
    grip: [0, 0.1, 0],
    examine: [
      'A short wooden handle with a fat puff of soft feathers at the top, bent a little at the tip.',
      'Saying: dust is only the Yard that has been brought indoors, and a feather is the only sure way to send it back out.',
      'Tip: flick, do not wipe. Wiping spreads the dust about, and a gnome needs some dust to know where the floor is.',
      'Joke: the duster has never once cleaned anything. It only moves the mess to the top shelf and calls it finished.',
      'Someone has written a name on the handle in very small letters. It is the name of the bird the feathers came from, and the bird is not happy.',
    ],
    parts: [
      { s: 'cyl', d: [0.012, 0.012, 0.22], at: [0, 0.11, 0], c: 'wood', seg: 6, name: 'handle' },
      { s: 'ball', d: [0.07], at: [0, 0.29, 0], scale: [1, 1.6, 1], c: 'cloth', seg: 6, name: 'puff' },
      { s: 'cyl', d: [0.004, 0.004, 0.14], at: [0.02, 0.32, 0], rot: [0, 0, -20], c: 'wool', seg: 4, name: 'feather-a' },
      { s: 'cyl', d: [0.004, 0.004, 0.13], at: [-0.02, 0.33, 0.02], rot: [15, 0, 18], c: 'wool', seg: 4, name: 'feather-b' },
      { s: 'cyl', d: [0.004, 0.004, 0.12], at: [0, 0.36, -0.02], rot: [-15, 0, 0], c: 'wool', seg: 4, name: 'feather-c' },
    ],
  },

  // ---- Rolled Doormat (back) -----------------------------------------------------------------------------------------
  {
    id: 'rolled-doormat-pack', name: 'Rolled Doormat', category: 'armor', uses: ['wear-back'],
    tags: ['doormat', 'mat', 'coir', 'rolled', 'welcome', 'strap', 'back', 'gta', 'homes'], emoji: [],
    about: 'Gnome Theft Auto: the Rolled Doormat. A rolled coir doormat strapped across the back with two leather straps. Achievement reward for House Call.',
    examine: [
      'A rolled coir doormat strapped across the back with two leather straps, the bristles curling out at one end.',
      'Saying: a doormat says welcome, and a gnome who carries one says he has been expected for some time.',
      'Tip: unroll it at the door, not before. A mat carried through the house is just a rug with ambitions.',
      'Joke: WELCOME is written on the mat in letters so faded that it now says WELC, and nobody has the nerve to correct it.',
      'A small brass bell is tied to one strap. It rings when you walk, which is how the neighbours know you are visiting.',
    ],
    parts: [
      { s: 'cyl', d: [0.07, 0.07, 0.34], at: [0, 0.1, 0], rot: [0, 0, 90], c: 'bark', seg: 8, name: 'mat' },
      { s: 'box', d: [0.025, 0.2, 0.1], at: [-0.08, 0.1, 0], c: 'leather', name: 'strap-a' },
      { s: 'box', d: [0.025, 0.2, 0.1], at: [0.08, 0.1, 0], c: 'leather', name: 'strap-b' },
      { s: 'ball', d: [0.02], at: [-0.08, 0.03, 0.08], c: 'brass', seg: 6, name: 'bell' },
    ],
  },
];
