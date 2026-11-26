// Story row 63 (docs/design/gnome-theft-auto/story-outline.md): Four Taps. STUB from the E22 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m63-four-taps.ts. Stages:
// quests/stages/story/s63-four-taps.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm63-four-taps',
    title: "Four Taps",
    giver: 'dust-overlook',
    prereq: 'm62-cams-cell',
    chapter: 4,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Dust Flats overlook safehouse', at: [272, 50], radius: 12, hint: 'The Dust Flats overlook' }],
    doneText: 'Stub row 63: replaced by the E22 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm63-four-taps': { 0: brief(['pip', 'Stub briefing for row 63.']) },
  },
  plans: {
    'm63-four-taps': { suite: 'story', expect: 'pass' },
  },
};
