// Story row 48 (The Groundskeeper's Secret): the stage its three scenes play on, and the quest id added to Thrift's shed.
// The ninth green (hole 9, "The Ninth", the fourth hole built; green at (-1065, 640)) is where Thrift hides the mole family:
// the intro (dusk) is Thrift talking to the grass, the mid scene is Basil's arrival with a cart of traps and the reveal of the
// sprinkler and the ball, the outro (night) is Basil kneeling on the green. Basil's cart comes in along the E15 cart path from the
// south-east; the traps are scene props only.
import { cam, car, mark, type Stage } from '../kit';

const ROW = ['m48-the-groundskeepers-secret'];

export const STAGES: readonly Stage[] = [
  {
    id: 'hedgeworth-ninth-green',
    name: 'Hedgeworth Links, the ninth green at dusk and night',
    region: 'west-estates',
    center: [-1066, 640],
    radius: 16,
    facing: -Math.PI / 2,
    time: 'dusk',
    built: 'dressed',
    usedBy: ROW,
    look: 'A small round green in the last gold of the day: the flag over the cup, a pop-up sprinkler a hand from it, a bunker to the south-west, the groundskeeper kneeling at the edge, molehills nobody admits to, and at night a single garden lamp.',
    sounds: 'A sprinkler ticking, crickets, the squeak of something very small, a golf cart a long way off coming nearer.',
    marks: [
      mark('thrift', [-1070.4, 633.8], [-1066, 640], 'kneel', 'on one knee at the green\'s edge, can at his side, murmuring to the turf'),
      mark('player', [-1058.6, 632.4], [-1070.4, 633.8], 'stand', 'walks up the fairway edge from the shed and stops short of the green'),
      mark('nubbin', [-1063.4, 640.6], [-1070.4, 633.8], 'stand', 'by the cup in his small satchel, ready to bolt for the hill'),
      mark('basil', [-1052.4, 641.8], [-1066, 640], 'stand', 'steps down from his cart with a sack of traps, scowling at the green'),
    ],
    cameras: [
      cam('ninth-low', [-1053, 0.5, 631], [-1068.4, 0.7, 635.4], 'ground level through the fringe onto Thrift and the first molehill', 40),
      cam('ninth-wide', [-1042, 3.0, 624], [-1066, 0.9, 640], 'establishing: the green, the flag, the bunker, the shed roof beyond', 52),
      cam('cup-insert', [-1062.6, 0.5, 636.6], [-1064.4, 0.2, 640], 'low on the cup, the sprinkler head and the ball', 30),
      cam('cart-in', [-1040, 1.1, 656], [-1052.4, 1.0, 646], 'at the fairway edge as the golf cart arrives', 46),
      cam('night-lamp', [-1056, 1.4, 646], [-1066.6, 0.6, 638.4], 'low and warm from the lamp side onto the green at night', 40),
    ],
    walks: [],
    vehicles: [car('basil-cart', 'pull-up', 'golf-cart', [-1049.6, 645.2], -Math.PI / 2, 'basil', "Basil's cart, a sack of mole traps on the back seat")],
    paths: [
      { id: 'cart-arrival', role: 'arrival', kind: 'golf-cart', offRoad: true, points: [[-1024, 690], [-1028, 668], [-1040, 652], [-1049.6, 645.2]], note: "Basil's cart in from the cart path, south-east" },
    ],
    set: [],
  },
];

/** Existing stage id -> this row's quest id: Thrift's shed (the drop-off). */
export const USES: Record<string, string[]> = { thrift: ROW };
