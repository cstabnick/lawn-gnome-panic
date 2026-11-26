// Story row 68 (docs/design/gnome-theft-auto/story-outline.md): Lights Out in Turfton. STUB from the E22 setup: the row's writer
// replaces this whole file (keep the export name and type). Scenes: cutscene/scenes/story/m68-lights-out.ts. Stages:
// quests/stages/story/s68-lights-out.ts.
import type { QuestDef } from '../types';
import { brief, type StoryFile } from './kit';

const QUESTS: readonly QuestDef[] = [
  {
    id: 'm68-lights-out',
    title: "Lights Out in Turfton",
    giver: 'dust-overlook',
    prereq: 'm67-emergency-assessment',
    chapter: 4,
    rewardAcorns: 100,
    hoa: 'off',
    objectives: [{ kind: 'visit', text: 'Stub: go to the Dust Flats overlook safehouse', at: [272, 50], radius: 12, hint: 'The Dust Flats overlook' }],
    doneText: 'Stub row 68: replaced by the E22 quest writer.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    'm68-lights-out': { 0: brief(['pip', 'Stub briefing for row 68.']) },
  },
  plans: {
    'm68-lights-out': { suite: 'story', expect: 'pass' },
  },
};
