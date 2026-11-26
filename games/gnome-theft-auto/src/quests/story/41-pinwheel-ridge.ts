// Story row 41 (docs/design/gnome-theft-auto/story-outline.md): Pinwheel Ridge. STUB from the E21 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m41-pinwheel-ridge.ts. Stages:
// quests/stages/story/s41-pinwheel-ridge.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm41-pinwheel-ridge',
    title: "Pinwheel Ridge",
    giver: 'fells-basin',
    prereq: 'm40-the-capwood-run',
    chapter: 3,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Frozen Birdbath Basin', at: [4, -332], radius: 12, hint: 'The Frozen Birdbath Basin' }],
    doneText: 'Stub row 41: replaced by the E21 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm41-pinwheel-ridge': { 0: brief(['pip', 'Stub briefing for row 41.']) },
  },
  plans: {
    'm41-pinwheel-ridge': { suite: 'story', expect: 'pass' },
  },
};
