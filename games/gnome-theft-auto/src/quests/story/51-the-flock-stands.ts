// Story row 51 (docs/design/gnome-theft-auto/story-outline.md): The Flock Stands. STUB from the E21 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m51-the-flock-stands.ts. Stages:
// quests/stages/story/s51-the-flock-stands.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm51-the-flock-stands',
    title: "The Flock Stands",
    giver: 'fells-basin',
    prereq: 'm50-trellisdown-tasting',
    chapter: 3,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Frozen Birdbath Basin', at: [4, -332], radius: 12, hint: 'The Frozen Birdbath Basin' }],
    doneText: 'Stub row 51: replaced by the E21 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm51-the-flock-stands': { 0: brief(['pip', 'Stub briefing for row 51.']) },
  },
  plans: {
    'm51-the-flock-stands': { suite: 'story', expect: 'pass' },
  },
};
