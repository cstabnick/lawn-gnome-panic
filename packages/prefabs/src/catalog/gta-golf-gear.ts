// Gnome Theft Auto: Hedgeworth Links (batch 3 E15): wearables: the achievement rewards and the three regulars'
// headgear and held things (Peony, Basil, Thrift).
import type { PrefabDef } from '../types';

export const GTA_GOLF_GEAR: readonly PrefabDef[] = [
  {
    id: 'argyle-tam', name: 'Argyle Tam', category: 'armor', uses: ['wear-head'],
    tags: ['tam', 'tam-o-shanter', 'argyle', 'diamond', 'pompom', 'bonnet', 'hat', 'head', 'reward', 'gta'], emoji: [],
    about: 'Ace, Champ: Basil Divot\'s bright red tam-o\'-shanter with a yellow argyle band, a fat red pompom on top, sitting slightly to one side. Plain colours, no tint.',
    examine: [
      'A bright red tam-o\'-shanter with a yellow argyle band of diamonds round it and a fat red pompom on top, worn a little to one side.',
      'Saying of the Links: a diamond is a fine pattern for a hat, but a gnome should never be the only diamond in the room.',
      'Tip: tip it forward for a sharp look and back for a jaunty one. Tipping it sideways is how the pompom ends up in the soup.',
      'Joke: a red hat on a green lawn is easy to find, which Basil says is the whole point of it, having lost it twice.',
      'Stitched by someone who meant every diamond, though the last row is a little uneven, like a putt.',
    ],
    parts: [
      { s: 'cyl', d: [0.17, 0.15, 0.1], at: [0, 0.05, 0], c: 'red', seg: 10 },                       // tam body (min.y = 0)
      { s: 'cyl', d: [0.173, 0.173, 0.03], at: [0, 0.03, 0], c: 'yellow', seg: 10 },                 // argyle band
      { s: 'box', d: [0.035, 0.035, 0.012], at: [0, 0.03, 0.182], rot: [0, 0, 45], c: 'red' },      // diamond, front
      { s: 'box', d: [0.035, 0.035, 0.012], at: [0, 0.03, -0.182], rot: [0, 0, 45], c: 'red' },     // diamond, back
      { s: 'box', d: [0.012, 0.035, 0.035], at: [0.182, 0.03, 0], rot: [45, 0, 0], c: 'red' },      // diamond, right
      { s: 'box', d: [0.012, 0.035, 0.035], at: [-0.182, 0.03, 0], rot: [45, 0, 0], c: 'red' },     // diamond, left
      { s: 'ball', d: [0.055], at: [0.02, 0.135, 0], c: 'red', seg: 8 },                             // pompom
    ],
  },
  {
    id: 'tweed-flat-cap', name: 'Tweed Flat Cap', category: 'armor', uses: ['wear-head'],
    tags: ['cap', 'flat', 'flatcap', 'tweed', 'plaid', 'check', 'brim', 'hat', 'head', 'gta'], emoji: [],
    about: 'Dame Peony Gravelrake\'s green tweed flat cap: a flat crown, a short stiff brim, a darker check and a tiny brass pin. Plain colours, no tint.',
    examine: [
      'A flat green tweed cap with a fine darker check through it, a short stiff brim at the front and a tiny brass pin on one side.',
      'Saying of the Estate: a good cap is never new, and a good tweed never quite matches the gnome wearing it.',
      'Tip: keep the brim level. A tilted brim tells the whole club you have been practising, and nobody believes it.',
      'Joke: the check is so fine that from a distance the cap seems to be wearing a second, smaller cap.',
      'The brass pin was a gift from someone who asked to be paid for it, and it has been polished every Sunday since.',
    ],
    parts: [
      { s: 'ball', d: [0.16], at: [0, 0.064, 0], scale: [1, 0.4, 1], c: 'green', seg: 10 },        // flat crown (min.y = 0)
      { s: 'box', d: [0.2, 0.012, 0.09], at: [0, 0.006, 0.12], c: 'green' },                        // short brim
      { s: 'box', d: [0.26, 0.006, 0.012], at: [0, 0.131, -0.04], c: 'leaf-dark' },                // check stripe
      { s: 'box', d: [0.26, 0.006, 0.012], at: [0, 0.131, 0.04], c: 'leaf-dark' },                 // check stripe
      { s: 'box', d: [0.012, 0.006, 0.26], at: [-0.05, 0.134, 0], c: 'leaf-dark' },                // check stripe
      { s: 'box', d: [0.012, 0.006, 0.26], at: [0.05, 0.134, 0], c: 'leaf-dark' },                 // check stripe
      { s: 'box', d: [0.03, 0.02, 0.01], at: [-0.09, 0.09, 0.1], c: 'brass' },                     // brass pin
    ],
  },
  {
    id: 'hosepipe-cap', name: 'Hosepipe Cap', category: 'armor', uses: ['wear-head'],
    tags: ['cap', 'hat', 'battered', 'brown', 'tubing', 'coil', 'band', 'grass', 'groundskeeper', 'head', 'reward', 'gta'], emoji: [],
    about: 'The Groundskeeper\'s Secret: Thrift Hosepipe\'s battered brown cap, the brim sagging, a band of coiled green tubing and a brass nozzle, a blade of grass tucked in. Plain colours, no tint.',
    examine: [
      'A battered brown cap with the brim sagging, a band of coiled green tubing round it and a brass nozzle sticking out at one side.',
      'Saying of the Shed: a cap that has been rained on for forty years has earned the right to droop.',
      'Tip: the tubing keeps the cap on in a gust. Do not try running water through it, whatever the nozzle seems to suggest.',
      'Joke: the blade of grass tucked in the band is the only thing on the ninth green that Thrift has ever managed to keep.',
      'Mended with string and optimism. The brim is stiff with old mud, and the mud is the newest part of it.',
    ],
    parts: [
      { s: 'ball', d: [0.15], at: [0, 0.105, 0], scale: [1, 0.7, 1], c: 'dirt', seg: 10 },          // crown (min.y = 0)
      { s: 'box', d: [0.22, 0.012, 0.12], at: [0, 0.03, 0.1], rot: [8, 0, 0], c: 'dirt' },          // sagging brim
      { s: 'ring', d: [0.152, 0.018], at: [0, 0.05, 0], rot: [90, 0, 0], c: 'green', seg: 10 },     // coiled tubing
      { s: 'cyl', d: [0.02, 0.024, 0.06], at: [0.165, 0.05, 0], rot: [0, 0, 90], c: 'brass', seg: 8 }, // nozzle
      { s: 'box', d: [0.006, 0.1, 0.02], at: [-0.1, 0.14, 0.11], rot: [0, 0, -20], c: 'grass' },    // grass blade
    ],
  },
  {
    id: 'driver-cane', name: 'Driver Cane', category: 'tool', uses: ['hold'],
    tags: ['cane', 'driver', 'club', 'golf', 'stick', 'walking', 'shaft', 'crook', 'persimmon', 'hold', 'reward', 'gta'], emoji: [],
    grip: [0, 0.79, 0],
    about: 'Birdie, Birdie: Dame Peony\'s golf driver used as a walking cane, a persimmon head at the foot, a brass sole plate and a leather grip with a crook. Held upright.',
    examine: [
      'A long steel shaft with a persimmon head at the foot, a brass plate under the head and a leather grip with a crook at the top.',
      'Saying of the Links: a driver is for going a long way, and a cane is for coming back from it.',
      'Tip: lean on the crook, not the grip. The grip is for hitting things, and Dame Peony is particular about that.',
      'Joke: the head has never hit a ball in living memory, but it has wonderfully good manners on a doorstep.',
      'The shaft is so straight that Dame Peony insists it was made for lining up putts. It was made for lining up gnomes.',
    ],
    parts: [
      { s: 'box', d: [0.07, 0.05, 0.2], at: [0, 0.03, 0.02], c: 'wood-dark' },                    // persimmon head
      { s: 'box', d: [0.072, 0.006, 0.21], at: [0, 0.003, 0.02], c: 'brass' },                     // sole plate
      { s: 'cyl', d: [0.014, 0.014, 0.8], at: [0, 0.45, 0], c: 'steel', seg: 6 },                  // shaft
      { s: 'cyl', d: [0.022, 0.022, 0.14], at: [0, 0.79, 0], c: 'leather', seg: 8 },               // grip
      { s: 'ring', d: [0.06, 0.012, 180], at: [0, 0.86, 0], c: 'leather', seg: 8 },                // crook
    ],
  },
  {
    id: 'golf-club', name: 'Golf Club', category: 'tool', uses: ['hold'],
    tags: ['club', 'iron', 'golf', 'shaft', 'blade', 'grip', 'steel', 'hold', 'gta'], emoji: [],
    grip: [0, 0.8, 0],
    about: 'Basil Divot\'s steel iron: a shiny blade at the foot of a long shaft and a black grip. Held upright, about 0.9 long.',
    examine: [
      'A steel iron with a shiny blade at the foot of a long shaft and a black grip at the top, short in the head and long in the temper.',
      'Old saying: the iron is for the short shot that counts, and the driver is for the one that gets everyone looking.',
      'Tip: keep the blade flat to the ground. A blade on its edge is not a golf club, it is a small and bad-tempered fence post.',
      'Joke: Basil carries it under his arm for the look of the thing, and says it is for the shot he never needs.',
      'The blade has a chip from a shot that went into the pond on the Long Week and came out again, eventually.',
    ],
    parts: [
      { s: 'box', d: [0.035, 0.05, 0.12], at: [0, 0.025, 0.03], c: 'steel' },                     // blade head (min.y = 0)
      { s: 'cyl', d: [0.008, 0.008, 0.05], at: [0, 0.07, 0], c: 'steel', seg: 6 },                  // hosel
      { s: 'cyl', d: [0.009, 0.009, 0.7], at: [0, 0.44, 0], c: 'steel', seg: 6 },                  // shaft
      { s: 'cyl', d: [0.017, 0.017, 0.16], at: [0, 0.79, 0], c: 'black', seg: 8 },                 // grip
    ],
  },
  {
    id: 'kicked-board-plank', name: 'Kicked Board Plank', category: 'armor', uses: ['wear-back'],
    tags: ['board', 'plank', 'fence', 'strap', 'rope', 'nail', 'wood', 'back', 'reward', 'gta'], emoji: [],
    about: 'The Kicked Board: one weathered fence board worn across the back on rope straps, a bent nail in it and a boot-print scuff. About 0.9 long.',
    examine: [
      'A weathered fence board about a gnome long, worn across the back on rope straps, with a bent nail still in it.',
      'Saying of the Fence: a board that has been kicked once is a door, and a board that has been kicked twice is a story.',
      'Tip: keep the bent nail facing out. The nail was there before the board, and it resents being turned round.',
      'Joke: the boot-print on it belongs to someone who never once looked back, which is the only reason the board is still there.',
      'Pried loose in a hurry and carried off across the lawn, with the scuff left behind as the only proof of the crime.',
    ],
    parts: [
      { s: 'box', d: [0.9, 0.2, 0.025], at: [0, 0.1, 0], c: 'wood' },                            // board (min.y = 0)
      { s: 'cyl', d: [0.004, 0.004, 0.035], at: [0.12, 0.1, 0.03], rot: [90, 0, 0], c: 'iron', seg: 6 }, // bent nail
      { s: 'ball', d: [0.05], at: [-0.2, 0.1, 0.0135], scale: [1, 1.6, 0.12], c: 'dirt' },          // boot-print scuff
      { s: 'cyl', d: [0.008, 0.008, 0.2], at: [-0.3, 0.1, 0.02], c: 'burlap', seg: 6 },              // rope strap
      { s: 'cyl', d: [0.008, 0.008, 0.2], at: [0.3, 0.1, 0.02], c: 'burlap', seg: 6 },               // rope strap
    ],
  },
  {
    id: 'scorecard-lanyard', name: 'Scorecard Lanyard', category: 'armor', uses: ['wear-neck'],
    wear: { at: [0, -0.12, 0] },
    tags: ['lanyard', 'card', 'scorecard', 'pencil', 'sleeve', 'ring', 'neck', 'reward', 'gta'], emoji: [],
    about: 'Card in Hand: a white lanyard ring with red beads, a little scorecard in a clear sleeve and a stubby pencil hanging from it. Plain colours, no tint.',
    examine: [
      'A striped lanyard ring round the neck with a little scorecard in a clear sleeve and a stubby pencil hanging from it.',
      'Saying of the Links: a card kept dry is a card that can be trusted, and nobody on the course trusts a wet card.',
      'Tip: write each hole down as you walk off the green. Remembering it all in the clubhouse is how a par turns into a bogey.',
      'Joke: the card has nine holes printed and four played. The other five are, Basil says, still being measured.',
      'The pencil has been sharpened to a point so fine it has written down three hundred and six strokes that were never taken.',
    ],
    parts: [
      { s: 'ring', d: [0.15, 0.012], at: [0, 0.012, 0], rot: [90, 0, 0], c: 'white', seg: 10 },    // lanyard ring (min.y = 0)
      { s: 'ball', d: [0.016], at: [0.15, 0.012, 0], c: 'red', seg: 6 },                          // bead
      { s: 'ball', d: [0.016], at: [-0.15, 0.012, 0], c: 'red', seg: 6 },                        // bead
      { s: 'ball', d: [0.016], at: [0, 0.012, -0.15], c: 'red', seg: 6 },                        // bead
      { s: 'box', d: [0.08, 0.11, 0.006], at: [0, 0.055, 0.166], c: 'paper' },                    // scorecard
      { s: 'box', d: [0.09, 0.12, 0.012], at: [0, 0.06, 0.176], c: 'glass' },                     // clear sleeve
      { s: 'cyl', d: [0.005, 0.005, 0.07], at: [0.058, 0.04, 0.17], c: 'yellow', seg: 6 },        // pencil
    ],
  },
  {
    id: 'golf-bag-pack', name: 'Golf Bag Pack', category: 'armor', uses: ['wear-back'],
    tags: ['bag', 'golf', 'tartan', 'clubs', 'pack', 'back', 'green', 'red', 'reward', 'gta'], emoji: [],
    about: 'Through the Hedge: a small green tartan golf bag worn on the back with red bands and three club shafts poking up, each with a knitted head cover. Plain colours, no tint.',
    examine: [
      'A small tartan golf bag worn on the back, green with red bands, and three club shafts poking up over the shoulder, each with a knitted cover.',
      'Saying of the Links: a gnome who carries his own clubs will never be short of a club, only of someone to carry them.',
      'Tip: keep the heavy club at the bottom. Put it on top and the bag goes over at the first hill, and the gnome goes with it.',
      'Joke: the knitted covers are for keeping the club heads warm. Nobody has ever asked the club heads whether they wanted to be warm.',
      'Grass seed from every fairway is stuck in the tartan, and nobody has ever managed to shake all of it out.',
    ],
    parts: [
      { s: 'cyl', d: [0.075, 0.085, 0.3], at: [0, 0.15, 0], c: 'green', seg: 10 },                   // bag (min.y = 0)
      { s: 'cyl', d: [0.079, 0.09, 0.03], at: [0, 0.1, 0], c: 'red', seg: 10 },                       // tartan band
      { s: 'cyl', d: [0.079, 0.09, 0.03], at: [0, 0.2, 0], c: 'red', seg: 10 },                      // tartan band
      { s: 'cyl', d: [0.008, 0.008, 0.3], at: [-0.03, 0.4, 0], c: 'steel', seg: 6 },                 // club shaft
      { s: 'cyl', d: [0.008, 0.008, 0.3], at: [0, 0.42, 0], c: 'steel', seg: 6 },                    // club shaft
      { s: 'cyl', d: [0.008, 0.008, 0.3], at: [0.03, 0.38, 0], c: 'steel', seg: 6 },                 // club shaft
      { s: 'ball', d: [0.022], at: [-0.03, 0.54, 0], scale: [1, 1.5, 1], c: 'red', seg: 6 },         // knitted cover
      { s: 'ball', d: [0.022], at: [0, 0.56, 0], scale: [1, 1.5, 1], c: 'yellow', seg: 6 },          // knitted cover
      { s: 'ball', d: [0.022], at: [0.03, 0.52, 0], scale: [1, 1.5, 1], c: 'blue', seg: 6 },         // knitted cover
    ],
  },
];
