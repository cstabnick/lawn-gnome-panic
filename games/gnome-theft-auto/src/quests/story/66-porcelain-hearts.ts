// Story row 66 (docs/design/gnome-theft-auto/story-outline.md): Porcelain Hearts. STUB from the E22 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m66-porcelain-hearts.ts. Stages:
// quests/stages/story/s66-porcelain-hearts.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm66-porcelain-hearts',
    title: "Porcelain Hearts",
    giver: 'dust-overlook',
    prereq: 'm65-the-countess-relents',
    chapter: 4,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Dust Flats overlook safehouse', at: [272, 50], radius: 12, hint: 'The Dust Flats overlook' }],
    doneText: 'Stub row 66: replaced by the E22 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm66-porcelain-hearts': { 0: brief(['pip', 'Stub briefing for row 66.']) },
  },
  plans: {
    'm66-porcelain-hearts': { suite: 'story', expect: 'pass' },
  },
};
