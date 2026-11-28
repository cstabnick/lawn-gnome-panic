// Story row 69 (m69-the-combine-wakes): the stages its scenes play on. The intro stands on the existing Compost Heap stage (USES below:
// Ernie at the dark furnace, dawn). Two new places: the pavement outside the gate of Even-Estates Plot 1 (mid: Chard watches his
// crews run for the bus), and Hyssop's crossing, the junction of the z = 0 road and the meridian (outro: the Grand Combine, which
// is only in the scenes, turns onto the meridian; Hyssop holds up her lollipop; Chard watches from the verge).
import { cam, mark, type Stage } from '../kit';

const ROW = ['m69-the-combine-wakes'];

export const STAGES: readonly Stage[] = [
  {
    id: 'm69-estates-gate',
    name: 'Even-Estates Plot 1, outside the gate at dawn',
    region: 'mossy-wood',
    center: [-326, -119],
    radius: 9,
    facing: Math.PI / 2,
    time: 'dawn',
    built: 'existing',
    usedBy: ROW,
    look: 'The gate gap in the beige hoarding in a flat gold dawn: forty identical show-homes beyond it with the same window lit, a crane painted "Level Is Kind", and a bus waiting at the kerb with its door open.',
    sounds: 'A diesel far to the east that does not stop, boots on dirt, a crew shouting for each other, the tap of a spirit level on a post.',
    marks: [
      mark('chard', [-324.4, -121.8], [-306, -130], 'stand', 'in the gate gap, the spirit level under one arm, looking at the show-homes instead of the bus'),
      mark('player', [-329.4, -124.6], [-324.4, -121.8], 'stand', 'on the pavement by the bus door'),
      mark('levelright-worker', [-314, -121.5], [-324, -120], 'stand', 'the first of the crew coming out of the yard at a jog, hard hat in hand'),
      mark('levelright-worker', [-312, -119], [-324, -120], 'stand', 'the second, carrying a lunch tin and a mattress roll'),
      mark('levelright-worker', [-310, -122.5], [-324, -120], 'stand', 'the third, still in his vest, still buttoning it'),
    ],
    cameras: [],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'm69-crossing',
    name: "Hyssop's crossing, the z = 0 road at the meridian, at dawn",
    region: 'turfton',
    center: [-12, 0],
    radius: 12,
    facing: Math.PI / 2,
    time: 'dawn',
    built: 'existing',
    usedBy: ROW,
    look: 'A wide empty road junction at first light, the shop shutters down on both sides, the traffic lights blinking amber, one gnome in the road in a mustard cardigan with a round red sign held up, and a very large noise coming from the west.',
    sounds: 'A blinking amber light ticking, a hard-hat dropped on the kerb, a diesel as big as a street growing from the west, then a held breath.',
    marks: [
      mark('hyssop', [-12.4, 0.4], -Math.PI / 2, 'stand', 'in the middle of the z = 0 road facing west, feet apart, the stop-sign lollipop at full arm'),
      mark('chard', [-15.4, -8.6], [-12.4, 0.4], 'stand', 'on the verge north of the road, the hard hat held in both hands against his chest'),
      mark('player', [-9.6, 5.8], [-12.4, 0.4], 'stand', 'on the south kerb, a pace behind her shoulder'),
    ],
    cameras: [],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> this row's quest ids to add to its usedBy. */
export const USES: Record<string, string[]> = {
  'compost-heap': ['m69-the-combine-wakes'],
};
