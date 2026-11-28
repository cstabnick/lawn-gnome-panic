// Story row 12 (Quarter-Inch at Home): the stages its scenes play on, and the existing stage it also uses (the Patio Gate).
import { cam, mark, type Stage } from '../kit';

const ROW = ['m12-quarter-inch-at-home'];

export const STAGES: readonly Stage[] = [
  {
    id: 'juniper-terrace',
    name: "Juniper's terrace, Kerb Row",
    region: 'turfton',
    center: [-90, 126],
    radius: 14,
    facing: Math.PI,
    time: 'day',
    built: 'dressed',
    givers: ['juniper-terrace'],
    usedBy: ROW,
    look: 'The pavement in front of the narrowest terrace on Kerb Row: a front door with a J. VANCE plate, a council push-bike leaning on the kerb with a parking citation tucked under its saddle, bright morning.',
    sounds: 'A cold can opening, a bin lorry two streets away, the bin lids of Kerb Row all closed on time, a bicycle bell nobody rang.',
    marks: [
      mark('juniper', [-88.4, 127.6], [-91.6, 124.6], 'stand', 'on her own front step with a cold Acorn-Cola, calipers in a folded napkin'),
      mark('player', [-91.6, 124.6], [-88.4, 127.6], 'stand', 'waits on the pavement, a little early'),
    ],
    cameras: [
      cam('wide', [-76, 4.5, 113], [-90, 1.2, 127], 'establishing: the terrace front, the council bike and the two of them on the pavement'),
      cam('two-shot', [-96, 1.6, 121], [-89.5, 1.3, 126.5], 'over the bike onto Juniper and the player'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [
      { prefab: 'push-mower-bike', at: [-96.2, 127.2], yaw: Math.PI / 2, scale: 1.2 },
      { prefab: 'citation-slip', at: [-96.2, 127.2], yaw: Math.PI / 2, scale: 1.2, lift: 0.85 },
    ],
  },
  {
    id: 'townhouse-404',
    name: 'Townhouse 404, front door',
    region: 'turfton',
    center: [101, -133.5],
    radius: 10,
    facing: 0,
    time: 'day',
    built: 'existing',
    usedBy: ROW,
    look: 'The front of Reginald Vance\'s beige townhouse inside the Patio Heights wall: a straight path, a door left exactly ajar, a doormat squared to the step, long afternoon light along the flagstones.',
    sounds: 'A sprinkler on a timer, calipers ticking on a frame, a door settling on its hinge, a far Zero-Turn.',
    marks: [
      mark('reginald', [102.8, -135.3], [102, -137.5], 'work', 'crouched at his own doorframe with the calipers'),
      mark('player', [96.5, -133.4], [102, -136], 'stand', 'watching from the path inside the wall'),
    ],
    cameras: [
      cam('wide', [96, 2.6, -132.4], [102, 1.2, -136.4], 'the front door and the path, low sun along the flagstones'),
      cam('door', [99.4, 1.5, -133.2], [102.4, 1.2, -136.4], 'across the path onto Reginald at the doorframe'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'townhouse-back-fence',
    name: 'Townhouse 404, back fence',
    region: 'turfton',
    center: [95, -165.5],
    radius: 9,
    facing: Math.PI,
    time: 'day',
    built: 'dressed',
    usedBy: ROW,
    look: 'The strip of lawn behind townhouse 404 where it meets the compound wall: pegs and string along the wall foot, a quarter-inch ruler laid against a post, not one blade out of line.',
    sounds: 'Calipers clicking on a post, a hose ticking, a beige curtain moving, the street very far away.',
    marks: [
      mark('reginald', [96.4, -167.0], [92, -167.0], 'work', 'crouched at a fence post with the calipers, measuring the same inch twice'),
      mark('player', [92.8, -165.2], [96.4, -167.2], 'stand', 'at the back fence, caught climbing'),
    ],
    cameras: [
      cam('wide', [88, 3, -158], [95, 1.2, -166], 'the lawn, the wall and the two of them from the house side'),
      cam('two-shot', [91, 1.6, -161.6], [95, 1.3, -166.2], 'over the player onto Reginald at his post'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [
      { prefab: 'ruler-stick', at: [94.2, -167.4], yaw: Math.PI / 2, scale: 1.2 },
    ],
  },
];

/** Existing stage id -> this row's quest id: the Patio Gate hosts the pass check. */
export const USES: Readonly<Record<string, readonly string[]>> = {
  'patio-gate': ROW,
};
