// Story row 62 (docs/design/gnome-theft-auto/story-outline.md): Cam's Cell. STUB from the E22 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m62-cams-cell.ts. Stages:
// quests/stages/story/s62-cams-cell.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm62-cams-cell',
    title: "Cam's Cell",
    giver: 'dust-overlook',
    prereq: 'm61-diggs-medal',
    chapter: 4,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Dust Flats overlook safehouse', at: [272, 50], radius: 12, hint: 'The Dust Flats overlook' }],
    doneText: 'Stub row 62: replaced by the E22 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm62-cams-cell': { 0: brief(['pip', 'Stub briefing for row 62.']) },
  },
  plans: {
    'm62-cams-cell': { suite: 'story', expect: 'pass' },
  },
};
