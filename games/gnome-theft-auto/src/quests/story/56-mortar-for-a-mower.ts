// Story row 56 (docs/design/gnome-theft-auto/story-outline.md): A Mortar for a Mower. STUB from the E22 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m56-mortar-for-a-mower.ts. Stages:
// quests/stages/story/s56-mortar-for-a-mower.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm56-mortar-for-a-mower',
    title: "A Mortar for a Mower",
    giver: 'dust-overlook',
    prereq: 'ch4-runway-flares',
    chapter: 4,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Dust Flats overlook safehouse', at: [272, 50], radius: 12, hint: 'The Dust Flats overlook' }],
    doneText: 'Stub row 56: replaced by the E22 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm56-mortar-for-a-mower': { 0: brief(['pip', 'Stub briefing for row 56.']) },
  },
  plans: {
    'm56-mortar-for-a-mower': { suite: 'story', expect: 'pass' },
  },
};
