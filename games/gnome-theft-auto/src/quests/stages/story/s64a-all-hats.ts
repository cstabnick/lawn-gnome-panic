// Story row 64 (All Hats, extended), parts 1 and 2: the stages their seven scenes play on. Part 3 and the final have their
// own file (s64-all-hats.ts). Nothing here builds set dressing in the world: the scenes carry their own props, and the
// Queen moored at New Puddle afterwards is W16 (worldChanges/rows/coalitionCamp.ts).
// - m64a-overlook-rail: the east edge of the Dust Flats overlook, a few paces from the safehouse map table, where a scene
//   rail looks out over the highway bend at Fort Sandpit (p1 intro at dawn, p2 intro's opening, p2 outro).
// - brenda-throne (cloverfield.ts): the Vinyl Lounge on the drainage canal (p1 toll).
// - m64a-dune-cut: the Saltcut's west bank under the dune line, where the channel narrows (the Queen waits in it; p1 cut).
// - m64a-marina: New Puddle Marina on the Puddle Sea's north shore, the east dock (x 640, top y -4.74, z 770..782,
//   waterworks.ts) and the shore at its root (p1 outro).
// - m64a-airfield-line: the Desert Airfield apron east of the two parked Crop Dusters (AIRFIELD.planeSpots x 415, 440),
//   south of Hangar Two: the Underspanners' line of aircraft (p2 intro, p2 outro cutaway).
// - m64a-brim-gap: the lookout at the Top Hat café, Brim Gap (mountainRoutes BRIM_GAP_SPOTS.lookout), where Velma Crown
//   counts the cars through the coin telescope (p2 gap).
// - m64a-bobble-summit: the Bobble's summit by the Summit Register (BRIM_WALK_SPOTS.summit (690, -1690), ~105 m), where
//   Hogweed builds the beacon (p2 gap).
import { cam, car, mark, type Stage } from '../kit';

const P1 = 'm64-all-hats-p1';
const P2 = 'm64-all-hats-p2';

