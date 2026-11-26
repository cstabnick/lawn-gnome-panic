// Story row 43 (docs/design/gnome-theft-auto/story-outline.md): Saltbucket Boardwalk. STUB from the E21 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m43-saltbucket-boardwalk.ts. Stages:
// quests/stages/story/s43-saltbucket-boardwalk.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm43-saltbucket-boardwalk',
    title: "Saltbucket Boardwalk",
    giver: 'fells-basin',
    prereq: 'm42-rutbottom-impound',
    chapter: 3,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Frozen Birdbath Basin', at: [4, -332], radius: 12, hint: 'The Frozen Birdbath Basin' }],
    doneText: 'Stub row 43: replaced by the E21 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm43-saltbucket-boardwalk': { 0: brief(['pip', 'Stub briefing for row 43.']) },
  },
  plans: {
    'm43-saltbucket-boardwalk': { suite: 'story', expect: 'pass' },
  },
};
