// Story row 44 (docs/design/gnome-theft-auto/story-outline.md): The Bathtub Queen. STUB from the E21 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m44-the-bathtub-queen.ts. Stages:
// quests/stages/story/s44-the-bathtub-queen.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm44-the-bathtub-queen',
    title: "The Bathtub Queen",
    giver: 'fells-basin',
    prereq: 'm43-saltbucket-boardwalk',
    chapter: 3,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Frozen Birdbath Basin', at: [4, -332], radius: 12, hint: 'The Frozen Birdbath Basin' }],
    doneText: 'Stub row 44: replaced by the E21 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm44-the-bathtub-queen': { 0: brief(['pip', 'Stub briefing for row 44.']) },
  },
  plans: {
    'm44-the-bathtub-queen': { suite: 'story', expect: 'pass' },
  },
};