export const STAGES: readonly Stage[] = [
  {
    id: 'm64a-overlook-rail',
    name: 'The Dust Flats overlook, at the rail over the highway bend',
    region: 'dust-flats',
    center: [285, 37],
    radius: 10,
    facing: Math.PI / 2,
    time: 'golden',
    built: 'existing',
    usedBy: [P1, P2],
    look: 'The east lip of the overlook rise: a split-rail fence over the highway bend, a sock pegged to the top rail, and Fort Sandpit\'s walls in the east under coalition colours.',
    sounds: 'Wind over the dust, a sock flapping on a peg, the safehouse radio crackling on the map table behind.',
    marks: [
      mark('tansy', [286.6, 35.4], [300, 35.4], 'lean', 'leans on the rail, the sock map pegged in front of her, looking east at the fort'),
      mark('pip', [285.8, 38.6], [286.6, 35.4], 'stand', 'bounces at her elbow, a felt-tip behind his ear'),
      mark('player', [283.2, 36.4], [286.6, 35.4], 'stand', 'walks up from the map table'),
      mark('wally', [284.0, 41.2], [286.6, 35.4], 'stand', 'the p2 outro: in from the Crop Duster, binoculars round his neck'),
    ],
    cameras: [
      cam('wide', [268, 7, 22], [287, 1.2, 37], 'establishing at dawn: the rise from the south-west, the rail small against the long light, the fort beyond', 54),
      cam('east', [282.4, 1.8, 34.6], [330, 2.4, 40], 'over the rail and the sock, east across the highway bend to Fort Sandpit', 44),
      cam('landing', [276, 2.2, 32], [262, 1.4, 22], 'from the rise onto the open dust where the Crop Duster lands', 48),
    ],
    walks: [],
    vehicles: [
      car('m64a-duster-landed', 'parked', 'plane', [262, 22], Math.PI / 2, 'wally', 'the Crop Duster rolled to a stop on the open dust south-west of the rail'),
    ],
    paths: [],
    set: [],
  },
  {
    id: 'm64a-dune-cut',
    name: 'The dune cut: the Saltcut under the dune line',
    region: 'south-shore',
    center: [697, 933],
    radius: 14,
    facing: Math.PI,
    water: true,
    time: 'day',
    built: 'existing',
    usedBy: [P1],
    look: 'The Saltcut narrowing between bleached dunes, the Bathtub Queen nosed into it with her tour still aboard, and a walnut dinghy tied at the west bank with a bell on its bow.',
    sounds: 'Wind in the marram grass, small water slapping a toy hull, a ship\'s bell, a tour guide booming at a dune.',
    marks: [
      mark('player', [696.4, 931.0], [712, 950], 'stand', 'comes down the dune to the water, the Queen in front'),
      mark('driftwood', [697.6, 935.8], [696.4, 931.0], 'stand', 'on the bank by his dinghy, one hand on the painter'),
      mark('samphire', [709, 949.6], [700, 934], 'drive', 'in the tender at the Queen side, the last of the tour beside her, booming', 0.4),
    ],
    cameras: [
      cam('wide', [684, 5.0, 915], [709, 1.4, 946], 'establishing: from the dune crest down the cut, the Queen nosed in, the dinghy at the bank', 54),
      cam('up-cut', [715, 3.6, 966], [704, 1.2, 905], 'from astern of the Queen, north up the narrow cut to the Puddle Sea', 46),
    ],
    walks: [],
    vehicles: [
      car('m64a-queen-tender', 'parked', 'gravy-boat', [709, 949.6], Math.PI, 'samphire', "the Queen's tender, alongside her port side"),
      car('m64a-lead-dinghy', 'parked', 'walnut-dinghy', [706.5, 928], Math.PI, 'driftwood', "Driftwood's walnut dinghy, bell on the bow, nose up the cut"),
    ],
    paths: [
      { id: 'lead-in', role: 'arrival', kind: 'walnut-dinghy', points: [[708, 915], [704, 895], [690, 868], [662, 832]], note: 'the lead: up the cut, out into the Puddle Sea, toward the marina' },
    ],
    set: [],
  },
  {
    id: 'm64a-marina',
    name: 'New Puddle Marina, the east dock',
    region: 'cloverfield-farms',
    center: [645, 765],
    radius: 14,
    facing: Math.PI,
    water: true,
    time: 'day',
    built: 'existing',
    usedBy: [P1],
    look: 'Two timber docks into the Puddle Sea; at the end of the east one a deck chair set out as a throne between two flamingos, and the Bathtub Queen tied up off its end.',
    sounds: 'Lapping water, rope on timber, a boombox far off on the shore, a push-bike bell, a ship\'s bell.',
    marks: [
      mark('brenda', [640, 776.6], [640, 788], 'sit', 'on her travelling throne mid-dock, feather duster across her knees', 1.6),
      mark('biker', [639.1, 781.4], [640, 788], 'stand', 'at the dock end with a flamingo under one arm', 1.6),
      mark('player', [645.4, 765.0], [640, 780], 'stand', 'steps ashore at the dock root'),
      mark('samphire', [640, 780.8], [640, 776.6], 'stand', 'stepped off onto the dock end, the Queen tied behind her', 1.6),
    ],
    cameras: [
      cam('wide', [662, 4.5, 752], [640, 2.2, 784], 'establishing: the shore, the east dock and the Queen tied off its end', 54),
      cam('broadside', [656, 2.0, 785], [640, 1.4, 784], 'level across the water from the east: the dock end and the Queen in one frame', 42),
    ],
    walks: [],
    vehicles: [
      car('m64a-dinghy-moored', 'parked', 'walnut-dinghy', [645, 777], Math.PI, undefined, 'the lead dinghy, tied alongside the east dock'),
    ],
    paths: [],
    set: [],
  },
  {
    id: 'm64a-airfield-line',
    name: 'Desert Airfield apron, the Underspanners\' line',
    region: 'dust-flats',
    center: [472, -86],
    radius: 26,
    facing: 0,
    time: 'day',
    built: 'existing',
    usedBy: [P2],
    look: 'The apron south of Hangar Two under a white noon: a Hedge-Hopper with its cowling off, a chalk board of ratios on an easel, Underspanners in goggles, and by the end a line of odd aircraft facing the runway.',
    sounds: 'A windsock snapping, a spanner on a propeller hub, chalk squeaking, the Dewdrop rolling on hot asphalt.',
    marks: [
      mark('wally', [451.8, -79.2], [455, -80.4], 'stand', 'at the Hedge-Hopper\'s nose, clipboard under his arm'),
      mark('hogweed', [458.4, -79.6], [455, -80.4], 'stand', 'on the other side of the propeller, a spanner on a string'),
      mark('underspanner', [462.6, -77.0], [458.4, -79.6], 'stand', 'holds the chalk board steady'),
      mark('underspanner', [448.0, -76.0], [451.8, -79.2], 'stand', 'waits with a wheel chock'),
    ],
    cameras: [
      cam('wide', [438, 5.0, -104], [470, 1.4, -84], 'establishing: from the runway edge, the apron, the aircraft and Hangar Two behind', 54),
      cam('line', [506, 1.8, -97], [462, 1.2, -84], 'low along the line of aircraft from its east end', 40),
    ],
    walks: [],
    vehicles: [
      car('m64a-line-hopper', 'parked', 'hedge-hopper', [455, -84], 0, 'hogweed', 'the Underspanners\' Hedge-Hopper, nose to the runway, cowling off'),
      car('m64a-line-copter', 'parked', 'sycamore-copter', [466, -86], 0, undefined, 'a Sycamore Copter, blades tied down'),
      car('m64a-line-duster', 'parked', 'plane', [478.5, -88], 0, undefined, 'a second Crop Duster, borrowed, nose south'),
      car('m64a-line-drifter', 'parked', 'dandelion-drifter', [491, -86], 0, undefined, 'a Dandelion Drifter, tethered to a fuel drum'),
      car('m64a-line-dewdrop', 'parked', 'bubble-mobile', [499, -86], 0, undefined, 'the Dewdrop, last in the line'),
      car('m64a-hogweed-buggy', 'parked', 'barrow-buggy', [446, -72], Math.PI, 'hogweed', 'Hogweed\'s Barrow Buggy, parked at the top of the spur'),
    ],
    paths: [
      { id: 'dewdrop-run', role: 'patrol', kind: 'bubble-mobile', points: [[432, -79.5], [470, -79.5], [499, -82]], offRoad: true, note: 'the Dewdrop rolls along the apron ahead of the Underspanners, north of the caravan' },
      { id: 'buggy-off', role: 'getaway', kind: 'barrow-buggy', points: [[446, -72], [450, -60], [450, -20]], note: 'Hogweed down the airfield spur, by road' },
    ],
    set: [],
  },
  {
    id: 'm64a-brim-gap',
    name: 'The Top Hat lookout, Brim Gap',
    region: 'north-highlands',
    center: [694, -1553],
    radius: 12,
    facing: -0.93,
    time: 'day',
    built: 'existing',
    usedBy: [P2],
    look: 'The lookout beside the Top Hat café: a brass topograph, a coin telescope pointed at the sky, a black top-hat roof behind, and a Barrow Buggy in the car park.',
    sounds: 'Wind over the saddle, a cup on a saucer, a goat, and an engine drone coming up out of the south.',
    marks: [
      mark('velma', [693.6, -1550.4], [692.7, -1549.8], 'stand', 'at the coin telescope, a tea cup in one hand and a tally card in the other'),
    ],
    cameras: [
      cam('wide', [714, 5, -1574], [695, 1.8, -1553], 'establishing: across the saddle from the road, the Top Hat café and its lookout', 54),
      cam('sky', [695.6, 1.4, -1547.6], [688, 40, -1640], 'low behind Velma, up past the telescope to the sky over the Bobble', 50),
    ],
    walks: [],
    vehicles: [
      car('m64a-gap-buggy', 'parked', 'barrow-buggy', [706, -1566], -0.93, 'hogweed', 'Hogweed\'s Barrow Buggy, parked by the café, still ticking'),
    ],
    paths: [],
    set: [],
  },
  {
    id: 'm64a-bobble-summit',
    name: 'The Bobble, the Hatbrim\'s summit',
    region: 'north-highlands',
    center: [694, -1686],
    radius: 10,
    facing: 0,
    time: 'day',
    built: 'existing',
    usedBy: [P2],
    look: 'The bald top of the yard: a cairn, the Summit Register in its tin box, snow in the hollows, and a tripod beacon going up on the highest stones.',
    sounds: 'A hard wind, a tin lid rattling, kindling being stacked, a parachute snapping as it falls in.',
    marks: [
      mark('hogweed', [695.6, -1685.4], [697.4, -1688.4], 'work', 'stacks kindling into the beacon basket, goggles up'),
    ],
    cameras: [
      cam('wide', [710, 6, -1672], [695, 1.6, -1688], 'establishing: the summit dome from the south-east, the beacon tripod on the skyline', 52),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Record<string, string[]> = {
  'brenda-throne': [P1],
  'airfield-apron': [P2],
};
