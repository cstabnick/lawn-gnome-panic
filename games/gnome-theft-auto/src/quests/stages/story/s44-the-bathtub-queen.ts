// Story row 44 (m44-the-bathtub-queen): the stages its scenes play on. Three new places: the tour board at the foot of Long Spoon Pier
// (the giver `bilge-tour-board`), the Bathtub Queen's deck (E11: a walkable rooftop at y -3.0; marks stand on it with `lift`, and the
// scenes place actors at exact heights), and the barge far out on the Saltwater (cutscene-only: a watering-can steamer with two
// sleeping deckhands, a stack of blade crates, and the Queen's tender alongside). The HOA gunboat is only in the mid scene.
import { car, cam, mark, type Stage } from '../kit';

export const STAGES: readonly Stage[] = [
  {
    id: 'm44-pier-board',
    name: "Captain Bilge's tour board, the foot of Long Spoon Pier",
    region: 'south-shore',
    center: [306, 1172],
    radius: 8,
    facing: Math.PI,
    time: 'golden',
    built: 'existing',
    givers: ['bilge-tour-board'],
    usedBy: ['m44-the-bathtub-queen'],
    look: 'A chalked board of tour times at the beach end of the pier, the toy pirate ship lit by the low sun beyond it, a gull on the board.',
    sounds: 'Planks, rope, surf, the ship\'s bell, a tour guide booming a long way off.',
    marks: [
      mark('player', [306, 1172], [300, 1200], 'stand', 'reads the board and hears a captain booming out on the water'),
    ],
    cameras: [
      cam('board', [311, 1.7, 1166], [306, 1.4, 1172], 'from the beach onto the player at the board', 46),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'm44-queen-deck',
    name: "The Bathtub Queen's deck, aft of the main mast",
    region: 'south-shore',
    center: [296, 1266],
    radius: 12,
    facing: Math.PI / 2,
    water: true,
    time: 'golden',
    built: 'existing',
    usedBy: ['m44-the-bathtub-queen'],
    look: "A toy pirate ship's deck: a helm, a stern cabin, a tour group, a toy cutlass; at night, hung lanterns, a blade crate and the main mast going up into the stars.",
    sounds: 'Rope, wood, small waves against the hull, a ship\'s bell, a crowd that wants to be told a lie.',
    marks: [
      mark('samphire', [291, 1265.2], [297, 1265.2], 'stand', 'at the helm, a toy cutlass on her belt, booming at her tour group', 6),
      mark('player', [298.4, 1262.6], [291, 1265.2], 'stand', 'steps off the gangplank into the back of the tour group', 6),
      mark('driftwood', [296.2, 1270], [291, 1265.2], 'stand', 'on the deck at night, wet to the knees, one boot on the blade crate', 6),
    ],
    cameras: [],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'm44-barge-night',
    name: 'An HOA barge on the Saltwater at night',
    region: 'south-shore',
    center: [122, 1452],
    radius: 16,
    facing: Math.PI / 2,
    water: true,
    time: 'night',
    built: 'new',
    usedBy: ['m44-the-bathtub-queen'],
    look: 'A black watering-can steamer lying still with a lamp at the stern, two deckhands asleep under their hats, three blade crates stencilled with a hat the wrong way up, and a gravy-boat tender sliding in under the stern.',
    sounds: 'Water slapping a hull, a snore, a rope creaking, a gulls-only silence, then a siren.',
    marks: [],
    cameras: [],
    walks: [],
    vehicles: [
      car('barge', 'parked', 'watering-can-steamer', [107, 1452], -Math.PI / 2, undefined, 'the third barge, bow west, stern lamp lit'),
      car('tender', 'pull-up', 'gravy-boat', [124, 1458], -Math.PI / 2, 'samphire', "the Queen's tender easing in under the stern"),
      car('launch', 'parked', 'clog-cruiser', [118, 1447], -Math.PI / 2, undefined, "the barge's own cargo launch, tied at the stern"),
    ],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Record<string, string[]> = {
  'coast-pier': ['m44-the-bathtub-queen'],
};
