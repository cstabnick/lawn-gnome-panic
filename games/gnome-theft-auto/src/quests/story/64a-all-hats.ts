// Story row 64 (docs/design/gnome-theft-auto/story-outline.md): All Hats (parts 1-2). STUB from the E22 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m64a-all-hats.ts. Stages:
// quests/stages/story/s64a-all-hats.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm64-all-hats-p1',
    title: "By Water",
    giver: 'dust-overlook',
    prereq: 'm63-four-taps',
    chapter: 4,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Dust Flats overlook safehouse', at: [272, 50], radius: 12, hint: 'The Dust Flats overlook' }],
    doneText: 'Stub row 64: replaced by the E22 quest writer.',
  },
  {
    id: 'm64-all-hats-p2',
    title: "By Air",
    giver: 'dust-overlook',
    prereq: 'm64-all-hats-p1',
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
    'm64-all-hats-p1': { 0: brief(['pip', 'Stub briefing for row 64.']) },
    'm64-all-hats-p2': { 0: brief(['pip', 'Stub briefing for row 64.']) },
  },
  plans: {
    'm64-all-hats-p1': { suite: 'story', expect: 'pass' },
    'm64-all-hats-p2': { suite: 'story', expect: 'pass' },
  },
};
