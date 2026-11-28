// Story row 70 (The Even Cut, extended), part 3 and the final: the stages their scenes play on. Parts 1 and 2 are in
// s70a-even-cut.ts. Nothing here builds set dressing in the world: the scenes carry their own props (the cutscene-only
// Grand Combine, prefab grand-combine-boss at the boss runner's scale 5, nose +z, rolling south; the Gilded Lawn-Throne,
// its lamp, Vesper's top hat).
// - e70-deck-road: the meridian where p3 begins (the boss runner's startZ -240): the deck seen from the player's eyes, the
//   Guard on the west verge, Pip on the east one. p3 intro.
// - e70-guard-kerb: the meridian at the z = -120 crossing, where p3 ends (endZ -120): the Guard sitting on the west kerb.
//   p3 outro.
// - e70-jam-street: the x = 0 road between the two blocks south of the crossing (z -104 .. -94), where the crew waits in
//   the Combine's way with the Stone and the cigar box. The final's intro (even-cut-intro).
// - e70-crossing: the downtown crossing at (0, 0) and the 20 m of meridian north of it: the Combine jammed with its maw
//   at z -19 (the Stone that meridian-finale's set already lays there), the throne set down on the road in front of it,
//   the choice beacons at (+-12, 0). The jam, the hat and the outro's opening.
// The outro's epilogue stands on existing stages (USES below): Side-Valve, City Hall, the Gnomecino rope, Bodega & Sons,
// the bus stop and the coalition camp at the overlook (dust-safehouse).
import { cam, mark, type Stage } from '../kit';

const P3 = 'ch5-even-cut-p3';
const FINAL = 'ch5-even-cut';

