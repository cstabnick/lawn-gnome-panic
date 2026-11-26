// Story row 5 (Sweeper's Wages): the stages its scenes play on, and extra quest ids for existing stages' usedBy.
// The intro and outro stand on side-valve-bay (turfton.ts); the night meet is new here (E26's Skyway meet, MEETS['skyway-foot']).
import { cam, car, mark, type Stage } from '../kit';

export const STAGES: readonly Stage[] = [
  {
    id: 'skyway-night-meet',
    name: 'The Skyway Foot, the Carburettors\' Night Meet',
    region: 'mossy-wood',
    center: [-292, -58],
    radius: 20,
    facing: Math.PI / 2,
    time: 'night',
    built: 'existing',
    usedBy: ['m05-sweepers-wages'],
    look: 'Open ground under the west foot of the Skyway at night: lowriders idling on their headlights, a rope of fairy lights strung across the start line and a thermos on a bonnet.',
    sounds: 'Engines burbling, a radio on the wrong station, tyres on cold tarmac, Lulu\'s laugh arriving early.',
    marks: [
      mark('lulu', [-279.5, -56.4], [-283.2, -55.2], 'stand', 'steps out of her orange lowrider at the finish, thumbs hooked in her belt'),
      mark('player', [-283.2, -55.2], [-279.5, -56.4], 'stand', 'at the finish line with the carburettor in both hands'),
      mark('turncoat-cam', [-286.4, -54.2], [-282, -58.5], 'stand', 'at the edge of the lights, push-broom in both hands, eyes on the track'),
      mark('carburettor-rival', [-306, -62.5], 0, 'drive', 'a Carburettors rival revving on the start line'),
    ],
    cameras: [
      cam('wide', [-294, 4, -46], [-304, 1.2, -58], 'establishing: the lights, the engines and the Carburettors under the Skyway'),
      cam('from-the-line', [-283, 1.4, -52], [-290, 1, -58.5], 'behind the spectators at the finish, the track running away west'),
    ],
    walks: [],
    vehicles: [
      car('lulu-lowrider', 'parked', 'lowrider', [-306, -58.5], Math.PI / 2, 'lulu', 'Lulu\'s orange lowrider with the charter plate on the back, headlights on'),
      car('rival-lowrider', 'parked', 'lowrider', [-306, -62.5], Math.PI / 2, undefined, 'a rival Carburettor on the start line'),
    ],
    paths: [
      { id: 'heat-run', role: 'chase', kind: 'lowrider', points: [[-306, -58.5], [-274, -58.5]], offRoad: true, note: 'the heat: a short sprint east along the foot of the Skyway' },
    ],
    set: [],
  },
];

/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {
  'side-valve-bay': ['m05-sweepers-wages'],
};
