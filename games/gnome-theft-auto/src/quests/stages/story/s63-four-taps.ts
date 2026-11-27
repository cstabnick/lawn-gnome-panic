// Story row 63 (Four Taps): the stages its scenes stand on. The Mulch Club's side door is the existing stage (row 11 drew it; this
// row's intro and outro stand on its marks, the Don in the doorway and Big Lou beside him). The new one is Café Pardon's terrace on
// Teacup Row in Pardonlin (E30: pardonlin/districts/teacupQuays.ts): the gramophone table, a second table by the door, the bakery's
// queue posts across the lane. R-234: the Mayor sits out his second coat here, where no HOA letter can be served past the Wickets
// (R-183). All dressing (a drying rack, the cold coffee, the paper on the Club's step) is scene `props`: nothing is built into the world.
import { cam, mark, type Stage } from '../kit';

export const STAGES: readonly Stage[] = [
  {
    id: 'cafe-pardon-terrace',
    name: 'Café Pardon, the terrace on Teacup Row',
    region: 'pardonlin',
    center: [-1523.5, 144],
    radius: 9,
    facing: Math.PI / 2,
    time: 'day',
    built: 'existing',
    usedBy: ['m63-four-taps'],
    look: 'A narrow pedestrian lane in full noon sun: the café front with its pale-pink wall and plaque on the west side, a small round terrace table with a gramophone on it and green chairs, topiary spirals in pots, the bakery queue posts across the lane, and the whole row very quiet and very polite.',
    sounds: 'A gramophone playing something slow from the terrace table, a spoon in a cup somewhere, bicycle bells, pigeons on the cobbles, the clean click of a waiter who is not coming.',
    marks: [
      mark('mayor-mulch', [-1523.9, 144.4], [-1523.1, 147.9], 'stand', 'beside the gramophone table in the full sun, both arms held a little out from his sides so nothing touches his second coat, hat tilted to the light'),
      mark('hector', [-1527.1, 151.5], [-1524.9, 149.7], 'stand', 'at the door end of the terrace with a tray and a clean cloth, gliding on a path that never quite reaches a table'),
      mark('player', [-1523.1, 147.9], [-1523.9, 144.4], 'stand', 'walks in across the lane from the cobbles, hat on, a very long drive behind them'),
    ],
    cameras: [
      cam('wide', [-1521.4, 2.6, 130.8], [-1525.2, 1.1, 144.6], 'down the lane from the north: the terrace, the gramophone table and the Mayor in his sun, the queue posts at the edge of the frame'),
      cam('terrace', [-1520.3, 1.6, 152.6], [-1525.4, 1.2, 144.2], 'low from across the lane, onto the table, the chairs and the café front'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> this row's quest ids: the Mulch Club's side door, where row 11 stood. */
export const USES: Record<string, string[]> = { 'mulch-club-door': ['m63-four-taps'] };
