// Story row 70 "The Even Cut", part 3 and the final (docs/design/gnome-theft-auto/story-outline.md, extended finale).
// E22 setup: the old single finale's objectives split across the parts in their old order (save migration:
// questSave.ts migrateFinaleSave): p3 The Gilded Lawn-Throne = the deck fight half of old objective 2 (boss-combine
// phase 'guards'); the final, which KEEPS THE ID ch5-even-cut (old saves record it done), = the jam half of old
// objective 2 (phase 'jam'), old objective 3 (crack Vesper) and old objective 4 (the choice, Endings A/B). Keep each
// part's objective kinds, count and order. The kept scenes even-cut-intro / even-cut-outro stay in
// cutscene/scenes/story/ch5.ts; new scenes in m70-even-cut.ts; stages in quests/stages/story/s70-even-cut.ts.
import type { GnomeLook } from '@lawn/gnome';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const VESPER_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xf4f4f8, skin: 0xfafafa, glasses: true };

const P3 = 'ch5-even-cut-p3';
const FINAL = 'ch5-even-cut';

const QUESTS: readonly QuestDef[] = [
  {
    id: P3,
    // E23 L103: a squad shoot-out; the Hat Watch may notice (1 hat) but sends no pursuits.
    hoaSteps: { 0: { cap: 1 } },
    title: 'The Gilded Lawn-Throne',
    giver: 'dust-overlook',
    prereq: 'ch5-even-cut-p2',
    chapter: 5,
    rewardAcorns: 500,
    radioBulletin: P3,
    objectives: [
      {
        kind: 'boss-combine',
        phase: 'guards',
        text: 'Fight Vesper\'s Porcelain Guard across the deck to the Gilded Lawn-Throne',
        startZ: -240,
        endZ: -120,
        hint: 'Center Meridian (x = 0)',
      },
    ],
    doneText: 'The Porcelain Guard is down. The throne\'s lamp is lit, and the intake is open.',
  },
  {
    id: FINAL,
    title: 'The Even Cut',
    giver: 'dust-overlook',
    prereq: P3,
    chapter: 5,
    rewardAcorns: 2500,
    achievement: 'gta-even-cut',
    radioBulletin: FINAL,
    cutscene: { kind: 'script', script: 'even-cut-intro' },
    outro: { kind: 'script', script: 'even-cut-outro' },
    objectives: [
      {
        kind: 'boss-combine',
        phase: 'jam',
        text: 'Jam the Grand Combine\'s intake with the Stopping Stone',
        startZ: -120,
        endZ: 60,
        hint: 'Center Meridian (x = 0)',
      },
      {
        kind: 'crack',
        text: 'Crack Vesper "The Glazier" Thorne in his Gilded Lawn-Throne',
        targets: [
          { id: 'vesper-boss', name: 'Vesper "The Glazier" Thorne', near: [0, 0], hint: 'Downtown Meridian', look: VESPER_LOOK },
        ],
      },
      {
        kind: 'choice',
        text: 'Decide the fate of the Golden Acorn at the jammed Combine',
        optionA: {
          label: 'The Unmowed Monument',
          at: [-12, 0],
          endingText: 'Ending A — The Unmowed Monument: With Elder Bracken and Councilwoman Juniper Vance, wild clover reclaims downtown\'s scar.',
        },
        optionB: {
          label: 'Turfton Rewired',
          at: [12, 0],
          endingText: 'Ending B — Turfton Rewired: With Tansy and the Carburettors, the Golden Acorn powers Turfton\'s neon grid and midnight races.',
        },
      },
    ],
    doneText: 'THE EVEN CUT — Side-Valve rebuilds with Brenda\'s lawn chairs, Diggs guards The Gnomecino, Mulch adds a 3rd red coat, Gnoma bakes Acorn-Flour Cakes. Phone buzzes — Club Gnome: "Heard you\'re good with heavy machinery. Need a guy for a bowling alley."',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    [P3]: {
      0: brief(['pip', 'You\'re on! Porcelain Guard on the deck. Get to the throne!']),
    },
    [FINAL]: {
      0: brief(['bracken', 'The intake, child. Gnorwin\'s Stone was made for it. Set it true.']),
      1: call(['tansy', 'It\'s jammed. Vesper\'s on his throne. Knock the hat off him.']),
      2: call(['juniper', 'The acorn is loose. Bracken wants a monument. Tansy wants a power grid. Your call.']),
    },
  },
  bulletins: {
    [P3]: ['Turfton FM news: a fight on the roof of the Grand Combine. Porcelain was involved. Nobody was swept up.', 'The HOA says the throne is decorative.'],
  },
  plans: {
    [P3]: { suite: 'story', expect: 'pass' },
    [FINAL]: { suite: 'story', variants: ['A', 'B'], expect: 'pass' },
  },
};
