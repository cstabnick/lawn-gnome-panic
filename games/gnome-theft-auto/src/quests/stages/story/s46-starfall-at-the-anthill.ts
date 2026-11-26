// Story row 46 (m46-starfall-at-the-anthill, extended): the stages its scenes play on. Places from campus/types.ts:
// - p1: the Long Shelf's front steps (door (1110, -277.5), facing the quad; the quad's low north hedge runs at z -261,
//   with its gate gap at x 1107.6..1113.5). The giver `betony-library` stands here at night.
// - p2: the lawn below the ants' north door (OBSERVATORY.antDoors[0] at (1172, 82), facing north-west; the door sits
//   6 m up the mound's foot, so the marks stand on the flatter lawn below it). The giver `anthill-north-door`.
// - p3 and the final's intro: the summit forecourt west of the dome (dome (1258, 158) r 9, door (1247.5, 158)), the
//   sighting stand on the west rim at (1222, 152) and the survey string; the existing stage `betony` gives both parts.
// - final mid: the top of Dean's Leap's run-up (x 1238, z 182 -> 135; the lip near z 119.5, the north slope below).
// - final outro: Rootwell Field's very small tower (1228, 508) and the deck chair beside it, then the runway (x 1300).
import { cam, car, mark, type Stage } from '../kit';

const P1 = 'm46-starfall-at-the-anthill-p1';
const P2 = 'm46-starfall-at-the-anthill-p2';
const P3 = 'm46-starfall-at-the-anthill-p3';
const FINAL = 'm46-starfall-at-the-anthill';

