// Story row 7 (m07-even-estates): the stages its scenes play on (new ones), and extra quest ids for existing stages' usedBy.
// Even-Estates Plot 1 is E16's (country/estates.ts, EVEN_ESTATES[0]): hoarding x -319..-271, z -144..-96, the gate gap in the
// west side at z -124..-116, the first show-home at x -311.5..-304.5, z -142.5..-135.5 with its door on the south face.
import { cam, car, mark, type Stage } from '../kit';

export const STAGES: readonly Stage[] = [
  {
    id: 'estates-plot-1-showhome',
    name: 'Even-Estates Plot 1, the first show-home',
    region: 'mossy-wood',
    center: [-307, -131],
    radius: 14,
    facing: Math.PI,
    time: 'night',
    built: 'dressed',
    usedBy: ['m07-even-estates'],
    look: 'Beige hoarding all round a dirt yard, three identical show-homes with the same window lit and a number 1 on every door, a crane painted "Level Is Kind" against the stars; a torch is the only other light.',
    sounds: 'A far mixer turning over, a spirit level tapped on a post, a Ride-On idling, crickets that have stopped on the beige side of the wall.',
    marks: [
      mark('player', [-309.3, -131.8], [-308, -135.4], 'stand', 'at the first show-home door with the field camera up'),
      mark('juniper', [-306.2, -132.2], [-308, -135.4], 'stand', 'at the player\'s shoulder, a rolled chart under her arm'),
      mark('chard', [-299, -126.5], [-308, -132], 'stand', 'the torch up, a spirit level under the other arm'),
      mark('levelright-watch', [-297, -119.5], [-308, -132], 'stand', 'a night-watchman at the yard edge, a baton on his belt'),
      mark('levelright-watch', [-301, -115.5], [-308, -132], 'stand', 'the second night-watchman, off to the crane'),
    ],
    cameras: [
      cam('gate-wide', [-325, 3, -117], [-306, 1.2, -130], 'establishing: from outside the gate gap, the yard, the show-homes and the crane under the stars'),
      cam('permits', [-303, 1.5, -131], [-303, 1.4, -135.2], 'insert: the three permits on the hoarding panel between the show-homes'),
      cam('torch-side', [-293, 1.6, -130], [-306, 1.4, -132], 'from the yard side onto the player and Juniper with the torch beam coming in'),
    ],
    walks: [
      { who: 'levelright-watch', points: [[-297, -119.5], [-301, -115.5]], loop: false, speed: 1.0, pauseS: 4, activity: 'walks the best-measured patrol in Turfton: eleven paces, a stop, eleven paces' },
    ],
    vehicles: [
      car('chard-site-ride', 'parked', 'ride-on', [-303, -124], -Math.PI / 2, 'chard', 'a beige Ride-On with a hazard lamp and a spirit level taped to the bonnet'),
    ],
    paths: [
      { id: 'chard-getaway', role: 'getaway', kind: 'ride-on', offRoad: true, points: [[-303, -124], [-312, -121], [-323, -121.5], [-327, -126], [-337, -128], [-348, -130]], note: 'out of the gate gap, round the shed outside it and away west along the fringe' },
    ],
    // The permit panel and its clipboards are scene props (even-estates-mid), not world dressing.
    set: [],
  },
  {
    id: 'kerb-row-terrace',
    name: "Juniper Vance's terrace, Kerb Row",
    region: 'turfton',
    center: [-90, 127],
    radius: 8,
    facing: Math.PI,
    time: 'night',
    built: 'dressed',
    usedBy: ['m07-even-estates'],
    look: 'A narrow terrace with the front door on the street side, a brass J. VANCE plate, one porch lamp, a boot scraper and a very straight hedge; the street z = 120 beyond.',
    sounds: 'A porch lamp humming, a key that has been in the lock for years, a Ride-On idling at the kerb, distant traffic.',
    marks: [
      mark('player', [-91.5, 124.8], [-90, 128.5], 'stand', 'stands on the pavement in front of the terrace'),
      mark('juniper', [-90, 128.6], [-91.5, 124.8], 'stand', 'on the doorstep, the field camera and a developed photograph in her hands'),
    ],
    cameras: [
      cam('street', [-95.5, 1.6, 123], [-90, 1.4, 128.6], 'from the pavement onto Juniper on her doorstep'),
      cam('porch', [-86, 1.5, 125.5], [-90, 1.4, 128.6], 'the other side of the porch light'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [
      { prefab: 'garden-lamp-post', at: [-93.2, 127.8], yaw: 0, scale: 1.2 },
    ],
  },
];

/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {
  'city-hall-steps': ['m07-even-estates'],
  chard: ['m07-even-estates'],
};
