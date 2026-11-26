// Story row 67 (docs/design/gnome-theft-auto/story-outline.md): Emergency Assessment. STUB from the E22 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m67-emergency-assessment.ts. Stages:
// quests/stages/story/s67-emergency-assessment.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm67-emergency-assessment',
    title: "Emergency Assessment",
    giver: 'dust-overlook',
    prereq: 'm66-porcelain-hearts',
    chapter: 4,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Dust Flats overlook safehouse', at: [272, 50], radius: 12, hint: 'The Dust Flats overlook' }],
    doneText: 'Stub row 67: replaced by the E22 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm67-emergency-assessment': { 0: brief(['pip', 'Stub briefing for row 67.']) },
  },
  plans: {
    'm67-emergency-assessment': { suite: 'story', expect: 'pass' },
  },
};
