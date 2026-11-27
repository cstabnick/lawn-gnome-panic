// Story row 65 (The Countess Relents): the stages its scenes stand on. Brassknock Manor's raised front terrace by day (E16:
// country/manor.ts; the Countess's table with the map, the giver stands on the forecourt below) and the Unmown Ranger Station's
// yard at the end of the Unmown Lane (E31: unmown/station.ts; R-234: the first vine goes to the one corner no mower goes, and
// Head Ranger Burdock Haybright writes it in the book). The terrace is a walkable rooftop 1.2 m above the gravel. The tasting
// of row 50 used the same terrace at night; this is the same stone in daylight. All dressing (the map table, the key, the
// pot, the book) is scene `props`: nothing is built into the world.
import { cam, mark, type Stage } from '../kit';

export const STAGES: readonly Stage[] = [
  {
    id: 'manor-terrace-day',
    name: 'Brassknock Manor, the front terrace by day',
    region: 'west-estates',
    center: [-1140, 14],
    radius: 12,
    facing: 0,
    time: 'day',
    built: 'existing',
    givers: ['wisteria-terrace'],
    usedBy: ['m65-the-countess-relents'],
    look: 'The pale manor front in clear afternoon light, the raised terrace along it with a long table dragged to the balustrade and a map held flat by four thimble glasses, the forecourt gravel below, and beyond the gate the vine rows climbing their hill to the press-house.',
    sounds: 'Birdsong, a fountain trickling on the forecourt, a pencil scratching on thick paper, the small sigh of a gardener, wind in the vines.',
    marks: [
      mark('wisteria', [-1141.6, 20.6], Math.PI, 'stand', 'behind the map table on the raised terrace, opera glasses on a stick tucked under one arm, a pencil in the other hand', 1.2),
      mark('chicory', [-1137.6, 20.2], [-1141.6, 20.6], 'stand', 'at the end of the table with his cap in both hands, looking past the Countess at the hill of vines', 1.2),
      mark('player', [-1143.0, 14.0], [-1141.6, 20.6], 'stand', 'on the gravel below the terrace, looking up at the table, summoned and not yet told why'),
    ],
    cameras: [
      cam('wide', [-1154, 2.6, 6], [-1140, 2.3, 19.5], 'from the forecourt, a little low: the terrace, the table and the map, the three of them small against the pale house'),
      cam('table', [-1141.5, 1.9, 14.2], [-1141.6, 2.5, 20.3], 'close from the gravel, looking up onto the table and the map under the Countess\'s hand'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'unmown-station-yard',
    name: 'The Unmown Ranger Station, the yard',
    region: 'the-unmown',
    center: [-1552, -1139],
    radius: 12,
    facing: 0,
    time: 'dusk',
    built: 'existing',
    usedBy: ['m65-the-countess-relents'],
    look: 'A low hut with a porch at the end of a lane, a rules board on a post, log benches, a bird feeder, a heap of confiscated mowers going to rust, and all round it grass to the waist and then more grass, gold in the low light, a stone heron on a rock at the meadow edge.',
    sounds: 'Wind through tall grass, insects, reeds knocking in the distance, a pen scratching in a book, a ranger saying "twelve" under his breath.',
    marks: [
      mark('burdock haybright', [-1553.4, -1139.6], [-1545.6, -1136.4], 'stand', 'in the yard in front of the hut, hands behind his back, binoculars on his chest, having come out to see who is on his lane'),
      mark('player', [-1545.6, -1136.4], [-1553.4, -1139.6], 'stand', 'walks in from the lane end with the crate set down on the grass beside them'),
      mark('burdock haybright', [-1554.0, -1140.6], [-1552.4, -1147.4], 'stand', 'at the planting by the east wall, the station book open on his forearm, a pen in his hand'),
      mark('chicory', [-1550.2, -1149.6], [-1552.4, -1147.4], 'work', 'beside the new vine with his watering can, talking to the roots before anyone else'),
      mark('player', [-1549.8, -1145.6], [-1552.4, -1147.4], 'stand', 'at the planting, earth on both hands, the empty crate behind them'),
    ],
    cameras: [
      cam('wide', [-1538, 2.4, -1128], [-1553, 1.3, -1140], 'from the lane end: the hut, the rules board, the yard and the long grass in low gold light'),
      cam('planting', [-1546.8, 1.6, -1152], [-1552.4, 1.0, -1147.4], 'low beside the hut wall onto the planting and the two who stand over it'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Record<string, string[]> = {};
