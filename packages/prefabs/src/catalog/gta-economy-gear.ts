// Gnome Theft Auto: economy, ownership and inventory (docs/roadmaps/gta-batch-3/E08): achievement reward gear.
import type { PrefabDef } from '../types';

export const GTA_ECONOMY_GEAR: readonly PrefabDef[] = [
  {
    id: 'dealer-keyring', name: 'Dealer Keyring', category: 'trinket', uses: ['hold'],
    tags: ['keyring', 'key', 'keys', 'fob', 'ring', 'dealer', 'forecourt', 'car', 'hand', 'reward', 'gta'], emoji: [],
    grip: [0, 0.05, 0],
    about: 'Gnome Theft Auto: the Dealer Keyring. A short leather-wrapped grip with a steel key ring and a brass dealer tag. Held in the hand, like the Acorn-Cola Can.',
    examine: [
      'A short leather grip with a steel ring at the top, and a brass tag hanging from it that says the name of a forecourt.',
      'Saying: a gnome who has bought a vehicle has a key, and a gnome with a key has a reason to be seen in it.',
      'Tip: keep the tag facing out, so the salesman knows which car you mean when you wave it at him.',
      'Joke: the keyring has three keys on it, and none of them open the car. They open the shed, the shed and the other shed.',
      'The leather is worn pale where a thumb has rubbed it, the way they wear when a gnome checks the keys twenty times a day.',
    ],
    parts: [
      { s: 'box', d: [0.024, 0.1, 0.02], at: [0, 0.05, 0], c: 'leather' },                  // grip
      { s: 'ring', d: [0.04, 0.008], at: [0, 0.15, 0], c: 'steel', seg: 10 },                // key ring
      { s: 'box', d: [0.03, 0.04, 0.005], at: [0.03, 0.12, 0], c: 'brass' },                 // dealer tag
    ],
  },
  {
    id: 'numbered-plate-rack', name: 'Numbered Plate Rack', category: 'armor', uses: ['wear-back'],
    tags: ['plate', 'plates', 'number', 'numbered', 'rack', 'registration', 'back', 'fleet', 'reward', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Numbered Plate Rack. An iron frame worn on the back with three white number plates on it. Plain colours, no tint.',
    examine: [
      'An iron frame on the back, holding three white number plates with dark digits, one above the other.',
      'Saying: three cars, three plates, and three reasons for the Kiln to ask who owns the lot.',
      'Tip: the plates rattle when you run, so run only where the shopkeep cannot hear you coming.',
      'Joke: the numbers are painted by hand, so the seven looks like a one and the one looks like a seven.',
      'The middle plate is yellow. It belongs to a car that has never once been driven, and nobody has the heart to tell it.',
    ],
    parts: [
      { s: 'box', d: [0.28, 0.02, 0.03], at: [0, 0.01, -0.03], c: 'iron' },                  // base bar
      { s: 'box', d: [0.02, 0.28, 0.02], at: [-0.13, 0.14, -0.03], c: 'iron-dark', mirror: true }, // posts
      { s: 'box', d: [0.1, 0.06, 0.01], at: [-0.05, 0.1, -0.05], c: 'white' },              // plate
      { s: 'box', d: [0.1, 0.06, 0.01], at: [0.05, 0.17, -0.05], c: 'yellow' },             // plate
      { s: 'box', d: [0.1, 0.06, 0.01], at: [-0.03, 0.24, -0.05], c: 'white' },             // plate
    ],
  },
  {
    id: 'salesman-boater', name: "Salesman's Boater", category: 'armor', uses: ['wear-head'],
    tags: ['boater', 'hat', 'straw', 'salesman', 'dealer', 'forecourt', 'head', 'summer', 'reward', 'gta'], emoji: ['🎩'],
    about: 'Gnome Theft Auto: the Salesman\'s Boater. A flat straw boater with a wide brim and a black band. Plain colours, no tint.',
    examine: [
      'A flat straw boater with a wide brim and a black band, the kind of hat a salesman wears to look like he has been trusted.',
      'Saying: a boater on the head is a sale half made, so tip it at the buyer before you name your price.',
      'Tip: take it off indoors, or the Kiln-Shield man will not believe a word you say about the brakes.',
      'Joke: the brim is wide enough to shade a whole dealership, and it still does not shade the price tag.',
      'The band has a small brass pin in it, in the shape of a car that was never quite finished.',
    ],
    parts: [
      { s: 'cyl', d: [0.22, 0.22, 0.015], at: [0, 0.0075, 0], c: 'straw', seg: 12 },           // brim
      { s: 'cyl', d: [0.11, 0.1, 0.12], at: [0, 0.075, 0], c: 'straw', seg: 10 },              // crown
      { s: 'cyl', d: [0.112, 0.112, 0.03], at: [0, 0.035, 0], c: 'black', seg: 10 },          // band
      { s: 'box', d: [0.02, 0.012, 0.004], at: [0.06, 0.035, 0.112], c: 'brass' },            // pin
    ],
  },
  {
    id: 'kiln-shield-badge', name: 'Kiln-Shield Badge', category: 'trinket', uses: ['wear-neck'],
    tags: ['badge', 'shield', 'kiln', 'insurance', 'claim', 'pin', 'neck', 'reward', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Kiln-Shield Badge. A round iron badge on a red cord, with a red enamel boss in the middle. Plain colours, no tint.',
    examine: [
      'A round iron badge on a red cord, with a red boss in the middle the size of a pea and a rim worn smooth by thumbs.',
      'Saying: the shield does not stop the crack, it only pays for the mending, and that is good enough for most gnomes.',
      'Tip: show it to the claims desk before you start talking about the crash, or the desk will start talking about the paperwork.',
      'Joke: the badge says Kiln-Shield on it, which is the only thing about the company that has ever been fired-clay solid.',
      'Someone has scratched a tiny wheel into the back of the badge. It is not the company logo, and nobody will say whose it is.',
    ],
    parts: [
      { s: 'ring', d: [0.21, 0.01], at: [0, 0.01, -0.05], rot: [90, 0, 0], c: 'red', seg: 12 },  // neck cord
      { s: 'cyl', d: [0.04, 0.04, 0.008], at: [0, 0.03, 0.17], rot: [90, 0, 0], c: 'iron', seg: 10 }, // badge
      { s: 'cyl', d: [0.014, 0.014, 0.01], at: [0, 0.03, 0.178], rot: [90, 0, 0], c: 'red', seg: 8 }, // boss
    ],
  },
  {
    id: 'crumbs-satchel', name: 'Crumbs & Co. Satchel', category: 'armor', uses: ['wear-back'],
    tags: ['satchel', 'bag', 'sack', 'paper', 'snack', 'crumbs', 'back', 'lunch', 'reward', 'gta'], emoji: ['🎒'],
    about: 'Gnome Theft Auto: the Crumbs & Co. Satchel. A paper-brown bag worn on the back with a red band across the top and a few crumbs spilling out. Plain colours, no tint.',
    examine: [
      'A paper-brown bag worn on the back, with a red band across the top and a few golden crumbs spilling out of the seam.',
      'Saying: the bag is never empty, it is only waiting for the next snack to be stuffed in and forgotten about.',
      'Tip: carry it on the back, not the hip, or the crumbs fall into your boots and the Hat Watch notices the trail.',
      'Joke: the bag says Crumbs and Co. on it, and it is the only shop in the Yard that ever gives you more crumbs than you paid for.',
      'A small hole in the corner has been patched with a scrap of the same paper, and the patch is slightly better than the bag.',
    ],
    parts: [
      { s: 'box', d: [0.16, 0.18, 0.08], at: [0, 0.09, 0], c: 'parchment' },                  // bag
      { s: 'box', d: [0.165, 0.04, 0.085], at: [0, 0.17, 0], c: 'red' },                       // top band
      { s: 'ball', d: [0.012], at: [0.04, 0.2, 0.045], c: 'straw', seg: 5 },                  // crumb
      { s: 'ball', d: [0.01], at: [0.055, 0.19, 0.05], c: 'straw', seg: 5 },                  // crumb
    ],
  },
  {
    id: 'glaze-repair-mallet', name: 'Repair Mallet', category: 'tool', uses: ['hold'],
    tags: ['mallet', 'hammer', 'repair', 'glaze', 'dent', 'fix', 'hand', 'tool', 'reward', 'gta'], emoji: ['🔨'],
    grip: [0, 0.06, 0],
    about: 'Gnome Theft Auto: the Repair Mallet. A short wooden-handled mallet with a glazed blue head. Held in the hand.',
    examine: [
      'A short wooden handle with a blue glazed head at the top, flat on both faces and worn bright where the knocks land.',
      'Saying: every dent has a crack hiding under it, and the mallet is how you find it before the glaze does.',
      'Tip: tap, do not swing. A swing takes the dent out of the car and the door off with it.',
      'Joke: the head is glazed blue, so the mallet matches the forecourt, and nobody can tell which parts are the mallet.',
      'The handle has a notch cut into it for each car it has fixed, and the notches are getting close to the end.',
    ],
    parts: [
      { s: 'cyl', d: [0.012, 0.012, 0.22], at: [0, 0.11, 0], c: 'wood', seg: 6 },              // handle
      { s: 'box', d: [0.12, 0.06, 0.06], at: [0, 0.23, 0], c: 'glaze-blue' },                  // head
      { s: 'box', d: [0.03, 0.04, 0.06], at: [0, 0.2, 0], c: 'iron' },                         // collar
    ],
  },
  {
    id: 'deed-scroll-cord', name: 'Deed Scroll Cord', category: 'document', uses: ['wear-neck'],
    tags: ['deed', 'scroll', 'document', 'paper', 'cord', 'seal', 'wax', 'property', 'loan', 'neck', 'reward', 'gta'], emoji: ['📜'],
    about: 'Gnome Theft Auto: the Deed Scroll Cord. A rolled parchment deed on a leather cord round the neck, with a red wax seal. Plain colours, no tint.',
    examine: [
      'A rolled parchment deed on a leather cord, with a red wax seal pressed into the end and a faded ribbon tied round the middle.',
      'Saying: a house is only yours while the deed is in your pocket, so keep it on the neck where it cannot be lost.',
      'Tip: do not unroll it in the rain. The ink is for the bank, and the bank is not interested in your wet thumbs.',
      'Joke: the wax seal says the property is fully paid, which is a lie, but it is a lie with a very nice shine on it.',
      'Some of the words on the deed are smudged. Nobody can read them, but everyone agrees the smudge is the important part.',
    ],
    parts: [
      { s: 'ring', d: [0.21, 0.01], at: [0, 0.01, -0.05], rot: [90, 0, 0], c: 'leather', seg: 12 }, // neck cord
      { s: 'cyl', d: [0.025, 0.025, 0.1], at: [0, 0.03, 0.17], rot: [0, 0, 90], c: 'parchment', seg: 8 }, // scroll
      { s: 'cyl', d: [0.012, 0.012, 0.008], at: [0.04, 0.03, 0.2], rot: [90, 0, 0], c: 'wax', seg: 8 }, // seal
    ],
  },
];
