// Story row 14 (Drainpipe Court): the stage its three scenes play on, the bench on the court's north side.
// The place is built by court/ (the bench, the chalk scoreboard, the ball cage, the lamps); Pip's toolbox and its duster
// are the court's own vignette (court/life.ts).
import { cam, mark, type Stage } from '../kit';

export const STAGES: readonly Stage[] = [
  {
    id: 'drainpipe-bench',
    name: "Drainpipe Court, Old Burdock's bench",
    region: 'turfton',
    center: [-92, 25],
    radius: 12,
    facing: 0,
    time: 'dusk',
    built: 'existing',
    givers: ['drainpipe-pip'],
    usedBy: ['m14-drainpipe-court'],
    look: 'A long weathered bench on the north side of a chalked court, a red toolbox on its east end with a feather duster laid across the lid, a mushroom lamp over the railing, the east hoop on its drainpipe beyond.',
    sounds: 'A ball bouncing off the drainpipe, the clang of a rim, chalk on the board, Old Burdock keeping score out loud.',
    marks: [
      // Pip sits at the west end of the bench; the toolbox is on the east end. `lift` skips the collider check (the bench is solid).
      mark('pip', [-95.9, 21.6], 0, 'sit', 'on the bench with his elbows on his knees, a hat pulled low, not looking at the toolbox', 0.45),
      mark('player', [-92.6, 24.6], [-95.9, 21.6], 'stand', 'walks over from the court'),
      mark('player', [-94.4, 21.6], 0, 'sit', 'sits on the bench beside Pip, toolbox between them', 0.45),
      mark('cardoon', [-84.5, 30], [-92, 25], 'stand', 'spinning a ball on one finger by the east hoop, a net round his neck like a scarf'),
    ],
    cameras: [
      cam('bench', [-90, 1.7, 26.5], [-95.4, 1.0, 21.6], 'from the court side onto the bench, the toolbox on its east end'),
      cam('court', [-97.5, 1.5, 22.5], [-86, 1.3, 30], 'from the bench along the court to the east hoop'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {
  cardoon: ['m14-drainpipe-court'],
};
