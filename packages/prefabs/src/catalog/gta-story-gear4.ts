// Gnome Theft Auto: wearable achievement rewards for story act IV (E22). Rules: docs/roadmaps/prefab-library/_common.md.
import type { PrefabDef } from '../types';

export const GTA_STORY_GEAR4: readonly PrefabDef[] = [
  {
    id: 'patched-parachute-pack', name: 'Patched Parachute Pack', category: 'armor', uses: ['wear-back'],
    tags: ['parachute', 'pack', 'canvas', 'patch', 'patches', 'almost', 'strap', 'fly', 'back', 'reward', 'gta'], emoji: [],
    about: 'Almost Certainly: a small canvas parachute pack covered in mismatched patches, one patch reading ALMOST. Plain colours, no tint.',
    examine: [
      'A small canvas parachute pack with two straps, covered in mismatched patches, one of them stitched with the single word ALMOST.',
      'Saying of the Drop: a parachute is a promise that the ground will be softer than the gnome expects, and the gnome is never told the terms.',
      'Tip: check the patches before you jump. A patch that has come loose in the air is a patch that will not be coming back down with you.',
      'Joke: the pack was repaired by six different gnomes, each of whom was certain the others had done it wrong.',
      'The canvas was once a tent for a very small picnic, and it still remembers the smell of the grass it was pitched on.',
    ],
    parts: [
      { s: 'box', d: [0.2, 0.26, 0.08], at: [0, 0.13, 0], c: 'cloth' },                        // pack (min.y = 0)
      { s: 'box', d: [0.04, 0.22, 0.01], at: [0.07, 0.13, 0.045], c: 'leather-dark' },          // strap
      { s: 'box', d: [0.05, 0.04, 0.006], at: [-0.04, 0.2, 0.045], c: 'red' },                  // patch, ALMOST
      { s: 'box', d: [0.04, 0.05, 0.006], at: [0.02, 0.08, 0.045], c: 'yellow' },               // patch
      { s: 'box', d: [0.03, 0.03, 0.006], at: [-0.05, 0.07, 0.045], c: 'blue' },                // patch
    ],
  },
  {
    id: 'spade-guard-pin', name: 'Spade Guard Pin', category: 'armor', uses: ['wear-neck'],
    wear: { at: [0, -0.12, 0] },
    tags: ['pin', 'brooch', 'spade', 'spades', 'brass', 'ribbon', 'green', 'collar', 'mole', 'neck', 'reward', 'gta'], emoji: [],
    about: 'Salute to a Mole: a small brass pin of two crossed spades on a green ribbon, worn at the collar. Plain colours, no tint.',
    examine: [
      'A small brass pin of two crossed spades, hung from a green ribbon and worn at the collar where a salute would be pinned.',
      'Burrowfolk saying: a spade crossed with a spade is a promise that the digging is finished and the tunnel is safe to walk.',
      'Tip: pin it on the left, over the heart. A pin on the right is a pin that the diggers will think is for the other side.',
      'Joke: Commander Diggs insists the spades are crossed in greeting, though the mole who made the pin insists they are crossed in a fight.',
      'The brass was cut from a door knocker of some mole\'s front step, and it still rings faintly when knocked against a tooth.',
    ],
    parts: [
      { s: 'box', d: [0.03, 0.12, 0.006], at: [0, 0.03, 0.12], c: 'green' },                   // ribbon tail (min.y is the pin)
      { s: 'box', d: [0.02, 0.14, 0.006], at: [0, 0.07, 0.13], rot: [0, 0, 45], c: 'brass' },  // spade one, shaft
      { s: 'box', d: [0.02, 0.14, 0.006], at: [0, 0.07, 0.13], rot: [0, 0, -45], c: 'brass' }, // spade two, shaft
      { s: 'box', d: [0.05, 0.03, 0.008], at: [-0.03, 0.12, 0.13], rot: [0, 0, 45], c: 'brass' }, // spade blade, left
      { s: 'box', d: [0.05, 0.03, 0.008], at: [0.03, 0.12, 0.13], rot: [0, 0, -45], c: 'brass' }, // spade blade, right
    ],
  },
  {
    id: 'patchwork-coalition-cape', name: 'Patchwork Coalition Cape', category: 'armor', uses: ['wear-back'],
    tags: ['cape', 'patchwork', 'squares', 'coalition', 'faction', 'cloth', 'patch', 'colours', 'back', 'reward', 'gta'], emoji: [],
    about: 'All Hats at One Table: a short cape of patchwork squares in every faction\'s cap colour. Plain colours, no tint.',
    examine: [
      'A short cape of patchwork squares, each one in the cap colour of a different faction, sewn together with a brown running stitch.',
      'Saying of the Table: a cape that has every colour in it cannot be accused of picking a side, and nobody has yet found a way to make it.',
      'Tip: lay the squares in the order they were given. A square out of place is a square that starts an argument at the table.',
      'Joke: the squares were cut from the caps of every outcast in Turfton, and several of them still have the owner\'s name written inside.',
      'The stitching was done at the overlook camp over three nights, and the seamstress has never once agreed with the gnome who gave her the thread.',
    ],
    parts: [
      { s: 'box', d: [0.3, 0.42, 0.01], at: [0, 0.21, 0], c: 'red' },                          // cape base (min.y = 0)
      { s: 'box', d: [0.1, 0.1, 0.014], at: [-0.1, 0.36, 0.003], c: 'yellow' },                 // square, top left
      { s: 'box', d: [0.1, 0.1, 0.014], at: [0.1, 0.36, 0.003], c: 'blue' },                    // square, top right
      { s: 'box', d: [0.1, 0.1, 0.014], at: [-0.1, 0.16, 0.003], c: 'green' },                  // square, bottom left
      { s: 'box', d: [0.1, 0.1, 0.014], at: [0.1, 0.16, 0.003], c: 'white' },                   // square, bottom right
    ],
  },
  {
    id: 'pressed-leaf-locket', name: 'Pressed Leaf Locket', category: 'armor', uses: ['wear-neck'],
    wear: { at: [0, -0.12, 0] },
    tags: ['locket', 'pendant', 'leaf', 'glass', 'oval', 'brass', 'green', 'chain', 'photograph', 'neck', 'reward', 'gta'], emoji: [],
    about: 'Hairline: a small oval locket on a chain, with a pressed green leaf behind glass. Plain colours, no tint.',
    examine: [
      'A small oval locket on a fine chain, with a pressed green leaf behind a round of glass and a hinge that opens only with care.',
      'Saying of the Photograph: a locket keeps the picture of what was there, and a gnome who wears one is asked to remember it.',
      'Tip: open it with the thumb, not the nail. The hinge is old, and the glass is older, and both are easily cracked by a hasty gnome.',
      'Joke: the leaf was pressed in a book about gardens that turned out to be a book about taxes, and the leaf has never fully recovered.',
      'The chain was cut from the tie of a gnome who went out one morning and never tied anything again.',
    ],
    parts: [
      { s: 'ring', d: [0.13, 0.005], at: [0, 0.1, 0], rot: [90, 0, 0], c: 'steel', seg: 10 },    // chain loop
      { s: 'ball', d: [0.04], at: [0, 0.03, 0.12], scale: [0.7, 1, 0.3], c: 'brass', seg: 10 },  // oval case
      { s: 'ball', d: [0.03], at: [0, 0.03, 0.13], scale: [0.7, 1, 0.15], c: 'glass', seg: 8 }, // glass front
      { s: 'box', d: [0.02, 0.035, 0.004], at: [0, 0.03, 0.135], rot: [0, 0, 30], c: 'green' }, // pressed leaf
    ],
  },
  {
    id: 'saucer-court-key', name: 'Saucer Court Key', category: 'tool', uses: ['hold', 'wear-hands'],
    grip: [0, 0.05, 0],
    wear: { rot: [90, 0, 0] },
    tags: ['key', 'brass', 'flat', 'ring', 'fob', 'saucer', 'court', 'stamped', 'hand', 'reward', 'gta'], emoji: [],
    about: 'Last Lift Home: a big brass flat key on a ring, with a saucer-shaped fob stamped 3B. Held upright at the grip. About 0.24 tall. Plain colours, no tint.',
    examine: [
      'A big brass flat key on a split ring, with a round saucer-shaped fob hanging from it and the number 3B stamped into the face.',
      'Saying of the Lift: a key that opens every door on the way home is worth more than the gnome who carries it, and both are often lost together.',
      'Tip: hold it by the bow, the flat loop at the top. The bit is for doors, and doors do not like being held.',
      'Joke: the fob was a saucer from a set that was never complete, and the 3B is the number of the cup it was always missing.',
      'The key was cut for a door that has since been moved three times, and it still turns, out of spite.',
    ],
    parts: [
      { s: 'cyl', d: [0.006, 0.006, 0.2], at: [0, 0.13, 0], c: 'brass', seg: 6 },              // shaft
      { s: 'ring', d: [0.03, 0.007], at: [0, 0.25, 0], c: 'brass', seg: 10 },                    // bow
      { s: 'box', d: [0.012, 0.05, 0.004], at: [0, 0.035, 0], c: 'brass' },                     // key bit
      { s: 'cyl', d: [0.035, 0.035, 0.006], at: [0.05, 0.1, 0], rot: [90, 0, 0], c: 'brass', seg: 12 }, // saucer fob
      { s: 'box', d: [0.02, 0.012, 0.002], at: [0.05, 0.1, 0.004], c: 'black' },                // stamped 3B
    ],
  },
  {
    id: 'stop-sign-lollipop', name: 'Stop Sign Lollipop', category: 'tool', uses: ['hold', 'wear-hands'],
    grip: [0, 0.05, 0],
    wear: { rot: [90, 0, 0] },
    tags: ['sign', 'stop', 'lollipop', 'crossing', 'patrol', 'disc', 'red', 'white', 'pole', 'hand', 'reward', 'gta'], emoji: [],
    about: 'Lollipop Lady: a crossing-patrol stop sign, a round red-and-white STOP disc on a tall white pole, held upright at the grip. About 0.44 tall. Plain colours, no tint.',
    examine: [
      'A crossing-patrol stop sign: a round red disc with a white rim and the word STOP across it, on a tall white pole.',
      'Saying of the Crossing: a stop sign held up is a stop sign that the traffic has agreed to obey, and no traffic has yet agreed to anything else.',
      'Tip: hold it upright, by the grip. A sign that leans is a sign that the Combine will take as an invitation.',
      'Joke: the word STOP is spelled in white on the front and in red on the back, so that the gnome behind it can also stop, if asked nicely.',
      'The pole was a broom handle that was painted white for a parade and never painted back, and the disc was cut from a dinner plate that was never used.',
    ],
    parts: [
      { s: 'cyl', d: [0.012, 0.012, 0.44], at: [0, 0.22, 0], c: 'white', seg: 8 },              // pole (min.y = 0)
      { s: 'cyl', d: [0.1, 0.1, 0.01], at: [0, 0.4, 0], rot: [90, 0, 0], c: 'white', seg: 14 }, // white rim
      { s: 'cyl', d: [0.09, 0.09, 0.012], at: [0, 0.4, 0.002], rot: [90, 0, 0], c: 'red', seg: 14 }, // red disc
      { s: 'box', d: [0.1, 0.02, 0.004], at: [0, 0.4, 0.009], c: 'white' },                     // STOP bar
    ],
  },
  {
    id: 'finishers-medal', name: "Finisher's Medal", category: 'armor', uses: ['wear-neck'],
    wear: { at: [0, -0.12, 0] },
    tags: ['medal', 'medallion', 'gold', 'ribbon', 'purple', 'finish', 'story', 'laurel', 'neck', 'reward', 'gta'], emoji: [],
    about: 'The Whole Story: a gold medal on a purple ribbon, worn at the neck, with a small laurel stamped on its face. Plain colours, no tint.',
    examine: [
      'A gold medal on a purple ribbon, with a small laurel stamped on its face and the year of the last quest engraved underneath.',
      'Saying of the Ending: a medal is only given at the end of a story, and this one was given before the story had finished being told.',
      'Tip: wear it outside the collar. A medal tucked inside is a medal that nobody will ask about, and the question is the whole point.',
      'Joke: the engraving was done by a gnome who was not yet sure how the story ended, so the year is written in pencil on the back.',
      'The ribbon was torn from a flag that had been flown at every single quest, and it still has the faint smell of a long road.',
    ],
    parts: [
      { s: 'ring', d: [0.14, 0.006], at: [0, 0.08, 0], rot: [90, 0, 0], c: 'purple', seg: 10 },   // ribbon loop
      { s: 'box', d: [0.03, 0.09, 0.006], at: [-0.02, 0.06, 0.12], rot: [0, 0, -15], c: 'purple' }, // ribbon tail, left
      { s: 'box', d: [0.03, 0.09, 0.006], at: [0.02, 0.06, 0.12], rot: [0, 0, 15], c: 'purple' },  // ribbon tail, right
      { s: 'cyl', d: [0.045, 0.045, 0.008], at: [0, 0.03, 0.13], rot: [90, 0, 0], c: 'gold', seg: 12 }, // medal disc
      { s: 'box', d: [0.035, 0.02, 0.004], at: [0, 0.03, 0.137], c: 'green' },                  // laurel
    ],
  },
  {
    id: 'borrowed-top-hat', name: 'Borrowed Top Hat', category: 'armor', uses: ['wear-head'],
    tags: ['hat', 'top', 'tall', 'black', 'glossy', 'porcelain', 'band', 'borrowed', 'head', 'reward', 'gta'], emoji: [],
    about: 'The Hat Comes Off: a tall glossy black top hat with a porcelain-white band, slightly too big. Plain colours, no tint.',
    examine: [
      'A tall glossy black top hat with a porcelain-white band round the crown, sitting slightly too big and tilted a little forward.',
      'Saying of the Brim: a top hat is only as high as the gnome wearing it, and this one has been borrowed from a gnome who was taller.',
      'Tip: push it back on the head, not down. A hat pushed down over the ears is a hat that will be knocked off on the first turn.',
      'Joke: the band was once a porcelain saucer that a waiter dropped, and the crack is the only sign that the hat was ever in a hurry.',
      'The lining has the name of its owner stitched inside, and the name is crossed out in a different ink, a sign of a loan that was not repaid.',
    ],
    parts: [
      { s: 'cyl', d: [0.15, 0.15, 0.015], at: [0, 0.008, 0], c: 'black', seg: 12 },              // brim (min.y = 0)
      { s: 'cyl', d: [0.1, 0.1, 0.2], at: [0, 0.115, 0], c: 'black', seg: 12 },                 // tall crown
      { s: 'ring', d: [0.102, 0.008], at: [0, 0.05, 0], rot: [90, 0, 0], c: 'white', seg: 12 }, // porcelain band
    ],
  },
];
