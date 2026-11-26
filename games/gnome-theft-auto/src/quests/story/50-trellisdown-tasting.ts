// Story row 50 (docs/design/gnome-theft-auto/story-outline.md): Trellisdown Tasting. STUB from the E21 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m50-trellisdown-tasting.ts. Stages:
// quests/stages/story/s50-trellisdown-tasting.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm50-trellisdown-tasting',
    title: "Trellisdown Tasting",
    giver: 'fells-basin',
    prereq: 'm49-loamdeep',
    chapter: 3,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Frozen Birdbath Basin', at: [4, -332], radius: 12, hint: 'The Frozen Birdbath Basin' }],
    doneText: 'Stub row 50: replaced by the E21 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm50-trellisdown-tasting': { 0: brief(['pip', 'Stub briefing for row 50.']) },
  },
  plans: {
    'm50-trellisdown-tasting': { suite: 'story', expect: 'pass' },
  },
};
