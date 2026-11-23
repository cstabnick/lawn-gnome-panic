// Gnome Theft Auto, Ammu-Gnation gun mods B: magazines, stocks, charms (gunmod-*). One owner: the issue that fills this file.
// Authored in the gun's own frame: barrel along +y, gun top at -z, underside (trigger, magazine) at +z, stocks reach toward -z.
import type { PrefabDef } from '../types';

const SKIN = 0xe8b893;

export const GTA_GUN_MODS_B: readonly PrefabDef[] = [
  {
    id: 'gunmod-extended-mag', name: 'Extended Mag', category: 'tool', uses: ['place'],
    tags: ['gun', 'mod', 'magazine', 'mag', 'extended', 'long', 'box', 'iron'], emoji: [],
    about: 'Gun mod (magazine): the Extended Mag. A long dark iron box along y with a steel base plate at the bottom and a thin orange stripe. Hangs below the grip on the SMG. No tint.',
    examine: [
      'A long dark box magazine with a steel base plate and one orange stripe, so it hides the stick mag and is a little smug about it.',
      'Saying from the Verge: the longer the magazine, the longer the argument, and the gnome holding it is always right until the count runs out.',
      'Tip: tap the base plate before you slide it in. A loose mag clatters, and clatter tells the whole Fence where you are.',
      'Joke: it holds thirty shots, which is twenty-nine more than any gnome has ever needed to say sorry.',
      'The orange stripe was painted on by a gnome who was told it made the gun faster. It made the gun orange.',
    ],
    parts: [
      { s: 'box', d: [0.046, 0.23, 0.05], at: [0, 0.127, 0], c: 'iron-dark', name: 'body' },
      { s: 'box', d: [0.05, 0.012, 0.056], at: [0, 0.006, 0], c: 'steel', name: 'base' },
      { s: 'box', d: [0.048, 0.02, 0.052], at: [0, 0.15, 0], c: 'orange', name: 'stripe' },
    ],
  },
  {
    id: 'gunmod-drum-mag', name: 'Drum Mag', category: 'tool', uses: ['place'],
    tags: ['gun', 'mod', 'magazine', 'mag', 'drum', 'round', 'iron', 'brass'], emoji: [],
    about: 'Gun mod (magazine): the Drum Mag. A round iron drum with its axis along x, a short feed neck on top and a brass winding key on the side. Sits under the gun. No tint.',
    examine: [
      'A round drum of iron ribs with a short feed neck on top and a brass winding key on the side, like a clock that has been told to shoot.',
      'Planting saying: a drum that turns slowly is a patient gnome, and a drum that turns fast is a gnome with somewhere to be.',
      'Tip: wind the key before the Tall-eye match, not during. The ratchet clicks loud enough to wake the Hedgewood.',
      'Joke: it holds a hundred rounds and an opinion about each one, and the opinion is always that it could hold more.',
      'Someone scratched a tiny hopscotch grid into the drum face. Nobody remembers the rules, only that the winner gets the drum.',
    ],
    parts: [
      { s: 'cyl', d: [0.06, 0.06, 0.05], rot: [0, 0, 90], at: [0, 0.06, 0], c: 'iron-dark', seg: 10, name: 'drum' },
      { s: 'cyl', d: [0.045, 0.045, 0.006], rot: [0, 0, 90], at: [0.029, 0.06, 0], c: 'steel', seg: 10, mirror: true, name: 'cap' },
      { s: 'box', d: [0.03, 0.035, 0.034], at: [0, 0.1225, 0], c: 'iron', name: 'neck' },
      { s: 'ball', d: [0.012], at: [0.04, 0.06, 0], c: 'brass', seg: 6, name: 'key' },
    ],
  },
  {
    id: 'gunmod-speed-mag', name: 'Speed-Loader Mag', category: 'tool', uses: ['place'],
    tags: ['gun', 'mod', 'magazine', 'mag', 'speed', 'loader', 'quick', 'orange'], emoji: [],
    about: 'Gun mod (magazine): the Speed-Loader Mag. A short iron box along y with a bright orange pull-tab loop at the foot and ridged grips. Hangs below the grip. No tint.',
    examine: [
      'A short box magazine with a bright orange pull-tab loop at the foot and ridged grips, built to be yanked out in a hurry.',
      'Gnome rhyme: pull the tab and not the hair, or the tab goes spare and so do you.',
      'Tip: yank it straight down. A sideways pull bends the loop, and a bent loop has never once been lucky.',
      'Joke: it loads faster than any gnome can think of an excuse, which is the whole point of the Verge.',
      'The tab has been tied and retied so many times that the knot is now bigger than the magazine.',
    ],
    parts: [
      { s: 'box', d: [0.05, 0.012, 0.055], at: [0, 0.006, 0], c: 'iron-dark', name: 'base' },
      { s: 'box', d: [0.046, 0.12, 0.05], at: [0, 0.0705, 0], c: 'iron', name: 'body' },
      { s: 'box', d: [0.048, 0.004, 0.054], at: [0, 0.04, 0], c: 'iron-dark' },
      { s: 'box', d: [0.048, 0.004, 0.054], at: [0, 0.06, 0], c: 'iron-dark' },
      { s: 'box', d: [0.048, 0.004, 0.054], at: [0, 0.08, 0], c: 'iron-dark' },
      { s: 'box', d: [0.048, 0.004, 0.054], at: [0, 0.1, 0], c: 'iron-dark' },
      { s: 'ring', d: [0.02, 0.005], at: [0, 0.035, 0.035], c: 'orange', seg: 8, name: 'tab' },
    ],
  },
  {
    id: 'gunmod-padded-stock', name: 'Moss-Padded Stock', category: 'tool', uses: ['place'],
    tags: ['gun', 'mod', 'stock', 'wood', 'moss', 'padded', 'cushion', 'butt'], emoji: [],
    about: 'Gun mod (stock): the Moss-Padded Stock. A wooden block reaching toward -z with a squashed green moss cushion on its far end. Bolts onto the back of the gun. No tint.',
    examine: [
      'A wooden stock with a fat green moss cushion on its far end, so the shoulder gets a hug and the gun gets a sulk.',
      'Saying from Mossbottom: moss is soft, moss is patient, and moss will grow over anything you leave out long enough.',
      'Tip: rest the cushion on the shoulder, not the collarbone. Gnome collarbones crack, and glaze is expensive.',
      'Joke: it is the most comfortable part of the gun, which says a great deal about the rest of the gun.',
      'A small stone has been pressed into the moss, and the moss has grown round it, claiming it as its own.',
    ],
    parts: [
      { s: 'box', d: [0.07, 0.12, 0.2], at: [0, 0.06, -0.1], c: 'wood', name: 'stock' },
      { s: 'ball', d: [0.05], at: [0, 0.06, -0.205], scale: [1.15, 1, 0.5], c: 'moss', seg: 8, name: 'cushion' },
    ],
  },
  {
    id: 'gunmod-wire-stock', name: 'Wire Stock', category: 'tool', uses: ['place'],
    tags: ['gun', 'mod', 'stock', 'wire', 'steel', 'twine', 'butt', 'frame'], emoji: [],
    about: 'Gun mod (stock): the Wire Stock. A frame of bent steel wire reaching toward -z with a U-shaped butt plate and a green twine tie. Bolts onto the back of the gun. No tint.',
    examine: [
      'A frame of bent garden wire with two long rods and a U-shaped butt plate, tied together with a twist of green twine.',
      'Gnome saying: wire holds what wood cannot, mostly because wire has never been asked to hold a grudge.',
      'Tip: check the twine every morning. Twine that has gone soft lets the butt plate wobble at the worst moment.',
      'Joke: it weighs almost nothing, so it is perfect for a gnome who wants to look ready and carry very little.',
      'The U at the end is bent by hand. Nobody has ever bent a U this neat, so the Shed claims it was done by a fence.',
    ],
    parts: [
      { s: 'cyl', d: [0.008, 0.008, 0.2], rot: [90, 0, 0], at: [0.03, 0.02, -0.1], c: 'steel', seg: 6, mirror: true, name: 'rod' },
      { s: 'cyl', d: [0.008, 0.008, 0.1], at: [0.03, 0.05, -0.2], c: 'steel', seg: 6, mirror: true, name: 'upright' },
      { s: 'cyl', d: [0.008, 0.008, 0.07], rot: [0, 0, 90], at: [0, 0.1, -0.2], c: 'steel', seg: 6, name: 'butt' },
      { s: 'cyl', d: [0.004, 0.004, 0.07], rot: [0, 0, 90], at: [0, 0.02, -0.05], c: 'green', seg: 6, name: 'twine' },
    ],
  },
  {
    id: 'gunmod-charm-acorn', name: 'Lucky Acorn', category: 'trinket', uses: ['place'],
    tags: ['gun', 'mod', 'charm', 'trinket', 'acorn', 'lucky', 'string'], emoji: [],
    about: 'Gun mod (charm): the Lucky Acorn. A brown acorn with a dark cap on a thin string under a small ring. Hangs from the gun. No tint.',
    examine: [
      'A brown acorn with a dark cap, hung on a thin string from a little ring, so it knocks gently against the gun when you walk.',
      'Planting rhyme: carry an acorn in the spring and every oak will bow to you, or at least stop being rude about it.',
      'Tip: keep it dry. A wet acorn swells, and a swollen acorn gets stuck in the ring like a bad joke.',
      'Joke: it is lucky the way a sock is lucky, which is to say it turns up when you were not looking for it.',
      'A tiny hole has been drilled through the cap and the string runs through it. Gnomes say the hole is where the luck gets in.',
    ],
    parts: [
      { s: 'ring', d: [0.012, 0.003], at: [0, 0.1, 0], c: 'steel', seg: 8, name: 'ring' },
      { s: 'cyl', d: [0.0015, 0.0015, 0.04], at: [0, 0.078, 0], c: 'burlap', seg: 4, name: 'string' },
      { s: 'ball', d: [0.02], at: [0, 0.026, 0], scale: [1, 1.3, 1], c: 'wood', seg: 8, name: 'acorn' },
      { s: 'ball', d: [0.022], at: [0, 0.05, 0], scale: [1, 0.5, 1], c: 'bark', seg: 8, name: 'cap' },
    ],
  },
  {
    id: 'gunmod-charm-dice', name: 'Fuzzy Dice', category: 'trinket', uses: ['place'],
    tags: ['gun', 'mod', 'charm', 'trinket', 'dice', 'fuzzy', 'white', 'hanging'], emoji: [],
    about: 'Gun mod (charm): the Fuzzy Dice. Two white dice with black pip dots, hanging from a short bar; one lower and turned 30 degrees. Hangs from the gun. No tint.',
    examine: [
      'Two white dice with black pip dots, hanging from a short bar on a string, one turned a little to show off.',
      'Saying from the Verge: never roll the dice on a Sunday, because the Sun is watching and the Sun always cheats.',
      'Tip: hang them where the wind can swing them. A still pair of dice is a sad pair of dice, and they know it.',
      'Joke: they are called fuzzy because nobody has ever dared to touch them to find out whether they are fuzzy.',
      'Each die has three pips, which the gnome who owned them said was a fair compromise between luck and arithmetic.',
    ],
    parts: [
      { s: 'box', d: [0.05, 0.004, 0.004], at: [0, 0.07, 0], c: 'burlap', name: 'bar' },
      { s: 'cyl', d: [0.0015, 0.0015, 0.012], at: [-0.013, 0.065, 0], c: 'burlap', seg: 4, name: 'hanger' },
      { s: 'cyl', d: [0.0015, 0.0015, 0.046], at: [0.013, 0.045, 0], c: 'burlap', seg: 4, name: 'hanger' },
      { s: 'box', d: [0.022, 0.022, 0.022], at: [-0.013, 0.05, 0], c: 'white', name: 'die' },
      { s: 'box', d: [0.022, 0.022, 0.022], at: [0.013, 0.011, 0], rot: [0, 30, 0], c: 'white', name: 'die' },
      { s: 'ball', d: [0.0028], at: [-0.013, 0.05, 0.0115], c: 'black', seg: 6 },
      { s: 'ball', d: [0.0028], at: [-0.019, 0.056, 0.0115], c: 'black', seg: 6 },
      { s: 'ball', d: [0.0028], at: [-0.007, 0.044, 0.0115], c: 'black', seg: 6 },
      { s: 'ball', d: [0.0028], at: [0.01875, 0.011, 0.00996], c: 'black', seg: 6 },
      { s: 'ball', d: [0.0028], at: [0.02308, 0.016, 0.00746], c: 'black', seg: 6 },
      { s: 'ball', d: [0.0028], at: [0.01442, 0.006, 0.01246], c: 'black', seg: 6 },
    ],
  },
  {
    id: 'gunmod-charm-gnome', name: 'Tiny Gnome', category: 'trinket', uses: ['place'],
    tags: ['gun', 'mod', 'charm', 'trinket', 'gnome', 'tiny', 'figure', 'hat'], emoji: [],
    about: 'Gun mod (charm): the Tiny Gnome. A thumb-sized gnome with a red cone hat, a blue coat and a white beard, on a string under a small ring. Hangs from the gun. No tint.',
    examine: [
      'A thumb-sized gnome with a red cone hat, a blue coat, a white beard and a round painted face, hung on a string.',
      'Gnome saying: a gnome on a string is a gnome who is never lost, and only a little bit trapped.',
      'Tip: do not show it to other gnomes. They will say it looks like you, and they will be right, and they will not stop.',
      'Joke: it is the only gnome in Turfton who is smaller than its own hat, which is a crisis for the hat.',
      'Its beard was done by a gnome who had only heard about beards, which is why the beard is so very confident.',
    ],
    parts: [
      { s: 'ring', d: [0.008, 0.002], at: [0, 0.126, 0], c: 'steel', seg: 8, name: 'ring' },
      { s: 'cyl', d: [0.0015, 0.0015, 0.012], at: [0, 0.112, 0], c: 'burlap', seg: 4, name: 'string' },
      { s: 'cone', d: [0.02, 0.05], at: [0, 0.085, 0], c: 'red', seg: 8, name: 'hat' },
      { s: 'ball', d: [0.017], at: [0, 0.05, 0], c: SKIN, seg: 8, name: 'face' },
      { s: 'ball', d: [0.012], at: [0, 0.042, 0.01], scale: [1, 0.9, 0.7], c: 'white', seg: 8, name: 'beard' },
      { s: 'cyl', d: [0.018, 0.022, 0.034], at: [0, 0.017, 0], c: 'blue', seg: 8, name: 'coat' },
    ],
  },
  {
    id: 'gunmod-charm-bell', name: 'Brass Bell', category: 'trinket', uses: ['place'],
    tags: ['gun', 'mod', 'charm', 'trinket', 'bell', 'brass', 'ring', 'clapper'], emoji: [],
    about: 'Gun mod (charm): the Brass Bell. A small brass bell with a dark clapper ball in its mouth, on a ring. Hangs from the gun. No tint.',
    examine: [
      'A small brass bell with a dark clapper ball hanging in its mouth, on a ring small enough to lose in a hedge.',
      'Gnome rhyme: ring it once for luck and twice for the Verge, and never ring it near the Fence, which is listening.',
      'Tip: tie the ring tight. A bell that falls off in traffic ends up as someone else\'s luck.',
      'Joke: it has rung for every gnome who ever crossed the lawn, and for several who only walked there very fast.',
      'A dent on the side is shaped exactly like a thumb. Gnomes agree that it was a happy thumb, and that it was not sorry.',
    ],
    parts: [
      { s: 'ring', d: [0.012, 0.0025], at: [0, 0.058, 0], c: 'iron', seg: 8, name: 'ring' },
      { s: 'cyl', d: [0.01, 0.022, 0.04], at: [0, 0.03, 0], c: 'brass', seg: 8, name: 'bell' },
      { s: 'ball', d: [0.006], at: [0, 0.006, 0], c: 'black', seg: 6, name: 'clapper' },
    ],
  },
];
