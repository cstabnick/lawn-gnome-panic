// Saltbucket Shore's coast (E11, coast/): the Spokewheel platform where Marram Teaspoon gives 'The Wobbly Gondola', the
// Last Tube hut where Driftwood gives 'Tubing the Long Spoon', and the foot of Long Spoon Pier for Captain Bilge's two
// quests (her cabin is an interior; her scenes play on the pier). Conventions and types: ../stages.ts and ./kit.ts.
import { cam, mark, type Stage } from './kit';

export const COAST_STAGES: readonly Stage[] = [
  {
    id: 'coast-spokewheel',
    name: 'Saltbucket Shore, the Spokewheel platform',
    region: 'south-shore',
    center: [-252, 1112],
    radius: 12,
    facing: 0,
    time: 'day',
    built: 'existing',
    givers: ['coast-spokewheel'],
    usedBy: ['coast-spokewheel-gondola'],
    look: 'The Spokewheel turning over the boardwalk, twelve bright gondolas, a brass bell on the boarding platform.',
    sounds: 'Gears, the bell, surf behind the stalls, gulls on the rail.',
    marks: [
      mark('marram', [-252, 1112], [-258, 1116], 'stand', 'at the boarding rail, one hand on the bell rope'),
      mark('player', [-258, 1116], [-252, 1112], 'stand', 'walks along the boardwalk to the platform'),
    ],
    cameras: [
      cam('platform', [-258, 1.6, 1117], [-252, 1.6, 1112], 'from the boardwalk onto Marram at the rail'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'coast-last-tube',
    name: 'Saltbucket Shore, the Last Tube',
    region: 'south-shore',
    center: [156, 1152],
    radius: 10,
    facing: Math.PI,
    time: 'day',
    built: 'existing',
    givers: ['coast-last-tube'],
    usedBy: ['coast-boardwalk-tubing'],
    look: "Driftwood's driftwood hut on the beach, a rack of tubes and skis, his tow boat bobbing out past the surf.",
    sounds: 'Surf, a rope slapping a rail, a gull arguing.',
    marks: [
      mark('driftwood', [158, 1154], [158, 1160], 'stand', 'by the rack, squinting out to sea for lawn sharks'),
      mark('player', [158, 1160], [158, 1154], 'stand', 'comes down the beach to the rack'),
    ],
    cameras: [
      cam('rack', [162, 1.6, 1161], [158, 1.5, 1154], 'from the sand onto Driftwood by the rack'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'coast-pier',
    name: 'Saltbucket Shore, the foot of Long Spoon Pier',
    region: 'south-shore',
    center: [300, 1168],
    radius: 10,
    facing: Math.PI,
    time: 'golden',
    built: 'existing',
    givers: ['coast-bathtub-queen'],
    usedBy: ['coast-bathtub-tours', 'coast-queens-treasure'],
    look: 'The pier running out to a toy pirate ship, a chalked board of tour times, the Saltwater glittering past the rail.',
    sounds: 'Planks, rope, surf, the ship\'s bell.',
    marks: [
      mark('bilge', [300, 1168], [300, 1175], 'stand', 'at the head of the pier, with a chalk board and a very large hat'),
      mark('player', [300, 1175], [300, 1168], 'stand', 'walks up from the beach'),
    ],
    cameras: [
      cam('pier', [303, 1.6, 1176], [300, 1.6, 1168], 'from the beach end of the pier onto Bilge at the chalk board'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];
