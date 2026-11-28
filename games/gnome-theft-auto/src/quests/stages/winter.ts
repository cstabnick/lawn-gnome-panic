// Snowcap Rise (E12, docs/roadmaps/gta-batch-3/E12): the Woolly Sock Lodge at the foot of Snowdrop Slope, where Gentian
// Bootlace gives 'Snowdrop Sled Trials', and the red shanty on Pail Pond, where Thermos Theo gives 'Lines on Pail Pond'.
// Conventions and types: ../stages.ts and ./kit.ts. The places are built by winter/ (hill.ts, ice.ts).
import { cam, mark, type Stage } from './kit';

export const WINTER_STAGES: readonly Stage[] = [
  {
    id: 'gentian',
    name: 'Snowdrop Slope, the ski class by the Woolly Sock Lodge',
    region: 'north-highlands',
    center: [-430, -1007],
    radius: 10,
    facing: Math.PI / 2,
    time: 'day',
    built: 'existing',
    givers: ['gentian'],
    usedBy: ['sq-snowdrop-sled-trials'],
    look: 'A snow bank of striped skis on a rack, a stack of tin tea trays, a cocoa hatch steaming, and the lodge porch with a bear on the bench.',
    sounds: 'Skis hissing, the Bootlace Tow clacking its cotton reels, a long contented yawn.',
    marks: [
      mark('gentian', [-430, -1007], [-427, -1007], 'stand', 'leaning on her ski poles with her striped bobble cap'),
      mark('player', [-427, -1007], [-430, -1007], 'stand', 'trudges over from the lodge porch'),
    ],
    cameras: [
      cam('class', [-424, 1.6, -1010], [-430, 1.2, -1007], 'from the lodge side onto Gentian and the slope behind her'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'theo-pond',
    name: 'Pail Pond, outside the red shanty',
    region: 'north-highlands',
    center: [-608, -1044],
    radius: 10,
    facing: 0,
    time: 'day',
    built: 'existing',
    givers: ['theo-pond'],
    usedBy: ['sq-pail-pond-lines'],
    look: 'A red shanty on white ice, drilled holes with an empty sardine tin beside them, a bear asleep a little way off.',
    sounds: 'Wind over the ice, a thermos lid, the odd long yawn.',
    marks: [
      mark('theo', [-608, -1044], [-606, -1042], 'stand', 'on an upturned crate outside his shanty with a thermos'),
      mark('player', [-606, -1042], [-608, -1044], 'stand', 'crunches across the ice from the shore'),
    ],
    cameras: [
      cam('shanty', [-603, 1.6, -1046], [-608, 1.2, -1044], 'from the pond side onto Theo and the shanty'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];
