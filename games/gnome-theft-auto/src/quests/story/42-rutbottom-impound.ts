// Story row 42: Rutbottom Impound. The HOA has taped six Carburettor rides into the pits of the Rutbottom Dirt Bowl, and
// Marshal Clary Mudguard, who fears an HOA permit more than she likes anyone, will release them only if somebody beats the
// HOA's entry on her oval. The player takes a dirt bike, wins three laps against three HOA riders, then drives a ride out of
// the yard to the gate. The Carburettors roll out in a line under a green flag, and Clary hands over the bike's keys.
// Previously: Lulu leads the loyal Carburettors and needs their rides back before the Combine's roads close.
// Giver: a new `lulu-dirt-bowl` at the fence by the gate (Lulu is the row's heart; Clary's `rutbottom-clary` marker stays the
// Knobbly Heat's, which this row unlocks, so one marker does not carry two unrelated jobs).
import { BOWL_GATE, PITS } from '../../rutbottom/spots';
import type { QuestDef, RaceRival } from '../types';
import { brief, call, type StoryFile } from './kit';

const ID = 'm42-rutbottom-impound';

/** The HOA entry: black hat, beige shirt, no joy. Slower than the Heat's regulars: a closed-road clerk's pace. */
const HOA_HAT = 0x18181e;
const HOA_SHIRT = 0xc9b99b;
const HEMLINE: RaceRival = {
  name: 'Deputy Hemline', look: { hat: HOA_HAT, shirt: HOA_SHIRT, beard: 0x555555 }, tint: 0xc9b99b,
  pace: 0.94, grip: 0.95, line: -2, aggression: 0.35,
  taunts: ['Lap times are filed in triplicate.', 'Enthusiasm is a violation. Section nine.'],
};
const GUSSET: RaceRival = {
  name: 'Cadet Gusset', look: { hat: HOA_HAT, shirt: HOA_SHIRT, beard: null, glasses: true }, tint: 0xc9b99b,
  pace: 0.9, grip: 0.95, line: 2, aggression: 0.25,
  taunts: ['We ride at the posted speed. Posted by us.', 'Your berm has no permit.'],
};
const TOLLIVER: RaceRival = {
  name: 'Rider Tolliver', look: { hat: HOA_HAT, shirt: HOA_SHIRT, beard: 0x2a2a2a }, tint: 0xc9b99b,
  pace: 0.97, grip: 1.0, line: 0, aggression: 0.5,
  taunts: ['Corners are approved in advance.', 'I will be reporting this corner.'],
};

const QUEST: QuestDef = {
  id: ID,
  title: 'Rutbottom Impound',
  giver: 'lulu-dirt-bowl',
  prereq: 'm41-pinwheel-ridge',
  chapter: 3,
  rewardAcorns: 400,
  radioBulletin: ID,
  hoa: 'off',
  cutscene: { kind: 'script', script: 'm42-rutbottom-impound-intro' },
  outro: { kind: 'script', script: 'm42-rutbottom-impound-outro' },
  objectives: [
    {
      kind: 'race',
      text: "Win three laps on Clary's oval against the HOA's riders",
      raceId: 'rutbottom-impound',
      trackId: 'rutbottom',
      vehicle: 'dirt-bike',
      laps: 3,
      rivals: [HEMLINE, GUSSET, TOLLIVER],
      mustPlace: 1,
      hint: 'Rutbottom Dirt Bowl grid, the start line by the starter\'s tower',
      tint: 0xc9a66b,
    },
    {
      kind: 'steal-deliver',
      text: 'Drive an impounded Carburettor ride out of the pits to the gate',
      vehicleKind: 'lowrider',
      spawnAt: [PITS.minX + 14, PITS.maxZ - 24, -Math.PI / 2],
      dropAt: [BOWL_GATE.x, BOWL_GATE.z],
      radius: 8,
      hint: 'The impound yard in the pits, then out through the gate on the road',
      maxDamage: 0.4,
      banter: [
        'Lulu: "Taped up like a parcel. Tear it off, sugar, it is just beige."',
        'Lulu: "Mind her paint. She has been through enough paperwork."',
        'Lulu: "That is my cousin\'s car. Do not hit the posts."',
      ],
    },
  ],
  doneText: 'You beat the HOA on the oval and drove the first ride out. Clary waved the green flag, and six Carburettors rolled out in a line. The dirt bike\'s keys are yours now: Rutbottom is open for racing.',
};

export const STORY: StoryFile = {
  quests: [QUEST],
  givers: {
    'lulu-dirt-bowl': {
      id: 'lulu-dirt-bowl',
      name: 'Rutbottom Dirt Bowl (Lugnut Lulu)',
      label: 'Talk to Lugnut Lulu',
      // The fence just inside the road gate, west of the pits (rutbottom/spots.ts BOWL_GATE, PITS).
      x: BOWL_GATE.x + 8,
      z: BOWL_GATE.z + 8,
      exit: { x: BOWL_GATE.x + 11, z: BOWL_GATE.z + 8, yaw: Math.PI / 2 },
      room: 'street',
      letter: 'L',
    },
  },
  comms: {
    [ID]: {
      0: brief(
        ['lugnut lulu', 'HOA taped six of ours into the Rutbottom Dirt Bowl pits. Roads close soon.'],
        ['lugnut lulu', 'Clary lets them go if you beat the HOA entry. East, past the campus.'],
        ['clary', 'Three laps, dirt bike, no cutting the banks. The berm remembers. Go on, then.'],
      ),
      1: call(
        ['clary', 'Beaten fair. The yard is open. One ride, out the gate, no scrapes.'],
        ['lugnut lulu', 'Gate is clear. Bring her out, sugar. The rest follow in a line.'],
      ),
    },
  },
  bulletins: {
    [ID]: [
      'Turfton FM reports a lively afternoon at the Rutbottom Dirt Bowl, where a dirt bike beat three entries from the HOA over three laps. The HOA has filed an appeal, in triplicate.',
      'A marshal at the Bowl confirms six lowriders left the pits under a green flag. She also said "go on, then" nineteen times. Nobody counted but her.',
    ],
  },
  plans: { [ID]: { suite: 'story', expect: 'pass' } },
};
