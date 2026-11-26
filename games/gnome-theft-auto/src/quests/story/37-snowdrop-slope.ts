// Story row 37 (docs/design/gnome-theft-auto/story-outline.md): Snowdrop Slope. STUB from the E21 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m37-snowdrop-slope.ts. Stages:
// quests/stages/story/s37-snowdrop-slope.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm37-snowdrop-slope',
    title: "Snowdrop Slope",
    giver: 'fells-basin',
    prereq: 'ch3-kiln-resin-ice',
    chapter: 3,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Frozen Birdbath Basin', at: [4, -332], radius: 12, hint: 'The Frozen Birdbath Basin' }],
    doneText: 'Stub row 37: replaced by the E21 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm37-snowdrop-slope': { 0: brief(['pip', 'Stub briefing for row 37.']) },
  },
  plans: {
    'm37-snowdrop-slope': { suite: 'story', expect: 'pass' },
  },
};
