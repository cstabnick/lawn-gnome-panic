// Story row 2: A Roof on Credit. Moved here from homeQuests.ts (E10 built the quest; E20 directs it). The home runtime
// (home/runtime.ts) finds the quest by id and signs the flat loan when objective HOME_SIGN_STEP (2) starts, so the ids,
// the four objectives, their kinds and their order must not change.
import { SIDE_VALVE } from '../../config';
import { BANK_COUNTER, SAUCER_COURT } from '../../homes/types';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';
// The last step is inside Flat 3B: make sure the interior is defined wherever the quest list is loaded (game and sim).
import '../../interiors/showcase/flat3b';

const QUEST: QuestDef = {
  id: 'm02-roof-on-credit',
  title: 'A Roof on Credit',
  giver: 'side-valve',
  prereq: 'prologue-fresh-kiln',
  chapter: 1,
  rewardAcorns: 150,
  radioBulletin: 'm02-roof-on-credit',
  achievement: 'gta-mortgage-gnome',
  hoa: 'off',
  cutscene: { kind: 'script', script: 'roof-on-credit-intro' },
  // The stairwell scene plays as the climb starts: it is outdoors. (An outro would play with the player inside Flat 3B,
  // an off-map interior, and a world scene would drop them on the pavement with the room still open.)
  beats: { 3: 'roof-on-credit-outro' },
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
      scene: 'roof-on-credit-mid',
    },
    {
      kind: 'visit',
      text: 'Ride to Saucer Court with your new keys',
      at: [SAUCER_COURT.exit.x, SAUCER_COURT.exit.z],
      radius: 5,
      hint: 'Saucer Court',
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
  doneText: 'Your name is on the buzzer at Saucer Court. Tonight one more window is lit. (Decorate the flat: tap the Decorate spot inside, or the Home app on the Gnomlet.)',
};

export const STORY: StoryFile = {
  quests: [QUEST],
  comms: {
    'm02-roof-on-credit': {
      0: brief(
        ['pip', 'My bench is full, so you need a flat. Mabel will show you the way.'],
        ['mabel', 'Mower mud stays off my seats, dear. Follow my cab, at walking pace.'],
        ['pip', 'Sign the loan at the First Kiln Bank. The errand pays 150 Acorns.'],
      ),
      1: call(
        ['mabel', 'Counter is just there, dear. Mind the ink. The meter stays on.'],
      ),
      2: call(
        ['parsley', 'Signed, as it were. Fifteen hundred Acorns now sit beside your Kiln-Debt.'],
        ['parsley', 'The flat is at Saucer Court. Please do not run on the stairs.'],
      ),
      3: call(
        ['hyssop', 'Up one flight, door on the left, for the record? Wipe your feet?'],
      ),
    },
  },
  bulletins: {
    'm02-roof-on-credit': [
      'The First Kiln Bank reports a new borrower at Saucer Court, flat 3B. The bank describes the walls as "still the bank\'s, as it were".',
      'Mabel Kerbstone confirms a cab ran at walking pace across town this morning. Her meter was running. Nobody was in the back.',
    ],
  },
  plans: { 'm02-roof-on-credit': { suite: 'story', expect: 'pass' } },
};
