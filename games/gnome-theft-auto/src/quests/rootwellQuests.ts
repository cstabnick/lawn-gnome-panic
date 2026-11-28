// Rootwell side quests (E13): Dean Inkwell's lost essay and Professor Sextant's rent run to the ants.
// Places come from the campus contract (campus/types.ts). Tone and names: lore apocrypha/lovage-inkwell, betony-sextant.
import { CAMPUS, CAMPUS_BUILDINGS, OBSERVATORY, ROOTWELL_QUESTS, ROOTWELL_ROOMS } from '../campus/types';
import type { QuestDef } from './types';

const DEAN = 'Dean Inkwell';
const DEAN_LOOK = { hat: 0x2a2a3a, shirt: 0x2a2a3a, beard: 0xd8d4cc };
const SEXTANT = 'Professor Sextant';
const SEXTANT_LOOK = { hat: 0x6a5a8a, shirt: 0x8a7a5a, beard: 0xb8b0a0 };

const cloche = CAMPUS_BUILDINGS.find((b) => b.id === 'cloche')!.door!;
const lodge = CAMPUS_BUILDINGS.find((b) => b.id === 'deans-lodge')!.door!;
// The ants' north door; stand 3 m out along its yaw.
const north = OBSERVATORY.antDoors[0];
const NORTH_STAND: [number, number] = [north.x + Math.sin(north.yaw) * 3, north.z + Math.cos(north.yaw) * 3];

export const ROOTWELL_QUESTS_DEFS: readonly QuestDef[] = [
  {
    id: ROOTWELL_QUESTS.lostEssay,
    title: 'The Lost Essay',
    giver: 'lovage',
    rewardAcorns: 300,
    hoa: 'off',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: DEAN, text: 'Ah. One of mine. You are late with the essay, and I will not say how late.', look: DEAN_LOOK },
        { speaker: 'You', text: 'I am not a student.' },
        { speaker: DEAN, text: "That is what the good ones say. The topic was level lines, the HOA's favourite subject.", look: DEAN_LOOK },
        { speaker: DEAN, text: 'The pages blew off my desk this morning. Three of them, in three directions.', look: DEAN_LOOK },
        { speaker: DEAN, text: 'Collect them and bring them here. I will mark them. I mark everything.', look: DEAN_LOOK },
      ],
    },
    objectives: [
      {
        kind: 'visit',
        text: 'Ask the librarian about page one',
        at: [ROOTWELL_ROOMS['uni-library'].librarian[0], ROOTWELL_ROOMS['uni-library'].librarian[1]],
        radius: 2,
        interior: 'uni-library',
        hint: 'The Long Shelf (library)',
        toastOnEnter: 'The librarian slides page one across the desk. It was handed in as a bookmark.',
      },
      {
        kind: 'visit',
        text: 'Find page two at the Cloche',
        at: [cloche.x, cloche.z],
        radius: 4,
        hint: 'The Cloche (glasshouse)',
        toastOnEnter: 'Page two was holding up a tomato. The tomato is fine. The page is damp.',
      },
      {
        kind: 'visit',
        text: 'Find page three on the Clod',
        at: [CAMPUS.pitch.x, CAMPUS.pitch.z],
        radius: 6,
        hint: "The Clod's pitch",
        toastOnEnter: 'Page three was the halfway line. Someone has been playing on it.',
      },
      {
        kind: 'visit',
        text: "Hand the essay in at the Dean's lodge",
        at: [lodge.x + 4.5, lodge.z - 3],
        radius: 4,
        hint: "The Dean's lodge",
        toastOnEnter: `${DEAN}: "All three. In order. I am almost moved."`,
      },
    ],
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: DEAN, text: 'Hm. A C-minus. Level, but not level enough.', look: DEAN_LOOK },
        { speaker: DEAN, text: 'Your fee. Do not mention the survey to anyone. I mean, there is nothing to mention.', look: DEAN_LOOK },
      ],
    },
    doneText: 'The Dean has marked your essay. He did not look at you while he did it.',
  },
  {
    id: ROOTWELL_QUESTS.anthillRent,
    title: 'Rent for the Landlords',
    giver: 'betony',
    rewardAcorns: 350,
    hoa: 'off',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: SEXTANT, text: 'The university is late with the sugar again. Eleven days.', look: SEXTANT_LOOK },
        { speaker: 'You', text: 'And the ants?' },
        { speaker: SEXTANT, text: 'Have closed their doors. They do, when the rent is late. It is only fair.', look: SEXTANT_LOOK },
        { speaker: SEXTANT, text: 'The lights below are off. I cannot work with the lights off below.', look: SEXTANT_LOOK },
        { speaker: SEXTANT, text: "The sugar is kept under the Trencher. Take a sack to the north door. Do not call them termites.", look: SEXTANT_LOOK },
      ],
    },
    objectives: [
      {
        kind: 'visit',
        text: 'Take the sugar from the store behind the Trencher',
        at: [CAMPUS.sugarStore.x, CAMPUS.sugarStore.z],
        radius: 3,
        hint: 'The sugar store, behind the Trencher',
        toastOnEnter: "You take the sack the Dean has labelled 'GRANT'. It is heavier than a grant.",
      },
      {
        kind: 'visit',
        text: "Leave the sugar at the ants' north door",
        at: NORTH_STAND,
        radius: 3,
        hint: "The ants' north door, foot of the Anthill",
        toastOnEnter: 'You leave the sugar. After a moment the door opens a crack and a single ant takes one cube in.',
      },
      {
        kind: 'visit',
        text: 'Tell Sextant at the observatory door',
        at: [OBSERVATORY.door.x, OBSERVATORY.door.z],
        radius: 4,
        hint: 'The Anthill Observatory',
        toastOnEnter: `${SEXTANT}: "The lights are on below. I can see them from here."`,
      },
    ],
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: SEXTANT, text: 'The door is open. The lights are on. That is correct.', look: SEXTANT_LOOK },
        { speaker: SEXTANT, text: 'Three hundred and fifty acorns. I counted.', look: SEXTANT_LOOK },
      ],
    },
    doneText: 'The ants are paid up. They did not say thank you, because they never say anything.',
  },
];
