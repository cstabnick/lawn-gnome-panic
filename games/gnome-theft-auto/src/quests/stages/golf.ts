// Hedgeworth Links (E15, docs/roadmaps/gta-batch-3/E15): where Thrift Hosepipe, Basil Divot and Dame Peony Gravelrake
// give their side quests (golfQuests.ts). The places are built by golf/ (yard.ts, clubhouse.ts, life.ts).
// Conventions and types: ../stages.ts and ./kit.ts.
import { GOLF_QUESTS } from '../../golf/types';
import { cam, mark, type Stage } from './kit';

export const GOLF_STAGES: readonly Stage[] = [
  {
    id: 'thrift',
    name: "Hedgeworth Links, outside Thrift's shed",
    region: 'west-estates',
    center: [-1057, 611],
    radius: 10,
    facing: -Math.PI / 2,
    time: 'day',
    built: 'existing',
    givers: ['thrift'],
    usedBy: [GOLF_QUESTS.lostBalls, GOLF_QUESTS.ninthGreen],
    look: 'A tin shed with a watering can on the step, a pyramid of lost balls on a window ledge, the ninth green with its sprinkler ticking beside it.',
    sounds: 'A sprinkler hissing, a mower far off, Thrift murmuring to the grass.',
    marks: [
      mark('thrift', [-1057, 611], [-1059, 611], 'stand', 'between the shed door and the green with his watering can'),
      mark('player', [-1059, 611], [-1057, 611], 'stand', 'comes up the cart path from the Kicked Board'),
    ],
    cameras: [
      cam('shed', [-1064, 1.6, 608], [-1057, 1.2, 611], 'from the green side onto Thrift and the shed behind him'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'basil',
    name: 'Hedgeworth Links, the first tee',
    region: 'west-estates',
    center: [-1090, 475],
    radius: 10,
    facing: -Math.PI / 2,
    time: 'day',
    built: 'existing',
    givers: ['basil'],
    usedBy: [GOLF_QUESTS.lesson],
    look: 'A tee sign, a bucket of balls, a bench with a folded towel, and the pro cottage with a rack of clubs beside the door.',
    sounds: 'A club whooshing through nothing, the tock of a ball, Basil humming over a superstition.',
    marks: [
      mark('basil', [-1090, 475], [-1092, 475], 'stand', 'practising his swing toward the fairway'),
      mark('player', [-1092, 475], [-1090, 475], 'stand', 'walks over from the clubhouse terrace'),
    ],
    cameras: [
      cam('tee', [-1085, 1.6, 479], [-1090, 1.2, 475], 'from behind the tee onto Basil and the fairway beyond'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'peony',
    name: 'Hedgeworth Links, the clubhouse terrace',
    region: 'west-estates',
    center: [-1060, 462],
    radius: 10,
    facing: 0,
    time: 'day',
    built: 'existing',
    givers: ['peony'],
    usedBy: [GOLF_QUESTS.membersCup, GOLF_QUESTS.promise],
    look: 'A mock-Tudor clubhouse, striped parasols over tea tables, a driver propped like a cane against the rail.',
    sounds: 'A teaspoon on china, distant polite applause, a pigeon being ignored.',
    marks: [
      mark('peony', [-1060, 462], [-1060, 464], 'stand', 'on the terrace, leaning on her driver'),
      mark('player', [-1060, 464], [-1060, 462], 'stand', 'climbs the terrace steps'),
    ],
    cameras: [
      cam('terrace', [-1056, 1.6, 468], [-1060, 1.2, 462], 'from the lawn onto Peony with the clubhouse behind her'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];
