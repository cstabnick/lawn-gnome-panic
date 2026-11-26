// Story row 45 (docs/design/gnome-theft-auto/story-outline.md): Rootwell Admissions. STUB from the E21 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m45-rootwell-admissions.ts. Stages:
// quests/stages/story/s45-rootwell-admissions.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm45-rootwell-admissions',
    title: "Rootwell Admissions",
    giver: 'fells-basin',
    prereq: 'm44-the-bathtub-queen',
    chapter: 3,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Frozen Birdbath Basin', at: [4, -332], radius: 12, hint: 'The Frozen Birdbath Basin' }],
    doneText: 'Stub row 45: replaced by the E21 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm45-rootwell-admissions': { 0: brief(['pip', 'Stub briefing for row 45.']) },
  },
  plans: {
    'm45-rootwell-admissions': { suite: 'story', expect: 'pass' },
  },
};
