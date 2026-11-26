// Story row 10: the stages its scenes play on (new ones), and extra quest ids for existing stages' usedBy.
// Row 10 (m10-under-the-span): the scrap bins in the downtown alley (new stage), Hogweed's yard under the Unfinished Span
// ('hogweed', E17) and Side-Valve Salvage's bay ('side-valve-bay') for the intro and the outro.
import { cam, mark, type Stage } from '../kit';

export const STAGES: readonly Stage[] = [
  {
    id: 'scrap-bin-alley',
    name: 'The Scrap Bin Alley, Downtown',
    region: 'turfton',
    center: [-92, 103],
    radius: 16,
    facing: Math.PI,
    time: 'day',
    built: 'dressed',
    usedBy: ['m10-under-the-span'],
    look: 'A pavement strip round the back of a downtown block: three wheelie bins of other gnomes\' scrap, each with its lid left up.',
    sounds: 'A lid knocking in the wind, a tap dripping, traffic on the z = 120 road.',
    marks: [
      mark('player', [-103, 84], [-104, 90], 'stand', 'at the first bin, sleeves up'),
      mark('player', [-92, 104.5], [-92, 106], 'stand', 'at the second bin, reaching in to the elbow'),
      mark('player', [-77, 90], [-76, 90], 'stand', 'at the third bin, holding the lid up with a head'),
    ],
    cameras: [
      cam('wide', [-112, 5, 110], [-92, 1.2, 103], 'establishing: the strip behind the block, the bins along it'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {
  'side-valve-bay': ['m10-under-the-span'],
  hogweed: ['m10-under-the-span'],
};
