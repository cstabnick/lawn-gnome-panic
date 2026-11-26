// Story row 69 (docs/design/gnome-theft-auto/story-outline.md): The Combine Wakes. STUB from the E22 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m69-the-combine-wakes.ts. Stages:
// quests/stages/story/s69-the-combine-wakes.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm69-the-combine-wakes',
    title: "The Combine Wakes",
    giver: 'dust-overlook',
    prereq: 'm68-lights-out',
    chapter: 4,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Dust Flats overlook safehouse', at: [272, 50], radius: 12, hint: 'The Dust Flats overlook' }],
    doneText: 'Stub row 69: replaced by the E22 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm69-the-combine-wakes': { 0: brief(['pip', 'Stub briefing for row 69.']) },
  },
  plans: {
    'm69-the-combine-wakes': { suite: 'story', expect: 'pass' },
  },
};
