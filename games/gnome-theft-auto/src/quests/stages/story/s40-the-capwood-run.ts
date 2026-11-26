// Story row 40 (m40-the-capwood-run): the stages its scenes play on. Two places: the start line of the Capwood Run in the Fells
// paddock (E14, giver `capwood-lulu` at (80, -758); the road starts at (90, -746) and runs north up the mountain, so the grid
// faces -z) and the Great Ring clearing in Capwood (GREAT_RING (150, -1125), sixteen glowing toadstool lamps at r 12).
import { cam, car, mark, type Stage } from '../kit';

export const STAGES: readonly Stage[] = [
  {
    id: 'capwood-start-line',
    name: 'The Capwood Run, the line at dawn',
    region: 'frostbite-fells',
    center: [84, -760],
    radius: 12,
    facing: Math.PI,
    time: 'dawn',
    built: 'existing',
    usedBy: ['m40-the-capwood-run'],
    look: "The paddock's churned snow and mud at first light: the hand-painted START board, a row of hatchbacks with their numbers taped on, Lulu's lowrider at the line and the Carburettors' cars drawn up behind it in a row of three.",
    sounds: 'Idling engines, a boom box playing something with a tuba, frost cracking under tyres, Lulu revving to be heard.',
    marks: [
      mark('lulu', [85.4, -762.2], [85.4, -768.2], 'lean', "leans back against the nose of her lowrider, boots crossed, thumbs hooked in her belt"),
      mark('player', [85.4, -768.2], [85.4, -761.2], 'stand', 'walks up from the grid, hat on straight'),
      mark('bertha', [75.8, -754.4], [85.4, -761.2], 'lean', 'leaning on the first of the three cars, arms folded, thirty years of road on her face'),
      mark('dunstan', [81.6, -754.4], [85.4, -761.2], 'lean', 'beside the second car, polishing his glasses on his sleeve'),
      mark('fennimore', [87.6, -754.4], [85.4, -762.2], 'lean', 'slouched against the third car with one foot up on its bumper'),
    ],
    cameras: [
      cam('wide', [100, 3.4, -748], [82, 1.2, -758], 'establishing: the row of cars and the START board in the low dawn light', 54),
      cam('row', [70, 1.2, -762], [84, 1.3, -754.4], 'low along the row of Carburettors and their cars from the west end'),
      cam('hood', [90.2, 1.5, -768], [85.4, 1.5, -761.2], 'from the grid onto Lulu on her bonnet'),
    ],
    walks: [],
    vehicles: [
      car('start-lulu-lowrider', 'parked', 'lowrider', [85.4, -758.8], Math.PI, 'lulu', "Lulu's lowrider at the line, nose to the road"),
      car('carb-bertha', 'parked', 'lowrider', [75.8, -751.6], Math.PI, undefined, "Big-End Bertha's rust-red lowrider"),
      car('carb-dunstan', 'parked', 'euro-hatch', [81.6, -751.6], Math.PI, undefined, "Dipstick Dunstan's hatchback, tidy"),
      car('carb-fennimore', 'parked', 'lowrider', [87.6, -751.6], Math.PI, undefined, "Fanbelt Fennimore's green lowrider, a sticker on every panel"),
    ],
    paths: [],
    set: [],
  },
  {
    id: 'great-ring-clearing',
    name: 'The Great Ring clearing, the afternoon after the Run',
    region: 'north-highlands',
    center: [150, -1125],
    radius: 11,
    facing: Math.PI / 2,
    time: 'golden',
    built: 'existing',
    usedBy: ['m40-the-capwood-run'],
    look: 'The fairy ring of sixteen glowing toadstools round a mown clearing, low gold sun slanting through the caps, a hand-lettered FINES poster on a stalk and the Carburettors parked across the grass.',
    sounds: 'Low sun and dripping caps, a pencil ticking, cooling engines, a laugh that arrives early.',
    marks: [
      mark('lulu', [155.6, -1124.2], [148.4, -1125.6], 'stand', 'on the grass at the ring, the HOA charter folded in one gloved hand'),
      mark('player', [147, -1125.6], [155.6, -1124.2], 'stand', 'steps in from the road side, mud to the knees'),
      mark('chanterelle', [147.2, -1120.4], [148.4, -1125.6], 'stand', 'at the player\'s elbow with a ticket book already open'),
      mark('bertha', [158.8, -1128.6], [150, -1125], 'lean', 'on the bonnet of her lowrider, arms folded, watching'),
      mark('dunstan', [159.8, -1121.4], [150, -1125], 'stand', 'at the ring with his cap in both hands'),
      mark('fennimore', [156.2, -1131.4], [150, -1125], 'lean', 'against the flank of his green lowrider'),
    ],
    cameras: [
      cam('wide', [164, 4.0, -1138], [150, 1.0, -1124], 'establishing: the ring of glowing caps, the low sun through them, the Carburettors in the grass', 54),
      cam('through-caps', [138, 1.5, -1131], [150, 1.2, -1124], 'a shot through two toadstool stalks onto the clearing (the Capwood signature shot)'),
      cam('slip', [149.4, 1.7, -1121.6], [147.6, 1.3, -1121], 'insert: Chanterelle\'s pencil on the ticket book'),
    ],
    walks: [],
    vehicles: [
      car('ring-bertha', 'parked', 'lowrider', [161.2, -1129.4], 2.6, undefined, "Bertha's lowrider, parked across the grass"),
      car('ring-fennimore', 'parked', 'lowrider', [155.6, -1134.4], 3.3, undefined, "Fennimore's green lowrider"),
    ],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {
  'capwood-paddock': ['m40-the-capwood-run'],
};
