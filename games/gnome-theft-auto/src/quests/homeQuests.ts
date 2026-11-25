// Home quests (E10): "A Roof on Credit" books Flat 3B at Saucer Court. The home runtime signs the loan when step 2 starts.
import { SIDE_VALVE } from '../config';
import { BANK_COUNTER, SAUCER_COURT } from '../homes/types';
import type { QuestDef } from './types';
// The last step is inside Flat 3B: make sure the interior is defined wherever the quest list is loaded (game and sim).
import '../interiors/showcase/flat3b';

const PIP = 'Pip Potsworth';
const PIP_LOOK = { hat: 0xd93636, shirt: 0x2f8a4a, beard: 0x6b5b4b };
const HYSSOP_LOOK = { hat: 0x8a8a8a, shirt: 0x6a4a7a, glasses: true };

export const HOME_QUESTS: readonly QuestDef[] = [
  {
    id: 'm02-roof-on-credit',
    title: 'A Roof on Credit',
    giver: 'side-valve',
    prereq: 'prologue-fresh-kiln',
    chapter: 1,
    rewardAcorns: 150,
    hoa: 'off',
    cutscene: {
      kind: 'dialogue',
      room: 'side-valve',
      lines: [
        { speaker: PIP, text: "That bench is my bed, my desk and my alibi. It's full.", look: PIP_LOOK },
        { speaker: PIP, text: "Mabel's cab is outside. She'll run you to the bank. Flat at Saucer Court, lovely.", look: PIP_LOOK },
        { speaker: 'You', text: 'Who pays?' },
        { speaker: PIP, text: 'The fare is on the bank. Anyway, nice weather!', look: PIP_LOOK },
      ],
    },
    objectives: [
      {
        kind: 'chase-follow',
        text: "Follow Mabel Kerbstone's cab to the First Kiln Bank",
        leaderName: 'Mabel Kerbstone',
        leaderKind: 'taxi',
        leaderLook: { hat: 0xf2c200, shirt: 0x222222, glasses: true },
        waypoints: [[SIDE_VALVE.bay.x, SIDE_VALVE.bay.z], [-150, 60], [-120, 60], [-120, 120], [60, 120], [101, 120]],
        speed: 9,
        maxDist: 75,
        hint: "Mabel's cab",
      },
      {
        kind: 'visit',
        text: 'Sign for Flat 3B with Parsley Inkpot at the First Kiln Bank counter',
        at: [BANK_COUNTER.x, BANK_COUNTER.z],
        radius: 4,
        hint: 'First Kiln Bank',
        toastOnEnter: 'Parsley Inkpot: "Sign here. And here, twice. 1,500 Acorns on your ledger, beside the Kiln-Debt. The walls remain the bank\'s."',
      },
      {
        kind: 'visit',
        text: 'Ride to Saucer Court with your new keys',
        at: [SAUCER_COURT.exit.x, SAUCER_COURT.exit.z],
        radius: 5,
        hint: 'Saucer Court',
        toastOnEnter: 'Hyssop Doormat, 3A, door open a crack: "Wipe your feet. No running. No lodgers. I am watching."',
      },
      {
        kind: 'visit',
        text: 'Go up to Flat 3B',
        at: [0, 0],
        radius: 3,
        hint: 'Flat 3B, Saucer Court',
        interior: 'flat-3b',
      },
    ],
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: 'You', text: 'Mine?' },
        { speaker: 'Hyssop Doormat', text: '(through the wall) On credit. Wipe your feet.', look: HYSSOP_LOOK },
      ],
    },
    doneText: 'Your name is on the buzzer at Saucer Court. Tonight one more window is lit. (Decorate the flat: tap the Decorate spot inside, or the Home app on the Gnomlet.)',
  },
];
