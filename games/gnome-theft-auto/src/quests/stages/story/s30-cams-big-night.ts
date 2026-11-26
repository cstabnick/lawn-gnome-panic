// Story row 30 (Cam's Big Night): the Side-Valve apron at dusk (the entry slip) and at night (the envelope), and the
// Lost & Found Speedway's finish line under the floodlights (Cam's last place). The existing Speedway pit stage is the
// race desk; the finish line is its own stage because nobody ever stood on the track at night for a scene.
import { cam, car, mark, type Stage } from '../kit';

const ROW = ['m30-cams-big-night'];

export const STAGES: readonly Stage[] = [
  {
    id: 'side-valve-apron',
    name: 'Side-Valve Salvage, the apron by the storeroom door',
    region: 'turfton',
    center: [-151, 68],
    radius: 14,
    facing: Math.PI,
    time: 'dusk',
    built: 'existing',
    usedBy: ROW,
    look: 'The concrete apron in front of the bay: the push-broom leaning where it always leans, the storeroom door at the back of the block, the z = 60 road behind a low kerb and the bay lamp the only light left after dark.',
    sounds: 'A broom on concrete, a wind-up mower ticking down, a radio two buildings away, and at night nothing at all.',
    marks: [
      mark('turncoat-cam', [-154.6, 66.4], [-150.8, 66.4], 'stand', 'broom at his side, the entry slip held out and his eyes on the bay, not the person'),
      mark('player', [-150.8, 66.4], [-154.6, 66.4], 'stand', 'on the apron, asked a favour by someone who never asks'),
      mark('turncoat-cam', [-153.4, 72.4], [-149.4, 72.4], 'stand', 'home from the Speedway, broom in his hand, hiding nothing yet'),
      mark('player', [-149.4, 72.4], [-153.4, 72.4], 'stand', 'steps off the ride with the engine still ticking'),
      mark('beige-vest', [-159.6, 74.2], [-153.4, 72.4], 'stand', 'waits in the dark by the storeroom wall, a beige vest, an envelope held low'),
    ],
    cameras: [
      cam('apron-wide', [-136, 3.4, 58], [-152, 1.2, 68], 'establishing: the apron from the road, the bay lit on the left'),
      cam('apron-night', [-140, 2.6, 62], [-154, 1.3, 73], 'across the apron at night to the storeroom wall and the dark beyond it'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'speedway-finish-night',
    name: 'Lost & Found Speedway, the finish line at night',
    region: 'dust-flats',
    center: [742, -362],
    radius: 22,
    facing: Math.PI / 2,
    time: 'night',
    built: 'existing',
    usedBy: ROW,
    look: 'The main straight under the floodlights: the chequered gantry over the line, tyre stacks in red and white down both sides, the pit wall in the dark behind them and a lowrider parked on the line with its headlights on.',
    sounds: 'Floodlights buzzing, a cooling engine ticking, the grandstand emptying, someone laughing a long way before they stop.',
    marks: [
      mark('cam', [742.4, -361.4], [748, -358.4], 'stand', 'climbed off a racing mower, broom in hand, last on the board'),
      mark('lulu', [748, -358.4], [742.4, -361.4], 'lean', 'against her lowrider, thumbs in her belt, laughing before she has a reason'),
      mark('player', [738, -359], [744, -361], 'stand', 'at the line, helmet off, the support stint over'),
    ],
    cameras: [
      cam('finish-wide', [708, 3.6, -371], [740, 1.6, -362], 'establishing: the straight and the gantry lit, the mower a long way down the track'),
      cam('line-low', [732, 0.9, -355.6], [744, 1.3, -361], 'low across the finish line onto the two of them and the lowrider behind'),
    ],
    walks: [],
    vehicles: [
      car('speedway-finish-lowrider', 'parked', 'lowrider', [750.5, -356.6], Math.PI / 2, 'lulu', 'Lulu\'s lowrider parked on the line, headlights on'),
      car('speedway-finish-mower', 'pull-up', 'ride-on', [744, -363.4], Math.PI / 2, 'cam', 'Cam\'s entry, coasting over the line last'),
    ],
    paths: [
      { id: 'cam-finish-run', role: 'arrival', kind: 'ride-on', points: [[684, -362.4], [712, -362.4], [744, -363.4]], offRoad: true, note: 'down the main straight to the line' },
    ],
    set: [],
  },
];

/** Existing stage id -> this row's quest id: Cam asks at Side-Valve's bay and the race is run from the pit lane. */
export const USES: Readonly<Record<string, readonly string[]>> = {
  'side-valve-bay': ROW,
  'speedway-pits': ROW,
};
