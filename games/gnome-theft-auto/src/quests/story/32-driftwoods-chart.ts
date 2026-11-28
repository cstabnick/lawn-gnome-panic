// Story row 32 (docs/design/gnome-theft-auto/story-outline.md): Driftwood's Chart. Driftwood unrolls his sea chart on the
// stubble beside his trailer: the canal does not end at the Puddle Sea. The player tows his raft down the Southern Drainage
// Canal in a dinghy (steady, a damage limit), Baroness Brenda proclaims a toll at Lock No. 1, and the two of them end on the
// dune line over the Saltcut (E11) at dusk, where Driftwood sees a glow over the dunes and cannot cross yet. The raft itself
// is only shown in the scenes; the tow is the dinghy's gates. Nothing is said about what lies across the Saltwater.
// Scenes: cutscene/scenes/story/m32-driftwoods-chart.ts. Stages: quests/stages/story/s32-driftwoods-chart.ts.
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const ID = 'm32-driftwoods-chart';

/** The canal at the east lock runs east-west at z 230, 10 m wide: gates alternate across it so the tow has to be steered. */
const GATES: { at: [number, number]; label: string }[] = [
  { at: [57, 230], label: "Driftwood's raft, at its mooring" },
  { at: [67, 233.4], label: 'The first bend of the tow' },
  { at: [77, 227], label: 'The mid-canal gate' },
  { at: [86, 233], label: 'The gate before the lock' },
];

const QUEST: QuestDef = {
  id: ID,
  title: "Driftwood's Chart",
  giver: 'driftwood-chart',
  prereq: 'm31-granny-cracks',
  chapter: 2,
  rewardAcorns: 300,
  radioBulletin: ID,
  // A tow and a toll: the Hat Watch has no business on the canal today.
  hoa: 'off',
  cutscene: { kind: 'script', script: 'm32-driftwoods-chart-intro' },
  outro: { kind: 'script', script: 'm32-driftwoods-chart-outro' },
  objectives: [
    {
      kind: 'checkpoints',
      text: "Tow Driftwood's raft down the canal in the dinghy, steady",
      points: GATES.map((g) => ({ at: g.at, radius: 4.6, label: g.label })),
      vehicle: { kind: 'walnut-dinghy', at: [47, 230, Math.PI / 2] },
      requireVehicle: 'walnut-dinghy',
      maxDamage: 0.3,
      hint: 'The Southern Drainage Canal',
    },
    {
      kind: 'visit',
      text: "Pay Baroness Brenda's toll at the canal lock",
      at: [94, 221],
      radius: 9,
      hint: 'Lock No. 1, the Southern Drainage Canal',
      scene: 'm32-driftwoods-chart-mid',
    },
    {
      kind: 'visit',
      text: 'Meet Driftwood on the dune line over the Saltcut',
      at: [693, 926],
      radius: 8,
      hint: 'The dune line, south of the Puddle Sea',
    },
  ],
  doneText: 'Driftwood rolls the chart up and holds it like a hat. The glow is still there. So is he, for now.',
};

export const STORY: StoryFile = {
  quests: [QUEST],
  comms: {
    [ID]: {
      0: brief(
        ['driftwood', 'Previously: you hauled my raft to the canal. The chart says the canal goes on.'],
        ['driftwood', 'Tow it down the canal in the dinghy. Steady. A scratched raft is a sunk raft.'],
        ['driftwood', 'Three hundred acorns, and my chart goes in your journal.'],
      ),
      1: call(['brenda', 'We proclaim a toll at the lock. Come and be taxed, vessel!']),
      2: call(
        ['driftwood', 'The chart ends at the dunes over the Saltcut. I will meet you there.'],
        ['driftwood', 'Do you see it yet? Keep looking south.'],
      ),
    },
  },
  givers: {
    'driftwood-chart': {
      id: 'driftwood-chart',
      name: "Driftwood's trailer",
      label: "Look at Driftwood's chart",
      x: 29.4,
      z: 464.2,
      exit: { x: 31.4, z: 466.6, yaw: -Math.PI / 2 },
      room: 'street',
      letter: '!',
    },
  },
  bulletins: {
    [ID]: [
      'Turfton FM: the Sovereign Republic of New Puddle has proclaimed a toll at Lock No. 1, payable in spark plugs. The lock-keeper reports that nothing has changed except the sign.',
      'A canal enthusiast reports a raft towed down the Southern Drainage Canal in a dead straight line at walking pace. Baroness Brenda calls it "a royal procession" and wants it taxed.',
    ],
  },
  plans: {
    [ID]: { suite: 'story', expect: 'pass' },
  },
};
