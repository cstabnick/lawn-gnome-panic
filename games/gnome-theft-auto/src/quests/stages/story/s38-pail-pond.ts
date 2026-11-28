// Story row 38 (m38-pail-pond): the stages its scenes play on, and the quest ids added to existing stages' usedBy. Two new
// places: the back of the Woolly Sock Lodge (the west wall faces Pail Pond, a pale patch in the distance) and the porch at
// dusk, where the stove stands. Pail Pond itself (Theo's shanty, the three holes, the bears) is the area's: the quest only
// points at it, and the shanty's own stage `theo-pond` gets this id for the comms step.
import { cam, mark, type Stage } from '../kit';

export const STAGES: readonly Stage[] = [
  {
    id: 'lodge-back-table',
    name: 'The back of the Woolly Sock Lodge, a mug on the table',
    region: 'north-highlands',
    center: [-464, -1020],
    radius: 8,
    facing: -Math.PI / 2,
    time: 'day',
    built: 'existing',
    usedBy: ['m38-pail-pond'],
    look: 'The lodge west wall with a table dragged against it, a hot mug on the table and a long view over open snow to the pale patch of Pail Pond in the distance.',
    sounds: 'Pale wind over the snow, a mug put down hard, a kettle somewhere inside, the ice making very small noises.',
    marks: [
      mark('gentian', [-463, -1019], [-465.5, -1022.5], 'stand', 'planting a mug on the table with the whole forearm'),
      mark('player', [-465.5, -1022.5], [-463, -1019], 'stand', 'takes the mug in both hands'),
      mark('pip', [-461, -1023.5], [-463, -1019], 'stand', 'already holding two mugs and eyeing the third'),
    ],
    cameras: [
      cam('wide', [-452, 4.4, -1004], [-466, 1.4, -1021], 'establishing: the three of them at the lodge wall, the snow opening out to the west'),
      cam('pond', [-466, 1.9, -1016.5], [-580, 3, -1050], 'from beside the table out over the snow to the pale patch of Pail Pond', 40),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'lodge-stove-dusk',
    name: 'The Woolly Sock Lodge porch at dusk, the stove going',
    region: 'north-highlands',
    center: [-434, -1021],
    radius: 9,
    facing: Math.PI / 2,
    time: 'golden',
    built: 'existing',
    usedBy: ['m38-pail-pond'],
    look: 'The porch in the last light: a pot-belly stove glowing by the door, a crate with a frosted radio drying on it, a line of woolly socks steaming overhead and the first lamp lit in the lodge window.',
    sounds: 'Stove ticking, socks dripping, wind-chime ski poles, static that is slowly turning into a voice.',
    marks: [
      mark('gentian', [-435.5, -1024], [-433.4, -1019.4], 'stand', 'arms folded, a drying sock over one shoulder like a scarf'),
      mark('pip', [-431.4, -1018.6], [-434.4, -1019.2], 'kneel', 'on one knee beside the crate with a stub of charcoal and a sock'),
      mark('player', [-430.8, -1022.6], [-434.4, -1019.2], 'stand', 'warming both hands at the stove'),
    ],
    cameras: [
      cam('wide', [-416, 3.0, -1008], [-436, 1.4, -1020], 'establishing: the porch glowing against the blue snow, the line of socks, the stove'),
      cam('radio', [-431.8, 0.9, -1016.8], [-435.4, 0.5, -1019.4], 'low over the crate onto the frosted radio, the stove glow behind it', 44),
      cam('socks', [-430, 1.3, -1024.5], [-438, 2.2, -1019], 'along the line of drying socks to the lit window'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> this row's quest ids. */
export const USES: Record<string, string[]> = {
  gentian: ['m38-pail-pond'],
  'theo-pond': ['m38-pail-pond'],
};