export const STAGES: readonly Stage[] = [
  {
    id: 'rootwell-library-steps',
    name: 'Rootwell, the Long Shelf steps at night',
    region: 'east-campus',
    center: [1110.4, -268],
    radius: 10,
    facing: 0,
    time: 'night',
    built: 'existing',
    givers: ['betony-library'],
    usedBy: [P1],
    look: "The library's tall front at night, one lamp lit in a high window, the gravel path to the quad gate, the quad black beyond the hedge and the Anthill's dome a small white light far to the south.",
    sounds: 'Night insects, the gravel, a far bell, a lantern creaking on its handle somewhere out on the quad.',
    marks: [
      mark('betony', [1111.6, -271.5], [1108.6, -269.6], 'stand', 'on the bottom step, a folded gown over one arm, looking past the player at the sky'),
      mark('player', [1108.6, -269.6], [1111.6, -271.5], 'stand', 'on the path below the steps'),
      mark('lovage', [1110.5, -264.4], [1110.5, -272], 'stand', 'just inside the quad gate, lantern raised, on his rounds'),
    ],
    cameras: [
      cam('quad-high', [1110, 16, -272], [1250, 6, 150], 'crane-high wide: over the dark quad, across the lawns, to the Anthill and its little lit dome', 54),
      cam('library-axis', [1110, 1.5, -246], [1110, 4, -277.6], "Rootwell's signature: the library front dead centre on the quad axis, one window lit", 50),
      cam('gate', [1114.4, 1.2, -258], [1110.5, 1.1, -264.4], 'low through the quad gate onto the Dean and his lantern', 40),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'anthill-north-door',
    name: "The Anthill's north door",
    region: 'east-campus',
    center: [1163, 72],
    radius: 9,
    facing: -2.36,
    time: 'night',
    built: 'existing',
    givers: ['anthill-north-door'],
    usedBy: [P1, P2],
    look: "A round plank door with a sugar-cube knocker set into the mound's foot, a SUGAR RENT OVERDUE (AGAIN) sign, two lines of ants coming and going, essay pages blown against the step.",
    sounds: 'A low continuous scrape of ants, a tapping on the step like someone counting, wind off the mound.',
    marks: [
      mark('betony', [1165.4, 74.2], [1170.4, 80.4], 'stand', 'below the step, hat off to the landlord'),
      mark('pip', [1160.6, 74.8], [1170.4, 80.4], 'stand', 'as far from the door as a gnome can be and still be at it'),
      mark('player', [1162.2, 70.8], [1170.4, 80.4], 'stand', 'on the lawn, the gown still on'),
    ],
    cameras: [
      cam('door-wide', [1150, 3, 56], [1166, 1.5, 76], 'establishing: the three of them small against the mound, the door above them, the dome far up the slope', 50),
      cam('ant-eye', [1166.6, 0.5, 76.4], [1170.4, 0.3, 80.4], "the ant's own eye line: low on the step, level, the ant big in frame", 36),
      cam('from-step', [1168.5, 1.6, 78.5], [1162, 1, 71], 'from the door step, down onto the three gnomes and the lawn', 44),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'anthill-forecourt',
    name: 'The Anthill summit at dawn: the forecourt and the sighting stand',
    region: 'east-campus',
    center: [1236, 158],
    radius: 16,
    facing: Math.PI / 2,
    time: 'dawn',
    built: 'existing',
    usedBy: [P3, FINAL],
    look: 'The white dome with its slit cranked open to a pale sky, the gravel forecourt, the cones of the run-up, the little sighting stand on the west rim aimed along a pegged string, and the campus flat and grey below.',
    sounds: "Wind over the summit, the dome's long mechanical groan, a survey radio's squelch, ants far below.",
    marks: [
      mark('betony', [1244.5, 163], [1241.5, 166.5], 'stand', "by the observatory step, looking up at the dome's slit"),
      mark('pip', [1240.5, 160.5], [1228, 150], 'stand', 'crouched behind a cone, glaring at the coats'),
      mark('player', [1241.5, 166.5], [1244.5, 163], 'stand', 'at the top of the road'),
      mark('hoa-tech', [1224.8, 151.6], [1222, 152], 'work', 'the lead technician at the sighting stand, lens in both hands'),
      mark('hoa-tech', [1228, 147], [1222, 152], 'stand', 'holds the survey string taut'),
      mark('hoa-tech', [1232, 156], [1224.8, 151.6], 'stand', 'with a clipboard, reading the stars off a list'),
      mark('hoa-tech', [1246, 151], [1258, 158], 'stand', 'at the dome, cranking the slit'),
      mark('hoa-tech', [1230, 163], [1224.8, 151.6], 'stand', 'holding a radio'),
      mark('hoa-tech', [1236, 170], [1238, 182], 'stand', 'watching the road'),
    ],
    cameras: [
      cam('stand-wide', [1218, 2.5, 162], [1224, 1.2, 152], 'across the sighting stand and the survey string, the forecourt behind', 46),
      cam('dome-low', [1243, 0.6, 150], [1249.4, 6, 157], 'low up the dome face to the open slit and the sky', 52),
      cam('step', [1240.2, 1.4, 169.6], [1244.5, 1.1, 163], 'over the road onto the observatory step and the dome door', 42),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'deans-leap-runup',
    name: "The top of Dean's Leap",
    region: 'east-campus',
    center: [1238, 150],
    radius: 18,
    facing: Math.PI,
    time: 'dawn',
    built: 'existing',
    usedBy: [FINAL],
    look: "The run-up between two rows of cones, the wedge ramp, a signpost reading THIS WAY DOWN, and past the lip nothing at all, then the campus a long way down.",
    sounds: 'Wind across the lip, a cart idling, the HOA radio still ringing back at the stand.',
    marks: [
      mark('player', [1238, 166], [1238, 120], 'drive', "in the Dean's valet cart at the top of the run-up"),
    ],
    cameras: [
      cam('lip', [1238, 2.2, 118], [1238, 0, 40], 'over the lip: the ramp ends, the north slope falls away, the campus far below', 52),
      cam('lip-back', [1238, 1.5, 121], [1238, 1, 166], 'from the lip back up the run-up at the cart', 40),
    ],
    walks: [],
    vehicles: [
      car('deans-cart', 'pull-up', 'golf-cart', [1238, 166], Math.PI, 'lovage', "the Dean's HOA valet cart, nose at the ramp"),
    ],
    paths: [],
    set: [],
  },
  {
    id: 'rootwell-field-tower',
    name: "Rootwell Field, Wally's chair by the very small tower",
    region: 'east-campus',
    center: [1234, 515],
    radius: 12,
    facing: Math.PI / 2,
    time: 'dawn',
    built: 'existing',
    usedBy: [FINAL],
    look: "The brick stalk of the tower with its glazed cab, a deck chair and a picnic set at its foot, the apron's planes in a row, the runway's edge lights still on in the first light.",
    sounds: 'A windsock snapping, a prop turning over, a kettle on a picnic stove, the edge-light hum.',
    marks: [
      mark('wally', [1231.2, 510.6], [1235, 514.5], 'sit', 'in the deck chair, binoculars up, watching the Anthill'),
      mark('player', [1235, 514.5], [1231.2, 510.6], 'stand', 'climbs out of the cart, dusty'),
    ],
    cameras: [
      cam('chair', [1238, 1.6, 520], [1231, 1, 510.5], 'onto Wally in his chair, the tower behind', 44),
      cam('runway', [1286, 1.2, 470], [1300, 1.5, 440], 'from the runway edge onto the plane at the threshold', 50),
    ],
    walks: [],
    vehicles: [
      car('wally-plane', 'parked', 'plane', [1300, 430], 0, 'wally', 'on the runway threshold, nose south, engine warm'),
    ],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> this row's quest ids. */
export const USES: Record<string, string[]> = {
  betony: [P3, FINAL],
};
