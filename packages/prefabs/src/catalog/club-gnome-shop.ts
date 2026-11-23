// Club Gnome: the Gnomecino Prize Counter cosmetics, bought with chips (card, gambling, Gnomecino and too-much-money gear).
import type { PrefabDef } from '../types';

export const CLUB_GNOME_SHOP: PrefabDef[] = [
  {
    id: 'high-roller-top-hat', name: 'High Roller Top Hat', category: 'armor', uses: ['wear-head'],
    tags: ['top','hat','high','roller','gold','card','casino','head','reward','topper','ace','gnomecino','money','rich'], emoji: [],
    about: 'A tall black top hat with a gold band and an ace tucked in the band. Tint is unused; the hat is black, the band gold, the card white with a red mark.',
    examine: [
      'A tall black top hat with a gold band, and a playing card tucked in the band with its red mark showing.',
      'Gnome saying: the higher the hat, the less the Gnomecino staff can see your shoes, and nobody checks shoes.',
      'Tip: the card is for show. Tuck an ace in the band and the Pub will assume you know what you are doing.',
      'Joke: it is so tall the rain has to queue up to reach the brim, and most of it gives up halfway.',
      'The hat was won in a card game at the Pub. The winner has not been seen since, but the hat is very much still here.',
    ],
    parts: [
      { s: 'cyl', d: [0.17, 0.17, 0.02], at: [0, 0.01, 0], c: 'black', seg: 12 },            // brim
      { s: 'cyl', d: [0.1, 0.1, 0.22], at: [0, 0.13, 0], c: 'black', seg: 12 },              // crown (0.02 to 0.24)
      { s: 'cyl', d: [0.102, 0.102, 0.04], at: [0, 0.05, 0], c: 'gold', seg: 12 },          // gold band
      { s: 'box', d: [0.05, 0.08, 0.004], at: [0, 0.1, 0.104], c: 'white' },                // card tucked upright
      { s: 'box', d: [0.02, 0.02, 0.002], at: [0, 0.11, 0.107], c: 'red' },                 // red mark on the card
    ],
  },
  {
    id: 'cherry-jackpot-crown', name: 'Triple Cherry Crown', category: 'armor', uses: ['wear-head'],
    tags: ['crown','cherry','cherries','jackpot','slots','gold','casino','head','reward','fruit','triple','gnomecino','win','prize'], emoji: [],
    about: 'A gold crown with five points, three of them topped with a pair of red cherries on green stems: the slot jackpot. Tint is unused; gold band, red cherries, green stems.',
    examine: [
      'A gold band crown with five points, three of them wearing a pair of red cherries on little green stems.',
      'Slot lore: two cherries pay a little, three cherries pay a lot, and the Gnomecino has never once paid three.',
      'Tip: wear it at the slot machine and the reels will look at you, which is not the same as them paying out.',
      'Joke: the cherries are glass, the crown is brass, and the fruit salad is mostly the gnome who wore it last.',
      'The ruby glass in the band is a marble from the Yard. It still rolls off the table when the Gnomecino jackpot rings.',
    ],
    parts: [
      { s: 'cyl', d: [0.1, 0.1, 0.05], at: [0, 0.025, 0], c: 'gold', seg: 10 },              // band
      { s: 'cone', d: [0.022, 0.07], at: [0, 0.085, 0.088], c: 'gold', seg: 6 },              // front point (cherries)
      { s: 'cone', d: [0.022, 0.07], at: [0.083, 0.085, 0.027], c: 'gold', seg: 6 },          // side point (cherries)
      { s: 'cone', d: [0.022, 0.07], at: [-0.083, 0.085, 0.027], c: 'gold', seg: 6 },         // side point (cherries)
      { s: 'cone', d: [0.022, 0.07], at: [0.0517, 0.085, -0.0712], c: 'gold', seg: 6 },       // bare point
      { s: 'cone', d: [0.022, 0.07], at: [-0.0517, 0.085, -0.0712], c: 'gold', seg: 6 },      // bare point
      { s: 'cyl', d: [0.004, 0.004, 0.035], at: [0, 0.14, 0.088], c: 'green', seg: 5 },       // stem
      { s: 'cyl', d: [0.004, 0.004, 0.035], at: [0.083, 0.14, 0.027], c: 'green', seg: 5 },   // stem
      { s: 'cyl', d: [0.004, 0.004, 0.035], at: [-0.083, 0.14, 0.027], c: 'green', seg: 5 },  // stem
      { s: 'ball', d: [0.02], at: [-0.017, 0.125, 0.088], c: 'red', seg: 8 },                // cherry
      { s: 'ball', d: [0.02], at: [0.017, 0.125, 0.088], c: 'red', seg: 8 },                 // cherry
      { s: 'ball', d: [0.02], at: [0.066, 0.125, 0.027], c: 'red', seg: 8 },                 // cherry
      { s: 'ball', d: [0.02], at: [0.1, 0.125, 0.027], c: 'red', seg: 8 },                   // cherry
      { s: 'ball', d: [0.014], at: [0, 0.025, 0.102], c: 'ruby', glow: true, seg: 6 },        // ruby glow gem
    ],
  },
  {
    id: 'card-fan', name: 'Fan of Aces', category: 'trinket', uses: ['hold'],
    tags: ['card','cards','ace','aces','fan','casino','hand','reward','deck','hold','poker','gnomecino','bluff'], emoji: [],
    about: 'Five playing cards fanned out from a short handle, white with red and black pips. Held by the grip at the handle.',
    examine: [
      'Five playing cards fanned out from a short leather handle, white faces with red and black pips on every one.',
      'Gnome saying: a fan of cards is a hand of five, and a hand of five is a bluff with good posture.',
      'Tip: keep the fan close to your chest. The dealer can see the pips, but the pips never see the dealer.',
      'Joke: the only ace in the fan is the one you are holding, and that is the one you should be worried about.',
      'Shuffled at the Pub under the watch of a gnome who has never once looked up from his own cards.',
    ],
    grip: [0, 0.03, 0],
    parts: [
      { s: 'cyl', d: [0.012, 0.012, 0.06], at: [0, 0.03, 0], c: 'leather', seg: 6 },            // handle (0 to 0.06)
      // Each card pivots about the handle top (y 0.03): centre = pivot + 0.05 along its own up vector (sin a, cos a).
      { s: 'box', d: [0.07, 0.1, 0.004], at: [-0.0321, 0.0683, -0.008], rot: [0, 0, 40], c: 'white' },  // card -40 deg
      { s: 'box', d: [0.07, 0.1, 0.004], at: [-0.0171, 0.077, -0.004], rot: [0, 0, 20], c: 'white' },  // card -20 deg
      { s: 'box', d: [0.07, 0.1, 0.004], at: [0, 0.08, 0], c: 'white' },                                // card centre
      { s: 'box', d: [0.07, 0.1, 0.004], at: [0.0171, 0.077, 0.004], rot: [0, 0, -20], c: 'white' },   // card +20 deg
      { s: 'box', d: [0.07, 0.1, 0.004], at: [0.0321, 0.0683, 0.008], rot: [0, 0, -40], c: 'white' },  // card +40 deg
      // Pips sit 0.02 further up each card (z 0.003 in front of the card face).
      { s: 'box', d: [0.02, 0.025, 0.002], at: [-0.045, 0.0836, -0.005], rot: [0, 0, 40], c: 'red' },   // pip
      { s: 'box', d: [0.02, 0.025, 0.002], at: [-0.0239, 0.0958, -0.001], rot: [0, 0, 20], c: 'black' }, // pip
      { s: 'box', d: [0.02, 0.025, 0.002], at: [0, 0.1, 0.003], c: 'red' },                              // pip
      { s: 'box', d: [0.02, 0.025, 0.002], at: [0.0239, 0.0958, 0.007], rot: [0, 0, -20], c: 'black' },  // pip
      { s: 'box', d: [0.02, 0.025, 0.002], at: [0.045, 0.0836, 0.011], rot: [0, 0, -40], c: 'red' },     // pip
    ],
  },
  {
    id: 'chip-stack-tower', name: 'Fistful of Chips', category: 'trinket', uses: ['hold'],
    tags: ['chip','chips','stack','tower','casino','money','hand','reward','fistful','gnomecino','stake','gold','coins'], emoji: [],
    about: 'A tall wobbling stack of eight Gnomecino chips, alternating red, white, black and gold, held by the grip at the bottom chip.',
    examine: [
      'Eight Gnomecino chips in a wobbling stack, red and white and black and gold, each one a little off true.',
      'Gnome saying: a stack that does not fall over is a stack that is not yet worth stealing.',
      'Tip: hold it by the bottom chip and walk slowly. Speed is for the Greenhouse Strip, not the card room.',
      'Joke: the gold chip at the top is the one everyone looks at, and the red one at the bottom is the one that paid for it.',
      'Each chip is worth a little acorn, so the whole tower is worth a sack, and the Pub has the sack to prove it.',
    ],
    grip: [0, 0.006, 0],
    parts: [
      { s: 'cyl', d: [0.035, 0.035, 0.012], at: [0, 0.006, 0], c: 'red', seg: 12 },
      { s: 'cyl', d: [0.035, 0.035, 0.012], at: [0.004, 0.018, 0], c: 'white', seg: 12 },
      { s: 'cyl', d: [0.035, 0.035, 0.012], at: [-0.003, 0.03, 0.002], c: 'black', seg: 12 },
      { s: 'cyl', d: [0.035, 0.035, 0.012], at: [0.005, 0.042, -0.001], c: 'gold', seg: 12 },
      { s: 'cyl', d: [0.035, 0.035, 0.012], at: [-0.004, 0.054, 0.002], c: 'red', seg: 12 },
      { s: 'cyl', d: [0.035, 0.035, 0.012], at: [0.003, 0.066, -0.002], c: 'white', seg: 12 },
      { s: 'cyl', d: [0.035, 0.035, 0.012], at: [-0.005, 0.078, 0.001], c: 'black', seg: 12 },
      { s: 'cyl', d: [0.035, 0.035, 0.012], at: [0.002, 0.09, 0], c: 'gold', seg: 12 },
    ],
  },
  {
    id: 'jackpot-chip-medallion', name: 'Jackpot Chip Medallion', category: 'trinket', uses: ['wear-neck'],
    tags: ['chip','medallion','chain','gold','jackpot','casino','neck','reward','pendant','gnomecino','big','necklace'], emoji: [],
    about: 'A thin gold chain collar with a huge gold casino chip hung at the front of the chest, ringed in red. Clear of the head and face (gear clearance).',
    examine: [
      'A huge gold casino chip on a thin gold chain, with a red ring round the edge that catches the neon.',
      'Saying from the Gnomecino: the bigger the chip, the louder the room goes quiet when you walk past.',
      'Tip: let it swing when you lean over the table. Tells are for amateurs, and the chip is a tell for everyone else.',
      'Joke: it weighs more than the gnome wearing it, which is why the Pub calls the wearer the house.',
      'Its back is stamped with a crown that nobody in the Yard can read, so everyone agrees it must say jackpot.',
    ],
    parts: [
      { s: 'ring', d: [0.21, 0.01], at: [0, 0.01, -0.05], rot: [90, 0, 0], c: 'gold', seg: 12 },   // gold collar chain (min.y = 0)
      { s: 'ball', d: [0.008], at: [0.095, 0.02, 0.135], c: 'gold', seg: 6, mirror: true },       // chain links
      { s: 'ball', d: [0.008], at: [0.075, 0.03, 0.14], c: 'gold', seg: 6, mirror: true },
      { s: 'ball', d: [0.008], at: [0.05, 0.055, 0.15], c: 'gold', seg: 6, mirror: true },
      { s: 'cyl', d: [0.05, 0.05, 0.01], at: [0, 0.05, 0.165], rot: [90, 0, 0], c: 'gold', seg: 12 }, // the chip
      { s: 'ring', d: [0.04, 0.006], at: [0, 0.05, 0.172], rot: [0, 0, 0], c: 'red', seg: 12 }, // red rim ring
    ],
  },
  {
    id: 'overflowing-acorn-sack', name: 'Overflowing Acorn Sack', category: 'armor', uses: ['wear-back'],
    tags: ['sack','bag','money','acorn','acorns','gold','rich','back','reward','burlap','heap','golden','jackpot','pile'], emoji: [],
    about: 'A burlap money sack with a tied neck, heaped with golden acorns, one spilling down the side. About 0.35 tall.',
    examine: [
      'A burlap sack tied at the neck and stuffed so full of golden acorns that the top has given up on being round.',
      'Gnome law: a sack on the ground belongs to whoever is still standing, and a sack this big has a lot of standing to do.',
      'Tip: pull the string tight before you walk anywhere. The acorns will fall out either way, so you may as well choose the moment.',
      'Joke: the acorn that spilled down the side has been trying to get back to the sack for three days and is not winning.',
      'Acorns are money in the Yard, and a sack like this is the reason the Pub never closes and the bar tab never gets paid.',
    ],
    parts: [
      { s: 'ball', d: [0.13], at: [0, 0.143, 0], scale: [1, 1.1, 0.9], c: 'burlap', seg: 8 },  // sack body (min.y = 0)
      { s: 'cyl', d: [0.035, 0.045, 0.05], at: [0, 0.31, 0], c: 'burlap', seg: 8 },             // tied neck
      { s: 'ring', d: [0.042, 0.008], at: [0, 0.3, 0], rot: [90, 0, 0], c: 'leather', seg: 8 }, // string tie
      { s: 'ball', d: [0.025], at: [-0.06, 0.25, 0.05], scale: [1, 1.2, 1], c: 'gold', seg: 6 }, // heaped acorn
      { s: 'cyl', d: [0.026, 0.02, 0.012], at: [-0.06, 0.276, 0.05], c: 'bark', seg: 6 },        // acorn cap
      { s: 'ball', d: [0.025], at: [0.06, 0.25, 0.05], scale: [1, 1.2, 1], c: 'gold', seg: 6 },  // heaped acorn
      { s: 'cyl', d: [0.026, 0.02, 0.012], at: [0.06, 0.276, 0.05], c: 'bark', seg: 6 },
      { s: 'ball', d: [0.025], at: [0, 0.265, 0.07], scale: [1, 1.2, 1], c: 'gold', seg: 6 },   // heaped acorn
      { s: 'cyl', d: [0.026, 0.02, 0.012], at: [0, 0.291, 0.07], c: 'bark', seg: 6 },
      { s: 'ball', d: [0.025], at: [-0.03, 0.27, -0.05], scale: [1, 1.2, 1], c: 'gold', seg: 6 }, // heaped acorn
      { s: 'cyl', d: [0.026, 0.02, 0.012], at: [-0.03, 0.296, -0.05], c: 'bark', seg: 6 },
      { s: 'ball', d: [0.025], at: [0.05, 0.26, -0.04], scale: [1, 1.2, 1], c: 'gold', seg: 6 }, // heaped acorn
      { s: 'cyl', d: [0.026, 0.02, 0.012], at: [0.05, 0.286, -0.04], c: 'bark', seg: 6 },
      { s: 'ball', d: [0.025], at: [0.135, 0.12, 0.05], scale: [1, 1.2, 1], c: 'gold', seg: 6 }, // spilling acorn
      { s: 'cyl', d: [0.026, 0.02, 0.012], at: [0.135, 0.146, 0.05], c: 'bark', seg: 6 },
    ],
  },
];
