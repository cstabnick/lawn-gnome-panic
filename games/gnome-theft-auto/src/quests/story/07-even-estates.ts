// Story row 7 (docs/design/gnome-theft-auto/story-outline.md): Even-Estates. Juniper wants to know where the median money
// goes; the player drives her to Levelright's building site at the fringe (Plot 1, E16), photographs three permits all signed
// R. Vance, cracks the night-watch (Chard Levelright flees in the mid scene) and drives her home to Kerb Row.
// Scenes: cutscene/scenes/story/m07-even-estates.ts. Stages: quests/stages/story/s07-even-estates.ts.
import { homeDoor, workOf } from '../../homes/data';
import type { QuestDef, TargetDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const ID = 'm07-even-estates';

/** Levelright's night-watch: slate vests, a baton each. */
const WATCH_LOOK = { hat: 0x2a3b4a, shirt: 0x7a8a96, beard: 0x555555 };

/** The pavement outside the site gate (Plot 1: gate gap at x -320, z -124..-116). */
const SITE_GATE: [number, number] = [-326, -120];
const CITY_HALL_STEPS: [number, number] = workOf('juniper')!.at as [number, number];

const WATCH: TargetDef[] = [
  { id: 'levelright-watch-1', name: 'Night-Watchman Plumb', near: [-298, -122], hint: 'Even-Estates, Plot 1', look: WATCH_LOOK },
  { id: 'levelright-watch-2', name: 'Night-Watchman Bevel', near: [-303, -116], hint: 'Even-Estates, Plot 1', look: WATCH_LOOK },
];

const QUEST: QuestDef = {
  id: ID,
  title: 'Even-Estates',
  giver: 'city-hall',
  prereq: 'ch1-two-coat-tail',
  chapter: 1,
  rewardAcorns: 350,
  radioBulletin: ID,
  cutscene: { kind: 'script', script: 'even-estates-intro' },
  outro: { kind: 'script', script: 'even-estates-outro' },
  objectives: [
    {
      kind: 'passenger',
      text: 'Pick Juniper up at City Hall and drive her to the Levelright site',
      who: 'juniper',
      name: 'Juniper',
      pickup: CITY_HALL_STEPS,
      dropAt: SITE_GATE,
      radius: 8,
      hint: 'City Hall steps, then the Even-Estates site on the western fringe',
      banter: [
        'Juniper: "Eleven medians, one budget. The arithmetic is not my problem."',
        'Juniper: "Reginald would take the corners slower. He would be wrong."',
        'Juniper: "Beige, ahead. You will know it by how much of it there is."',
      ],
      onBoard: 'Juniper: "You drive. I arrive."',
      onDrop: 'Juniper: "Thorne Even-Estates, Plot 1. Camera up. Quietly."',
    },
    {
      kind: 'inspect',
      text: 'Photograph the three permits on the Levelright hoarding',
      verb: 'Photograph',
      ordered: true,
      hint: 'Permits: the hoarding by the gate, the sign board, the first show-home door',
      scene: 'even-estates-mid',
      points: [
        { at: [-322, -130], label: 'Permit 1 of 3: the gate hoarding', note: 'Planning permit 14-A: "One beige house, times forty." Signed R. Vance, in ink.' },
        { at: [-322, -117], label: 'Permit 2 of 3: the site sign board', note: 'Hoarding permit: "2.4 m, beige, to the quarter-inch." Signed R. Vance.' },
        { at: [-308, -132.4], label: 'Permit 3 of 3: the first show-home', note: 'Occupancy permit: "No occupant required." Signed R. Vance. Third signature, same hand.' },
      ],
    },
    {
      kind: 'crack',
      text: "Crack Levelright's night-watch",
      targets: WATCH,
    },
    {
      kind: 'passenger',
      text: "Drive Juniper home to her terrace on Kerb Row",
      who: 'juniper',
      name: 'Juniper',
      pickup: [-324, -121],
      dropAt: homeDoor('juniper'),
      radius: 8,
      hint: "Juniper's terrace, Kerb Row",
      banter: [
        'Juniper: "Do not speak. I am counting signatures."',
        'Juniper: "Three. Three is a pattern. Three is a habit."',
      ],
      onBoard: 'Juniper: "Home. The long way, if there is a long way."',
      onDrop: 'Juniper: "Thank you. Do not tell Reginald I said that."',
    },
  ],
  doneText: 'All three permits are signed R. Vance. Juniper has gone very quiet, which is worse.',
};

export const STORY: StoryFile = {
  quests: [QUEST],
  comms: {
    [ID]: {
      0: brief(
        ['juniper', 'Previously: you caught the Mayor handing Vesper the medians. Now I want the money.'],
        ['juniper', 'Something is being built with my median money. I want to see it. Drive me.'],
        ['juniper', 'Collect me at City Hall at dusk. Three hundred fifty acorns.'],
      ),
      1: call(['juniper', 'Photograph all three permits. Gate, sign board, then the first show-home.']),
      2: call(['juniper', 'The night-watch is coming. Deal with it. Keep the camera dry.']),
      3: call(['juniper', 'Done? Good. Home, please. Kerb Row. I have a drawer to open.']),
    },
  },
  bulletins: {
    [ID]: [
      "Turfton FM: Councilwoman Juniper Vance was seen touring the western fringe after dusk with a camera and a very straight face. Levelright Construction reports \"a level evening\".",
      "Foreman Chard Levelright says the Even-Estates show-homes are \"true to the quarter-inch\", and has asked the night-watch to stop shouting at councillors.",
    ],
  },
  plans: {
    [ID]: { suite: 'story', expect: 'pass' },
  },
};
