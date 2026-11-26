// Story row 60 (docs/design/gnome-theft-auto/story-outline.md): The Moles Dig. STUB from the E22 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m60-the-moles-dig.ts. Stages:
// quests/stages/story/s60-the-moles-dig.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm60-the-moles-dig',
    title: "The Moles Dig",
    giver: 'dust-overlook',
    prereq: 'ch4-spade-truce',
    chapter: 4,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Dust Flats overlook safehouse', at: [272, 50], radius: 12, hint: 'The Dust Flats overlook' }],
    doneText: 'Stub row 60: replaced by the E22 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm60-the-moles-dig': { 0: brief(['pip', 'Stub briefing for row 60.']) },
  },
  plans: {
    'm60-the-moles-dig': { suite: 'story', expect: 'pass' },
  },
};
