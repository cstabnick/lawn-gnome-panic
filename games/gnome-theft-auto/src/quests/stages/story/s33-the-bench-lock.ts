// Story row 33 (m33-the-bench-lock): the stages its scenes play on, and the quest ids added to existing stages' usedBy.
// New: Tansy's bench at Side-Valve Salvage (intro by day, outro at dusk). The Underspan scene stands on E17's `hogweed` stage
// (Hogweed's yard, x 560..600, z -51..-1); the workbench is the stage prop at x -159.1..-156.9, z 75.5..76.5 (side-valve-bay).
import { cam, mark, type Stage } from '../kit';

export const STAGES: readonly Stage[] = [
  {
    id: 'side-valve-bench',
    name: "Tansy's bench at Side-Valve Salvage",
    region: 'turfton',
    center: [-156.5, 73.5],
    radius: 6,
    facing: 0,
    time: 'any',
    built: 'existing',
    usedBy: ['m33-the-bench-lock'],
    look: 'The long workbench at the back of the bay under the tarp, a cigar box and a tin pail on it, the old lock chained through the drawer handle; the orange Zero-Turn smoking behind, the yard swept in stripes.',
    sounds: 'A radio on the bench, a spanner ticking as it cools, a push-broom somewhere behind everything, pigeons on the gutter.',
    marks: [
      mark('tansy', [-157.9, 74.3], [-155, 76.2], 'work','at the bench with the old lock in one hand, looking at the lock and not at anyone'),
      mark('turncoat-cam', [-155.9, 73.4], [-157.9, 74.3], 'stand', 'a pace behind her elbow, the push-broom upright in one hand'),
      mark('player', [-153.2, 73.6], [-157.9, 74.3], 'stand', 'stands on the apron a few paces from the bench'),
    ],
    cameras: [
      cam('bench-wide', [-147, 2.8, 66], [-157.6, 1.0, 75], 'establishing: the bench under the tarp and the yard behind it', 54),
      cam('lock', [-157.4, 1.7, 73.5], [-158, 1.1, 76], 'looking at the lock on the bench from the apron side', 38),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {
  hogweed: ['m33-the-bench-lock'],
};
