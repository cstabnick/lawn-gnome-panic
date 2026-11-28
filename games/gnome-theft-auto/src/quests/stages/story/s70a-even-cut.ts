// Story row 70 (The Even Cut, extended), parts 1 and 2: the stages their four scenes play on. Part 3 and the final have
// their own file (s70-even-cut.ts). Nothing here builds set dressing in the world: the scenes carry their own props (the
// cutscene-only Grand Combine, prefab grand-combine-boss at the boss runner's scale 5, its opened deck, the beacon fire).
// - e70a-bobble-dawn: the Bobble, the Hatbrim's summit (R-234), where Hogweed stood the beacon in row 64 p2 and lights it
//   at dawn on the longest day (p1 intro's hook).
// - e70a-camp-dawn: inside the coalition camp's ring at the overlook (W16, worldChanges/rows/coalitionCamp.ts, centre
//   (246, 82), ring 9): the camera stands in the gap between the Underspanners' tent (81 deg) and the Unmowed's (133 deg)
//   and looks north over the crate table (p1 intro's montage).
// - e70a-meridian: the meridian (the x = 0 road) north of downtown, where the Vanguard walked in front of the Combine and
//   the boss runner starts it (z -240, rolling south, +z). p1 outro, p2 intro's key, p2 outro's landing.
// - e70a-overlook-plane: the open dust east of the safehouse where the air-drop objective spawns the plane (planeAt
//   (305, 40)): p2 intro's button.
// The montage also stands on existing stages (USES below): the canal, the Dirt Bowl's tower, the Burrow Door, Café
// Pardon's terrace, the Brassknock forecourt, the Anthill forecourt, and the safehouse map table.
import { cam, car, mark, type Stage } from '../kit';

const P1 = 'ch5-even-cut-p1';
const P2 = 'ch5-even-cut-p2';
const BOTH = [P1, P2];
/** The beacon's iron basket on the Bobble's highest stones (as row 64 p2 stood it). */
const BEACON: [number, number] = [697.4, -1688.4];

