// Story row 32 (m32-driftwoods-chart): the stages its scenes play on, and the quest ids added to existing stages' usedBy.
// Three places: Driftwood's trailer in the southern stubble (the giver `driftwood-chart`: the chart is unrolled on the ground
// by the cart), Brenda's toll at Lock No. 1 on the Southern Drainage Canal (x 96, the east lock: the canal is 10 m wide there,
// z 225..235, walled to the banks at z 222 and 238), and the dune line on the Saltcut's west bank (E11: the channel from the
// Puddle Sea's south shore to the Saltwater; the water is at x 705..720 at z 930).
import { cam, car, mark, type Stage } from '../kit';

export const STAGES: readonly Stage[] = [
  {
    id: 'driftwood-chart-trailer',
    name: "Driftwood's trailer, the chart on the stubble",
    region: 'cloverfield-farms',
    center: [27, 463],
    radius: 9,
    facing: -Math.PI / 2,
    time: 'day',
    built: 'existing',
    givers: ['driftwood-chart'],
    usedBy: ['m32-driftwoods-chart'],
    look: "The rusted trailer in the southern stubble with a sea chart unrolled across the ground beside it, corners pinned down by a tin pail, a bell and two stones; a walnut dinghy on the cart, a deck chair, the combine ticking at the field edge.",
    sounds: 'Wind through the stubble, paper snapping at its pins, a bucket clanking, the combine idling.',
    marks: [
      mark('driftwood', [27.2, 462.4], [24.6, 464.6], 'kneel', 'on one knee at the edge of the chart, hat off, a finger on the line where the canal runs out of paper'),
      mark('player', [31.4, 465.6], [27.2, 462.4], 'stand', 'walks up from the combine and stops with one boot on the chart'),
    ],
    cameras: [
      cam('wide', [41, 4.6, 450], [25, 0.9, 463], 'establishing: the trailer, the dinghy on its cart, the chart pale on the dark stubble'),
      cam('chart', [28.6, 2.0, 464.8], [24.6, 0, 464.4], 'looking down on the chart: the canal, the Puddle Sea, then more paper', 44),
      cam('two-shot', [32.4, 1.5, 460.4], [26.6, 1.0, 464], 'over the player onto Driftwood kneeling at the chart'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'new-puddle-lock-toll',
    name: "New Puddle's toll at Lock No. 1",
    region: 'cloverfield-farms',
    center: [96, 219],
    radius: 14,
    facing: Math.PI,
    time: 'day',
    built: 'existing',
    usedBy: ['m32-driftwoods-chart'],
    look: "The east lock of the Southern Drainage Canal under a clear noon: timber gates against stone walls, the north bank trodden by a pink push-bike gang, a pink ribbon of bunting strung across the water from bank to bank.",
    sounds: 'Canal water against the lock walls, a push-bike bell, a boombox two banks away, a duster being shaken for dignity.',
    marks: [
      mark('player', [91.4, 220], [100.4, 219.4], 'stand', 'stands on the north bank by the lock wall, hand on the tow rope'),
      mark('driftwood', [89.6, 221], [100.4, 219.4], 'stand', 'at the player\'s shoulder, the rolled chart under one arm'),
      mark('brenda', [100.4, 219.4], [91.4, 220], 'stand', 'planted on the bank at the lock, the feather duster levelled like a sceptre'),
      mark('biker', [103.6, 221.2], [91.4, 220], 'lean', 'a gang member holding one end of the toll ribbon'),
      mark('biker', [98.4, 216.6], [91.4, 220], 'lean', 'a second gang member, counting spark plugs in a bucket'),
    ],
    cameras: [
      cam('wide', [72, 4.2, 212], [96, 1.4, 222],'establishing: the lock, the ribbon across the canal and the gang on the bank'),
      cam('bank', [88, 1.6, 214.4], [98, 1.4, 220], 'low along the bank onto Brenda and her gang'),
      cam('far-bank', [94, 1.7, 241], [92, 1.2, 222], 'from the south bank across the canal onto the player and Driftwood'),
    ],
    walks: [],
    vehicles: [
      car('toll-raft', 'parked', 'walnut-dinghy', [86, 230], Math.PI / 2, 'driftwood', "Driftwood's raft, moored under the ribbon with a tin pail on its stern"),
      car('toll-gang-bike', 'pull-up', 'push-bike', [118, 218], -Math.PI / 2, undefined, 'a pink gang bike arriving along the north bank'),
    ],
    paths: [],
    set: [],
  },
  {
    id: 'saltcut-dune-line',
    name: 'The dune line over the Saltcut',
    region: 'south-shore',
    center: [693, 926],
    radius: 12,
    facing: 0,
    time: 'golden',
    built: 'existing',
    usedBy: ['m32-driftwoods-chart'],
    look: "The west bank of the Saltcut where the ground rises into dunes: bleached marram grass, a walnut dinghy tied at the water's edge, the channel running south between the dunes and, past them, a band of light the sunset is not responsible for.",
    sounds: 'Wind in marram grass, a halyard ticking on the dinghy, a low surf wash that is a great deal further away than it sounds.',
    marks: [
      mark('driftwood', [695.6, 927.4], [699, 1010], 'stand', 'on the dune crest, hat in both hands, facing south'),
      mark('player', [692.4, 924.8], [695.6, 927.4], 'stand', 'a pace behind him and to the left'),
    ],
    cameras: [
      cam('wide', [682, 3.6, 906], [700, 1.4, 990], 'establishing: the two of them on the crest and the Saltcut running south', 56),
      cam('south', [690.2, 1.5, 922], [708, 4.6, 1020], 'from behind them down the channel to the band of light', 44),
      cam('sides', [702, 1.5, 920], [695.2, 1.4, 927.6], 'from the water side onto Driftwood in profile'),
    ],
    walks: [],
    vehicles: [
      car('saltcut-dinghy', 'parked', 'walnut-dinghy', [711, 927], Math.PI, 'driftwood', 'his walnut dinghy tied up at the bank, bell on the bow'),
    ],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {};
