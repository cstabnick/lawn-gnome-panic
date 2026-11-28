// Story row 9 (m09-where-asphalt-sleeps): the stages its scenes play on (new ones), and extra quest ids for existing stages' usedBy.
// The Gutter Bowls are E19's (skate/types.ts, SKATE_ORIGIN (-30, 90)): Fennel's deck stands at x -49.5..-46, z 96.5..107.5 and
// his hammock hangs under it. The Bodega & Sons front, Shelldon's alley and the Gutter Bowls deck stage already exist.
import { cam, mark, type Stage } from '../kit';

export const STAGES: readonly Stage[] = [
  {
    id: 'gutter-bowls-hammock',
    name: "The Gutter Bowls, Fennel's hammock",
    region: 'turfton',
    center: [-44, 96],
    radius: 9,
    facing: -Math.PI / 2,
    time: 'day',
    built: 'existing',
    usedBy: ['m09-where-asphalt-sleeps'],
    look: "Concrete bowls and gutters in noon light, Fennel's plank deck on legs with a hammock swung under it, a saucer of fish on the concrete and a skateboard left upside down with a cat asleep across its trucks.",
    sounds: 'Urethane wheels on concrete a long way off, a squeegee, a pigeon, and a cat that purrs like a small outboard.',
    marks: [
      mark('fennel', [-47.4, 94.4], [-43.6, 97.6], 'lean', 'leans on his deck, cap tipped back, one eye on the cat'),
      mark('player', [-41.6, 95.4], [-47.4, 94.4], 'stand', 'walks up from the bowls, the Gutter Bowls behind'),
    ],
    cameras: [
      cam('cat-low', [-41.6, 0.5, 97.6], [-44.6, 0.35, 98.4], 'insert: ground level on the sleeping cat, the board and the saucer'),
      cam('deck-wide', [-37, 3, 91], [-45.5, 1.2, 96.5], 'the bowls side, a wide of the deck, the board and Fennel'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {
  'bodega-front': ['m09-where-asphalt-sleeps'],
  'shelldon-alley': ['m09-where-asphalt-sleeps'],
  fennel: ['m09-where-asphalt-sleeps'],
};
