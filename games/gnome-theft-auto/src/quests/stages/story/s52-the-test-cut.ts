// Story row 52 (The Test Cut, extended): the stages its eight scenes play on. All at Hedgeworth Links (E15/E32,
// golf/types.ts) and just outside its Kicked Board; nothing here builds set dressing in the world (the scenes carry
// their own props, and the mown scar afterwards is W14, worldChanges/rows/mownScar.ts).
// - m52-gala-terrace: the Clubhouse terrace dressed for Vesper's backers' gala (p1 intro and mid, the p2 outro's
//   arrival, the final intro). Terrace x -1074..-1046, z 455..465; tables at (-1069, 460) and (-1051, 460).
// - m52-ninth-test: the ninth green and fairway, by Thrift's shed (p2 intro, p3 intro and outro).
// - m52-test-line: the deck's test line in the middle of the course, past the hedge's south end (-1150, 690), where
//   the Flock stand in its way (p2 outro) and Vesper walks in its wake (final intro).
// - m52-board-night: the fence road side of the Kicked Board at night (final outro).
// The test line runs from (-1172, 703.5) to (-1004, 641) (yaw about 1.92, east-north-east): mownScar.ts TEST_LINE.
import { cam, car, mark, type Stage } from '../kit';

const P1 = 'm52-the-test-cut-p1';
const P2 = 'm52-the-test-cut-p2';
const P3 = 'm52-the-test-cut-p3';
const FINAL = 'm52-the-test-cut';

