// Story row 47 (Hedgeworth Links): the stages its scenes play on. Two new places at the clubhouse: the veranda (the
// intro, by day: Dame Peony on the terrace with a drink, the Tea Trestle's untouched cake behind her) and the putting lawn
// just south of it (the outro, at dusk: Basil putting the last putt over again). Both sit on the E15 terrace and lawn;
// the first tee (existing `basil` stage) and the shed (`thrift`) carry the quest's walking steps.
import { cam, mark, type Stage } from '../kit';

const ROW = ['m47-hedgeworth-links'];

export const STAGES: readonly Stage[] = [
  {
    id: 'hedgeworth-veranda',
    name: 'Hedgeworth Clubhouse, the veranda by day',
    region: 'west-estates',
    center: [-1060, 464],
    radius: 12,
    facing: 0,
    time: 'day',
    built: 'dressed',
    usedBy: ROW,
    look: 'A mock-Tudor terrace with striped parasols and a tea trestle laid for a party nobody has come to, a cake under a cloche, and a tweed dame with a drink in her hand and a driver for a cane.',
    sounds: 'A teaspoon on china, a pigeon being ignored, a far tock from the first tee, polite applause for nothing.',
    marks: [
      mark('peony', [-1060, 462], [-1060, 466], 'stand', 'at the head of the terrace steps with a drink, the driver propped on the rail beside her'),
      mark('player', [-1059, 466.4], [-1060, 462], 'stand', 'climbs the steps and stops two paces from her'),
      mark('basil', [-1066.4, 467.6], [-1060, 462], 'stand', 'arrives from the first tee with a club under one arm, rolling his shoulders'),
    ],
    cameras: [
      cam('veranda-wide', [-1044, 2.7, 474], [-1060, 1.3, 462], 'establishing: the terrace, the parasols, the clubhouse front and the trestle with its cake', 52),
      cam('veranda-low', [-1064.6, 0.6, 468.6], [-1060.4, 1.2, 462.4], 'low across the tea trestle onto Peony, the glass in her hand catching the light', 38),
      cam('tee-away', [-1062, 2.0, 460], [-1086, 1.2, 478], 'from the terrace along the lawn to the first tee: where Basil comes from and goes back to', 46),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [{ prefab: 'tea-trestle', at: [-1053.4, 460.8], yaw: 0 }],
  },
  {
    id: 'hedgeworth-putting-lawn',
    name: 'Hedgeworth Clubhouse, the putting lawn at dusk',
    region: 'west-estates',
    center: [-1064, 474],
    radius: 10,
    facing: -Math.PI / 2,
    time: 'dusk',
    built: 'dressed',
    usedBy: ROW,
    look: 'The strip of mown lawn below the terrace in low gold light: a flagstick, the long shadow of a pro bent over a ball, the clubhouse windows lit, a tweed dame at the edge with her driver planted.',
    sounds: 'Crickets, a ball tapped across turf, a sprinkler ticking far off, Basil muttering at a hole.',
    marks: [
      mark('basil', [-1064.6, 475.2], [-1070.4, 476.6], 'work', 'bent over his ball on the lawn, scowling down the line at the flagstick'),
      mark('peony', [-1057.6, 471.4], [-1064.6, 475.2], 'stand', 'planted at the edge of the lawn, the driver in both hands like a sceptre'),
      mark('player', [-1060, 478.4], [-1064.6, 475.2], 'stand', 'walks up from the fairway and stops beside her'),
    ],
    cameras: [
      cam('lawn-wide', [-1046, 2.6, 488], [-1064, 0.9, 475], 'establishing: the lawn at dusk, three figures and a flag, the clubhouse lit behind them', 50),
      cam('cup-low', [-1065.4, 0.34, 479.6], [-1070.4, 0.2, 476.6], 'ground level across the grass toward the flagstick: the putt rolls through frame', 34),
      cam('putter-high', [-1061.4, 2.2, 472], [-1064.6, 0.3, 475.2], 'over Peony onto Basil and his ball from above and behind', 42),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [{ prefab: 'golf-flagstick', at: [-1070.4, 476.6], yaw: 0 }],
  },
];

/** Existing stage id -> this row's quest id: the first tee (the hole) and Thrift's shed (the tour). */
export const USES: Record<string, string[]> = { peony: ROW, basil: ROW, thrift: ROW };
