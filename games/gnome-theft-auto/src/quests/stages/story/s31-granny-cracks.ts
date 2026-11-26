// Story row 31 (Granny Cracks): the storm cellar beside Granny's farmhouse at noon (Bramble's whisper, the bailiffs in
// the yard) and the Glaze Clinic's treatment bay at dusk (Midge's glue, the silo story). The yard itself is the existing
// granny-barn stage; the clinic bay adds a second cot to the forecourt (Granny sits on it; the glaze-clinic stage's own bed stays).
import { cam, mark, type Stage } from '../kit';

const ROW = ['m31-granny-cracks'];

export const STAGES: readonly Stage[] = [
  {
    id: 'granny-storm-cellar',
    name: "Granny Gnertrude's farmhouse, the storm cellar and the yard",
    region: 'cloverfield-farms',
    center: [-56, 348],
    radius: 20,
    facing: -Math.PI / 2,
    time: 'day',
    built: 'existing',
    givers: ['granny-farmhouse'],
    usedBy: ROW,
    look: 'The back of the farmhouse at noon: a slanted storm-cellar door in the ground beside the pumpkin patch, the yard beyond with Granny\'s porch chair, and two men in beige coats at the barn gate with a mallet and a notice.',
    sounds: 'A mallet tapping a nail, wind in the corn, a hen complaining, and one man\'s boots on gravel; Bramble does not make a sound.',
    marks: [
      mark('bramble', [-59.4, 352.6], [-54, 350], 'stand', 'in the storm-cellar doorway with the farmhouse key in his glove, one eye on the sky'),
      mark('player', [-54.2, 350.4], [-59.4, 352.6], 'stand', 'steps in from the yard with the ride-on idling behind'),
      mark('hoa-bailiff', [-47.6, 333.8], [-47.6, 330.8], 'work', 'drives a nail through a notice into the barn gate'),
      mark('hoa-bailiff', [-43.4, 334.8], [-47.6, 333.8], 'stand', 'holds the clipboard and the second notice'),
    ],
    cameras: [
      cam('cellar-wide', [-36, 3.6, 368], [-58, 1.2, 353], 'establishing: the cellar door, the pumpkin patch and the yard beyond'),
      cam('yard-far', [-61.6, 1.7, 356.6], [-46, 1.5, 333], 'from the cellar mouth across the yard to the two bailiffs at the gate'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'glaze-clinic-bay',
    name: 'Glaze Clinic Hospital, the treatment bay by the doors',
    region: 'turfton',
    center: [9.8, 30.5],
    radius: 10,
    facing: -Math.PI / 2,
    time: 'dusk',
    built: 'dressed',
    usedBy: ROW,
    look: 'The clinic forecourt under the door lights at dusk: a cot with a folded blanket, a heat gun on a hook, a tin of glue warming on a lamp, the red cross glowing over the glass doors.',
    sounds: 'A heat gun whining, a metronome tap at a hundred and forty beats, the doors humming and, under it, the x = 0 road going quiet.',
    marks: [
      mark('granny', [12.4, 31], -Math.PI / 2, 'sit', 'sits on a cot (a scene-only bed beside the clinic\'s own) with her pie tin on her knees, glasses crooked, hands not still', 0.5),
      mark('midge', [10.8, 29.6], [12.4, 31], 'stand', 'at the cot with the glue tin and the heat gun, bouncing on her toes'),
      mark('player', [9.4, 32.6], [12.4, 31], 'stand', 'at the foot of the cot with the hat in both hands'),
    ],
    cameras: [
      cam('bay-wide', [-6, 3.4, 38], [12, 1.2, 31], 'establishing: the forecourt, the cot and the lit doors from the road'),
      cam('cot-side', [8, 1.5, 35], [12.4, 1, 31], 'from the player side along the cot to Granny'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    // The second cot, low and solid so Granny can sit on it (0.5 m): the clinic's own bed stands four metres off.
    set: [{ prefab: 'bed', at: [12.4, 31.2], yaw: 0, scale: 1.2, solid: [0.6, 1.14, 0.5] }],
  },
];

/** Existing stage id -> this row's quest id: the bailiffs wait in Granny's yard. */
export const USES: Readonly<Record<string, readonly string[]>> = {
  'granny-barn': ROW,
};