export const STAGES: readonly Stage[] = [
  {
    id: 'e70-deck-road',
    name: 'The meridian north of downtown, under the Combine\'s deck',
    region: 'turfton',
    center: [0, -215],
    radius: 30,
    facing: 0,
    time: 'day',
    built: 'existing',
    usedBy: [P3],
    look: 'The x = 0 road out of the city, a beige-and-obsidian machine the width of it, and on its bridge a gilded throne coming up out of the roof.',
    sounds: 'A diesel the size of a street, three pairs of porcelain feet in step, a hydraulic sigh, the PA horns.',
    marks: [
      mark('porcelain-guard', [-8.4, -247], 0, 'stand', 'p3 intro: the first of three on the west verge, marching south in step with the Combine'),
      mark('porcelain-guard', [-8.4, -249], 0, 'stand', 'the second, a step behind'),
      mark('porcelain-guard', [-8.4, -251], 0, 'stand', 'the third'),
      mark('pip', [10.6, -222], [0, -240], 'stand', 'p3 intro: on the east verge, jogging to keep up, looking up at the deck'),
    ],
    cameras: [
      cam('boots', [-6.2, 0.45, -232], [-8.4, 0.6, -246], 'low on the road ahead of them: porcelain boots coming on in step, the wheels behind', 44),
      cam('flank', [11, 3, -226], [0, 7, -238], 'off the east verge up the machine\'s flank to the bridge and the throne', 48),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'e70-guard-kerb',
    name: 'The meridian at the z = -120 crossing, after the deck fight',
    region: 'turfton',
    center: [-4, -124],
    radius: 12,
    facing: 0,
    time: 'day',
    built: 'existing',
    usedBy: [P3],
    look: 'Three porcelain guards sitting on the west kerb in a perfectly even row, whole, and the Combine rolling on behind them with a lamp lit on its roof.',
    sounds: 'A porcelain squeak, the engine, a lamp\'s small pop, a phone.',
    marks: [
      mark('porcelain-guard', [-8.2, -127.4], Math.PI / 2, 'sit', 'p3 outro: on the kerb, hands on knees, whole'),
      mark('porcelain-guard', [-8.2, -126.0], Math.PI / 2, 'sit', 'beside him, the same'),
      mark('porcelain-guard', [-8.2, -124.4], Math.PI / 2, 'sit', 'the third, who shuffles a hand\'s width to make the row even'),
      mark('player', [-3.8, -123.2], [-8.2, -126], 'stand', 'in the road after the fight, looking at the row'),
      mark('pip', [7.6, -121.2], [-3.8, -123.2], 'stand', 'on the crossing\'s east corner, phone to his ear'),
    ],
    cameras: [
      cam('kerb-low', [-4.4, 0.6, -129.6], [-8.2, 0.8, -125.6], 'low on the road beside the row of guards', 46),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'e70-jam-street',
    name: 'The x = 0 road south of the z = -120 crossing, the crew in the Combine\'s way',
    region: 'turfton',
    center: [0, -99],
    radius: 10,
    facing: Math.PI,
    time: 'day',
    built: 'existing',
    usedBy: [FINAL],
    look: 'A street canyon between two blocks, an orange Zero-Turn slewed across the kerb, a crate with a cigar box on it, and at the top of the street the Combine coming down.',
    sounds: 'The engine coming closer every cut, glass rattling in shopfronts, a kazoo, a cigar box hinge.',
    marks: [
      mark('bracken', [-2.6, -98.2], [-0.2, -100.6], 'stand', 'holding Gnorwin\'s Stone in both hands, staff in the crook of his arm'),
      mark('tansy', [2.6, -99.2], [-0.2, -100.6], 'stand', 'by the crate with the cigar box on it'),
      mark('pip', [0.6, -95.8], [-0.2, -100.6], 'stand', 'behind them, the golden kazoo in his fist'),
      mark('player', [-0.2, -100.6], [0, -120], 'stand', 'in the middle of the road, facing the Combine'),
    ],
    cameras: [
      cam('canyon', [-3.6, 0.9, -88], [0, 5, -122], 'low down the street, the crew small, the Combine filling the top of it', 50),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'e70-crossing',
    name: 'The downtown crossing, the Combine jammed and the throne on the road',
    region: 'turfton',
    center: [0, -10],
    radius: 16,
    facing: 0,
    time: 'day',
    built: 'existing',
    usedBy: [FINAL],
    look: 'The Combine stopped with Gnorwin\'s Stone in its maw at z -19; in front of it, on the road, a gilded throne with a porcelain lantern on its arm; two beacons, gold and cyan, on the cross road.',
    sounds: 'An engine dying, then nothing; wind; a lantern ticking; a top hat rolling on asphalt.',
    marks: [
      mark('player', [-2.0, -16.4], [-2, -19], 'stand', 'the jam: both hands on the Stone in the maw'),
      mark('bracken', [-7.4, -13.6], [-2, -19], 'stand', 'the jam: on the west side of the road, watching the Stone hold'),
      mark('vesper', [3.5, -8.6], 0, 'sit', 'on the Lawn-Throne, set down on the road in front of the maw'),
      mark('player', [1.4, -3.4], [3.5, -8.6], 'stand', 'the hat: where the top hat stops rolling'),
      mark('pip', [-1.2, 0.6], [1.4, -3.4], 'stand', 'the hat: with the Golden Acorn, too hot to hold'),
      mark('bracken', [-13.4, 1.6], [1.4, -3.4], 'stand', 'by the gold beacon (Ending A)'),
      mark('juniper', [-10.6, 2.4], [1.4, -3.4], 'stand', 'by the gold beacon, a signed counter-order in her hand'),
      mark('tansy', [12.8, 1.8], [1.4, -3.4], 'stand', 'by the cyan beacon (Ending B), a wrench in her hand'),
      mark('clara', [2.4, -8.0], 0, 'sit', 'the outro: on the throne\'s step beside him, her lantern on her knee'),
    ],
    cameras: [
      cam('maw', [-0.4, 0.9, -16.2], [-2, 0.8, -19], 'low at the Stone in the maw\'s teeth', 40),
      cam('crossing-wide', [-9, 4.5, 9], [1.5, 2.2, -14], 'from the south-west corner: the crossing, the throne, the stopped machine behind', 50),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> this row's quest ids to add to its usedBy. */
export const USES: Record<string, string[]> = {
  // p3 outro: Tansy on the phone at the map table.
  'dust-safehouse': [P3],
  // p3 intro: Juniper on the City Hall steps with the counter-order.
  'city-hall-steps': [P3],
  // The epilogue.
  'side-valve-bay': [FINAL],
  'gnomecino-door': [FINAL],
  'bus-stop': [FINAL],
};
