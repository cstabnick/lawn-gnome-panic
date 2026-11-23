// Gnome Theft Auto: achievement gear for the wild world and the boats (Wild World Epic 8). Each piece is the reward of
// one achievement in packages/achievements/src/catalog.ts: the Cloverfield Cowbell, the Polar Bear Shades, the
// Beekeeper's Hat and the Captain's Cap.
import type { PrefabDef } from '../types';

export const GTA_WILD_GEAR: readonly PrefabDef[] = [
  {
    id: 'cowbell', wear: { at: [0, -0.07, 0.05] }, name: 'Cloverfield Cowbell', category: 'trinket', uses: ['wear-neck'],
    tags: ['cowbell', 'bell', 'brass', 'collar', 'neck', 'cloverfield', 'reward', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Cloverfield Cowbell. A small brass bell with a visible clapper on a leather collar strap, hanging at the chest.',
    examine: [
      'A small brass bell with a stubby clapper inside, hung from a leather collar strap at the chest.',
      'Cloverfield saying: a bell that rings at every step is a bell that never lets its owner sneak up on anyone.',
      'Tip: tie the strap snug, or the bell will swing round to your back every time you bend down to pick up clover.',
      'Joke: it has never once been used to call the cows home, because the cows have a better bell of their own.',
      'The clapper has been worn bright on one side, which suggests a long career of ringing at very important moments.',
    ],
    parts: [
      { s: 'ring', d: [0.21, 0.012], at: [0, 0.012, -0.05], rot: [90, 0, 0], c: 'leather-dark', seg: 12 }, // collar strap (min.y = 0)
      { s: 'box', d: [0.03, 0.03, 0.02], at: [0, 0.09, 0.09], c: 'leather' },                               // strap tab to the bell
      { s: 'cyl', d: [0.028, 0.05, 0.06], at: [0, 0.05, 0.09], c: 'brass', seg: 10 },                    // bell body (bottom at y = 0.02)
      { s: 'ring', d: [0.028, 0.006], at: [0, 0.088, 0.09], c: 'brass', seg: 8 },                        // bell crown loop
      { s: 'ball', d: [0.012], at: [0, 0.016, 0.09], c: 'iron-dark', seg: 6 },                           // clapper
    ],
  },
  {
    id: 'bear-shades', name: 'Polar Bear Shades', category: 'armor', uses: ['wear-head'],
    tags: ['sunglasses', 'shades', 'bear', 'headband', 'knit', 'head', 'polar', 'reward', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Polar Bear Shades. Oversized round dark lenses on a bridge and arms, worn over a white knitted headband. Lowest point at the ground, like the Loch Moss Tam.',
    examine: [
      'Oversized round sunglasses with two dark lenses, a thin bridge and arms, pinned over a white knitted headband.',
      'Fells saying: a bear in a deck chair needs no sun, only a pair of shades and a very good view of the lake.',
      'Tip: wear them on the headband, not the nose, or the lenses slide down the moment you start to hurry.',
      'Joke: they make you look cool enough to be ignored by every bear on the Fells, which is the whole point.',
      'The arms have a scratch that spells out a single word, and nobody has yet agreed on whether it reads Chill or Chilly.',
    ],
    parts: [
      { s: 'cyl', d: [0.105, 0.105, 0.07], at: [0, 0.035, 0], c: 'wool', seg: 12 },                       // knitted headband (min.y = 0)
      { s: 'cyl', d: [0.045, 0.045, 0.012], rot: [90, 0, 0], at: [-0.055, 0.05, 0.115], c: 'black', seg: 12, mirror: true }, // lenses
      { s: 'box', d: [0.03, 0.012, 0.012], at: [0, 0.058, 0.115], c: 'black' },                           // bridge
      { s: 'box', d: [0.012, 0.012, 0.08], at: [-0.1, 0.05, 0.07], c: 'black', mirror: true },             // arms
    ],
  },
  {
    id: 'beekeeper-hat', name: "Beekeeper's Hat", category: 'armor', uses: ['wear-head'],
    tags: ['beekeeper', 'hat', 'straw', 'brim', 'veil', 'mesh', 'bee', 'head', 'reward', 'gta'], emoji: [],
    about: "Gnome Theft Auto: the Beekeeper's Hat. A wide straw brim and round crown with a dark band, a pale mesh veil hanging from the brim and one tiny bee on top.",
    examine: [
      'A wide straw brim over a round crown with a dark band, and a pale mesh veil hanging from the edge to the shoulders.',
      'Tallgrass saying: keep the veil down and the bees will think you are only a very tall flower with opinions.',
      'Tip: tuck the veil into your collar before you lift a hive lid, because a bee will always find the gap.',
      'Joke: the veil keeps the bees out and the gossip in, which is more than the hat manages for the rest of the village.',
      'One bee rides on the crown and has never once been asked to leave, so it counts itself a member of the household.',
    ],
    parts: [
      { s: 'cyl', d: [0.2, 0.2, 0.012], at: [0, 0.006, 0], c: 'straw', seg: 12 },                         // wide brim (min.y = 0)
      { s: 'cyl', d: [0.09, 0.1, 0.09], at: [0, 0.057, 0], c: 'straw', seg: 12 },                         // round crown
      { s: 'cyl', d: [0.101, 0.101, 0.02], at: [0, 0.03, 0], c: 'black', seg: 12 },                      // dark band
      { s: 'cyl', d: [0.19, 0.19, 0.12], at: [0, 0.062, 0], c: 'cloth', seg: 12, alpha: 0.6 },          // mesh veil (open look)
      { s: 'ball', d: [0.014], scale: [1.3, 1, 1], at: [0.04, 0.116, 0.03], c: 'yellow', seg: 6 },       // bee
    ],
  },
  {
    id: 'captain-cap', name: "Captain's Cap", category: 'armor', uses: ['wear-head'],
    tags: ['captain', 'cap', 'sailor', 'peaked', 'hat', 'boat', 'navy', 'head', 'reward', 'gta'], emoji: [],
    about: "Gnome Theft Auto: the Captain's Cap. A white peaked sailor's cap with a navy band, a black visor and a small gold anchor badge at the front.",
    examine: [
      'A white peaked sailor cap with a navy band, a black visor and a small gold anchor pinned to the front.',
      'Boat saying: a captain who keeps the cap dry will keep the crew dry too, though nobody has ever tested the theory.',
      'Tip: stand with the visor pointed at the horizon, so the sun does not blind you while steering a leaky dinghy.',
      'Joke: the anchor is only gold paint on tin, but it has got the captain out of three arguments with the harbour.',
      'The visor has been signed by every boat it has ever sailed on, and the last signature is smudged with a single cheerful thumbprint.',
    ],
    parts: [
      { s: 'ball', d: [0.13], scale: [1, 0.6, 1], at: [0, 0.09, 0], c: 'white', seg: 12 },                 // white crown (min.y = 0)
      { s: 'cyl', d: [0.132, 0.132, 0.024], at: [0, 0.012, 0], c: 0x1f2f5a, seg: 12 },                     // navy band
      { s: 'box', d: [0.12, 0.008, 0.07], at: [0, 0.024, 0.1], c: 'black' },                              // black visor
      { s: 'box', d: [0.03, 0.04, 0.008], at: [0, 0.075, 0.13], c: 'gold' },                              // gold anchor badge
      { s: 'ring', d: [0.012, 0.004], at: [0, 0.095, 0.134], c: 'gold', seg: 8 },                         // anchor ring
    ],
  },
];
