// Story row 58 (docs/design/gnome-theft-auto/story-outline.md): The Reeve's Barn. STUB from the E22 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m58-the-reeves-barn.ts. Stages:
// quests/stages/story/s58-the-reeves-barn.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm58-the-reeves-barn',
    title: "The Reeve's Barn",
    giver: 'dust-overlook',
    prereq: 'ch4-sandpit-drop',
    chapter: 4,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Dust Flats overlook safehouse', at: [272, 50], radius: 12, hint: 'The Dust Flats overlook' }],
    doneText: 'Stub row 58: replaced by the E22 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm58-the-reeves-barn': { 0: brief(['pip', 'Stub briefing for row 58.']) },
  },
  plans: {
    'm58-the-reeves-barn': { suite: 'story', expect: 'pass' },
  },
};
