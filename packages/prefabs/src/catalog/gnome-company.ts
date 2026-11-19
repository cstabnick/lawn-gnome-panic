// New prefabs for gnome-company. One owner (the gnome-company adoption issue): add entries here and nowhere else.
import type { PrefabDef } from '../types';

export const GNOME_COMPANY: readonly PrefabDef[] = [
  {
    id: 'departure-lever',
    name: 'Departure Lever',
    category: 'prop',
    uses: ['place'],
    tags: ['lever', 'switch', 'shed', 'metal', 'red', 'departure', 'pull'],
    emoji: [],
    about: 'A dark iron base with a red pull-arm standing up from it. The arm is the only bright thing in the shed.',
    examine: [
      'A squat iron base with a red arm bolted to the top, worn pale where the hands go.',
      'Saying: "Pull it once to leave, and pull it twice to find out you were not finished."',
      'The arm is tilted a little, as if somebody has already started pulling and lost their nerve.',
      'Nobody has ever been seen to leave by it. Several gnomes have been seen to stand next to it, looking brave.',
    ],
    parts: [
      { s: 'box', d: [0.6, 1.0, 0.6], at: [0, 0.5, 0], c: 0x374151 },
      { s: 'cyl', d: [0.06, 0.06, 1.0], at: [0, 1.25, 0], rot: [0, 0, 22.9], c: 0xef4444 },
    ],
  },
  {
    id: 'deku-root-pillar',
    name: 'Deku Root Pillar',
    category: 'prop',
    uses: ['place'],
    tags: ['root', 'pillar', 'tree', 'bark', 'deku', 'column', 'wood'],
    emoji: [],
    about: 'A tapering root pillar of dark bark, thick at the foot and thin at the top. Built at scale 3.1 in the Deku hollow.',
    examine: [
      'A column of dark bark that tapers from a fat foot to a thin top, as if the tree was growing down as well as up.',
      'Old saying: "Lean on the root, not the bark, and the Deku will not notice you leaning."',
      'It is the same wood as the great oak, only with the sap pressed out of it and the knots left in.',
      'Mushrooms grow on the north side of every root. Nobody has ever checked the south side.',
    ],
    parts: [
      { s: 'cyl', d: [0.1613, 0.2903, 2.9], at: [0, 1.45, 0], c: 0x2d1a0e, seg: 8 },
    ],
  },
];
