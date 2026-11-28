// Gnome Theft Auto: wearable achievement rewards for story act III (E21). Rules: docs/roadmaps/prefab-library/_common.md.
import type { PrefabDef } from '../types';

export const GTA_STORY_GEAR3: readonly PrefabDef[] = [
  {
    id: 'racing-flag', name: 'Racing Flag', category: 'tool', uses: ['hold', 'wear-hands'],
    grip: [0, 0.05, 0],
    wear: { rot: [90, 0, 0] },
    tags: ['flag', 'racing', 'chequered', 'checkered', 'stick', 'pole', 'race', 'white', 'black', 'hand', 'reward', 'gta'], emoji: [],
    about: 'Cap Bruiser: a small chequered racing flag on a short stick, held upright at the grip. About 0.26 tall. Plain colours, no tint.',
    examine: [
      'A small chequered racing flag on a short stick, its black and white squares hanging limp until somebody starts to wave it.',
      'Saying of the Track: a flag is only a rag until the gnome holding it decides the race is over.',
      'Tip: hold the stick low, by the grip. The flag belongs at the top and the hand belongs at the bottom, and the two do not swap.',
      'Joke: the chequers were painted in a hurry by a gnome who had only ever seen a chequered flag in a picture, and the picture was black and white.',
      'The stick came from a garden stake that was thought to be a flagpole, a mistake that has never been corrected in the paperwork.',
    ],
    parts: [
      { s: 'cyl', d: [0.006, 0.006, 0.26], at: [0, 0.13, 0], c: 'wood', seg: 6 },              // stick
      { s: 'box', d: [0.1, 0.07, 0.004], at: [0.05, 0.225, 0], c: 'white' },                  // flag, white base
      { s: 'box', d: [0.05, 0.035, 0.006], at: [0.025, 0.245, 0], c: 'black' },               // chequer, top left
      { s: 'box', d: [0.05, 0.035, 0.006], at: [0.075, 0.205, 0], c: 'black' },               // chequer, bottom right
    ],
  },
  {
    id: 'pirate-tricorn', name: 'Pirate Tricorn', category: 'armor', uses: ['wear-head'],
    tags: ['hat', 'tricorn', 'pirate', 'felt', 'black', 'gold', 'trim', 'skull', 'paper', 'head', 'reward', 'gta'], emoji: [],
    about: 'Pirate for a Night: a black felt tricorn with a gold trim and a little paper skull pinned to the front. Plain colours, no tint.',
    examine: [
      'A black felt tricorn with its brim turned up on three sides, a gold trim round the base and a little paper skull pinned at the front.',
      'Saying of the Barge: a hat that is folded three ways is a hat that means business, and the business is usually the crew.',
      'Tip: wear it square to the front. A tricorn at a tilt is a tricorn that is about to be taken by the wind off the Bathtub.',
      'Joke: the skull is drawn in a style that suggests it has been in several fights, though it is in fact a paper scrap from a bath toy.',
      'The felt was cut from a waistcoat that belonged to a gnome who was never seen again, and it has been trying to make up for it ever since.',
    ],
    parts: [
      { s: 'cyl', d: [0.17, 0.17, 0.02], at: [0, 0.01, 0], c: 'black', seg: 12 },              // brim (min.y = 0)
      { s: 'cyl', d: [0.1, 0.1, 0.07], at: [0, 0.055, 0], c: 'black', seg: 10 },               // crown
      { s: 'ring', d: [0.172, 0.005], at: [0, 0.022, 0], rot: [90, 0, 0], c: 'gold', seg: 12 }, // gold trim
      { s: 'box', d: [0.035, 0.03, 0.008], at: [0, 0.06, 0.104], c: 'paper' },                 // paper skull
    ],
  },
  {
    id: 'faculty-gown', name: 'Faculty Gown', category: 'armor', uses: ['wear-back'],
    tags: ['gown', 'cape', 'robe', 'academic', 'black', 'green', 'hood', 'gold', 'cloth', 'back', 'reward', 'gta'], emoji: [],
    about: 'Sugar Landlord: a short black faculty gown with a green Rootwell hood, worn as a cape. Plain colours, no tint.',
    examine: [
      'A short black faculty gown worn as a cape, with a green hood folded at the top and a thin gold cord along the hem.',
      'Saying of the Hall: a gown is only as respectable as the gnome who wears it, and this one has been worn by several gnomes who should not have.',
      'Tip: keep the hood at the back of the neck. A hood worn over the eyes is a hood that has been mistaken for a blindfold, and that is a different course.',
      'Joke: the gold cord was once a shoelace, and the lecturer who gave it to the gown has never explained why it is so long.',
      'Rootwell green was dyed by a gnome who used the wrong bucket, and the result is a shade that the ants call a fine compliment.',
    ],
    parts: [
      { s: 'box', d: [0.28, 0.46, 0.012], at: [0, 0.23, 0], c: 'black' },                     // gown body (min.y = 0)
      { s: 'box', d: [0.14, 0.08, 0.014], at: [0, 0.42, 0.003], c: 'green' },                 // green hood
      { s: 'box', d: [0.28, 0.012, 0.014], at: [0, 0.01, 0.004], c: 'gold' },                // gold hem cord
    ],
  },
  {
    id: 'mole-lamp-helmet', name: 'Mole Lamp Helmet', category: 'armor', uses: ['wear-head'],
    tags: ['helmet', 'helm', 'miner', 'brass', 'lamp', 'glow', 'light', 'mole', 'burrow', 'head', 'reward', 'gta'], emoji: [],
    about: 'Everyone Digs: a brass miner\'s helmet with a small warm lamp on the front. Glows. Plain colours, no tint.',
    examine: [
      'A brass miner\'s helmet, domed over the head, with a small warm lamp fixed to the front on a short brass bracket.',
      'Saying of the Shaft: a light at the front of the helmet is a light that shows the way, and a gnome underground needs all the way he can get.',
      'Tip: check the lamp before you go down. A lamp that has gone out in the tunnel is a lamp that will be missed by everyone but the mole.',
      'Joke: the helmet was made for a gnome of some other size, and has been polished to fit every head in the Burrow by sheer persistence.',
      'The brass is worn bright at the crown from years of being bumped against low ceilings, a mark of honest work and several sore heads.',
    ],
    parts: [
      { s: 'ball', d: [0.15], at: [0, 0.0975, 0], scale: [1, 0.65, 1], c: 'brass', seg: 10 },   // dome (min.y = 0)
      { s: 'cyl', d: [0.04, 0.04, 0.02], at: [0, 0.11, 0.14], rot: [90, 0, 0], c: 'brass', seg: 8 }, // lamp bracket
      { s: 'ball', d: [0.022], at: [0, 0.11, 0.155], c: 'spark', glow: true, seg: 6 },         // lit lamp
    ],
  },
  {
    id: 'golf-umbrella', name: 'Golf Umbrella', category: 'tool', uses: ['hold', 'wear-hands'],
    grip: [0, 0.05, 0],
    wear: { rot: [90, 0, 0] },
    tags: ['umbrella', 'golf', 'brolly', 'closed', 'striped', 'red', 'white', 'cane', 'shaft', 'hand', 'reward', 'gta'], emoji: [],
    about: 'Nothing Works: a big striped golf umbrella, closed, held like a cane at the grip. About 0.5 tall. Plain colours, no tint.',
    examine: [
      'A big striped golf umbrella, closed and rolled tight, its red and white panels bound with a strap, held like a walking cane.',
      'Saying of the Fairway: an umbrella closed is a promise that the rain has not yet started, and the gnome who carries it has never once been wrong.',
      'Tip: hold it by the grip, not the canopy. The canopy is for the rain, and the grip is for the gnome who has to walk through it.',
      'Joke: the handle hook was bent to fit a gnome\'s elbow, and it has been used to pull several reluctant gnomes out of a hedge.',
      'The shaft is a golf club that gave up the game, and it still has the faint dents of too many tee shots on its tip.',
    ],
    parts: [
      { s: 'ball', d: [0.008], at: [0, 0.008, 0], c: 'iron', seg: 6 },                       // tip (min.y = 0)
      { s: 'cyl', d: [0.007, 0.007, 0.42], at: [0, 0.219, 0], c: 'steel', seg: 6 },           // shaft
      { s: 'cyl', d: [0.035, 0.035, 0.22], at: [0, 0.33, 0], c: 'red', seg: 8 },              // closed canopy
      { s: 'box', d: [0.01, 0.22, 0.01], at: [0.034, 0.33, 0], c: 'white' },                  // canopy stripe
      { s: 'box', d: [0.01, 0.22, 0.01], at: [-0.034, 0.33, 0], c: 'white' },                 // canopy stripe
      { s: 'ring', d: [0.03, 0.007], at: [0.03, 0.46, 0], c: 'leather', seg: 10 },           // crook handle
    ],
  },
  {
    id: 'bunk-peg-sock', name: 'Bunk Peg Sock', category: 'armor', uses: ['wear-neck'],
    wear: { at: [0, -0.12, 0] },
    tags: ['sock', 'peg', 'woolly', 'red', 'cord', 'neck', 'lodge', 'winter', 'reward', 'gta'], emoji: [],
    about: 'Woolly Sock Regular: a small red woolly sock clipped to a wooden bunk peg, worn on a cord round the neck. Plain colours, no tint.',
    examine: [
      'A small red woolly sock clipped to a wooden bunk peg, hung on a cord so it sits at the chest like a medal nobody voted for.',
      'Lodge saying: every bunk at the Woolly Sock has a peg, and every peg has a sock, and nobody asks whose.',
      'Tip: wear it to the lodge door. Gentian counts the pegs, not the faces.',
      'Joke: it has never been worn on a foot, and it is the only sock in Snowcap Rise that can say so.',
      'Unhooked from a peg in the bunk room on the night the crew was given a roof, and never hung back up.',
    ],
    parts: [
      { s: 'ring', d: [0.14, 0.006], at: [0, 0.08, 0], rot: [90, 0, 0], c: 'leather', seg: 10 },   // cord loop
      { s: 'box', d: [0.008, 0.05, 0.008], at: [0, 0.06, 0.13], c: 'leather' },                 // cord, front
      { s: 'box', d: [0.03, 0.02, 0.012], at: [0, 0.035, 0.14], c: 'wood' },                     // peg
      { s: 'box', d: [0.04, 0.05, 0.02], at: [0, 0.025, 0.15], c: 'red' },                       // sock leg
      { s: 'box', d: [0.04, 0.02, 0.035], at: [0, 0.01, 0.165], c: 'red' },                      // sock foot
    ],
  },
];