export const STAGES: readonly Stage[] = [
  {
    id: 'm52-gala-terrace',
    name: "Hedgeworth Clubhouse terrace, dressed for Vesper's backers' gala",
    region: 'west-estates',
    center: [-1060, 461],
    radius: 14,
    facing: 0,
    time: 'day',
    built: 'existing',
    givers: ['peony'],
    usedBy: [P1, P2, FINAL],
    look: 'The mock-Tudor terrace with its two parasol tables, a gala trestle laid in beige, and two brass HOA loudspeaker horns bolted on posts at either end, pointing at the course.',
    sounds: 'A teaspoon on china, polite applause from the first tee, a loudspeaker being tested in a voice that only says "even".',
    marks: [
      mark('peony', [-1062.6, 461.6], [-1059.8, 463.4], 'stand', 'in the middle of her terrace, the caddy bib over her arm'),
      mark('player', [-1059.8, 463.4], [-1062.6, 461.6], 'stand', 'up the terrace steps in the planter gap'),
      mark('basil', [-1056.6, 461.2], [-1059.8, 463.4], 'stand', "with the Countess's purple bag, sulking"),
      mark('hoa-tech', [-1066.4, 458.4], [-1067.6, 457.0], 'stand', 'at the west loudspeaker post, testing'),
      mark('vesper', [-1050.2, 463.0], 0, 'stand', 'at the planters on the east end, looking out over the course'),
      mark('wisteria', [-1047.4, 462.4], 0, 'stand', 'beside him at the rail, glass in hand'),
      mark('player', [-1053.4, 458.2], [-1050.2, 463.0], 'stand', "behind the parasol with the Countess's bag: the caddy, overhearing"),
      mark('thrift', [-1065.2, 462.6], [-1060, 470], 'stand', 'the final intro: off his green, at the top of the steps'),
      mark('tansy', [-1057.4, 462.6], [-1060, 461], 'stand', 'the final intro: in from the board, arms crossed'),
      mark('pip', [-1054.6, 460.0], [-1060, 461], 'stand', 'the final intro: by the tea-time board, bouncing'),
    ],
    cameras: [
      cam('terrace-wide', [-1052, 2.8, 476], [-1060, 1.0, 460], 'establishing: the terrace from the lawn below, horns on their posts, the Clubhouse behind', 50),
      cam('pa-horn', [-1065.4, 0.9, 460.8], [-1067.6, 3.0, 457.0], 'low, looking up at the west loudspeaker horn on its post', 40),
      cam('rail-low', [-1048.6, 0.7, 471], [-1049, 1.3, 462.8], 'low from the lawn up at the east end of the terrace: Vesper and the Countess at the planters', 40),
      cam('course-south', [-1058, 2.6, 466.5], [-1078, 0.2, 600], 'over the planters, south across the course toward the ninth at dusk', 45),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'm52-ninth-test',
    name: 'Hedgeworth Links, the ninth green and fairway on the night of the test',
    region: 'west-estates',
    center: [-1066, 640],
    radius: 22,
    facing: -Math.PI / 2,
    time: 'dusk',
    built: 'existing',
    usedBy: [P2, P3],
    look: "The ninth green in a golden dusk: Thrift on his knees by the hole with the moles' teacup, Tumblesoil at the edge with five small moles, and the hedge's cut-off tail to the west with something very large behind it.",
    sounds: 'A sprinkler ticking, a teacup rattling in its saucer, a long low engine note from behind the hedge.',
    marks: [
      mark('thrift', [-1063.2, 633.6], [-1062, 636.4], 'kneel', 'on the green by the hole, talking to the grass'),
      mark('tumblesoil', [-1068.6, 629.6], [-1063.2, 633.6], 'stand', 'at the green edge with the family behind her'),
      mark('peony', [-1058.6, 627.4], [-1063.2, 633.6], 'stand', 'at the top of the green, leaning on her driver'),
      mark('basil', [-1060.2, 638.6], [-1063.2, 633.6], 'stand', 'holding the gala flag by the pin'),
      mark('player', [-1055.8, 630.4], [-1063.2, 633.6], 'stand', 'off the cart path, by the shed side of the green'),
      mark('player', [-1069.4, 652.4], [-1090, 671], 'stand', 'p3: on the ninth fairway, facing the deck'),
      mark('peony', [-1066.8, 650.2], [-1090, 671], 'stand', 'p3: beside the player on the fairway, driver in hand'),
      mark('tansy', [-1063.6, 649.0], [-1090, 671], 'stand', 'p3 outro: in from the board, cannon on her shoulder'),
      mark('pip', [-1062.0, 652.0], [-1090, 671], 'stand', 'p3 outro: beside Tansy'),
    ],
    cameras: [
      cam('ninth-wide', [-1040, 3.0, 612], [-1064, 0.8, 634], 'establishing: the ninth green from the shed side at dusk', 50),
      cam('green-low', [-1052.5, 0.35, 629.5], [-1063, 0.45, 633.6], 'ground level through the blades onto Thrift by the hole: the Hedgeworth signature shot', 40),
      cam('hedge-tail', [-1066, 0.6, 637], [-1158, 6.2, 694], 'low from the green, long lens on the hedge tail to the west-south-west and the sky over it', 32),
      cam('deck-low', [-1060.5, 0.45, 658], [-1092, 1.0, 672.5], 'ground level on the ninth fairway, looking back down the test line at the oncoming deck', 36),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'm52-test-line',
    name: "Hedgeworth Links, the deck's test line past the hedge's tail",
    region: 'west-estates',
    center: [-1114, 682],
    radius: 22,
    facing: -1.215,
    time: 'dusk',
    built: 'existing',
    usedBy: [P2, FINAL],
    look: 'Rough between the ninth and the middle, giant hostas either side, a row of little beige HOA survey flags in a dead-straight line, and four of the Flock standing across it on one leg.',
    sounds: 'Wind in the giant leaves, flags fluttering, the deck coming on at walking pace.',
    marks: [
      mark('saxifrage', [-1112.4, 680.3], -1.215, 'stand', 'in the middle of the row, on one leg, facing the deck'),
      mark('flock', [-1113.0, 678.6], -1.215, 'stand', 'the row, north end'),
      mark('flock', [-1111.8, 682.0], -1.215, 'stand', 'the row'),
      mark('flock', [-1111.2, 683.7], -1.215, 'stand', 'the row, south end'),
      mark('vesper', [-1101.4, 677.6], 1.925, 'stand', "final intro: alone in the deck's wake, on the cut lane"),
    ],
    cameras: [
      cam('flock-wide', [-1101, 1.3, 665.5], [-1118, 1.0, 684], 'locked wide from the ninth side: the Flock in a row across the line, the deck coming behind them', 44),
      cam('line-low', [-1090.5, 0.5, 672.2], [-1118, 1.4, 682.4], 'ground level on the line ahead of the Flock, looking back along the stakes', 40),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'm52-board-night',
    name: 'Outside the Kicked Board, the fence road side, at night',
    region: 'west-estates',
    center: [-988, 641],
    radius: 14,
    facing: -Math.PI / 2,
    time: 'night',
    built: 'existing',
    usedBy: [FINAL],
    look: 'The board fence in the dark with its one broken board, a golf cart with its lamps on the grass, and through the gap the brass discs of a cutting deck, stopped a yard from the fence.',
    sounds: 'Crickets, the deck winding down, a loudspeaker a long way off over Turfton, echoing.',
    marks: [
      mark('thrift', [-994.4, 645.2], [-1001, 641], 'stand', 'at the fence, a hand on the boards, looking in'),
      mark('peony', [-990.6, 642.6], [-1001, 640], 'stand', 'facing her course through the gap'),
      mark('basil', [-989.4, 637.0], [-1001, 640], 'stand', 'still holding the gala flag, snapped'),
      mark('player', [-986.6, 639.8], [-990.6, 642.6], 'stand', 'off the cart, beside Peony'),
      mark('tansy', [-985.4, 643.0], [-990.6, 642.6], 'stand', 'arms crossed, at the back'),
      mark('pip', [-984.0, 638.4], [-990.6, 642.6], 'stand', 'by the cart, quiet for once'),
    ],
    cameras: [
      cam('board-gap', [-993.5, 1.0, 640.4], [-1003, 1.0, 640.6], 'through the broken board at the deck stopped behind the fence', 38),
      cam('board-crane', [-968, 13, 627], [-1040, 1.0, 652], 'crane-high over the fence road, looking back over the fence along the test line', 52),
      cam('road-wide', [-973.5, 1.6, 650], [-989, 1.0, 641], 'the crew in a line on the fence road, the cart lamps on them', 48),
    ],
    walks: [],
    vehicles: [
      car('m52-cart', 'parked', 'golf-cart', [-980.2, 636.4], -Math.PI / 2 + 0.25, undefined, 'the getaway cart, lamps on, pointing at the fence'),
    ],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> this row's quest ids. */
export const USES: Readonly<Record<string, readonly string[]>> = {
  peony: [P1, P2, P3, FINAL],
  thrift: [P2, P3],
};
