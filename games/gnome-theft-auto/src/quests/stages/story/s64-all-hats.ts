// Story row 64 (All Hats), part 3 (By Road) and the final (By Root): the stages their scenes play on.
// - m64-bowl-convoy: the Rutbottom Dirt Bowl pits just inside the road gate (rutbottom/spots.ts BOWL_GATE, PITS) at
//   dusk: the Carburettors' column of three idling engines pointed at the gate, and Lulu's dirt bike at its head
//   (the p3 intro, played on arrival).
// - m64-overlook-ring: open dust at the foot of the overlook rise, west of the highway bend: the convoy parked in a
//   ring, headlights in (the p3 outro).
// - m64-camp-night: the overlook camp on the rise at night, where W16 builds the coalition camp afterwards (centre
//   (246, 82), worldChanges/rows/coalitionCamp.ts CAMP): the crate table in the middle, the hat rail behind it to the
//   south, the fire to the south-west. The scenes stage their own camp props on W16's spots, so the camp the player
//   sees after the quest is the one they helped build. Arrivals: the Unmowed out of the scrub to the west, the
//   Burrowfolk up through the ground, the Spade Guard and Granny's Ride-On up the track from the highway to the east,
//   the Flock already standing on one leg at the north edge of the light (their tent's slot).
// W16's faction slots (angle from +x towards +z, ring radius 9): Carburettors 30, Underspanners 81, Unmowed 133,
// Burrowfolk 184, Spade Guard 236, the Flock 287, Granny 339. The hats wait at those slots (the final's inspect).
import { cam, car, mark, type Stage } from '../kit';

const P3 = 'm64-all-hats-p3';
const FINAL = 'm64-all-hats';

/** The camp centre (W16 CAMP) and the table, the rail and the fire on W16's spots. */
const MID: [number, number] = [246, 82];

