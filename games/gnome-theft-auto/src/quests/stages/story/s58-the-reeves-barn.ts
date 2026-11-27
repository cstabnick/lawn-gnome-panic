// Story row 58 (The Reeve's Barn): the stages its two scenes play on, both in Pebblewick (outskirts/town.ts, the town at the end of
// Route East) and both new to the story.
// - m58-pebblewick-square (the intro, day): the market square by the wishing well. Reeve Yarrow Potsherd sweeps it with the
//   broom he keeps for the purpose; the HOA's letter is in his other hand, and a row of tin pails waits at the well.
// - m58-barn-yard (the outro, dusk): the Reeve's hay barn, which this row adds to the town for good (the `set` below is built into
//   the world by stageSets.ts): a Windfall-Croft-sized red barn in the open sand north-east of the square, its double doors on
//   the south side, a haystack either side and a bed of hay bales in the yard. The Whirligig sleeps in front of the doors; the
//   tarp (a moss rug, scene-only) goes over the rotor in the scene. Row 61 (Diggs's Medal) shares both: keep the barn at
//   (706, 34), doors on +z, the yard clear south of it down to z 60.
// The tin water tower of the quest (flight target) is the existing `pebblewick-tower` stage; Hangar Two (the impeller) needs no stage.
import { cam, car, mark, type Stage } from '../kit';

const ID = 'm58-the-reeves-barn';

export const STAGES: readonly Stage[] = [
  {
    id: 'm58-pebblewick-square',
    name: 'Pebblewick market square, a day before the water goes',
    region: 'dust-flats',
    center: [676, 101],
    radius: 12,
    facing: Math.PI / 2,
    time: 'day',
    built: 'existing',
    usedBy: [ID],
    look: 'Open sand swept into stripes, the wishing well with a row of empty tin pails on its lip, the notice board at the corner with a new white paper on it, adobe fronts all round and the tin water tower standing up over the roofs to the south-east.',
    sounds: 'A broom on dry sand, a hen, the bell rope creaking in a gust, the Hopper idling by the shelter, a town holding its breath.',
    marks: [
      mark('yarrow', [672.8, 109.6], [677.6, 104.4], 'stand', 'sweeping the square in neat stripes with his broom, the HOA letter folded in his waistcoat'),
      mark('player', [677.8, 104.0], [672.8, 109.6], 'stand', 'walks in from the well side, dust on the boots'),
    ],
    cameras: [
      cam('wide', [690.5, 3.4, 116.5], [674, 1.2, 104], 'from the south-east corner of the square: the swept stripes, the well, Yarrow small and tidy in the middle', 50),
      cam('board', [660.4, 1.7, 112.6], [665.2, 1.6, 116.4], 'from Main Street onto the notice board and the white paper pinned dead centre', 44),
      cam('well', [687, 0.9, 99.5], [683, 0.8, 95], 'low at the wishing well: the row of tin pails, the tower beyond', 46),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'm58-barn-yard',
    name: "The Reeve's hay barn, Pebblewick",
    region: 'dust-flats',
    center: [706, 48],
    radius: 16,
    facing: 0,
    time: 'dusk',
    built: 'dressed',
    usedBy: [ID],
    look: 'A faded red barn with a tin gambrel roof and its double doors ajar, a haystack either side, a bed of hay bales in the yard in front, the tin water tower catching the last gold light to the south, and Pebblewick\'s roofs between.',
    sounds: 'Hay settling, a rotor ticking as it cools, the wind in the tin roof, a hen turning in for the night, and from the square the town bell.',
    marks: [
      mark('yarrow', [699.4, 52.6], [706, 47.4], 'stand', 'upright by the hay with the tarp folded over one arm, the ledger under the other'),
      mark('player', [712.2, 53.6], [706, 47.4], 'stand', 'climbed down from the Whirligig, helmet off, hay on one shoulder'),
    ],
    cameras: [
      cam('wide', [686, 3.6, 70], [706, 1.8, 47], 'from the south-west across the yard: the Whirligig in the hay, the barn behind it, gold light along the roof', 50),
      cam('door', [706, 1.5, 62], [706, 2.0, 40], 'low on the yard from the south: the barn doors, the haystacks either side and the rotor in front of them', 46),
      cam('tower', [690, 6.5, 62], [720, 15, 176], 'long lens north-to-south over the roofs to the tin water tower, lit gold', 28),
    ],
    walks: [],
    vehicles: [
      car('barn-whirligig', 'parked', 'whirligig', [706, 47], 0, undefined, 'landed in the hay in front of the barn doors, rotor winding down'),
    ],
    paths: [],
    set: [
      { prefab: 'croft-barn', at: [706, 34], yaw: 0, scale: 1, solid: [7, 6, 4] },
      { prefab: 'haystack', at: [693.5, 42], yaw: 0.6, scale: 1.2, solid: [1.75, 1.75, 2.4] },
      { prefab: 'haystack', at: [718.5, 42.5], yaw: 2.1, scale: 1.2, solid: [1.75, 1.75, 2.4] },
      { prefab: 'hay-bale', at: [700.2, 44.2], yaw: 0.3, scale: 2.6 },
      { prefab: 'hay-bale', at: [701.9, 45.0], yaw: 1.2, scale: 2.6 },
      { prefab: 'hay-bale', at: [711.8, 44.4], yaw: 0.9, scale: 2.6 },
      { prefab: 'hay-bale', at: [713.4, 45.4], yaw: 2.4, scale: 2.6 },
      { prefab: 'hay-bale', at: [708.6, 53.8], yaw: 0.1, scale: 2.6 },
      { prefab: 'hay-bale', at: [703.2, 52.6], yaw: 1.7, scale: 2.6 },
    ],
  },
];

/** Existing stage id -> this row's quest ids: the flight ends at the tower, the part is fetched at Hangar Two's apron. */
export const USES: Record<string, string[]> = {
  'pebblewick-tower': [ID],
  'airfield-apron': [ID],
};
