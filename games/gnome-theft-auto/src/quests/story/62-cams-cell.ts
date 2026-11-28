// Story row 62 (docs/design/gnome-theft-auto/story-outline.md): Cam's Cell. The laugh straight after row 61's quiet. Vesper cancelled
// Turncoat Cam's charter ("there was never a charter") and locked him in the HOA lockup under the Double Pot. Juniper calls the crew:
// Cam carried Vesper's paper for a year and knows the Combine's PA code and its route. The player slips in as the tunnel watch
// changes, cracks the lockup guards, reaches Cam's yard cell (Cam talks fast, apologises to his broom, gives the code and the
// route; Vesper's voice comes over the lockup speaker with one slow sentence), and chooses: free him, or leave him for the Watch.
// Both give the code. The choice is recorded on this quest (save.ending 'A' freed, 'B' left) and the lead's W19 reads it for the
// epilogue: Cam sweeping Founders' Green, or his broom alone on a bench.
// Previously: the fort is the crew's, and Cam's charter turned out to be a lie (row 35's raid, row 59's turn).
// Fallback used (E05 has no lockup interior): the "interior-visit" is a visit to the lockup's yard cell, with a scene that stays
// out of an interior. Scenes: cutscene/scenes/story/m62-cams-cell.ts. Stages: quests/stages/story/s62-cams-cell.ts.
import type { GnomeLook } from '@lawn/gnome';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const ID = 'm62-cams-cell';

/** The HOA tunnel watch: black hat, beige shirt, as everywhere else the Association's gnomes stand guard. */
const WATCH_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b };

const QUEST: QuestDef = {
  id: ID,
  title: "Cam's Cell",
  giver: 'dust-overlook',
  prereq: 'm61-diggs-medal',
  chapter: 4,
  rewardAcorns: 400,
  radioBulletin: ID,
  // The tunnel watch may notice (one hat), but the crack and the cell are the work; the choice itself is quiet.
  hoa: { cap: 1 },
  hoaSteps: { 3: 'off' },
  cutscene: { kind: 'script', script: 'cams-cell-intro' },
  objectives: [
    {
      kind: 'visit',
      text: 'Drive into the Double Pot Tunnel while the watch changes',
      at: [120, -74],
      radius: 7,
      hint: 'The Double Pot Tunnel, downtown: the tunnel under the two pots, east of City Hall',
    },
    {
      kind: 'crack',
      text: 'Crack the three HOA guards at the lockup yard',
      targets: [
        { id: 'lockup-guard-1', name: 'Lockup Guard Stile', near: [115.6, -94.4], hint: 'The lockup yard, west wall of the tunnel', look: WATCH_LOOK },
        { id: 'lockup-guard-2', name: 'Lockup Guard Hasp', near: [115.6, -101.0], hint: 'The lockup yard, west wall of the tunnel', look: WATCH_LOOK },
        { id: 'lockup-guard-3', name: 'Lockup Guard Rivet', near: [118.0, -97.6], hint: 'The lockup yard, west wall of the tunnel', look: WATCH_LOOK },
      ],
    },
    {
      kind: 'visit',
      text: "Go through the yard gate into Cam's cell",
      at: [113.2, -97.8],
      radius: 2.2,
      hint: 'The chain-link yard in front of the middle lock-up unit, west wall of the tunnel',
      scene: 'cams-cell-mid',
    },
    {
      kind: 'choice',
      text: 'Free Cam, or leave him for the Watch',
      optionA: {
        label: 'Free him',
        at: [113.4, -90.0],
        endingText: 'You take the cell key off the guards\' peg. Cam gets his broom, and Juniper gets the code.',
        outro: 'cams-cell-outro',
      },
      optionB: {
        label: 'Leave him for the Watch',
        at: [120, -106.5],
        endingText: 'You leave him in the cell. Juniper gets the code, and the Watch gets Cam.',
        outro: 'cams-cell-outro-left',
      },
    },
  ],
  doneText: "You have the Combine's PA code and its route, and Cam's charter is the last thing the Association will ever cancel for him. Juniper has put both in the crew's file.",
};

export const STORY: StoryFile = {
  quests: [QUEST],
  comms: {
    [ID]: {
      0: brief(
        ['juniper', "Previously: the fort is ours, and Cam's charter was a lie."],
        ['juniper', 'Vesper cancelled it and locked him in the Double Pot lockup, back west in town.'],
        ['juniper', "Cam knows the Combine's PA code. Fetch it. Four hundred acorns."],
      ),
      1: call(
        ['juniper', 'The tunnel watch changes on the hour. Go in while they swap.'],
        ['juniper', 'Then crack the guards at the lockup yard. Quietly, if you can.'],
      ),
      2: call(['turncoat cam', 'Is that you? Sorry. The code is in my head and my pocket.']),
      3: call(
        ['juniper', 'Free him or leave him. Either way, we have the code and the route.'],
        ['juniper', 'I will not ask which. I will notice.'],
      ),
    },
  },
  bulletins: {
    [ID]: [
      'Turfton FM: Thorne Even-Estates confirms one racing charter was cancelled today and asks that nobody ask whose. The broom is said to be taking it badly.',
      'The Association reports the Double Pot lockup is full, tidy and, as of tonight, one gnome short of the figure in the brochure.',
    ],
  },
  plans: {
    [ID]: { suite: 'story', variants: ['A', 'B'], expect: 'pass' },
  },
};
