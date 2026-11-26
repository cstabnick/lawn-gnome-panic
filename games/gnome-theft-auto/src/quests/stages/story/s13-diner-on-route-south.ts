// Story row 13 (Diner on Route South): the diner at the lunch rush, with its tables and its outdoor counter.
// The Side-Valve bay (Tansy's intro) is an existing stage; the diner's own stage (south-highway-diner) is Vesper's booth.
import { cam, car, mark, type Stage } from '../kit';

const ROW = ['m13-diner-on-route-south'];
const CHAIR_L = Math.PI / 2;
const CHAIR_R = -Math.PI / 2;

/** One cafe table with a chair either side, the way the booth stands. */
const table = (x: number, z: number) => [
  { prefab: 'gsr-cafe-table', at: [x, z] as const, yaw: 0, scale: 1.2 },
  { prefab: 'chair', at: [x - 1.3, z] as const, yaw: CHAIR_L, scale: 1.4 },
  { prefab: 'chair', at: [x + 1.3, z] as const, yaw: CHAIR_R, scale: 1.4 },
];

export const STAGES: readonly Stage[] = [
  {
    id: 'diner-rush',
    name: 'The Route South Acorn Diner at the lunch rush',
    region: 'cloverfield-farms',
    center: [14, 262],
    radius: 26,
    facing: -Math.PI / 2,
    time: 'day',
    built: 'dressed',
    usedBy: ROW,
    look: 'The acorn-shell diner at noon with every outdoor table laid, a snail-coach pulling in on the highway, the pass window steaming, and Frank\'s stool pulled up to a little outdoor counter by the front.',
    sounds: 'Plates, a pass bell, a coach engine ticking over, forty gnomes ordering soup, cicadas under all of it.',
    marks: [
      mark('sage', [8.2, 254.4], [3.8, 255.6], 'work', 'at the front door with a tray stacked high, plating as she talks'),
      mark('player', [3.8, 255.6], [8.2, 254.4], 'stand', 'arrives with a clipboard-sized ticket and no appetite'),
      mark('frank', [4.4, 263.7], [4.4, 261.2], 'sit', 'on his stool at the outdoor counter, a cocoa and a grass blade'),
      mark('player', [7.4, 261.6], [4.4, 263.7], 'stand', 'at the counter, hat in hand'),
    ],
    cameras: [
      cam('wide', [-8, 3.2, 246], [9, 1.4, 256], 'establishing: the front of the diner, the tables beyond and the highway on the left'),
      cam('counter', [9.6, 1.7, 267.6], [4.4, 1.2, 262.6], 'across the outdoor counter onto Frank and the lit window'),
    ],
    walks: [],
    vehicles: [
      car('rush-coach-pull-up', 'pull-up', 'snail-coach', [-2.5, 266], 0, undefined, 'the noon coach stops on the highway beside the diner and empties'),
    ],
    paths: [
      { id: 'rush-coach-arrival', role: 'arrival', kind: 'snail-coach', points: [[-2.5, 196], [-2.5, 236], [-2.5, 266]], note: 'down the highway from the north, to the diner kerb' },
    ],
    set: [
      ...table(28.5, 262),
      ...table(35, 262),
      ...table(15, 268.5),
      ...table(22.5, 268.5),
      ...table(30, 268.5),
      // The outdoor counter by the front: a table with three stools, Frank's the middle one.
      { prefab: 'gsr-cafe-table', at: [4.4, 262], yaw: 0, scale: 1.2, solid: [0.6, 0.6, 0.9] },
      { prefab: 'bar-stool', at: [4.4, 263.7], yaw: 0 },
      { prefab: 'bar-stool', at: [2.7, 262], yaw: 0 },
      { prefab: 'bar-stool', at: [6.1, 262], yaw: 0 },
    ],
  },
];

/** Existing stage id -> this row's quest id: Tansy gives the errand at her bay. */
export const USES: Readonly<Record<string, readonly string[]>> = {
  'side-valve-bay': ROW,
};
