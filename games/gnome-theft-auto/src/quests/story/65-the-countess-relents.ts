// Story row 65 (docs/design/gnome-theft-auto/story-outline.md): The Countess Relents. STUB from the E22 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m65-the-countess-relents.ts. Stages:
// quests/stages/story/s65-the-countess-relents.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm65-the-countess-relents',
    title: "The Countess Relents",
    giver: 'dust-overlook',
    prereq: 'm64-all-hats',
    chapter: 4,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Dust Flats overlook safehouse', at: [272, 50], radius: 12, hint: 'The Dust Flats overlook' }],
    doneText: 'Stub row 65: replaced by the E22 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm65-the-countess-relents': { 0: brief(['pip', 'Stub briefing for row 65.']) },
  },
  plans: {
    'm65-the-countess-relents': { suite: 'story', expect: 'pass' },
  },
};