export const STAGES: readonly Stage[] = [
  {
    id: 'm64-bowl-convoy',
    name: 'Rutbottom Dirt Bowl, the pits by the road gate, the convoy lined up at dusk',
    region: 'east-campus',
    center: [1012, -652],
    radius: 14,
    facing: -Math.PI / 2,
    time: 'golden',
    built: 'existing',
    usedBy: [P3],
    look: "Three Carburettor rides nose to tail in the dusty pits, pointed at the road gate, engines idling and headlights on in the gold dust; Lulu's borrowed dirt bike at the head of the column.",
    sounds: 'Three engines idling out of time, a two-stroke popping, grit ticking on tin, a horn tested twice.',
    marks: [
      mark('lulu', [1010.6, -652.6], [1006.0, -647.4], 'drive', 'astride the dirt bike at the head of the column, boots down'),
      mark('player', [1006.0, -647.4], [1010.6, -652.6], 'stand', 'in through the road gate'),
      mark('fennimore', [1016.4, -655.4], [1010.6, -652.6], 'stand', "by Lulu's orange lowrider, hoping"),
      mark('bertha', [1022.4, -655.4], [1010.6, -652.6], 'stand', 'by her rust-red lowrider, arms folded'),
      mark('dunstan', [1028.4, -655.4], [1010.6, -652.6], 'stand', 'by his tidy hatchback, a rag in his hand'),
    ],
    cameras: [
      cam('bowl-wide', [1001.5, 3.4, -641], [1022, 1.0, -657], 'establishing, high from the gate: the column of headlights in the dusty pits, the berm behind', 52),
      cam('column-low', [1012.6, 0.55, -661.2], [1030, 0.8, -657.6], 'ground level beside the column, headlights flaring into the lens one after another', 44),
      cam('pits-down', [1016.5, 1.4, -634], [1012, 1.0, -650], 'from up the pits, the bike coming down at the lens', 50),
    ],
    walks: [],
    vehicles: [
      car('m64-lulu-bike', 'pull-up', 'dirt-bike', [1010.6, -652.6], -Math.PI / 2, 'lulu', "Clary's spare Knobbly, borrowed: the point rider's bike"),
      car('m64-lulu-car', 'parked', 'lowrider', [1016.5, -658.2], -Math.PI / 2, 'lulu', "Lulu's orange lowrider, Fennimore to drive it"),
      car('m64-bertha-car', 'parked', 'lowrider', [1022.5, -658.2], -Math.PI / 2, undefined, "Big-End Bertha's rust-red lowrider"),
      car('m64-dunstan-car', 'parked', 'euro-hatch', [1028.5, -658.2], -Math.PI / 2, undefined, "Dipstick Dunstan's hatchback, tidy"),
    ],
    paths: [
      { id: 'bike-in', role: 'arrival', kind: 'dirt-bike', offRoad: true, points: [[1020, -612], [1018.5, -630], [1014, -644], [1010.6, -652.6]], note: 'Lulu down the pits to the head of the column' },
      { id: 'convoy-out', role: 'getaway', kind: 'lowrider', offRoad: true, points: [[1016.5, -658.2], [1006, -655], [1000, -650], [975, -650], [952, -650]], note: 'out of the gate onto the band road' },
    ],
    set: [],
  },
  {
    id: 'm64-overlook-ring',
    name: 'The foot of the overlook rise, the Carburettors parked in a ring',
    region: 'dust-flats',
    center: [288, 70],
    radius: 12,
    facing: -Math.PI / 2,
    time: 'golden',
    built: 'existing',
    usedBy: [P3],
    look: "Four engines in a ring on the open dust, noses in and headlights crossing in the middle; up the rise to the west, one campfire and a long table half built.",
    sounds: 'Engines ticking as they cool, the dust wind, a horn far off on the highway, a fire crackling a long way up.',
    marks: [
      mark('lulu', [284.6, 70.2], [287.0, 72.4], 'stand', 'off the bike, thumbs in her belt'),
      mark('player', [287.0, 72.4], [284.6, 70.2], 'stand', 'in the middle of the ring'),
      mark('fennimore', [286.9, 67.4], [286.65, 64.98], 'stand', "checking the captain's paint, panel by panel"),
      mark('bertha', [290.8, 68.4], [286.9, 67.4], 'stand', 'leaning on nothing, watching Fennimore'),
      mark('dunstan', [289.9, 72.4], [284.6, 70.2], 'stand', 'wiping the dust off his bonnet'),
    ],
    cameras: [
      cam('ring-wide', [301, 4.5, 80], [288, 0.8, 70], 'the ring of engines at the foot of the rise, headlights in, the camp fire up behind', 50),
      cam('ring-low', [288.4, 0.45, 69.4], [283.4, 0.7, 71.5], 'ground level in the middle of the ring, between the headlights', 42),
      cam('to-the-rise', [292.5, 1.5, 71.5], [246, 1.2, 82], 'long lens from the ring up the rise to the camp fire', 30),
    ],
    walks: [],
    vehicles: [
      car('m64-ring-bike', 'parked', 'dirt-bike', [282.98, 71.35], [288, 70], 'lulu', 'the bike closes the ring'),
      car('m64-ring-lulu', 'parked', 'lowrider', [286.65, 64.98], [288, 70], 'lulu', "Lulu's lowrider, not a scratch"),
      car('m64-ring-bertha', 'parked', 'lowrider', [293.02, 68.65], [288, 70], undefined, "Bertha's lowrider"),
      car('m64-ring-dunstan', 'parked', 'euro-hatch', [289.35, 75.02], [288, 70], undefined, "Dunstan's hatchback"),
    ],
    paths: [
      { id: 'bike-close', role: 'arrival', kind: 'dirt-bike', offRoad: true, points: [[276.5, 73.0], [280, 72.2], [282.98, 71.35]], note: 'Lulu rolls into the last gap' },
    ],
    set: [],
  },
  {
    id: 'm64-camp-night',
    name: 'The overlook camp on the night the coalition comes in',
    region: 'dust-flats',
    center: MID,
    radius: 16,
    facing: Math.PI,
    time: 'night',
    built: 'existing',
    usedBy: [FINAL],
    look: "A long table of upturned fruit crates in the firelight, Tansy's heist board on its trestle legs at the east edge, lantern posts, crates for seats, and from the outro the hat rail behind the table with every faction's cap on it.",
    sounds: 'The fire, a hammer on crate nails, crickets, lantern glass tinkling, boots in step coming up from the highway.',
    marks: [
      // The intro.
      mark('pip', [247.2, 80.4], [246.4, 82], 'work', 'hammering the last crate into the table'),
      mark('tansy', [253.4, 82.5], [254.6, 82.6], 'stand', 'at the heist board, pinning cards'),
      mark('player', [250.6, 84.4], [253.4, 82.5], 'stand', 'between the table and the board'),
      mark('saxifrage', [249.6, 73.8], MID, 'stand', 'on one leg at the north edge of the light, where the Flock will pitch'),
      mark('flock', [247.9, 73.3], MID, 'stand', 'on one leg beside her'),
      mark('flock', [251.3, 74.5], MID, 'stand', 'on one leg beside her'),
      // Arrival: by root (the camp's west edge).
      mark('bracken', [235.6, 85.4], [240.0, 83.0], 'stand', 'at the edge of the light, out of the scrub'),
      mark('unmowed', [233.6, 87.2], MID, 'stand', 'with a lantern, behind the Elder'),
      mark('unmowed', [233.9, 83.6], MID, 'stand', 'with a lantern, behind the Elder'),
      mark('player', [240.0, 83.0], [235.6, 85.4], 'stand', 'come to meet them at the west edge'),
      mark('pip', [241.4, 81.2], [235.6, 85.4], 'stand', 'half behind the player'),
      mark('tumblesoil', [237.9, 82.4], [240.0, 83.0], 'stand', 'up out of the molehill, shaking off the soil'),
      mark('nubbin', [238.4, 80.9], [240.0, 83.0], 'stand', 'up out of the same hole, late'),
      // Arrival: up the track from the highway (the camp's east edge).
      mark('diggs', [256.2, 77.2], [252.4, 79.0], 'stand', 'at the head of the column, halted'),
      mark('spade-guard', [258.6, 76.2], [252.4, 79.0], 'stand', 'in the column, at attention'),
      mark('spade-guard', [258.6, 78.2], [252.4, 79.0], 'stand', 'in the column, at attention'),
      mark('player', [252.4, 79.0], [256.2, 77.2], 'stand', 'come to meet the column'),
      mark('nubbin', [251.0, 77.6], [256.2, 77.2], 'stand', 'beside the player, at mole height'),
      mark('granny', [260.6, 79.6], [256.2, 77.2], 'stand', 'off her Ride-On with a covered pie tin'),
      // The outro: the table (south side faces north, north side faces south), the ends, the rail.
      mark('lulu', [244.6, 82.95], MID, 'stand', 'south side of the table'),
      mark('bracken', [245.6, 82.95], MID, 'stand', 'south side of the table'),
      mark('tumblesoil', [246.5, 82.95], MID, 'stand', 'south side of the table, on a crate to reach'),
      mark('diggs', [247.4, 82.95], MID, 'stand', 'south side of the table, at attention even here'),
      mark('hogweed', [244.8, 81.05], MID, 'stand', 'north side of the table'),
      mark('saxifrage', [247.3, 81.05], MID, 'stand', 'north side of the table, on one leg'),
      mark('granny', [246.1, 80.95], MID, 'stand', 'north side, setting the pie down in the middle'),
      mark('tansy', [248.3, 82.0], MID, 'stand', 'the east end of the table'),
      mark('player', [243.6, 82.3], MID, 'stand', 'the west end of the table'),
      mark('pip', [243.9, 83.6], MID, 'stand', 'by the player, south-west corner'),
      mark('nubbin', [246.7, 83.9], MID, 'stand', 'beside Tumblesoil'),
      mark('tansy', [247.0, 86.3], [245, 87.6], 'stand', 'at the east end of the hat rail, counting along it'),
    ],
    cameras: [
      cam('camp-crane', [262, 16, 104], [246, 0.8, 82], 'crane-high over the camp: the table, the rail, the fire, the dark Flats round it (one of the five)', 52),
      cam('fire-low', [238.8, 0.9, 76.6], [247, 0.8, 81.4], 'low past the campfire onto the table', 44),
      cam('scrub-west', [242.6, 1.2, 82.6], [226, 1.2, 88], "from the camp west into the dark scrub: the Unmowed's lanterns", 36),
      cam('track-east', [251.5, 1.4, 79.2], [272, 0.9, 76], 'from the camp east down the track from the highway', 40),
      cam('rail-back', [245.2, 1.6, 90.2], [246, 1.0, 82], 'from behind the hat rail, over the hats, onto the table', 46),
      cam('flock-wide', [244.5, 1.4, 84.0], [249.6, 1.0, 74.0], 'from the table to the Flock on one leg at the edge of the light', 44),
    ],
    walks: [],
    vehicles: [
      car('m64-granny-ride', 'pull-up', 'ride-on', [264.6, 79.0], -Math.PI / 2, 'granny', "Granny's lilac Ride-On, a cooler of pies on the back, stopped behind the column"),
    ],
    paths: [
      { id: 'granny-in', role: 'arrival', kind: 'ride-on', offRoad: true, points: [[271.6, 78.3], [268, 78.6], [264.6, 79.0]], note: "Granny's Ride-On behind the column, at marching pace" },
    ],
    set: [],
  },
];

/** Existing stage id -> this row's quest ids (the overlook safehouse, where Tansy gives both parts). */
export const USES: Record<string, string[]> = { 'dust-safehouse': [P3, FINAL] };
