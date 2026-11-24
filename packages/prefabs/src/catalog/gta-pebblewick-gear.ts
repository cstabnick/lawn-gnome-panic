// Gnome Theft Auto, Pebblewick (docs/roadmaps/gta-outskirts-town.md): the Pebblewick achievement rewards.
import type { PrefabDef } from '../types';

export const GTA_PEBBLEWICK_GEAR: readonly PrefabDef[] = [
  {
    id: 'pebblewick-sunhat', name: 'Pebblewick Sun Hat', category: 'armor', uses: ['wear-head'],
    tags: ['hat', 'straw', 'sun', 'sunhat', 'brim', 'wide', 'pepper', 'head', 'cap', 'reward', 'pebblewick', 'gta'], emoji: [],
    tint: 0xe3c98a,
    about: 'Gnome Theft Auto: the Pebblewick Sun Hat, a wide-brimmed straw hat with a red pepper tucked in the band. Reward for the Pop. 32 achievement. The straw tints.',
    examine: [
      'A wide-brimmed straw hat with a crown that comes to a soft dent on top, and a red pepper pushed into the band like a feather.',
      'Town saying: thirty-two gnomes live in Pebblewick, and every one of them wears a hat, so the brim is the only thing they agree on.',
      'Tip: wear the brim low in the afternoon, because the dunes east of the town throw a glare that has blinded better gnomes than you.',
      'Joke: the pepper is there for the sun, the hat is there for the pepper, and nobody has ever asked the pepper.',
      'Someone has scratched a tally of days into the inside of the band, and the marks run all the way round and start again.',
    ],
    parts: [
      { s: 'cyl', d: [0.2, 0.2, 0.02], at: [0, 0.01, 0], c: 'tint', seg: 12 },
      { s: 'cyl', d: [0.1, 0.11, 0.13], at: [0, 0.075, 0], c: 'tint', seg: 10 },
      { s: 'cyl', d: [0.112, 0.112, 0.03], at: [0, 0.04, 0], c: 'red', seg: 10 },
      { s: 'ball', d: [0.025], scale: [1, 1.6, 1], at: [0.11, 0.05, 0.09], c: 'red', seg: 6 },
      { s: 'cyl', d: [0.006, 0.006, 0.03], at: [0.11, 0.1, 0.09], c: 'leaf', seg: 5 },
    ],
  },
  {
    id: 'dry-spoon-ladle', name: 'Dry Spoon Ladle', category: 'tool', uses: ['hold'],
    tags: ['ladle', 'spoon', 'wooden', 'wood', 'dry', 'scoop', 'bowl', 'kitchen', 'reward', 'pebblewick', 'gta'], emoji: [],
    grip: [0, 0.15, 0],
    about: 'Gnome Theft Auto: the Dry Spoon Ladle, a big wooden ladle, handle at the bottom and bowl up. Reward for the Regular achievement.',
    examine: [
      'A big wooden ladle with a long handle worn pale where hands go, and a bowl that has been scrubbed so often the grain stands up.',
      'Town saying: a spoon that is dry will never spill, and a gnome who asks for the dry spoon will be served with a dry smile.',
      'Tip: hold it by the handle a third of the way up, because the bowl is heavier than it looks and the bowl always wins.',
      'Joke: the bowl has never held soup, only the odd pebble, which the counter-keeper insists is a sort of soup if you squint.',
      'A notch has been cut into the handle for every purchase made with it, and the notches go round the handle twice.',
    ],
    parts: [
      { s: 'cyl', d: [0.018, 0.018, 0.42], at: [0, 0.21, 0], c: 'wood', seg: 6 },
      { s: 'cyl', d: [0.08, 0.06, 0.06], at: [0, 0.45, 0], c: 'wood-light', seg: 8 },
      { s: 'cyl', d: [0.06, 0.05, 0.02], at: [0, 0.48, 0], c: 'wood-dark', seg: 8 },
      { s: 'box', d: [0.03, 0.02, 0.02], at: [0, 0.2, 0.02], c: 'wood-dark' },
    ],
  },
  {
    id: 'drip-line-coil', name: 'Drip Line Coil', category: 'armor', uses: ['wear-back'],
    tags: ['coil', 'tube', 'tubing', 'pipe', 'coupling', 'strap', 'back', 'pack', 'dark', 'reward', 'pebblewick', 'gta'], emoji: [],
    tint: 0x2a2f36,
    about: 'Gnome Theft Auto: the Drip Line Coil, a coil of dark tube on a strap, with two brass couplings. Reward for The Weeping Line achievement. The tube tints.',
    examine: [
      'A coil of dark tube stacked in three loops, with a brass coupling at each end and a leather strap to hang it from the shoulders.',
      'Town saying: what is coiled up in the morning is long again by noon, and the Weeping Line says so with a steady little tick.',
      'Tip: keep the couplings dry and out of the dust, or they go green and the strap gets a smell nobody will mention at dinner.',
      'Joke: it is the heaviest thing a gnome has ever carried for the sake of a few drips, and the drips are not even grateful.',
      'The tube has a row of tiny marks along it, each one a day the Furrow was fixed, and the last mark is wet.',
    ],
    parts: [
      { s: 'ring', d: [0.08, 0.02], at: [0, 0.02, 0], rot: [90, 0, 0], c: 'tint', seg: 8 },
      { s: 'ring', d: [0.08, 0.02], at: [0, 0.06, 0], rot: [90, 0, 0], c: 'tint', seg: 8 },
      { s: 'ring', d: [0.08, 0.02], at: [0, 0.1, 0], rot: [90, 0, 0], c: 'tint', seg: 8 },
      { s: 'cyl', d: [0.022, 0.022, 0.04], at: [-0.1, 0.06, 0], rot: [0, 0, 90], c: 'brass', seg: 6 },
      { s: 'cyl', d: [0.022, 0.022, 0.04], at: [0.1, 0.06, 0], rot: [0, 0, 90], c: 'brass', seg: 6 },
      { s: 'box', d: [0.03, 0.2, 0.01], at: [0, 0.1, 0.05], c: 'leather' },
    ],
  },
  {
    id: 'chrome-hubcap-pendant', name: 'Chrome Hubcap Pendant', category: 'trinket', uses: ['wear-neck'],
    wear: { at: [0, -0.07, 0.05] },
    tags: ['pendant', 'hubcap', 'disc', 'chrome', 'necklace', 'amulet', 'cord', 'neck', 'shiny', 'reward', 'pebblewick', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Chrome Hubcap Pendant, a chrome disc on a cord loop. Reward for The Hum at Three achievement.',
    examine: [
      'A round chrome disc as wide as a thumbnail, polished until it shows the gnome wearing it, a little wobbled and very bright.',
      'Town saying: a disc that hums in the dunes will hum back at a gnome who wears it, and the humming is never quite in tune.',
      'Tip: turn the disc to the wall at night, because it catches the moon and the moon has a way of making you walk toward things.',
      'Joke: the disc has a dent in one side, which the wearer calls character and the town calls a hubcap.',
      'Round the rim someone has scratched tiny spokes, one for each hour the hum was heard, and there are more than there should be.',
    ],
    parts: [
      { s: 'ring', d: [0.1, 0.006], at: [0, 0.19, 0], c: 'steel', seg: 8 },
      { s: 'cyl', d: [0.07, 0.07, 0.02], at: [0, 0.07, 0.02], rot: [90, 0, 0], c: 0xd9dee4, seg: 12 },
      { s: 'cyl', d: [0.03, 0.03, 0.024], at: [0, 0.07, 0.022], rot: [90, 0, 0], c: 'silver', seg: 8 },
    ],
  },
  {
    id: 'chrome-tuning-fork', name: 'Chrome Tuning Fork', category: 'tool', uses: ['hold'],
    tags: ['tuning', 'fork', 'chrome', 'steel', 'tines', 'hum', 'metal', 'rod', 'pebblewick', 'reward', 'gta'], emoji: [],
    grip: [0, 0.08, 0],
    about: 'Gnome Theft Auto: the Chrome Tuning Fork, a chrome fork about 0.45 tall, stem at the bottom. Reward for the Three A.M. Knock achievement.',
    examine: [
      'A chrome fork with a long stem and two tines bent into a neat U, the metal so bright it reflects the gnome holding it.',
      'Town saying: strike the fork on the knee and the Old Chrome Combine will answer, but only once the clock has passed three.',
      'Tip: hold it by the stem and never by the tines, because a tine that is bent will hum at the wrong pitch for the rest of the night.',
      'Joke: the fork is the only instrument in Pebblewick that is always in tune, which is a comfort to nobody who has heard it.',
      'Scratched on the stem is a short line of notes, written by someone who gave up halfway and then, very carefully, tried again.',
    ],
    parts: [
      { s: 'cyl', d: [0.02, 0.02, 0.22], at: [0, 0.11, 0], c: 'steel', seg: 6 },
      { s: 'box', d: [0.1, 0.03, 0.03], at: [0, 0.23, 0], c: 'silver' },
      { s: 'box', d: [0.03, 0.22, 0.03], at: [-0.035, 0.34, 0], c: 'steel' },
      { s: 'box', d: [0.03, 0.22, 0.03], at: [0.035, 0.34, 0], c: 'steel' },
      { s: 'ball', d: [0.02], scale: [1, 0.5, 1], at: [0, 0.01, 0], c: 'silver', seg: 6 },
    ],
  },
];
