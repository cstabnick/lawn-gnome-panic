// Story row 40 (docs/design/gnome-theft-auto/story-outline.md): The Capwood Run. STUB from the E21 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m40-the-capwood-run.ts. Stages:
// quests/stages/story/s40-the-capwood-run.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm40-the-capwood-run',
    title: "The Capwood Run",
    giver: 'fells-basin',
    prereq: 'm39-couch-surfing',
    chapter: 3,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Frozen Birdbath Basin', at: [4, -332], radius: 12, hint: 'The Frozen Birdbath Basin' }],
    doneText: 'Stub row 40: replaced by the E21 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm40-the-capwood-run': { 0: brief(['pip', 'Stub briefing for row 40.']) },
  },
  plans: {
    'm40-the-capwood-run': { suite: 'story', expect: 'pass' },
  },
};
