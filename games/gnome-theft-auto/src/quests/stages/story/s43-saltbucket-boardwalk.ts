// Story row 43 (m43-saltbucket-boardwalk): the stages its scenes play on, and the quest ids added to existing stages' usedBy.
// Three new places: the Rutbottom Dirt Bowl gate where Driftwood's phone call finds the player (the giver `driftwood-call`),
// Driftwood on the sand at dawn with the Saltwater behind him (the other end of the call), and the Last Tube hut at dusk with a
// deckchair facing the sea. The Spokewheel platform is E11's own stage `coast-spokewheel` (USES below); the top of the wheel and
// the three barges far out at sea are only in the scenes (exact heights and cutscene-only boats).
import { cam, mark, type Stage } from '../kit';

export const STAGES: readonly Stage[] = [
  {
    id: 'm43-bowl-gate',
    name: "The Rutbottom Dirt Bowl gate, where Driftwood's call arrives",
    region: 'east-campus',
    center: [1000, -650],
    radius: 9,
    facing: 0,
    time: 'golden',
    built: 'existing',
    givers: ['driftwood-call'],
    usedBy: ['m43-saltbucket-boardwalk'],
    look: "The dirt bowl's gate at first light: tyre stacks, a chequered flag gone limp, the road south running off between the dunes.",
    sounds: 'Two-strokes ticking as they cool, a rattle gun somewhere, wind, a phone ringing in a pocket.',
    marks: [
      mark('player', [1000, -650], [1000, -640], 'stand', 'at the gate with a tin-can phone to one ear, facing the road south'),
    ],
    cameras: [
      cam('wide', [991, 3.4, -661], [1000, 1.4, -650], 'establishing: the gate, the player small in it, the bowl behind'),
      cam('road-south', [1000, 1.8, -655], [1006, 1.2, -610], 'from behind the player down the empty road south', 44),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'm43-shore-dawn',
    name: 'Saltbucket Shore at dawn, the other end of the call',
    region: 'south-shore',
    center: [138, 1176],
    radius: 10,
    facing: Math.PI,
    time: 'golden',
    built: 'existing',
    usedBy: ['m43-saltbucket-boardwalk'],
    look: 'The beach west of Long Spoon Pier at sunrise: pale sand running down to the Saltwater, the hut and its tube rack behind, a long low swell, gulls the size of commas.',
    sounds: 'Surf wash, a halyard ticking, gulls, wind in a tin can.',
    marks: [
      mark('driftwood', [138, 1176], [138, 1160], 'stand', 'on the sand with his back to the sea, a tin-can phone in both hands'),
    ],
    cameras: [
      cam('wide', [122, 2.8, 1156], [138, 1.2, 1180], 'establishing: Driftwood small on the sand, the Saltwater filling the frame behind him', 56),
      cam('sea', [150, 1.6, 1166], [136, 1.6, 1196], 'low along the beach to the waterline and the swell', 48),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'm43-tube-hut-dusk',
    name: 'The Last Tube at dusk, a deckchair facing the sea',
    region: 'south-shore',
    center: [149, 1166],
    radius: 10,
    facing: 0,
    time: 'golden',
    built: 'existing',
    usedBy: ['m43-saltbucket-boardwalk'],
    look: "The tube hut with its first stack of tubes and a hand-painted board, a striped deckchair on the sand facing the water, the Saltwater gone copper and rose under a low sun.",
    sounds: 'Surf, a bell far out that is the tide, a rope slapping a rail, no music at all for a while.',
    marks: [
      mark('driftwood', [146.6, 1166.4], [156, 1182], 'sit', 'in the deckchair, hat on his knee, looking out'),
      mark('player', [150.4, 1165.4], [146.6, 1166.4], 'sit', 'on a stack of tubes at his right shoulder'),
    ],
    cameras: [
      cam('wide', [136, 3.0, 1148], [148, 1.0, 1168], 'establishing: the hut, the board, the chair and the water beyond', 54),
      cam('behind', [147, 2.2, 1158], [148, 0.6, 1192], 'from behind the chair out over the two of them to the sea', 46),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Record<string, string[]> = {
  'coast-spokewheel': ['m43-saltbucket-boardwalk'],
  'coast-last-tube': ['m43-saltbucket-boardwalk'],
};
