// Story row 48 (docs/design/gnome-theft-auto/story-outline.md): The Groundskeeper's Secret. STUB from the E21 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m48-the-groundskeepers-secret.ts. Stages:
// quests/stages/story/s48-the-groundskeepers-secret.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm48-the-groundskeepers-secret',
    title: "The Groundskeeper's Secret",
    giver: 'fells-basin',
    prereq: 'm47-hedgeworth-links',
    chapter: 3,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Frozen Birdbath Basin', at: [4, -332], radius: 12, hint: 'The Frozen Birdbath Basin' }],
    doneText: 'Stub row 48: replaced by the E21 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm48-the-groundskeepers-secret': { 0: brief(['pip', 'Stub briefing for row 48.']) },
  },
  plans: {
    'm48-the-groundskeepers-secret': { suite: 'story', expect: 'pass' },
  },
};
