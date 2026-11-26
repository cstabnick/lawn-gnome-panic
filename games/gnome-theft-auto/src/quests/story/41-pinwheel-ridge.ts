// Story row 41: Pinwheel Ridge. The HOA re-cabled Ragwort Coilspring's wind farm to charge the Grand Combine's cells: three
// of her ten pinwheels (Old Spin, Sulks, Whirly Bob) now feed a fat black cable down the hill. The player cuts the first
// cable, cracks the linemen who guard the second and third, then hand-cranks the last pinwheel until it spins loose. Part one
// of four (power) is cut, and Turfton's neon comes back at dusk (W10). Intro: Lulu's car drops the player at the hut (dawn).
// Mid: Old Spin turns for the first time in eleven years. Outro: dusk on the crest, the lights far below.
// Previously: Lulu has the Carburettors clear of the HOA and drives the player to the next edge of the map.
import { WIND_FARM } from '../../campus/types';
import type { InspectPoint, QuestDef, TargetDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const ID = 'm41-pinwheel-ridge';

/** The three re-cabled masts (windFarm.ts HOA_MASTS 1, 4, 7): Old Spin, Sulks, Whirly Bob. */
const OLD_SPIN = WIND_FARM.pinwheels[1];
const SULKS = WIND_FARM.pinwheels[4];
const WHIRLY_BOB = WIND_FARM.pinwheels[7];

/** The HOA lineman look: black hat, beige shirt (the same as every HOA enforcer in the story). */
const LINEMAN: TargetDef['look'] = { hat: 0x18181e, shirt: 0xc9b99b };

const mk = (id: string, name: string, near: [number, number], hint: string): TargetDef => ({ id, name, near, hint, look: LINEMAN });

const SULKS_GUARD: TargetDef[] = [
  mk('ridge-lineman-1', 'Lineman Hasp', [SULKS.x - 4, SULKS.z - 9], 'Sulks, the fifth pinwheel'),
  mk('ridge-lineman-2', 'Lineman Gauge', [SULKS.x + 4, SULKS.z - 10], 'Sulks, the fifth pinwheel'),
];
const BOB_GUARD: TargetDef[] = [
  mk('ridge-lineman-3', 'Lineman Shackle', [WHIRLY_BOB.x - 4, WHIRLY_BOB.z - 9], 'Whirly Bob, the eighth pinwheel'),
  mk('ridge-lineman-4', 'Lineman Spool', [WHIRLY_BOB.x + 4, WHIRLY_BOB.z - 10], 'Whirly Bob, the eighth pinwheel'),
];

/** A cable reel marks the spot where the HOA's cable leaves the plinth (windFarm.ts: the cable runs north from the mast). */
const CABLE_CUT: InspectPoint = {
  at: [OLD_SPIN.x - 0.4, OLD_SPIN.z - 9],
  label: 'Old Spin: the HOA cable',
  prop: 'hoa-cable-reel',
  radius: 4,
  note: 'The cable parts with a crack. Old Spin shivers on its pole: eleven years stalled, and it is already turning.',
};

/** The hand crank at the foot of the last pinwheel (south side of the plinth, the sunny one). */
const CRANK: InspectPoint = {
  at: [WHIRLY_BOB.x + 0.5, WHIRLY_BOB.z + 3.5],
  label: 'Whirly Bob: the hand crank',
  radius: 4,
  note: 'Whirly Bob catches the wind and goes. Down the hill the cable goes slack, and the Combine loses its power.',
};

const QUEST: QuestDef = {
  id: ID,
  title: 'Pinwheel Ridge',
  giver: 'ragwort-ridge',
  prereq: 'm40-the-capwood-run',
  chapter: 3,
  rewardAcorns: 450,
  radioBulletin: ID,
  hoa: 'off',
  cutscene: { kind: 'script', script: 'm41-pinwheel-ridge-intro' },
  outro: { kind: 'script', script: 'm41-pinwheel-ridge-outro' },
  beats: { 1: 'm41-pinwheel-ridge-mid' },
  objectives: [
    {
      kind: 'inspect',
      text: "Cut the HOA's cable at Old Spin, the second pinwheel",
      verb: 'Cut',
      points: [CABLE_CUT],
      hint: 'Old Spin, the second pinwheel along the ridge, cable on its north side',
    },
    {
      kind: 'crack',
      text: "Crack the two HOA linemen guarding Sulks, the fifth pinwheel",
      targets: SULKS_GUARD,
    },
    {
      kind: 'crack',
      text: "Crack the two HOA linemen guarding Whirly Bob, the eighth pinwheel",
      targets: BOB_GUARD,
    },
    {
      kind: 'inspect',
      text: 'Spin Whirly Bob up by hand at its crank',
      verb: 'Spin',
      holdSeconds: 3,
      points: [CRANK],
      hint: 'Whirly Bob, the eighth pinwheel, the crank on its sunny side',
    },
  ],
  doneText: "Three pinwheels free, the HOA's cabling cut. Part one of four, power, is stopped, and Turfton's neon is brighter than it has been in years. Ragwort has named the crank after you.",
};

export const STORY: StoryFile = {
  quests: [QUEST],
  givers: {
    'ragwort-ridge': {
      id: 'ragwort-ridge',
      name: "Pinwheel Ridge (Ragwort's control hut)",
      label: 'Talk to Ragwort Coilspring',
      // The hut door: 1.5 m past the hut's face, north (windFarm.ts registerHome).
      x: WIND_FARM.hut.x,
      z: WIND_FARM.hut.z - 5,
      exit: { x: WIND_FARM.hut.x + 2.5, z: WIND_FARM.hut.z - 8, yaw: Math.PI },
      room: 'street',
      letter: 'R',
    },
  },
  comms: {
    [ID]: {
      0: brief(
        ['lugnut lulu', 'Carburettors are clear of the HOA. Now the Combine: it charges its cells up here.'],
        ['ragwort', 'HOA re-cabled three of my pinwheels to feed it. Naturally the hard ones. Free them.'],
        ['ragwort', 'Cut the cable at the second, Old Spin. I will pay four hundred fifty acorns.'],
      ),
      1: call(
        ['ragwort', 'First cable cut. Hear that? Old Spin has not turned in eleven years.'],
        ['ragwort', 'Now Sulks, the fifth. Two linemen up there. They have clipboards. Mind the clipboards.'],
      ),
      2: call(
        ['ragwort', 'Sulks is free. Two more linemen at Whirly Bob, the eighth. Go on.'],
      ),
      3: call(
        ['ragwort', 'Last one. Whirly Bob has a hand crank. Three seconds of torque, steady. Mind the mood.'],
      ),
    },
  },
  bulletins: {
    [ID]: [
      'Turfton FM reports that three pinwheels on the northern ridge are turning again. Their keeper says the wind was always willing. The HOA says it was not consulted.',
      'The ridge reports a missing length of cable, forty metres of it. Witnesses describe a gnome in a silver hard hat, and a considerable amount of paperwork.',
    ],
  },
  plans: { [ID]: { suite: 'story', expect: 'pass' } },
};
