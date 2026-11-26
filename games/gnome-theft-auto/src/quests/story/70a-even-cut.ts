// Story row 70 "The Even Cut", parts 1-2 (docs/design/gnome-theft-auto/story-outline.md, extended finale). E22 setup:
// the old single finale's objectives are split across the parts in their old order (save migration: questSave.ts
// migrateFinaleSave): p1 Air Support = old objective 0 (the Vanguard), p2 Deck Drop = old objective 1 (the air-drop).
// Part 3 and the final (which keeps the id ch5-even-cut) are in 70-even-cut.ts. Keep each part's objective kinds,
// count and order. Scenes: cutscene/scenes/story/m70a-even-cut.ts. Stages: quests/stages/story/s70a-even-cut.ts.
import type { GnomeLook } from '@lawn/gnome';
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const HOA_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b };

const P1 = 'ch5-even-cut-p1';
const P2 = 'ch5-even-cut-p2';

const QUESTS: readonly QuestDef[] = [
  {
    id: P1,
    // E23 L103: a squad shoot-out; the Hat Watch may notice (1 hat) but sends no pursuits.
    hoaSteps: { 0: { cap: 1 } },
    title: 'Air Support',
    giver: 'dust-overlook',
    prereq: 'm69-the-combine-wakes',
    chapter: 5,
    rewardAcorns: 500,
    radioBulletin: P1,
    objectives: [
      {
        kind: 'crack',
        text: 'Clear Vesper\'s HOA Escort Vanguard along the center meridian',
        targets: [
          { id: 'vanguard-hoa-1', name: 'HOA Vanguard Lead', near: [0, -180], hint: 'Center Meridian', look: HOA_LOOK },
          { id: 'vanguard-hoa-2', name: 'HOA Vanguard West', near: [-14, -200], hint: 'Center Meridian', look: HOA_LOOK },
          { id: 'vanguard-hoa-3', name: 'HOA Vanguard East', near: [14, -200], hint: 'Center Meridian', look: HOA_LOOK },
          { id: 'vanguard-hoa-4', name: 'HOA Vanguard Rear', near: [0, -220], hint: 'Center Meridian', look: HOA_LOOK },
        ],
      },
    ],
    doneText: 'The Vanguard is down. The Combine rolls on alone, and its shadow is on the road.',
  },
  {
    id: P2,
    title: 'Deck Drop',
    giver: 'dust-overlook',
    prereq: P1,
    chapter: 5,
    rewardAcorns: 500,
    radioBulletin: P2,
    objectives: [
      {
        kind: 'air-drop',
        text: 'Fly to the center meridian and parachute onto the Grand Combine',
        planeAt: [305, 40],
        dropZone: [0, 0, -240],
        radius: 30,
        hint: 'Grand Combine Meridian (x = 0)',
      },
    ],
    doneText: 'You are on the deck. It is beige, it is moving, and it is very long.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    [P1]: {
      0: brief(
        ['tansy', 'The Grand Combine is coming down the meridian with the Golden Acorn inside.'],
        ['tansy', 'Clear his escort first. Diggs and Wally are up top.'],
        ['granny', 'Cloverfield\'s on the south canal, sugar. Diggs has the rest. Go.'],
      ),
    },
    [P2]: {
      0: brief(['pip', 'Escort\'s down! Plane\'s warm at the overlook! Over the Combine and jump!']),
    },
  },
  bulletins: {
    [P1]: ['Turfton FM news: an HOA motorcade on the meridian has been, in the words of one witness, strafed politely.', 'Drivers are asked to keep clear of anything large, beige and moving.'],
    [P2]: ['Turfton FM news: reports of a parachute landing on a moving building. The building has not commented.', 'Our traffic gnome says the meridian is closed, and also very long.'],
  },
  plans: {
    [P1]: { suite: 'story', expect: 'pass' },
    [P2]: { suite: 'story', expect: 'pass' },
  },
};
