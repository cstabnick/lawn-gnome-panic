// Story row 25: the stages its scenes play on (new ones), and extra quest ids for existing stages' usedBy.
// Wader's Rest at dusk, in the ritual circle with the Standing Lady behind it (societies/flock/build.ts builds the camp; the
// one-leg stones stand on a ring of radius 8 round (-1130, -645), nothing here stands on the ring), and the open stubble
// east of Driftwood's trailer where the raft comes home on the tow (the trailer itself is the existing `driftwood-trailer`).
import { cam, car, mark, type Stage } from '../kit';

export const STAGES: readonly Stage[] = [
  {
    id: 'waders-circle',
    name: "Wader's Rest, inside the ritual circle at dusk",
    region: 'west-estates',
    center: [-1130, -646],
    radius: 14,
    facing: 0,
    time: 'dusk',
    built: 'existing',
    usedBy: ['m25-one-leg-to-stand-on'],
    look: "A ring of one-leg stones on worn earth, the Flock in grey standing on one leg each facing the giant pink Standing Lady on her sand mound, the loch reeds gold behind her and the sky going orange.",
    sounds: 'A low hum held on one note by the whole camp, reeds, the loch against the bank, and now and then a tiny wobble and an apology.',
    marks: [
      mark('saxifrage', [-1130, -643.6], [-1126.2, -639], 'stand', 'on one leg in the middle of the circle, hooked staff planted, a long pink-white beard'),
      mark('godwit', [-1134.2, -645.6], [-1130, -643.6], 'stand', 'on one leg, already wobbling, a cup of reed tea in his hand he is not supposed to have'),
      mark('player', [-1126.2, -639], [-1130, -643.6], 'stand', 'walked in from the east gate, on two legs, and has been noticed'),
    ],
    cameras: [
      cam('lady', [-1130, 2.4, -634], [-1130, 3.2, -668], 'low over the circle from the south: the backs of the Flock and the Standing Lady against the sky', 44),
      cam('mother', [-1122.4, 1.2, -640.6], [-1130, 1.6, -643.6], 'across the player onto Mother Saxifrage, the Lady a pink shape behind her'),
      cam('wobble', [-1136.8, 1.0, -641.2], [-1134.2, 1.2, -645.6], 'a low three-quarter on Brother Godwit and his cup'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'driftwood-hitch',
    name: "Driftwood's trailer, the hitch field",
    region: 'cloverfield-farms',
    center: [38, 458],
    radius: 14,
    facing: Math.PI / 2,
    time: 'golden',
    built: 'existing',
    givers: ['driftwood-trailer'],
    usedBy: ['m25-one-leg-to-stand-on'],
    look: "The stubble field east of the lawn-boat trailer in low gold light, the highway a pale line beyond, a combine at the hitch with the borrowed raft behind it wearing a small pink plume.",
    sounds: 'Wind through the stubble, the combine ticking over, a bucket clanking, Driftwood saying something kind to a boat.',
    marks: [
      mark('driftwood', [31.5, 459.4], [38, 458], 'stand', 'cap in both hands, rocking from heel to toe as if on a deck'),
      mark('player', [34.4, 463.6], [31.5, 459.4], 'stand', 'climbs down from the combine at the hitch'),
    ],
    cameras: [
      cam('raft', [27.6, 1.3, 452.4], [40.5, 0.9, 458.5], 'from the trailer side along the tow onto the raft and its plume'),
      cam('pair', [36.4, 1.3, 455.4], [32.2, 1.5, 460.6], 'a two-shot of Driftwood and the player at the hitch'),
      cam('wide', [18, 3.6, 470], [38, 1.0, 458], 'the whole hitch field, the combine, the raft and the golden stubble'),
    ],
    walks: [],
    vehicles: [
      car('hitch-combine', 'pull-up', 'combine', [37, 462.4], Math.PI, undefined, 'the combine stopped at the hitch with the tow rope still taut'),
    ],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {};
