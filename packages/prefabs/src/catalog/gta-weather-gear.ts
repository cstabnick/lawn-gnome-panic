// Gnome Theft Auto weather achievement cosmetics (E06): the umbrella hat ("Caught in the Rain") and the frost-glaze
// muffler ("Glazed Over"). Each is the reward of one achievement in packages/achievements/src/catalog.ts.
import type { PrefabDef } from '../types';

export const GTA_WEATHER_GEAR: readonly PrefabDef[] = [
  {
    id: 'umbrella-hat', name: 'Umbrella Hat', category: 'armor', uses: ['wear-head'],
    tags: ['umbrella', 'hat', 'headband', 'stripes', 'rain', 'head', 'reward', 'gta'], emoji: [],
    about: 'Caught in the Rain: the Umbrella Hat, a small striped garden umbrella on a headband, red and white tiers under a thin pole with a ball finial. Plain colours, no tint.',
    examine: [
      'A small garden umbrella on a headband, its canopy stacked in red and white stripes that shed rain in neat little rings.',
      'Saying: the umbrella is for keeping the rain off, and the hat is for keeping the umbrella on. Only one of those ever works.',
      'Tip: open it indoors and the Tall Ones will tell you off. Wear it outdoors and the Tall Ones will want one too.',
      'Joke: a gnome who has stood in the rain for two whole minutes will swear the umbrella never got wet. It did, and so did the gnome.',
      'The pole is cut from a real garden cane and the finial from a sprinkler head, which is why it hisses faintly when it drips.',
    ],
    parts: [
      { s: 'ring', d: [0.16, 0.015], at: [0, 0.015, 0], rot: [90, 0, 0], c: 'leather', seg: 12 },   // headband (min.y = 0)
      { s: 'cyl', d: [0.16, 0.2, 0.05], at: [0, 0.055, 0], c: 'red', seg: 8 },                     // canopy tier 1
      { s: 'cyl', d: [0.12, 0.16, 0.05], at: [0, 0.105, 0], c: 'white', seg: 8 },                  // canopy tier 2
      { s: 'cyl', d: [0.07, 0.12, 0.05], at: [0, 0.155, 0], c: 'red', seg: 8 },                    // canopy tier 3
      { s: 'cyl', d: [0.03, 0.07, 0.05], at: [0, 0.205, 0], c: 'white', seg: 8 },                  // canopy tier 4
      { s: 'cyl', d: [0.008, 0.008, 0.07], at: [0, 0.2, 0], c: 'wood-light', seg: 6 },             // pole
      { s: 'ball', d: [0.025], at: [0, 0.25, 0], c: 'brass', seg: 6 },                              // finial
    ],
  },
  {
    id: 'frost-glaze-muffler', name: 'Frost-Glaze Muffler', category: 'armor', uses: ['wear-neck'],
    tags: ['muffler', 'scarf', 'frost', 'glaze', 'knit', 'icy', 'neck', 'reward', 'gta'], emoji: [],
    about: 'Glazed Over: the Frost-Glaze Muffler, a pale icy-blue knitted muffler with two glossy white glaze drips down the front. Plain colours, no tint.',
    examine: [
      'A pale icy-blue knitted muffler, wound twice round the neck, with two glossy white glaze drips running down the front.',
      'Fells saying: the snow is not in the muffler. The muffler is in the snow, and it is only a matter of time before it notices.',
      'Tip: the drips are not hot, not cold, and not for licking. Locals have tried all three and disagree about which one was worst.',
      'Joke: a gnome that stood in the snow for a full minute came out wearing a muffler that had been there the whole time.',
      'Knitted from wool that was fired in a kiln and then left out on the fells, which is why it stays stiff until somebody sneezes.',
    ],
    parts: [
      { s: 'ring', d: [0.2, 0.05], at: [0, 0.05, 0], rot: [90, 0, 0], c: 0xbfe6ef, seg: 12 },        // wound ring (min.y = 0)
      { s: 'box', d: [0.1, 0.22, 0.08], at: [0.03, 0.11, 0.21], rot: [-10, 0, 0], c: 0xbfe6ef },     // hanging end down the chest
      { s: 'cone', d: [0.018, 0.06], at: [-0.06, 0.03, 0.24], rot: [180, 0, 0], c: 'white', seg: 6 }, // glaze drip
      { s: 'cone', d: [0.018, 0.08], at: [0.09, 0.02, 0.27], rot: [180, 0, 0], c: 'white', seg: 6 },  // glaze drip
    ],
  },
];
