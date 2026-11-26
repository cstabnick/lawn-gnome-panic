// Story row 47 (docs/design/gnome-theft-auto/story-outline.md): Hedgeworth Links. STUB from the E21 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m47-hedgeworth-links.ts. Stages:
// quests/stages/story/s47-hedgeworth-links.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm47-hedgeworth-links',
    title: "Hedgeworth Links",
    giver: 'fells-basin',
    prereq: 'm46-starfall-at-the-anthill',
    chapter: 3,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Frozen Birdbath Basin', at: [4, -332], radius: 12, hint: 'The Frozen Birdbath Basin' }],
    doneText: 'Stub row 47: replaced by the E21 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm47-hedgeworth-links': { 0: brief(['pip', 'Stub briefing for row 47.']) },
  },
  plans: {
    'm47-hedgeworth-links': { suite: 'story', expect: 'pass' },
  },
};
