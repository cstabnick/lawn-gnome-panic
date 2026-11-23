// The Lost & Found Speedway (raceTrack/track.ts): the pit lane race desk and the start grid. Conventions and types:
// ../stages.ts and ./kit.ts. The race scenes themselves are cutscene/scenes/speedway.ts.
import { cam, car, mark, type Stage } from './kit';

export const SPEEDWAY_STAGES: readonly Stage[] = [
  {
    id: 'speedway-pits',
    name: 'Lost & Found Speedway, pit lane and grid',
    region: 'dust-flats',
    center: [742, -380],
    radius: 45,
    facing: 0,
    time: 'day',
    built: 'existing',
    givers: ['speedway'],
    usedBy: ['race-rookie-mowdown', 'race-lowrider-derby', 'race-snail-endurance', 'race-fizz-cup-final'],
    look: 'A paved circuit on the alkali pan: a chequered gantry over the start line, a Tall-One ruler for a pit wall, pit garages and a pink Pay \'n\' Glaze on the apron, a podium behind the race desk, and grandstands built from a giant book stack and a sneaker packed with fans.',
    sounds: 'Crowd murmur from the grandstands, idling mowers on the grid, Burdock\'s whistle, tyres squealing out of the last corner.',
    marks: [
      mark('burdock', [742, -393], [742, -380], 'stand', 'at the race desk with his chequered tea towel over one shoulder'),
      mark('player', [742, -388], [742, -393], 'stand', 'walks up the pit lane to the desk'),
      mark('pit-crew', [723, -393], [723, -385], 'work', 'kneels by a tyre stack in front of a garage'),
    ],
    cameras: [
      cam('desk', [742, 1.6, -385], [742, 1.3, -393], 'from the pit lane onto Burdock at the desk, the podium behind him'),
      cam('grid', [700, 3, -356], [725, 1, -361], 'from the outside of the main straight down the grid to the gantry'),
    ],
    walks: [
      { who: 'pit-crew', points: [[723, -393], [732, -393]], loop: false, speed: 1.1, pauseS: 4, activity: 'rolls a tyre between two garages' },
    ],
    vehicles: [
      car('speedway-pull-up', 'pull-up', 'ride-on', [760, -386], Math.PI / 2, undefined, 'stops in the pit lane by the garages'),
      car('speedway-exit', 'exit', 'ride-on', [800, -384], Math.PI / 2, undefined, 'out of the pit lane towards turn one'),
    ],
    paths: [
      { id: 'approach', role: 'approach', kind: 'ride-on', points: [[790, 48], [798, -100], [792, -220], [783, -338], [783, -355]], offRoad: true, note: 'north up the dirt road from the east-outer highway onto the main straight' },
    ],
    set: [],
  },
];
