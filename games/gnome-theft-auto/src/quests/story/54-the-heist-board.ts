// Story row 54 (docs/design/gnome-theft-auto/story-outline.md): The Heist Board. STUB from the E22 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m54-the-heist-board.ts. Stages:
// quests/stages/story/s54-the-heist-board.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm54-the-heist-board',
    title: "The Heist Board",
    giver: 'dust-overlook',
    prereq: 'ch3-tundra-drift-run',
    chapter: 4,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Dust Flats overlook safehouse', at: [272, 50], radius: 12, hint: 'The Dust Flats overlook' }],
    doneText: 'Stub row 54: replaced by the E22 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm54-the-heist-board': { 0: brief(['pip', 'Stub briefing for row 54.']) },
  },
  plans: {
    'm54-the-heist-board': { suite: 'story', expect: 'pass' },
  },
};
