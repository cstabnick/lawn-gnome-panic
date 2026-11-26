// Story row 41 stages (Pinwheel Ridge, the wind farm: campus/types.ts WIND_FARM).
// - pinwheel-hut: Ragwort Coilspring's control hut on the north flank (giver ragwort-ridge); the service track runs up from
//   the north (850, -1290). Lulu's lowrider drops the player here in the intro (dawn).
// - pinwheel-old-spin: the foot of Old Spin (mast 2), where the first cable is cut and the mid scene plays (day).
// - pinwheel-last-mast: the foot of Whirly Bob (mast 8), where the last crank is turned and the outro plays (dusk).
import { cam, car, mark, type Stage } from '../kit';

const ID = 'm41-pinwheel-ridge';

export const STAGES: readonly Stage[] = [
  {
    id: 'pinwheel-hut',
    name: "Pinwheel Ridge, Ragwort's control hut",
    region: 'north-highlands',
    center: [860, -1242],
    radius: 12,
    facing: Math.PI,
    time: 'dawn',
    built: 'existing',
    givers: ['ragwort-ridge'],
    usedBy: [ID],
    look: 'A grey control hut on the north flank, ten giant garden pinwheels standing silent on the crest above it, fat black HOA cable snaking down the hill, a bench and a thermos by the door.',
    sounds: 'High wind in the guy ropes, a tin shutter banging, the cable creaking against its stakes, no whirr from the blades.',
    marks: [
      mark('ragwort', [857.2, -1241.8], [850, -1262], 'stand', 'at her hut door, hard hat on, a clipboard of cable runs under one arm'),
      mark('player', [852.6, -1252.4], [857.2, -1241.8], 'stand', 'steps down from the track, where the lowrider stopped'),
      mark('lulu', [850.6, -1253.2], [857.2, -1241.8], 'drive', 'leans out of her lowrider window, engine running'),
    ],
    cameras: [
      cam('hut-door', [851, 1.5, -1254], [857.2, 1.5, -1241.8], 'from the track up to Ragwort at her door', 46),
      cam('ridge-low', [868, 0.9, -1246], [841.5, 24, -1203.2], 'low from beside the hut up the hill at the stalled blades of Sulks', 52),
    ],
    walks: [],
    vehicles: [
      car('ridge-lulu-car', 'pull-up', 'lowrider', [850.4, -1254.4], 0, 'lulu', "Lulu's lowrider, rumbling at the foot of the hut path"),
    ],
    paths: [
      { id: 'ridge-lulu-in', role: 'arrival', kind: 'lowrider', offRoad: true, points: [[850, -1292], [850, -1270], [850.4, -1254.4]], note: 'down the service track from the north road' },
      { id: 'ridge-lulu-out', role: 'getaway', kind: 'lowrider', offRoad: true, points: [[850.4, -1254.4], [853.4, -1251], [854, -1262], [852, -1276], [850, -1296]], note: 'a loop round the hut path and back down the track' },
    ],
    set: [],
  },
  {
    id: 'pinwheel-old-spin',
    name: 'Pinwheel Ridge, the foot of Old Spin',
    region: 'north-highlands',
    center: [746, -1199],
    radius: 10,
    facing: Math.PI,
    time: 'day',
    built: 'existing',
    usedBy: [ID],
    look: 'The second pinwheel on the crest, a hand-painted OLD SPIN on its plinth, the HOA cable cut in two on the hillside and a padlocked box with a plate beside it.',
    sounds: 'A gust, then the creak of a rotor breaking loose, then a steady turbine whirr.',
    marks: [
      mark('player', [748.6, -1198.6], [745, -1201.5], 'stand', 'at the plinth, under the blades, the cut cable behind'),
      mark('ragwort', [742.4, -1198.4], [745, -1201.5], 'stand', 'steps up with her clipboard held against the wind'),
    ],
    cameras: [
      cam('old-spin-low', [753, 0.9, -1193], [752, 23, -1201.2], 'low from the crest straight up at the first blades turning', 54),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'pinwheel-last-mast',
    name: 'Pinwheel Ridge, the foot of Whirly Bob',
    region: 'north-highlands',
    center: [925, -1198],
    radius: 10,
    facing: 0,
    time: 'dusk',
    built: 'existing',
    usedBy: [ID],
    look: 'The eighth pinwheel on the crest, WHIRLY BOB on its plinth, the hand crank on its south side, the whole ridge catching the last of the sun and a long view south over the valley to Turfton.',
    sounds: 'A steady pinwheel whirr in the wind, a far drone of town, a tin mug set down on the plinth.',
    marks: [
      mark('player', [925.5, -1197], [925, -1190], 'stand', 'with a hand on the crank'),
      mark('ragwort', [921.5, -1197.6], [925, -1190], 'stand', 'at the plinth, hard hat tipped back, looking south'),
    ],
    cameras: [
      cam('last-mast-south', [926, 1.5, -1195], [900, 1.5, -1100], 'from the crank looking south down the valley toward Turfton', 52),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> this row's quest ids. */
export const USES: Record<string, string[]> = {};
