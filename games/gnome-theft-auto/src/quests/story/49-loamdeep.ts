// Story row 49 (docs/design/gnome-theft-auto/story-outline.md): Loamdeep. STUB from the E21 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m49-loamdeep.ts. Stages:
// quests/stages/story/s49-loamdeep.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm49-loamdeep',
    title: "Loamdeep",
    giver: 'fells-basin',
    prereq: 'm48-the-groundskeepers-secret',
    chapter: 3,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Frozen Birdbath Basin', at: [4, -332], radius: 12, hint: 'The Frozen Birdbath Basin' }],
    doneText: 'Stub row 49: replaced by the E21 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm49-loamdeep': { 0: brief(['pip', 'Stub briefing for row 49.']) },
  },
  plans: {
    'm49-loamdeep': { suite: 'story', expect: 'pass' },
  },
};
