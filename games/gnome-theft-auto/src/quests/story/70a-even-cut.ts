// Story row 70 "The Even Cut", parts 1-2 (docs/design/gnome-theft-auto/story-outline.md, extended finale). E22 setup:
// the old single finale's objectives are split across the parts in their old order (save migration: questSave.ts
// migrateFinaleSave): p1 Air Support = old objective 0 (the Vanguard), p2 Deck Drop = old objective 1 (the air-drop).
// Part 3 and the final (which keeps the id ch5-even-cut) are in 70-even-cut.ts. Keep each part's objective kinds,
// count and order.
// Previously: the Combine woke at the Compost Heap at dawn and turned onto the meridian (row 69).
// - p1 Air Support (dawn, day): Hogweed lights the beacon on the Bobble (R-234) and every faction sees it; Diggs's copter
//   and Wally's Crop Duster keep the Vanguard's heads down while the player cracks the four of them on the meridian.
//   After, Pip takes the Countess's key (row 65) for the Combine's tail lock.
// - p2 Deck Drop (day): the key turns (left: a Brassknock turns everything to the left) and the shield grates open on
//   the deck; Betony calls with the Even Line's last mark; the player flies from the overlook and drops onto the deck.
// Scenes: cutscene/scenes/story/m70a-even-cut.ts. Stages: quests/stages/story/s70a-even-cut.ts.
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
    cutscene: { kind: 'script', script: 'even-cut-p1-intro' },
    outro: { kind: 'script', script: 'even-cut-p1-outro' },
    objectives: [
      {
        kind: 'crack',
        text: 'Crack the four HOA Vanguard walking in front of the Combine on the meridian',
        targets: [
          { id: 'vanguard-hoa-1', name: 'HOA Vanguard Lead', near: [0, -180], hint: 'Center Meridian', look: HOA_LOOK },
          { id: 'vanguard-hoa-2', name: 'HOA Vanguard West', near: [-14, -200], hint: 'Center Meridian', look: HOA_LOOK },
          { id: 'vanguard-hoa-3', name: 'HOA Vanguard East', near: [14, -200], hint: 'Center Meridian', look: HOA_LOOK },
          { id: 'vanguard-hoa-4', name: 'HOA Vanguard Rear', near: [0, -220], hint: 'Center Meridian', look: HOA_LOOK },
        ],
      },
    ],
    doneText: 'Four for four: the Vanguard is off the road. Pip has the key, and the Combine rolls on alone.',
  },
  {
    id: P2,
    title: 'Deck Drop',
    giver: 'dust-overlook',
    prereq: P1,
    chapter: 5,
    rewardAcorns: 500,
    radioBulletin: P2,
    cutscene: { kind: 'script', script: 'even-cut-p2-intro' },
    outro: { kind: 'script', script: 'even-cut-p2-outro' },
    objectives: [
      {
        kind: 'air-drop',
        text: 'Take the plane at the overlook north over the Combine, bail out and land on its deck',
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
        ['diggs', 'Nobody levels my sandbox without a permit. Air wing is up.'],
        ['tansy', 'The Combine turned onto the meridian at dawn. Its Vanguard walks in front.'],
        ['tansy', 'Take the highway west into downtown, then north. Crack all four.'],
        ['wally', 'We keep their heads down, kid. Five hundred acorns says you hurry.'],
      ),
    },
    [P2]: {
      0: brief(
        ['pip', 'Key turned! Left, the Countess says! The shield grates are open!'],
        ['wisteria', 'Six harvests paid for those grates. See they are used, dear.'],
        ['betony', 'As I was saying: jump where the Even Line puts it. The meridian, north.'],
        ['pip', "Plane's warm at the overlook. Over the deck and jump! Five hundred acorns!"],
      ),
    },
  },
  bulletins: {
    [P1]: [
      'Turfton FM news: a beacon was seen this morning on the Bobble. The HOA says it has not named that hill.',
      'An HOA escort on the meridian has been, in the words of one witness, strafed politely.',
      'Drivers are asked to keep clear of anything large, beige and moving.',
    ],
    [P2]: [
      'Turfton FM news: reports of a parachute landing on a moving building. The building has not commented.',
      'Our traffic gnome says the meridian is closed, and also very long.',
    ],
  },
  plans: {
    [P1]: { suite: 'story', expect: 'pass' },
    [P2]: { suite: 'story', expect: 'pass' },
  },
};