export const STAGES: readonly Stage[] = [
  {
    id: 'e70a-bobble-dawn',
    name: 'The Bobble at dawn on the longest day, the beacon on the highest stones',
    region: 'north-highlands',
    center: [694.5, -1686],
    radius: 8,
    facing: 0,
    time: 'dawn',
    built: 'existing',
    usedBy: [P1],
    look: 'The bald top of the yard in the first light, the cairn and the Summit Register, and an iron fire basket on a tripod against a sky going from violet to gold.',
    sounds: 'A hard wind over the stones, a radio crackling in a pocket, a match, and a basket of kindling going up all at once.',
    marks: [
      mark('hogweed', [695.6, -1685.4], BEACON, 'stand', 'at the beacon with a long match, goggles down, a radio in his apron pocket'),
    ],
    cameras: [
      cam('dawn-wide', [709, 5, -1674], [697, 1.8, -1688], 'establishing, from the south-east: the summit dome, the tripod on the skyline and Hogweed small beside it', 50),
      cam('basket-low', [693.6, 1.2, -1683.8], [697.4, 2.2, -1688.4], 'low past Hogweed onto the basket: the moment it catches', 40),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'e70a-camp-dawn',
    name: 'The coalition camp at the overlook, at dawn',
    region: 'dust-flats',
    center: [246, 86],
    radius: 9,
    facing: Math.PI,
    time: 'dawn',
    built: 'existing',
    usedBy: [P1],
    look: 'The ring of tinted tents round the crate table, the fire down to embers, and two old men facing north: one on a crate who never stands, one in olive with binoculars.',
    sounds: 'Embers ticking, a tent flap, a crate creaking as somebody gets up off it.',
    marks: [
      mark('wally', [244.2, 86.6], [244.2, 70], 'sit', 'on a crate inside the ring, binoculars on his chest, facing north'),
      mark('diggs', [247.8, 86.2], [250, 70], 'stand', 'at attention beside him, binoculars up to the north'),
    ],
    cameras: [
      cam('camp-low', [243.4, 1.0, 93], [246, 1.5, 84.5], 'low in the tent gap from the south: the two of them small against the table and the northern sky', 44),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'e70a-meridian',
    name: 'The meridian north of downtown, where the Vanguard walked and the Combine rolls',
    region: 'turfton',
    center: [0, -215],
    radius: 30,
    facing: 0,
    time: 'day',
    built: 'existing',
    usedBy: BOTH,
    look: 'The long straight x = 0 road out of downtown, an HOA clipboard face down on the asphalt, and a beige-and-obsidian machine the width of the road coming south at walking pace.',
    sounds: 'A diesel the size of a street, a reel turning, rotors winding down, a push-bike bell, the PA horns crackling on the roof.',
    marks: [
      mark('player', [3.2, -192], Math.PI, 'stand', 'p1 outro: in the road after the Vanguard, facing north at what is coming'),
      mark('diggs', [9.4, -198.6], [3.2, -192], 'stand', 'p1 outro: down from the copter, at attention'),
      mark('pip', [1.4, -188.6], [3.2, -192], 'stand', 'p1 outro: off the push-bike, the parachute pack on his back'),
      mark('pip', [1.8, -254.6], 0, 'stand', "p2 intro: at the Combine's tail with the Countess's key in the lock plate"),
      mark('pip', [9.6, -231.4], [0, -240], 'stand', 'p2 outro: on the verge, waving both arms at the deck'),
    ],
    cameras: [
      cam('road-north', [-7, 2.4, -176], [0, 4, -215], 'over the player in the road: the empty meridian, and far up it the Combine', 50),
      cam('under-low', [4.5, 0.5, -204], [0, 6, -246], 'ground level on the road, looking up the meridian into the Combine coming on', 48),
      cam('deck-high', [-9, 9.5, -254], [0, 5.8, -250], "high off the Combine's west flank onto its rear hull: the shield grates, then the open beige deck", 44),
      cam('sky-low', [5, 0.6, -226], [0, 22, -238], 'low on the road ahead of the machine, straight up at the sky over its deck', 50),
    ],
    walks: [],
    vehicles: [
      car('e70a-copter-down', 'pull-up', 'sycamore-copter', [12.5, -201.5], Math.PI, 'diggs', "the Spade Guard's copter, set down on the verge"),
      car('e70a-pip-bike', 'pull-up', 'push-bike', [2.4, -187.6], Math.PI, 'pip', "Pip's push-bike, skidded to a stop"),
    ],
    paths: [
      { id: 'pip-in', role: 'arrival', kind: 'push-bike', points: [[2.4, -150], [2.4, -170], [2.4, -187.6]], note: 'Pip pedalling north up the meridian from downtown' },
    ],
    set: [],
  },
  {
    id: 'e70a-overlook-plane',
    name: 'The open dust east of the Overlook safehouse, the plane warm',
    region: 'dust-flats',
    center: [303, 42],
    radius: 8,
    facing: 0,
    time: 'day',
    built: 'existing',
    usedBy: [P2],
    look: 'Flat gold dust east of the hut, a Crop Duster ticking over with its nose to the south, and a parachute pack on the wing.',
    sounds: 'A propeller idling, wind over the dust, a pack strap pulled tight.',
    marks: [
      mark('player', [301.4, 43.4], [305, 40], 'stand', 'at the wing, the parachute pack on, looking at the cockpit'),
    ],
    cameras: [
      cam('plane', [297.6, 1.5, 47.6], [304, 1.4, 40], 'from the safehouse side onto the player at the wing and the plane', 46),
    ],
    walks: [],
    vehicles: [
      car('e70a-plane', 'parked', 'plane', [305, 40], 0, undefined, 'where the air-drop objective spawns the plane (planeAt)'),
    ],
    paths: [],
    set: [],
  },
];

/**
 * Existing stage id -> this part's quest ids. The safehouse is the giver's (both parts start there and p1's intro ends at
 * its map table); the rest are the montage's places and the two callers'.
 */
export const USES: Record<string, string[]> = {
  'dust-safehouse': BOTH,
  'brenda-throne': [P1],
  'rutbottom-tower': [P1],
  'burrow-door': [P1],
  'cafe-pardon-terrace': [P1],
  'manor-terrace-day': [P2],
  'anthill-forecourt': [P2],
};
