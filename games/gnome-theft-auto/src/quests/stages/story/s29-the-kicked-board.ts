// Story row 29 (The Kicked Board): the stages its scenes play on (new ones), and extra quest ids for existing stages' usedBy.
// - frank-sign-road: Fence-Post Frank at his hand-painted welcome sign on the south highway (the giver `frank-sign` stands
//   at his shack door, E10 homeDoor('frank')). The intro (dawn) and the outro (day) stand here.
// - hedgeworth-ninth-fairway: the first sight of Hedgeworth, inside the Kicked Board, on the fairway of the hole the card
//   calls the ninth. Thrift Hosepipe waters it; Dame Peony is glimpsed far off on the clubhouse terrace (her own spot is the
//   existing `peony` stage), so she has no mark here.
import { cam, mark, type Stage } from '../kit';

const ROW = ['m29-the-kicked-board'];

export const STAGES: readonly Stage[] = [
  {
    id: 'frank-sign-road',
    name: "Fence-Post Frank's welcome sign, Route South",
    region: 'cloverfield-farms',
    center: [-2, 260],
    radius: 12,
    facing: Math.PI / 2,
    time: 'dawn',
    built: 'dressed',
    givers: ['frank-sign'],
    usedBy: ROW,
    look: 'The hand-painted welcome sign on the verge of the south highway, a bucket of golf balls at its foot, a grass blade, a road with a pale new ball in the middle of it and the sun just clearing the canal.',
    sounds: 'Cicadas starting up, a rooster a long way off, a tyre hum, and a small hard tock from somewhere over the western fence.',
    marks: [
      mark('frank', [-7.7, 259.4], Math.PI / 2, 'lean', 'leans on his hand-painted sign, blade of grass shifted to the far side of his mouth'),
      mark('player', [1.8, 262.6], [-7.7, 259.4], 'stand', 'pulls up on foot at the road edge, a ball rolling to a stop at their boot'),
    ],
    cameras: [
      cam('sign-wide', [-16, 2.6, 268], [-3, 0.9, 260.5], 'establishing: the sign and the verge in dawn light, the road beyond with a ball in it', 52),
      cam('road-low', [-2.5, 0.5, 272], [-2.5, 0.4, 263.5], 'ground level on the road: where the golf ball lands', 40),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [
      { prefab: 'lost-ball-bucket', at: [-9.9, 262.2], yaw: Math.PI / 2, scale: 1.6 },
      { prefab: 'golf-ball', at: [-6.6, 266.2], yaw: 0, scale: 6 },
      { prefab: 'golf-ball', at: [-9.2, 267.6], yaw: 0, scale: 6 },
      { prefab: 'golf-ball', at: [-8.3, 252.4], yaw: 0, scale: 6 },
    ],
  },
  {
    id: 'hedgeworth-ninth-fairway',
    name: 'Hedgeworth Links, the ninth fairway inside the Kicked Board',
    region: 'west-estates',
    center: [-1030, 636],
    radius: 18,
    facing: -Math.PI / 2,
    time: 'day',
    built: 'existing',
    usedBy: ROW,
    look: 'A hush of mown grass past the broken board: stripes, a sprinkler ticking, hedges like walls with leaves, a clubhouse far off with a figure on its terrace, and a groundskeeper on his knees talking to the lawn.',
    sounds: 'A sprinkler hiss, clippers somewhere, a tock a long way off, and Thrift murmuring to the fairway in a voice he does not use on people.',
    marks: [
      mark('thrift', [-1034, 640], [-1019, 637], 'stand', 'bent over the damp fairway with his watering can, talking to the grass'),
      mark('player', [-1019, 637], [-1034, 640], 'stand', 'steps off the broken board onto the stripes'),
    ],
    cameras: [
      cam('fairway-low', [-1008, 0.55, 633], [-1034, 0.9, 640], 'ground level through the blades onto Thrift and the fairway: the Hedgeworth signature shot', 40),
      cam('board-wide', [-1019, 3.2, 650], [-1000, 1.2, 640], 'looking back at the fence and the Kicked Board standing open', 50),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> this row's quest id. The golf side-quest stages share the people the main quest meets. */
export const USES: Readonly<Record<string, readonly string[]>> = {
  peony: ROW,
};
