// Gnome Theft Auto: Founders' Green sports (batch 3 E19): wearables, the achievement rewards and the regulars' gear.
import type { PrefabDef } from '../types';

export const GTA_SPORTS_GEAR: readonly PrefabDef[] = [
  {
    id: 'drainpipe-sweatband', name: 'Drainpipe Sweatband', category: 'armor', uses: ['wear-head'],
    tags: ['sweatband', 'band', 'terry', 'headband', 'stripe', 'drainpipe', 'court', 'basketball', 'hat', 'head', 'reward', 'gta'], emoji: [],
    about: 'Down the Drainpipe: an orange terry sweatband worn low on the brow, a grey drainpipe stripe round it and a little blue hoop stitched on the front. Plain colours, no tint.',
    examine: [
      'A terry sweatband in bright orange with a grey stripe round it and a little blue hoop stitched on the front, worn low on the brow.',
      'Saying of the Court: a band worn low means business, and a band worn high is just a headache with ambitions.',
      'Tip: wet the band before a long game. A dry sweatband is a decoration, and a damp one is a job.',
      'Joke: the grey stripe is called the drainpipe by the players, and the drainpipe has never once commented on it.',
      'The hoop was stitched by a gnome who wanted to be on the team, and it is still the only proof he ever played.',
    ],
    parts: [
      { s: 'cyl', d: [0.165, 0.165, 0.05], at: [0, 0.025, 0], c: 'orange', seg: 12 },              // sweatband (min.y = 0)
      { s: 'cyl', d: [0.167, 0.167, 0.012], at: [0, 0.03, 0], c: 'stone', seg: 12 },               // drainpipe stripe
      { s: 'ring', d: [0.025, 0.005], at: [0, 0.025, 0.166], c: 'blue', seg: 8 },                 // embroidered hoop
    ],
  },
  {
    id: 'spare-basketball', name: 'Spare Basketball', category: 'tool', uses: ['hold'],
    tags: ['ball', 'basketball', 'spare', 'orange', 'street', 'hoop', 'seam', 'hold', 'reward', 'gta'], emoji: [],
    grip: [0, 0.11, 0],
    about: 'Bring a Spare: a scuffed orange street basketball with dark seam lines, held at the grip. About 0.22 across.',
    examine: [
      'A scuffed orange street ball with dark seam lines across it, worn a little flat on one side from the kerb.',
      'Saying of the Court: a spare ball is for when the first one goes down the drain, and it always does.',
      'Tip: bounce it on the way in, not the way out. Gnomes who dribble on the way out tend to chase it into Gnorwin.',
      'Joke: the seams are a map of the court, the court says, though nobody has ever been able to read it.',
      'It is hollow and lighter than it looks, and it rattles faintly when the player is lobbing it at the hoop.',
    ],
    parts: [
      { s: 'ball', d: [0.11], at: [0, 0.11, 0], c: 'orange', seg: 8 },                             // ball (grip at its centre)
      { s: 'ring', d: [0.112, 0.005], at: [0, 0.11, 0], rot: [0, 90, 0], c: 'black', seg: 8 },       // seam
      { s: 'ring', d: [0.112, 0.005], at: [0, 0.11, 0], rot: [90, 0, 0], c: 'black', seg: 8 },       // seam
      { s: 'ring', d: [0.112, 0.005], at: [0, 0.11, 0], rot: [0, 0, 90], c: 'black', seg: 8 },       // seam
    ],
  },
  {
    id: 'swish-net-scarf', name: 'Swish Net Scarf', category: 'armor', uses: ['wear-neck'],
    wear: { at: [0, -0.12, 0] },
    tags: ['net', 'scarf', 'basketball', 'hoop', 'string', 'mesh', 'white', 'neck', 'reward', 'gta'], emoji: [],
    about: 'Nobody Owns the Court: a white basketball net worn round the neck as a scarf, two loose ends hanging at the front. Plain colours, no tint.',
    examine: [
      'A white basketball net worn round the neck like a scarf, with two loose ends hanging down the front and a few knots of cord.',
      'Saying of the Hoop: a net that has never caught a ball still keeps the shape of every ball it has seen.',
      'Tip: wear it loose. A tight net makes for a short game and a long afternoon of untangling.',
      'Joke: the hoop at the court has no net, so Swish wears this one instead, and the hoop has never said a word.',
      'Knotted by a gnome who was promised a ball in return, and the net is still waiting for the ball to arrive.',
    ],
    parts: [
      { s: 'ring', d: [0.15, 0.008], at: [0, 0.02, 0], rot: [90, 0, 0], c: 'white', seg: 10 },   // net band, low (min.y = 0)
      { s: 'ring', d: [0.15, 0.008], at: [0, 0.08, 0], rot: [90, 0, 0], c: 'white', seg: 10 },   // net band, high
      { s: 'box', d: [0.01, 0.075, 0.01], at: [0.05, 0.05, 0.14], rot: [0, 0, 35], c: 'white', mirror: true }, // diagonal, front
      { s: 'box', d: [0.01, 0.075, 0.01], at: [0.05, 0.05, -0.14], rot: [0, 0, -35], c: 'white', mirror: true }, // diagonal, back
      { s: 'box', d: [0.035, 0.1, 0.008], at: [0.05, 0.06, 0.17], c: 'white' },                  // loose end
      { s: 'box', d: [0.035, 0.1, 0.008], at: [-0.04, 0.05, 0.165], c: 'white' },                // loose end
    ],
  },
  {
    id: 'gutter-skate-helmet', name: 'Gutter Skate Helmet', category: 'armor', uses: ['wear-head'],
    tags: ['helmet', 'skate', 'hat', 'vent', 'strap', 'sticker', 'acorn', 'blue', 'head', 'reward', 'gta'], emoji: [],
    about: 'First Ollie: a round sky-blue skate helmet with vent slots, a chin strap and an acorn sticker on the side. Plain colours, no tint.',
    examine: [
      'A round sky-blue skate helmet with dark vent slots across the top, a chin strap, and an acorn sticker stuck on one side.',
      'Saying of the Gutter: a helmet is for the fall you planned for, and a sticker is for the fall you did not.',
      'Tip: buckle the chin strap before you push off. The strap is the part of the helmet that does the work.',
      'Joke: the acorn sticker is meant to show courage, but it mostly shows which side of the helmet is the front.',
      'Dented on one side from a bad afternoon in the bowl, and worn with the dent facing the wall, as is proper.',
    ],
    parts: [
      { s: 'ball', d: [0.16], at: [0, 0.136, 0], scale: [1, 0.85, 1], c: 'water', seg: 10 },  // shell (min.y = 0)
      { s: 'box', d: [0.1, 0.008, 0.012], at: [0, 0.2, 0.14], c: 'ink' },                   // vent slot
      { s: 'box', d: [0.08, 0.008, 0.012], at: [0, 0.18, 0.15], c: 'ink' },                 // vent slot
      { s: 'box', d: [0.012, 0.09, 0.012], at: [0.1, 0.05, 0.09], rot: [0, 0, -20], c: 'ink', mirror: true }, // chin strap
      { s: 'ball', d: [0.028], at: [0.15, 0.13, 0], c: 'honey', seg: 6 },                   // acorn sticker
      { s: 'ball', d: [0.018], at: [0.15, 0.16, 0], scale: [1, 0.5, 1], c: 'bark', seg: 6 }, // acorn cap
    ],
  },
  {
    id: 'gutter-deck-sling', name: 'Gutter Deck Sling', category: 'armor', uses: ['wear-back'],
    tags: ['skateboard', 'deck', 'board', 'skate', 'sling', 'strap', 'webbing', 'trucks', 'wheels', 'back', 'reward', 'gta'], emoji: [],
    about: 'Five in the Gutter: a wooden skateboard slung diagonally across the back on a webbing strap, with grip tape, two trucks and four cream wheels. About 0.7 long.',
    examine: [
      'A wooden skateboard slung diagonally across the back on a webbing strap, with grip tape on top, two trucks and four cream wheels.',
      'Saying of the Bowl: a board on the back is a board you can reach quickly, and a board on the ground belongs to someone else.',
      'Tip: carry the deck with the wheels facing out. The wheels are the part that catches on the fence, every single time.',
      'Joke: the wheels roll in a very determined direction, which is mostly away from the gnome doing the carrying.',
      'The grip tape was put on by a gnome who had never been on a board, and it has the shape of a very confident map of Gnorwin.',
    ],
    parts: [
      { s: 'box', d: [0.2, 0.72, 0.02], at: [0, 0.362, 0], rot: [0, 0, -30], c: 'wood' },        // deck (min.y = 0)
      { s: 'box', d: [0.16, 0.66, 0.004], at: [0, 0.362, 0.014], rot: [0, 0, -30], c: 'black' },  // grip tape
      { s: 'box', d: [0.11, 0.016, 0.02], at: [0.125, 0.5785, -0.022], rot: [0, 0, -30], c: 'steel' }, // truck
      { s: 'box', d: [0.11, 0.016, 0.02], at: [-0.125, 0.1455, -0.022], rot: [0, 0, -30], c: 'steel' }, // truck
      { s: 'cyl', d: [0.025, 0.025, 0.02], at: [0.1683, 0.5535, -0.04], rot: [90, 0, 0], c: 'bone', seg: 8 }, // wheel
      { s: 'cyl', d: [0.025, 0.025, 0.02], at: [0.0817, 0.6035, -0.04], rot: [90, 0, 0], c: 'bone', seg: 8 }, // wheel
      { s: 'cyl', d: [0.025, 0.025, 0.02], at: [-0.0817, 0.1205, -0.04], rot: [90, 0, 0], c: 'bone', seg: 8 }, // wheel
      { s: 'cyl', d: [0.025, 0.025, 0.02], at: [-0.1683, 0.1705, -0.04], rot: [90, 0, 0], c: 'bone', seg: 8 }, // wheel
      { s: 'box', d: [0.04, 0.8, 0.006], at: [0, 0.4, 0.02], rot: [0, 0, -50], c: 'burlap' },    // webbing strap
    ],
  },
  {
    id: 'skate-tool-lanyard', name: 'Skate Tool Lanyard', category: 'armor', uses: ['wear-neck'],
    wear: { at: [0, -0.12, 0] },
    tags: ['lanyard', 'tool', 'skate', 'wax', 'cord', 'ring', 'neck', 'reward', 'gta'], emoji: [],
    about: 'End to End: a red lanyard round the neck with a T-shaped skate tool and a small block of wax hanging from it. Plain colours, no tint.',
    examine: [
      'A red lanyard round the neck with a T-shaped skate tool and a small block of wax hanging from it on a short cord.',
      'Saying of the Bowl: wax the rail before you grind it. A rail that is not waxed will teach you a lesson, slowly.',
      'Tip: use the T-shaped end to tighten the trucks. The other end has no clever purpose and is only pointy.',
      'Joke: the wax block is shaped like a bar of soap, and several gnomes have tried to wash their hands with it.',
      'The lanyard is tied in a knot that only the tool can undo, which is how the tool keeps its owner in order.',
    ],
    parts: [
      { s: 'ring', d: [0.15, 0.012], at: [0, 0.012, 0], rot: [90, 0, 0], c: 'red', seg: 10 },   // lanyard ring (min.y = 0)
      { s: 'box', d: [0.012, 0.07, 0.012], at: [0, 0.045, 0.165], c: 'steel' },               // tool stem
      { s: 'box', d: [0.05, 0.012, 0.012], at: [0, 0.08, 0.165], c: 'steel' },                // tool crossbar
      { s: 'box', d: [0.03, 0.02, 0.02], at: [0.04, 0.01, 0.165], c: 'wax' },                 // wax block
    ],
  },
];
