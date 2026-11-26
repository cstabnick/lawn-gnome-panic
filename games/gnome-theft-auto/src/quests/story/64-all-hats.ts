// Story row 64 (docs/design/gnome-theft-auto/story-outline.md): All Hats (part 3 and the final, By Root). STUB from the E22 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m64-all-hats.ts. Stages:
// quests/stages/story/s64-all-hats.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm64-all-hats-p3',
    title: "By Road",
    giver: 'dust-overlook',
    prereq: 'm64-all-hats-p2',
    chapter: 4,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Dust Flats overlook safehouse', at: [272, 50], radius: 12, hint: 'The Dust Flats overlook' }],
    doneText: 'Stub row 64: replaced by the E22 quest writer.',
  },
  {
    id: 'm64-all-hats',
    title: "All Hats",
    giver: 'dust-overlook',
    prereq: 'm64-all-hats-p3',
    chapter: 4,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Dust Flats overlook safehouse', at: [272, 50], radius: 12, hint: 'The Dust Flats overlook' }],
    doneText: 'Stub row 64: replaced by the E22 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm64-all-hats-p3': { 0: brief(['pip', 'Stub briefing for row 64.']) },
    'm64-all-hats': { 0: brief(['pip', 'Stub briefing for row 64.']) },
  },
  plans: {
    'm64-all-hats-p3': { suite: 'story', expect: 'pass' },
    'm64-all-hats': { suite: 'story', expect: 'pass' },
  },
};
