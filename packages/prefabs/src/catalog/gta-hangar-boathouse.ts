// Gnome Theft Auto: the buyable garages (Hangar Two, Mossbank Boathouse) and their achievement gear.
import type { PrefabDef } from '../types';

export const GTA_HANGAR_BOATHOUSE: readonly PrefabDef[] = [
  {
    id: 'hangar-two', name: 'Hangar Two', category: 'prop', uses: ['place'],
    tags: ['hangar', 'garage', 'aircraft', 'plane', 'airfield', 'tin', 'shelter', 'corrugated', 'roller', 'door', 'two'], emoji: [],
    footprint: { r: 12, h: 9 },
    about: 'Gnome Theft Auto: Hangar Two. An aircraft shed 24 wide, 14 deep and 9 tall, with a stepped corrugated roof, a big painted 2 on the back wall and a roller door rolled up along the top of its open +z front.',
    examine: [
      'A long shed of corrugated tin with the front wide open, so the aircraft can drive straight in and out again.',
      'Saying: the second hangar is the one that is always full, and the first hangar is the one that wonders why.',
      'Tip: the roller door is rolled up for a reason. Lower it once a plane is inside and the wind stays on the other side.',
      'Joke: the big painted 2 on the back wall was meant to say Hangar Two, but it has been read as Hangar Too, Hangar Tu and Hangar Tou.',
      'Someone has chalked a row of tail numbers beside the 2. Nobody remembers which aircraft they belong to, and the aircraft are not telling.',
    ],
    parts: [
      { s: 'box', d: [24, 7.5, 0.4], at: [0, 3.75, -6.8], c: 'iron' },                              // back wall
      { s: 'box', d: [0.4, 7.5, 14], at: [-11.8, 3.75, 0], c: 'iron' },                              // side wall
      { s: 'box', d: [0.4, 7.5, 14], at: [11.8, 3.75, 0], c: 'iron' },                              // side wall
      { s: 'box', d: [24.4, 0.5, 14.4], at: [0, 7.75, 0], c: 'slate' },                             // roof, step 1
      { s: 'box', d: [18.4, 0.7, 14.4], at: [0, 8.35, 0], c: 'iron-dark' },                         // roof, step 2
      { s: 'box', d: [10.4, 0.3, 14.4], at: [0, 8.85, 0], c: 'slate' },                             // roof, step 3
      { s: 'box', d: [2.2, 7.5, 0.4], at: [-10.9, 3.75, 6.8], c: 'iron', mirror: true },            // front pillars
      { s: 'box', d: [19.6, 1.2, 0.4], at: [0, 6.9, 6.8], c: 'iron' },                              // front lintel
      { s: 'cyl', d: [0.35, 0.35, 19.4], rot: [0, 0, 90], at: [0, 6.0, 6.5], c: 'iron-dark', seg: 10 }, // rolled-up roller door
      { s: 'box', d: [1.6, 0.35, 0.05], at: [0, 5.2, -6.525], c: 'yellow' },                        // painted 2, top bar
      { s: 'box', d: [1.6, 0.35, 0.05], at: [0, 3.75, -6.525], c: 'yellow' },                       // painted 2, middle bar
      { s: 'box', d: [1.6, 0.35, 0.05], at: [0, 2.3, -6.525], c: 'yellow' },                        // painted 2, bottom bar
      { s: 'box', d: [0.35, 1.4, 0.05], at: [-0.625, 4.5, -6.525], c: 'yellow' },                   // painted 2, upper stroke (on the right seen from inside, facing -z)
      { s: 'box', d: [0.35, 1.4, 0.05], at: [0.625, 3.0, -6.525], c: 'yellow' },                    // painted 2, lower stroke
    ],
  },
  {
    id: 'boathouse', name: 'Mossbank Boathouse', category: 'prop', uses: ['place'],
    tags: ['boathouse', 'boat', 'house', 'slip', 'dock', 'wood', 'roof', 'water', 'loch', 'mossbank', 'garage', 'lifering'], emoji: [],
    footprint: { r: 8, h: 7 },
    about: 'Gnome Theft Auto: the Mossbank Boathouse. A wooden boathouse 10 wide and 16 deep on Loch Moss, open on +z to the water, with a pitched roof, walkways on stilts, a rolled-up front door and a name board over the slip.',
    examine: [
      'A wooden boathouse with a pitched roof, standing on stilts over the loch with its front wide open to the water.',
      'Boathouse saying: a boat that is kept dry is a boat that is always ready, and a boat that is always ready is seldom needed.',
      'Tip: line the boat up with the slip before you drive in. The walkways are wide enough for a gnome, but not for a gnome and a boat.',
      'Joke: the name board says Mossbank Boathouse, but the loch has been quietly calling it the Mossbank Boat-Hole for years.',
      'A life ring hangs on the outside of the east wall. It has been there since the first boat, and it is still waiting for its first gnome.',
    ],
    parts: [
      { s: 'box', d: [0.3, 4.5, 16], at: [4.85, 4.25, 0], c: 'wood', mirror: true },               // side wall, y 2.0..6.5
      { s: 'box', d: [3.9, 4.5, 0.3], at: [3.05, 4.25, -7.85], c: 'wood', mirror: true },          // back wall, beside the door
      { s: 'box', d: [2.2, 1.2, 0.3], at: [0, 5.9, -7.85], c: 'wood-dark' },                       // back wall, lintel over the door
      { s: 'box', d: [1.5, 0.15, 16], at: [3.95, 2.425, 0], c: 'wood-light', mirror: true },       // walkway, deck top at y 2.5
      { s: 'cyl', d: [0.12, 0.12, 2.5], at: [3.95, 1.25, -7.5], c: 'wood-dark', seg: 8, mirror: true }, // post, reaches the loch bed at y 0
      { s: 'cyl', d: [0.12, 0.12, 2.5], at: [3.95, 1.25, -2.5], c: 'wood-dark', seg: 8, mirror: true }, // post
      { s: 'cyl', d: [0.12, 0.12, 2.5], at: [3.95, 1.25, 2.5], c: 'wood-dark', seg: 8, mirror: true },  // post
      { s: 'cyl', d: [0.12, 0.12, 2.5], at: [3.95, 1.25, 7.5], c: 'wood-dark', seg: 8, mirror: true },  // post
      { s: 'box', d: [5.8, 0.2, 16.8], at: [-2.9, 6.67, 0], rot: [0, 0, 25], c: 'slate', mirror: true }, // roof slope, mirrored
      { s: 'box', d: [0.3, 0.3, 16.8], at: [0, 7.9, 0], c: 'iron-dark' },                          // ridge beam
      { s: 'box', d: [10, 0.8, 0.2], at: [0, 6.2, 7.9], c: 'wood' },                               // front fascia over the slip
      { s: 'box', d: [6, 0.5, 0.06], at: [0, 6.2, 8.03], c: 'brass' },                              // name board
      { s: 'cyl', d: [0.3, 0.3, 9.2], rot: [0, 0, 90], at: [0, 5.8, 7.7], c: 'wood-dark', seg: 8 }, // rolled-up front door
      { s: 'cyl', d: [0.1, 0.12, 0.3], at: [3.95, 2.65, 7.2], c: 'iron-dark', seg: 8, mirror: true }, // bollard on walkway
      { s: 'ring', d: [0.22, 0.05], rot: [0, 90, 0], at: [5.1, 4.5, -3], c: 'red', seg: 8 },        // life ring on the east wall
    ],
  },
  {
    id: 'harbourmaster-cap', name: 'Harbourmaster Cap', category: 'armor', uses: ['wear-head'],
    tags: ['cap', 'hat', 'harbour', 'harbourmaster', 'navy', 'peaked', 'sailor', 'anchor', 'propeller', 'reward', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Harbourmaster Cap. A navy peaked cap with a white band and a small brass anchor-and-propeller badge on the front. Sits like the Sling-Lift Headset.',
    examine: [
      'A navy peaked cap with a white band round the base and a small brass badge on the front, an anchor crossed with a propeller.',
      'Saying: the harbourmaster sees every boat that comes in and most of the ones that do not, and the cap is how the boats know.',
      'Tip: tip the peak up to see the water, or down to be taken seriously. Both work, and both are equally expensive to get wrong.',
      'Joke: the cap has been worn by six harbourmasters, and each one has said the last one was taller.',
      'The brass badge is polished every morning by someone who has never once seen the propeller turn.',
    ],
    parts: [
      { s: 'cyl', d: [0.16, 0.14, 0.13], at: [0, 0.085, 0], c: 'ink', seg: 10 },                    // crown
      { s: 'ring', d: [0.165, 0.02], at: [0, 0.03, 0], rot: [90, 0, 0], c: 'white', seg: 10 },        // white band
      { s: 'box', d: [0.2, 0.02, 0.1], at: [0, 0.03, 0.14], c: 'ink' },                             // peak
      { s: 'cyl', d: [0.035, 0.035, 0.012], at: [0, 0.1, 0.155], rot: [90, 0, 0], c: 'brass', seg: 8 }, // badge, anchor ring
      { s: 'box', d: [0.012, 0.05, 0.012], at: [0, 0.1, 0.165], c: 'brass' },                       // badge, anchor shaft
      { s: 'box', d: [0.06, 0.01, 0.012], at: [0, 0.13, 0.165], c: 'brass' },                       // badge, propeller blade
    ],
  },
  {
    id: 'windsock-quiver', name: 'Windsock Quiver', category: 'trinket', uses: ['wear-back'],
    wear: { at: [0, -0.08, 0], scale: 0.85 },
    tags: ['quiver', 'windsock', 'tube', 'back', 'striped', 'airfield', 'strap', 'reward', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Windsock Quiver. A wooden tube worn on the back with an orange and white striped windsock poking out of the top, held by a leather strap. Worn on the back like the Spare Tyre Pack.',
    examine: [
      'A wooden tube worn on the back, with an orange and white striped windsock poking out of the top like a very small flag.',
      'Saying: the windsock is only good for telling which way the wind blows, and so is the quiver, which is why both point the same way.',
      'Tip: keep the sock pointed up. A sock that droops over your shoulder is a sign the next gust is coming from behind.',
      'Joke: the stripes on the sock are the only thing the airfield has ever agreed on, and even they are not quite the same width.',
      'The tube is full of spare socks, all of them slightly the wrong colour, and none of them is for sale.',
    ],
    parts: [
      { s: 'cyl', d: [0.06, 0.06, 0.42], at: [0, 0.22, -0.2], c: 'wood-dark', seg: 8 },            // tube
      { s: 'cone', d: [0.05, 0.24], rot: [180, 0, 0], at: [0, 0.55, -0.2], c: 'orange', seg: 8 },    // windsock, mouth up
      { s: 'ring', d: [0.035, 0.01], at: [0, 0.5, -0.2], c: 'white', seg: 8 },                    // stripe
      { s: 'ring', d: [0.025, 0.01], at: [0, 0.6, -0.2], c: 'white', seg: 8 },                    // stripe
      { s: 'box', d: [0.03, 0.4, 0.02], at: [0.09, 0.2, 0.0], c: 'leather-dark', mirror: true },   // shoulder strap
    ],
  },
  {
    id: 'cork-key-float', name: 'Cork Key Float', category: 'trinket', uses: ['wear-neck'],
    tags: ['cork', 'float', 'key', 'neck', 'cord', 'boat', 'harbour', 'brass', 'buoy', 'reward', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Cork Key Float. A cord round the neck with a fat round cork float at the chest and one brass key hanging below it. Starts at the neck like the Lock-Up Key Lanyard.',
    examine: [
      'A cord round the neck with a fat round cork float at the chest, and one small brass key dangling below it, bobbing as you walk.',
      'Boatman saying: a key that floats is a key that is never lost in the loch, which is the only kind of key worth owning.',
      'Tip: check the key before you go out. A key that has come off the cord is a boathouse you will be locked out of by the morning tide.',
      'Joke: the cork has been bobbing on the loch so long that it now floats the gnome, and not the other way round.',
      'The key opens the boathouse door, though nobody remembers which of the several keys in the drawer it is.',
    ],
    parts: [
      { s: 'ring', d: [0.21, 0.01], at: [0, 0.01, -0.05], rot: [90, 0, 0], c: 'leather-dark', seg: 12 }, // neck cord (min.y = 0)
      { s: 'cyl', d: [0.07, 0.07, 0.05], at: [0, 0.13, 0.17], rot: [90, 0, 0], c: 'wood-light', seg: 10 }, // cork float
      { s: 'box', d: [0.012, 0.05, 0.006], at: [0, 0.025, 0.18], c: 'brass' },                      // key shaft
      { s: 'cyl', d: [0.012, 0.012, 0.006], at: [0, 0.05, 0.18], rot: [90, 0, 0], c: 'brass', seg: 8 }, // key bow
    ],
  },
];
